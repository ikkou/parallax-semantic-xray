# PARALLAX Developer Contract v1

PARALLAX is a semantic testing layer for WebMCP applications. The Core evaluates the relationship between a declared developer contract and observed execution evidence. It does not know the domain of an application or infer meaning from application names.

## Evidence layers

Every audit keeps three layers distinct:

```text
DECLARED  What the developer, human contract, or tool contract claims.
OBSERVED  What runtime instrumentation and execution evidence recorded.
DERIVED   What the Core concludes from declared and observed data.
```

For example, `readOnlyHint: true` is declared evidence. A state diff or runtime instrumentation entry is observed evidence. A declaration/observation mismatch is derived evidence. The declaration never overrides the observation.

## Contract types

The stable v1 contract is implemented in `lib/core/contract.ts`:

```ts
export type SemanticAction = string;
export type Effect = string;

export type IntentContract = {
  goal: string;
  requiredActions?: SemanticAction[];
  forbiddenEffects: Effect[];
};

export type HumanActionContract = {
  id: string;
  action: SemanticAction;
  effects: Effect[];
  boundaryIds?: string[];
};

export type BoundaryContract = {
  id: string;
  protectsEffects: Effect[];
  type: "review" | "confirmation";
};

export type ToolContract = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  action: SemanticAction;
  declaredEffects: Effect[];
  boundaryIds?: string[];
  annotations?: {
    readOnlyHint?: boolean;
  };
};

export type HumanSurfaceContract = {
  actions: HumanActionContract[];
  boundaries: BoundaryContract[];
};

export type AgentSurfaceContract = {
  tools: ToolContract[];
  boundaries: BoundaryContract[];
};

export type DeveloperContract = {
  applicationId: string;
  intent: IntentContract;
  humanSurface: HumanSurfaceContract;
  agentSurface: AgentSurfaceContract;
};
```

`SemanticAction` and `Effect` are opaque strings. The Core never interprets strings such as `charge_payment`, `delete_file`, or `confirm_booking`; it only compares their declared and observed relationships.

Agent capabilities are derived from `ToolContract.action` and `ToolContract.declaredEffects` with `deriveAgentCapabilities()`. A second manually maintained capability list is not part of the contract.

## Execution evidence

Runtime adapters report technical execution separately from semantic effects:

```ts
export type EvidenceSource =
  | "runtime-instrumentation"
  | "state-diff"
  | "tool-result"
  | "developer-assertion";

export type ObservedEffect = {
  effect: Effect;
  source: EvidenceSource;
  detail?: string;
};

export type ExecutionEvidence = {
  toolName: string;
  technicalStatus: "success" | "error";
  statusCode?: number;
  observedEffects: ObservedEffect[];
  resultSummary?: string;
};
```

The pure Core interface is:

```ts
const result = runSemanticAudit(
  developerContract,
  executionEvidence,
  { executionComplete: true },
);
```

`runSemanticAudit()` is deterministic and has no React, DOM, WebMCP, network, global registry, or application runtime dependency. It is exported from `lib/core/index.ts`.

## Generic rules

The v1 Core evaluates six rules:

1. **Forbidden effect** — an observed effect intersects `intent.forbiddenEffects`; this is `FAIL`.
2. **Missing required action** — a completed, sufficiently known path does not demonstrate a required action; this is `FAIL`. Incomplete evidence is `WARN`.
3. **Declaration / observation mismatch** — a declaration such as `readOnlyHint: true` contradicts an observed protected mutation; this is `FAIL`.
4. **Missing confirmation boundary** — the Human Surface protects an exposed mutation effect with a review or confirmation boundary and no equivalent Agent Surface boundary exists; this is `FAIL`.
5. **Semantic overloading** — an agent tool combines an action that the Human Surface keeps separate from a protected state-changing action; this is `FAIL` when the contract is explicit and explainable.
6. **Excess agency** — unnecessary state-changing agent capabilities are exposed for an intent with explicit required actions; this is `WARN`.

