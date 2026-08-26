import { runDeterministicAudit, type AuditResult, type DemoMode } from "../audit";
import type { DemoRuntimeState } from "../demoRuntime";
import type { RegisteredTool } from "./types";

export type ParallaxToolContext = {
  mode: DemoMode;
  goal: string;
  audit: AuditResult;
  runtime: DemoRuntimeState;
  onAudit?: (result: AuditResult) => void;
};

export function getParallaxTools(getContext: () => ParallaxToolContext): RegisteredTool[] {
  return [
    {
      name: "inspect_surface",
      description:
        "Inspect the current demo application's human-facing surface and registered WebMCP tools.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: async () => {
        const context = getContext();
        return {
          human_surface: "Subly /plans",
          current_mode: context.mode,
          current_plan: context.runtime.currentPlan,
          tools: context.audit.path,
        };
      },
    },
    {
      name: "run_parity_audit",
      description:
        "Audit the current demo application for semantic differences between its human-facing UI and WebMCP tool surface.",
      inputSchema: {
        type: "object",
        properties: {
          goal: { type: "string", description: "The user's intended goal." },
        },
        required: ["goal"],
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const context = getContext();
        const goal = typeof input.goal === "string" ? input.goal : context.goal;
        const result = runDeterministicAudit(context.mode, goal);
        context.onAudit?.(result);
        return result;
      },
    },
    {
      name: "trace_goal",
      description: "Trace a goal through human intent, tool selection, contract, and execution result.",
      inputSchema: {
        type: "object",
        properties: { goal: { type: "string" } },
        required: ["goal"],
      },
      annotations: { readOnlyHint: true },
      execute: async () => getContext().audit.steps,
    },
    {
      name: "list_gaps",
      description: "List the semantic, intent, and agency gaps found by the current PARALLAX audit.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: async () => getContext().audit.gaps,
    },
    {
      name: "explain_gap",
      description: "Explain one PARALLAX audit gap using its stable gap ID.",
      inputSchema: {
        type: "object",
        properties: { gap_id: { type: "string", description: "Gap ID, for example intent-001." } },
        required: ["gap_id"],
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const gap = getContext().audit.gaps.find((item) => item.id === input.gap_id);
        return gap ?? { error: "Gap not found", gap_id: input.gap_id };
      },
    },
  ];
}
