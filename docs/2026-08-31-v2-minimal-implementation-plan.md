# PARALLAX — v2 Minimal Implementation Plan

Date: 2026-08-31

Mode: READ-ONLY PLANNING / NO IMPLEMENTATION

Inherited decision: **C — DESIGN v2**

Challenge deadline: **2026-09-04 05:00 JST**

This plan converts the completed cross-application semantic model review into the smallest implementation slice that could be built, fully regression-tested, deployed, and demonstrated before the Challenge deadline. It does not implement v2. It does not modify Core v1, Developer Contract v1, current production behavior, the UI, CLI behavior, the Production Validation Matrix, README marketing, deployment, repository visibility, or Git history.

The safest implementation shape is additive and versioned: keep the current v1 runner and production artifact intact, add a small v2 model/runner beside it, and switch production only after the complete acceptance gate passes. If the gate does not pass, v1 remains the release candidate.

## 1. Baseline verification

The required v1 baselines were verified in the current repository before planning:

| Baseline | Value | Status |
|---|---|---|
| Frozen Core v1 SHA-256, sorted `lib/core/*.ts` source manifest | `1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82` | matches |
| Developer Contract v1 SHA-256, `docs/DEVELOPER_CONTRACT_V1.md` | `c576f4515d680128ef7db83f8096225671e9d4e7d1258c83aeb52c8fab576cfa` | matches |
| Production Validation Matrix SHA-256 | `8771f751f28885893fc1898d91618b6b138165a760117507886850578762146b` | unchanged |
| Current HEAD | `a6c94a4965987bb68a5a55ef87d49a3d07933cf6` | recorded |

Protected files are clean relative to Git. The worktree contains pre-existing changes to `package.json`, CLI files, and validation records; those changes are preserved and are not part of this planning gate.

The current v1 health checks all pass:

| Check | Result |
|---|---|
| `npm run test:core` | 8 passed, 0 failed |
| `npm run test:contracts` | 4 passed, 0 failed |
| `npm run test:cli` | 9 passed, 0 failed |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS; no warnings or errors |
| `npm run build` | PASS |
| `git diff --check` | PASS |

v1 is therefore a usable historical baseline and fallback. No v1 fixture or v1 result may be overwritten by the v2 work.

## 2. Source and review inputs

The planning authority is the previous cross-application review:

- `docs/2026-08-31-cross-application-semantic-model-review.md`

The frozen contract and implementation inputs are:

- `docs/DEVELOPER_CONTRACT_V1.md`
- `lib/core/*.ts`
- `lib/integration/webmcp/*.ts`
- `lib/integration/parallaxTools.ts`
- `lib/playground/subly/*.ts`
- `lib/validation/*.ts`
- `scripts/parallax.mjs`
- `scripts/parallax.test.mjs`
- `app/parallax-app.tsx`

The evidence inputs are the retained Subly, Flight Search, CineFlow, Order Tracking, SkyHop, Kurio, Mabel’s Table, Tagboard, The Archive, and Luna records under `docs/validation/` and `docs/research/`. The records remain distinct as LIVE, CAPTURED, HUMAN APPROVED, CLIENT-RUNTIME-OBSERVED, UNRESOLVED, and historical/unsupported interpretations.

No external application is contacted in this planning gate. The plan relies on the evidence already captured and identifies the live revalidations required after implementation.

## 3. Challenge time budget

The nominal calendar is:

| Date | Planned gate | Decision |
|---|---|---|
| 2026-08-31 | Freeze scope and begin only after plan approval | No implementation in this planning gate |
| 2026-09-01 | Implement the additive v2 model, normalization, core, tests, and required fixtures | First P0 checkpoint in the evening |
| 2026-09-02 | Integrate the minimal X-Ray/CLI surface and run local/production-candidate checks | No partially migrated production release |
| 2026-09-03 | ChatGPT Work and Chrome/native WebMCP regressions; finalize narrative; code freeze | Fall back to v1 if any release blocker remains |
| 2026-09-04 05:00 JST | Challenge deadline | Submit only the fully verified candidate |

Estimated effective engineering budget is 20–28 focused hours for a realistic v2 slice, plus 6–10 hours of elapsed time for browser/client/production regression and recording. That is feasible only because the current fixtures and v1 demo already exist. New live external collection, native runtime repair, or a broad UI rewrite would exceed the safe budget.

The hard checkpoint is **2026-09-01 20:00 JST**: if the v2 core cannot distinguish Tagboard accepted/rejected while preserving Subly and Flight Search, stop reducing scope and prepare the v1 fallback. The second checkpoint is **2026-09-02 20:00 JST**: if production integration and the minimal demo path are not green, do not ship v2.

## 4. Priority and cut-line summary

| Feature / change | Classification | Must ship by | Fallback if incomplete |
|---|---|---:|---|
| Versioned v2 Contract and Evidence schema | P0 | 2026-09-01 12:00 JST | Keep v1 release candidate; do not partially accept v2 data |
| Conditional effect, policy outcome, and occurred/prevented outcome | P0 | 2026-09-01 18:00 JST | v1 remains shipped; Tagboard contrast is described as a v1 limitation |
| Minimal lifecycle: exposed → invoked → optional approval/policy → effect outcome | P0 | 2026-09-01 18:00 JST | Do not claim effective-agent analysis in v2 |
| Application boundary versus client-runtime approval | P0 | 2026-09-01 20:00 JST | Keep Kurio/Mabel findings scoped as v1 contract observations |
| Goal/workflow roles and explicit `COMPLEMENTARY` relation | P0 | 2026-09-01 20:00 JST | Keep Archive as v1 positive control with documented limitation |
| Pure v2 Core plus all mandatory unit/regression fixtures | P0 | 2026-09-01 20:00 JST | v1 fallback |
| v1→v2 migration and semantic diff | P0 | 2026-09-02 12:00 JST | No v2 production promotion |
| Minimal X-Ray evidence/outcome projection | P1 | 2026-09-02 16:00 JST | Use v1 production UI and narrow claims |
| Thin CLI v2 check/diff support | P1 | 2026-09-02 16:00 JST | Keep v1 CLI unchanged and do not expose v2 as shipped |
| Production candidate, fresh ChatGPT Work, Chrome/native WebMCP regression | P1 | 2026-09-03 12:00 JST | Revert to v1 production artifact |
| Rich effective-surface aggregate, full delegated/authorized lifecycle, full policy telemetry | P2 | post-Challenge | Defer |
| More external applications, full external matrix/UI expansion, WebMCP Extension expansion | P2 | post-Challenge | Defer unless already zero-risk and all P0/P1 gates are green |
| npm, CI, SaaS, extension, URL scanning, crawler, universal inference, mobile, analytics | DO NOT BUILD | — | Defer |

