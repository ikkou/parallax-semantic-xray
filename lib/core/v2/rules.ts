import type {
  BoundaryContract,
  DeveloperContractV2,
  Effect,
  HumanActionContractV2,
  ToolContractV2,
} from "./contract";
import type {
  EffectOutcome,
  EvidenceBundleV2,
  ExecutionEvidenceV2,
} from "./evidence";
import type {
  FindingRuleV2,
  GapV2,
  RecommendationV2,
} from "./result";
import type { Lens } from "../result";

type GapCounters = Record<Lens, number>;

export type EffectRecord = EffectOutcome & { toolName: string };

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function overlaps(left: string[], right: string[]) {
  return left.some((value) => right.includes(value));
}

function covers(left: string[], right: string[]) {
  return right.every((value) => left.includes(value));
}

function formatList(values: string[]) {
  return values.length > 0 ? values.join(", ") : "none";
}

function getTool(contract: DeveloperContractV2, name: string) {
  return contract.agentSurface.tools.find((tool) => tool.name === name);
}

export function getDeclaredEffects(tool: ToolContractV2) {
  return unique([
    ...tool.declaredEffects,
    ...(tool.effectClaims ?? []).map((claim) => claim.effect),
  ]);
}

function getHumanEffects(action: HumanActionContractV2) {
  return unique([
    ...action.effects,
    ...(action.effectClaims ?? []).map((claim) => claim.effect),
  ]);
}

export function getProtectedEffects(contract: DeveloperContractV2) {
  return new Set(
    unique([
      ...contract.intent.forbiddenEffects,
      ...contract.humanSurface.boundaries.flatMap((boundary) => boundary.protectsEffects),
      ...contract.agentSurface.tools
        .filter((tool) => tool.annotations?.readOnlyHint !== true)
        .flatMap(getDeclaredEffects),
    ]),
  );
}

export function getEntryEffectRecords(entry: ExecutionEvidenceV2): EffectRecord[] {
  if (entry.effectOutcomes !== undefined) {
    return entry.effectOutcomes.map((outcome) => ({
      ...outcome,
      toolName: entry.toolName,
    }));
  }

  return entry.observedEffects.map((observed) => ({
    toolName: entry.toolName,
    effect: observed.effect,
    outcome: "occurred" as const,
    phase: "unspecified" as const,
    source: observed.source,
    ...(observed.detail === undefined ? {} : { detail: observed.detail }),
  }));
}

function allEffectRecords(execution: ExecutionEvidenceV2[]) {
  return execution.flatMap(getEntryEffectRecords);
}

function makeGap(
  counters: GapCounters,
  type: Lens,
  rule: FindingRuleV2,
  severity: GapV2["severity"],
  status: GapV2["status"],
  title: string,
  explanation: string,
  evidence: string[],
  declared?: string[],
  observed?: string[],
  scope?: GapV2["scope"],
  qualification?: string,
): GapV2 {
  counters[type] += 1;
  return {
    id: `${type}-${String(counters[type]).padStart(3, "0")}`,
    type,
    rule,
    severity,
    status,
    title,
    explanation,
    evidence,
    ...(declared === undefined ? {} : { declared }),
    ...(observed === undefined ? {} : { observed }),
    ...(scope === undefined ? {} : { scope }),
    ...(qualification === undefined ? {} : { qualification }),
  };
}

function evaluateForbiddenEffects(
  contract: DeveloperContractV2,
  execution: ExecutionEvidenceV2[],
  counters: GapCounters,
) {
  const forbidden = new Set(contract.intent.forbiddenEffects);
  const violations = allEffectRecords(execution).filter(
    (record) => record.outcome === "occurred" && forbidden.has(record.effect),
  );
  if (violations.length === 0) return [];

  return [
    makeGap(
      counters,
      "intent",
      "forbidden-effect",
      "high",
      "fail",
      "INTENT VIOLATION",
      "Observed execution produced an effect that the user explicitly forbade.",
      [
        `Intent forbids: ${formatList(unique(violations.map((violation) => violation.effect)))}`,
        ...violations.map(
          (violation) =>
            `Observed: ${violation.toolName} → ${violation.effect} (${violation.source})`,
        ),
      ],
      unique(violations.map((violation) => `forbidden effect: ${violation.effect}`)),
      unique(
        violations.map(
          (violation) => `${violation.toolName} → ${violation.effect} (${violation.source})`,
        ),
      ),
      "runtime",
    ),
  ];
}

