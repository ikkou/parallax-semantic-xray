import type { RegisteredTool } from "./types";

const localTools = new Map<string, RegisteredTool>();

export function setLocalTool(tool: RegisteredTool) {
  localTools.set(tool.name, tool);
}

export function clearLocalTools() {
  localTools.clear();
}

export function getLocalTools() {
  return Array.from(localTools.values());
}

export function getLocalTool(name: string) {
  return localTools.get(name);
}
