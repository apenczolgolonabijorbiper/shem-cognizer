import { spawn } from "node:child_process";
import { ShemError, requireThat } from "./util.mjs";
// Each process is owned by this invocation. Never invoke a shell or interpolate arguments.
export async function processJSON(
  command,
  args,
  input,
  {
    timeoutMs = 30000,
    maxBytes = 1048576,
    signal,
    env = {},
    acceptNonzero = false,
  } = {},
) {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: false,
      detached: process.platform !== "win32",
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        PATH: process.env.PATH,
        SystemRoot: process.env.SystemRoot,
        ...env,
      },
    });
    let output = [],
      size = 0,
      error = null,
      closing = false,
      cleanup = Promise.resolve();
    function kill(code) {
      if (closing) return;
      closing = true;
      error = new ShemError(code);
      if (process.platform === "win32") {
        cleanup = new Promise((resolveCleanup) => {
          const killer = spawn(
            "taskkill",
            ["/PID", String(child.pid), "/T", "/F"],
            { shell: false, stdio: "ignore" },
          );
          killer.once("error", () => child.kill());
          killer.once("close", resolveCleanup);
        });
      } else
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {
          child.kill("SIGKILL");
        }
    }
    const abort = () => kill("cancelled"),
      timer = setTimeout(() => kill("process_timeout"), timeoutMs);
    signal?.addEventListener("abort", abort, { once: true });
    child.stdout.on("data", (data) => {
      size += data.length;
      if (size > maxBytes) kill("process_output_budget");
      else output.push(data);
    });
    child.stderr.on("data", () => {});
    child.stdin.on("error", () => {});
    child.on("error", () => {
      error = new ShemError("process_unavailable");
    });
    child.once("close", async (code) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      await cleanup;
      if (error) return reject(error);
      try {
        requireThat(code === 0 || acceptNonzero, "process_failed");
        resolve(JSON.parse(Buffer.concat(output).toString("utf8")));
      } catch {
        reject(
          new ShemError(code === 0 ? "invalid_process_json" : "process_failed"),
        );
      }
    });
    child.stdin.end(JSON.stringify(input));
  });
}
