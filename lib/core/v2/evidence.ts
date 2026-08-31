import type { Effect } from "../contract";
import type {
  EvidenceSource,
  ExecutionEvidence,
  ObservedEffect,
} from "../evidence";

export type {
  EvidenceRecorder,
  EvidenceSource,
  ExecutionEvidence,
  ExecutionEvidenceOptions,
  ObservedEffect,
} from "../evidence";

export type EvidenceOrigin =
  | "application"
  | "client-runtime"
  | "human"
  | "external-observer";

export type EvidenceMode = "live-execution" | "captured-fixture";
export type EvidenceCompleteness = "complete" | "partial" | "unknown";

export type BoundaryEvidence = {
  origin: "human" | "application-agent" | "client-runtime";
  type: "review" | "confirmation" | "approval";
  status: "requested" | "approved" | "denied" | "not-observed";
  invocationId?: string;
  observedAt?: string;
  evidenceSource: EvidenceSource | "client-runtime";
};

export type PolicyEvidence = {
  decision: "allow" | "reject" | "rate_limit" | "unresolved";
  source: "application-policy" | "client-runtime";
  invocationId?: string;
  policyDecisionId?: string;
  observedAt?: string;
};

export type EffectOutcome = {
  effect: Effect;
  outcome: "occurred" | "prevented" | "unresolved";
  phase?: "temporary" | "terminal" | "unspecified";
  invocationId?: string;
  effectObservationId?: string;
  source: EvidenceSource | "client-runtime" | "application-policy";
  detail?: string;
};

export type ExecutionEvidenceV2 = ExecutionEvidence & {
  invocationId?: string;
  observedAt?: string;
  origin?: EvidenceOrigin;
  boundaryEvidence?: BoundaryEvidence[];
  policyEvidence?: PolicyEvidence;
  effectOutcomes?: EffectOutcome[];
};

export type EvidenceBundleV2 = {
  version: 2;
  runId: string;
  mode: EvidenceMode;
  completeness: EvidenceCompleteness;
  applicationId: string;
  entries: ExecutionEvidenceV2[];
};

export type LegacyEvidenceInput = ExecutionEvidence[];

export type NormalizedObservedEffect = ObservedEffect & {
  outcome: "occurred";
  phase: "unspecified";
};
