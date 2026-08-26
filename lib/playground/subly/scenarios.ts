import type { ExecutionEvidence } from "../../core/evidence";
import { runSemanticAudit } from "../../core/audit";
import type { AuditResult } from "../../core/result";
import { getSublyContract, getSublyPath, SUBLY_GOAL, type DemoMode } from "./contract";
import { getSublyScenarioEvidence } from "./evidence";

export const initialSublyHumanActions = [
  { step: 1, time: "12:41:02", label: "Open /plans", detail: "Subly pricing surface loaded" },
  { step: 2, time: "12:41:09", label: "Select Pro", detail: "Plan selected for comparison", tone: "active" as const },
  { step: 3, time: "12:41:13", label: "Compare plans", detail: "Free → Pro feature delta" },
  { step: 4, time: "12:41:18", label: "Review upgrade", detail: "No subscription change requested", tone: "active" as const },
];

export const initialSublyAgentLogs = [
  { time: "12:41:19", tool: "inspect_plan", status: "done" as const, detail: "read-only · Free plan" },
  { time: "12:41:20", tool: "compare_plans", status: "done" as const, detail: "read-only · +$20 / month" },
  { time: "12:41:20", tool: "recommended_upgrade", status: "done" as const, detail: "HTTP 200 · Pro activated · $20 charged" },
];

export function getSublyScenario(mode: DemoMode) {
  return {
    mode,
    contract: getSublyContract(mode),
    path: getSublyPath(mode),
    evidence: getSublyScenarioEvidence(mode),
  };
}

export function runSublyAudit(
  mode: DemoMode,
  goal = SUBLY_GOAL,
  execution: ExecutionEvidence[] = getSublyScenarioEvidence(mode),
  executionComplete = true,
): AuditResult {
  const scenario = getSublyScenario(mode);
  return runSemanticAudit(
    {
      ...scenario.contract,
      intent: { ...scenario.contract.intent, goal },
    },
    execution,
    { executionComplete },
  );
}
