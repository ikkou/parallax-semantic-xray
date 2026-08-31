import type { DeveloperContract, Effect } from "../contract";
import type { ExecutionEvidence, ObservedEffect } from "../evidence";
import type { DeveloperContractV2 } from "./contract";
import type {
  EvidenceBundleV2,
  EvidenceCompleteness,
  EvidenceMode,
  ExecutionEvidenceV2,
  EffectOutcome,
} from "./evidence";
import { validateDeveloperContractV2, validateEvidenceBundleV2 } from "./validation";

export type LegacyNormalizationOptions = {
  applicationId: string;
  runId: string;
  mode?: EvidenceMode;
  completeness?: EvidenceCompleteness;
  executionComplete?: boolean;
};

function normalizeClaimedEffects(effects: Effect[]) {
  return [...effects];
}

function normalizeLegacyTool(tool: DeveloperContract["agentSurface"]["tools"][number]) {
  const legacyTool = tool as typeof tool & { annotations?: typeof tool.annotations | null };
  const { annotations, ...toolWithoutAnnotations } = legacyTool;
  return {
    ...toolWithoutAnnotations,
    declaredEffects: normalizeClaimedEffects(tool.declaredEffects),
    ...(annotations == null ? {} : { annotations: { ...annotations } }),
    ...(tool.boundaryIds === undefined ? {} : { boundaryIds: [...tool.boundaryIds] }),
  };
}

function toOccurredOutcome(observed: ObservedEffect): EffectOutcome {
  return {
    effect: observed.effect,
    outcome: "occurred",
    phase: "unspecified",
    source: observed.source,
    ...(observed.detail === undefined ? {} : { detail: observed.detail }),
  };
}

function normalizeLegacyEntry(entry: ExecutionEvidence): ExecutionEvidenceV2 {
  return {
    ...entry,
    observedEffects: entry.observedEffects.map((observed) => ({ ...observed })),
    effectOutcomes: entry.observedEffects.map(toOccurredOutcome),
  };
}

function inferLegacyCompleteness(
  entries: ExecutionEvidence[],
  options: LegacyNormalizationOptions,
): EvidenceCompleteness {
  if (options.completeness !== undefined) return options.completeness;
  if (options.executionComplete === true) return "complete";
  return entries.length > 0 ? "partial" : "unknown";
}

export function normalizeV1Contract(contract: DeveloperContract): DeveloperContractV2 {
  const normalized: DeveloperContractV2 = {
    version: 2,
    applicationId: contract.applicationId,
    intent: {
      ...contract.intent,
      ...(contract.intent.requiredActions === undefined
        ? {}
        : { requiredActions: [...contract.intent.requiredActions] }),
      forbiddenEffects: normalizeClaimedEffects(contract.intent.forbiddenEffects),
    },
    humanSurface: {
      actions: contract.humanSurface.actions.map((action) => ({
        ...action,
        effects: normalizeClaimedEffects(action.effects),
        ...(action.boundaryIds === undefined ? {} : { boundaryIds: [...action.boundaryIds] }),
      })),
      boundaries: contract.humanSurface.boundaries.map((boundary) => ({
        ...boundary,
        protectsEffects: normalizeClaimedEffects(boundary.protectsEffects),
      })),
    },
    agentSurface: {
      tools: contract.agentSurface.tools.map(normalizeLegacyTool),
      boundaries: contract.agentSurface.boundaries.map((boundary) => ({
        ...boundary,
        protectsEffects: normalizeClaimedEffects(boundary.protectsEffects),
      })),
    },
  };
  return validateDeveloperContractV2(normalized);
}

export function normalizeV1Evidence(
  evidence: ExecutionEvidence[],
  options: LegacyNormalizationOptions,
): EvidenceBundleV2 {
  const normalized: EvidenceBundleV2 = {
    version: 2,
    runId: options.runId,
    mode: options.mode ?? "captured-fixture",
    completeness: inferLegacyCompleteness(evidence, options),
    applicationId: options.applicationId,
    entries: evidence.map(normalizeLegacyEntry),
  };
  return validateEvidenceBundleV2(normalized);
}

export function normalizeToV2(
  contract: DeveloperContract | DeveloperContractV2,
  evidence: ExecutionEvidence[] | EvidenceBundleV2,
  options: LegacyNormalizationOptions,
) {
  const normalizedContract = "version" in contract && contract.version === 2
    ? validateDeveloperContractV2(contract)
    : normalizeV1Contract(contract as DeveloperContract);
  const normalizedEvidence = !Array.isArray(evidence)
    ? validateEvidenceBundleV2(evidence)
    : normalizeV1Evidence(evidence, options);
  if (normalizedContract.applicationId !== normalizedEvidence.applicationId) {
    throw new Error("contract and evidence applicationId values must match");
  }
  return { contract: normalizedContract, evidence: normalizedEvidence };
}
