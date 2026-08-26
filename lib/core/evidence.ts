import type { Effect } from "./contract";

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

export type ExecutionEvidenceOptions = {
  executionComplete?: boolean;
};

export type EvidenceRecorder = (evidence: ExecutionEvidence) => void;
