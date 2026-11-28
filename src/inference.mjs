import fs from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { processJSON } from "./process.mjs";
import {
  boundedJSON,
  bytes,
  identity,
  parse,
  requireThat,
  ShemError,
} from "./util.mjs";
import { compile } from "./config.mjs";
export const stepSchema = JSON.parse(
  fs.readFileSync(new URL("../schemas/step.schema.json", import.meta.url)),
);
const validStep = compile(stepSchema);
export function checkStep(step) {
  requireThat(validStep(step), "invalid_inference_step");
  return step;
}
export class InferenceAdapter {
  constructor(config, limits) {
    this.config = config;
    this.limits = limits;
  }
  ready() {
    requireThat(
      !this.config.key_env || process.env[this.config.key_env],
      "inference_credential_missing",
    );
    return true;
  }
  async next(messages, requestId, signal) {
    const c = this.config;
    requireThat(
      bytes(messages) <= this.limits.context_bytes,
      "model_context_budget",
    );
    const timeout = AbortSignal.timeout(this.limits.request_ms),
      combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    if (c.kind === "process") {
      const env = Object.fromEntries(
        (c.env_names ?? [])
          .filter((k) => process.env[k] !== undefined)
          .map((k) => [k, process.env[k]]),
      );
      const input = {
        schema_version: 1,
        delegation_id: requestId,
        input_digest: identity(messages),
        deadline: new Date(Date.now() + this.limits.request_ms).toISOString(),
        limits: this.limits,
        step_schema: stepSchema,
        messages,
      };
      const result = await processJSON(c.command, c.args, input, {
        env,
        signal: combined,
        timeoutMs: this.limits.request_ms,
        maxBytes: this.limits.output_bytes,
      });
      requireThat(
        result.delegation_id === requestId &&
          result.input_digest === input.input_digest,
        "delegation_binding_mismatch",
      );
      return {
        step: checkStep(result.step),
        model: {
          requested: null,
          observed: null,
          configuration:
            "Configured delegated process; identity and usage unavailable",
          cost: null,
        },
        usage: null,
      };
    }
    const key = c.key_env ? process.env[c.key_env] : null;
    requireThat(!c.key_env || key, "inference_credential_missing");
    const body = {
      model: c.model,
      messages,
      max_tokens: this.limits.max_output_tokens,
      stream: c.stream,
    };
    if (c.mode === "native_tools") {
      body.tools = [
        {
          type: "function",
          function: {
            name: "shem_step",
            description:
              "Return exactly one bounded read, final candidate or stop decision.",
            parameters: stepSchema,
          },
        },
      ];
      body.tool_choice = { type: "function", function: { name: "shem_step" } };
      body.parallel_tool_calls = false;
    }
    if (c.stream) body.stream_options = { include_usage: true };
    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await fetch(
          c.base_url.replace(/\/$/, "") + "/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(key ? { Authorization: "Bearer " + key } : {}),
            },
            body: JSON.stringify(body),
            signal: combined,
            redirect: "error",
          },
        );
      } catch {
        throw new ShemError("inference_outcome_unknown");
      }
      if (response.status !== 429) break;
      await response.body?.cancel();
      requireThat(attempt < 2, "inference_rate_limited");
      await delay(Math.min(2000, 250 * 2 ** attempt), undefined, {
        signal: combined,
      });
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new ShemError(
        response.status === 401 || response.status === 403
          ? "inference_unauthorized"
          : "inference_http_unknown",
      );
    }
    const result = c.stream
      ? await readStream(response, this.limits.output_bytes)
      : await boundedJSON(response, this.limits.output_bytes);
    const choice = result.choices?.[0],
      message = choice?.message;
    requireThat(message && !message.refusal, "inference_refused");
    requireThat(
      !["length", "content_filter"].includes(choice.finish_reason),
      "inference_incomplete",
    );
    let step;
    if (c.mode === "native_tools") {
      const tools = message.tool_calls;
      requireThat(
        tools?.length === 1 && tools[0].function?.name === "shem_step",
        "invalid_tool_call",
      );
      step = parse(tools[0].function.arguments);
    } else {
      requireThat(typeof message.content === "string", "invalid_model_content");
      step = parse(message.content);
    }
    const usage = result.usage ?? null;
    if (usage)
      requireThat(
        Number.isSafeInteger(usage.total_tokens) && usage.total_tokens >= 0,
        "invalid_provider_usage",
      );
    return {
      step: checkStep(step),
      model: {
        requested: c.model,
        observed: typeof result.model === "string" ? result.model : null,
        configuration: JSON.stringify({
          mode: c.mode,
          stream: c.stream,
          max_tokens: body.max_tokens,
        }),
        cost: null,
      },
      usage,
    };
  }
}
export async function readStream(response, maxBytes) {
  const reader = response.body.getReader(),
    decoder = new TextDecoder("utf-8", { fatal: true });
  let buffer = "",
    total = 0,
    content = "",
    tool = null,
    model = null,
    usage = null,
    finish = null,
    doneEvent = false;
  function event(raw) {
    const data = raw
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trimStart())
      .join("\n");
    if (!data) return;
    if (data === "[DONE]") {
      doneEvent = true;
      return;
    }
    const chunk = parse(data);
    if (chunk.model) model = chunk.model;
    if (chunk.usage) usage = chunk.usage;
    const c = chunk.choices?.[0];
    if (!c) return;
    if (c.finish_reason) finish = c.finish_reason;
    if (c.delta?.refusal) throw new ShemError("inference_refused");
    content += c.delta?.content ?? "";
    for (const call of c.delta?.tool_calls ?? []) {
      requireThat(call.index === 0, "parallel_tools_forbidden");
      tool ??= { type: "function", function: { name: "", arguments: "" } };
      tool.function.name += call.function?.name ?? "";
      tool.function.arguments += call.function?.arguments ?? "";
    }
  }
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      requireThat(total <= maxBytes, "stream_budget");
      buffer = (buffer + decoder.decode(value, { stream: true })).replace(
        /\r\n/g,
        "\n",
      );
      let i;
      while ((i = buffer.indexOf("\n\n")) >= 0) {
        event(buffer.slice(0, i).replace(/\r/g, ""));
        buffer = buffer.slice(i + 2);
      }
    }
    buffer += decoder.decode();
    requireThat(
      !buffer.trim() && doneEvent && finish,
      "inference_stream_incomplete",
    );
  } finally {
    await reader.cancel().catch(() => {});
  }
  return {
    model,
    usage,
    choices: [
      {
        finish_reason: finish,
        message: { content, ...(tool ? { tool_calls: [tool] } : {}) },
      },
    ],
  };
}
