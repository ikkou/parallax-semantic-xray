import type { EvidenceSource, ExecutionEvidence } from "./evidence";

export type Lens = "intent" | "parity" | "agency";
export type StageStatus = "pass" | "warning" | "fail";
export type FindingRule =
  | "forbidden-effect"
  | "missing-required-action"
  | "declaration-observation-mismatch"
  | "missing-confirmation-boundary"
  | "semantic-overloading"
  | "excess-agency";

export type Gap = {
  id: string;
  type: Lens;
  rule: FindingRule;
  severity: "low" | "medium" | "high";
  status: "warning" | "fail";
  title: string;
  explanation: string;
  evidence: string[];
  declared?: string[];
  observed?: string[];
};

export type Recommendation = {
  priority: "P0" | "P1" | "P2";
  rule: FindingRule;
  title: string;
  detail: string;
  rationale: string;
};

export type CapabilityRow = {
  capability: string;
  human: boolean;
  agent: boolean;
  alignment: "Aligned" | "Misaligned" | "Missing";
  gap: string;
};

export type TraceStage =
  | "human-intent"
  | "agent-interpretation"
  | "tool-selection"
  | "tool-contract"
  | "execution-result"
  | "semantic-outcome";

export type EvidenceLayer = "declared" | "observed" | "derived";

export type TraceEvidence = {
  layer: EvidenceLayer;
  label: string;
  value: string;
  source?: EvidenceSource;
};

export type TraceStep = {
  type: TraceStage;
  label: string;
  detail: string;
  status: StageStatus;
  meta?: string;
  evidence?: TraceEvidence[];
};

export type AuditResult = {
  applicationId: string;
  goal: string;
  statuses: Record<Lens, StageStatus>;
  technicalStatus: StageStatus;
  semanticStatus: StageStatus;
  steps: TraceStep[];
  gaps: Gap[];
  recommendations: Recommendation[];
  matrix: CapabilityRow[];
  path: string[];
  execution: ExecutionEvidence[];
};