Hard rule: if any P0 or P1 item cannot be implemented and fully regression-tested by its checkpoint, either reduce to a smaller coherent v2 slice or fall back to v1. Do not ship a partially migrated semantic model.

## 5. Minimal Contract v2 delta

Use an explicit version envelope. Do not reinterpret v1 fields in place.

```ts
type ContractVersion = 1 | 2;

type EffectClaim = {
  effect: Effect;
  certainty: "guaranteed" | "possible" | "conditional";
  phase?: "temporary" | "terminal" | "unspecified";
  conditionId?: string;
};

type SurfaceRelation = {
  humanActionIds: string[];
  agentToolNames: string[];
  relation: "EQUIVALENT" | "COMPLEMENTARY";
  source: "developer-assertion";
  rationale?: string;
};

type IntentContractV2 = IntentContract & {
  requiredEffects?: Effect[];
  workflowActions?: SemanticAction[];
  terminalActions?: SemanticAction[];
  completionTarget?: "goal" | "workflow" | "both";
};

type HumanActionContractV2 = HumanActionContract & {
  effectClaims?: EffectClaim[];
};

type ToolContractV2 = ToolContract & {
  effectClaims?: EffectClaim[];
  capabilityRole?: "goal" | "supporting" | "workflow-terminal" | "optional";
};

type DeveloperContractV2 = {
  version: 2;
  applicationId: string;
  intent: IntentContractV2;
  humanSurface: {
    actions: HumanActionContractV2[];
    boundaries: BoundaryContract[];
  };
  agentSurface: {
    tools: ToolContractV2[];
    boundaries: BoundaryContract[];
  };
  surfaceRelations?: SurfaceRelation[];
};
```

The exact names can be adjusted during implementation, but the semantic decisions are fixed for planning:

- `SemanticAction` and `Effect` remain opaque strings.
- `requiredEffects` is optional and must be explicitly supplied by the developer adapter; it is never inferred from `intent.goal`.
- `effectClaims` carries certainty and phase for v2. Existing v1 `declaredEffects` remains valid legacy declaration data and is not silently upgraded to “guaranteed.”
- `workflowActions` and `terminalActions` distinguish goal completion from workflow completion.
- `surfaceRelations` is per Human-action/Agent-tool group, not a global “surfaces are equal” switch.
- Only `EQUIVALENT` and `COMPLEMENTARY` are needed before the Challenge. An absent relation means `UNRESOLVED`/not assessed, not automatic equivalence or failure.
- Client-runtime approval is not inserted into this contract. It belongs in observed evidence.

### Tagboard v2 contract decision

The frozen v1 Tagboard contract is not edited. A v2 adapter may explicitly declare:

```text
add_note.effectClaims =
  note_stored / conditional / terminal / conditionId=moderation-allow
```

Whether `note_stored` is a `requiredEffects` value must be an explicit adapter/contract decision reviewed before fixture freeze. If it is declared required for the “add a note” goal, a policy rejection can produce an Intent/semantic FAIL because the required domain outcome was prevented; it still remains Technical PASS and Policy REJECT. If it is not declared required, v2 must still show Policy REJECT and Effect PREVENTED without manufacturing a goal failure.

## 6. Minimal Evidence v2 delta

Do not build a telemetry platform. Add a small, optional, provenance-bearing evidence envelope that can express the observed cases.

```ts
type EvidenceOrigin =
  | "application"
  | "client-runtime"
  | "human"
  | "external-observer";

type EvidenceMode = "live-execution" | "captured-fixture";
type EvidenceCompleteness = "complete" | "partial" | "unknown";

type BoundaryEvidence = {
  origin: "human" | "application-agent" | "client-runtime";
  type: "review" | "confirmation" | "approval";
  status: "requested" | "approved" | "denied" | "not-observed";
  invocationId?: string;
  observedAt?: string;
  evidenceSource: EvidenceSource | "client-runtime";
};

type PolicyEvidence = {
  decision: "allow" | "reject" | "rate_limit" | "unresolved";
  source: "application-policy" | "client-runtime";
  invocationId?: string;
  policyDecisionId?: string;
  observedAt?: string;
};

type EffectOutcome = {
  effect: Effect;
  outcome: "occurred" | "prevented" | "unresolved";
  phase?: "temporary" | "terminal" | "unspecified";
  invocationId?: string;
  effectObservationId?: string;
  source: EvidenceSource | "client-runtime" | "application-policy";
  detail?: string;
};

type ExecutionEvidenceV2 = ExecutionEvidence & {
  invocationId?: string;
  observedAt?: string;
  origin?: EvidenceOrigin;
  boundaryEvidence?: BoundaryEvidence[];
  policyEvidence?: PolicyEvidence;
  effectOutcomes?: EffectOutcome[];
};

type EvidenceBundleV2 = {
  version: 2;
  mode: EvidenceMode;
  completeness: EvidenceCompleteness;
  applicationId: string;
  entries: ExecutionEvidenceV2[];
};
```

Implementation constraints:

- `invocationId` is required when a policy or effect outcome is claimed to be correlated to a specific tool call. It may be absent when the record explicitly says the trace is incomplete.
- `policyDecisionId`, `effectObservationId`, and timestamps are optional because current external applications do not always expose them. Missing values remain missing.
- `origin` distinguishes application evidence from client-runtime approval; a client event can never become an application contract boundary through normalization.
- `mode` distinguishes live execution from a captured fixture at the bundle level.
- `completeness` replaces vague “we probably saw the path” reasoning. It is not a confidence score and must not be used to invent events.
- Existing v1 `observedEffects` are preserved as a compatibility projection. v2 `effectOutcomes` add prevented/unresolved and phase semantics.
- Technical status stays on the invocation. Policy and effect outcomes stay alongside it, not inside the technical status.

