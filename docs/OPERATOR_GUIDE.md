# Operate the implementation candidate

Use Node >=22.12.0 and `npm ci --ignore-scripts`. A native HTTP worker needs Node
and the locked dependencies only. The owner host separately needs its published
Harness, Python and Git. Keep vendor packages read-only and put Shem configuration
and operational state outside vendor directories and IIS public roots.

Copy examples/local.json to a private operator path and replace every placeholder.
Select exactly the verified Chelm 1.4.0 / Harness 0.14.0 pair; use Chelm's documented
package preparation and runtime upgrade procedures separately. Shem neither
initializes/upgrades a runtime nor selects a provider. Observation processing in
this candidate requires an already selected config-3 provider.

Configure your actual gateway's compatible chat-completions base URL and model.
For example a corporate `/api/mli/v1` prefix is retained; Shem appends only
`/chat/completions`. `structured_text` explicitly requests the typed JSON protocol
without native functions; `native_tools` requires compatible function-call support.
Neither mode implies that an arbitrary gateway/model implements the needed API.
Set only the referenced environment variable for authentication. Optional key_env
may be omitted for an explicitly anonymous endpoint.

```sh
node bin/shem.mjs doctor --config /private/shem.json
node bin/shem.mjs once --config /private/shem.json
node bin/shem.mjs status --config /private/shem.json
node bin/shem.mjs resume --config /private/shem.json
node bin/shem.mjs renew --config /private/shem.json
node bin/shem.mjs abandon --config /private/shem.json
node bin/shem.mjs loop --config /private/shem.json
```

`doctor` checks the host pair/capabilities and referenced model credential, without
claiming work or invoking inference. MCP routing registration/heartbeat is a real
readiness mutation for an already administrator-provisioned identity. It cannot
create that identity, change policy or prove semantic quality. `once` starts with
the first configured queue. `loop` alternates queues for at most limits.cycles and
honors no-work delays. Scheduling belongs in your service supervisor; stopping a
process does not imply an owned host assignment has been abandoned.

Use `status` after interruption. `resume` reconciles a frozen submission before
any further inference; a recovered committed receipt is terminal even after the
local deadline. Do not change config/model/endpoint/scope to recover old work.
Unknown inference/delegation stays blocked: inspect provider/agent state and costs,
then abandon the host assignment if safe. This candidate has no automatic inference
replay override. A stopped invocation retains its lease until explicitly abandoned. Nonempty host
validation warnings stop publication for operator review; there is no automatic
warning-approval override in this candidate.

Each state directory allows one writer. After a crash, writer.lock may remain.
Verify the original process and its children have exited before removing that
single stale lock file and running resume. Do not remove it while another process
is active. State requires a supported local filesystem, not a network share.
Windows ACLs, filesystem crash guarantees and backups are operator responsibilities.
Snapshots/reports are private and may contain source data; logs contain concise
reports only. At 100 retained invocation archives, new claims stop until the
operator securely archives completed evidence. Never discard unresolved state.

For stdio, replace only host with this shape (absolute paths are operator values):

```json
{
  "transport":"stdio",
  "command":"/absolute/path/to/node",
  "args":["/vendor/chelm-host/bin/chelm-mcp.mjs","--runtime","/private/runtime"],
  "root":"/vendor/chelm-host",
  "runtime":"/private/runtime",
  "chelm_version":"1.4.0",
  "harness_version":"0.14.0",
  "env_names":["PATH","HOME","SystemRoot","USERPROFILE","TEMP","TMP"]
}
```

For native remote HTTP, configure the host's existing worker token or existing
OAuth bearer token in a referenced environment variable. No owner paths are used:

```json
{
  "transport":"http",
  "url":"https://your-host.example/mcp/your-runtime",
  "token_env":"SHEM_HOST_TOKEN",
  "chelm_version":"1.4.0",
  "harness_version":"0.14.0"
}
```

Remote preflight requires the operator's provisioned routing-worker binding in
Chelm routing v1. Its status exposes the selected Harness manifest before any
claim; Shem verifies it and registers declared memory/cognitive contracts. A remote
connection without that binding fails before claims. This is an explicit candidate
restriction: plain routing-disabled remote operation lacks the required manifest
preflight. Local CLI or stdio with root/runtime verifies packages locally. Shem
cannot claim latest-pair readiness merely from an HTTP version label.

For a configured noninteractive agent, replace only inference:

```json
{
  "kind":"process",
  "command":"/absolute/path/to/your-agent-adapter",
  "args":["--your-documented-noninteractive-mode"],
  "env_names":["YOUR_AGENT_KEY"]
}
```

That executable must implement the request/result protocol in spec/COGNIZER.sudo.md;
it is not a claim that a particular commercial CLI accepts these flags or payloads.
The result echoes delegation_id/input_digest and returns a typed step. No generic
Work/Cursor launch API or subscription reuse is provided. Independent agents may
instead use the base workflow and connect to Chelm directly.

On Windows use actual absolute Windows paths with JSON-escaped backslashes and
`node.exe` as the explicit executable. Run the colocated CLI outside IIS requests,
under a dedicated service identity with read access to packages and restricted
write access to its private state/runtime. Develop with IIS Express under the
interactive identity; full IIS on Windows Server 2022 requires appropriate app
pool/service ACLs and host verification. Shem need not run inside the app pool.
This guide is not an observed deployment on your machines. Use normal trusted
certificate configuration such as NODE_EXTRA_CA_CERTS and environment proxy support
provided by the selected Node runtime; never disable TLS verification. Env names
needed by child processes must be explicitly allowed. Do not put credentials in args.

For deterministic acceptance on disposable runtimes:

```sh
python3 tools/prepare-upstream.py --destination /tmp/shem-upstreams
cd /tmp/shem-upstreams/chelm-host
npm ci --ignore-scripts
cd /path/to/shem-cognizer
SHEM_CHELM_ROOT=/tmp/shem-upstreams/chelm-host SHEM_HARNESS_ROOT=/tmp/shem-upstreams/golem-harness npm test
npm run check
node tools/package.mjs --candidate
```

The scripted agent and fake model endpoints used by tests are test-only. Keep real
API, agent and semantic acceptance separate, retain exact synthetic inputs/outputs,
and do not introduce synthetic facts into an existing consumer runtime.
