import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import { root, verifyParity } from "./parity.mjs";
import { hash, requireThat } from "../src/util.mjs";
try {
  verifyParity(root);
  const candidate = process.argv.includes("--candidate"),
    pins = JSON.parse(fs.readFileSync(path.join(root, "compatibility.json")));
  if (!candidate)
    requireThat(
      Object.values(pins.release_gates).every((x) => x === true),
      "release_gates_pending",
    );
  execFileSync(
    process.execPath,
    [
      "--test",
      ...fs
        .readdirSync(path.join(root, "tests"))
        .filter((p) => p.endsWith(".test.mjs"))
        .map((p) => "tests/" + p),
    ],
    { cwd: root, stdio: "inherit", env: process.env },
  );
  if (!candidate)
    requireThat(
      process.env.SHEM_CHELM_ROOT && process.env.SHEM_HARNESS_ROOT,
      "integration_evidence_required",
    );
  const manifest = JSON.parse(
      fs.readFileSync(path.join(root, "spec/parity.json")),
    ),
    files = [...Object.keys(manifest.files), "spec/parity.json", ".gitignore"];
  const version = JSON.parse(
      fs.readFileSync(path.join(root, "package.json")),
    ).version,
    name =
      "shem-cognizer-" + version + (candidate ? "-unqualified-candidate" : "");
  const tar = [];
  for (const file of files) {
    const data = fs.readFileSync(path.join(root, file)),
      label = "shem-cognizer/" + file;
    requireThat(Buffer.byteLength(label) <= 100, "tar_path_budget");
    const header = Buffer.alloc(512);
    header.write(label, 0, 100);
    header.write(
      (file.startsWith("bin/") ? "0000755" : "0000644") + "\0",
      100,
      8,
    );
    header.write("0000000\0", 108, 8);
    header.write("0000000\0", 116, 8);
    header.write(data.length.toString(8).padStart(11, "0") + "\0", 124, 12);
    header.write("00000000000\0", 136, 12);
    header.fill(32, 148, 156);
    header.write("0", 156);
    header.write("ustar\0", 257);
    header.write("00", 263);
    const sum = header.reduce((a, b) => a + b, 0);
    header.write(sum.toString(8).padStart(6, "0") + "\0 ", 148, 8);
    tar.push(header, data, Buffer.alloc((512 - (data.length % 512)) % 512));
  }
  tar.push(Buffer.alloc(1024));
  const archive = gzipSync(Buffer.concat(tar)),
    dist = path.join(root, "dist");
  fs.mkdirSync(dist, { recursive: true });
  const output = path.join(dist, name + ".tar.gz");
  fs.writeFileSync(output, archive);
  fs.writeFileSync(
    output + ".sha256",
    hash(archive) + "  " + path.basename(output) + "\n",
  );
  console.log(
    JSON.stringify({
      artifact: output,
      sha256: hash(archive),
      qualified: !candidate,
    }),
  );
} catch (error) {
  console.error(error.code ?? "packaging_failed");
  process.exitCode = 1;
}
