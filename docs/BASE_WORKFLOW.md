# Base inventory and reuse map

Inventory date: 2026-11-28. Exact published identities are in `compatibility.json`.
The initial reference is Chelm + Harness + a configured inference-capable agent.
Neither upstream package supplies its own LLM client. Existing consumers remain
on that base until their operator explicitly selects another cognizer.

| Asset in published packages | Shem treatment | Limit |
| --- | --- | --- |
| Harness 0.14.0 docs/ANALYSIS_WORKFLOW.md and docs/MEMORY_MODEL.md | Read complete hashed assignment artifacts; consumed as normative procedure | No independently forked memory model |
| Harness integration/COGNITIVE_TASK.sudo.md and cognitive schemas | Consume exact host-delivered protocol; host validates candidates | Not an actual-inference benchmark |
| Chelm 1.4.0 prompts/memory-worker-once.sudo.md | Adapt claim/read/retrieve/stage/validate/submit procedure into Driver | Shem-specific persistence and inference are new |
| Chelm prompts/cognitive-worker-once.sudo.md | Adapt explicit cognitive queue and authoritative evidence receipts | No fake processed-source rows for answers |
| Chelm schemas/memory-worker-tools.json and cognitive-worker-tools.json | Public CLI/stdio mapping; exact input schema hashes | HTTP SDK shapes have separate pins because conversion changes representation |
| Chelm lib/remote-tools.mjs and lib/remote-server.mjs | Public MCP discovery and pinned SDK-generated shapes | Authentication and publication stay in Chelm |
| Chelm tools/run-remote-agent.mjs | Retained independently in the base; informs shell-free finite process execution | Not reused as an LLM client or claimed qualified agent adapter |
| Chelm docs/evidence/provider-work-2026-11-24 and cognition-2026-11-24 | Retained historical base evidence; links below | Same-agent reviews, unknown model/settings; not new Shem acceptance |
| Chelm tests/conformance/memory-provider.test.mjs and cognitive.test.mjs | Test-only reference for valid semantic fixture shapes | Synthetic test outputs explicitly say no language model used |
| Chelm docs/COGNIZER_ROUTING.md / schemas/routing-worker-tools.json | Consume published routing identity/manifest/readiness | Does not grant permission to change operator policy |

Package licenses: upstream Chelm/Harness packages carry their Apache-2.0 LICENSE
and NOTICE files; dependency licensing remains in locked upstream dependencies.
No upstream runtime code is vendored into Shem. Synthetic fixture payload shapes
follow the public contracts; observations in Shem tests are disposable data.

Base evidence remains available in the exact published Chelm package and at:

- [Provider evidence](https://github.com/apenczolgolonabijorbiper/chelm-host/tree/v1.4.0/docs/evidence/provider-work-2026-11-24)
- [Cognitive evidence](https://github.com/apenczolgolonabijorbiper/chelm-host/tree/v1.4.0/docs/evidence/cognition-2026-11-24)

A future comparison must predeclare cases, semantic thresholds, repeat counts and
budgets, use separate disposable copies of the same input/policy snapshot, retain
both exact inputs/outputs and disclose model/settings differences. Grounding,
identity, chronology, uncertainty and safe recovery are judged against source
bytes and Harness rules. Base mistakes are not an oracle for Shem. This candidate
has no comparative or reference-promotion verdict.
