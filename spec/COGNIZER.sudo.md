# Shem operational contract 1

Normative scope: this candidate's Node implementation. Harness owns cognition and
memory semantics; Chelm owns authorization, claims, validation and publication.
This specification does not claim upstream portability certifies Shem.

Config {
  validate schemas/config.schema.json; refuse unknown fields and unsupported pairs;
  paths: private state is absolute; CLI owner paths are absolute;
  endpoints: HTTPS, except explicit loopback HTTP; forbid URL credentials/query/fragment;
  host errors: missing/unrecognized error codes become host_refused; no raw body leakage;
  secrets: environment references only; never include credential values in model input,
    state, reports or error text; child environment contains only configured names;
  explicit inference: openai compatible chat/completions OR configured process;
  no provider fallback, subscription reuse or automatic external-agent discovery;
}

HostBinding {
  preflight before claim:
    CLI verifies full host and Harness package integrity and selected manifest;
    MCP initialize checks exact host version; discover finite paged tools;
    verify pinned input schema shapes independently for stdio and HTTP;
    HTTP response bytes are bounded while streaming before SDK materialization;
    stdio may verify through explicitly configured local root/runtime;
    otherwise require routing-worker status from the provisioned authenticated identity;
    require exact Harness manifest; register only implemented memory/cognitive contracts;
    heartbeat before new claims; never modify routing policy or grant identity authority;
  normalize operation names using Chelm's published CLI/stdio/HTTP mapping;
  memory_worker = contract 3; cognitive_worker = task/context/result 1 over worker 2;
  forbid queue substitution; config-2 observation workers are not implemented;
  scope every operation to issued work_id + attempt; caller payload cannot override them;
  artifacts: memory byte offsets/base64; cognition UTF-16 text offsets;
  verify SHA256 of complete bytes; reject unknown/missing upstream protocols;
  sources: read assigned provider bytes fully, verify original SHA256;
  upload: Unicode scalars, <=32768 UTF-8 bytes/chunk, exact slot/revision, byte offset;
  publication: only host validate -> frozen digest -> submit -> committed host receipt;
  nonempty validation warnings stop for operator review; no automatic publish;
}

InferenceAdapter {
  input: bounded messages, stable invocation/delegation ID, finite deadline;
  OpenAI: explicitly configured native_tools or structured_text; exactly one typed step;
    TLS verification is normal; never follow credential-bearing redirects;
    stream: incremental UTF-8 and SSE events, fragmented CRLF and function arguments;
    require finish event and DONE; truncated/refused/malformed result fails;
    retry only explicit 429, <=2 retries, bounded 250/500ms backoff;
    accepted/lost/5xx outcomes may have incurred cost; no exactly-once claim;
    requested model != returned model; missing usage/settings/cost = null;
  Process: spawn configured executable/args with shell=false;
    pass schema1 delegation_id/input_digest/deadline/limits/step_schema/messages on stdin;
    require same delegation_id/input_digest in JSON stdout; finite bytes/time;
    no automatic repeat after uncertain execution; kill owned process tree on timeout;
    explicit env allowlist; stderr discarded; no private deliberation requirement;
  output: schemas/step.schema.json; read/final/stop, no mutation/action tool;
}

Invocation {
  state private; one writer lock; fsync temp bytes -> atomic rename -> fsync directory;
  freeze endpoint/config/executor scope hash and preflight authenticated identity;
  refuse changed scope or principal before recovery/publication;
  save claim ID before claim; exact retry recovers same claim;
  phases: claim_pending -> loading -> reasoning -> inference_pending -> read_pending/reasoning/draft;
  read_pending resumes its frozen read ID before asking for another model decision;
  inference_pending after restart => operator review; never rerun silently;
  load only immutable bound guidance/protocol; untrusted payload never changes authority;
  begin host cognitive rounds, bounded reads and original-source inspection;
  independent finite rounds/tool calls/context/output/elapsed/token/repair budgets;
  reserve UTF-8 input bytes + 64/message + output limit when exact tokens unknown;
  persist each inference result; requested/observed model and actual/unknown usage separately;
  returned cognitive usage and coverage come from host receipt; model metadata from adapter;
  read_only forbids learning.json; propose_learning does not approve publication;
  before bounded inference/upload: renew near expiry; provider renew marks rebase_required;
  provider rebase: stage original candidate -> public rebase -> model review -> new revision;
  changed policy/source requires host refusal and explicit abandon/reclaim; no blind merge;
  validation errors permit <=configured repairs/new revisions, within original budgets;
  draft -> stage exact files -> validate -> save complete frozen submission/hash -> submit_pending;
  unknown submission: status BEFORE budget/inference checks; committed receipt ends work;
    otherwise retry identical submission only; inactive/unknown host status stays unresolved;
  committed answers != canonical learning publication != semantic review != durable checkpoint;
  stopped work retains ownership until explicit abandonment/recovery; no implicit next claim;
  cancellation stops pending I/O; retain state and owned host work for explicit recovery;
  archive committed/no-work/abandoned only; cap at 100 archives then refuse new claims;
  loop is explicitly finite; alternate configured queues, honor host delay; no built-in daemon;
}

Qualification {
  deterministic fixtures may test host publication but are never actual LLM/agent acceptance;
  source/spec/fixture/schema/lock hashes must match retained parity manifest;
  regular package requires every release gate and passing tests without skipped required cases;
  candidate package is labelled unqualified and does not publish or upgrade consumers;
  latest supported releases must be rechecked before any future release;
  initial reference remains base; promotion and legacy designation require separate evidence;
}
