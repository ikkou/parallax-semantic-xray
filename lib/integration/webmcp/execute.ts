import { getLocalTool, DEFAULT_APPLICATION_ID } from "./registry";
import { getModelContext } from "./types";

export async function executeLocalTool(
  name: string,
  input: Record<string, unknown> = {},
  applicationId = DEFAULT_APPLICATION_ID,
) {
  const tool = getLocalTool(name, applicationId);
  if (!tool) throw new Error(`Tool ${name} is not registered for ${applicationId}.`);
  return tool.execute(input);
}

export async function executeNativeTool(tool: unknown, input: Record<string, unknown> = {}) {
  const modelContext = getModelContext();
  const execute = modelContext?.executeTool;
  if (typeof execute !== "function") {
    throw new Error("Native WebMCP execution is unavailable.");
  }

  return execute.call(modelContext, tool, JSON.stringify(input));
}
