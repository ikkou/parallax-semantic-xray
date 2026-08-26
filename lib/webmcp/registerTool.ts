import { setLocalTool } from "./registry";
import type { RegisteredTool } from "./types";

let nativeRegistrationController: AbortController | null = null;

export function resetNativeRegistrations() {
  nativeRegistrationController?.abort();
  nativeRegistrationController = null;
}

export async function registerTool(tool: RegisteredTool) {
  setLocalTool(tool);

  if (typeof document === "undefined") {
    return { registered: false, local: true };
  }

  const register = document.modelContext?.registerTool;
  if (typeof register !== "function") {
    return { registered: false, local: true };
  }

  nativeRegistrationController ??= new AbortController();
  await register.call(document.modelContext, tool, { signal: nativeRegistrationController.signal });
  return { registered: true, local: true };
}
