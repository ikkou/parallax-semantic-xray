import type { ExecutionEvidence } from "../../core/evidence";

export type ExecutionObserver = {
  record: (evidence: ExecutionEvidence) => void;
  clear: () => void;
  snapshot: () => ExecutionEvidence[];
};

export function createExecutionObserver(initial: ExecutionEvidence[] = []): ExecutionObserver {
  let entries = [...initial];

  return {
    record: (evidence) => {
      entries = [...entries, evidence];
    },
    clear: () => {
      entries = [];
    },
    snapshot: () => [...entries],
  };
}
