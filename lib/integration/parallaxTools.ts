import type { DeveloperContract } from "../core/contract";
import type { ExecutionEvidence } from "../core/evidence";
import type { AuditResult } from "../core/result";
import type { DeveloperContractV2 } from "../core/v2/contract";
import type { EvidenceBundleV2 } from "../core/v2/evidence";
import type { AuditResultV2 } from "../core/v2/result";
import { runVersionedAudit, type AuditModelVersion, type VersionedAuditResult } from "./versionedAudit";
import type { RegisteredTool } from "./webmcp/types";

export type ParallaxToolContext =
  | {
      modelVersion: 1;
      applicationId: string;
      contract: DeveloperContract;
      audit: AuditResult;
      execution: ExecutionEvidence[];
      executionComplete?: boolean;
      runtimeState?: Record<string, unknown>;
      onAudit?: (result: AuditResult) => void;
    }
  | {
      modelVersion: 2;
      applicationId: string;
      contract: DeveloperContractV2;
      audit: AuditResultV2;
      execution: EvidenceBundleV2;
      runtimeState?: Record<string, unknown>;
      onAudit?: (result: AuditResultV2) => void;
    };

function requireNonEmptyString(input: Record<string, unknown> | null | undefined, field: string) {
  const value = input?.[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`INVALID_ARGUMENT: ${field} must be a non-empty string.`);
  }

  return value.trim();
}

function auditForGoal(
  context: Extract<ParallaxToolContext, { modelVersion: 2 }>,
  goal: string,
): AuditResultV2;
function auditForGoal(
  context: Extract<ParallaxToolContext, { modelVersion: 1 }>,
  goal: string,
): AuditResult;
function auditForGoal(context: ParallaxToolContext, goal: string): VersionedAuditResult {
  if (context.modelVersion === 2) {
    return runVersionedAudit({
      modelVersion: 2,
      contract: context.contract,
      evidence: context.execution,
      goal,
    });
  }

  return runVersionedAudit({
    modelVersion: 1,
    contract: context.contract,
    execution: context.execution,
    executionComplete: context.executionComplete,
    goal,
  });
}

export function getParallaxTools(getContext: () => ParallaxToolContext): RegisteredTool[] {
  return [
    {
      name: "inspect_surface",
      description: "Inspect the declared human surface, agent surface, boundaries, and current application state.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async () => {
        const context = getContext();
        return {
          application_id: context.applicationId,
          audit_model_version: context.modelVersion as AuditModelVersion,
          human_surface: context.contract.humanSurface,
          agent_surface: context.contract.agentSurface,
          runtime_state: context.runtimeState,
          evidence: context.modelVersion === 2
            ? {
                mode: context.execution.mode,
                completeness: context.execution.completeness,
                entry_count: context.execution.entries.length,
              }
            : {
                completeness: context.executionComplete === true ? "complete" : "partial",
                entry_count: context.execution.length,
              },
        };
      },
    },
    {
      name: "run_parity_audit",
      description: "Run the semantic audit against the declared contract and captured execution evidence.",
      inputSchema: {
        type: "object",
        properties: {
          goal: {
            type: "string",
            minLength: 1,
            description: "The user's intended goal. It must contain at least one non-whitespace character.",
          },
        },
        required: ["goal"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const context = getContext();
        const goal = requireNonEmptyString(input, "goal");
        if (context.modelVersion === 2) {
          const result = auditForGoal(context, goal);
          context.onAudit?.(result);
          return result;
        }
        const result = auditForGoal(context, goal);
        context.onAudit?.(result);
        return result;
      },
    },
    {
      name: "trace_goal",
      description: "Trace a goal through declared intent, tool selection, tool contract, execution, and semantic outcome.",
      inputSchema: {
        type: "object",
        properties: {
          goal: {
            type: "string",
            minLength: 1,
            description: "The goal to trace. It must contain at least one non-whitespace character.",
          },
        },
        required: ["goal"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const context = getContext();
        const goal = requireNonEmptyString(input, "goal");
        if (context.modelVersion === 2) return auditForGoal(context, goal).steps;
        return auditForGoal(context, goal).steps;
      },
    },
    {
      name: "list_gaps",
      description: "List semantic findings derived from the current contract and execution evidence.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async () => getContext().audit.gaps,
    },
    {
      name: "explain_gap",
      description: "Explain one semantic finding using its stable finding ID.",
      inputSchema: {
        type: "object",
        properties: {
          gap_id: {
            type: "string",
            minLength: 1,
            description: "Finding ID, for example intent-001. It must be non-empty.",
          },
        },
        required: ["gap_id"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const gapId = requireNonEmptyString(input, "gap_id");
        const gap = getContext().audit.gaps.find((item) => item.id === gapId);
        return gap ?? {
          error: "NOT_FOUND",
          message: `No semantic finding exists for gap_id ${gapId}.`,
          gap_id: gapId,
        };
      },
    },
  ];
}