### Minimum evidence examples

Accepted Tagboard:

```text
invocation: add_note / success
policy: allow / application-policy
effect: note_stored / occurred / terminal
```

Rejected Tagboard:

```text
invocation: add_note / success
policy: reject / application-policy
effect: note_stored / prevented / terminal
```

Mabel:

```text
client boundary: approval / approved / before confirm invocation
effect: temporary_table_hold / occurred / temporary
effect: confirmed_reservation / occurred / terminal
```

These records may still be `partial` if the exact native tool sequence is unavailable. The model must show the distinction without claiming a complete trace.

## 7. Minimal Core v2 delta

The pure Core remains a deterministic function over plain data:

```text
DeveloperContractV2 + EvidenceBundleV2
  → runSemanticAuditV2()
  → AuditResultV2
```

It must not import React, DOM, WebMCP browser APIs, client/provider code, Subly runtime code, network code, or global registries.

The safest deadline implementation is a side-by-side module under `lib/core/v2/`:

- `lib/core/*.ts` remains the frozen v1 runner.
- `lib/core/v2/` owns v2 types, normalization, rules, results, and tests.
- v1 inputs can be normalized into a v2-compatible internal shape without changing the v1 output.
- v2 output is versioned and includes typed policy/effect/boundary details; it does not overwrite stored v1 results.

The v2 result should retain the existing top-level lens statuses and add structured detail rather than adding a new top-level status:

```text
modelVersion
statuses: intent / parity / agency
technicalStatus
semanticStatus
policyOutcomes[]
effectOutcomes[]
boundaryEvidence[]
surfaceRelations[]
evidenceCompleteness
gaps[]
recommendations[]
path
```

The Core derives from relationships, never from application IDs or the natural-language meaning of an effect string.

## 8. Exact six-rule changes

| v1 rule | v2 disposition | v2 input semantics | Required behavior |
|---|---|---|---|
| `forbidden-effect` | Unchanged logic; richer outcomes | Evaluate `EffectOutcome.outcome=occurred` and legacy observed effects against explicit `intent.forbiddenEffects`. | FAIL only for an observed forbidden effect. A prevented effect is not an occurrence. Technical success does not suppress the failure. |
| `missing-required-action` | Input semantics changed | Use exact invoked evidence plus `completeness` and goal/workflow roles. | FAIL only when complete evidence proves a goal-required action is absent. WARN when trace is partial/unknown. A workflow-terminal action is not silently treated as goal-required. |
| `declaration-observation-mismatch` | Logic largely unchanged; effect claims added | Compare `readOnlyHint` and declared effect claims with observed occurred outcomes. | FAIL when a read-only/declaration claim contradicts observed behavior. Do not treat a conditional claim as a guaranteed occurrence. |
| `missing-confirmation-boundary` | Input semantics and severity changed | Compare Human/application boundaries with boundary evidence and correlated client-runtime events. | Exposure-only boundary absence is a contract-level WARN. A protected terminal effect without an app boundary or correlated approval is FAIL. Client approval is shown separately and never promoted to an app declaration. |
| `semantic-overloading` | Input semantics changed | Require explicit Human action separation, protected effect claims, and an Agent tool relationship. | FAIL/WARN only when the contract supplies enough structure to show that one Agent tool crosses a meaningful Human boundary. No name-based inference. |
| `excess-agency` | Split by scope, without app exceptions | Evaluate declared mutation exposure separately from observed/delegated path and workflow roles. | Keep an exposure WARN for unnecessary mutation capabilities; exclude explicitly declared workflow-terminal capabilities for a workflow-target audit; never describe exposure as delegated or executed agency. |

The v1 rule names remain available for v1 compatibility. V2 may add finding scope and evidence qualifiers without inventing domain-specific rule names.

## 9. Excess-agency redesign

The current rule should not be deleted. It should stop pretending that one raw tool list answers three different questions.

### 9.1 Exact proposed semantics

1. **Raw exposed capabilities:** evaluate tools declared with mutation-capable effect claims. If the tool’s action is not in `intent.requiredActions`, not in explicit `workflowActions`/`terminalActions`, and the intent has a meaningful goal scope, emit an `excess-agency` WARN with `scope=exposed`.
2. **Authorized/delegated capabilities:** do not infer these from exposure. If a client or application explicitly supplies delegation evidence, retain it as lifecycle evidence. If it is absent, show `UNRESOLVED`; do not count absence as “not delegated.”
3. **Selected/invoked capabilities:** an exact invocation proves the call was made, not that every exposed tool was selected or delegated. An unnecessary invoked mutation can receive an `scope=effective-path` WARN, while an observed forbidden effect is handled by `forbidden-effect`.
4. **Workflow-terminal capabilities:** if a tool is explicitly declared in `terminalActions` and the audit target is `workflow` or `both`, it is not excess agency merely because it is not required for the goal-level action list. If the target is `goal`, show a goal/workflow distinction instead of silently calling it unsafe.
5. **Application-specific exceptions:** none. Subly, Kurio, Mabel, CineFlow, SkyHop, and Archive all use the same generic fields.

### 9.2 Expected case behavior

- Subly FIXED: `purchase_plan` and `cancel_plan` can remain an exposure-level WARN for the read/recommend goal; no claim that either was delegated or executed.
- Kurio: checkout and other cart mutations can remain exposure-level WARNs; the uninvoked checkout is not an observed mutation.
- Mabel: cancel/reschedule remain exposed mutation WARNs unless a workflow contract explicitly includes them; no claim that ChatGPT was delegated either tool.
- The Archive: `accuse_suspect` should be marked workflow-terminal when that is explicitly declared. The v2 result can avoid an excess-agency finding for a workflow-target audit while still showing it as a terminal capability outside the goal-only target.

This solves the over-sensitivity by changing inputs and scope, not by adding application labels or suppressions.

## 10. Missing-confirmation-boundary redesign

V2 must make the authority and outcome of a boundary explicit.

### 10.1 Boundary sources

