import type { DeveloperContract } from "./contract";
import type { ExecutionEvidence } from "./evidence";
import type { AuditResult, Gap, StageStatus, TraceEvidence, TraceStep } from "./result";

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function formatList(values: string[]) {
  return values.length > 0 ? values.join(", ") : "none";
}

function evidence(layer: TraceEvidence["layer"], label: string, value: string, source?: TraceEvidence["source"]): TraceEvidence {
  return { layer, label, value, source };
}

function technicalDetail(execution: ExecutionEvidence[]) {
  if (execution.length === 0) return "No execution evidence captured";
  const hasError = execution.some((entry) => entry.technicalStatus === "error");
  const status = hasError ? "ERROR" : "SUCCESS";
  const statusCodes = unique(
    execution
      .map((entry) => entry.statusCode)
      .filter((statusCode): statusCode is number => typeof statusCode === "number")
      .map(String),
  );
  return `HTTP ${statusCodes.length > 0 ? statusCodes.join(", ") : "—"} / ${status}`;
}

function observedEffectText(execution: ExecutionEvidence[]) {
  const effects = execution.flatMap((entry) =>
    entry.observedEffects.map((observed) => `${observed.effect} (${observed.source})`),
  );
  return formatList(unique(effects));
}

export function buildTrace(
  contract: DeveloperContract,
  execution: ExecutionEvidence[],
  gaps: Gap[],
  technicalStatus: StageStatus,
  semanticStatus: StageStatus,
): TraceStep[] {
  const path = execution.map((entry) => entry.toolName);
  const tools = path
    .map((name) => contract.agentSurface.tools.find((tool) => tool.name === name))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));
  const declaredEffects = unique(tools.flatMap((tool) => tool.declaredEffects));
  const observedEffects = unique(execution.flatMap((entry) => entry.observedEffects.map((effect) => effect.effect)));
  const driftGaps = gaps.filter(
    (gap) =>
      gap.rule === "forbidden-effect" ||
      gap.rule === "missing-confirmation-boundary" ||
      gap.rule === "semantic-overloading" ||
      gap.rule === "declaration-observation-mismatch",
  );
  const contractFailure = gaps.some(
    (gap) =>
      gap.rule === "missing-confirmation-boundary" ||
      gap.rule === "semantic-overloading" ||
      gap.rule === "declaration-observation-mismatch",
  );

  return [
    {
      type: "human-intent",
      label: "HUMAN INTENT",
      detail: contract.intent.goal,
      meta: `forbidden effects: ${formatList(contract.intent.forbiddenEffects)}`,
      status: "pass",
      evidence: [
        evidence("declared", "goal", contract.intent.goal),
        evidence("declared", "forbiddenEffects", formatList(contract.intent.forbiddenEffects)),
      ],
    },
    {
      type: "agent-interpretation",
      label: "AGENT INTERPRETATION",
      detail: `required actions: ${formatList(contract.intent.requiredActions ?? [])}`,
      meta: "derived from the declared intent contract",
      status: "pass",
      evidence: [
        evidence("declared", "requiredActions", formatList(contract.intent.requiredActions ?? [])),
      ],
    },
    {
      type: "tool-selection",
      label: "TOOL SELECTION",
      detail: `executed tools: ${formatList(path)}`,
      meta: driftGaps.length > 0 ? "SEMANTIC DRIFT STARTS HERE" : "selected path remains within the contract",
      status: driftGaps.length > 0 ? "warning" : "pass",
      evidence: [
        evidence("observed", "tool path", formatList(path)),
      ],
    },
    {
      type: "tool-contract",
      label: "TOOL CONTRACT",
      detail: `actions: ${formatList(unique(tools.map((tool) => tool.action)))}`,
      meta: `declared effects: ${formatList(declaredEffects)}`,
      status: contractFailure ? "fail" : "pass",
      evidence: [
        evidence("declared", "actions", formatList(unique(tools.map((tool) => tool.action)))),
        evidence("declared", "declaredEffects", formatList(declaredEffects)),
        evidence(
          "declared",
          "readOnlyHints",
          formatList(
            tools.map(
              (tool) => `${tool.name}=${String(tool.annotations?.readOnlyHint ?? "unset")}`,
            ),
          ),
        ),
      ],
    },
    {
      type: "execution-result",
      label: "EXECUTION RESULT",
      detail: technicalDetail(execution),
      meta: `observed effects: ${observedEffectText(execution)}`,
      status: technicalStatus,
      evidence: [
        evidence("observed", "technicalStatus", technicalStatus.toUpperCase()),
        evidence("observed", "effects", formatList(observedEffects)),
        ...execution.flatMap((entry) =>
          entry.observedEffects.map((observed) =>
            evidence("observed", entry.toolName, observed.effect, observed.source),
          ),
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
            ? "No direct intent violation was observed, but the contract has a non-fatal asymmetry"
            : "Observed execution preserves the declared intent and safety boundaries",
      meta: `semantic result: ${semanticStatus.toUpperCase()}`,
      status: semanticStatus,
      evidence: [
        evidence("derived", "status", semanticStatus.toUpperCase()),
        evidence("derived", "findings", formatList(gaps.map((gap) => gap.id))),
      ],
    },
  ];
}
