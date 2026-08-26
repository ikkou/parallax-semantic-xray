import { getModelContext, type WebMcpSupport } from "./types";

export function getWebMcpSupport(): WebMcpSupport {
  if (typeof document === "undefined" && typeof navigator === "undefined") {
    return {
      supported: false,
      registration: false,
      discovery: false,
      execution: false,
      label: "Browser check pending",
      detail: "The WebMCP surface is checked after the app mounts.",
    };
  }

  const modelContext = getModelContext();
  const registration = typeof modelContext?.registerTool === "function";
  const discovery = typeof modelContext?.getTools === "function";
  const execution = typeof modelContext?.executeTool === "function";
  const supported = registration && discovery && execution;

  if (supported) {
    return {
      supported: true,
      registration,
      discovery,
      execution,
      label: "WebMCP surface live",
      detail: "Registration, discovery, and execution are available on the native page surface.",
    };
  }

  if (registration || discovery || execution) {
    return {
      supported: false,
      registration,
      discovery,
      execution,
      label: "WebMCP surface partial",
      detail: `Registration ${registration ? "ready" : "missing"}, discovery ${discovery ? "ready" : "missing"}, execution ${execution ? "ready" : "missing"}.`,
    };
  }

  return {
    supported: false,
    registration,
    discovery,
    execution,
    label: "Local simulation active",
    detail: "The current browser does not expose the native WebMCP registration, discovery, and execution APIs.",
  };
}
