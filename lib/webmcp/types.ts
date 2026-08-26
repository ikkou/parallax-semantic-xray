export type JsonSchema = Record<string, unknown>;

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

export type ModelContextRegisterToolOptions = {
  signal?: AbortSignal;
};

export type ModelContextLike = {
  registerTool?: (tool: RegisteredTool, options?: ModelContextRegisterToolOptions) => void | Promise<void>;
  getTools?: () => Promise<unknown[]>;
  executeTool?: (tool: unknown, input?: object | string) => Promise<string>;
};

export type WebMcpSupport = {
  supported: boolean;
  label: string;
  detail: string;
};

declare global {
  interface Document {
    modelContext?: ModelContextLike;
  }
}
