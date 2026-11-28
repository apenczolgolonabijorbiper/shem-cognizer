# Current candidate switching procedure

The runnable candidate is documented in [OPERATOR_GUIDE.md](OPERATOR_GUIDE.md).
Use the exact pinned pair and run `doctor --config FILE` first. This is a concrete
recovery procedure, not certification of the full switch matrix in #17.

1. Stop new claims from all affected base/Shem processes on both queues, preserving
   application intake. Inspect host lists/status for every affected authenticated
   identity; one Shem state directory is not a global host-work inventory.
2. Run `shem status --config FILE` and `shem resume --config FILE` for each old Shem
   invocation. Unknown submissions require status/receipt reconciliation before
   changing credentials, config or worker selection. Do not infer completion from
   uploaded bytes, validation or a missing local process.
3. Settle/abandon owned active work through its original identity. An unknown
   submission must be resolved first; an interrupted model call may have cost and
   needs explicit operator review. Do not copy assignments to another identity.
4. Keep canonical current memory, pending inputs and receipts. Neither switch nor
   rollback restores an older checkpoint, resets memory or replays processed sources.
5. Select the intended private Shem config under its supervisor. `doctor` verifies
   the pair and capabilities; `once` runs one bounded invocation; `loop` is finite.
   For remote operation provision the host routing binding first as documented in
   published Chelm 1.4.0 docs/COGNIZER_ROUTING.md. Shem registers its readiness but
   cannot change operator routing policy. Enforced preference requires the actual
   configured principal; executor.id/model are provenance fields, not authority.
6. Verify the selected process/principal and retained host receipts. Resume normal
   intake/processing. Test synthetic observations/questions only on disposable
   runtimes. Operational rollback repeats the same drain/reconcile/select steps.

Base-only, prefer-Shem and Shem-only are operator policies. An unregistered base
worker cannot be controlled merely by setting Shem max-active or changing an
executor label. Use published Chelm routing `preview`/`apply` administration with
expected_revision, explicit trusted bindings, bounded grace/fallback and separate
identities; do not have Shem silently rewrite it. CLI/stdio processes under one OS
account share an identity. Readiness registration is not a model-quality verdict.

The base remains the reference. Promotion/legacy recommendation changes and
installed selection are independent. No automatic fallback may replay owned or
uncertain work. Competing-worker/fallback/rollback acceptance is still pending.

---

The following is the original 2026-11-25 planning snapshot. Its version and
capability statements are historical; the current procedure/status above takes
precedence.

# Using, preferring and switching to Shem

