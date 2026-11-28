import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireThat, parse } from "./util.mjs";
import { compile } from "./config.mjs";
const valid = compile(
  JSON.parse(
    fs.readFileSync(
      new URL("../schemas/invocation.schema.json", import.meta.url),
    ),
  ),
);
export class StateStore {
  constructor(root, scope) {
    this.root = root;
    this.scope = scope;
    fs.mkdirSync(root, { recursive: true, mode: 0o700 });
    this.file = path.join(root, "invocation.json");
    this.lock = path.join(root, "writer.lock");
  }
  acquire() {
    try {
      this.fd = fs.openSync(this.lock, "wx", 0o600);
      fs.writeFileSync(
        this.fd,
        JSON.stringify({ pid: process.pid, scope: this.scope }),
      );
      fs.fsyncSync(this.fd);
    } catch {
      requireThat(false, "state_locked");
    }
  }
  release() {
    if (this.fd !== undefined) {
      fs.closeSync(this.fd);
      fs.rmSync(this.lock, { force: true });
      this.fd = undefined;
    }
  }
  read() {
    if (!fs.existsSync(this.file)) return null;
    const state = parse(fs.readFileSync(this.file, "utf8"));
    requireThat(state.scope === this.scope, "state_scope_mismatch");
    requireThat(valid(state), "state_invalid");
    return state;
  }
  save(state) {
    requireThat(state.scope === this.scope, "state_scope_mismatch");
    const temp = this.file + "." + randomUUID() + ".tmp";
    const fd = fs.openSync(temp, "wx", 0o600);
    try {
      fs.writeFileSync(fd, JSON.stringify(state));
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(temp, this.file);
    if (process.platform !== "win32") {
      const directory = fs.openSync(this.root, "r");
      try {
        fs.fsyncSync(directory);
      } finally {
        fs.closeSync(directory);
      }
    }
  }
  archive(state) {
    requireThat(
      fs.readdirSync(this.root).filter((p) => /^[a-f0-9-]{36}\.json$/.test(p))
        .length < 100,
      "retention_budget",
    );
    const destination = path.join(this.root, state.invocation_id + ".json");
    requireThat(!fs.existsSync(destination), "archive_exists");
    fs.renameSync(this.file, destination);
  }
}