| Source | Meaning | Can satisfy an application boundary comparison? |
|---|---|---|
| Human Surface | Developer-approved review/confirmation before a protected effect | Defines the Human requirement |
| Application Agent Surface | An application-declared Agent review/confirmation boundary | Yes, as the application-side equivalent |
| Client runtime | A provider/client approval prompt or approval event | No; it is observed separately and can qualify effective execution |
| Application policy | ALLOW/REJECT/rate-limit decision | No; policy is not confirmation |
| State transition | Hold, checkout initiation, or page state change | No; state is not approval |

### 10.2 Proposed v2 finding behavior

| Evidence | Result |
|---|---|
| Human boundary and equivalent application Agent boundary are declared | No missing-boundary finding, subject to evidence completeness |
| Human boundary exists; protected terminal effect occurs; no equivalent application boundary; no correlated client approval | Parity FAIL; this is a demonstrated semantic safety violation |
| Human boundary exists; mutation-capable tool is only exposed; no protected effect is invoked; client behavior is unknown | Parity WARN, labeled `CONTRACT-LEVEL FINDING / CLIENT-RUNTIME UNRESOLVED`; not a confirmed application defect |
| Human boundary exists; protected effect occurs after a correlated client approval; application boundary is not declared | Parity WARN with separate `CLIENT-RUNTIME APPROVED` evidence; do not claim the application declared a safe boundary |
| Only a policy rejection or a temporary hold is observed | Do not treat it as confirmation evidence |
| Evidence is incomplete and cannot link approval to invocation | WARN/UNRESOLVED; do not use final state as proof of the missing link |

This preserves the Subly BROKEN failure while making Kurio and Mabel’s contract-level questions honest. The X-Ray should be able to display:

```text
Application-declared boundary: not established
Client-runtime approval: observed
Effective execution path: approval occurred before terminal effect
```

The first line must not be rewritten to “boundary present” just because the second line exists.

## 11. Conditional-effect and policy-outcome design

This is the highest-confidence new correctness requirement because Tagboard supplies the same successful invocation with two different policy/domain outcomes.

### 11.1 Contract representation

Keep v1 `declaredEffects` for compatibility. Add v2 `effectClaims` so an application can state:

```text
tool: add_note
effect: note_stored
certainty: conditional
phase: terminal
conditionId: moderation-allow
```

The condition identifier is opaque. PARALLAX does not infer what “moderation” means.

### 11.2 Runtime representation

The same invocation can report:

```text
technicalStatus: success
policyEvidence.decision: allow | reject
effectOutcomes[].outcome: occurred | prevented
```

The Core must derive the technical, policy, and domain relationship without introducing a top-level Policy status:

| Technical | Policy | Domain effect | Core interpretation |
|---|---|---|---|
| success | allow | occurred | effect fulfilled; eligible for PASS if no other finding |
| success | reject | prevented | not a technical failure; goal FAIL only if the effect was explicitly required, otherwise explicit PASS/WARN according to the contract |
| success | unresolved | unresolved | WARN; missing policy/effect evidence is not PASS |
| error | any | any | Technical FAIL; semantic result follows existing technical dominance, without converting policy into a technical explanation |

### 11.3 Tagboard acceptance

The v2 report must show:

```text
add_note invoked
→ Technical PASS
→ Policy ALLOW
→ note_stored OCCURRED
```

### 11.4 Tagboard rejection

The v2 report must show:

```text
add_note invoked successfully
→ Technical PASS
→ Policy REJECT
→ note_stored PREVENTED
→ no retry / no rewrite
```

If the v2 adapter explicitly declares `note_stored` required for that goal, the result is `Intent FAIL / Semantic FAIL` because the requested domain outcome was not achieved. If the adapter does not declare it required, the result remains non-failing at the goal lens but is no longer indistinguishable from the accepted case. In both versions, rejection is never relabeled as Technical FAIL, forbidden-effect violation, or missing evidence without supporting evidence.

Policy evidence belongs in the Execution/Evidence model and semantic derivation. It is not a new top-level status and is not a confirmation boundary.

## 12. Surface Relation design

The smallest useful representation is a per-capability or per-workflow relation in the Developer Contract:

```text
humanActionIds: [observe-clues]
agentToolNames: [search_archive_records, lookup_manifest, decode_document, query_timeline]
relation: COMPLEMENTARY
source: developer-assertion
```

Design decisions:

- Declare the relation at the narrowest meaningful group, not as a global application flag.
- `EQUIVALENT` and `COMPLEMENTARY` are sufficient for the Challenge. Do not add a complete relation algebra now.
- Absence of a relation means `UNRESOLVED`/not assessed. It must not be treated as `EQUIVALENT` or as proof of a defect.
- The Core does not ignore every mismatch when `COMPLEMENTARY` is present. It still evaluates forbidden effects, missing required actions, declared/observed contradictions, boundaries, and policy/effect outcomes.
- X-Ray displays `COMPLEMENTARY` in the Capability Matrix instead of rendering an intentional Human-only contribution as `Missing`.
- A relation must be backed by an explicit developer assertion or approved evidence. It cannot be inferred from a tool name or the absence of a matching tool.

For The Archive, this makes the positive-control claim explicit: Human clues and Agent archive tools are different contributions to one investigation. Surface difference is not automatically a parity defect.

## 13. Capability lifecycle design

The minimum lifecycle required before the Challenge is:

```text
EXPOSED
  → INVOKED
  → APPROVAL (optional, when an approval event is observed)
  → POLICY OUTCOME (optional, when a policy gate exists)
  → EFFECT OUTCOME (occurred / prevented / unresolved)
```

The following stages remain explicit but are not required fields for the first v2 slice because current adapters cannot populate them reliably:

```text
AUTHORIZED / DELEGATED / SELECTED
```

An exact invocation proves that a tool was invoked and is strong evidence of selection, but it does not prove prior delegation. A client approval event proves approval for the correlated action, not application delegation. A declared goal/guardrail provides authorization context, not a client permission event.

This is enough to fix the high-confidence cases:

- exposed checkout is not executed checkout in Kurio;
- Mabel’s client approval is separate from the application Agent boundary;
- Tagboard policy can prevent an effect after a successful invocation;
- Archive’s terminal action can be marked as workflow-terminal;
- Subly’s observed mutation remains an observed effect.