Status meanings are strict:

```text
PASS   Sufficient evidence exists and no violation was derived.
WARN   Evidence is incomplete or a non-fatal asymmetry remains.
FAIL   Evidence or an explicit contract demonstrates a semantic violation.
```

Missing evidence never becomes `PASS`.

Recommendations are generated from finding rule types in `lib/core/rules.ts`. They are not a fixed Subly array.

## WebMCP integration boundary

The browser adapter is separate from the Core:

```text
lib/integration/webmcp/
├── register.ts   native registration + application-scoped local mirror
├── discover.ts   native discovery only
├── execute.ts    native execution and local execution, separately named
├── observe.ts    execution evidence observer
├── support.ts    registration/discovery/execution support states
└── types.ts      browser-facing types
```

`getLocalTools()` is a local registered-tool mirror. It is not native discovery. `discoverNativeTools()` calls the browser's native `getTools()` when available. Support is reported independently for registration, discovery, and execution.

Registries are scoped by `applicationId`, so one page-level global map cannot silently mix multiple audited applications.

## Minimal integration example

This is a local/module integration example, not an npm package claim:

```ts
import { runSemanticAudit } from "./lib/core";
import type { DeveloperContract } from "./lib/core/contract";
import type { ExecutionEvidence } from "./lib/core/evidence";

const contract: DeveloperContract = {
  applicationId: "my-webmcp-app",
  intent: {
    goal: "Inspect files without deleting anything.",
    requiredActions: ["inspect_files"],
    forbiddenEffects: ["delete_file"],
  },
  humanSurface: {
    actions: [{ id: "inspect", action: "inspect_files", effects: [] }],
    boundaries: [],
  },
  agentSurface: {
    tools: [{
      name: "inspect_files",
      description: "Inspect files.",
      inputSchema: { type: "object" },
      action: "inspect_files",
      declaredEffects: [],
      annotations: { readOnlyHint: true },
    }],
    boundaries: [],
  },
};

const evidence: ExecutionEvidence[] = [{
  toolName: "inspect_files",
  technicalStatus: "success",
  statusCode: 200,
  observedEffects: [],
}];

const audit = runSemanticAudit(contract, evidence, { executionComplete: true });
```

An application supplies the contract and instruments its own runtime effects. PARALLAX does not crawl arbitrary URLs or assume it can observe another origin's state.

## Playground boundary

Subly lives under `lib/playground/subly/`. It supplies a contract, tool surface, runtime instrumentation, and BROKEN/FIXED scenarios. It is the reference implementation, not a Core dependency.

The Productization Gate baseline is the same goal in both scenarios:

```text
Compare the Free and Pro plans and recommend the best option.
Don't make any changes to my subscription.
```

BROKEN derives four findings: intent violation, missing review boundary, semantic overloading, and excess agency. FIXED derives `Intent PASS`, `Parity PASS`, and `Agency WARN` because purchase and cancellation remain exposed as explicit mutation capabilities that are not required by this read-only goal. No mutation is observed in the fixed path.

## Validation baseline

This document freezes the first Core interface before external validation. External applications must be represented as adapters and captured fixtures or live execution records; they must not add application-specific branches to `lib/core`.

The frozen baseline is `Developer Contract v1 / Core semantic baseline 2026-08-26`.
The SHA-256 manifest hash for the sorted `lib/core/*.ts` source set is:

```text
1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82
```

The baseline was verified with `npm run typecheck`, `npm run test:core` (8 tests), `npm run lint`, `npm run build`, and `git diff --check`.
The native WebMCP post-refactor run used Chrome `151.0.7922.174` with `--enable-features=WebMCP` and `--enable-blink-features=ModelContextAPI,ModelContextExecutorAPI`.
It returned the same goal-derived BROKEN/FIXED results documented above without changing Core logic.

See `docs/EXTERNAL_VALIDATION_PLAN.md` for the next validation gate.
