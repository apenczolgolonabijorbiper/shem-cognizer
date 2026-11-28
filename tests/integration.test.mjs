import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import {
  temporary,
  configAt,
  cli,
  initialize,
  ingest,
  apiServer,
} from "./helpers.mjs";
import { HostBinding } from "../src/host.mjs";
import { InferenceAdapter } from "../src/inference.mjs";
import { StateStore } from "../src/state.mjs";
import { scopeOf } from "../src/config.mjs";
import { Driver } from "../src/driver.mjs";
const enabled =
  !!process.env.SHEM_CHELM_ROOT && !!process.env.SHEM_HARNESS_ROOT;
for (const transport of ["cli", "stdio"])
  for (const adapter of ["process", "structured_text", "native_tools"])
    test(
      `published pair ${transport} / ${adapter}: observation and grounded cognitive receipt`,
      { skip: !enabled },
      async (t) => {
        const c = configAt(temporary(t));
        initialize(c);
        ingest(c);
        const runtime = c.host.runtime;
        if (transport === "stdio")
          c.host = {
            root: c.host.root,
            runtime,
            transport: "stdio",
            command: process.execPath,
            args: [
              path.join(c.host.root, "bin/chelm-mcp.mjs"),
              "--runtime",
              runtime,
            ],
            chelm_version: "1.4.0",
            harness_version: "0.14.0",
            env_names: [
              "PATH",
              "HOME",
              "SystemRoot",
              "USERPROFILE",
              "TEMP",
              "TMP",
            ],
          };
        let api;
        if (adapter === "native_tools") {
          api = await apiServer(t, { fragmented: true });
          c.inference = {
            kind: "openai",
            base_url: api.base_url,
            model: "requested-synthetic",
            stream: adapter === "native_tools",
            mode: adapter,
          };
        }
        const host = new HostBinding(c.host, c.limits);
        t.after(() => host.close());
        await host.connect();
        assert(host.supports("memory") && host.supports("cognitive"));
        const scope = scopeOf(c),
          store = new StateStore(c.state_dir, scope);
        store.acquire();
        t.after(() => store.release());
        const driver = new Driver({
          config: c,
          host,
          store,
          scope,
          inference: new InferenceAdapter(c.inference, c.limits),
        });
        const observed = await driver.once("memory");
        assert.equal(observed.state, "committed");
        assert.equal(observed.semantic_review, null);
        assert.equal((await driver.resume()).receipt.id, observed.receipt.id);
        const owner = {
          ...c,
          host: { root: process.env.SHEM_CHELM_ROOT, runtime },
        };
        cli(owner, ["task", "create"], {
          idempotency_key: "q1",
          text: "What does the synthetic source declare?",
        });
        const result = await driver.once("cognitive");
        assert.equal(result.state, "committed");
        assert.equal(result.receipt.task_state, "completed");
        assert.equal(
          fs
            .readFileSync(
              path.join(runtime, "instance/memory/processed.json"),
              "utf8",
            )
            .match(/"id"/g).length,
          1,
        );
        if (api) assert(api.requests.length >= 5);
      },
    );
