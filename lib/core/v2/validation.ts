import type {
  BoundaryContract,
  DeveloperContractV2,
  EffectClaim,
  HumanActionContractV2,
  SurfaceRelation,
  ToolContractV2,
} from "./contract";
import type {
  BoundaryEvidence,
  EffectOutcome,
  EvidenceBundleV2,
  ExecutionEvidenceV2,
  PolicyEvidence,
} from "./evidence";
import type { JsonSchema } from "../contract";
import type { EvidenceSource } from "../evidence";

const evidenceSources = new Set<EvidenceSource>([
  "runtime-instrumentation",
  "state-diff",
  "tool-result",
  "developer-assertion",
]);

const outcomeSources = new Set([
  ...evidenceSources,
  "client-runtime",
  "application-policy",
]);

const boundaryEvidenceSources = new Set([
  ...evidenceSources,
  "client-runtime",
]);

export class V2ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "V2ValidationError";
  }
}

function fail(message: string): never {
  throw new V2ValidationError(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) fail(`${label} must be an object`);
  return value;
}

function requireString(value: unknown, label: string, nonEmpty = true): string {
  if (typeof value !== "string" || (nonEmpty && value.length === 0)) {
    fail(`${label} must be a${nonEmpty ? " non-empty" : ""} string`);
  }
  return value;
}

function requireStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    fail(`${label} must be an array of strings`);
  }
  return value;
}

function optionalString(value: unknown, label: string) {
  if (value !== undefined) requireString(value, label, false);
}

function optionalStringArray(value: unknown, label: string) {
  if (value !== undefined) requireStringArray(value, label);
}

function validateEffectClaim(value: unknown, label: string): EffectClaim {
  const claim = requireRecord(value, label);
  requireString(claim.effect, `${label}.effect`);
  const certainty = requireString(claim.certainty, `${label}.certainty`);
  if (!new Set(["guaranteed", "possible", "conditional"]).has(certainty)) {
    fail(`${label}.certainty is invalid`);
  }
  if (
    claim.phase !== undefined &&
    !new Set(["temporary", "terminal", "unspecified"]).has(requireString(claim.phase, `${label}.phase`))
  ) {
    fail(`${label}.phase is invalid`);
  }
  optionalString(claim.conditionId, `${label}.conditionId`);
  return claim as unknown as EffectClaim;
}

function validateAnnotations(value: unknown, label: string) {
  if (value === undefined) return;
  const annotations = requireRecord(value, label);
  if (annotations.readOnlyHint !== undefined && typeof annotations.readOnlyHint !== "boolean") {
    fail(`${label}.readOnlyHint must be a boolean`);
  }
}

function validateBoundary(value: unknown, label: string): BoundaryContract {
  const boundary = requireRecord(value, label);
  requireString(boundary.id, `${label}.id`);
  requireStringArray(boundary.protectsEffects, `${label}.protectsEffects`);
  if (boundary.type !== "review" && boundary.type !== "confirmation") {
    fail(`${label}.type must be review or confirmation`);
  }
  optionalString(boundary.label, `${label}.label`);
  return boundary as unknown as BoundaryContract;
}

function validateHumanAction(value: unknown, index: number): HumanActionContractV2 {
  const label = `contract.humanSurface.actions[${index}]`;
  const action = requireRecord(value, label);
  requireString(action.id, `${label}.id`);
  requireString(action.action, `${label}.action`);
  requireStringArray(action.effects, `${label}.effects`);
  optionalStringArray(action.boundaryIds, `${label}.boundaryIds`);
  optionalString(action.label, `${label}.label`);
  if (action.effectClaims !== undefined) {
    if (!Array.isArray(action.effectClaims)) fail(`${label}.effectClaims must be an array`);
    action.effectClaims.forEach((claim, claimIndex) =>
      validateEffectClaim(claim, `${label}.effectClaims[${claimIndex}]`),
    );
  }
  return action as unknown as HumanActionContractV2;
}

