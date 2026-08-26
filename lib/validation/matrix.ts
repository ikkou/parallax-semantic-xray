import type { AuditResult, ToolContract } from "../core";
import { getSublyContract, SUBLY_GOAL, SUBLY_APPLICATION_ID, type DemoMode } from "../playground/subly/contract";
import { getSublyScenarioEvidence } from "../playground/subly/evidence";
import { runSublyAudit } from "../playground/subly/scenarios";
import {
  CINEFLOW_VALIDATION,
} from "./chrome-labs/cineflow";
import { FLIGHT_SEARCH_VALIDATION } from "./chrome-labs/flight-search";
import { ORDER_TRACKING_VALIDATION } from "./chrome-labs/order-tracking";
import { WEBMCP_KIT_FLIGHT_VALIDATION } from "./independent/webmcp-kit-flight-booking";
import type { ExternalToolSnapshot, ExternalValidationRecord } from "./types";

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
  applicationId: string;
  source: string;
  runtimeUrl?: string;
  goal: string;
  contract: ReturnType<typeof getSublyContract>;
  toolSnapshot: ExternalToolSnapshot[];
  executionEvidence: ReturnType<typeof getSublyScenarioEvidence>;
  audit: AuditResult;
  record?: ExternalValidationRecord;
};

function sublyContext(mode: DemoMode): ValidationContext {
  const contract = getSublyContract(mode);
  const executionEvidence = getSublyScenarioEvidence(mode);
  return {
    id: mode === "broken" ? "subly-broken" : "subly-fixed",
    label: `Subly — ${mode.toUpperCase()}`,
    kind: "live-playground",
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
): ValidationContext {
  return {
    id,
    label,
    kind: "captured-external",
    applicationId: record.applicationId,
    source: record.source,
    runtimeUrl: record.runtimeUrl,
    goal: record.goal,
    contract: record.developerContract,
    toolSnapshot: record.toolSnapshot,
    executionEvidence: record.executionEvidence,
    audit: record.auditResult,
    record,
  };
}

export const VALIDATION_CONTEXTS: ValidationContext[] = [
  sublyContext("broken"),
  sublyContext("fixed"),
  externalContext("flight-search", "Flight Search", FLIGHT_SEARCH_VALIDATION),
  externalContext("cineflow", "CineFlow", CINEFLOW_VALIDATION),
  externalContext("order-tracking", "Order Tracking", ORDER_TRACKING_VALIDATION),
  externalContext("independent-flight-booking", "Independent · SkyHop Flights", WEBMCP_KIT_FLIGHT_VALIDATION),
];

export const VALIDATION_MATRIX = VALIDATION_CONTEXTS.map((context) => ({
  id: context.id,
  label: context.label,
  kind: context.kind,
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
