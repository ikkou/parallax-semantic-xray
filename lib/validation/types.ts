import type { DeveloperContract } from "../core/contract";
import type { ExecutionEvidence } from "../core/evidence";
import type { AuditResult } from "../core/result";

export type ExternalValidationMode = "LIVE EXECUTION" | "CAPTURED VALIDATION FIXTURE";

export type ValidationProvenance =
  | "native-webmcp-discovery"
  | "native-webmcp-invocation"
  | "source-inspection"
  | "runtime-instrumentation"
  | "state-diff"
  | "tool-result"
  | "developer-contract-adapter";

export type ExternalToolSnapshot = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, unknown> | null;
};

export type ExternalValidationRecord = {
  applicationId: string;
  source: string;
  sourceCommit?: string;
  runtimeUrl?: string;
  contractAdapter?: string;
  mode: ExternalValidationMode;
  environment?: {
    browser: string;
    userAgentFamily?: string;
    secureContext: boolean;
    flags?: string[];
    nativeApis?: string[];
    nativeTestingSurface?: boolean;
    consoleErrors?: string[];
  };
  provenance?: ValidationProvenance[];
  goal: string;
  guardrails: string[];
  developerContract: DeveloperContract;
  toolSnapshot: ExternalToolSnapshot[];
  executionEvidence: ExecutionEvidence[];
  auditResult: AuditResult;
  limitations?: string[];
};
