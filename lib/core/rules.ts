import type {
  BoundaryContract,
  DeveloperContract,
  Effect,
  SemanticAction,
  ToolContract,
} from "./contract";
import type { ExecutionEvidence } from "./evidence";
import type { FindingRule, Gap, Lens, Recommendation } from "./result";

export type RuleEvaluationOptions = {
  executionComplete?: boolean;
};

type GapCounters = Record<Lens, number>;

function unique(values: string[]) {
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

function getTool(contract: DeveloperContract, name: string) {
  return contract.agentSurface.tools.find((tool) => tool.name === name);
}

export function getProtectedEffects(contract: DeveloperContract) {
  return new Set(
    unique([
      ...contract.intent.forbiddenEffects,
      ...contract.humanSurface.boundaries.flatMap((boundary) => boundary.protectsEffects),
      ...contract.agentSurface.tools
        .filter((tool) => tool.annotations?.readOnlyHint !== true)
        .flatMap((tool) => tool.declaredEffects),
    ]),
  );
}

function makeGap(
  counters: GapCounters,
  type: Lens,
  rule: FindingRule,
  severity: Gap["severity"],
  status: Gap["status"],
  title: string,
  explanation: string,
  evidence: string[],
  declared?: string[],
  observed?: string[],
): Gap {
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
    declared,
    observed,
  };
}

function evaluateForbiddenEffects(
  contract: DeveloperContract,
  execution: ExecutionEvidence[],
  counters: GapCounters,
) {
  const forbidden = new Set(contract.intent.forbiddenEffects);
  const violations = execution.flatMap((entry) =>
    entry.observedEffects
      .filter((observed) => forbidden.has(observed.effect))
      .map((observed) => ({
        toolName: entry.toolName,
        effect: observed.effect,
        source: observed.source,
      })),
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
            `Observed: ${violation.effect} from ${violation.toolName} (${violation.source})`,
        ),
      ],
      unique(violations.map((violation) => `forbidden effect: ${violation.effect}`)),
      unique(
        violations.map(
          (violation) => `${violation.toolName} → ${violation.effect} (${violation.source})`,
        ),
      ),
    ),
  ];
}

function evaluateRequiredActions(
  contract: DeveloperContract,
  execution: ExecutionEvidence[],
  options: RuleEvaluationOptions,
  counters: GapCounters,
) {
  const requiredActions = contract.intent.requiredActions;
  if (!requiredActions || requiredActions.length === 0) return [];

  const executedActions = new Set<SemanticAction>();
  const unknownTools: string[] = [];

  for (const entry of execution) {
    const tool = getTool(contract, entry.toolName);
    if (!tool) {
      unknownTools.push(entry.toolName);
      continue;
    }
    executedActions.add(tool.action);
  }

  const missing = requiredActions.filter((action) => !executedActions.has(action));
  if (missing.length === 0) return [];

  const sufficientEvidence =
    options.executionComplete === true && execution.length > 0 && unknownTools.length === 0;
  const status = sufficientEvidence ? "fail" : "warning";

  return [
    makeGap(
      counters,
      "intent",
      "missing-required-action",
      sufficientEvidence ? "high" : "medium",
      status,
      "MISSING REQUIRED ACTION",
      sufficientEvidence
        ? "The completed execution evidence does not demonstrate every action required by the goal."
        : "The available execution evidence is insufficient to determine whether every required action occurred.",
      [
        `Required: ${formatList(requiredActions)}`,
        `Observed actions: ${formatList(Array.from(executedActions))}`,
        `Missing: ${formatList(missing)}`,
        ...(unknownTools.length > 0 ? [`Unknown tools: ${formatList(unique(unknownTools))}`] : []),
      ],
      missing.map((action) => `required action: ${action}`),
      Array.from(executedActions).map((action) => `observed action: ${action}`),
    ),
  ];
}

