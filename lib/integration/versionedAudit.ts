import { runSemanticAudit } from "../core/audit";
import type { DeveloperContract } from "../core/contract";
import type { ExecutionEvidence } from "../core/evidence";
import type { AuditResult } from "../core/result";
import { runSemanticAuditV2 } from "../core/v2/audit";
import type { DeveloperContractV2 } from "../core/v2/contract";
import type { EvidenceBundleV2 } from "../core/v2/evidence";
import type { AuditResultV2 } from "../core/v2/result";

export type AuditModelVersion = 1 | 2;

export type VersionedContract = DeveloperContract | DeveloperContractV2;
export type VersionedAuditResult = AuditResult | AuditResultV2;
export type VersionedEvidence = ExecutionEvidence[] | EvidenceBundleV2;

export type VersionedAuditRequest =
  | {
      modelVersion: 1;
      contract: DeveloperContract;
      execution: ExecutionEvidence[];
      executionComplete?: boolean;
      goal?: string;
    }
  | {
      modelVersion: 2;
      contract: DeveloperContractV2;
      evidence: EvidenceBundleV2;
      goal?: string;
    };

function contractWithGoal(
  contract: DeveloperContract | DeveloperContractV2,
  goal: string | undefined,
) {
  return goal === undefined
    ? contract
    : { ...contract, intent: { ...contract.intent, goal } };
}

export function runVersionedAudit(request: VersionedAuditRequest): VersionedAuditResult {
  if (request.modelVersion === 2) {
    return runSemanticAuditV2(
      contractWithGoal(request.contract, request.goal) as DeveloperContractV2,
      request.evidence,
    );
  }

  return runSemanticAudit(
    contractWithGoal(request.contract, request.goal) as DeveloperContract,
    request.execution,
    { executionComplete: request.executionComplete },
  );
}

export function isAuditResultV2(audit: VersionedAuditResult): audit is AuditResultV2 {
  return "modelVersion" in audit && audit.modelVersion === 2;
}
