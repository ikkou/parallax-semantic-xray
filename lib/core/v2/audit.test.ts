import assert from "node:assert/strict";
import test from "node:test";
import type { DeveloperContractV2 } from "./contract";
import type { EvidenceBundleV2, ExecutionEvidenceV2 } from "./evidence";
import { normalizeV1Contract, normalizeV1Evidence } from "./normalize";
import { runSemanticAuditV2 } from "./audit";
import { validateDeveloperContractV2, validateEvidenceBundleV2, V2ValidationError } from "./validation";

const schema = { type: "object", properties: {}, additionalProperties: false };

function contract(overrides: Partial<DeveloperContractV2["intent"]> = {}): DeveloperContractV2 {
  return {
    version: 2,
    applicationId: "fixture-app",
    intent: {
      goal: "Inspect the record without changing state.",
      requiredActions: ["inspect_record"],
      forbiddenEffects: ["delete_file"],
      ...overrides,
    },
    humanSurface: {
      actions: [
        { id: "inspect", action: "inspect_record", effects: [], label: "Inspect" },
      ],
      boundaries: [],
    },
    agentSurface: {
      tools: [
        {
          name: "inspect_record",
          description: "Inspect a record.",
          inputSchema: schema,
          action: "inspect_record",
          declaredEffects: [],
          annotations: { readOnlyHint: true },
        },
      ],
      boundaries: [],
    },
  };
}

function evidence(
  entries: ExecutionEvidenceV2[],
  completeness: EvidenceBundleV2["completeness"] = "complete",
): EvidenceBundleV2 {
  return {
    version: 2,
    runId: "fixture-run",
    mode: "captured-fixture",
    completeness,
    applicationId: "fixture-app",
    entries,
  };
}

function entry(
  toolName: string,
  options: Partial<ExecutionEvidenceV2> = {},
): ExecutionEvidenceV2 {
  return {
    toolName,
    technicalStatus: "success",
    observedEffects: [],
    ...options,
  };
}

test("conditional policy outcomes remain technically successful and distinguish occurred from prevented", () => {
  const addNoteContract: DeveloperContractV2 = {
    ...contract({ goal: "Add a note when the application policy allows it.", requiredActions: ["add_note"], forbiddenEffects: [] }),
    humanSurface: {
      actions: [{ id: "add-note", action: "add_note", effects: ["note_stored"] }],
      boundaries: [],
    },
    agentSurface: {
      tools: [{
        name: "add_note",
        description: "Add a note when policy allows.",
        inputSchema: schema,
        action: "add_note",
        declaredEffects: ["note_stored"],
        effectClaims: [{ effect: "note_stored", certainty: "conditional", phase: "terminal", conditionId: "moderation-allow" }],
      }],
      boundaries: [],
    },
  };
  const accepted = runSemanticAuditV2(addNoteContract, evidence([
    entry("add_note", {
      invocationId: "add-1",
      observedEffects: [{ effect: "note_stored", source: "tool-result" }],
      policyEvidence: { decision: "allow", source: "application-policy", invocationId: "add-1" },
      effectOutcomes: [{ effect: "note_stored", outcome: "occurred", phase: "terminal", source: "application-policy", invocationId: "add-1" }],
    }),
  ]));
  const rejected = runSemanticAuditV2(addNoteContract, evidence([
    entry("add_note", {
      invocationId: "add-2",
      policyEvidence: { decision: "reject", source: "application-policy", invocationId: "add-2" },
      effectOutcomes: [{ effect: "note_stored", outcome: "prevented", phase: "terminal", source: "application-policy", invocationId: "add-2" }],
    }),
  ]));

  assert.equal(accepted.technicalStatus, "pass");
  assert.equal(rejected.technicalStatus, "pass");
  assert.equal(accepted.semanticStatus, "pass");
  assert.equal(rejected.semanticStatus, "pass");
  assert.deepEqual(accepted.policyOutcomes.map((item) => item.decision), ["allow"]);
  assert.deepEqual(rejected.policyOutcomes.map((item) => item.decision), ["reject"]);
  assert.deepEqual(accepted.effectOutcomes.map((item) => item.outcome), ["occurred"]);
  assert.deepEqual(rejected.effectOutcomes.map((item) => item.outcome), ["prevented"]);
  assert.deepEqual(rejected.gaps, []);
});