Do not create a dedicated `EffectiveAgentSurface` aggregate type for the Challenge. Derive the X-Ray projection from the Developer Contract plus lifecycle/boundary evidence. A separate aggregate would duplicate state, invite stale summaries, and imply more knowledge than the adapters have. Reconsider it after the lifecycle evidence is stable.

## 14. Goal versus workflow decision

Flat v1 `requiredActions` remains the goal-level compatibility field. V2 adds explicit optional workflow roles:

```text
requiredActions       = required for the stated goal
requiredEffects       = required domain outcomes, when explicitly declared
workflowActions       = actions in the declared end-to-end workflow
terminalActions       = actions that close or commit that workflow
completionTarget      = goal | workflow | both
```

This is P0 for the Archive and important for Mabel:

- Archive can declare four investigation actions as goal-required and `accuse_suspect` as workflow-terminal. A goal-only audit does not call accusation missing; a workflow audit can evaluate it as terminal.
- Mabel can retain check/hold/confirm as required workflow actions while marking the hold temporary and confirmation terminal.
- Kurio can keep add-to-cart as goal-required and checkout as a separately forbidden state-changing action.

`supportingActions` is deferred unless a fixture proves it is needed; it can be derived from `workflowActions - requiredActions` for the first slice. No role is inferred from natural-language text or tool names.

## 15. Provenance and correlation design

The minimum v2 provenance set is:

| Field | Required use | Optional when |
|---|---|---|
| `runId` | Identifies one audit/evidence collection | never omitted at bundle level |
| `invocationId` | Correlates tool result, policy, boundary, and effect outcome | absent only for incomplete historical evidence |
| `policyDecisionId` | Links a policy decision when the application exposes one | current Tagboard does not expose it |
| `effectObservationId` | Links duplicate/runtime/state-diff observations | multiple sources are unavailable |
| `source` | Preserves tool-result, state-diff, runtime, or developer provenance | legacy v1 source remains valid |
| `authority` / `origin` | Separates application, client-runtime, Human, and external observer claims | do not invent an authority for an unobserved field |
| `observedAt` | Orders events where the runtime supplies a timestamp | optional for captured records without timestamps |
| `mode` | Distinguishes live execution from captured fixture | required at bundle level |
| `completeness` | Distinguishes complete, partial, and unknown evidence | required at bundle level |

No telemetry backend, distributed tracing, or automatic confidence model is needed. A JSON record with stable IDs and explicit missing values is enough for the Challenge.

The evidence normalizer must reject or mark as unresolved a policy/effect relationship that lacks the required correlation. It must not connect a final page state to an earlier tool call merely because the names appear compatible.

## 16. Status aggregation decision

Keep the existing five top-level statuses:

```text
Intent
Parity
Agency
Technical
Semantic
```

Do not add a top-level Policy status. Policy outcome belongs inside evidence and semantic derivation because it is an observed event that can qualify domain outcome without replacing technical status.

Do not add a top-level Interoperability status. Client/runtime discovery or serialization failures belong in Technical evidence with a failure class and must not be relabeled as an application semantic defect.

Proposed aggregation:

- `Technical FAIL` remains a technical invocation error.
- `Technical PASS + Policy REJECT` remains technically successful.
- `Intent FAIL` occurs when an observed forbidden effect occurs or an explicitly required effect is proven prevented/missing.
- `Parity FAIL` occurs for a demonstrated protected effect without an application boundary or correlated approval; exposure-only boundary absence is a contract-level WARN.
- `Agency WARN` remains an exposure or effective-path observation, scoped to the lifecycle evidence.
- `Semantic FAIL` follows a supported intent/parity violation; `Semantic WARN` follows incomplete evidence or non-fatal asymmetry; otherwise `PASS`.

The policy and effect details must be visible even when the top-level semantic status remains PASS or WARN. This is how Tagboard rejection becomes distinguishable without making policy rejection a technical error.

## 17. X-Ray UI minimum delta

Keep the current dark X-Ray language, three-column layout, Human Surface, vertical trace, Agent Surface, Issues, Recommendations, Capability Matrix, and technical-versus-semantic contrast.

Only add the following correctness/clarity elements:

1. In the execution step, show a compact triad when available: `TECHNICAL PASS` / `POLICY REJECT` / `EFFECT PREVENTED`.
2. In the boundary row, distinguish `APPLICATION BOUNDARY` from `CLIENT APPROVAL`; show `not established`, `observed`, or `unresolved` explicitly.
3. In the Agent Surface, show `EXPOSED` separately from `INVOKED` for the active path. Do not label all discovered tools as delegated.
4. In the Capability Matrix, render an approved `COMPLEMENTARY` relation rather than a bare `Missing` row.
5. Keep `DECLARED → OBSERVED → DERIVED` as the primary evidence drill-down; do not put every provenance field in the primary screen.

The three-minute demo remains:

```text
Subly BROKEN → technical success / semantic failure
Subly FIXED  → same goal / no mutation / agency explanation
Tagboard     → accepted vs policy-rejected write, if v2 is green
```

The UI must not imply that Kurio has a confirmed safety defect or that Archive’s complementary surface is broken.

## 18. CLI v2 minimum delta

Keep the CLI thin and dependency-free.

- `check` accepts an explicit `version: 1 | 2` input envelope. Existing v1 JSON and exit semantics remain unchanged.
- V2 JSON output adds `modelVersion`, typed policy/effect/boundary outcomes, completeness, and scoped findings. It remains deterministic.
- Human output adds only concise policy/effect labels and evidence qualifiers; it does not import browser, DOM, React, WebMCP, Playground, or validation-matrix code.
- `diff` compares model-compatible fields: top-level statuses, semantic status, findings, path, and v2 typed outcomes. It must not compare unsupported tool-surface fields.
- Incompatible application/goal/version input returns exit `2`; semantic `FAIL` remains exit `1`; PASS/WARN remain exit `0`.
- No npm publishing, `bin`, `npx`, remote scanning, GitHub Actions, or CLI framework is added.

The v1 command remains the fallback even if v2 CLI support is incomplete.

## 19. Migration strategy

