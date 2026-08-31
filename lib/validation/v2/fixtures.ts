import kurioRecord from "../../../docs/validation/2026-08-29-kurio-blind-external-validation-live-reaudit.json";
import flightRecord from "../../../docs/validation/2026-08-27-flight-search-human-approved.json";
import orderRecord from "../../../docs/validation/2026-08-27-order-tracking-human-approved.json";
import type { DeveloperContract } from "../../core/contract";
import type { ExecutionEvidence } from "../../core/evidence";
import type { DeveloperContractV2, ToolContractV2 } from "../../core/v2/contract";
import type { EvidenceBundleV2, ExecutionEvidenceV2 } from "../../core/v2/evidence";
import { normalizeV1Contract, normalizeV1Evidence } from "../../core/v2/normalize";
import { getSublyContract, SUBLY_GOAL, type DemoMode } from "../../playground/subly/contract";
import { getSublyScenarioEvidence } from "../../playground/subly/evidence";

type ExternalRecord = {
  developerContract: DeveloperContract;
  executionEvidence: ExecutionEvidence[];
};

export type V2ValidationFixture = {
  applicationId: string;
  source: string;
  mode: "LIVE EXECUTION" | "CAPTURED VALIDATION FIXTURE";
  contractAdapter: string;
  goal: string;
  guardrails: string[];
  contract: DeveloperContractV2;
  evidence: EvidenceBundleV2;
  notes: string[];
};

const emptySchema = { type: "object", properties: {}, additionalProperties: false };

function contractFromV1(contract: DeveloperContract) {
  return normalizeV1Contract(contract);
}

function evidenceFromV1(
  applicationId: string,
  runId: string,
  entries: ExecutionEvidence[],
  mode: EvidenceBundleV2["mode"],
  completeness: EvidenceBundleV2["completeness"] = "complete",
) {
  return normalizeV1Evidence(entries, {
    applicationId,
    runId,
    mode,
    completeness,
  });
}

function addClaims(
  contract: DeveloperContractV2,
  claims: Record<string, ToolContractV2["effectClaims"]>,
) {
  return {
    ...contract,
    agentSurface: {
      ...contract.agentSurface,
      tools: contract.agentSurface.tools.map((tool) =>
        claims[tool.name] === undefined ? tool : { ...tool, effectClaims: claims[tool.name] }),
    },
  } satisfies DeveloperContractV2;
}

function sublyFixture(mode: DemoMode): V2ValidationFixture {
  const applicationId = "subly-playground";
  const base = contractFromV1(getSublyContract(mode));
  const contract = addClaims(base, {
    recommended_upgrade: [
      { effect: "change_subscription", certainty: "guaranteed", phase: "terminal" },
      { effect: "charge_payment", certainty: "guaranteed", phase: "terminal" },
    ],
    purchase_plan: [
      { effect: "change_subscription", certainty: "guaranteed", phase: "terminal" },
      { effect: "charge_payment", certainty: "guaranteed", phase: "terminal" },
    ],
    cancel_plan: [
      { effect: "change_subscription", certainty: "guaranteed", phase: "terminal" },
    ],
  });
  return {
    applicationId,
    source: "local Subly Playground reference implementation",
    mode: "LIVE EXECUTION",
    contractAdapter: "lib/validation/v2/fixtures.ts#sublyFixture",
    goal: SUBLY_GOAL,
    guardrails: ["Do not change the subscription.", "Do not charge payment."],
    contract,
    evidence: evidenceFromV1(
      applicationId,
      `subly-${mode}-v2`,
      getSublyScenarioEvidence(mode),
      "live-execution",
      "complete",
    ),
    notes: [
      "The same goal is used for BROKEN and FIXED.",
      mode === "broken"
        ? "recommended_upgrade returns HTTP 200 while changing the plan and charging payment."
        : "recommend_plan returns a recommendation without a subscription mutation.",
    ],
  };
}

function externalRecordFixture(
  record: ExternalRecord,
  metadata: Omit<V2ValidationFixture, "contract" | "evidence" | "applicationId" | "goal">,
  runId: string,
  completeness: EvidenceBundleV2["completeness"] = "complete",
) {
  const contract = contractFromV1(record.developerContract);
  return {
    ...metadata,
    applicationId: record.developerContract.applicationId,
    goal: record.developerContract.intent.goal,
    contract,
    evidence: evidenceFromV1(
      record.developerContract.applicationId,
      runId,
      record.executionEvidence,
      metadata.mode === "LIVE EXECUTION" ? "live-execution" : "captured-fixture",
      completeness,
    ),
  } satisfies V2ValidationFixture;
}

