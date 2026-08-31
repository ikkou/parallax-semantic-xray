import type { DeveloperContractV2, Effect, ToolContractV2 } from "./contract";
import type {
  BoundaryEvidenceRecord,
  EffectOutcomeRecord,
  PolicyOutcomeRecord,
  TraceEvidenceV2,
  TraceStepV2,
  AuditResultV2,
  CapabilityRowV2,
  GapV2,
} from "./result";
import type {
  BoundaryEvidence,
  EvidenceBundleV2,
  ExecutionEvidenceV2,
} from "./evidence";
import { getDeclaredEffects, getEntryEffectRecords, evaluateRulesV2 } from "./rules";
import { validateDeveloperContractV2, validateEvidenceBundleV2 } from "./validation";
import { deriveRecommendationsV2 } from "./rules";

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

function materializeEntry(entry: ExecutionEvidenceV2): ExecutionEvidenceV2 {
  if (entry.effectOutcomes !== undefined) {
    return {
      ...entry,
      observedEffects: entry.observedEffects.map((observed) => ({ ...observed })),
      effectOutcomes: entry.effectOutcomes.map((outcome) => ({ ...outcome })),
      ...(entry.boundaryEvidence === undefined
        ? {}
        : { boundaryEvidence: entry.boundaryEvidence.map((boundary) => ({ ...boundary })) }),
      ...(entry.policyEvidence === undefined ? {} : { policyEvidence: { ...entry.policyEvidence } }),
    };
  }

  return {
    ...entry,
    observedEffects: entry.observedEffects.map((observed) => ({ ...observed })),
    effectOutcomes: entry.observedEffects.map((observed) => ({
      effect: observed.effect,
      outcome: "occurred" as const,
      phase: "unspecified" as const,
      source: observed.source,
      ...(observed.detail === undefined ? {} : { detail: observed.detail }),
    })),
    ...(entry.boundaryEvidence === undefined
      ? {}
      : { boundaryEvidence: entry.boundaryEvidence.map((boundary) => ({ ...boundary })) }),
    ...(entry.policyEvidence === undefined ? {} : { policyEvidence: { ...entry.policyEvidence } }),
  };
}

function calculateLensStatuses(gaps: GapV2[]) {
  const lenses = ["intent", "parity", "agency"] as const;
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
  ) as AuditResultV2["statuses"];
}

function calculateTechnicalStatus(execution: ExecutionEvidenceV2[]) {
  if (execution.length === 0) return "warning" as const;
  return execution.some((entry) => entry.technicalStatus === "error")
    ? ("fail" as const)
    : ("pass" as const);
}

function calculateSemanticStatus(
  statuses: AuditResultV2["statuses"],
  technicalStatus: AuditResultV2["technicalStatus"],
  evidence: EvidenceBundleV2,
  qualifiers: string[],
) {
  if (technicalStatus === "fail") return "fail" as const;
  if (technicalStatus === "warning") return "warning" as const;
  if (statuses.intent === "fail" || statuses.parity === "fail") return "fail" as const;
  if (
    statuses.intent === "warning" ||
    statuses.parity === "warning" ||
    statuses.agency === "warning" ||
    evidence.completeness !== "complete" ||
    qualifiers.some((qualifier) => qualifier.toLowerCase().includes("unresolved"))
  ) {
    return "warning" as const;
  }
  return "pass" as const;
}

function boundaryHasEquivalentAgentBoundary(
  contract: DeveloperContractV2,
  effects: Effect[],
) {
  return contract.agentSurface.boundaries.some((boundary) =>
    covers(boundary.protectsEffects, effects),
  );
}

function actionHasHumanBoundary(
  contract: DeveloperContractV2,
  actionBoundaryIds: string[] | undefined,
) {
  return (actionBoundaryIds ?? []).some((id) =>
    contract.humanSurface.boundaries.some((boundary) => boundary.id === id),
  );
}

function getRelation(
  contract: DeveloperContractV2,
  actionId: string,
) {
  return contract.surfaceRelations?.find(
    (relation) => relation.humanActionIds.includes(actionId),
  );
}