function requiredActionsForTarget(contract: DeveloperContractV2) {
  const requiredActions = contract.intent.requiredActions ?? [];
  if (contract.intent.completionTarget === undefined || contract.intent.completionTarget === "goal") {
    return unique(requiredActions);
  }
  return unique([
    ...requiredActions,
    ...(contract.intent.workflowActions ?? []),
    ...(contract.intent.terminalActions ?? []),
  ]);
}

function evaluateRequiredActions(
  contract: DeveloperContractV2,
  execution: ExecutionEvidenceV2[],
  evidence: EvidenceBundleV2,
  counters: GapCounters,
) {
  const requiredActions = requiredActionsForTarget(contract);
  if (requiredActions.length === 0) return [];

  const executedActions = new Set<string>();
  const unknownTools: string[] = [];
  for (const entry of execution) {
    const tool = getTool(contract, entry.toolName);
    if (!tool) unknownTools.push(entry.toolName);
    else executedActions.add(tool.action);
  }

  const missing = requiredActions.filter((action) => !executedActions.has(action));
  if (missing.length === 0) return [];

  const sufficientEvidence = evidence.completeness === "complete";
  const status = sufficientEvidence ? "fail" : "warning";
  const workflowOnly = (contract.intent.workflowActions ?? []).some((action) => missing.includes(action));
  return [
    makeGap(
      counters,
      "intent",
      "missing-required-action",
      sufficientEvidence ? "high" : "medium",
      status,
      "MISSING REQUIRED ACTION",
      sufficientEvidence
        ? "The completed execution evidence does not demonstrate every action required by the declared goal or workflow target."
        : "The available execution evidence is incomplete, so PARALLAX cannot determine whether every required action occurred.",
      [
        `Required actions: ${formatList(requiredActions)}`,
        `Observed actions: ${formatList(Array.from(executedActions))}`,
        `Missing: ${formatList(missing)}`,
        ...(workflowOnly ? ["Scope: workflow completion"] : ["Scope: goal completion"]),
        ...(unknownTools.length > 0 ? [`Unknown tools: ${formatList(unique(unknownTools))}`] : []),
      ],
      missing.map((action) => `required action: ${action}`),
      Array.from(executedActions).map((action) => `observed action: ${action}`),
      "runtime",
    ),
  ];
}

function evaluateRequiredEffects(
  contract: DeveloperContractV2,
  execution: ExecutionEvidenceV2[],
  evidence: EvidenceBundleV2,
  counters: GapCounters,
) {
  const requiredEffects = contract.intent.requiredEffects ?? [];
  if (requiredEffects.length === 0) return [];

  const records = allEffectRecords(execution);
  const missing = requiredEffects.filter(
    (effect) => !records.some((record) => record.effect === effect && record.outcome === "occurred"),
  );
  if (missing.length === 0) return [];

  const prevented = missing.filter((effect) =>
    records.some((record) => record.effect === effect && record.outcome === "prevented"),
  );
  const sufficientEvidence = evidence.completeness === "complete";
  return [
    makeGap(
      counters,
      "intent",
      "missing-required-effect",
      sufficientEvidence ? "high" : "medium",
      sufficientEvidence ? "fail" : "warning",
      "REQUIRED EFFECT NOT ACHIEVED",
      sufficientEvidence
        ? "The declared required domain outcome was not observed in the completed execution evidence."
        : "The evidence does not establish whether every declared required domain outcome was achieved.",
      [
        `Required effects: ${formatList(requiredEffects)}`,
        `Missing: ${formatList(missing)}`,
        ...(prevented.length > 0
          ? [`Prevented: ${formatList(prevented)}`]
          : []),
        ...records
          .filter((record) => missing.includes(record.effect))
          .map((record) => `${record.toolName} → ${record.effect} (${record.outcome})`),
      ],
      missing.map((effect) => `required effect: ${effect}`),
      records
        .filter((record) => missing.includes(record.effect))
        .map((record) => `${record.toolName} → ${record.effect} (${record.outcome})`),
      "runtime",
    ),
  ];
}