function validateTool(value: unknown, index: number): ToolContractV2 {
  const label = `contract.agentSurface.tools[${index}]`;
  const tool = requireRecord(value, label);
  requireString(tool.name, `${label}.name`);
  requireString(tool.description, `${label}.description`, false);
  requireRecord(tool.inputSchema, `${label}.inputSchema`);
  requireString(tool.action, `${label}.action`);
  requireStringArray(tool.declaredEffects, `${label}.declaredEffects`);
  optionalStringArray(tool.boundaryIds, `${label}.boundaryIds`);
  optionalString(tool.label, `${label}.label`);
  validateAnnotations(tool.annotations, `${label}.annotations`);
  if (tool.effectClaims !== undefined) {
    if (!Array.isArray(tool.effectClaims)) fail(`${label}.effectClaims must be an array`);
    tool.effectClaims.forEach((claim, claimIndex) =>
      validateEffectClaim(claim, `${label}.effectClaims[${claimIndex}]`),
    );
  }
  if (
    tool.capabilityRole !== undefined &&
    !new Set(["goal", "supporting", "workflow-terminal", "optional"]).has(
      requireString(tool.capabilityRole, `${label}.capabilityRole`),
    )
  ) {
    fail(`${label}.capabilityRole is invalid`);
  }
  return tool as unknown as ToolContractV2;
}

function validateRelation(
  value: unknown,
  index: number,
  humanActionIds: Set<string>,
  agentToolNames: Set<string>,
): SurfaceRelation {
  const label = `contract.surfaceRelations[${index}]`;
  const relation = requireRecord(value, label);
  const humanIds = requireStringArray(relation.humanActionIds, `${label}.humanActionIds`);
  const toolNames = requireStringArray(relation.agentToolNames, `${label}.agentToolNames`);
  if (humanIds.length === 0 || toolNames.length === 0) fail(`${label} must connect both surfaces`);
  if (relation.relation !== "EQUIVALENT" && relation.relation !== "COMPLEMENTARY") {
    fail(`${label}.relation must be EQUIVALENT or COMPLEMENTARY`);
  }
  if (humanIds.some((id) => !humanActionIds.has(id))) fail(`${label} references an unknown human action`);
  if (toolNames.some((name) => !agentToolNames.has(name))) fail(`${label} references an unknown agent tool`);
  if (new Set(humanIds).size !== humanIds.length) fail(`${label}.humanActionIds must not contain duplicates`);
  if (new Set(toolNames).size !== toolNames.length) fail(`${label}.agentToolNames must not contain duplicates`);
  if (relation.source !== "developer-assertion") fail(`${label}.source must be developer-assertion`);
  optionalString(relation.rationale, `${label}.rationale`);
  return relation as unknown as SurfaceRelation;
}

export function validateDeveloperContractV2(value: unknown): DeveloperContractV2 {
  const contract = requireRecord(value, "contract");
  if (contract.version !== 2) fail("contract.version must be 2");
  requireString(contract.applicationId, "contract.applicationId");

  const intent = requireRecord(contract.intent, "contract.intent");
  requireString(intent.goal, "contract.intent.goal");
  optionalStringArray(intent.requiredActions, "contract.intent.requiredActions");
  optionalStringArray(intent.requiredEffects, "contract.intent.requiredEffects");
  requireStringArray(intent.forbiddenEffects, "contract.intent.forbiddenEffects");
  optionalStringArray(intent.workflowActions, "contract.intent.workflowActions");
  optionalStringArray(intent.terminalActions, "contract.intent.terminalActions");
  if (
    intent.completionTarget !== undefined &&
    !new Set(["goal", "workflow", "both"]).has(
      requireString(intent.completionTarget, "contract.intent.completionTarget"),
    )
  ) {
    fail("contract.intent.completionTarget is invalid");
  }

  const humanSurface = requireRecord(contract.humanSurface, "contract.humanSurface");
  if (!Array.isArray(humanSurface.actions)) fail("contract.humanSurface.actions must be an array");
  const humanActions = humanSurface.actions.map(validateHumanAction);
  if (!Array.isArray(humanSurface.boundaries)) fail("contract.humanSurface.boundaries must be an array");
  const humanBoundaries = humanSurface.boundaries.map((boundary, index) =>
    validateBoundary(boundary, `contract.humanSurface.boundaries[${index}]`),
  );

  const agentSurface = requireRecord(contract.agentSurface, "contract.agentSurface");
  if (!Array.isArray(agentSurface.tools)) fail("contract.agentSurface.tools must be an array");
  const agentTools = agentSurface.tools.map(validateTool);
  if (!Array.isArray(agentSurface.boundaries)) fail("contract.agentSurface.boundaries must be an array");
  const agentBoundaries = agentSurface.boundaries.map((boundary, index) =>
    validateBoundary(boundary, `contract.agentSurface.boundaries[${index}]`),
  );

  const humanBoundaryIds = new Set(humanBoundaries.map((boundary) => boundary.id));
  const agentBoundaryIds = new Set(agentBoundaries.map((boundary) => boundary.id));
  if (humanBoundaryIds.size !== humanBoundaries.length) fail("human boundary ids must be unique");
  if (agentBoundaryIds.size !== agentBoundaries.length) fail("agent boundary ids must be unique");
  if (new Set(humanActions.map((action) => action.id)).size !== humanActions.length) {
    fail("human action ids must be unique");
  }
  if (new Set(agentTools.map((tool) => tool.name)).size !== agentTools.length) {
    fail("agent tool names must be unique");
  }
  humanActions.forEach((action, index) =>
    (action.boundaryIds ?? []).forEach((id) => {
      if (!humanBoundaryIds.has(id)) fail(`contract.humanSurface.actions[${index}] references an unknown boundary`);
    }),
  );
  agentTools.forEach((tool, index) =>
    (tool.boundaryIds ?? []).forEach((id) => {
      if (!agentBoundaryIds.has(id)) fail(`contract.agentSurface.tools[${index}] references an unknown boundary`);
    }),
  );

  let surfaceRelations: SurfaceRelation[] | undefined;
  if (contract.surfaceRelations !== undefined) {
    if (!Array.isArray(contract.surfaceRelations)) fail("contract.surfaceRelations must be an array");
    surfaceRelations = contract.surfaceRelations.map((relation, index) =>
      validateRelation(
        relation,
        index,
        new Set(humanActions.map((action) => action.id)),
        new Set(agentTools.map((tool) => tool.name)),
      ),
    );
  }

  return contract as unknown as DeveloperContractV2;
}