test("a prevented explicitly required effect fails intent without becoming a technical failure", () => {
  const required = contract({ requiredEffects: ["save_record"], requiredActions: ["inspect_record"] });
  const withWriter: DeveloperContractV2 = {
    ...required,
    agentSurface: {
      tools: [
        ...required.agentSurface.tools,
        { name: "save_record", description: "Save a record.", inputSchema: schema, action: "save_record", declaredEffects: ["save_record"] },
      ],
      boundaries: [],
    },
  };
  const result = runSemanticAuditV2(withWriter, evidence([
    entry("inspect_record"),
    entry("save_record", {
      invocationId: "save-1",
      policyEvidence: { decision: "reject", source: "application-policy", invocationId: "save-1" },
      effectOutcomes: [{ effect: "save_record", outcome: "prevented", source: "application-policy", invocationId: "save-1" }],
    }),
  ]));
  assert.equal(result.technicalStatus, "pass");
  assert.equal(result.statuses.intent, "fail");
  assert.equal(result.semanticStatus, "fail");
  assert.ok(result.gaps.some((gap) => gap.rule === "missing-required-effect"));
});

test("forbidden effect fails even when the technical invocation succeeds", () => {
  const dangerous: DeveloperContractV2 = {
    ...contract({ goal: "Inspect files.", requiredActions: ["inspect_files"], forbiddenEffects: ["delete_file"] }),
    humanSurface: { actions: [{ id: "inspect-files", action: "inspect_files", effects: [] }], boundaries: [] },
    agentSurface: {
      tools: [{ name: "inspect_files", description: "Inspect files.", inputSchema: schema, action: "inspect_files", declaredEffects: ["delete_file"] }],
      boundaries: [],
    },
  };
  const result = runSemanticAuditV2(dangerous, evidence([
    entry("inspect_files", {
      statusCode: 200,
      observedEffects: [{ effect: "delete_file", source: "runtime-instrumentation" }],
      effectOutcomes: [{ effect: "delete_file", outcome: "occurred", source: "runtime-instrumentation" }],
    }),
  ]));
  assert.equal(result.technicalStatus, "pass");
  assert.equal(result.statuses.intent, "fail");
  assert.equal(result.semanticStatus, "fail");
  assert.equal(result.gaps[0]?.rule, "forbidden-effect");
});

test("a clean read-only workflow is a valid PASS", () => {
  const result = runSemanticAuditV2(contract(), evidence([
    entry("inspect_record", { statusCode: 200, resultSummary: "record returned" }),
  ]));
  assert.deepEqual(result.statuses, { intent: "pass", parity: "pass", agency: "pass" });
  assert.equal(result.technicalStatus, "pass");
  assert.equal(result.semanticStatus, "pass");
  assert.deepEqual(result.gaps, []);
});

test("partial or unknown evidence produces WARN instead of an invented PASS", () => {
  const result = runSemanticAuditV2(contract({ requiredActions: ["inspect_record", "compare_record"] }), evidence([
    entry("inspect_record"),
  ], "partial"));
  assert.equal(result.technicalStatus, "pass");
  assert.equal(result.statuses.intent, "warning");
  assert.equal(result.semanticStatus, "warning");
  assert.ok(result.gaps.some((gap) => gap.rule === "missing-required-action" && gap.status === "warning"));
  assert.ok(result.evidenceQualifiers.includes("Evidence completeness: PARTIAL"));
});