function buildCapabilityMatrix(contract: DeveloperContractV2): CapabilityRowV2[] {
  const protectedEffects = Array.from(
    new Set([
      ...contract.intent.forbiddenEffects,
      ...contract.humanSurface.boundaries.flatMap((boundary) => boundary.protectsEffects),
    ]),
  );
  const rows: CapabilityRowV2[] = [];
  const seenActions = new Set<string>();

  for (const action of contract.humanSurface.actions) {
    if (seenActions.has(action.action)) continue;
    seenActions.add(action.action);
    const matchingTools = contract.agentSurface.tools.filter((tool) => tool.action === action.action);
    const actionEffects = unique([
      ...action.effects,
      ...(action.effectClaims ?? []).map((claim) => claim.effect),
    ]);
    const effectMatchingTools = contract.agentSurface.tools.filter((tool) =>
      overlaps(getDeclaredEffects(tool), actionEffects),
    );
    const relatedTools = getRelation(contract, action.id);
    const relation = relatedTools?.relation ?? "UNRESOLVED";
    const protectedAction =
      overlaps(actionEffects, protectedEffects) && actionHasHumanBoundary(contract, action.boundaryIds);
    const agentBoundary = [...matchingTools, ...effectMatchingTools].some((tool) => {
      const linked = contract.agentSurface.boundaries.filter((boundary) =>
        (tool.boundaryIds ?? []).includes(boundary.id),
      );
      return linked.some((boundary) => covers(boundary.protectsEffects, actionEffects));
    }) || boundaryHasEquivalentAgentBoundary(contract, actionEffects);
    const agentAvailable = matchingTools.length > 0 || effectMatchingTools.length > 0 || Boolean(relatedTools);
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
          : relation === "COMPLEMENTARY"
            ? "Complementary surface contribution"
            : "—",
      relation,
    });
  }

  for (const boundary of contract.humanSurface.boundaries.filter((item) => item.type === "review")) {
    if (contract.humanSurface.actions.some((action) => action.boundaryIds?.includes(boundary.id))) continue;
    const agentAvailable = boundaryHasEquivalentAgentBoundary(contract, boundary.protectsEffects);
    rows.push({
      capability: boundary.label ?? boundary.id,
      human: true,
      agent: agentAvailable,
      alignment: agentAvailable ? "Aligned" : "Missing",
      gap: agentAvailable ? "—" : "No equivalent agent review or confirmation boundary",
      relation: "UNRESOLVED",
    });
  }

  return rows;
}

function technicalDetail(execution: ExecutionEvidenceV2[]) {
  if (execution.length === 0) return "No execution evidence captured";
  const hasError = execution.some((entry) => entry.technicalStatus === "error");
  const status = hasError ? "ERROR" : "SUCCESS";
  const statusCodes = unique(
    execution
      .map((entry) => entry.statusCode)
      .filter((statusCode): statusCode is number => typeof statusCode === "number")
      .map(String),
  );
  return statusCodes.length > 0
    ? `HTTP ${statusCodes.join(", ")} / ${status}`
    : `STATUS CODE UNOBSERVED / ${status}`;
}

function effectDetail(execution: ExecutionEvidenceV2[]) {
  const effects = execution.flatMap((entry) =>
    getEntryEffectRecords(entry).map(
      (record) => `${record.effect} ${record.outcome.toUpperCase()} (${record.source})`,
    ),
  );
  return formatList(unique(effects));
}

function traceEvidence(
  layer: TraceEvidenceV2["layer"],
  label: string,
  value: string,
  source?: TraceEvidenceV2["source"],
): TraceEvidenceV2 {
  return { layer, label, value, ...(source === undefined ? {} : { source }) };
}