function evaluateDeclarationObservationMismatch(
  contract: DeveloperContractV2,
  execution: ExecutionEvidenceV2[],
  counters: GapCounters,
) {
  const protectedEffects = getProtectedEffects(contract);
  const mismatches = execution.flatMap((entry) => {
    const tool = getTool(contract, entry.toolName);
    if (!tool?.annotations?.readOnlyHint) return [];
    const declaredEffects = getDeclaredEffects(tool);
    return getEntryEffectRecords(entry)
      .filter(
        (record) =>
          record.outcome === "occurred" &&
          (protectedEffects.has(record.effect) || !declaredEffects.includes(record.effect)),
      )
      .map((record) => ({ tool, record }));
  });
  if (mismatches.length === 0) return [];

  return [
    makeGap(
      counters,
      "parity",
      "declaration-observation-mismatch",
      "high",
      "fail",
      "DECLARATION / OBSERVATION MISMATCH",
      "A tool declared itself read-only, but runtime evidence recorded an effect outside its declared read-only behavior.",
      [
        ...unique(mismatches.map(({ tool }) => `${tool.name}: readOnlyHint = true`)),
        ...unique(
          mismatches.map(
            ({ tool, record }) => `${tool.name}: observed ${record.effect} (${record.source})`,
          ),
        ),
      ],
      unique(mismatches.map(({ tool }) => `${tool.name}: readOnlyHint = true`)),
      unique(
        mismatches.map(
          ({ tool, record }) => `${tool.name} → ${record.effect} (${record.source})`,
        ),
      ),
      "runtime",
    ),
  ];
}

function getBoundaryGroups(boundaries: BoundaryContract[]) {
  const groups = new Map<string, { effects: string[]; boundaries: BoundaryContract[] }>();
  for (const boundary of boundaries) {
    const effects = unique(boundary.protectsEffects).sort();
    if (effects.length === 0) continue;
    const key = effects.join("|");
    const current = groups.get(key) ?? { effects, boundaries: [] };
    current.boundaries.push(boundary);
    groups.set(key, current);
  }
  return Array.from(groups.values());
}

function getNonDominatedBoundaryGroups(boundaries: BoundaryContract[]) {
  const groups = getBoundaryGroups(boundaries);
  return groups.filter((group, index) =>
    !groups.some(
      (candidate, candidateIndex) =>
        candidateIndex !== index &&
        candidate.effects.length > group.effects.length &&
        covers(candidate.effects, group.effects),
    ),
  );
}

function hasEquivalentAgentBoundary(contract: DeveloperContractV2, effects: Effect[]) {
  return contract.agentSurface.boundaries.some((boundary) =>
    covers(boundary.protectsEffects, effects),
  );
}

function getToolsProtectingEffects(contract: DeveloperContractV2, effects: Effect[]) {
  return contract.agentSurface.tools.filter((tool) => overlaps(getDeclaredEffects(tool), effects));
}

function hasClientApprovalForEntry(entry: ExecutionEvidenceV2, execution: ExecutionEvidenceV2[]) {
  const localApproval = entry.boundaryEvidence?.some(
    (boundary) =>
      boundary.origin === "client-runtime" &&
      (boundary.type === "approval" || boundary.type === "confirmation") &&
      boundary.status === "approved" &&
      (boundary.invocationId === undefined || boundary.invocationId === entry.invocationId),
  );
  if (localApproval) return true;
  if (entry.invocationId === undefined) return false;
  return execution.some((candidate) =>
    candidate.boundaryEvidence?.some(
      (boundary) =>
        boundary.origin === "client-runtime" &&
        (boundary.type === "approval" || boundary.type === "confirmation") &&
        boundary.status === "approved" &&
        boundary.invocationId === entry.invocationId,
    ),
  );
}

