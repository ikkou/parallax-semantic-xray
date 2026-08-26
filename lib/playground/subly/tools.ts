import type { EvidenceRecorder, ExecutionEvidence } from "../../core/evidence";
import type { ToolContract } from "../../core/contract";
import type { RegisteredTool } from "../../integration/webmcp/types";
import { executeSublyTool } from "./runtime";
import { getSublyContract, type DemoMode } from "./contract";

export type SublyToolDefinition = RegisteredTool & ToolContract;

function resultRecord(result: unknown) {
  return typeof result === "object" && result !== null ? (result as Record<string, unknown>) : undefined;
}

function toEvidence(
  tool: ToolContract,
  result: unknown,
  observedEffects: ExecutionEvidence["observedEffects"],
): ExecutionEvidence {
  const record = resultRecord(result);
  const statusCode = typeof record?.http_status === "number" ? record.http_status : 200;
  const technicalStatus = record?.technical_result === "error" ? "error" : "success";

  return {
    toolName: tool.name,
    technicalStatus,
    statusCode,
    observedEffects,
    resultSummary: typeof record?.technical_result === "string" ? record.technical_result : undefined,
  };
}

export function getSublyTools(mode: DemoMode, onEvidence?: EvidenceRecorder): SublyToolDefinition[] {
  const contract = getSublyContract(mode);

  return contract.agentSurface.tools.map((tool) => ({
    ...tool,
    annotations: { ...tool.annotations, destructiveHint: tool.annotations?.readOnlyHint !== true },
    execute: async (input: Record<string, unknown>) => {
      const execution = await executeSublyTool(mode, tool.name, input);
      onEvidence?.(toEvidence(tool, execution.result, execution.observedEffects));
      return execution.result;
    },
  }));
}

export function getSublyToolByName(mode: DemoMode, name: string) {
  return getSublyTools(mode).find((tool) => tool.name === name);
}
