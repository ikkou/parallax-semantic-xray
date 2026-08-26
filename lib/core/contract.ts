export type SemanticAction = string;
export type Effect = string;
export type JsonSchema = Record<string, unknown>;

export type ContractAnnotations = {
  readOnlyHint?: boolean;
};

export type IntentContract = {
  goal: string;
  requiredActions?: SemanticAction[];
  forbiddenEffects: Effect[];
};

export type HumanActionContract = {
  id: string;
  action: SemanticAction;
  effects: Effect[];
  boundaryIds?: string[];
  label?: string;
};

export type BoundaryContract = {
  id: string;
  protectsEffects: Effect[];
  type: "review" | "confirmation";
  label?: string;
};

export type ToolContract = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  action: SemanticAction;
  declaredEffects: Effect[];
  boundaryIds?: string[];
  annotations?: ContractAnnotations;
  label?: string;
};

export type HumanSurfaceContract = {
  actions: HumanActionContract[];
  boundaries: BoundaryContract[];
};

export type AgentSurfaceContract = {
  tools: ToolContract[];
  boundaries: BoundaryContract[];
};

export type DeveloperContract = {
  applicationId: string;
  intent: IntentContract;
  humanSurface: HumanSurfaceContract;
  agentSurface: AgentSurfaceContract;
};

export type AgentCapability = {
  action: SemanticAction;
  toolNames: string[];
  declaredEffects: Effect[];
};

export function deriveAgentCapabilities(agentSurface: AgentSurfaceContract): AgentCapability[] {
  const capabilities = new Map<SemanticAction, AgentCapability>();

  for (const tool of agentSurface.tools) {
    const current = capabilities.get(tool.action) ?? {
      action: tool.action,
      toolNames: [],
      declaredEffects: [],
    };

    if (!current.toolNames.includes(tool.name)) current.toolNames.push(tool.name);
    for (const effect of tool.declaredEffects) {
      if (!current.declaredEffects.includes(effect)) current.declaredEffects.push(effect);
    }
    capabilities.set(tool.action, current);
  }

  return Array.from(capabilities.values());
}