test("readOnlyHint does not override an observed mutation", () => {
  const mismatch: DeveloperContractV2 = {
    ...contract(),
    humanSurface: {
      actions: [{ id: "delete", action: "delete_file", effects: ["delete_file"], boundaryIds: ["review-delete"] }],
      boundaries: [{ id: "review-delete", protectsEffects: ["delete_file"], type: "review" }],
    },
    agentSurface: {
      tools: [{ name: "inspect_files", description: "Inspect files.", inputSchema: schema, action: "inspect_files", declaredEffects: [], annotations: { readOnlyHint: true } }],
      boundaries: [],
    },
  };
  const result = runSemanticAuditV2(mismatch, evidence([
    entry("inspect_files", {
      observedEffects: [{ effect: "delete_file", source: "runtime-instrumentation" }],
      effectOutcomes: [{ effect: "delete_file", outcome: "occurred", source: "runtime-instrumentation" }],
    }),
  ]));
  assert.equal(result.statuses.parity, "fail");
  assert.ok(result.gaps.some((gap) => gap.rule === "declaration-observation-mismatch"));
});

test("a protected effect without an application boundary fails when complete evidence proves it occurred", () => {
  const protectedContract: DeveloperContractV2 = {
    ...contract({ goal: "Reserve a slot.", requiredActions: ["reserve_slot"], forbiddenEffects: [] }),
    humanSurface: {
      actions: [{ id: "reserve", action: "reserve_slot", effects: ["slot_reserved"], boundaryIds: ["human-confirm"] }],
      boundaries: [{ id: "human-confirm", protectsEffects: ["slot_reserved"], type: "confirmation" }],
    },
    agentSurface: {
      tools: [{ name: "reserve_slot", description: "Reserve a slot.", inputSchema: schema, action: "reserve_slot", declaredEffects: ["slot_reserved"] }],
      boundaries: [],
    },
  };
  const result = runSemanticAuditV2(protectedContract, evidence([
    entry("reserve_slot", {
      observedEffects: [{ effect: "slot_reserved", source: "runtime-instrumentation" }],
      effectOutcomes: [{ effect: "slot_reserved", outcome: "occurred", phase: "terminal", source: "runtime-instrumentation" }],
    }),
  ]));
  assert.equal(result.statuses.parity, "fail");
  assert.equal(result.semanticStatus, "fail");
  assert.ok(result.gaps.some((gap) => gap.rule === "missing-confirmation-boundary" && gap.status === "fail"));
});

test("client approval is preserved separately and qualifies, but does not become an application boundary", () => {
  const protectedContract: DeveloperContractV2 = {
    ...contract({ goal: "Reserve a slot.", requiredActions: ["reserve_slot"], forbiddenEffects: [] }),
    humanSurface: {
      actions: [{ id: "reserve", action: "reserve_slot", effects: ["slot_reserved"], boundaryIds: ["human-confirm"] }],
      boundaries: [{ id: "human-confirm", protectsEffects: ["slot_reserved"], type: "confirmation" }],
    },
    agentSurface: {
      tools: [{ name: "reserve_slot", description: "Reserve a slot.", inputSchema: schema, action: "reserve_slot", declaredEffects: ["slot_reserved"] }],
      boundaries: [],
    },
  };
  const result = runSemanticAuditV2(protectedContract, evidence([
    entry("reserve_slot", {
      invocationId: "reserve-1",
      boundaryEvidence: [{ origin: "client-runtime", type: "approval", status: "approved", invocationId: "reserve-1", evidenceSource: "client-runtime" }],
      effectOutcomes: [{ effect: "slot_reserved", outcome: "occurred", phase: "terminal", source: "runtime-instrumentation", invocationId: "reserve-1" }],
    }),
  ]));
  assert.equal(result.statuses.parity, "warning");
  assert.equal(result.semanticStatus, "warning");
  assert.equal(result.boundaryEvidence[0]?.origin, "client-runtime");
  assert.equal(result.gaps[0]?.qualification, "CLIENT-RUNTIME APPROVED / APPLICATION BOUNDARY NOT ESTABLISHED");
  assert.deepEqual(protectedContract.agentSurface.boundaries, []);
});