function buildTrace(
  contract: DeveloperContractV2,
  evidence: EvidenceBundleV2,
  execution: ExecutionEvidenceV2[],
  gaps: GapV2[],
  technicalStatus: AuditResultV2["technicalStatus"],
  semanticStatus: AuditResultV2["semanticStatus"],
  qualifiers: string[],
): TraceStepV2[] {
  const path = execution.map((entry) => entry.toolName);
  const tools = path
    .map((name) => contract.agentSurface.tools.find((tool) => tool.name === name))
    .filter((tool): tool is ToolContractV2 => Boolean(tool));
  const declaredEffects = unique(tools.flatMap(getDeclaredEffects));
  const records = execution.flatMap(getEntryEffectRecords);
  const driftGaps = gaps.filter((gap) => gap.type === "intent" || gap.type === "parity");
  const contractFailure = gaps.some(
    (gap) => gap.type === "parity" && gap.status === "fail",
  );
  const policyLabels = evidence.entries.flatMap((entry) =>
    entry.policyEvidence ? [`${entry.toolName}: policy ${entry.policyEvidence.decision.toUpperCase()}`] : [],
  );
  const boundaryLabels = evidence.entries.flatMap((entry) =>
    (entry.boundaryEvidence ?? []).map(
      (boundary) => `${boundary.origin}: ${boundary.type} ${boundary.status}`,
    ),
  );

  return [
    {
      type: "human-intent",
      label: "HUMAN INTENT",
      detail: contract.intent.goal,
      meta: `forbidden effects: ${formatList(contract.intent.forbiddenEffects)}`,
      status: "pass",
      evidence: [
        traceEvidence("declared", "goal", contract.intent.goal),
        traceEvidence("declared", "forbiddenEffects", formatList(contract.intent.forbiddenEffects)),
        ...(contract.intent.requiredEffects === undefined
          ? []
          : [traceEvidence("declared", "requiredEffects", formatList(contract.intent.requiredEffects))]),
      ],
    },
    {
      type: "agent-interpretation",
      label: "AGENT INTERPRETATION",
      detail: `required actions: ${formatList(contract.intent.requiredActions ?? [])}`,
      meta: `completion target: ${contract.intent.completionTarget ?? "goal"}`,
      status: "pass",
      evidence: [
        traceEvidence("declared", "requiredActions", formatList(contract.intent.requiredActions ?? [])),
        ...(contract.intent.workflowActions === undefined
          ? []
          : [traceEvidence("declared", "workflowActions", formatList(contract.intent.workflowActions))]),
      ],
    },
    {
      type: "tool-selection",
      label: "TOOL SELECTION",
      detail: `invoked tools: ${formatList(path)}`,
      meta: driftGaps.length > 0 ? "SEMANTIC DRIFT STARTS HERE" : "selected path remains within the contract",
      status: driftGaps.length > 0 ? "warning" : "pass",
      evidence: [traceEvidence("observed", "invoked tools", formatList(path))],
    },
    {
      type: "tool-contract",
      label: "TOOL CONTRACT",
      detail: `actions: ${formatList(unique(tools.map((tool) => tool.action)))}`,
      meta: `declared effects: ${formatList(declaredEffects)}`,
      status: contractFailure ? "fail" : "pass",
      evidence: [
        traceEvidence("declared", "actions", formatList(unique(tools.map((tool) => tool.action)))),
        traceEvidence("declared", "declaredEffects", formatList(declaredEffects)),
        traceEvidence(
          "declared",
          "readOnlyHints",
          formatList(tools.map((tool) => `${tool.name}=${String(tool.annotations?.readOnlyHint ?? "unset")}`)),
        ),
      ],
    },
    {
      type: "execution-result",
      label: "EXECUTION RESULT",
      detail: technicalDetail(execution),
      meta: [
        `effects: ${effectDetail(execution)}`,
        ...(policyLabels.length > 0 ? policyLabels : []),
        ...(boundaryLabels.length > 0 ? boundaryLabels : []),
      ].join(" · "),
      status: technicalStatus,
      evidence: [
        traceEvidence("observed", "technicalStatus", technicalStatus.toUpperCase()),
        traceEvidence("observed", "effects", effectDetail(execution)),
        ...execution.flatMap((entry) =>
          getEntryEffectRecords(entry).map((record) =>
            traceEvidence("observed", entry.toolName, `${record.effect} ${record.outcome.toUpperCase()}`, record.source),
          ),
        ),
        ...evidence.entries.flatMap((entry) =>
          entry.policyEvidence
            ? [traceEvidence("observed", `${entry.toolName} policy`, entry.policyEvidence.decision.toUpperCase(), entry.policyEvidence.source)]
            : [],
        ),
      ],
    },
    {
      type: "semantic-outcome",
      label: "SEMANTIC OUTCOME",
      detail:
        semanticStatus === "fail"
          ? "Observed execution diverged from the declared intent or safety boundary"
          : semanticStatus === "warning"
            ? "No unqualified semantic PASS: evidence or contract asymmetry remains"
            : "Observed execution preserves the declared intent and safety boundaries",
      meta: [
        `semantic result: ${semanticStatus.toUpperCase()}`,
        ...(qualifiers.length > 0 ? qualifiers : []),
      ].join(" · "),
      status: semanticStatus,
      evidence: [
        traceEvidence("derived", "status", semanticStatus.toUpperCase()),
        traceEvidence("derived", "findings", formatList(gaps.map((gap) => gap.id))),
        ...(qualifiers.length > 0
          ? [traceEvidence("derived", "qualifiers", formatList(qualifiers))]
          : []),
      ],
    },
  ];
}

