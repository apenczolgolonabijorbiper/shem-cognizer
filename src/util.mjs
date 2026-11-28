import { createHash } from "node:crypto";
export class ShemError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
export function requireThat(value, code) {
  if (!value) throw new ShemError(code);
}
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export function stable(value) {
  return JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]]),
        )
      : v,
  );
}
export const identity = (value) => hash(stable(value));
export const bytes = (value) =>
  Buffer.byteLength(typeof value === "string" ? value : JSON.stringify(value));
export function parse(text) {
  try {
    return JSON.parse(text);
  } catch {
    throw new ShemError("invalid_json");
  }
}
export function chunks(text, limit = 32768) {
  requireThat(text.isWellFormed(), "invalid_unicode");
  const result = [];
  let chunk = "",
    size = 0;
  for (const char of text) {
    const n = bytes(char);
    if (size + n > limit) {
      result.push(chunk);
      chunk = "";
      size = 0;
    }
    chunk += char;
    size += n;
  }
  if (chunk) result.push(chunk);
  return result;
}
export async function boundedJSON(response, maxBytes) {
  requireThat(response.body, "empty_response");
  const reader = response.body.getReader();
  let total = 0;
  const parts = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      requireThat(total <= maxBytes, "response_budget");
      parts.push(Buffer.from(value));
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return parse(Buffer.concat(parts).toString("utf8"));
}
export function safeError(error) {
  return error instanceof ShemError ? error.code : "operation_failed";
}
// Bound bytes while the SDK consumes MCP JSON/SSE, before materializing a response.
export async function boundedFetch(input, init, maxBytes, timeoutMs) {
  const timeout = AbortSignal.timeout(timeoutMs),
    signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  const response = await fetch(input, { ...init, redirect: "error", signal });
  if (!response.body) return response;
  const reader = response.body.getReader();
  let total = 0;
  const stream = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        total += value.length;
        requireThat(total <= maxBytes, "host_response_budget");
        controller.enqueue(value);
      } catch (error) {
        await reader.cancel().catch(() => {});
        controller.error(error);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
  return new Response(stream, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
