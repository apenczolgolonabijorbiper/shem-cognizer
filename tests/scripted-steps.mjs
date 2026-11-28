// Synthetic deterministic adapter fixture. No language model is used.
import { randomUUID } from "node:crypto";
export function scriptedStep(messages) {
  const initial = JSON.parse(messages.find((m) => m.role === "user").content),
    w =
      messages
        .filter((m) => m.role === "user")
        .map((m) => {
          try {
            return JSON.parse(m.content).updated_assignment;
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .at(-1) ?? initial.assignment;
  const reads = messages
    .filter((m) => m.role === "user")
    .map((m) => {
      try {
        return JSON.parse(m.content).untrusted_tool_result;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  if (!reads.length)
    return {
      type: "read",
      operation: "context",
      input:
        w.kind === "memory"
          ? { filters: { current: false } }
          : { current: false },
    };
  if (w.kind === "memory") {
    const at = new Date().toISOString(),
      attempt_id = randomUUID();
    const operations = [];
    for (const source of initial.sources) {
      const quote = source.text
        .split("\n---\n")
        .slice(1)
        .join("\n---\n")
        .trim();
      operations.push(
        {
          op: "add_entity",
          record: {
            id: "ent-" + source.id,
            type: "other",
            kind: "record",
            label: "Synthetic",
            aliases: [],
            source_ids: [source.id],
            uncertainty: [],
            created_at: at,
          },
        },
        {
          op: "add_claim",
          record: {
            id: "clm-" + source.id,
            subject_id: "ent-" + source.id,
            attributed_to_id: "ent-" + source.id,
            predicate: "describes",
            object: { value: "Synthetic" },
            classification: "source_assertion",
            sources: [{ observation_id: source.id, quote }],
            asserted_at: w.sources.find((s) => s.id === source.id).recorded_at,
            valid_time: {
              from: null,
              to: null,
              expression: null,
              precision: "unknown",
            },
            status: "active",
            supersedes: [],
            uncertainty: [],
            created_at: at,
          },
        },
      );
    }
    operations.push(
      {
        op: "append_journal",
        record: {
          id: w.run_id,
          policy_id: w.policy_id,
          review:
            "Synthetic deterministic fixture; sources and warnings reviewed. No language model used. Host checks pending.",
          verification_id: attempt_id,
          model: initial.declared_executor.model,
        },
      },
      {
        op: "append_verification",
        record: {
          id: attempt_id,
          run_id: w.run_id,
          result: "Deterministic fixture only. Host checks pending.",
          limitations: [
            "No language model used; no semantic acceptance claimed.",
          ],
        },
      },
    );
    return {
      type: "final",
      files: {
        "changes.json": {
          provider_version: 1,
          base_snapshot: w.snapshot_id,
          policy_id: w.policy_id,
          lease_id: w.lease_id,
          run_id: w.run_id,
          attempt_id,
          idempotency_key: "fixture-" + w.run_id,
          at,
          sources: w.sources.map(({ id, sha256 }) => ({ id, sha256 })),
          operations,
        },
      },
    };
  }
  const context = reads[0];
  if (context.claims?.length && reads.length === 1)
    return {
      type: "read",
      operation: "source",
      input: { id: context.claims[0].sources[0].observation_id, length: 16000 },
    };
  const source = reads[1];
  const findings = source
    ? [
        {
          id: "f1",
          classification: "source_assertion",
          text: "The retained source states a synthetic declaration.",
          claim_ids: [context.claims[0].id],
          premise_ids: [],
          evidence: [
            {
              source_id: source.id,
              sha256: source.sha256,
              start: source.start,
              quote: source.text,
            },
          ],
          uncertainty: [],
        },
      ]
    : [];
  return {
    type: "final",
    files: {
      "result.json": {
        protocol_version: 1,
        task_id: w.task_id,
        binding: w.task.binding,
        outcome: source ? "answer" : "insufficient",
        answer: source
          ? "The synthetic declaration is retained."
          : "Evidence is insufficient.",
        findings,
        questions: [],
        uncertainty: source ? [] : ["No processed evidence."],
        stop_reason: source ? "complete" : "missing_evidence",
        coverage: { truncated: false, pending_count: 0, valid_at: null },
        usage: {
          rounds: 0,
          context_requests: 0,
          source_bytes: 0,
          elapsed_ms: 0,
        },
        model: {
          requested: null,
          observed: null,
          configuration: "No language model used",
          cost: null,
        },
      },
    },
  };
}
