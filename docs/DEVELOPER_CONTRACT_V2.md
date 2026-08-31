# PARALLAX Developer Contract v2

Developer Contract v2 is the first versioned semantic input for the additive v2 Core. It keeps semantic actions and effects as opaque strings. The Core evaluates relationships between declared contract data and observed execution evidence; it does not infer meaning from the natural-language goal or from an application identifier.

## Contract

```ts
type SemanticAction = string;
type Effect = string;

type IntentContractV2 = {
  goal: string;
  requiredActions?: SemanticAction[];
  requiredEffects?: Effect[];
  forbiddenEffects: Effect[];
  workflowActions?: SemanticAction[];
  terminalActions?: SemanticAction[];
  completionTarget?: "goal" | "workflow" | "both";
};

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

type DeveloperContractV2 = {
  version: 2;
  applicationId: string;
  intent: IntentContractV2;
  humanSurface: {
    actions: Array<{
      id: string;
      action: SemanticAction;
      effects: Effect[];
      boundaryIds?: string[];
      effectClaims?: EffectClaim[];
    }>;
    boundaries: Array<{
      id: string;
      protectsEffects: Effect[];
      type: "review" | "confirmation";
    }>;
  };
  agentSurface: {
    tools: Array<{
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
      action: SemanticAction;
      declaredEffects: Effect[];
      effectClaims?: EffectClaim[];
      boundaryIds?: string[];
      capabilityRole?: "goal" | "supporting" | "workflow-terminal" | "optional";
      annotations?: { readOnlyHint?: boolean };
    }>;
    boundaries: Array<{
      id: string;
      protectsEffects: Effect[];
      type: "review" | "confirmation";
    }>;
  };
  surfaceRelations?: SurfaceRelation[];
};
```

`requiredEffects` is optional and must be explicitly chosen by an application adapter. It is never derived from `goal`. A workflow-terminal tool is not goal-required unless the contract's `completionTarget` says that workflow completion is being audited.

## Evidence envelope

```ts
type EvidenceBundleV2 = {
  version: 2;
  runId: string;
  mode: "live-execution" | "captured-fixture";
  completeness: "complete" | "partial" | "unknown";
  applicationId: string;
  entries: Array<{
    toolName: string;
    technicalStatus: "success" | "error";
    statusCode?: number;
    observedEffects: Array<{
      effect: Effect;
      source: "runtime-instrumentation" | "state-diff" | "tool-result" | "developer-assertion";
      detail?: string;
    }>;
    invocationId?: string;
    origin?: "application" | "client-runtime" | "human" | "external-observer";
    policyEvidence?: {
      decision: "allow" | "reject" | "rate_limit" | "unresolved";
      source: "application-policy" | "client-runtime";
      invocationId?: string;
      policyDecisionId?: string;
    };
    effectOutcomes?: Array<{
      effect: Effect;
      outcome: "occurred" | "prevented" | "unresolved";
      phase?: "temporary" | "terminal" | "unspecified";
      invocationId?: string;
      source: "runtime-instrumentation" | "state-diff" | "tool-result" | "developer-assertion" | "client-runtime" | "application-policy";
    }>;
    boundaryEvidence?: Array<{
      origin: "human" | "application-agent" | "client-runtime";
      type: "review" | "confirmation" | "approval";
      status: "requested" | "approved" | "denied" | "not-observed";
      invocationId?: string;
      evidenceSource: "runtime-instrumentation" | "state-diff" | "tool-result" | "developer-assertion" | "client-runtime";
    }>;
  }>;
};
```

The three evidence layers remain separate:

```text
DECLARED  Contract, intent, tool claims, and application boundaries
OBSERVED  Technical invocation, runtime effects, policy outcomes, and client events
DERIVED   PARALLAX findings, statuses, trace, and recommendations
```

An application boundary is not created by a client-runtime approval. A policy rejection is not a technical error. Missing correlation remains unresolved rather than being inferred from names or page state.

## Core interface and rules

The pure interface is:

```ts
runSemanticAuditV2(
  contract: DeveloperContractV2,
  evidence: EvidenceBundleV2,
): AuditResultV2;
```

The required generic findings are:

1. `forbidden-effect` — an explicitly forbidden effect occurred.
2. `missing-required-action` — complete evidence proves a required goal/workflow action is absent; incomplete evidence yields WARN.
3. `declaration-observation-mismatch` — a read-only or effect declaration contradicts observed behavior.
4. `missing-confirmation-boundary` — a protected effect lacks an equivalent application boundary, qualified by observed client approval and evidence completeness.
5. `semantic-overloading` — an Agent tool crosses a Human Surface boundary that the contract explicitly separates.
6. `excess-agency` — unnecessary state-changing capability is exposed, with exposure and effective-path scope kept distinct.

The optional `requiredEffects` field is evaluated as `missing-required-effect` when the developer explicitly declares a required domain outcome. This is contract-driven and remains separate from technical status.

Top-level statuses remain `Intent`, `Parity`, `Agency`, `Technical`, and `Semantic`. `PASS` requires sufficient evidence and no supported violation; `WARN` records incomplete evidence or a non-fatal qualified asymmetry; `FAIL` requires observed or sufficiently explicit violating evidence.

## v1 migration

The v1 files remain immutable and callable through the v1 interface. `normalizeV1Contract` and `normalizeV1Evidence` create an internal v2-compatible representation only when requested. Legacy observed effects become `occurred` outcomes with their original provenance; the normalizer does not create invocation IDs, policy outcomes, client approvals, or guaranteed effect claims.

The implementation is additive under `lib/core/v2/`. The v1 Core hash and `docs/DEVELOPER_CONTRACT_V1.md` remain the fallback baseline.

## Local CLI

The existing dependency-free CLI accepts v2 JSON files explicitly:

```sh
npm run parallax -- check --v2 --contract contract.v2.json --evidence evidence.v2.json --json
npm run parallax -- diff before.audit.json after.audit.json --json
```

`check` recomputes the result from Contract plus Evidence. It does not consume a stored `auditResult`. `diff` compares statuses, findings, path, observed effects, and typed v2 outcomes; it does not compare a declared tool surface.
