import type { ExternalToolSnapshot, ExternalValidationRecord, ValidationAuthority } from "./types";
import type { DeveloperContractV2 } from "../core/v2/contract";
import type { EvidenceBundleV2, ExecutionEvidenceV2 } from "../core/v2/evidence";
import { runSemanticAuditV2 } from "../core/v2/audit";
import { normalizeV1Contract, normalizeV1Evidence } from "../core/v2/normalize";
import { getSublyContractV2, getSublyEvidenceV2 } from "../playground/subly/v2";
import { getSublyScenarioEvidence } from "../playground/subly/evidence";
import { SUBLY_GOAL, SUBLY_APPLICATION_ID, type DemoMode } from "../playground/subly/contract";
import { CINEFLOW_VALIDATION } from "./chrome-labs/cineflow";
import { WEBMCP_KIT_FLIGHT_VALIDATION } from "./independent/webmcp-kit-flight-booking";
import { V2_FIXTURES, type V2ValidationFixture } from "./v2/fixtures";
import type { ToolContractV2 } from "../core/v2/contract";
import { projectAudit, type XRayAuditViewModel } from "../integration/xray";

export type ValidationContextKind = "live-playground" | "captured-external";

export type ValidationContextId =
  | "subly-broken"
  | "subly-fixed"
  | "flight-search"
  | "cineflow"
  | "order-tracking"
  | "independent-flight-booking"
  | "kurio"
  | "mabels-table"
  | "tagboard-accepted"
  | "tagboard-rejected"
  | "the-archive";

export type ValidationContext = {
  id: ValidationContextId;
  label: string;
  kind: ValidationContextKind;
  authority: ValidationAuthority;
  evidenceMaturity: string;
  applicationId: string;
  source: string;
  runtimeUrl?: string;
  goal: string;
  modelVersion: 2;
  evidenceMode: EvidenceBundleV2["mode"];
  evidenceCompleteness: EvidenceBundleV2["completeness"];
  contract: DeveloperContractV2;
  toolSnapshot: ExternalToolSnapshot[];
  executionEvidence: ExecutionEvidenceV2[];
  audit: XRayAuditViewModel;
  record?: ExternalValidationRecord;
  auditHistory?: AuditHistoryEntry[];
};

export type AuditHistoryEntry = {
  label: string;
  detail: string;
  tone: "historical" | "review" | "approved";
};

function toolSnapshot(contract: DeveloperContractV2): ExternalToolSnapshot[] {
  return contract.agentSurface.tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    annotations: tool.annotations === undefined ? null : { ...tool.annotations },
  }));
}

function contextFromV2Fixture(
  id: ValidationContextId,
  label: string,
  fixture: V2ValidationFixture,
  authority: ValidationAuthority = "CAPTURED",
  auditHistory?: AuditHistoryEntry[],
): ValidationContext {
  const audit = runSemanticAuditV2(fixture.contract, fixture.evidence);
  return {
    id,
    label,
    kind: "captured-external",
    authority,
    evidenceMaturity: `${fixture.mode} · ${fixture.evidence.completeness.toUpperCase()}`,
    applicationId: fixture.applicationId,
    source: fixture.source,
    goal: fixture.goal,
    modelVersion: 2,
    evidenceMode: fixture.evidence.mode,
    evidenceCompleteness: fixture.evidence.completeness,
    contract: fixture.contract,
    toolSnapshot: toolSnapshot(fixture.contract),
    executionEvidence: fixture.evidence.entries,
    audit: projectAudit(audit),
    auditHistory,
  };
}

function contextFromRecord(
  id: ValidationContextId,
  label: string,
  record: ExternalValidationRecord,
  auditHistory?: AuditHistoryEntry[],
): ValidationContext {
  const contract = normalizeV1Contract(record.developerContract);
  const evidence = normalizeV1Evidence(record.executionEvidence, {
    applicationId: record.applicationId,
    runId: `${id}-v2`,
    mode: record.mode === "LIVE EXECUTION" ? "live-execution" : "captured-fixture",
    completeness: "complete",
  });
  const audit = runSemanticAuditV2(contract, evidence);
  return {
    id,
    label,
    kind: "captured-external",
    authority: record.authority ?? "CAPTURED",
    evidenceMaturity: record.evidenceMaturity ?? `${record.mode} · v2 recomputed`,
    applicationId: record.applicationId,
    source: record.source,
    runtimeUrl: record.runtimeUrl,
    goal: record.goal,
    modelVersion: 2,
    evidenceMode: evidence.mode,
    evidenceCompleteness: evidence.completeness,
    contract,
    toolSnapshot: record.toolSnapshot,
    executionEvidence: evidence.entries,
    audit: projectAudit(audit),
    record,
    auditHistory,
  };
}

