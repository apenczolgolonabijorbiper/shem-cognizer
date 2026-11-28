#!/usr/bin/env node
import { setTimeout as delay } from "node:timers/promises";
import { loadConfig, scopeOf } from "../src/config.mjs";
import { StateStore } from "../src/state.mjs";
import { HostBinding } from "../src/host.mjs";
import { InferenceAdapter } from "../src/inference.mjs";
import { Driver, isTerminal } from "../src/driver.mjs";
import { requireThat, safeError, ShemError } from "../src/util.mjs";
const [command, flag, file, ...extra] = process.argv.slice(2);
let host, store;
try {
  requireThat(
    flag === "--config" &&
      file &&
      !extra.length &&
      [
        "doctor",
        "once",
        "loop",
        "status",
        "resume",
        "renew",
        "abandon",
      ].includes(command),
    "usage_shem_COMMAND_--config_FILE",
  );
  const config = loadConfig(file),
    scope = scopeOf(config);
  store = new StateStore(config.state_dir, scope);
  if (command === "status") {
    const state = store.read();
    console.log(
      JSON.stringify({
        state: state?.phase ?? "idle",
        invocation_id: state?.invocation_id ?? null,
        work_id: state?.work?.work_id ?? null,
        receipt: state?.receipt ?? null,
        semantic_review: null,
        reference: "base",
        qualification: "candidate",
      }),
    );
  } else {
    store.acquire();
    if (!["abandon", "renew"].includes(command))
      new InferenceAdapter(config.inference, config.limits).ready();
    host = new HostBinding(config.host, config.limits);
    const controller = new AbortController();
    for (const sig of ["SIGINT", "SIGTERM"])
      process.once(sig, () => controller.abort());
    const ready = await host.connect(controller.signal);
    for (const queue of config.queues)
      requireThat(host.supports(queue), "host_capability_missing");
    if (command === "doctor")
      console.log(
        JSON.stringify({
          ...ready,
          queues: config.queues,
          inference: config.inference.kind,
          reference: "base",
          credential_ready:
            !config.inference.key_env ||
            !!process.env[config.inference.key_env],
        }),
      );
    else {
      const driver = new Driver({
        config,
        host,
        inference: new InferenceAdapter(config.inference, config.limits),
        store,
        scope,
      });
      if (["resume", "renew", "abandon"].includes(command))
        console.log(JSON.stringify(await driver[command](controller.signal)));
      else
        for (
          let i = 0;
          i < (command === "loop" ? config.limits.cycles : 1);
          i++
        ) {
          const state = store.read();
          if (state && !isTerminal(state.phase))
            throw new ShemError("recovery_required");
          const result = await driver.once(
            config.queues[i % config.queues.length],
            controller.signal,
          );
          console.log(JSON.stringify(result));
          if (!isTerminal(result.state)) break;
          if (command === "loop" && i + 1 < config.limits.cycles)
            await delay(
              Math.max(
                config.limits.interval_ms,
                result.state === "no-work"
                  ? (driver.state.retry_after_seconds ?? 30) * 1000
                  : 0,
              ),
              undefined,
              { signal: controller.signal },
            );
        }
    }
  }
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: safeError(error) }));
  process.exitCode = 1;
} finally {
  await host?.close().catch(() => {});
  store?.release();
}
