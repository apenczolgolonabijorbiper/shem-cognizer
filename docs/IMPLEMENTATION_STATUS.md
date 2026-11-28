# Implementation and acceptance status

Recorded 2026-11-28. [Retained deterministic evidence](evidence/2026-11-28/summary.json):
29/29 checks pass on Linux/Node 24; 17 safety/parity checks also pass on Node 22.12.0.
The response-loss record retains the exact synthetic invocation before/after actual
host-commit recovery. These observations do not satisfy the complete release matrix.

 This is a runnable **0.1.0-dev.1 implementation candidate**,
not a qualified release or reference promotion. Tracker #1 remains open.
`compatibility.json` pins the implemented triplet to Shem 0.1.0-dev.1,
Chelm 1.4.0 and Harness 0.14.0. Other pairs fail closed.

The latest published Harness checked at implementation start is 0.15.0. Published
Chelm 1.4.0 approves releases through 0.14.0; Shem does not bypass that catalog.
The old planning snapshot (Chelm 1.3.0 / Harness 0.13.0) is historical. Published
Chelm 1.4.0 also supplies routing v1 and local sessions; Shem binds routing but
has no local-session checkpoint adapter yet.

| Work package | Implemented here | Remaining acceptance or implementation |
| --- | --- | --- |
| #2 architecture | Replaceable boundaries, config/step schemas, exact package/tool/protocol identities, fail-closed pair | Full cross-version matrix intentionally not advertised |
| #3 host bindings | CLI, stdio MCP, authenticated HTTP MCP; shared provider/cognitive lifecycle | OAuth issuer/client deployment, wider chunk/auth/isolation fault matrix |
| #4 inference | Configurable compatible API, text/native tools, fragmented SSE, bounded errors; requested/observed provenance | Two real endpoints and actual model qualification |
| #5 driver | Delivered Harness procedures, bounded typed reads, shared candidate pipeline, no action/approval tools | Full semantic adversarial/identity/temporal evaluation |
| #6 observations | Semantic changes via config-3 worker v3 on all three transports | Isolated config-2 legacy observation binding is NOT implemented; full rebase/correction acceptance |
| #7 tasks | Independent cognitive queue, bound messages, read-only/propose-learning slot distinction, trusted receipts | Branching/continuation/cancellation and reviewed learning acceptance matrix |
| #8 agents | Shell-free process adapter with bound request/result and owned process cleanup | Real agent qualification; optional explicit-delegation MCP adapter/external tools not implemented |
| #9 recovery | Private durable phases, frozen claim/submission IDs, status-first commit recovery, finite scheduling, renewal/rebase review | Full process-kill fault matrix, local-session checkpoint adapter; stale local lock requires supervised recovery |
| #10 setup | Validated private config, doctor/status/once/resume/renew/abandon/loop, remote/Windows guidance | Actual consumer Windows/IIS deployment evidence and automated switch qualification |
| #11 provenance | Requested/observed/unknown metadata, token bounds, private retained reports, separate validation/receipt/semantic/checkpoint states | Broader provider cost/cache metrics and budget qualification |
| #12 portability | SudoLang operational spec, portable fault vectors, schemas, traceability, manifest/change parity checks | Alternate-language implementation certification not claimed |
| #13 qualification | Deterministic synthetic host/adapter tests on exact published pair and retained report | Real API + real delegated agent + separate semantic verdicts + predeclared base comparison required |
| #14 release | Reproducible candidate archive/checksum; regular package fails closed on pending gates | No release published; first-release gates remain blocking |
| #15 base inventory | Exact upstream identities, procedure/API/test/evidence reuse map | Retained comparative observations still pending |
| #16 succession | Base remains initial reference; no automatic selection change | Later explicit evidence-backed promotion; subsequent legacy policy is separate |
| #17 switching | Actual CLI commands, transport config, published routing capability and drain/recovery procedure | Complete competing-worker/fallback/rollback acceptance; not certified operational switching |

This implementation does not revise away the tracker's first-release requirements.
The pending items above remain required before claiming full tracker completion.
No child issue is closed merely because part of its implementation exists.

Tests use scripted extraction and local HTTP fixtures, clearly marked **No
language model used**. They demonstrate actual package verification, protocol
reads, source hashes, staging/validation and host receipts. They do not demonstrate
semantic quality, real provider availability or a real autonomous-agent integration.
No configured provider credential or real noninteractive agent was available in
this implementation environment. No private consumer runtime was upgraded.

Release blockers are machine-readable. Initial qualified release and promotion
are different gates; reference promotion is not required to package an initial
qualified candidate once its actual release requirements pass.
