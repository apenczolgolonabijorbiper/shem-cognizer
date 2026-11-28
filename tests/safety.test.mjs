import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { temporary, configAt, limits, apiServer } from "./helpers.mjs";
import { StateStore } from "../src/state.mjs";
import { Driver } from "../src/driver.mjs";
import { identity, chunks, hash } from "../src/util.mjs";
import { scopeOf, loadConfig } from "../src/config.mjs";
import { InferenceAdapter, checkStep, readStream } from "../src/inference.mjs";
import { processJSON } from "../src/process.mjs";
import { HostBinding } from "../src/host.mjs";
function state(c, scope, phase = "submit_pending") {
  const submission = {
    work_id: randomUUID(),
    attempt: 1,
    outputs: [],
    candidate_digest: "a".repeat(64),
    submission_id: randomUUID(),
  };
  return {
    schema_version: 1,
    scope,
    invocation_id: randomUUID(),
    phase,
    queue: "memory",
    work: { work_id: submission.work_id, attempt: 1 },
    submission,
    submission_hash: identity(submission),
    deadline: Date.now() - 1000,
    tool_calls: 0,
  };
}
test("response loss after commit: restart recovers receipt without submit or inference", async (t) => {
  const c = configAt(temporary(t)),
    scope = scopeOf(c),
    store = new StateStore(c.state_dir, scope);
  const s = state(c, scope);
  store.save(s);
  let calls = [];
  const d = new Driver({
    config: c,
    scope,
    store,
    host: {
      call: async (k, op) => {
        calls.push(op);
        assert.equal(op, "status");
        return {
          status: "committed",
          receipt: { status: "committed", id: "actual-host-receipt" },
        };
      },
    },
    inference: {
      next() {
        assert.fail("inference replay");
      },
    },
  });
  const r = await d.resume();
  assert.equal(r.state, "committed");
  assert.equal(r.receipt.id, "actual-host-receipt");
  assert.deepEqual(calls, ["status"]);
});
test("unknown publication retries identical frozen identity, even after local deadline", async (t) => {
  const c = configAt(temporary(t)),
    scope = scopeOf(c),
    store = new StateStore(c.state_dir, scope);
  const s = state(c, scope);
  store.save(s);
  let calls = 0;
  const d = new Driver({
    config: c,
    scope,
    store,
    host: {
      call: async (k, op, input) => {
        calls++;
        if (op === "status") return { status: "assigned" };
        assert.equal(op, "submit");
        assert.deepEqual(input, s.submission);
        return { status: "committed" };
      },
    },
  });
  assert.equal((await d.resume()).state, "committed");
  assert.equal(calls, 2);
});
test("changed submission and unknown inference cannot silently replay", async (t) => {
  const c = configAt(temporary(t)),
    scope = scopeOf(c),
    store = new StateStore(c.state_dir, scope),
    s = state(c, scope);
  s.submission.submission_id = "changed";
  store.save(s);
  const d = new Driver({
    config: c,
    scope,
    store,
    host: {
      call() {
        assert.fail("host called");
      },
    },
  });
  await assert.rejects(d.resume(), /submission_changed/);
  s.phase = "inference_pending";
  store.save(s);
  await assert.rejects(d.resume(), /inference_outcome_unknown/);
});
test("private state locks competing writers and refuses a different endpoint scope", (t) => {
  const p = temporary(t),
    a = new StateStore(p, "a"),
    b = new StateStore(p, "a");
  a.acquire();
  assert.throws(() => b.acquire(), /state_locked/);
  a.save({ scope: "a" });
  assert.throws(() => new StateStore(p, "b").read(), /state_scope_mismatch/);
  a.release();
  b.acquire();
  b.release();
  if (process.platform !== "win32")
    assert.equal(
      fs.statSync(path.join(p, "invocation.json")).mode & 0o777,
      0o600,
    );
});
test("UTF-8 uploads preserve every scalar and exact byte offsets", () => {
  const original = "Zażółć 😀 漢字\r\n".repeat(10000),
    parts = chunks(original, 32768);
  assert.equal(parts.join(""), original);
  assert(parts.every((p) => Buffer.byteLength(p) <= 32768 && p.isWellFormed()));
  assert.equal(hash(parts.join("")), hash(original));
  assert.throws(() => chunks("\ud800"), /invalid_unicode/);
});
test("config rejects secrets in URLs, unknown keys and unqualified pairs", (t) => {
  const p = temporary(t),
    file = path.join(p, "config.json"),
    c = configAt(p);
  c.host.root = "/vendor";
  c.host.runtime = "/runtime";
  fs.writeFileSync(file, JSON.stringify(c));
  assert(loadConfig(file));
  c.inference = {
    kind: "openai",
    base_url: "https://name:secret@example.com/v1",
    model: "x",
    stream: false,
    mode: "structured_text",
  };
  fs.writeFileSync(file, JSON.stringify(c));
  assert.throws(() => loadConfig(file), /url_credentials_forbidden/);
  c.host.harness_version = "0.15.0";
  fs.writeFileSync(file, JSON.stringify(c));
  assert.throws(() => loadConfig(file), /config_invalid/);
});
test("typed inference decisions reject action tools, malformed arguments and extra fields", () => {
  assert.throws(
    () => checkStep({ type: "read", operation: "submit", input: {} }),
    /invalid_inference_step/,
  );
  assert.throws(
    () => checkStep({ type: "stop", reason: "budget", secret: "x" }),
    /invalid_inference_step/,
  );
});
test("HTTP errors never disclose provider bodies or credentials", async (t) => {
  const api = await apiServer(t, { failure: 401 }),
    adapter = new InferenceAdapter(
      {
        kind: "openai",
        base_url: api.base_url,
        model: "m",
        stream: false,
        mode: "structured_text",
      },
      limits,
    );
  await assert.rejects(
    adapter.next([{ role: "user", content: "{}" }], "id"),
    (e) => e.message === "inference_unauthorized",
  );
});
test("stream fragments, CRLF boundaries and Unicode are parsed; missing DONE is unknown", async () => {
  const data =
    [
      "data: " +
        JSON.stringify({
          model: "actual",
          choices: [
            { delta: { content: '{"type":"stop","reason":"budget"}' } },
          ],
        }),
      "data: " +
        JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] }),
      "data: [DONE]",
    ].join("\r\n\r\n") + "\r\n\r\n";
  function response(text) {
    const b = Buffer.from(text);
    return new Response(
      new ReadableStream({
        start(controller) {
          for (let i = 0; i < b.length; i++)
            controller.enqueue(b.subarray(i, i + 1));
          controller.close();
        },
      }),
    );
  }
  const result = await readStream(response(data), 10000);
  assert.equal(result.model, "actual");
  await assert.rejects(
    readStream(response(data.replace("data: [DONE]\r\n\r\n", "")), 10000),
    /inference_stream_incomplete/,
  );
});
test("shell-free delegated process is bounded and cancellation is explicit", async () => {
  await assert.rejects(
    processJSON(
      process.execPath,
      ["-e", "setInterval(()=>{},1000)"],
      {},
      { timeoutMs: 50 },
    ),
    /process_timeout/,
  );
  await assert.rejects(
    processJSON(
      process.execPath,
      ["-e", 'process.stdout.write("x".repeat(10000))'],
      {},
      { maxBytes: 100 },
    ),
    /process_output_budget/,
  );
});
test("unapproved pair refuses connection before claims", async () => {
  const host = new HostBinding(
    { transport: "http", chelm_version: "1.4.0", harness_version: "0.15.0" },
    limits,
  );
  await assert.rejects(host.connect(), /unsupported_pair/);
});
test("stopped work cannot be archived into a new claim", async (t) => {
  const c = configAt(temporary(t)),
    scope = scopeOf(c),
    store = new StateStore(c.state_dir, scope),
    s = state(c, scope, "stopped");
  store.save(s);
  const d = new Driver({
    config: c,
    scope,
    store,
    host: {
      supports() {
        assert.fail("new claim");
      },
    },
  });
  await assert.rejects(d.once("memory"), /recovery_required/);
});
test("persisted read recovery uses the original read identity before inference", async (t) => {
  const c = configAt(temporary(t)),
    scope = scopeOf(c),
    store = new StateStore(c.state_dir, scope),
    s = state(c, scope, "read_pending");
  s.deadline = Date.now() + 10000;
  s.pending_read = {
    operation: "read",
    input: { request_id: "frozen-read", operation: "receipt" },
  };
  s.messages = [];
  s.rounds = c.limits.rounds;
  store.save(s);
  let readCalls = 0;
  const d = new Driver({
    config: c,
    scope,
    store,
    host: {
      call: async (k, op, input) => {
        assert.equal(input.request_id, "frozen-read");
        readCalls++;
        return { coverage: {} };
      },
    },
    inference: {
      next() {
        assert.fail("inference should stop at original budget");
      },
    },
  });
  await assert.rejects(d.resume(), /round_budget/);
  assert.equal(readCalls, 1);
  assert.equal(store.read().phase, "reasoning");
});
test("result bindings and action authority cannot be overridden by a read decision", async (t) => {
  const c = configAt(temporary(t)),
    scope = scopeOf(c),
    store = new StateStore(c.state_dir, scope),
    s = state(c, scope, "reasoning");
  s.deadline = Date.now() + 100000;
  s.work.expires_at = new Date(Date.now() + 100000).toISOString();
  s.rounds = 0;
  s.total_tokens = 0;
  s.messages = [];
  store.save(s);
  const d = new Driver({
    config: c,
    scope,
    store,
    host: {
      call() {
        assert.fail("cross-assignment call");
      },
    },
    inference: {
      next: async () => ({
        step: {
          type: "read",
          operation: "context",
          input: { work_id: "another-owner" },
        },
      }),
    },
  });
  await assert.rejects(d.resume(), /binding_override_forbidden/);
});
test("a rotated token resolving to another principal cannot recover or claim under old identity", async (t) => {
  const c = configAt(temporary(t)),
    scope = scopeOf(c),
    store = new StateStore(c.state_dir, scope),
    s = state(c, scope, "claim_pending");
  s.host_identity = identity({ principal: "original" });
  store.save(s);
  const d = new Driver({
    config: c,
    scope,
    store,
    host: {
      trustedIdentity: { principal: "different" },
      call() {
        assert.fail("new-principal claim");
      },
    },
  });
  await assert.rejects(d.resume(), /principal_changed/);
});
