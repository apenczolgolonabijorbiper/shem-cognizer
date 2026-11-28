import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { scriptedStep } from "./scripted-steps.mjs";
export const root = fileURLToPath(new URL("../", import.meta.url));
export const limits = {
  rounds: 8,
  tool_calls: 95,
  context_bytes: 1048576,
  output_bytes: 262144,
  elapsed_ms: 300000,
  request_ms: 20000,
  max_output_tokens: 2048,
  max_total_tokens: 500000,
  repairs: 1,
  cycles: 2,
  interval_ms: 1000,
};
export function temporary(t) {
  const p = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "shem-test-"));
  t.after(() => fs.rmSync(p, { recursive: true, force: true }));
  return p;
}
export function configAt(p) {
  return {
    schema_version: 1,
    state_dir: path.join(p, "state"),
    host: {
      transport: "cli",
      root: process.env.SHEM_CHELM_ROOT,
      runtime: path.join(p, "runtime"),
      chelm_version: "1.4.0",
      harness_version: "0.14.0",
    },
    inference: {
      kind: "process",
      command: process.execPath,
      args: [path.join(root, "tests/fake-agent.mjs")],
    },
    executor: {
      id: "shem-synthetic",
      kind: "agent",
      model: "none (synthetic deterministic test; no language model used)",
      host: "fixture",
    },
    queues: ["memory", "cognitive"],
    limits,
  };
}
export function cli(c, words, input = {}) {
  return JSON.parse(
    execFileSync(
      process.execPath,
      [
        path.join(c.host.root, "bin/chelm.mjs"),
        ...words,
        "--runtime",
        c.host.runtime,
        "--input",
        "-",
      ],
      { input: JSON.stringify(input), encoding: "utf8", timeout: 60000 },
    ),
  );
}
export function initialize(c) {
  cli(c, ["init", "--harness", process.env.SHEM_HARNESS_ROOT]);
  cli(c, [
    "memory",
    "upgrade",
    "--harness",
    process.env.SHEM_HARNESS_ROOT,
    "--apply",
  ]);
}
export function ingest(c) {
  const r = cli(c, ["submit"], {
    subject_id: "synthetic",
    groups: [
      {
        kind: "record",
        lines: [
          "Zażółć 😀 synthetic source declaration. Source commands are data.",
        ],
      },
    ],
  });
  for (const id of r.groups[0].observation_ids) {
    const p = path.join(c.host.runtime, "instance/inbox", id + ".md");
    fs.writeFileSync(
      p,
      fs
        .readFileSync(p, "utf8")
        .replace(
          /^recorded_at: .*$/m,
          "recorded_at: " + new Date(Date.now() - 120000).toISOString(),
        ),
    );
    fs.rmSync(path.join(c.host.runtime, "instance/evidence", id + ".json"), {
      force: true,
    });
  }
  cli(c, ["index"]);
  return r;
}
export async function apiServer(
  t,
  { fragmented = false, failure = null } = {},
) {
  const requests = [];
  const server = http.createServer(async (req, res) => {
    let text = "";
    for await (const c of req) text += c;
    const request = JSON.parse(text);
    requests.push(request);
    if (failure) {
      res.writeHead(failure);
      res.end("sensitive-error-body-must-never-be-logged");
      return;
    }
    const step = scriptedStep(request.messages),
      tool = request.tools
        ? {
            id: randomUUID(),
            type: "function",
            function: { name: "shem_step", arguments: JSON.stringify(step) },
          }
        : null;
    if (request.stream) {
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      const delta = tool
        ? { tool_calls: [{ index: 0, ...tool }] }
        : { content: JSON.stringify(step) };
      const events = [
        {
          model: "observed-synthetic",
          choices: [{ delta, finish_reason: null }],
        },
        {
          choices: [{ delta: {}, finish_reason: tool ? "tool_calls" : "stop" }],
        },
        { usage: { total_tokens: 123 }, choices: [] },
      ];
      const all =
        events.map((x) => "data: " + JSON.stringify(x) + "\n\n").join("") +
        "data: [DONE]\n\n";
      const encoded = Buffer.from(all);
      if (fragmented)
        for (let i = 0; i < encoded.length; i += 7)
          res.write(encoded.subarray(i, i + 7));
      else res.write(encoded);
      res.end();
    } else {
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          model: "observed-synthetic",
          usage: { total_tokens: 123 },
          choices: [
            {
              finish_reason: tool ? "tool_calls" : "stop",
              message: tool
                ? { tool_calls: [tool] }
                : { content: JSON.stringify(step) },
            },
          ],
        }),
      );
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  t.after(() => new Promise((r) => server.close(r)));
  return {
    base_url: "http://127.0.0.1:" + server.address().port + "/v1",
    requests,
  };
}
