import { getLocalTool } from "./registry";

export async function executeTool(name: string, input: Record<string, unknown> = {}) {
  const tool = getLocalTool(name);
  if (!tool) {
    throw new Error(`Tool ${name} is not registered.`);
  }

  return tool.execute(input);
}