function validateBoundaryEvidence(value: unknown, label: string, entry: ExecutionEvidenceV2): BoundaryEvidence {
  const boundary = requireRecord(value, label);
  if (
    !new Set(["human", "application-agent", "client-runtime"]).has(
      requireString(boundary.origin, `${label}.origin`),
    )
  ) {
    fail(`${label}.origin is invalid`);
  }
  if (
    !new Set(["review", "confirmation", "approval"]).has(
      requireString(boundary.type, `${label}.type`),
    )
  ) fail(`${label}.type is invalid`);
  if (
    !new Set(["requested", "approved", "denied", "not-observed"]).has(
      requireString(boundary.status, `${label}.status`),
    )
  ) {
    fail(`${label}.status is invalid`);
  }
  if (!boundaryEvidenceSources.has(requireString(boundary.evidenceSource, `${label}.evidenceSource`))) {
    fail(`${label}.evidenceSource is invalid`);
  }
  optionalString(boundary.invocationId, `${label}.invocationId`);
  optionalString(boundary.observedAt, `${label}.observedAt`);
  if (boundary.invocationId !== undefined && entry.invocationId !== boundary.invocationId) {
    fail(`${label}.invocationId must match the containing execution entry`);
  }
  return boundary as unknown as BoundaryEvidence;
}

function validatePolicyEvidence(value: unknown, label: string, entry: ExecutionEvidenceV2): PolicyEvidence {
  const policy = requireRecord(value, label);
  if (
    !new Set(["allow", "reject", "rate_limit", "unresolved"]).has(
      requireString(policy.decision, `${label}.decision`),
    )
  ) {
    fail(`${label}.decision is invalid`);
  }
  if (policy.source !== "application-policy" && policy.source !== "client-runtime") {
    fail(`${label}.source is invalid`);
  }
  optionalString(policy.invocationId, `${label}.invocationId`);
  optionalString(policy.policyDecisionId, `${label}.policyDecisionId`);
  optionalString(policy.observedAt, `${label}.observedAt`);
  if (policy.invocationId !== undefined && entry.invocationId !== policy.invocationId) {
    fail(`${label}.invocationId must match the containing execution entry`);
  }
  return policy as unknown as PolicyEvidence;
}

