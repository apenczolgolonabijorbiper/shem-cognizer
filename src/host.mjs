import fs from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { processJSON } from "./process.mjs";
import { compile } from "./config.mjs";
import {
  boundedFetch,
  bytes,
  hash,
  identity,
  parse,
  requireThat,
  ShemError,
} from "./util.mjs";
const contract = JSON.parse(
  fs.readFileSync(new URL("../compatibility.json", import.meta.url)),
);
const cognitiveRemote = {
  next: "request_work",
  list: "list_work",
  status: "work_status",
  artifacts: "list_artifacts",
  artifact: "read_artifact",
  read: "cognitive_read",
  stage: "stage_output",
  validate: "validate_candidate",
  submit: "submit_candidate",
  renew: "renew_work",
  abandon: "abandon_work",
};
const envFrom = (names) =>
  Object.fromEntries(
    (names ?? [])
      .filter((k) => process.env[k] !== undefined)
      .map((k) => [k, process.env[k]]),
  );
export class HostBinding {
  constructor(config, limits) {
    this.config = config;
    this.limits = limits;
    this.validators = new Map();
  }
  async connect(signal) {
    const c = this.config;
    requireThat(
      c.chelm_version === contract.chelm.version &&
        c.harness_version === contract.harness.version,
      "unsupported_pair",
    );
    if (c.transport === "cli") {
      const checked = await this.cli("verify", null, {}, signal);
      requireThat(
        !checked.problems?.length &&
          checked.selected_harness?.manifest_sha256 ===
            contract.harness.manifest_sha256 &&
          hash(fs.readFileSync(path.join(c.root, "RELEASE.json"))) ===
            contract.chelm.manifest_sha256,
        "host_verification_failed",
      );
      for (const kind of ["memory", "cognitive", "routing"]) {
        const file = path.join(c.root, "schemas", kind + "-worker-tools.json");
        const raw = fs.readFileSync(file);
        requireThat(
          hash(raw) === contract.tool_schemas[kind],
          "tool_contract_changed",
        );
        for (const t of parse(raw.toString()))
          this.validators.set(t.name, compile(t.inputSchema));
      }
    } else {
      this.client = new Client({
        name: "shem-cognizer",
        version: "0.1.0-dev.1",
      });
      if (c.transport === "stdio")
        this.transport = new StdioClientTransport({
          command: c.command,
          args: c.args,
          env: envFrom(c.env_names),
          stderr: "ignore",
        });
      else {
        const token = process.env[c.token_env];
        requireThat(token, "host_credential_missing");
        this.transport = new StreamableHTTPClientTransport(new URL(c.url), {
          fetch: (url, init) =>
            boundedFetch(
              url,
              init,
              this.limits.context_bytes,
              this.limits.request_ms,
            ),
          requestInit: {
            headers: { Authorization: "Bearer " + token },
            redirect: "error",
          },
        });
      }
      await this.client.connect(this.transport, {
        timeout: this.limits.request_ms,
        signal,
      });
      requireThat(
        this.client.getServerVersion()?.version === c.chelm_version,
        "host_version_changed",
      );
      let cursor,
        seen = new Set();
      do {
        const page = await this.client.listTools(cursor ? { cursor } : {}, {
          timeout: this.limits.request_ms,
          signal,
        });
        requireThat(
          bytes(page) <= this.limits.context_bytes,
          "discovery_budget",
        );
        for (const t of page.tools) {
          requireThat(!this.validators.has(t.name), "duplicate_tool");
          const shapes =
            c.transport === "http"
              ? contract.remote_tool_shapes
              : contract.tool_shapes;
          if (
            shapes[t.name] &&
            (c.transport === "http" ||
              /^chelm_(memory|cognitive|routing)_/.test(t.name))
          )
            requireThat(
              identity(schemaShape(t.inputSchema)) === shapes[t.name],
              "tool_contract_changed",
            );
          this.validators.set(t.name, compile(t.inputSchema));
        }
        requireThat(this.validators.size <= 200, "discovery_budget");
        cursor = page.nextCursor;
        if (cursor) {
          requireThat(!seen.has(cursor), "pagination_stalled");
          seen.add(cursor);
        }
      } while (cursor);
    }
    let verifiedLocally = c.transport === "cli";
    if (c.transport === "stdio" && c.root && c.runtime) {
      const checked = await this.cli("verify", null, {}, signal);
      requireThat(
        checked.selected_harness?.manifest_sha256 ===
          contract.harness.manifest_sha256 &&
          hash(fs.readFileSync(path.join(c.root, "RELEASE.json"))) ===
            contract.chelm.manifest_sha256,
        "harness_identity_mismatch",
      );
      verifiedLocally = true;
    }
    let routing;
    try {
      routing = await this.call("routing", "status", {}, signal);
    } catch (error) {
      if (!verifiedLocally) throw error;
    }
    if (routing) {
      requireThat(
        routing.required_harness_manifest_sha256 ===
          contract.harness.manifest_sha256,
        "harness_identity_mismatch",
      );
      const requirements = Object.values(routing.required_contracts),
        declarations = {
          host_contracts: [
            ...new Set(requirements.map((x) => x.host_contract)),
          ],
          capabilities: [
            ...new Set(requirements.flatMap((x) => x.capabilities)),
          ],
          harness_manifest_sha256: contract.harness.manifest_sha256,
        };
      requireThat(
        declarations.host_contracts.every((x) =>
          ["memory-worker-v3", "cognitive-worker-v2"].includes(x),
        ),
        "unsupported_worker_contract",
      );
      await this.call("routing", "register", declarations, signal);
      this.routingReady = true;
    }
    requireThat(verifiedLocally || routing, "pair_preflight_unavailable");
    this.trustedIdentity =
      routing?.identity ??
      (await this.cli("routing", "status", {}, signal)).local_identity;
    requireThat(
      this.trustedIdentity?.principal,
      "principal_preflight_unavailable",
    );
    return {
      pair: { chelm: c.chelm_version, harness: c.harness_version },
      transports: c.transport,
      qualification: "candidate",
    };
  }
  name(kind, operation) {
    if (kind === "routing") return "chelm_routing_" + operation;
    return (
      "chelm_" +
      (kind === "memory"
        ? "memory_" + operation
        : this.config.transport === "http"
          ? cognitiveRemote[operation]
          : "cognitive_" + operation)
    );
  }
  supports(kind) {
    return [
      "next",
      "status",
      "artifact",
      "stage",
      "validate",
      "submit",
      "renew",
      "abandon",
      ...(kind === "memory"
        ? ["context", "source", "read", "rebase"]
        : ["read"]),
    ].every((op) => this.validators.has(this.name(kind, op)));
  }
  async cli(command, operation, input, signal) {
    const args = [
      path.join(this.config.root, "bin/chelm.mjs"),
      command,
      ...(operation ? [operation] : []),
      "--runtime",
      this.config.runtime,
      "--input",
      "-",
    ];
    return this.unwrap(
      await processJSON(process.execPath, args, input, {
        timeoutMs: this.limits.request_ms,
        maxBytes: this.limits.context_bytes,
        acceptNonzero: true,
        signal,
        env: envFrom([
          "PATH",
          "SystemRoot",
          "HOME",
          "USERPROFILE",
          "TEMP",
          "TMP",
          "NODE_EXTRA_CA_CERTS",
          "HTTPS_PROXY",
          "HTTP_PROXY",
          "NO_PROXY",
        ]),
      }),
    );
  }
  unwrap(result) {
    requireThat(result && typeof result === "object", "invalid_host_response");
    if (result.isError || result.ok === false)
      throw new ShemError(
        "host_" +
          (typeof result.error?.code === "string" &&
          /^[a-z_]{1,80}$/.test(result.error.code)
            ? result.error.code
            : "refused"),
      );
    return result;
  }
  async call(kind, operation, input = {}, signal) {
    if (operation === "next" && this.routingReady)
      await this.call("routing", "heartbeat", {}, signal);
    const name = this.name(kind, operation),
      validate = this.validators.get(name);
    requireThat(validate, "host_capability_missing");
    const args =
      operation === "next" && kind === "cognitive"
        ? { ...input, work_kind: "cognitive" }
        : input;
    requireThat(validate(args), "host_input_invalid");
    if (this.config.transport === "cli")
      return this.cli(kind + "-worker", operation, args, signal);
    let result;
    try {
      result = await this.client.callTool(
        { name, arguments: args },
        undefined,
        { timeout: this.limits.request_ms, signal },
      );
    } catch {
      throw new ShemError("host_transport_unknown");
    }
    requireThat(
      bytes(result) <= this.limits.context_bytes,
      "host_response_budget",
    );
    this.unwrap(result);
    return this.unwrap(
      result.structuredContent ??
        parse(
          (result.content ?? [])
            .filter((x) => x.type === "text")
            .map((x) => x.text)
            .join(""),
        ),
    );
  }
  async close() {
    await this.client?.close();
  }
}

function schemaShape(x) {
  if (Array.isArray(x)) return x.map(schemaShape);
  if (x && typeof x === "object")
    return Object.fromEntries(
      Object.entries(x)
        .filter(([k]) => !["$schema", "description"].includes(k))
        .map(([k, v]) => [k, schemaShape(v)]),
    );
  return x;
}