function sublyContext(mode: DemoMode): ValidationContext {
  const contract = getSublyContractV2(mode);
  const evidence = getSublyEvidenceV2(mode, getSublyScenarioEvidence(mode));
  return {
    id: mode === "broken" ? "subly-broken" : "subly-fixed",
    label: `Subly — ${mode.toUpperCase()}`,
    kind: "live-playground",
    authority: "LIVE PLAYGROUND",
    evidenceMaturity: "live playground reference",
    applicationId: SUBLY_APPLICATION_ID,
    source: "lib/playground/subly",
    runtimeUrl: "http://127.0.0.1:3000/",
    goal: SUBLY_GOAL,
    modelVersion: 2,
    evidenceMode: evidence.mode,
    evidenceCompleteness: evidence.completeness,
    contract,
    toolSnapshot: toolSnapshot(contract),
    executionEvidence: evidence.entries,
    audit: projectAudit(runSemanticAuditV2(contract, evidence)),
  };
}

const ORDER_TRACKING_AUDIT_HISTORY: AuditHistoryEntry[] = [
  {
    label: "INITIAL INTERPRETATION",
    detail: "UNSUPPORTED INITIAL INTERPRETATION · Parity FAIL / missing-confirmation-boundary",
    tone: "historical",
  },
  {
    label: "FRESH AGENT DRAFT",
    detail: "return effect unresolved / boundary meaning unresolved",
    tone: "review",
  },
  {
    label: "HUMAN REVIEW",
    detail: "more evidence required",
    tone: "review",
  },
  {
    label: "EVIDENCE CLOSURE",
    detail: "terminal Confirm Return submit / URL-driven result / persistent mutation not established / distinct review boundary not established",
    tone: "review",
  },
  {
    label: "HUMAN-APPROVED RE-AUDIT",
    detail: "Intent PASS / Parity PASS / Agency PASS / Semantic PASS",
    tone: "approved",
  },
];

function findFixture(runId: string) {
  const fixture = V2_FIXTURES.find((candidate) => candidate.evidence.runId === runId);
  if (!fixture) throw new Error(`Missing v2 validation fixture ${runId}`);
  return fixture;
}

const flightSearch = findFixture("flight-search-human-approved-v2");
const orderTracking = findFixture("order-tracking-human-approved-v2");
const kurio = findFixture("kurio-live-reaudit-v2");
const mabel = findFixture("mabel-live-observation-v2");
const tagboardAccepted = findFixture("tagboard-allow-v2");
const tagboardRejected = findFixture("tagboard-reject-v2");
const archive = findFixture("archive-case-192-a-live-v2");

export const VALIDATION_CONTEXTS: ValidationContext[] = [
  sublyContext("broken"),
  sublyContext("fixed"),
  contextFromV2Fixture("flight-search", "Flight Search", flightSearch, "HUMAN APPROVED"),
  contextFromRecord("cineflow", "CineFlow", CINEFLOW_VALIDATION),
  contextFromV2Fixture("order-tracking", "Order Tracking", orderTracking, "HUMAN APPROVED", ORDER_TRACKING_AUDIT_HISTORY),
  contextFromRecord("independent-flight-booking", "Independent · SkyHop Flights", WEBMCP_KIT_FLIGHT_VALIDATION),
  contextFromV2Fixture("kurio", "Kurio", kurio, "HUMAN APPROVED"),
  contextFromV2Fixture("mabels-table", "Mabel’s Table", mabel),
  contextFromV2Fixture("tagboard-accepted", "Tagboard · Accepted", tagboardAccepted),
  contextFromV2Fixture("tagboard-rejected", "Tagboard · Rejected", tagboardRejected),
  contextFromV2Fixture("the-archive", "The Archive · Case #192-A", archive),
];

export const VALIDATION_MATRIX = VALIDATION_CONTEXTS.map((context) => ({
  id: context.id,
  label: context.label,
  kind: context.kind,
  authority: context.authority,
  evidenceMaturity: context.evidenceMaturity,
  applicationId: context.applicationId,
  modelVersion: context.modelVersion,
  evidenceMode: context.evidenceMode,
  evidenceCompleteness: context.evidenceCompleteness,
  statuses: context.audit.statuses,
  technicalStatus: context.audit.technicalStatus,
  semanticStatus: context.audit.semanticStatus,
  gapIds: context.audit.gaps.map((gap) => gap.id),
}));

export function getValidationContext(id: ValidationContextId) {
  return VALIDATION_CONTEXTS.find((context) => context.id === id) ?? VALIDATION_CONTEXTS[0];
}

export function getContextTools(context: ValidationContext): ToolContractV2[] {
  return context.contract.agentSurface.tools;
}
