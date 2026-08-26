import { runSemanticAudit } from "../core/audit";
import type { DeveloperContract } from "../core/contract";
import type { ExecutionEvidence } from "../core/evidence";
import type { AuditResult } from "../core/result";
import type { RegisteredTool } from "./webmcp/types";

export type ParallaxToolContext = {
  applicationId: string;
  contract: DeveloperContract;
  audit: AuditResult;
  execution: ExecutionEvidence[];
  executionComplete?: boolean;
  runtimeState?: Record<string, unknown>;
  onAudit?: (result: AuditResult) => void;
};

function auditForGoal(context: ParallaxToolContext, goal: string) {
  const contract: DeveloperContract = {
    ...context.contract,
    intent: { ...context.contract.intent, goal },
  };
  return runSemanticAudit(contract, context.execution, {
    executionComplete: context.executionComplete,
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
          human_surface: context.contract.humanSurface,
          agent_surface: context.contract.agentSurface,
          runtime_state: context.runtimeState,
        };
      },
    },
    {
      name: "run_parity_audit",
      description: "Run the semantic audit against the declared contract and captured execution evidence.",
      inputSchema: {
        type: "object",
        properties: { goal: { type: "string", description: "The user's intended goal." } },
        required: ["goal"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const context = getContext();
        const goal = typeof input.goal === "string" ? input.goal : context.contract.intent.goal;
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
        properties: { goal: { type: "string", description: "The goal to trace." } },
        required: ["goal"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const context = getContext();
        const goal = typeof input.goal === "string" ? input.goal : context.contract.intent.goal;
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
        properties: { gap_id: { type: "string", description: "Finding ID, for example intent-001." } },
        required: ["gap_id"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const gap = getContext().audit.gaps.find((item) => item.id === input.gap_id);
        return gap ?? { error: "Finding not found", gap_id: input.gap_id };
      },
    },
  ];
}