function collectPolicyOutcomes(execution: ExecutionEvidenceV2[]): PolicyOutcomeRecord[] {
  return execution.flatMap((entry) =>
    entry.policyEvidence ? [{ toolName: entry.toolName, ...entry.policyEvidence }] : [],
  );
}

function collectEffectOutcomes(execution: ExecutionEvidenceV2[]): EffectOutcomeRecord[] {
  return execution.flatMap((entry) => getEntryEffectRecords(entry));
}

function collectBoundaryEvidence(execution: ExecutionEvidenceV2[]): BoundaryEvidenceRecord[] {
  return execution.flatMap((entry) =>
    (entry.boundaryEvidence ?? []).map((boundary) => ({ toolName: entry.toolName, ...boundary })),
  );
}

function collectQualifiers(
  evidence: EvidenceBundleV2,
  execution: ExecutionEvidenceV2[],
) {
  const qualifiers: string[] = [];
  if (evidence.completeness !== "complete") {
    qualifiers.push(`Evidence completeness: ${evidence.completeness.toUpperCase()}`);
  }
  for (const entry of execution) {
    if (entry.policyEvidence?.decision === "unresolved") {
      qualifiers.push(`${entry.toolName}: policy outcome unresolved`);
    }
    if (getEntryEffectRecords(entry).some((record) => record.outcome === "unresolved")) {
      qualifiers.push(`${entry.toolName}: effect outcome unresolved`);
    }
    if (
      entry.boundaryEvidence?.some(
        (boundary) => boundary.origin === "client-runtime" && boundary.status === "approved",
      )
    ) {
      qualifiers.push(`${entry.toolName}: client-runtime approval is not an application boundary`);
    }
  }
  return unique(qualifiers);
}

export function runSemanticAuditV2(
  contract: DeveloperContractV2,
  evidence: EvidenceBundleV2,
): AuditResultV2 {
  validateDeveloperContractV2(contract);
  validateEvidenceBundleV2(evidence);
  if (contract.applicationId !== evidence.applicationId) {
    throw new Error("contract and evidence applicationId values must match");
  }

  const execution = evidence.entries.map(materializeEntry);
  const gaps = evaluateRulesV2(contract, execution, { ...evidence, entries: execution });
  const statuses = calculateLensStatuses(gaps);
  const technicalStatus = calculateTechnicalStatus(execution);
  const qualifiers = collectQualifiers(evidence, execution);
  const semanticStatus = calculateSemanticStatus(statuses, technicalStatus, evidence, qualifiers);

  return {
    modelVersion: 2,
    runId: evidence.runId,
    applicationId: contract.applicationId,
    goal: contract.intent.goal,
    statuses,
    technicalStatus,
    semanticStatus,
    steps: buildTrace(contract, evidence, execution, gaps, technicalStatus, semanticStatus, qualifiers),
    gaps,
    recommendations: deriveRecommendationsV2(gaps),
    matrix: buildCapabilityMatrix(contract),
    path: execution.map((entry) => entry.toolName),
    execution,
    evidenceMode: evidence.mode,
    evidenceCompleteness: evidence.completeness,
    policyOutcomes: collectPolicyOutcomes(execution),
    effectOutcomes: collectEffectOutcomes(execution),
    boundaryEvidence: collectBoundaryEvidence(execution),
    surfaceRelations: contract.surfaceRelations ?? [],
    evidenceQualifiers: qualifiers,
  };
}