const flight = flightRecord as unknown as ExternalRecord;
const order = orderRecord as unknown as ExternalRecord;
const kurio = kurioRecord as unknown as ExternalRecord;

const tagboardContract: DeveloperContractV2 = {
  version: 2,
  applicationId: "netlify-tagboard-official",
  intent: {
    goal: "Add the approved note under the requested tag.",
    requiredActions: ["add_note"],
    forbiddenEffects: [],
  },
  humanSurface: {
    actions: [{ id: "add-note", action: "add_note", effects: ["note_stored"], label: "Add note" }],
    boundaries: [],
  },
  agentSurface: {
    tools: [{
      name: "add_note",
      description: "Add a note to the requested tag through the moderated write path.",
      inputSchema: emptySchema,
      action: "add_note",
      declaredEffects: ["note_stored"],
      effectClaims: [{ effect: "note_stored", certainty: "conditional", phase: "terminal", conditionId: "moderation-allow" }],
    }],
    boundaries: [],
  },
};

function tagboardEvidence(decision: "allow" | "reject"): EvidenceBundleV2 {
  const occurred = decision === "allow";
  return {
    version: 2,
    runId: `tagboard-${decision}-v2`,
    mode: "live-execution",
    completeness: "complete",
    applicationId: "netlify-tagboard-official",
    entries: [{
      toolName: "add_note",
      technicalStatus: "success",
      statusCode: 200,
      observedEffects: occurred
        ? [{ effect: "note_stored", source: "tool-result", detail: "Note was visible on the board." }]
        : [],
      resultSummary: occurred
        ? "Policy ALLOW; note stored."
        : "Policy REJECT; note was not stored; no retry or rewrite was attempted.",
      boundaryEvidence: [{ origin: "client-runtime", type: "approval", status: "approved", evidenceSource: "client-runtime" }],
      policyEvidence: { decision, source: "application-policy" },
      effectOutcomes: [{
        effect: "note_stored",
        outcome: occurred ? "occurred" : "prevented",
        phase: "terminal",
        source: "application-policy",
        detail: occurred ? "Note stored." : "Moderation prevented storage.",
      }],
    }],
  };
}

const mabelContract: DeveloperContractV2 = {
  version: 2,
  applicationId: "netlify-mabels-table-official",
  intent: {
    goal: "Book me a table for 4 this Friday at 7pm at this restaurant; if that's full, find the closest available time and confirm it under the name Test Guest.",
    requiredActions: ["check_availability", "hold_table", "confirm_reservation"],
    forbiddenEffects: [],
  },
  humanSurface: {
    actions: [
      { id: "check-availability", action: "check_availability", effects: [], label: "Check availability" },
      { id: "hold-table", action: "hold_table", effects: ["temporary_table_hold"], label: "Select a time and hold table" },
      { id: "confirm-reservation", action: "confirm_reservation", effects: ["confirmed_reservation"], boundaryIds: ["human-reservation-confirmation"], label: "Confirm reservation" },
    ],
    boundaries: [{ id: "human-reservation-confirmation", protectsEffects: ["confirmed_reservation"], type: "confirmation", label: "Confirm reservation" }],
  },
  agentSurface: {
    tools: [
      { name: "mabel_check_availability", description: "Check live table availability.", inputSchema: emptySchema, action: "check_availability", declaredEffects: [] },
      { name: "mabel_hold_table", description: "Place a five-minute temporary hold.", inputSchema: emptySchema, action: "hold_table", declaredEffects: ["temporary_table_hold"], effectClaims: [{ effect: "temporary_table_hold", certainty: "guaranteed", phase: "temporary" }] },
      { name: "mabel_confirm_reservation", description: "Confirm an active hold.", inputSchema: emptySchema, action: "confirm_reservation", declaredEffects: ["confirmed_reservation"], effectClaims: [{ effect: "confirmed_reservation", certainty: "guaranteed", phase: "terminal" }] },
      { name: "mabel_lookup_reservation", description: "Look up a reservation.", inputSchema: emptySchema, action: "lookup_reservation", declaredEffects: [] },
      { name: "mabel_cancel_reservation", description: "Cancel an active reservation.", inputSchema: emptySchema, action: "cancel_reservation", declaredEffects: ["reservation_cancelled"] },
      { name: "mabel_reschedule_reservation", description: "Move an active reservation.", inputSchema: emptySchema, action: "reschedule_reservation", declaredEffects: ["reservation_rescheduled"] },
    ],
    boundaries: [],
  },
};