function evaluateDeclarationObservationMismatch(
  contract: DeveloperContract,
  execution: ExecutionEvidence[],
  counters: GapCounters,
) {
  const protectedEffects = getProtectedEffects(contract);
  const mismatches = execution.flatMap((entry) => {
    const tool = getTool(contract, entry.toolName);
    if (!tool?.annotations?.readOnlyHint) return [];

    return entry.observedEffects
      .filter((observed) => protectedEffects.has(observed.effect))
      .map((observed) => ({ tool, entry, observed }));
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
      "A tool declared itself read-only, but runtime evidence recorded a protected state-changing effect.",
      [
        ...unique(
          mismatches.map(
            ({ tool }) => `${tool.name}: readOnlyHint = true`,
          ),
        ),
        ...unique(
          mismatches.map(
            ({ tool, observed }) =>
              `${tool.name}: observed ${observed.effect} (${observed.source})`,
          ),
        ),
      ],
      unique(mismatches.map(({ tool }) => `${tool.name}: readOnlyHint = true`)),
      unique(
        mismatches.map(
          ({ tool, observed }) => `${tool.name} → ${observed.effect} (${observed.source})`,
        ),
      ),
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

function hasEquivalentAgentBoundary(contract: DeveloperContract, effects: Effect[]) {
  return contract.agentSurface.boundaries.some((boundary) => covers(boundary.protectsEffects, effects));
}

function getToolsProtectingEffects(contract: DeveloperContract, effects: Effect[]) {
  return contract.agentSurface.tools.filter((tool) => overlaps(tool.declaredEffects, effects));
}

function evaluateMissingConfirmationBoundary(
  contract: DeveloperContract,
  execution: ExecutionEvidence[],
  counters: GapCounters,
) {
  const gaps: Gap[] = [];
  const observedByTool = new Map<string, string[]>();

  for (const entry of execution) {
    const effects = entry.observedEffects.map((observed) => observed.effect);
    if (effects.length > 0) observedByTool.set(entry.toolName, effects);
  }

  for (const group of getNonDominatedBoundaryGroups(contract.humanSurface.boundaries)) {
    if (hasEquivalentAgentBoundary(contract, group.effects)) continue;

    const exposedTools = getToolsProtectingEffects(contract, group.effects);
    const observedTools = Array.from(observedByTool.entries())
      .filter(([, effects]) => overlaps(effects, group.effects))
      .map(([toolName]) => toolName)
      .map((toolName) => getTool(contract, toolName))
      .filter((tool): tool is ToolContract => Boolean(tool));
    const involvedTools = Array.from(new Map(
      [...exposedTools, ...observedTools].map((tool) => [tool.name, tool]),
    ).values());

    if (involvedTools.length === 0) continue;

    const humanBoundary = group.boundaries[0];
    gaps.push(
      makeGap(
        counters,
        "parity",
        "missing-confirmation-boundary",
        "high",
        "fail",
        "MISSING AGENT REVIEW BOUNDARY",
        "The Human Surface protects a state-changing effect with a review or confirmation boundary, but the Agent Surface has no equivalent boundary.",
        [
          `Human boundary: ${humanBoundary.label ?? humanBoundary.id} (${humanBoundary.type})`,
          `Protects: ${formatList(group.effects)}`,
          `Agent tools: ${formatList(involvedTools.map((tool) => tool.name))}`,
          "Agent boundary: none covering the protected effects",
        ],
        [`human boundary protects: ${formatList(group.effects)}`],
        involvedTools.map((tool) => `${tool.name} declares: ${formatList(tool.declaredEffects)}`),
      ),
    );
  }

  return gaps;
}

function evaluateSemanticOverloading(
  contract: DeveloperContract,
  counters: GapCounters,
) {
  const gaps: Gap[] = [];

  for (const group of getNonDominatedBoundaryGroups(contract.humanSurface.boundaries)) {
    const separatedActions = contract.humanSurface.actions.filter(
      (action) => !overlaps(action.effects, group.effects),
    );
    const mutationActions = contract.humanSurface.actions.filter((action) =>
      overlaps(action.effects, group.effects),
    );

    if (separatedActions.length === 0 || mutationActions.length === 0) continue;

    const overloadedTools = contract.agentSurface.tools.filter(
      (tool) =>
        overlaps(tool.declaredEffects, group.effects) &&
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
          (tool) => `${tool.name}: ${tool.action} → ${formatList(tool.declaredEffects)}`,
        ),
      ),
    );
  }

  return gaps;
}

function evaluateExcessAgency(
  contract: DeveloperContract,
  counters: GapCounters,
) {
  if (!contract.intent.requiredActions) return [];

  const protectedEffects = getProtectedEffects(contract);
  const requiredActions = new Set(contract.intent.requiredActions);
  const unnecessaryTools = contract.agentSurface.tools.filter(
    (tool) =>
      overlaps(tool.declaredEffects, Array.from(protectedEffects)) &&
      !requiredActions.has(tool.action),
  );

  if (unnecessaryTools.length === 0) return [];

  return [
    makeGap(
      counters,
      "agency",
      "excess-agency",
      "medium",
      "warning",
      "EXCESS AGENCY",
      "The Agent Surface exposes state-changing capabilities that are not required by the current intent.",
      [
        `Required actions: ${formatList(contract.intent.requiredActions)}`,
        ...unnecessaryTools.map(
          (tool) => `Extra mutation capability: ${tool.name} (${tool.action})`,
        ),
      ],
      contract.intent.requiredActions.map((action) => `required action: ${action}`),
      unnecessaryTools.map(
        (tool) => `${tool.name} declares: ${formatList(tool.declaredEffects)}`,
      ),
    ),
  ];
}

export function evaluateRules(
  contract: DeveloperContract,
  execution: ExecutionEvidence[],
  options: RuleEvaluationOptions = {},
) {
  const counters: GapCounters = { intent: 0, parity: 0, agency: 0 };

  return [
    ...evaluateForbiddenEffects(contract, execution, counters),
    ...evaluateRequiredActions(contract, execution, options, counters),
    ...evaluateDeclarationObservationMismatch(contract, execution, counters),
    ...evaluateMissingConfirmationBoundary(contract, execution, counters),
    ...evaluateSemanticOverloading(contract, counters),
    ...evaluateExcessAgency(contract, counters),
  ];
}

const recommendationTemplates: Record<FindingRule, Omit<Recommendation, "rule">> = {
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
    rationale: "The audit cannot call a goal complete when a required action is absent.",
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
    rationale: "Human safety boundaries need an agent-visible counterpart when the agent can cause the same effect.",
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

export function deriveRecommendations(gaps: Gap[]): Recommendation[] {
  const seen = new Set<FindingRule>();

  return gaps.flatMap((gap) => {
    if (seen.has(gap.rule)) return [];
    seen.add(gap.rule);
    return [{ rule: gap.rule, ...recommendationTemplates[gap.rule] }];
  });
}
