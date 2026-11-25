# Using, preferring and switching to Shem

Status: **design and release-documentation requirements; Shem execution is not implemented yet**.
Checked 2026-11-25. Workstream: [#17](https://github.com/apenczolgolonabijorbiper/shem-cognizer/issues/17).
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
| Latest Harness | [0.14.0](https://github.com/apenczolgolonabijorbiper/golem14-harness/releases/tag/v0.14.0) | Alignment target; not automatically compatible with latest Chelm |
| Latest Chelm | [1.3.0](https://github.com/apenczolgolonabijorbiper/chelm-host/releases/tag/v1.3.0) | Its [compatibility declaration](https://github.com/apenczolgolonabijorbiper/chelm-host/blob/v1.3.0/compatibility.json) supports Harness **0.13.0 exactly** |
| Existing supported owner pair | Chelm 1.3.0 + Harness 0.13.0 | Baseline for implementation; retain exact verified release pins |
| Shem | Planning artifacts only | No installed/runnable Shem release or supported triplet yet |
| Host cognizer preference | No selector in the [published runtime schema](https://github.com/apenczolgolonabijorbiper/chelm-host/blob/v1.3.0/schemas/runtime-config.schema.json) | Do not add a fictional `preferred_cognizer` property or use an invented switch flag |
| Existing work delivery | Workers pull work through local/remote contracts | Select which worker is launched/eligible through application/operator scheduling; a preference label alone cannot enforce priority |

The release gate must select a mutually supported **Shem + Chelm + Harness** triplet, pin exact package/manifest identities and record observed acceptance. Recheck current releases and capability declarations at implementation and release time. Never pair two newest releases merely because both are newest.

## Proposed selection policies

These labels describe intended behavior, **not existing Chelm schema properties, flags or runnable Shem syntax**. Final naming/configuration belongs to #2/#10/#17.

| Policy | Intended behavior | If Shem is unavailable |
| --- | --- | --- |
| Base only | Launch/route new cognitive work to the supported base workflow | No dependency on Shem |
| Prefer Shem | Route eligible new work to qualified ready Shem first; base is an explicitly configured alternative | Choose base only before assignment under the declared readiness/timeout/capability policy |
| Shem only | Route new work exclusively to qualified Shem | Retain pending work and report unavailable; no implicit fallback |

Preference belongs initially to the consuming application's scheduler/service supervisor/operator configuration. It must specify the applicable runtime, observation/cognitive queue coverage, worker readiness/capabilities, finite readiness timeout and fallback policy. Existing host authorization remains separate.

A base worker independently polling the same eligible queue can claim first. Setting `remote.max_active_work` to 1 limits concurrency; it does not prioritize Shem. A cooperative prefer-Shem deployment must prevent unselected workers from requesting new work for that scope. Separate configured services/principals and existing authentication controls can help administer access, but availability, preference and authorization must not be conflated.

If simultaneous independent clients need a host-enforced priority or cognizer eligibility rule, that needs a separately implemented/tested/published Chelm routing capability and compatible schema. Do not advertise it as already supplied by the current MCP server. Local processes with owner privileges also require an actual launch/operational policy; a display label is not enforcement.

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
| Prefer Shem with base available | Use tested application scheduling/readiness/eligibility and explicit pre-assignment fallback; future host priority only when advertised | Same independently recoverable assignments/receipts; no double invocation on unknown outcomes |

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

This planning change updates Shem documentation only. It does not alter a deployed runtime or claim those upstream features already exist.

## Acceptance checklist

- [ ] The exact published triplet and every advertised local/remote recipe pass retained setup/switch/rollback tests.
- [ ] The preference policy has tested worker eligibility; a competing base worker cannot invalidate a claimed preference guarantee.
- [ ] Unavailable/incompatible Shem, stale work, source/policy changes and unknown publication outcomes stop or follow the explicit policy without duplicate publication.
- [ ] Observation processing and a read-only memory task have actual receipts and truthful model/process/principal provenance.
- [ ] Pending intake, retained claims/source IDs, guidance, question/hypothesis history and task citations survive switching.
- [ ] Base remains independently usable within its support envelope; reference promotion and legacy designation have separate retained decisions.
- [ ] Exact commands/configuration and upstream links are updated in the same release as the implementing behavior.

## Tracked host preference proposal

[Chelm-host #59](https://github.com/apenczolgolonabijorbiper/chelm-host/issues/59) tracks `preferred_cognizer` and enforceable new-work eligibility across local/remote bindings. It is proposed, not implemented or published. It can be developed before Shem using independent worker fixtures; the host will continue to leave inference to cognizers.

Shem must negotiate the eventual published routing capability and supported host/Harness tuple before claiming host-enforced preference. Application-controlled scheduling remains the available integration design until then. The proposal includes trusted registration, prefer/required modes, bounded fallback, effective status and prospective policy changes that preserve existing ownership and unknown-submit recovery. Its exact configuration is not accepted by current releases.
