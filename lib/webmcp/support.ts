import type { WebMcpSupport } from "./types";

export function getWebMcpSupport(): WebMcpSupport {
  if (typeof document === "undefined") {
    return {
      supported: false,
      label: "Browser check pending",
      detail: "The WebMCP surface is checked after the app mounts.",
    };
  }

  const modelContext = document.modelContext;
  if (modelContext && typeof modelContext.registerTool === "function") {
    return {
      supported: true,
      label: "WebMCP surface live",
      detail: "document.modelContext.registerTool is available.",
    };
  }

  return {
    supported: false,
    label: "Local simulation active",
    detail:
      "WebMCP is not available in this browser. Open PARALLAX in a supported ChatGPT browser or WebMCP-enabled Chrome.",
  };
}