Use an explicit version envelope and a v1-to-v2 normalizer rather than rewriting historical fixtures.

```text
v1 JSON → normalizeV1ToV2() → v2 internal model → v2 audit
v2 JSON → validateV2()       → v2 internal model → v2 audit
```

Recommended rules:

1. V1 input remains accepted and produces the existing v1 result when run in v1 mode.
2. Legacy `observedEffects` become `EffectOutcome.outcome=occurred` only for the evidence that was actually observed; missing details remain unknown.
3. Legacy `declaredEffects` remain legacy declarations. The normalizer does not assert `guaranteed` certainty.
4. `executionComplete` maps to bundle completeness only as an explicit legacy claim; it does not create invocation IDs, policy outcomes, or client approvals.
5. V2 fixtures are new versioned records. Existing v1 records are immutable historical evidence.
6. A v1→v2 semantic diff reports changes caused by added evidence or model vocabulary, not a rewritten old result.
7. There is one thin CLI entry point with version dispatch; no second package or remote service is needed.

V2 production promotion is a separate decision after the full regression gate.

## 20. Expected v1 → v2 semantic-diff hypotheses

These are hypotheses to test, not hard-coded expected outputs:

| Case | Hypothesis | Validation condition |
|---|---|---|
| Subly BROKEN | Primary forbidden-mutation violation is preserved. | Same goal, same observed effects, Technical PASS remains distinct from Semantic FAIL. |
| Subly FIXED | Agency WARN remains as a scoped exposure warning or becomes more precise. | Purchase/cancel exposure is not confused with invocation or delegation. |
| Flight Search | Clean PASS remains possible. | No invented effects, boundaries, or policy failures. |
| Tagboard accepted | `add_note` is represented as Technical PASS → Policy ALLOW → `note_stored` OCCURRED. | Required correlation exists for the accepted write. |
| Tagboard rejected | Rejected path becomes distinguishable as Technical PASS → Policy REJECT → `note_stored` PREVENTED. | It is not relabeled as technical failure; Intent FAIL occurs only if `note_stored` is explicitly required. |
| Mabel’s Table | Temporary hold, terminal confirmation, and client approval become separate evidence. | Missing exact native trace remains partial/unknown; hold→confirm is not approval by itself. |
| The Archive | Complementarity removes the misleading Missing projection; agency becomes workflow-aware. | Relation and terminal role are explicitly declared; no blanket ignore. |
| Kurio | Boundary result is qualified and agency is exposure-scoped. | Checkout remains uninvoked; unresolved client behavior stays unresolved. |
| Order Tracking | Approved PASS remains; unsupported mutation is not reintroduced. | Historical interpretation remains visibly historical. |
| CineFlow / SkyHop | Existing warnings remain scoped to declared exposure or known path. | Checkout initiation is not upgraded to purchase/payment. |

## 21. Exact implementation order

The implementation, if authorized in the next gate, should follow this order:

1. Create an additive v2 branch/worktree and record the v1 baseline hashes.
2. Add v2 schema/types for contract, evidence, outcomes, boundaries, relations, and version envelopes.
3. Add v1 normalization into the v2 internal model without changing v1 output.
4. Add typed policy/effect outcomes and the minimum lifecycle events.
5. Implement the pure v2 Core rules and status aggregation.
6. Add unit tests for the new Core behavior before touching the UI.
7. Add versioned Subly, Flight Search, Tagboard, Mabel, Archive, Kurio, Order, CineFlow, and SkyHop fixtures/adapters as required.
8. Implement deterministic v1→v2 semantic diff.
9. Add only the WebMCP observation fields needed to capture native invocation, client approval, policy outcome, and effect outcome.
10. Add the minimal X-Ray projection for policy/effect/boundary/relation evidence.
11. Add thin CLI v2 validation and output support.
12. Run local full build and all semantic regressions.
13. Run production-candidate integration and visible UI checks.
14. Run fresh ChatGPT Work and Chrome/native WebMCP regressions.
15. Freeze v2 only if every P0/P1 gate is green; otherwise deploy the v1 fallback.

UI work intentionally comes after the model and tests.

## 22. Test plan

### 22.1 Pure Core tests

Add tests that use plain JSON/TypeScript data only:

- conditional `ALLOW` with an occurred effect;
- conditional `REJECT` with a prevented effect;
- technical success remains technical PASS for both policy outcomes;
- required effect prevented produces Intent/semantic FAIL only when explicitly declared required;
- observed forbidden effect still produces FAIL;
- missing/partial evidence produces WARN, never invented PASS;
- temporary effect is not terminal effect;
- terminal effect is not approval evidence;
- client boundary evidence never becomes application-declared boundary;
- explicit `COMPLEMENTARY` relation prevents a surface-difference false gap;
- workflow-terminal capability is not excess for a workflow-target audit;
- unnecessary exposed mutation remains a scoped Agency WARN;
- exact invocation is distinct from mere exposure;
- identical inputs produce byte-equivalent deterministic results.

### 22.2 Contract tests

Validate:

- `version: 1 | 2` dispatch;
- optional v2 fields and v1 compatibility;
- `EQUIVALENT | COMPLEMENTARY` validation;
- rejection of unsupported relation values;
- malformed `EffectOutcome` and `PolicyEvidence`;
- correlation requirements when policy/effect linkage is claimed;
- explicit missing/partial completeness;
- no natural-language inference or application-ID branch.

### 22.3 Corpus regression

Run every existing case without overwriting its v1 record:

```text
Subly BROKEN / FIXED
Flight Search
CineFlow
Order Tracking human-approved
Independent SkyHop
Kurio
Mabel’s Table
Tagboard accepted / rejected
The Archive
```

Record `v1 result → v2 result → reason` for every difference. The rejected Tagboard fixture must not become a technical failure. The Order Tracking correction must not regress to an unsupported mutation.

### 22.4 CLI tests

Add tests for:

- v2 `check` with valid conditional outcomes;
- v1 `check` unchanged;
- v2 `diff` and semantic outcome changes;
- JSON-only stdout and deterministic byte output;
- PASS/WARN/FAIL exit behavior;
- invalid version, malformed policy/effect outcome, missing correlation, and incompatible diff inputs;
- no browser/DOM/WebMCP import from the CLI.

