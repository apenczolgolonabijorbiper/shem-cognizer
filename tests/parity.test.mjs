import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { temporary } from "./helpers.mjs";
import { root, verifyParity } from "../tools/parity.mjs";
test("source/specification/fixture inventory and hashes match", () =>
  assert.equal(verifyParity(root).status, "pass"));
test("source, spec and fixture tampering each fail closed", (t) => {
  const p = temporary(t),
    manifest = JSON.parse(fs.readFileSync(path.join(root, "spec/parity.json")));
  for (const file of [...Object.keys(manifest.files), "spec/parity.json"]) {
    const dest = path.join(p, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(root, file), dest);
  }
  for (const file of [
    "src/driver.mjs",
    "spec/COGNIZER.sudo.md",
    "fixtures/operational-cases.json",
  ]) {
    const dest = path.join(p, file),
      before = fs.readFileSync(dest);
    fs.appendFileSync(dest, "changed");
    assert.throws(() => verifyParity(p), /parity_hash_changed/);
    fs.writeFileSync(dest, before);
  }
});
