# Shem candidate architecture

Shem is an optional Node ES-module cognizer. Its library API composes `Driver`,
`HostBinding`, `InferenceAdapter` and private `StateStore`; the CLI calls the same
objects. No owner runtime needs a Shem process for other agents to use Chelm.

| Boundary | Responsibilities |
| --- | --- |
| Harness | Normative observation/task procedures, evidence/history semantics, public schemas and validators |
| Chelm | Authentication, routing eligibility, assignment identity, immutable snapshots, leases, staging, validation, receipts and canonical publication |
| HostBinding | Explicit CLI/stdio/HTTP aliases, preflight/version/schema checks, bounded reads and uploads; no memory semantics |
| Driver | Bounded inference/retrieval, issued-slot drafts, host validation/publication, frozen recovery identities |
| InferenceAdapter | Configured compatible API or noninteractive process, typed decisions, deadline/cancellation and truthful provenance |
| StateStore | Private invocation recovery and retained completion evidence; no replacement canonical store |
| Application/operator | Intake, domain guidance, learning authorization, selection, supervision and external actions |

The implemented observation path requires explicitly selected provider config 3,
semantic changes v1, host API v2 and memory worker v3. Cognitive v1 uses its own
queue, immutable task binding and host evidence receipts independently of inbox
state or observation processing leases. Read-only tasks cannot submit learning.
Propose-learning uses a separate issued learning slot; Shem has no approval API.

All transports use the same typed result pipeline. API-specific messages remain
inside the inference adapter. A process adapter receives a versioned bounded step
request and returns a bound typed decision; it never receives Chelm credentials
unless an operator explicitly misconfigures its environment allowlist. Configure
only the agent credentials that process requires. Independent Work/Cursor agents
continue connecting directly to Chelm; their subscriptions/launch interfaces are
not inferred to support unattended delegation.

Private state is scoped by endpoint, executor, inference configuration and limits.
Persisted phases freeze claims, invocation IDs, exact candidate revisions,
submission IDs and digest before external ambiguity. A committed host receipt is
terminal; unknown inference stays blocked for operator review. A validation pass,
answer receipt, learning publication, semantic verdict and durable session save
are distinct facts. Optional portable local sessions are not bound by this candidate.

See the normative [operational specification](../spec/COGNIZER.sudo.md),
[mapping](../spec/traceability.json) and [acceptance status](IMPLEMENTATION_STATUS.md).
