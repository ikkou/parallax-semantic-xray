import type { AuditResult, DeveloperContract, ExecutionEvidence, ToolContract } from "../core";
import { getSublyContract, SUBLY_GOAL, SUBLY_APPLICATION_ID, type DemoMode } from "../playground/subly/contract";
import { getSublyScenarioEvidence } from "../playground/subly/evidence";
import { runSublyAudit } from "../playground/subly/scenarios";
import {
  FLIGHT_SEARCH_HUMAN_APPROVED_VALIDATION,
  ORDER_TRACKING_HUMAN_APPROVED_VALIDATION,
} from "./authoritative";
import {
  CINEFLOW_VALIDATION,
} from "./chrome-labs/cineflow";
import { WEBMCP_KIT_FLIGHT_VALIDATION } from "./independent/webmcp-kit-flight-booking";
import type { ExternalToolSnapshot, ExternalValidationRecord, ValidationAuthority } from "./types";

export type ValidationContextKind = "live-playground" | "captured-external";

export type ValidationContextId =
  | "subly-broken"
  | "subly-fixed"
  | "flight-search"
  | "cineflow"
  | "order-tracking"
  | "independent-flight-booking";

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
  contract: DeveloperContract;
  toolSnapshot: ExternalToolSnapshot[];
  executionEvidence: ExecutionEvidence[];
  audit: AuditResult;
  record?: ExternalValidationRecord;
  auditHistory?: AuditHistoryEntry[];
};

export type AuditHistoryEntry = {
  label: string;
  detail: string;
  tone: "historical" | "review" | "approved";
};

function sublyContext(mode: DemoMode): ValidationContext {
  const contract = getSublyContract(mode);
  const executionEvidence = getSublyScenarioEvidence(mode);
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
    contract,
    toolSnapshot: contract.agentSurface.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: tool.annotations ?? null,
    })),
    executionEvidence,
    audit: runSublyAudit(mode, SUBLY_GOAL, executionEvidence, true),
  };
}

function externalContext(
  id: ValidationContextId,
  label: string,
  record: ExternalValidationRecord,
  presentation: Pick<ValidationContext, "auditHistory"> = {},
): ValidationContext {
  return {
    id,
    label,
    kind: "captured-external",
    authority: record.authority ?? "CAPTURED",
    evidenceMaturity: record.evidenceMaturity ?? "captured validation record",
    applicationId: record.applicationId,
    source: record.source,
    runtimeUrl: record.runtimeUrl,
    goal: record.goal,
    contract: record.developerContract,
    toolSnapshot: record.toolSnapshot,
    executionEvidence: record.executionEvidence,
    audit: record.auditResult,
    record,
    ...presentation,
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

export const VALIDATION_CONTEXTS: ValidationContext[] = [
  sublyContext("broken"),
  sublyContext("fixed"),
  externalContext("flight-search", "Flight Search", FLIGHT_SEARCH_HUMAN_APPROVED_VALIDATION),
  externalContext("cineflow", "CineFlow", CINEFLOW_VALIDATION),
  externalContext("order-tracking", "Order Tracking", ORDER_TRACKING_HUMAN_APPROVED_VALIDATION, {
    auditHistory: ORDER_TRACKING_AUDIT_HISTORY,
  }),
  externalContext("independent-flight-booking", "Independent · SkyHop Flights", WEBMCP_KIT_FLIGHT_VALIDATION),
];

export const VALIDATION_MATRIX = VALIDATION_CONTEXTS.map((context) => ({
  id: context.id,
  label: context.label,
  kind: context.kind,
  authority: context.authority,
  evidenceMaturity: context.evidenceMaturity,
  applicationId: context.applicationId,
  source: context.source,
  statuses: context.audit.statuses,
  technicalStatus: context.audit.technicalStatus,
  semanticStatus: context.audit.semanticStatus,
  gapIds: context.audit.gaps.map((gap) => gap.id),
}));

export function getValidationContext(id: ValidationContextId) {
  return VALIDATION_CONTEXTS.find((context) => context.id === id) ?? VALIDATION_CONTEXTS[0];
}

export function getContextTools(context: ValidationContext): ToolContract[] {
  return context.contract.agentSurface.tools;
}
