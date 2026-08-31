import type {
  BoundaryContract,
  DeveloperContract,
  Effect,
  HumanActionContract,
  IntentContract,
  SemanticAction,
  ToolContract,
} from "../contract";

export type { BoundaryContract, Effect, JsonSchema, SemanticAction, ToolContract } from "../contract";

export type ContractVersion = 1 | 2;

export type EffectClaim = {
  effect: Effect;
  certainty: "guaranteed" | "possible" | "conditional";
  phase?: "temporary" | "terminal" | "unspecified";
  conditionId?: string;
};

export type SurfaceRelation = {
  humanActionIds: string[];
  agentToolNames: string[];
  relation: "EQUIVALENT" | "COMPLEMENTARY";
  source: "developer-assertion";
  rationale?: string;
};

export type IntentContractV2 = IntentContract & {
  requiredEffects?: Effect[];
  workflowActions?: SemanticAction[];
  terminalActions?: SemanticAction[];
  completionTarget?: "goal" | "workflow" | "both";
};

export type HumanActionContractV2 = HumanActionContract & {
  effectClaims?: EffectClaim[];
};

export type ToolContractV2 = ToolContract & {
  effectClaims?: EffectClaim[];
  capabilityRole?: "goal" | "supporting" | "workflow-terminal" | "optional";
};

export type DeveloperContractV2 = {
  version: 2;
  applicationId: string;
  intent: IntentContractV2;
  humanSurface: {
    actions: HumanActionContractV2[];
    boundaries: BoundaryContract[];
  };
  agentSurface: {
    tools: ToolContractV2[];
    boundaries: BoundaryContract[];
  };
  surfaceRelations?: SurfaceRelation[];
};

export type LegacyDeveloperContract = DeveloperContract & { version?: never };