function validateEffectOutcome(value: unknown, label: string, entry: ExecutionEvidenceV2): EffectOutcome {
  const outcome = requireRecord(value, label);
  requireString(outcome.effect, `${label}.effect`);
  if (
    !new Set(["occurred", "prevented", "unresolved"]).has(
      requireString(outcome.outcome, `${label}.outcome`),
    )
  ) {
    fail(`${label}.outcome is invalid`);
  }
  if (
    outcome.phase !== undefined &&
    !new Set(["temporary", "terminal", "unspecified"]).has(
      requireString(outcome.phase, `${label}.phase`),
    )
  ) {
    fail(`${label}.phase is invalid`);
  }
  if (!outcomeSources.has(requireString(outcome.source, `${label}.source`))) {
    fail(`${label}.source is invalid`);
  }
  optionalString(outcome.invocationId, `${label}.invocationId`);
  optionalString(outcome.effectObservationId, `${label}.effectObservationId`);
  optionalString(outcome.detail, `${label}.detail`);
  if (outcome.invocationId !== undefined && entry.invocationId !== outcome.invocationId) {
    fail(`${label}.invocationId must match the containing execution entry`);
  }
  return outcome as unknown as EffectOutcome;
}

function validateExecution(value: unknown, index: number): ExecutionEvidenceV2 {
  const label = `evidence.entries[${index}]`;
  const entry = requireRecord(value, label);
  requireString(entry.toolName, `${label}.toolName`);
  if (entry.technicalStatus !== "success" && entry.technicalStatus !== "error") {
    fail(`${label}.technicalStatus must be success or error`);
  }
  if (
    entry.statusCode !== undefined &&
    (typeof entry.statusCode !== "number" || !Number.isFinite(entry.statusCode))
  ) {
    fail(`${label}.statusCode must be a finite number`);
  }
  if (!Array.isArray(entry.observedEffects)) fail(`${label}.observedEffects must be an array`);
  entry.observedEffects.forEach((observed, observedIndex) => {
    const observedLabel = `${label}.observedEffects[${observedIndex}]`;
    const observedRecord = requireRecord(observed, observedLabel);
    requireString(observedRecord.effect, `${observedLabel}.effect`);
    if (!evidenceSources.has(observedRecord.source as EvidenceSource)) {
      fail(`${observedLabel}.source is invalid`);
    }
    optionalString(observedRecord.detail, `${observedLabel}.detail`);
  });
  optionalString(entry.invocationId, `${label}.invocationId`);
  optionalString(entry.observedAt, `${label}.observedAt`);
  if (
    entry.origin !== undefined &&
    !new Set(["application", "client-runtime", "human", "external-observer"]).has(
      requireString(entry.origin, `${label}.origin`),
    )
  ) {
    fail(`${label}.origin is invalid`);
  }
  optionalString(entry.resultSummary, `${label}.resultSummary`);
  if (entry.boundaryEvidence !== undefined) {
    if (!Array.isArray(entry.boundaryEvidence)) fail(`${label}.boundaryEvidence must be an array`);
    entry.boundaryEvidence.forEach((boundary, boundaryIndex) =>
      validateBoundaryEvidence(boundary, `${label}.boundaryEvidence[${boundaryIndex}]`, entry as unknown as ExecutionEvidenceV2),
    );
  }
  if (entry.policyEvidence !== undefined) {
    validatePolicyEvidence(entry.policyEvidence, `${label}.policyEvidence`, entry as unknown as ExecutionEvidenceV2);
  }
  if (entry.effectOutcomes !== undefined) {
    if (!Array.isArray(entry.effectOutcomes)) fail(`${label}.effectOutcomes must be an array`);
    entry.effectOutcomes.forEach((outcome, outcomeIndex) =>
      validateEffectOutcome(outcome, `${label}.effectOutcomes[${outcomeIndex}]`, entry as unknown as ExecutionEvidenceV2),
    );
  }
  return entry as unknown as ExecutionEvidenceV2;
}

export function validateEvidenceBundleV2(value: unknown): EvidenceBundleV2 {
  const evidence = requireRecord(value, "evidence");
  if (evidence.version !== 2) fail("evidence.version must be 2");
  requireString(evidence.runId, "evidence.runId");
  if (evidence.mode !== "live-execution" && evidence.mode !== "captured-fixture") {
    fail("evidence.mode is invalid");
  }
  if (
    !new Set(["complete", "partial", "unknown"]).has(
      requireString(evidence.completeness, "evidence.completeness"),
    )
  ) {
    fail("evidence.completeness is invalid");
  }
  requireString(evidence.applicationId, "evidence.applicationId");
  if (!Array.isArray(evidence.entries)) fail("evidence.entries must be an array");
  const entries = evidence.entries.map(validateExecution);
  return evidence as unknown as EvidenceBundleV2;
}

export function isRecordValue(value: unknown): value is Record<string, unknown> {
  return isRecord(value);
}

export type { JsonSchema };