test("temporary effect is not treated as a terminal confirmation outcome", () => {
  const holdContract: DeveloperContractV2 = {
    ...contract({ goal: "Hold a slot temporarily.", requiredActions: ["hold_slot"], forbiddenEffects: [] }),
    humanSurface: { actions: [{ id: "hold", action: "hold_slot", effects: ["temporary_hold"] }], boundaries: [] },
    agentSurface: {
      tools: [{ name: "hold_slot", description: "Hold a slot for five minutes.", inputSchema: schema, action: "hold_slot", declaredEffects: ["temporary_hold"], effectClaims: [{ effect: "temporary_hold", certainty: "guaranteed", phase: "temporary" }] }],
      boundaries: [],
    },
  };
  const result = runSemanticAuditV2(holdContract, evidence([
    entry("hold_slot", { effectOutcomes: [{ effect: "temporary_hold", outcome: "occurred", phase: "temporary", source: "state-diff" }] }),
  ]));
  assert.equal(result.semanticStatus, "pass");
  assert.equal(result.effectOutcomes[0]?.phase, "temporary");
  assert.equal(result.gaps.length, 0);
});

test("semantic overloading is derived from separated human actions and an agent tool relationship", () => {
  const overloaded: DeveloperContractV2 = {
    ...contract({ goal: "Recommend an option.", requiredActions: ["recommend_option"], forbiddenEffects: [] }),
    humanSurface: {
      actions: [
        { id: "recommend", action: "recommend_option", effects: [] },
        { id: "purchase", action: "purchase_option", effects: ["option_purchased"], boundaryIds: ["review-purchase"] },
      ],
      boundaries: [{ id: "review-purchase", protectsEffects: ["option_purchased"], type: "review" }],
    },
    agentSurface: {
      tools: [{ name: "recommended_purchase", description: "Recommend and purchase an option.", inputSchema: schema, action: "recommend_option", declaredEffects: ["option_purchased"] }],
      boundaries: [],
    },
  };
  const result = runSemanticAuditV2(overloaded, evidence([entry("recommended_purchase")]));
  assert.equal(result.statuses.parity, "fail");
  assert.ok(result.gaps.some((gap) => gap.rule === "semantic-overloading"));
});

test("excess agency remains an exposure warning and workflow-terminal capability can be explicitly in scope", () => {
  const extra: DeveloperContractV2 = {
    ...contract({ goal: "Inspect a record.", requiredActions: ["inspect_record"], forbiddenEffects: [] }),
    agentSurface: {
      tools: [
        ...contract().agentSurface.tools,
        { name: "delete_record", description: "Delete a record.", inputSchema: schema, action: "delete_record", declaredEffects: ["delete_file"] },
      ],
      boundaries: [],
    },
  };
  const extraResult = runSemanticAuditV2(extra, evidence([entry("inspect_record")]));
  assert.equal(extraResult.statuses.agency, "warning");
  assert.equal(extraResult.gaps.find((gap) => gap.rule === "excess-agency")?.scope, "exposed");

  const workflow: DeveloperContractV2 = {
    ...extra,
    intent: {
      ...extra.intent,
      goal: "Complete the investigation workflow.",
      completionTarget: "workflow",
      workflowActions: ["inspect_record", "accuse_record"],
      terminalActions: ["accuse_record"],
    },
    agentSurface: {
      tools: [
        ...extra.agentSurface.tools,
        { name: "accuse_record", description: "Close the investigation.", inputSchema: schema, action: "accuse_record", declaredEffects: ["delete_file"], capabilityRole: "workflow-terminal" },
      ],
      boundaries: [],
    },
  };
  const workflowResult = runSemanticAuditV2(workflow, evidence([
    entry("inspect_record"),
    entry("accuse_record", { effectOutcomes: [{ effect: "delete_file", outcome: "occurred", source: "runtime-instrumentation", phase: "terminal" }] }),
  ]));
  assert.equal(workflowResult.gaps.filter((gap) => gap.rule === "excess-agency").length, 1);
  assert.ok(workflowResult.gaps.some((gap) => gap.rule === "excess-agency" && gap.observed?.some((item) => item.includes("delete_record"))));
});

