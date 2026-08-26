import type { RegisteredTool } from "./types";

export const DEFAULT_APPLICATION_ID = "default";

const localTools = new Map<string, Map<string, RegisteredTool>>();

function getApplicationTools(applicationId: string) {
  const tools = localTools.get(applicationId) ?? new Map<string, RegisteredTool>();
  localTools.set(applicationId, tools);
  return tools;
}

export function setLocalTool(tool: RegisteredTool, applicationId = DEFAULT_APPLICATION_ID) {
  getApplicationTools(applicationId).set(tool.name, tool);
}

export function clearLocalTools(applicationId = DEFAULT_APPLICATION_ID) {
  localTools.delete(applicationId);
}

export function getLocalTools(applicationId = DEFAULT_APPLICATION_ID) {
  return Array.from(getApplicationTools(applicationId).values());
}

export function getLocalTool(name: string, applicationId = DEFAULT_APPLICATION_ID) {
  return getApplicationTools(applicationId).get(name);
}
