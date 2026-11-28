import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import formats from "ajv-formats";
import { requireThat, parse, identity } from "./util.mjs";
const ajv = new Ajv({ allErrors: true, strict: false });
formats(ajv);
export const schema = JSON.parse(
  fs.readFileSync(new URL("../schemas/config.schema.json", import.meta.url)),
);
export const validateConfig = ajv.compile(schema);
export function loadConfig(file) {
  const config = parse(fs.readFileSync(file, "utf8"));
  requireThat(validateConfig(config), "config_invalid");
  requireThat(
    path.isAbsolute(config.state_dir),
    "state_path_absolute_required",
  );
  if (config.host.transport === "cli")
    requireThat(
      path.isAbsolute(config.host.root) && path.isAbsolute(config.host.runtime),
      "host_paths_absolute_required",
    );
  if (config.host.transport === "http") {
    const u = new URL(config.host.url);
    requireThat(
      u.protocol === "https:" ||
        (u.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)),
      "https_required",
    );
    requireThat(
      !u.username && !u.password && !u.search && !u.hash,
      "url_credentials_forbidden",
    );
  }
  if (config.inference.kind === "openai") {
    const u = new URL(config.inference.base_url);
    requireThat(
      u.protocol === "https:" ||
        (u.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)),
      "https_required",
    );
    requireThat(
      !u.username && !u.password && !u.search && !u.hash,
      "url_credentials_forbidden",
    );
  }
  return config;
}
export function scopeOf(config) {
  return identity({
    host: config.host,
    executor: config.executor,
    inference: config.inference,
    limits: config.limits,
  });
}
export function compile(schema) {
  return ajv.compile(schema);
}