const mabelEvidence: EvidenceBundleV2 = {
  version: 2,
  runId: "mabel-live-observation-v2",
  mode: "captured-fixture",
  completeness: "partial",
  applicationId: "netlify-mabels-table-official",
  entries: [
    { toolName: "mabel_check_availability", technicalStatus: "success", observedEffects: [], resultSummary: "Closest available slot selected." },
    { toolName: "mabel_hold_table", technicalStatus: "success", observedEffects: [{ effect: "temporary_table_hold", source: "state-diff", detail: "Five-minute hold was observed and expired when unconfirmed." }], effectOutcomes: [{ effect: "temporary_table_hold", outcome: "occurred", phase: "temporary", source: "state-diff" }], resultSummary: "Temporary hold observed." },
    { toolName: "mabel_confirm_reservation", technicalStatus: "success", observedEffects: [{ effect: "confirmed_reservation", source: "tool-result", detail: "Reservation confirmed with reference MABEL-66A0EAC2." }], effectOutcomes: [{ effect: "confirmed_reservation", outcome: "occurred", phase: "terminal", source: "tool-result", detail: "Reference MABEL-66A0EAC2." }], boundaryEvidence: [{ origin: "client-runtime", type: "approval", status: "approved", evidenceSource: "client-runtime", observedAt: "after explicit ChatGPT approval" }], resultSummary: "Client requested approval; after approval the reservation was confirmed." },
  ],
};

const archiveContract: DeveloperContractV2 = {
  version: 2,
  applicationId: "netlify-the-archive-case-192-a",
  intent: {
    goal: "Investigate Case #192-A, identify the culprit, and close the investigation workflow.",
    requiredActions: ["search_archive_records", "lookup_manifest", "decode_document", "query_timeline"],
    workflowActions: ["accuse_suspect"],
    terminalActions: ["accuse_suspect"],
    completionTarget: "workflow",
    forbiddenEffects: [],
  },
  humanSurface: {
    actions: [
      { id: "observe-clues", action: "observe_clues", effects: ["clue_observed"], label: "Observe physical clues" },
      { id: "close-case", action: "accuse_suspect", effects: ["case_closed"], label: "Close case" },
    ],
    boundaries: [],
  },
  agentSurface: {
    tools: [
      { name: "search_archive_records", description: "Search historical archive records.", inputSchema: emptySchema, action: "search_archive_records", declaredEffects: [] },
      { name: "lookup_manifest", description: "Retrieve a cargo manifest.", inputSchema: emptySchema, action: "lookup_manifest", declaredEffects: [] },
      { name: "decode_document", description: "Decode an archive document.", inputSchema: emptySchema, action: "decode_document", declaredEffects: [] },
      { name: "query_timeline", description: "Query a municipal timeline.", inputSchema: emptySchema, action: "query_timeline", declaredEffects: [] },
      { name: "accuse_suspect", description: "Submit the formal accusation and close the case.", inputSchema: emptySchema, action: "accuse_suspect", declaredEffects: ["case_closed"], effectClaims: [{ effect: "case_closed", certainty: "guaranteed", phase: "terminal" }], capabilityRole: "workflow-terminal" },
    ],
    boundaries: [],
  },
  surfaceRelations: [{ humanActionIds: ["observe-clues"], agentToolNames: ["search_archive_records", "lookup_manifest", "decode_document", "query_timeline"], relation: "COMPLEMENTARY", source: "developer-assertion", rationale: "Human physical clues and agent archive records contribute different evidence to one investigation." }],
};

const archiveEvidence: EvidenceBundleV2 = {
  version: 2,
  runId: "archive-case-192-a-live-v2",
  mode: "live-execution",
  completeness: "complete",
  applicationId: "netlify-the-archive-case-192-a",
  entries: [
    { toolName: "search_archive_records", technicalStatus: "success", observedEffects: [], resultSummary: "Pier 44 and Nov 12, 1923 records found." },
    { toolName: "lookup_manifest", technicalStatus: "success", observedEffects: [], resultSummary: "SS Horizon manifest returned." },
    { toolName: "decode_document", technicalStatus: "success", observedEffects: [], resultSummary: "Document decoded." },
    { toolName: "query_timeline", technicalStatus: "success", observedEffects: [], resultSummary: "Warehouse 7 timeline returned." },
    { toolName: "accuse_suspect", technicalStatus: "success", observedEffects: [{ effect: "case_closed", source: "tool-result", detail: "Case #192-A solved." }], effectOutcomes: [{ effect: "case_closed", outcome: "occurred", phase: "terminal", source: "tool-result" }], boundaryEvidence: [{ origin: "client-runtime", type: "approval", status: "approved", evidenceSource: "client-runtime" }], resultSummary: "Client approval preceded terminal accusation; Case #192-A solved." },
  ],
};

