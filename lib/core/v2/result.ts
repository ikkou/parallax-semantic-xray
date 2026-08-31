import type { EvidenceSource, ExecutionEvidenceV2, EffectOutcome, BoundaryEvidence, EvidenceCompleteness, EvidenceMode, PolicyEvidence } from "./evidence";
import type { SurfaceRelation } from "./contract";
import type { FindingRule, Lens, StageStatus } from "../result";

export type FindingRuleV2 = FindingRule | "missing-required-effect";

export type FindingScope = "contract" | "exposed" | "effective-path" | "runtime";

export type GapV2 = {
  id: string;
  type: Lens;
  rule: FindingRuleV2;
  severity: "low" | "medium" | "high";
  status: "warning" | "fail";
  title: string;
  explanation: string;
  evidence: string[];
  declared?: string[];
  observed?: string[];
  scope?: FindingScope;
  qualification?: string;
};

export type RecommendationV2 = {
  priority: "P0" | "P1" | "P2";
  rule: FindingRuleV2;
  title: string;
  detail: string;
  rationale: string;
};

export type CapabilityRowV2 = {
  capability: string;
  human: boolean;
  agent: boolean;
  alignment: "Aligned" | "Misaligned" | "Missing";
  gap: string;
  relation?: "EQUIVALENT" | "COMPLEMENTARY" | "UNRESOLVED";
};

export type TraceEvidenceV2 = {
  layer: "declared" | "observed" | "derived";
  label: string;
  value: string;
  source?: EvidenceSource | "client-runtime" | "application-policy";
};

export type TraceStepV2 = {
  type:
    | "human-intent"
    | "agent-interpretation"
    | "tool-selection"
    | "tool-contract"
    | "execution-result"
    | "semantic-outcome";
  label: string;
  detail: string;
  status: StageStatus;
  meta?: string;
  evidence?: TraceEvidenceV2[];
};

export type PolicyOutcomeRecord = PolicyEvidence & { toolName: string };
export type EffectOutcomeRecord = EffectOutcome & { toolName: string };
export type BoundaryEvidenceRecord = BoundaryEvidence & { toolName?: string };

export type AuditResultV2 = {
  modelVersion: 2;
  runId: string;
  applicationId: string;
  goal: string;
  statuses: Record<Lens, StageStatus>;
  technicalStatus: StageStatus;
  semanticStatus: StageStatus;
  steps: TraceStepV2[];
  gaps: GapV2[];
  recommendations: RecommendationV2[];
  matrix: CapabilityRowV2[];
  path: string[];
  execution: ExecutionEvidenceV2[];
  evidenceMode: EvidenceMode;
  evidenceCompleteness: EvidenceCompleteness;
  policyOutcomes: PolicyOutcomeRecord[];
  effectOutcomes: EffectOutcomeRecord[];
  boundaryEvidence: BoundaryEvidenceRecord[];
  surfaceRelations: SurfaceRelation[];
  evidenceQualifiers: string[];
};
