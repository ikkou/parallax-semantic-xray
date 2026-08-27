import { runSemanticAudit } from "../core/audit";
import type { AuditResult } from "../core/result";
import type { ExternalValidationRecord } from "./types";
import flightSearchRecord from "../../docs/validation/2026-08-27-flight-search-human-approved.json";
import orderTrackingRecord from "../../docs/validation/2026-08-27-order-tracking-human-approved.json";

type StoredAuditSummary = Pick<AuditResult, "statuses" | "technicalStatus" | "semanticStatus" | "path"> & {
  gapIds: string[];
};

type StoredAuthoritativeRecord = ExternalValidationRecord & {
  validationDate: string;
  contractVersion: string;
  coreBaselineHash: string;
  authority: "HUMAN APPROVED";
  auditResult: StoredAuditSummary;
};

function auditSummary(audit: AuditResult): StoredAuditSummary {
  return {
    statuses: audit.statuses,
    technicalStatus: audit.technicalStatus,
    semanticStatus: audit.semanticStatus,
    path: audit.path,
    gapIds: audit.gaps.map((gap) => gap.id),
  };
}

function hydrateAuthoritativeRecord(raw: StoredAuthoritativeRecord): ExternalValidationRecord {
  const derivedAudit = runSemanticAudit(raw.developerContract, raw.executionEvidence, { executionComplete: true });
  const storedSummary = JSON.stringify({
    statuses: raw.auditResult.statuses,
    technicalStatus: raw.auditResult.technicalStatus,
    semanticStatus: raw.auditResult.semanticStatus,
    path: raw.auditResult.path,
    gapIds: raw.auditResult.gapIds,
  });
  const derivedSummary = JSON.stringify(auditSummary(derivedAudit));

  if (storedSummary !== derivedSummary) {
    throw new Error(
      `Stored authoritative audit does not match the frozen Core for ${raw.applicationId}. ` +
      "Refresh the validation record instead of duplicating statuses in presentation code.",
    );
  }

  return {
    ...raw,
    auditResult: derivedAudit,
    evidenceMaturity: "human-approved evidence",
  };
}

export const FLIGHT_SEARCH_HUMAN_APPROVED_VALIDATION = hydrateAuthoritativeRecord(
  flightSearchRecord as unknown as StoredAuthoritativeRecord,
);

export const ORDER_TRACKING_HUMAN_APPROVED_VALIDATION = hydrateAuthoritativeRecord(
  orderTrackingRecord as unknown as StoredAuthoritativeRecord,
);
