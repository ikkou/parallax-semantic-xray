import type {
  BoundaryContract,
  DeveloperContract,
  Effect,
  HumanActionContract,
  ToolContract,
} from "./contract";
import type { ExecutionEvidence, ExecutionEvidenceOptions } from "./evidence";
import { deriveRecommendations, evaluateRules, getProtectedEffects } from "./rules";
import type { AuditResult, CapabilityRow, Gap, Lens, StageStatus } from "./result";
import { buildTrace } from "./trace";

function overlaps(left: string[], right: string[]) {
  return left.some((value) => right.includes(value));
}

function covers(left: string[], right: string[]) {
  return right.every((value) => left.includes(value));
}

function actionHasHumanBoundary(contract: DeveloperContract, action: HumanActionContract) {
  return (action.boundaryIds ?? []).some((id) =>
    contract.humanSurface.boundaries.some((boundary) => boundary.id === id),
  );
}

function toolHasEquivalentBoundary(
  contract: DeveloperContract,
  tool: ToolContract,
  effects: Effect[],
) {
  const linkedBoundaries = contract.agentSurface.boundaries.filter((boundary) =>
    (tool.boundaryIds ?? []).includes(boundary.id),
  );
  return linkedBoundaries.some((boundary) => covers(boundary.protectsEffects, effects));
}

function boundaryHasEquivalentAgentBoundary(contract: DeveloperContract, boundary: BoundaryContract) {
  return contract.agentSurface.boundaries.some((candidate) =>
    covers(candidate.protectsEffects, boundary.protectsEffects),
  );
}

function buildCapabilityMatrix(contract: DeveloperContract): CapabilityRow[] {
  const protectedEffects = Array.from(getProtectedEffects(contract));
  const rows: CapabilityRow[] = [];
  const seenActions = new Set<string>();

  for (const action of contract.humanSurface.actions) {
    if (seenActions.has(action.action)) continue;
    seenActions.add(action.action);

    const matchingTools = contract.agentSurface.tools.filter((tool) => tool.action === action.action);
    const effectMatchingTools = contract.agentSurface.tools.filter((tool) =>
      overlaps(tool.declaredEffects, action.effects),
    );
    const protectedAction = overlaps(action.effects, protectedEffects) && actionHasHumanBoundary(contract, action);
    const agentBoundary = [...matchingTools, ...effectMatchingTools].some((tool) =>
      toolHasEquivalentBoundary(contract, tool, action.effects),
    );
    const equivalentBoundary = (action.boundaryIds ?? []).some((id) => {
      const humanBoundary = contract.humanSurface.boundaries.find((boundary) => boundary.id === id);
      return humanBoundary ? boundaryHasEquivalentAgentBoundary(contract, humanBoundary) : false;
    });
    const agentAvailable = matchingTools.length > 0 || effectMatchingTools.length > 0 || equivalentBoundary;
    const aligned = agentAvailable && (!protectedAction || agentBoundary);

    rows.push({
      capability: action.label ?? action.action,
      human: true,
      agent: agentAvailable,
      alignment: !agentAvailable ? "Missing" : aligned ? "Aligned" : "Misaligned",
      gap: !agentAvailable
        ? "No equivalent agent capability"
        : !aligned
          ? "No equivalent agent review or confirmation boundary"
          : "—",
    });
  }

  for (const boundary of contract.humanSurface.boundaries.filter((item) => item.type === "review")) {
    if (contract.humanSurface.actions.some((action) => action.boundaryIds?.includes(boundary.id))) continue;
    const agentAvailable = boundaryHasEquivalentAgentBoundary(contract, boundary);
    rows.push({
      capability: boundary.label ?? boundary.id,
      human: true,
      agent: agentAvailable,
      alignment: agentAvailable ? "Aligned" : "Missing",
      gap: agentAvailable ? "—" : "No equivalent agent review or confirmation boundary",
    });
  }

  return rows;
}

function calculateLensStatuses(gaps: Gap[]): Record<Lens, StageStatus> {
  const lenses: Lens[] = ["intent", "parity", "agency"];
  return Object.fromEntries(
    lenses.map((lens) => {
      const lensGaps = gaps.filter((gap) => gap.type === lens);
      const status = lensGaps.some((gap) => gap.status === "fail")
        ? "fail"
        : lensGaps.length > 0
          ? "warning"
          : "pass";
      return [lens, status];
    }),
  ) as Record<Lens, StageStatus>;
}

function calculateTechnicalStatus(execution: ExecutionEvidence[]): StageStatus {
  if (execution.length === 0) return "warning";
  return execution.some((entry) => entry.technicalStatus === "error") ? "fail" : "pass";
}

function calculateSemanticStatus(
  statuses: Record<Lens, StageStatus>,
  technicalStatus: StageStatus,
): StageStatus {
  if (technicalStatus === "fail") return "fail";
  if (technicalStatus === "warning") return "warning";
  if (statuses.intent === "fail" || statuses.parity === "fail") return "fail";
  if (statuses.intent === "warning" || statuses.parity === "warning" || statuses.agency === "warning") {
    return "warning";
  }
  return "pass";
}

export function runSemanticAudit(
  contract: DeveloperContract,
  execution: ExecutionEvidence[],
  options: ExecutionEvidenceOptions = {},
): AuditResult {
  const gaps = evaluateRules(contract, execution, options);
  const statuses = calculateLensStatuses(gaps);
  const technicalStatus = calculateTechnicalStatus(execution);
  const semanticStatus = calculateSemanticStatus(statuses, technicalStatus);

  return {
    applicationId: contract.applicationId,
    goal: contract.intent.goal,
    statuses,
    technicalStatus,
    semanticStatus,
    steps: buildTrace(contract, execution, gaps, technicalStatus, semanticStatus),
    gaps,
    recommendations: deriveRecommendations(gaps),
    matrix: buildCapabilityMatrix(contract),
    path: execution.map((entry) => entry.toolName),
    execution,
  };
}