test(
  "empty inbox question needs_input independently from observation leases",
  { skip: !enabled },
  async (t) => {
    const c = configAt(temporary(t));
    initialize(c);
    cli(c, ["task", "create"], {
      idempotency_key: "missing",
      text: "What is the unknown fact?",
    });
    const host = new HostBinding(c.host, c.limits);
    await host.connect();
    t.after(() => host.close());
    const scope = scopeOf(c),
      store = new StateStore(c.state_dir, scope);
    store.acquire();
    t.after(() => store.release());
    const d = new Driver({
      config: c,
      host,
      store,
      scope,
      inference: new InferenceAdapter(c.inference, c.limits),
    });
    const result = await d.once("cognitive");
    assert.equal(result.state, "committed");
    assert.equal(result.receipt.task_state, "needs_input");
  },
);
for (const adapter of ["process", "native_tools", "response_loss"])
  test(
    `published pair HTTP MCP / ${adapter}: scoped routing, source processing and result receipt`,
    { skip: !enabled },
    async (t) => {
      const c = configAt(temporary(t));
      initialize(c);
      ingest(c);
      const owner = structuredClone(c),
        runtime = c.host.runtime;
      const policy = {
        schema_version: 1,
        mode: "require",
        cognizer_id: "shem",
        work_kinds: ["observation", "cognitive"],
        grace_seconds: 0,
        fallback: [],
        readiness_ttl_seconds: 120,
        workers: [
          {
            binding_id: "shem-test",
            transport: "remote",
            principal: "shem-test-worker",
            cognizer_id: "shem",
          },
        ],
      };
      cli(owner, ["routing", "apply"], {
        expected_revision: 0,
        preferred_cognizer: policy,
      });
      const { pathToFileURL } = await import("node:url");
      const { startServer } = await import(
        pathToFileURL(path.join(c.host.root, "lib/remote-server.mjs"))
      );
      process.env.SHEM_TEST_TOKEN =
        "test-only-" + crypto.randomUUID() + crypto.randomUUID();
      let lostCommitResponse = false;
      const server = await startServer(
        {
          listen: "127.0.0.1",
          port: 0,
          development: true,
          public_url: "http://127.0.0.1/mcp",
          runtimes: { test: runtime },
          auth: {
            mode: "worker-tokens",
            workers: [
              {
                principal: "shem-test-worker",
                runtimes: ["test"],
                token_env: "SHEM_TEST_TOKEN",
              },
            ],
          },
        },
        {
          hooks:
            adapter === "response_loss"
              ? {
                  afterMemoryPublish() {
                    if (!lostCommitResponse) {
                      lostCommitResponse = true;
                      throw Error(
                        "Synthetic transport failure after actual host commit",
                      );
                    }
                  },
                }
              : {},
        },
      );
      t.after(() => new Promise((resolve) => server.close(resolve)));
      c.host = {
        transport: "http",
        url: "http://127.0.0.1:" + server.address().port + "/mcp/test",
        token_env: "SHEM_TEST_TOKEN",
        chelm_version: "1.4.0",
        harness_version: "0.14.0",
      };
      if (adapter !== "process") {
        const api = await apiServer(t, { fragmented: true });
        c.inference = {
          kind: "openai",
          base_url: api.base_url,
          model: "requested-test",
          stream: true,
          mode: "native_tools",
        };
      }
      const host = new HostBinding(c.host, c.limits);
      t.after(() => host.close());
      await host.connect();
      assert(host.routingReady);
      const scope = scopeOf(c),
        store = new StateStore(c.state_dir, scope);
      const driver = new Driver({
        config: c,
        host,
        scope,
        store,
        inference: new InferenceAdapter(c.inference, c.limits),
      });
      if (adapter === "response_loss") {
        await assert.rejects(driver.once("memory"), /host_/);
        assert(lostCommitResponse);
        assert.equal(store.read().phase, "submit_pending");
        const beforeRecovery = store.read();
        assert.equal((await driver.resume()).state, "committed");
        if (process.env.SHEM_EVIDENCE_DIR) {
          fs.mkdirSync(process.env.SHEM_EVIDENCE_DIR, { recursive: true });
          fs.writeFileSync(
            path.join(
              process.env.SHEM_EVIDENCE_DIR,
              "response-loss-recovery.json",
            ),
            JSON.stringify(
              {
                synthetic: true,
                no_language_model_used: true,
                before_recovery: beforeRecovery,
                after_recovery: store.read(),
              },
              null,
              2,
            ),
          );
        }
        assert.equal(
          JSON.parse(
            fs.readFileSync(
              path.join(runtime, "instance/memory/processed.json"),
            ),
          ).observations.length,
          1,
        );
      } else assert.equal((await driver.once("memory")).state, "committed");
      cli(owner, ["task", "create"], {
        idempotency_key: "remote-q",
        text: "What does the source declare?",
      });
      const result = await driver.once("cognitive");
      assert.equal(result.receipt.task_state, "completed");
    },
  );
test(
  "provider renewal requires a reviewed rebase and new staged revision",
  { skip: !enabled },
  async (t) => {
    const c = configAt(temporary(t));
    initialize(c);
    ingest(c);
    const binding = new HostBinding(c.host, c.limits);
    await binding.connect();
    t.after(() => binding.close());
    let renewals = 0,
      rebases = 0;
    const host = {
      supports: (q) => binding.supports(q),
      call: async (q, op, input, signal) => {
        const value = await binding.call(q, op, input, signal);
        if (op === "next" && value.work_id)
          value.expires_at = new Date(Date.now() + 20000).toISOString();
        if (op === "renew") renewals++;
        if (op === "rebase") rebases++;
        return value;
      },
    };
    const scope = scopeOf(c),
      store = new StateStore(c.state_dir, scope),
      d = new Driver({
        config: c,
        host,
        scope,
        store,
        inference: new InferenceAdapter(c.inference, c.limits),
      });
    const result = await d.once("memory");
    assert.equal(result.state, "committed");
    assert.equal(renewals, 1);
    assert.equal(rebases, 1);
    assert.equal(store.read().revision, 2);
  },
);
test(
  "host validation rejects a fabricated source quotation; no completion is invented",
  { skip: !enabled },
  async (t) => {
    const c = configAt(temporary(t));
    c.limits = { ...c.limits, repairs: 0 };
    initialize(c);
    ingest(c);
    const host = new HostBinding(c.host, c.limits);
    await host.connect();
    t.after(() => host.close());
    const adapter = new InferenceAdapter(c.inference, c.limits),
      inference = {
        next: async (...args) => {
          const result = await adapter.next(...args);
          const claim = result.step.files?.["changes.json"]?.operations.find(
            (x) => x.op === "add_claim",
          );
          if (claim)
            claim.record.sources[0].quote =
              "This quote was fabricated and is absent from the source.";
          return result;
        },
      };
    const scope = scopeOf(c),
      store = new StateStore(c.state_dir, scope),
      d = new Driver({ config: c, host, scope, store, inference });
    await assert.rejects(d.once("memory"), /host_/);
    assert.equal(store.read().phase, "draft");
    assert.equal(store.read().receipt, undefined);
    await d.abandon();
  },
);
