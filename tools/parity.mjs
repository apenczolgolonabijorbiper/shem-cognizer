import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { hash, requireThat } from "../src/util.mjs";
export const root = fileURLToPath(new URL("../", import.meta.url));
export function filesAt(root) {
  const result = [];
  for (const entry of [
    "src",
    "bin",
    "schemas",
    "spec",
    "fixtures",
    "tests",
    "tools",
    "examples",
    "docs",
    ".github",
  ])
    walk(entry);
  function walk(p) {
    for (const d of fs.readdirSync(path.join(root, p), {
      withFileTypes: true,
    })) {
      const file = p + "/" + d.name;
      if (file === "spec/parity.json") continue;
      if (d.isDirectory()) walk(file);
      else result.push(file);
    }
  }
  result.push(
    ".gitattributes",
    "README.md",
    "package.json",
    "package-lock.json",
    "compatibility.json",
  );
  return result.sort();
}
export function verifyParity(root) {
  const manifest = JSON.parse(
      fs.readFileSync(path.join(root, "spec/parity.json")),
    ),
    actual = filesAt(root);
  requireThat(
    JSON.stringify(Object.keys(manifest.files).sort()) ===
      JSON.stringify(actual),
    "parity_inventory_changed",
  );
  for (const p of actual)
    requireThat(
      hash(fs.readFileSync(path.join(root, p))) === manifest.files[p],
      "parity_hash_changed",
    );
  return { files: actual.length, status: "pass" };
}
export function checkChange(base) {
  let previous;
  try {
    previous = JSON.parse(
      execFileSync("git", ["show", base + ":spec/parity.json"], {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }),
    );
  } catch {
    return;
  }
  const current = JSON.parse(
      fs.readFileSync(path.join(root, "spec/parity.json")),
    ),
    changed = Object.keys(current.files).filter(
      (p) => /^(src|bin)\//.test(p) && current.files[p] !== previous.files[p],
    );
  if (!changed.length) return;
  const specification =
    current.files["spec/COGNIZER.sudo.md"] !==
    previous.files["spec/COGNIZER.sudo.md"];
  const vectors =
    current.files["fixtures/operational-cases.json"] !==
    previous.files["fixtures/operational-cases.json"];
  requireThat(
    specification && vectors,
    "source_spec_fixture_same_change_required",
  );
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    if (process.argv.includes("--record")) {
      const files = Object.fromEntries(
        filesAt(root).map((p) => [
          p,
          hash(fs.readFileSync(path.join(root, p))),
        ]),
      );
      fs.writeFileSync(
        path.join(root, "spec/parity.json"),
        JSON.stringify({ schema_version: 1, contract: 1, files }, null, 2) +
          "\n",
      );
    }
    console.log(JSON.stringify(verifyParity(root)));
    const i = process.argv.indexOf("--base");
    if (i >= 0) checkChange(process.argv[i + 1]);
  } catch {
    console.error("Source/specification/fixture parity failed");
    process.exitCode = 1;
  }
}
