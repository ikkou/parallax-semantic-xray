import type { ExecutionEvidence } from "../core/evidence";
import type {
  AuditResult,
  CapabilityRow,
  Gap,
  Recommendation,
  TraceStep,
} from "../core";
import type { EvidenceMode, EvidenceCompleteness, ExecutionEvidenceV2 } from "../core/v2/evidence";
import type {
  AuditResultV2,
  BoundaryEvidenceRecord,
  CapabilityRowV2,
  GapV2,
  RecommendationV2,
  TraceStepV2,
  PolicyOutcomeRecord,
  EffectOutcomeRecord,
} from "../core/v2/result";
import type { SurfaceRelation } from "../core/v2/contract";
import { isAuditResultV2, type AuditModelVersion, type VersionedAuditResult } from "./versionedAudit";

export type XRayTraceStep = TraceStep | TraceStepV2;
export type XRayGap = Gap | GapV2;
export type XRayRecommendation = Recommendation | RecommendationV2;
export type XRayCapabilityRow = CapabilityRow | CapabilityRowV2;

export type XRayAuditViewModel = {
  modelVersion: AuditModelVersion;
  applicationId: string;
  goal: string;
  statuses: AuditResult["statuses"];
  technicalStatus: AuditResult["technicalStatus"];
  semanticStatus: AuditResult["semanticStatus"];
  steps: XRayTraceStep[];
  gaps: XRayGap[];
  recommendations: XRayRecommendation[];
  matrix: XRayCapabilityRow[];
  path: string[];
  execution: ExecutionEvidenceV2[];
  evidenceMode?: EvidenceMode;
  evidenceCompleteness?: EvidenceCompleteness;
  policyOutcomes: PolicyOutcomeRecord[];
  effectOutcomes: EffectOutcomeRecord[];
  boundaryEvidence: BoundaryEvidenceRecord[];
  surfaceRelations: SurfaceRelation[];
  evidenceQualifiers: string[];
};

export function projectAudit(audit: VersionedAuditResult): XRayAuditViewModel {
  if (isAuditResultV2(audit)) {
    return {
      modelVersion: 2,
      applicationId: audit.applicationId,
      goal: audit.goal,
      statuses: audit.statuses,
      technicalStatus: audit.technicalStatus,
      semanticStatus: audit.semanticStatus,
      steps: audit.steps,
      gaps: audit.gaps,
      recommendations: audit.recommendations,
      matrix: audit.matrix,
      path: audit.path,
      execution: audit.execution,
      evidenceMode: audit.evidenceMode,
      evidenceCompleteness: audit.evidenceCompleteness,
      policyOutcomes: audit.policyOutcomes,
      effectOutcomes: audit.effectOutcomes,
      boundaryEvidence: audit.boundaryEvidence,
      surfaceRelations: audit.surfaceRelations,
      evidenceQualifiers: audit.evidenceQualifiers,
    };
  }

  return {
    modelVersion: 1,
    applicationId: audit.applicationId,
    goal: audit.goal,
    statuses: audit.statuses,
    technicalStatus: audit.technicalStatus,
    semanticStatus: audit.semanticStatus,
    steps: audit.steps,
    gaps: audit.gaps,
    recommendations: audit.recommendations,
    matrix: audit.matrix,
    path: audit.path,
    execution: audit.execution,
    policyOutcomes: [],
    effectOutcomes: [],
    boundaryEvidence: [],
    surfaceRelations: [],
    evidenceQualifiers: [],
  };
}