function evaluateMissingConfirmationBoundary(
  contract: DeveloperContractV2,
  execution: ExecutionEvidenceV2[],
  evidence: EvidenceBundleV2,
  counters: GapCounters,
) {
  const gaps: GapV2[] = [];
  const recordsByEntry = new Map(execution.map((entry) => [entry, getEntryEffectRecords(entry)]));

  for (const group of getNonDominatedBoundaryGroups(contract.humanSurface.boundaries)) {
    if (hasEquivalentAgentBoundary(contract, group.effects)) continue;

    const exposedTools = getToolsProtectingEffects(contract, group.effects);
    const observedEntries = execution.filter((entry) =>
      (recordsByEntry.get(entry) ?? []).some(
        (record) => record.outcome === "occurred" && record.phase !== "temporary" && group.effects.includes(record.effect),
      ),
    );
    const observedTools = observedEntries
      .map((entry) => getTool(contract, entry.toolName))
      .filter((tool): tool is ToolContractV2 => Boolean(tool));
    const involvedTools = Array.from(
      new Map([...exposedTools, ...observedTools].map((tool) => [tool.name, tool])).values(),
    );
    if (involvedTools.length === 0) continue;

    const humanBoundary = group.boundaries[0];
    const hasTerminalOccurrence = observedEntries.length > 0;
    const approvedEntries = observedEntries.filter((entry) => hasClientApprovalForEntry(entry, execution));
    const hasCorrelatedClientApproval = approvedEntries.length > 0;
    const completeTerminalEvidence = hasTerminalOccurrence && evidence.completeness === "complete";

    let status: GapV2["status"] = "warning";
    let severity: GapV2["severity"] = "medium";
    let explanation = "The Human Surface protects an effect, but the available evidence does not establish an equivalent application boundary.";
    let scope: GapV2["scope"] = "contract";
    let qualification: string | undefined = "CONTRACT-LEVEL FINDING / CLIENT-RUNTIME UNRESOLVED";

    if (hasTerminalOccurrence && hasCorrelatedClientApproval) {
      explanation = "A protected effect occurred after an observed client-runtime approval, but the application itself did not declare an equivalent boundary.";
      qualification = "CLIENT-RUNTIME APPROVED / APPLICATION BOUNDARY NOT ESTABLISHED";
      severity = "medium";
    } else if (completeTerminalEvidence) {
      status = "fail";
      severity = "high";
      explanation = "The completed evidence shows a protected terminal effect without an equivalent application boundary or correlated approval.";
      scope = "runtime";
      qualification = undefined;
    } else if (hasTerminalOccurrence) {
      explanation = "A protected effect was observed, but the evidence is incomplete or cannot correlate an approval event to the invocation.";
      qualification = "CONTRACT-LEVEL FINDING / CLIENT-RUNTIME UNRESOLVED";
    }

    gaps.push(
      makeGap(
        counters,
        "parity",
        "missing-confirmation-boundary",
        severity,
        status,
        "MISSING AGENT REVIEW BOUNDARY",
        explanation,
        [
          `Human boundary: ${humanBoundary.label ?? humanBoundary.id} (${humanBoundary.type})`,
          `Protects: ${formatList(group.effects)}`,
          `Agent tools: ${formatList(involvedTools.map((tool) => tool.name))}`,
          "Application boundary: none covering the protected effects",
          ...(hasCorrelatedClientApproval ? ["Client-runtime approval: observed before the correlated terminal effect"] : []),
          ...(hasTerminalOccurrence ? [] : ["Protected terminal effect: not observed in the supplied evidence"]),
        ],
        [`human boundary protects: ${formatList(group.effects)}`],
        involvedTools.map((tool) => `${tool.name} declares: ${formatList(getDeclaredEffects(tool))}`),
        scope,
        qualification,
      ),
    );
  }

  return gaps;
}

function evaluateSemanticOverloading(
  contract: DeveloperContractV2,
  counters: GapCounters,
) {
  const gaps: GapV2[] = [];
  for (const group of getNonDominatedBoundaryGroups(contract.humanSurface.boundaries)) {
    const separatedActions = contract.humanSurface.actions.filter(
      (action) => !overlaps(getHumanEffects(action), group.effects),
    );
    const mutationActions = contract.humanSurface.actions.filter((action) =>
      overlaps(getHumanEffects(action), group.effects),
    );
    if (separatedActions.length === 0 || mutationActions.length === 0) continue;

    const overloadedTools = contract.agentSurface.tools.filter(
      (tool) =>
        overlaps(getDeclaredEffects(tool), group.effects) &&
        separatedActions.some((action) => action.action === tool.action),
    );
    if (overloadedTools.length === 0) continue;

    const humanBoundary = group.boundaries[0];
    gaps.push(
      makeGap(
        counters,
        "parity",
        "semantic-overloading",
        "high",
        "fail",
        "SEMANTIC OVERLOADING",
        "An Agent Tool combines an action that humans keep separate from a protected state-changing action.",
        [
          `Human boundary: ${humanBoundary.label ?? humanBoundary.id}`,
          `Separated human actions: ${formatList(unique(separatedActions.map((action) => action.action)))}`,
          `State-changing human actions: ${formatList(unique(mutationActions.map((action) => action.action)))}`,
          `Overloaded agent tools: ${formatList(overloadedTools.map((tool) => tool.name))}`,
        ],
        unique([
          ...separatedActions.map((action) => `human action: ${action.action}`),
          ...mutationActions.map((action) => `human action: ${action.action}`),
        ]),
        overloadedTools.map(
          (tool) => `${tool.name}: ${tool.action} → ${formatList(getDeclaredEffects(tool))}`,
        ),
        "contract",
      ),
    );
  }
  return gaps;
}