Status: **Shem execution is not implemented yet; host routing is published in Chelm 1.4.0**. Verify the published release and advertised capability before using the host examples below.
Checked 2026-11-26. Workstream: [#17](https://github.com/apenczolgolonabijorbiper/shem-cognizer/issues/17).
Related: [setup #10](https://github.com/apenczolgolonabijorbiper/shem-cognizer/issues/10),
[base inventory #15](https://github.com/apenczolgolonabijorbiper/shem-cognizer/issues/15),
[promotion #16](https://github.com/apenczolgolonabijorbiper/shem-cognizer/issues/16).

This guide defines how the supported existing host/Harness integration will adopt Shem as an optional, preferred and eventually reference cognizer. It does not claim a working switch exists today. Concrete Shem commands/configuration examples must replace pending items only after implementation and retained acceptance.

## What changes when selecting Shem

The **base** is the existing Chelm + Harness + configured inference-capable agent workflow. The host/Harness already supply procedures, public APIs, prompts and validation; the agent supplies inference. Shem will implement that cognizer role using those procedures.

Selecting Shem changes which process/agent obtains cognitive work and prepares results. Chelm continues owning assignments, canonical memory, authorization, transactions and receipts. Harness continues defining cognitive semantics and validation. It is not necessary to change database/provider, instance layout, purpose/profile or source identity to change cognizers.

Shem may run alongside the host or remotely through its existing authenticated MCP worker interface. An external agent can still connect directly without Shem. Selecting Shem does not imply a local Shem dependency in either upstream package.

## Current release and capability status

| Item | Checked published state | Instruction |
| --- | --- | --- |
| Harness reference | [0.13.0](https://github.com/apenczolgolonabijorbiper/golem14-harness/releases/tag/v0.13.0) | Deterministic reference for Chelm 1.4.0; other approved versions are feature-qualified in its catalog |
| Chelm host contract | [1.4.0](https://github.com/apenczolgolonabijorbiper/chelm-host/releases/tag/v1.4.0) | Require the published package, integrity checks and `cognizer-routing-v1`; older 1.3.1 does not accept the selector |
| Other approved Harness versions | 0.11.0, 0.12.0, 0.13.1–0.13.3, 0.14.0 | File workers from 0.11.0, cognition from 0.12.0, providers from 0.13.0 for explicitly cataloged releases; no inference from a version range |
| Shem | Planning artifacts only | No installed/runnable Shem release or qualified triplet yet |
| Host preference | Optional `preferred_cognizer` in [runtime configs 2/3](https://github.com/apenczolgolonabijorbiper/chelm-host/blob/v1.4.0/schemas/runtime-config.schema.json) | Generic host eligibility; no automatic Shem default or mandatory install |
| Work delivery | Local CLI/stdio and authenticated HTTP MCP | Routing governs new assignments; owner recovery remains available |

The release gate must select a mutually supported **Shem + Chelm + Harness** triplet, pin exact package/manifest identities and record observed acceptance. Recheck current releases and capability declarations at implementation and release time. Never pair two newest releases merely because both are newest.

## Selection policies

Shem launch/inference syntax remains planned in #2/#10/#17. Chelm 1.4.0 implements the host-side modes below; the complete accepted configuration and handshake follow later in this guide.

| Policy | Intended behavior | If Shem is unavailable |
| --- | --- | --- |
| Base only | Launch/route new cognitive work to the supported base workflow | No dependency on Shem |
| Prefer Shem | Route eligible new work to qualified ready Shem first; base is an explicitly configured alternative | Choose base only before assignment under the declared readiness/timeout/capability policy |
| Shem only | Route new work exclusively to qualified Shem | Retain pending work and report unavailable; no implicit fallback |

For an older host, preference belongs to the application's scheduler/service supervisor/operator configuration. A label or concurrency limit does not enforce priority.

For Chelm 1.4.0, negotiate `cognizer-routing-v1` and use explicit `prefer` or `require` policy for the selected observation/cognitive queues. The host binds an operator-configured logical cognizer to an authenticated principal or the actual local OS account/hostname, checks declared readiness and exact contracts, and enforces the bounded per-work grace/fallback rule under the claim lock. Registration is a trusted declaration, not proof of binary identity or model quality. Multiple cognizers sharing one OS account cannot be distinguished; use separate trusted accounts/principals. Keep runtime administration protected by OS permissions.

Absent/disabled policy retains current compatible-worker dispatch. Existing local/remote authorization still applies, and a capability advertisement cannot grant runtime authority. Shem must implement the handshake before claiming host-enforced preference; this guide does not claim that client exists.

After any worker owns an assignment, the choice is fixed for that attempt. A timeout, disconnect or unknown submission is a recovery case, not permission to run the same work through the other cognizer.

## Owner-side checks available today

These are existing Chelm inspection commands, not Shem activation. Replace the paths with the installed verified package and existing private runtime. The last command is relevant when using remote assignments.

```sh
node "/path/to/chelm-host/bin/chelm.mjs" version
node "/path/to/chelm-host/bin/chelm.mjs" verify --runtime "/private/runtime"
node "/path/to/chelm-host/bin/chelm.mjs" status --runtime "/private/runtime"
node "/path/to/chelm-host/bin/chelm.mjs" remote list --runtime "/private/runtime"
```

Inspect both observation leases and cognitive/remote assignments through the appropriate public interfaces; an idle observation lease alone does not prove all work is settled. Keep full command output private where it contains runtime metadata.

## Transition procedure to complete and qualify with Shem

1. **Inventory and preflight.** Record the current package identities, base launcher/service/timer or interactive agent, runtime/instance identity, configured selection, queues, current HEAD/snapshot/guidance, pending intake and active work. Obtain the qualified Shem release and verify the supported triplet and required capabilities. If no supported triplet exists, remain on the base and report the compatibility dependency.
2. **Prepare Shem without competing claims.** Install/configure Shem outside the private runtime and vendor-owned upstream files. Select local CLI/stdio or remote MCP host binding independently of the inference API/delegated agent. Put model/worker secrets in configured credential sources. Perform implemented readiness/capability preflight without consuming work; exact Shem syntax is pending #10/#17.
3. **Preview the selection change.** Show the effective runtime and queues, current versus desired worker, base-fallback rule, readiness timeout, processes/scheduled tasks or clients affected, and any unresolved work. A proposed convenience command must have preview/apply semantics; an equivalent explicit operator checklist is acceptable where no selector exists. Never edit unsupported keys into Chelm runtime JSON.
4. **Pause new claims from the old path.** Stop/pause its runner, scheduled task, service loop or interactive agent's polling for the affected queues. Continue application input capture with stable pending-input identities. Do not revoke the old principal's ability to inspect/recover owned work before reconciliation is complete.
5. **Settle and reconcile.** Recover each unknown submission using its original work/attempt/submission/digest and authoritative receipt. Finish owned work through the original cognizer or explicitly abandon/cancel it through the supported owner/worker interface. Do not copy arbitrary drafts into a new attempt. Recheck local leases, remote/cognitive assignments and pending publications. If an outcome remains unknown, stop the switch and report it.
6. **Apply the explicit launch/routing policy.** Set the application/supervisor to use Shem or prefer it for new eligible work. In a single-selected-worker setup keep the old polling path stopped. For a supported preference setup enable only the tested eligibility/fallback policy. Remote Shem connects as a configured authorized worker to the same owner runtime. No Harness reinitialization or storage-provider change is part of this step.
7. **Verify effective behavior.** First qualify a bounded synthetic observation cycle and a read-only memory-backed task on a disposable runtime using the exact installed triplet. On the target runtime, use a non-mutating readiness/status check and explicitly authorized real work as appropriate; never inject synthetic test facts into production memory. Inspect host receipts, run/task/work bindings and retained Shem invocation evidence. Confirm the configured process/principal actually performed the selected work; descriptive `executor` metadata alone is not an authorization proof.
8. **Record the switch.** Retain previous/new selection, package/adapter identities, configuration references without secrets, checks, queued-input continuity, actual receipts and rollback steps. Monitor no-work, readiness, task state and errors. Report whether selection is explicitly configured, merely preferred by scheduling, or enforced by a negotiated host capability.

Installing a new compatible host/Harness pair, when needed, is a separate documented package-upgrade operation with its own pause/verify requirements. Cognizer selection itself never widens compatibility or triggers a schema/provider migration.

## Local and remote recipes to provide at release

| Deployment | Change at the cognizer side | Retain at the owner |
| --- | --- | --- |
| Local CLI / stdio | Replace the selected base invocation with the tested Shem launcher and private config; stop the prior loop after draining | Same runtime, public worker contracts, OS ownership requirements and canonical storage |
| Remote MCP | Start qualified Shem with the existing runtime endpoint and its configured principal/credential source; stop old competing polling for the selected scope | Same authenticated MCP service, runtime binding, source reservations and publication authority |
| Colocated app/service | Select Shem driver/service in application configuration; bound execution outside request timeouts where appropriate | Same host API/read models and durable task/intake behavior |
| Prefer Shem with base available | Use tested application scheduling/readiness/eligibility and explicit pre-assignment fallback; Chelm 1.4.0 routing only after contract negotiation | Same independently recoverable assignments/receipts; no double invocation on unknown outcomes |

The release guide must include exact tested commands/config files for each advertised recipe, paths with spaces/Unicode on Windows, service restart behavior and the installed-version/capability check. These details remain pending implementation; placeholders are not acceptance evidence.

## Rollback to the base

Use the same stop-new-claims, reconcile, settle, preview and select sequence in reverse. Preserve the **current** canonical runtime; resume only eligible pending work. Do not restore an old checkpoint/HEAD, reset/reinitialize the instance, import old source exports or replay completed observations to change cognizers.

If the base does not support the current host/Harness contract, compatibility must be resolved explicitly before selection. A silent package downgrade or fallback after an uncertain commit is not rollback. Keep the prior base installation/configuration available until the agreed acceptance/support window is satisfied.

## Reference, preference and legacy are separate decisions

| Lifecycle stage | Default recommendation | Installed behavior | Base support |
| --- | --- | --- | --- |
| Shem under development | Base workflow | Keep current explicit selection | Initial reference |
| Qualified Shem available | Base may remain reference; Shem can be explicitly selected/preferred | Changes only through the procedure above | Supported alternative/benchmark |
| Shem promoted in #16 | Shem recommended/reference for new integrations | Existing explicit choices persist | Optional supported base |
| Base designated legacy | Shem is the target for new cognition features and setup | Existing base deployments follow announced support/upgrade guidance | Legacy optional within an explicit support envelope |

Base legacy designation requires a separate recorded decision after Shem maturity/promotion and adoption readiness. Announce the effective versions/date, compatibility envelope, security/correctness maintenance, support window, migration-in-the-sense-of-setup instructions and any later removal criteria. No support duration or removal date is invented by this plan. Legacy does not mean immediate deletion, memory migration or a mandatory Shem dependency in the Harness.

The legacy label applies to the maintained base integration/launcher, not to all other conforming external cognizers. Generic public host/Harness contracts remain available to compatible independent agents.

## Coordinated upstream changes

At the corresponding stage, prepare reviewable follow-ups in the owning projects:

- **Chelm:** link this guide and qualified triplets from setup/release notes, distinguish base/Shem invocation, show how polling is controlled, and add routing/discovery/status/schema support only if application-level scheduling is insufficient.
- **Harness:** keep generic normative cognitive procedures; add tested Shem integration links/examples and later recommendation metadata without hard-coding a mandatory Shem implementation.
- **Shem:** ship exact recipes, schemas/specs/fixtures, capability preflight, effective-selection diagnostics and switch/rollback evidence. Keep README/plan/release state aligned.

This guide update does not modify a deployed runtime or implement a Shem executable. The host selector is independently supplied by the version-qualified Chelm release.

## Acceptance checklist

- [ ] The exact published triplet and every advertised local/remote recipe pass retained setup/switch/rollback tests.
- [ ] The preference policy has tested worker eligibility; a competing base worker cannot invalidate a claimed preference guarantee.
- [ ] Unavailable/incompatible Shem, stale work, source/policy changes and unknown publication outcomes stop or follow the explicit policy without duplicate publication.
- [ ] Observation processing and a read-only memory task have actual receipts and truthful model/process/principal provenance.
- [ ] Pending intake, retained claims/source IDs, guidance, question/hypothesis history and task citations survive switching.
- [ ] Base remains independently usable within its support envelope; reference promotion and legacy designation have separate retained decisions.
- [ ] Exact commands/configuration and upstream links are updated in the same release as the implementing behavior.

## Chelm 1.4.0 host selection and negotiation recipe

Host implementation: [Chelm #59 / PR #64](https://github.com/apenczolgolonabijorbiper/chelm-host/pull/64). Normative configuration and recovery: [version-qualified host guide](https://github.com/apenczolgolonabijorbiper/chelm-host/blob/v1.4.0/docs/COGNIZER_ROUTING.md). Routing acceptance uses deterministic independent clients; it does not qualify actual Shem cognition.

### Preflight

Verify the release ZIP/checksum and its extracted inventory. Keep host configuration in the private runtime, outside vendor files. These are implemented host commands; they do not launch Shem:

```sh
node /path/to/chelm-host/bin/chelm.mjs version
node /path/to/chelm-host/bin/chelm.mjs verify --runtime /private/runtime
node /path/to/chelm-host/bin/chelm.mjs routing status --runtime /private/runtime
```

Require `version.capabilities` to contain `cognizer-routing-v1`, `contracts.cognizer_routing=1`, and the selected Harness feature(s) to pass verification. Inspect both queues and drain/reconcile existing work as described above. The package version alone is insufficient.

### Preview and apply host policy

Provision the remote principals in the MCP service's authenticated runtime allowlist first. A routing entry does not grant service access. Create a private `policy-change.json`, replacing the revision with the current `routing status.revision` and principal names with real provisioned identities:

```json
{
  "expected_revision": 0,
  "preferred_cognizer": {
    "schema_version": 1,
    "mode": "prefer",
    "cognizer_id": "shem",
    "work_kinds": ["observation", "cognitive"],
    "grace_seconds": 60,
    "fallback": ["base"],
    "readiness_ttl_seconds": 120,
    "workers": [
      {"binding_id":"shem-one","transport":"remote","principal":"shem-worker","cognizer_id":"shem"},
      {"binding_id":"base-one","transport":"remote","principal":"base-worker","cognizer_id":"base"}
    ]
  }
}
```

```sh
node /path/to/chelm-host/bin/chelm.mjs routing preview --runtime /private/runtime --input policy-change.json
node /path/to/chelm-host/bin/chelm.mjs routing apply --runtime /private/runtime --input policy-change.json
```

Preview writes nothing. Apply uses revision CAS and affects new assignments only. For local CLI/stdio, use a binding with `transport: "local"`, the actual `local_identity.principal` and `local_identity.host` returned by host status, and the desired cognizer ID. Client-supplied executor/host metadata cannot choose that binding.

### Required Shem client handshake (to implement before claiming support)

1. On the authenticated worker connection, discover `chelm_routing_status`, `chelm_routing_register` and `chelm_routing_heartbeat`. Obtain this principal's required exact Harness manifest digest and path contracts from status.
2. Register only contracts/capabilities actually implemented. Remote observations use `remote-worker-v2`; local file workers use `file-worker-v1`; provider workers use `memory-worker-v3`; cognitive tasks use `cognitive-worker-v2`. Use the exact discovered manifest digest, never an arbitrary package version/model/executor name.
3. Declare `cognizer-routing-v1` and required work capabilities: `purpose-guidance-v2` for file observations, `memory-provider-v1` for providers, and the task/context/result, learning-hypothesis and unknown-confidence cognitive capabilities advertised by the host for cognition. Registration/heartbeat never grant data access or reset work grace.
4. Heartbeat before the configured readiness TTL expires while ready. Local equivalents are `routing-worker status|register|heartbeat` via the host CLI. A missing/incompatible binding must produce a visible refusal, not a forged identity.
5. Honor `deferred` and `busy` plus bounded retry hints. Prefer mode permits only ready allowlisted fallback after the original per-work grace; renewed heartbeats do not extend that grace. Require mode never falls back. Ordinary no-work remains distinct.
6. Retain original request/work/attempt/submission IDs and receipts. Recovery of owned or unknown-outcome work precedes a new claim, even after preference changes. Never run it again through another cognizer.

### Require and rollback

To require Shem, apply the complete policy with the current revision, `mode: "require"` and `fallback: []`. Existing base assignments remain with their owners. Let them finish or explicitly recover/cancel/requeue through existing operations; a policy change alone does not transfer them.

Rollback uses the same preview/apply interface and current revision: apply a retained earlier complete policy, or `preferred_cognizer: null` for unrestricted compatible-worker dispatch. Keep the current memory/provider/HEAD, pending input, source identities and guidance. Re-register after a settled checkpoint restore, which retains policy/grace and clears readiness.

### Remaining Shem acceptance

Shem #17 remains open for a runnable client, exact tested launcher/inference recipes and a qualified Shem + Chelm + Harness triplet. Test actual observation and no-inbox cognitive invocations, competing base workers, expiry/incompatibility, lost responses, switch and rollback with truthful process/model evidence. Host routing tests do not satisfy those Shem/LLM gates, promote Shem to reference or designate the base legacy.