### 22.5 Integration tests

Retain and extend checks for:

- production Site-tool/native discovery;
- PARALLAX tool names and schemas;
- `run_parity_audit` with a non-empty goal;
- structured result;
- visible execution-log update;
- application-scoped registry;
- reset, BROKEN, and FIXED reruns.

## 23. Production regression plan

After implementation, before promotion:

1. Run the local full test suite, typecheck, lint, build, and diff check.
2. Build a production candidate without changing the current v1 artifact.
3. Verify no console errors and no required asset failures.
4. Verify the current three-column X-Ray still renders.
5. Verify Subly BROKEN and FIXED with the same goal and visible evidence layers.
6. Verify Tagboard accepted/rejected rendering from captured fixtures without presenting either as fabricated live execution.
7. Verify boundary, policy, effect, lifecycle, and relation labels.
8. Verify existing production WebMCP registration/discovery/execution behavior is not regressed.
9. Only after all checks pass, decide whether to deploy v2. No deployment occurs in this planning gate.

## 24. ChatGPT Work regression plan

Use a fresh ChatGPT Work session with Site tools enabled as reproducibility guidance, not as a protocol requirement.

Verify:

- PARALLAX Site-tool discovery;
- exact tool names and count;
- direct `run_parity_audit` invocation;
- non-empty goal participation;
- structured result;
- execution-log update;
- no browser UI fallback for the validation claim;
- client approval evidence can be recorded separately where relevant;
- existing Luna failure and fresh-success records remain scoped to their sessions.

Do not claim Luna or Sol is universally required or unsupported. Do not turn a client serialization/runtime error into an application semantic result.

## 25. Chrome/native WebMCP regression plan

Use the known successful Chrome 151 environment and flags:

```text
--enable-features=WebMCP
--enable-blink-features=ModelContextAPI,ModelContextExecutorAPI
```

Verify:

- `document.modelContext` availability;
- native registration;
- native `getTools()` discovery distinct from local registry;
- native execution;
- required PARALLAX tools and schemas;
- BROKEN/FIXED result and visible UI update;
- application-scoped registry replacement;
- reset/rerun;
- no console errors or required asset failures.

Do not broaden browser compatibility before submission. Record the exact browser/runtime and any flags.

## 26. Challenge cut line

| Feature / change | Classification | Must ship by | Fallback if incomplete |
|---|---|---:|---|
| v2 version envelope, Contract/Evidence validation, and v1 normalizer | P0 | Sep 1, 12:00 JST | Keep v1 input/output and do not expose v2 |
| Tagboard conditional effect + policy outcome + occurred/prevented | P0 | Sep 1, 18:00 JST | v1 production; describe accepted/rejected as a documented v1 limitation |
| Client/application boundary separation and minimum approval evidence | P0 | Sep 1, 20:00 JST | Keep Kurio/Mabel as qualified contract/evidence observations |
| Lifecycle and goal/workflow roles | P0 | Sep 1, 20:00 JST | Keep Archive v1 warning and explicit limitation |
| Pure v2 Core and mandatory unit tests | P0 | Sep 1, 20:00 JST | v1 fallback |
| All mandatory fixture reruns and v1→v2 diff | P0 | Sep 2, 12:00 JST | No v2 production promotion |
| Minimal X-Ray policy/effect/boundary/relation projection | P1 | Sep 2, 16:00 JST | Use v1 production UI and narrow claims |
| Thin CLI v2 check/diff | P1 | Sep 2, 16:00 JST | Keep v1 CLI; no v2 CLI claim |
| Production candidate and no-console-error checks | P1 | Sep 2, 20:00 JST | v1 production artifact |
| ChatGPT Work regression | P1 | Sep 3, 10:00 JST | v1 demo and existing qualified evidence |
| Chrome/native WebMCP regression | P1 | Sep 3, 12:00 JST | v1 production artifact |
| WebMCP Extension regression if still valuable | P2 | Sep 3, 15:00 JST | Defer; do not risk native proof |
| Rich effective-surface aggregate, full lifecycle authority model, broad telemetry | P2 | post-Challenge | Defer |
| New external live validation and broad selector/matrix expansion | P2 | post-Challenge | Defer |
| npm/CI/SaaS/extension/scanner/crawler/inference/mobile/analytics | DO NOT BUILD | — | Defer |

**Code freeze:** Sep 3, 18:00 JST unless a P0 blocker is found. No v2 release may be called complete if it misses a P0/P1 check.

## 27. Fallback and rollback conditions

Fallback to the current v1 production artifact if any of the following occurs:

- Subly BROKEN no longer derives the primary forbidden-effect failure.
- Technical success is presented as semantic success.
- Flight Search becomes a spurious FAIL.
- Tagboard accepted/rejected cannot be distinguished without calling rejection technical failure.
- Mabel hold, terminal reservation, client approval, or missing trace are collapsed.
- Archive complementarity is rendered as a defect solely because the surfaces differ.
- Kurio’s unresolved client boundary is presented as a confirmed application safety defect.
- Order Tracking regresses to an unsupported mutation interpretation.
- production WebMCP registration, discovery, execution, reset, or visible audit update breaks.
- ChatGPT Work direct invocation regresses or requires an unrecorded fallback.
- v2 determinism fails.
- migration requires an application-specific Core exception.
- any v2 P0/P1 item cannot be fully regression-tested before freeze.
- the team cannot reproduce the exact production candidate used for the demo.

Rollback means selecting the last verified v1 production artifact and keeping the v2 branch/records unshipped. It does not mean rewriting or deleting v1 evidence.

## 28. Submission and demo impact

Do not rewrite submission materials in this planning gate. If v2 passes, the honest narrative can be:

> We started with a deterministic semantic parity model. Blind validation against unmodified third-party WebMCP apps exposed real missing concepts. We evolved the model generically rather than add app-specific exceptions.

Best proof order:

1. Subly BROKEN: `HTTP 200 / Technical PASS` beside `Semantic FAIL / Intent Violated`.
2. Subly FIXED: same goal, recommendation only, no mutation, with the Agency explanation.
3. Tagboard: same `add_note` invocation shape, `ALLOW / STORED` versus `REJECT / PREVENTED`, with both technical outcomes still successful.
4. One concise X-Ray callout for Archive `COMPLEMENTARY` and Kurio/Mabel boundary provenance.

