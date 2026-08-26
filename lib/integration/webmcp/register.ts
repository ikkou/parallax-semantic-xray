import { DEFAULT_APPLICATION_ID, setLocalTool } from "./registry";
import { getModelContext, type RegisteredTool } from "./types";

export type RegisterToolOptions = {
  applicationId?: string;
};

const nativeRegistrationControllers = new Map<string, AbortController>();

export function resetNativeRegistrations(applicationId?: string) {
  if (applicationId) {
    nativeRegistrationControllers.get(applicationId)?.abort();
    nativeRegistrationControllers.delete(applicationId);
    return;
  }

  for (const controller of nativeRegistrationControllers.values()) controller.abort();
  nativeRegistrationControllers.clear();
}

export async function registerTool(
  tool: RegisteredTool,
  options: RegisterToolOptions = {},
) {
  const applicationId = options.applicationId ?? DEFAULT_APPLICATION_ID;
  setLocalTool(tool, applicationId);

  const modelContext = getModelContext();
  const register = modelContext?.registerTool;
  if (typeof register !== "function") {
    return { registered: false, local: true, applicationId };
  }

  const controller = nativeRegistrationControllers.get(applicationId) ?? new AbortController();
  nativeRegistrationControllers.set(applicationId, controller);
  await register.call(modelContext, tool, { signal: controller.signal });
  return { registered: true, local: true, applicationId };
}
