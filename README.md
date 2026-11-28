# shem-cognizer

Optional cognizer that brings Golem14-harness to life in Chelm-host through local
or remote cognitive processing.

Shem now has a runnable **0.1.0-dev.1 implementation candidate**. It processes
provider observations and memory-backed cognitive tasks through Chelm's public
CLI, stdio MCP or authenticated HTTP MCP contracts, using a configured
OpenAI-compatible API or a bounded noninteractive agent process. Chelm owns
canonical storage, authorization, leases, validation, receipts and publication;
Harness defines cognitive/evidence semantics. Existing agents remain independent.

```sh
npm ci --ignore-scripts
node bin/shem.mjs doctor --config /absolute/private/shem.json
node bin/shem.mjs once --config /absolute/private/shem.json
node bin/shem.mjs status --config /absolute/private/shem.json
node bin/shem.mjs resume --config /absolute/private/shem.json
```

Start from [examples/local.json](examples/local.json) and the
[operator guide](docs/OPERATOR_GUIDE.md). Node >=22.12.0 is required. Remote workers
need no owner filesystem, Git, Python or installed Harness. Local owner operations
retain those upstream requirements. Keep configuration, credentials and state private.

The implemented pair is pinned to published **Chelm 1.4.0 + Harness 0.14.0**.
Latest published Harness **0.15.0** is not approved by that host release. Unknown
pairs fail closed; no upstream version check is bypassed. Native remote preflight
requires a provisioned Chelm routing identity to inspect its exact Harness digest.

This is **not a qualified release**. Deterministic tests use synthetic API/process
fixtures and actual published host receipts; they do not qualify a real model or
agent. Real-inference acceptance, separate semantic/base comparison, the latest-pair
gate and the remaining implementation/acceptance matrix still block completion of
[#1](https://github.com/apenczolgolonabijorbiper/shem-cognizer/issues/1). Config-2
observation workers, optional external MCP tools and local-session checkpointing
are not implemented. No consumer runtime is upgraded or reset.

- [Implementation and acceptance status](docs/IMPLEMENTATION_STATUS.md)
- [Architecture and contracts](docs/ARCHITECTURE.md)
- [Base workflow inventory and reuse](docs/BASE_WORKFLOW.md)
- [Selecting, switching and rollback](docs/SWITCHING_TO_SHEM.md)
- [Normative SudoLang specification](spec/COGNIZER.sudo.md)
- [Portable fault vectors](fixtures/operational-cases.json) and [porting guide](docs/PORTING.md)
- [Original programme plan](docs/IMPLEMENTATION_PLAN.md)

The base (Chelm + Harness + a configured agent) remains the initial reference.
Shem's later promotion in #16 and any subsequent base-legacy designation require
separate evidence-backed decisions. Installing this candidate changes neither.

Run `npm test` for unit tests; upstream integration cases are skipped unless both
SHEM_CHELM_ROOT and SHEM_HARNESS_ROOT identify verified published packages. Follow
the operator guide to run the full deterministic matrix. `npm run check` verifies
source/specification/fixture hashes. `node tools/package.mjs --candidate` creates
an explicitly unqualified archive/checksum; regular `npm run package` refuses while
release gates are pending. No publication workflow is enabled.