test("COMPLEMENTARY surface relations prevent a surface-difference false gap", () => {
  const complementary: DeveloperContractV2 = {
    ...contract({ goal: "Investigate the case.", requiredActions: ["search_records"], forbiddenEffects: [] }),
    humanSurface: { actions: [{ id: "observe-clues", action: "observe_clues", effects: [] }], boundaries: [] },
    agentSurface: {
      tools: [{ name: "search_records", description: "Search records.", inputSchema: schema, action: "search_records", declaredEffects: [] }],
      boundaries: [],
    },
    surfaceRelations: [{ humanActionIds: ["observe-clues"], agentToolNames: ["search_records"], relation: "COMPLEMENTARY", source: "developer-assertion", rationale: "Human clues and agent records contribute different evidence." }],
  };
  const result = runSemanticAuditV2(complementary, evidence([entry("search_records")]));
  const row = result.matrix.find((item) => item.capability === "observe_clues");
  assert.equal(row?.alignment, "Aligned");
  assert.equal(row?.relation, "COMPLEMENTARY");
  assert.deepEqual(result.gaps, []);
});

test("v1 normalization preserves observed provenance without inventing policy or invocation evidence", () => {
  const legacyContract = {
    applicationId: "legacy-files",
    intent: { goal: "Inspect files.", requiredActions: ["inspect_files"], forbiddenEffects: ["delete_file"] },
    humanSurface: { actions: [{ id: "inspect", action: "inspect_files", effects: [] }], boundaries: [] },
    agentSurface: { tools: [{ name: "inspect_files", description: "Inspect files.", inputSchema: schema, action: "inspect_files", declaredEffects: [], annotations: { readOnlyHint: true } }], boundaries: [] },
  };
  const normalizedContract = normalizeV1Contract(legacyContract);
  const normalizedEvidence = normalizeV1Evidence([
    { toolName: "inspect_files", technicalStatus: "success", observedEffects: [{ effect: "read_files", source: "tool-result" }] },
  ], { applicationId: "legacy-files", runId: "legacy-run", executionComplete: true });
  assert.equal(normalizedContract.version, 2);
  assert.equal(normalizedEvidence.completeness, "complete");
  assert.equal(normalizedEvidence.entries[0]?.effectOutcomes?.[0]?.outcome, "occurred");
  assert.equal(normalizedEvidence.entries[0]?.invocationId, undefined);
  assert.equal(normalizedEvidence.entries[0]?.policyEvidence, undefined);
});

test("v2 result is deterministic for identical inputs", () => {
  const first = runSemanticAuditV2(contract(), evidence([entry("inspect_record", { statusCode: 200 })]));
  const second = runSemanticAuditV2(contract(), evidence([entry("inspect_record", { statusCode: 200 })]));
  assert.equal(JSON.stringify(first), JSON.stringify(second));
});

test("invalid relation and missing outcome correlation are rejected", () => {
  const invalidRelation = {
    ...contract(),
    surfaceRelations: [{ humanActionIds: ["missing"], agentToolNames: ["inspect_record"], relation: "COMPLEMENTARY", source: "developer-assertion" }],
  };
  assert.throws(() => validateDeveloperContractV2(invalidRelation), V2ValidationError);

  const invalidEvidence = evidence([entry("inspect_record", {
    policyEvidence: { decision: "allow", source: "application-policy", invocationId: "not-on-entry" },
  })]);
  assert.throws(() => validateEvidenceBundleV2(invalidEvidence), V2ValidationError);
});
