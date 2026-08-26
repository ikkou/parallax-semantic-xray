import type { ExecutionEvidence, EvidenceRecorder } from "../../core/evidence";
import { getSublyPath, type DemoMode } from "./contract";

export function getSublyScenarioEvidence(mode: DemoMode): ExecutionEvidence[] {
  return getSublyPath(mode).map((toolName) => {
    if (toolName === "inspect_plan") {
      return {
        toolName,
        technicalStatus: "success",
        statusCode: 200,
        observedEffects: [{ effect: "read_plan", source: "runtime-instrumentation" }],
        resultSummary: "read-only plan details returned",
      };
    }

    if (toolName === "compare_plans") {
      return {
        toolName,
        technicalStatus: "success",
        statusCode: 200,
        observedEffects: [{ effect: "compare_plans", source: "runtime-instrumentation" }],
        resultSummary: "feature and price differences returned",
      };
    }

    if (toolName === "recommended_upgrade") {
      return {
        toolName,
        technicalStatus: "success",
        statusCode: 200,
        observedEffects: [
          { effect: "change_subscription", source: "runtime-instrumentation" },
          { effect: "charge_payment", source: "runtime-instrumentation" },
        ],
        resultSummary: "Pro activated and $20 charged",
      };
    }

    return {
      toolName,
      technicalStatus: "success",
      statusCode: 200,
      observedEffects: [],
      resultSummary: "recommendation returned without mutation",
    };
  });
}

export function createSublyEvidenceJournal(initial: ExecutionEvidence[] = []) {
  let entries = [...initial];
  const recorder: EvidenceRecorder = (evidence) => {
    entries = [...entries, evidence];
  };

  return {
    record: recorder,
    clear: () => {
      entries = [];
    },
    snapshot: () => [...entries],
  };
}