External validation worth mentioning:

- Flight Search as the clean PASS control;
- Tagboard as the strongest accepted/rejected policy contrast;
- The Archive as the complementary-surface control;
- Kurio and Mabel as evidence that effective behavior spans application and client layers.

If v2 ships, the strengthened claim is that PARALLAX can represent more than direct technical errors: it can explain declared intent, runtime effects, application policy outcomes, and selected boundary evidence. The claim remains scoped by captured evidence and runtime support.

Claims that remain out of scope:

- universal client safety;
- proof of an application defect from a missing declared boundary alone;
- automatic inference from arbitrary natural-language goals;
- cross-origin scanning or automatic DOM understanding;
- security vulnerability detection;
- universal WebMCP/browser/model compatibility.

If v2 falls back, use the current v1 narrative and describe Tagboard policy/effect distinction and client boundaries as observed limitations, not as shipped v2 behavior.

## 29. Exact files expected to change in the implementation gate

The following are planning targets only. They are not modified now.

### New additive v2 Core files

- `lib/core/v2/contract.ts`
- `lib/core/v2/evidence.ts`
- `lib/core/v2/result.ts`
- `lib/core/v2/normalize.ts`
- `lib/core/v2/rules.ts`
- `lib/core/v2/audit.ts`
- `lib/core/v2/index.ts`
- `lib/core/v2/audit.test.ts`

All direct `lib/core/*.ts` v1 files remain the rollback baseline unless a later gate explicitly approves a different strategy.

### Evidence/integration files

- `lib/integration/webmcp/types.ts`
- `lib/integration/webmcp/observe.ts`
- `lib/integration/webmcp/execute.ts`
- `lib/integration/webmcp/discover.ts`
- `lib/integration/webmcp/support.ts`
- `lib/integration/parallaxTools.ts`
- `lib/integration/parallaxTools.test.ts`
- `lib/validation/types.ts`
- new versioned validation adapters under `lib/validation/v2/`

Only the fields needed for v2 evidence are added. No new dependency is expected.

### Playground, CLI, and X-Ray files

- `lib/playground/subly/` adapter additions only; preserve the v1 scenario source
- `scripts/parallax.mjs`
- `scripts/parallax.test.mjs`
- `app/parallax-app.tsx`
- `app/globals.css` only for minimal outcome/boundary labels
- `lib/audit.ts` only if it needs a versioned pure entry point

### New versioned documentation/records

- `docs/DEVELOPER_CONTRACT_V2_DRAFT.md`
- versioned v2 fixture/semantic-diff records under `docs/validation/`

Do not modify `docs/DEVELOPER_CONTRACT_V1.md`, existing validation records, the current Production Matrix, README marketing, or package dependencies in the implementation gate unless a separate approval explicitly changes that boundary.

## 30. Implementation-size estimate

For the additive minimal slice, not the deferred product platform:

| Area | Estimated net production LOC | Estimated test/fixture LOC |
|---|---:|---:|
| v2 contract, evidence, normalization, result, and Core | 300–450 | 180–280 |
| WebMCP observation and validation adapters | 100–180 | 60–100 |
| CLI version dispatch and diff | 80–140 | 100–160 |
| X-Ray wiring and labels | 80–140 | 20–40 |
| versioned docs/fixture metadata | 80–140 | — |
| **Total** | **640–1,050** | **360–580** |

Expected changed/new files: approximately 16–24, with no runtime or development dependency additions. The lower end assumes captured fixtures can be reused and no new native WebMCP behavior must be repaired. The upper end includes all mandatory case adapters and the minimal UI/CLI surface.

## 31. Best, realistic, and worst-case time estimate

| Scenario | Focused engineering | Validation / elapsed time | Outcome |
|---|---:|---:|---|
| Best case | 12–16 hours | 4–6 hours | Additive v2 slice, all mandatory fixtures, production/Work/Chrome checks, and freeze by Sep 3. |
| Realistic case | 20–28 hours | 6–10 hours | Feasible before deadline if no new external collection is required and v1 remains isolated. |
| Worst case | 36+ hours or an unresolved runtime block | 10+ hours | Do not ship partial v2; use the verified v1 production fallback and narrow claims. |

The risk is integration coupling, not the TypeScript volume: policy correlation, client approval provenance, native WebMCP behavior, and the X-Ray projection must agree before the result is demo-safe.

## 32. Recommendation on starting implementation immediately

**Yes—begin immediately after this plan is approved, but only as an additive, versioned, time-boxed implementation.**

Do not start implementation inside this planning gate. The next gate should begin with a separate branch/worktree, preserve the current v1 artifact, and enforce the Sep 1 20:00 JST P0 checkpoint. The first code slice should be the v2 schema/normalizer/Core plus Tagboard and Subly/Flight tests; UI work begins only after those pass.

This recommendation is conditional:

- If Tagboard accepted/rejected, Subly BROKEN, and Flight Search are green at the first checkpoint, continue to Mabel/Archive/Kurio and the minimal UI.
- If not, stop v2 work and prepare the v1 production submission. A partially migrated model creates more judging risk than the known, honestly scoped v1 limitation.

## 33. Explicit stop and defer list

This planning gate stops here. No implementation, Core v1 change, Contract v1 change, UI change, CLI behavior change, matrix update, README marketing rewrite, deploy, repository publicization, or Git-history rewrite has been performed.

Defer until separately authorized:

- all v2 implementation work described above;
- the dedicated `EffectiveAgentSurface` aggregate type;
- full `AUTHORIZED` / `DELEGATED` / `SELECTED` lifecycle telemetry;
- client permission/security prompt modeling;
- broad policy algebra or automatic policy interpretation;
- additional external live validation;
- full application selector/matrix expansion;
- npm publication, CI, SaaS, browser extension, URL scanner, crawler, automatic contract generation, LLM-based inference, mobile support, collaboration, analytics, and other non-goals.

The next gate, if authorized, is **PARALLAX v2 Minimal Implementation Gate**. v1 remains the verified fallback until that gate passes completely.