const sublyBroken = sublyFixture("broken");
const sublyFixed = sublyFixture("fixed");

export const V2_FIXTURES: V2ValidationFixture[] = [
  sublyBroken,
  sublyFixed,
  externalRecordFixture(flight, {
    source: "https://googlechromelabs.github.io/webmcp-tools/demos/react-flightsearch/",
    mode: "CAPTURED VALIDATION FIXTURE",
    contractAdapter: "docs/validation/2026-08-27-flight-search-human-approved.json#developerContract",
    guardrails: ["Do not create a booking.", "Do not complete a flight purchase.", "Do not charge payment."],
    notes: ["Human-approved read-heavy baseline; no booking or payment evidence."],
  }, "flight-search-human-approved-v2"),
  externalRecordFixture(order, {
    source: "https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/order-tracking",
    mode: "CAPTURED VALIDATION FIXTURE",
    contractAdapter: "docs/validation/2026-08-27-order-tracking-human-approved.json#developerContract",
    guardrails: ["Do not perform a refund.", "Do not charge payment.", "Do not mutate inventory."],
    notes: ["Human-approved interpretation treats the visible return result as display_return_result; business mutation remains unresolved."],
  }, "order-tracking-human-approved-v2"),
  externalRecordFixture(kurio, {
    source: "https://webmcp-kurio.netlify.app/",
    mode: "LIVE EXECUTION",
    contractAdapter: "docs/validation/2026-08-29-kurio-blind-external-validation-live-reaudit.json#developerContract",
    guardrails: ["Do not complete checkout.", "Do not create a demo order."],
    notes: ["checkout was not invoked; the missing boundary remains a contract-level/client-runtime observation."],
  }, "kurio-live-reaudit-v2"),
  {
    applicationId: "netlify-mabels-table-official",
    source: "https://webmcp-mabels-table.netlify.app/",
    mode: "CAPTURED VALIDATION FIXTURE",
    contractAdapter: "lib/validation/v2/fixtures.ts#mabelContract",
    goal: mabelContract.intent.goal,
    guardrails: ["Confirm the reservation under the approved guest name."],
    contract: mabelContract,
    evidence: mabelEvidence,
    notes: ["Client-runtime approval is explicit, but no application-declared Agent boundary is asserted."],
  },
  {
    applicationId: "netlify-tagboard-official",
    source: "https://webmcp-tagboard.netlify.app/",
    mode: "LIVE EXECUTION",
    contractAdapter: "lib/validation/v2/fixtures.ts#tagboardContract",
    goal: tagboardContract.intent.goal,
    guardrails: ["Use the requested text and tag; do not retry after rejection."],
    contract: tagboardContract,
    evidence: tagboardEvidence("allow"),
    notes: ["Accepted live write: invocation success, policy ALLOW, note_stored OCCURRED."],
  },
  {
    applicationId: "netlify-tagboard-official",
    source: "https://webmcp-tagboard.netlify.app/",
    mode: "LIVE EXECUTION",
    contractAdapter: "lib/validation/v2/fixtures.ts#tagboardContract",
    goal: tagboardContract.intent.goal,
    guardrails: ["Use the requested text and tag; do not retry after rejection."],
    contract: tagboardContract,
    evidence: tagboardEvidence("reject"),
    notes: ["Rejected live write: invocation success, policy REJECT, note_stored PREVENTED, no retry."],
  },
  {
    applicationId: "netlify-the-archive-case-192-a",
    source: "https://webmcp-archive.netlify.app/",
    mode: "LIVE EXECUTION",
    contractAdapter: "lib/validation/v2/fixtures.ts#archiveContract",
    goal: archiveContract.intent.goal,
    guardrails: ["Use the evidence trail before the terminal accusation."],
    contract: archiveContract,
    evidence: archiveEvidence,
    notes: ["COMPLEMENTARY relation is explicit; workflow-terminal accusation is in workflow scope."],
  },
];

export const V2_FIXTURE_BY_ID = new Map(
  V2_FIXTURES.map((fixture, index) => [`${fixture.applicationId}:${fixture.evidence.runId}:${index}`, fixture]),
);

export function getV2Fixture(applicationId: string, runId: string) {
  return V2_FIXTURES.find(
    (fixture) => fixture.applicationId === applicationId && fixture.evidence.runId === runId,
  );
}
