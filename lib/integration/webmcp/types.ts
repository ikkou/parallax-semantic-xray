import type { JsonSchema } from "../../core/contract";

export type { JsonSchema } from "../../core/contract";

export type WebMcpAnnotations = {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  destructiveHint?: boolean;
};

export type RegisteredTool = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  annotations?: WebMcpAnnotations;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
};

export type NativeDiscoveredTool = {
  name: string;
  description?: string;
  inputSchema?: JsonSchema;
  annotations?: WebMcpAnnotations;
  execute?: unknown;
};

export type ModelContextRegisterToolOptions = {
  signal?: AbortSignal;
};

export type ModelContextLike = {
  registerTool?: (
    tool: RegisteredTool,
    options?: ModelContextRegisterToolOptions,
  ) => void | Promise<void>;
  getTools?: () => Promise<unknown[]>;
  executeTool?: (tool: unknown, input?: object | string) => Promise<unknown>;
};

export type WebMcpSupport = {
  supported: boolean;
  registration: boolean;
  discovery: boolean;
  execution: boolean;
  label: string;
  detail: string;
};

export function getModelContext(): ModelContextLike | undefined {
  if (typeof document !== "undefined" && document.modelContext) {
    return document.modelContext;
  }

  if (typeof navigator !== "undefined" && navigator.modelContext) {
    return navigator.modelContext;
  }

  return undefined;
}

declare global {
  interface Document {
    modelContext?: ModelContextLike;
  }

  interface Navigator {
    modelContext?: ModelContextLike;
  }
}