function evaluateExcessAgency(
  contract: DeveloperContractV2,
  execution: ExecutionEvidenceV2[],
  counters: GapCounters,
) {
  if (!contract.intent.requiredActions || contract.intent.requiredActions.length === 0) return [];

  const protectedEffects = getProtectedEffects(contract);
  const allowedActions = new Set(requiredActionsForTarget(contract));
  const workflowTarget =
    contract.intent.completionTarget === "workflow" || contract.intent.completionTarget === "both";
  const unnecessaryTools = contract.agentSurface.tools.filter((tool) => {
    if (tool.annotations?.readOnlyHint === true) return false;
    if (!overlaps(getDeclaredEffects(tool), Array.from(protectedEffects))) return false;
    if (allowedActions.has(tool.action)) return false;
    if (
      workflowTarget &&
      tool.capabilityRole === "workflow-terminal" &&
      (contract.intent.terminalActions ?? []).includes(tool.action)
    ) {
      return false;
    }
    return true;
  });
  if (unnecessaryTools.length === 0) return [];

  const invokedNames = new Set(execution.map((entry) => entry.toolName));
  const scope = unnecessaryTools.some((tool) => invokedNames.has(tool.name))
    ? "effective-path"
    : "exposed";
  return [
    makeGap(
      counters,
      "agency",
      "excess-agency",
      "medium",
      "warning",
      "EXCESS AGENCY",
      "The Agent Surface exposes state-changing capabilities that are not required by the current declared intent.",
      [
        `Required goal actions: ${formatList(contract.intent.requiredActions)}`,
        `Scope: ${scope}`,
        ...unnecessaryTools.map(
          (tool) => `Extra mutation capability: ${tool.name} (${tool.action})`,
        ),
      ],
      contract.intent.requiredActions.map((action) => `required action: ${action}`),
      unnecessaryTools.map(
        (tool) => `${tool.name} declares: ${formatList(getDeclaredEffects(tool))}`,
      ),
      scope,
    ),
  ];
}

export function evaluateRulesV2(
  contract: DeveloperContractV2,
  execution: ExecutionEvidenceV2[],
  evidence: EvidenceBundleV2,
) {
  const counters: GapCounters = { intent: 0, parity: 0, agency: 0 };
  return [
    ...evaluateForbiddenEffects(contract, execution, counters),
    ...evaluateRequiredActions(contract, execution, evidence, counters),
    ...evaluateRequiredEffects(contract, execution, evidence, counters),
    ...evaluateDeclarationObservationMismatch(contract, execution, counters),
    ...evaluateMissingConfirmationBoundary(contract, execution, evidence, counters),
    ...evaluateSemanticOverloading(contract, counters),
    ...evaluateExcessAgency(contract, execution, counters),
  ];
}

const recommendationTemplates: Record<FindingRuleV2, Omit<RecommendationV2, "rule">> = {
  "forbidden-effect": {
    priority: "P0",
    title: "Keep forbidden effects out of the execution path",
    detail: "Prevent tools on the selected path from producing effects listed in the intent guardrails.",
    rationale: "A technically successful call still fails when it produces a prohibited semantic effect.",
  },
  "missing-required-action": {
    priority: "P0",
    title: "Expose and execute the required action",
    detail: "Provide a tool with the required semantic action and verify that the completed path invokes it.",
    rationale: "The audit cannot call a goal or workflow complete when a required action is absent.",
  },
  "missing-required-effect": {
    priority: "P0",
    title: "Establish the required domain outcome",
    detail: "Record the required effect as an explicit contract field and verify that execution produces it.",
    rationale: "A required outcome must be evaluated from explicit semantics and evidence, not from natural-language inference.",
  },
  "declaration-observation-mismatch": {
    priority: "P0",
    title: "Reconcile the declaration with observed behavior",
    detail: "Correct the tool declaration or remove the unexpected protected mutation.",
    rationale: "A read-only declaration must not contradict runtime evidence.",
  },
  "missing-confirmation-boundary": {
    priority: "P0",
    title: "Add an agent-side review or confirmation boundary",
    detail: "Expose an equivalent review or confirmation boundary before a protected effect can occur.",
    rationale: "Human safety boundaries need an application-side counterpart when the agent can cause the same effect.",
  },
  "semantic-overloading": {
    priority: "P0",
    title: "Separate semantic actions from state change",
    detail: "Split the read or recommendation action from the tool that changes state.",
    rationale: "A single tool should not silently cross a meaningful human boundary.",
  },
  "excess-agency": {
    priority: "P1",
    title: "Reduce unnecessary mutation capability",
    detail: "Avoid exposing state-changing tools that the current intent does not require.",
    rationale: "Narrower agent capability reduces the number of paths that can violate a read-only goal.",
  },
};

export function deriveRecommendationsV2(gaps: GapV2[]): RecommendationV2[] {
  const seen = new Set<FindingRuleV2>();
  return gaps.flatMap((gap) => {
    if (seen.has(gap.rule)) return [];
    seen.add(gap.rule);
    return [{ rule: gap.rule, ...recommendationTemplates[gap.rule] }];
  });
}
