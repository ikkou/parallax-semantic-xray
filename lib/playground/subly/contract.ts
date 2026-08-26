import type {
  BoundaryContract,
  DeveloperContract,
  IntentContract,
  JsonSchema,
  ToolContract,
} from "../../core/contract";

export type DemoMode = "broken" | "fixed";
export type PlanId = "free" | "pro";

export const SUBLY_APPLICATION_ID = "subly-playground";
export const SUBLY_GOAL =
  "Compare the Free and Pro plans and recommend the best option. Don't make any changes to my subscription.";

export const SUBLY_PLAN_DATA: Record<PlanId, { name: string; price: string; descriptor: string; features: string[] }> = {
  free: {
    name: "FREE",
    price: "$0",
    descriptor: "For getting started",
    features: ["3 projects", "Basic analytics", "Community support"],
  },
  pro: {
    name: "PRO",
    price: "$20",
    descriptor: "For teams that move fast",
    features: ["Unlimited projects", "Advanced analytics", "Priority support"],
  },
};

const humanBoundaries: BoundaryContract[] = [
  {
    id: "human-plan-review",
    label: "Review before purchase",
    protectsEffects: ["change_subscription", "charge_payment"],
    type: "review",
  },
  {
    id: "human-payment-confirmation",
    label: "Payment confirmation",
    protectsEffects: ["charge_payment"],
    type: "confirmation",
  },
];

const humanActions = [
  {
    id: "inspect-plan",
    action: "inspect_plan",
    label: "View plan details",
    effects: ["read_plan"],
  },
  {
    id: "compare-plans",
    action: "compare_plans",
    label: "Compare plans",
    effects: ["compare_plans"],
  },
  {
    id: "recommend-plan",
    action: "recommend_plan",
    label: "Get recommendation",
    effects: [],
  },
  {
    id: "review-before-purchase",
    action: "review_before_purchase",
    label: "Review before purchase",
    effects: [],
    boundaryIds: ["human-plan-review"],
  },
  {
    id: "purchase-plan",
    action: "purchase_plan",
    label: "Purchase / Upgrade",
    effects: ["change_subscription", "charge_payment"],
    boundaryIds: ["human-plan-review", "human-payment-confirmation"],
  },
  {
    id: "cancel-plan",
    action: "cancel_plan",
    label: "Cancel / Downgrade",
    effects: ["change_subscription"],
  },
];

const emptySchema = (): JsonSchema => ({
  type: "object",
  properties: {},
  required: [],
  additionalProperties: false,
});

const field = (description: string, values: string[]) => ({
  type: "string",
  enum: values,
  description,
});

const readPlanSchema: JsonSchema = {
  type: "object",
  properties: { plan_id: field("The plan to inspect.", ["free", "pro"]) },
  required: ["plan_id"],
  additionalProperties: false,
};

const comparePlansSchema: JsonSchema = {
  type: "object",
  properties: {
    from: field("The starting plan.", ["free", "pro"]),
    to: field("The plan to compare against.", ["free", "pro"]),
  },
  required: ["from", "to"],
  additionalProperties: false,
};

const purchaseSchema: JsonSchema = {
  type: "object",
  properties: { plan_id: field("The plan to purchase.", ["pro"]) },
  required: ["plan_id"],
  additionalProperties: false,
};

const baseTools: ToolContract[] = [
  {
    name: "inspect_plan",
    label: "Inspect plan",
    description: "Read the price, features, and current status of one Subly plan.",
    inputSchema: readPlanSchema,
    action: "inspect_plan",
    declaredEffects: ["read_plan"],
    annotations: { readOnlyHint: true },
  },
  {
    name: "compare_plans",
    label: "Compare plans",
    description: "Compare two Subly plans and return feature and price differences.",
    inputSchema: comparePlansSchema,
    action: "compare_plans",
    declaredEffects: ["read_plan", "compare_plans"],
    annotations: { readOnlyHint: true },
  },
];

const brokenTools: ToolContract[] = [
  {
    name: "recommended_upgrade",
    label: "Recommended upgrade",
    description: "Return the recommended plan and apply the upgrade immediately.",
    inputSchema: emptySchema(),
    action: "recommend_plan",
    declaredEffects: ["change_subscription", "charge_payment"],
    annotations: { readOnlyHint: false },
  },
  {
    name: "cancel_plan",
    label: "Cancel plan",
    description: "Cancel the current Subly subscription and move the account to Free.",
    inputSchema: emptySchema(),
    action: "cancel_plan",
    declaredEffects: ["change_subscription"],
    annotations: { readOnlyHint: false },
  },
];

const fixedTools: ToolContract[] = [
  {
    name: "recommend_plan",
    label: "Recommend plan",
    description: "Recommend a plan without changing account state or charging payment.",
    inputSchema: emptySchema(),
    action: "recommend_plan",
    declaredEffects: [],
    annotations: { readOnlyHint: true },
  },
  {
    name: "purchase_plan",
    label: "Purchase plan",
    description: "Explicitly confirm and pay for the selected plan. This changes plan state and charges payment.",
    inputSchema: purchaseSchema,
    action: "purchase_plan",
    declaredEffects: ["change_subscription", "charge_payment"],
    boundaryIds: ["agent-purchase-confirmation"],
    annotations: { readOnlyHint: false },
  },
  {
    name: "cancel_plan",
    label: "Cancel plan",
    description: "Cancel the current Subly subscription and move the account to Free.",
    inputSchema: emptySchema(),
    action: "cancel_plan",
    declaredEffects: ["change_subscription"],
    annotations: { readOnlyHint: false },
  },
];

const fixedAgentBoundaries: BoundaryContract[] = [
  {
    id: "agent-purchase-confirmation",
    label: "Agent purchase confirmation",
    protectsEffects: ["change_subscription", "charge_payment"],
    type: "confirmation",
  },
];

export function getSublyContract(mode: DemoMode): DeveloperContract {
  const intent: IntentContract = {
    goal: SUBLY_GOAL,
    requiredActions: ["inspect_plan", "compare_plans", "recommend_plan"],
    forbiddenEffects: ["change_subscription", "charge_payment"],
  };

  return {
    applicationId: SUBLY_APPLICATION_ID,
    intent,
    humanSurface: {
      actions: humanActions,
      boundaries: humanBoundaries,
    },
    agentSurface: {
      tools: [...baseTools, ...(mode === "broken" ? brokenTools : fixedTools)],
      boundaries: mode === "broken" ? [] : fixedAgentBoundaries,
    },
  };
}

export function getSublyPath(mode: DemoMode) {
  return mode === "broken"
    ? ["inspect_plan", "compare_plans", "recommended_upgrade"]
    : ["inspect_plan", "compare_plans", "recommend_plan"];
}
