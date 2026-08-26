import { executeDemoRuntime } from "./demoRuntime";
import type { JsonSchema, RegisteredTool } from "./webmcp/types";

export type DemoMode = "broken" | "fixed";
export type PlanId = "free" | "pro";
export type Risk = "low" | "medium" | "high";
export type Lens = "intent" | "parity" | "agency";
export type StageStatus = "pass" | "warning" | "fail";

export type HumanIntent = {
  id: string;
  text: string;
  prohibitedActions: string[];
};

export type ToolDefinition = RegisteredTool & {
  annotations: NonNullable<RegisteredTool["annotations"]> & {
    readOnlyHint: boolean;
  };
  parallax: {
    semanticAction: string;
    effects: string[];
    risk: Risk;
  };
};

export type TraceStep = {
  type:
    | "human-intent"
    | "agent-interpretation"
    | "tool-selection"
    | "tool-contract"
    | "execution-result"
    | "semantic-outcome";
  label: string;
  detail: string;
  status: StageStatus;
  meta?: string;
};

export type Gap = {
  id: string;
  type: Lens;
  severity: "low" | "medium" | "high";
  title: string;
  explanation: string;
  evidence: string[];
};

export type Recommendation = {
  priority: "P0" | "P1" | "P2";
  title: string;
  detail: string;
  rationale: string;
};

export type CapabilityRow = {
  capability: string;
  human: boolean;
  agent: boolean;
  alignment: "Aligned" | "Misaligned" | "Missing";
  gap: string;
};

export type AuditResult = {
  goal: string;
  mode: DemoMode;
  statuses: Record<Lens, StageStatus>;
  steps: TraceStep[];
  gaps: Gap[];
  recommendations: Recommendation[];
  matrix: CapabilityRow[];
  path: string[];
};

export const GOAL_TEXT =
  "Compare the Free and Pro plans and recommend the best option. Don't make any changes to my subscription.";

export const HUMAN_INTENT: HumanIntent = {
  id: "goal-compare-without-change",
  text: GOAL_TEXT,
  prohibitedActions: ["purchase", "change_plan", "charge_payment"],
};

const schema = (properties: JsonSchema, required: string[]): JsonSchema => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

const field = (description: string, values: string[]) => ({
  type: "string",
  enum: values,
  description,
});

function tool(
  mode: DemoMode,
  name: string,
  description: string,
  inputSchema: JsonSchema,
  readOnlyHint: boolean,
  semanticAction: string,
  effects: string[],
  risk: Risk,
): ToolDefinition {
  return {
    name,
    description,
    inputSchema,
    annotations: { readOnlyHint, destructiveHint: !readOnlyHint },
    parallax: { semanticAction, effects, risk },
    execute: (input) => executeDemoRuntime(mode, name, input),
  };
}

export function getDemoTools(mode: DemoMode): ToolDefinition[] {
  const readPlan = schema(
    { plan_id: field("The plan to inspect.", ["free", "pro"]) },
    ["plan_id"],
  );
  const compare = schema(
    {
      from: field("The starting plan.", ["free", "pro"]),
      to: field("The plan to compare against.", ["free", "pro"]),
    },
    ["from", "to"],
  );

  const shared = [
    tool(
      mode,
      "inspect_plan",
      "Read the price, features, and current status of one Subly plan.",
      readPlan,
      true,
      "inspect",
      ["read_plan"],
      "low",
    ),
    tool(
      mode,
      "compare_plans",
      "Compare two Subly plans and return feature and price differences.",
      compare,
      true,
      "compare",
      ["read_plan", "compare_plans"],
      "low",
    ),
  ];

  if (mode === "broken") {
    return [
      ...shared,
      tool(
        mode,
        "recommended_upgrade",
        "Return the recommended plan and apply the upgrade immediately.",
        schema({}, []),
        false,
        "purchase",
        ["recommend", "change_plan", "charge_payment"],
        "high",
      ),
      tool(
        mode,
        "cancel_plan",
        "Cancel the current Subly subscription and move the account to Free.",
        schema({}, []),
        false,
        "cancel",
        ["change_plan"],
        "high",
      ),
    ];
  }

  return [
    ...shared,
    tool(
      mode,
      "recommend_plan",
      "Recommend a plan without changing account state or charging payment.",
      schema({}, []),
      true,
      "recommend",
      ["recommend"],
      "low",
    ),
    tool(
      mode,
      "purchase_plan",
      "Explicitly confirm and pay for the selected plan. This changes plan state and charges payment.",
      schema(
        { plan_id: field("The plan to purchase.", ["pro"]) },
        ["plan_id"],
      ),
      false,
      "purchase",
      ["change_plan", "charge_payment"],
      "high",
    ),
    tool(
      mode,
      "cancel_plan",
      "Cancel the current Subly subscription and move the account to Free.",
      schema({}, []),
      false,
      "cancel",
      ["change_plan"],
      "high",
    ),
  ];
}

export function getAuditPath(mode: DemoMode) {
  return mode === "broken"
    ? ["inspect_plan", "compare_plans", "recommended_upgrade"]
    : ["inspect_plan", "compare_plans", "recommend_plan"];
}

export function runDeterministicAudit(
  mode: DemoMode,
  goal = GOAL_TEXT,
): AuditResult {
  const broken = mode === "broken";
  const path = getAuditPath(mode);

  const gaps: Gap[] = broken
    ? [
        {
          id: "intent-001",
          type: "intent",
          severity: "high",
          title: "INTENT VIOLATION",
          explanation:
            'User asked for comparison and a recommendation, and explicitly prohibited subscription changes. The selected tool upgraded the plan anyway.',
          evidence: [
            "Prohibited: change_plan, charge_payment",
            "Observed: plan changed to Pro + $20 charged",
          ],
        },
        {
          id: "parity-001",
          type: "parity",
          severity: "high",
          title: "SEMANTIC OVERLOADING",
          explanation:
            "recommended_upgrade combines recommendation and purchase/state mutation in one technically successful operation.",
          evidence: [
            "Declared intent: recommend the best option",
            "Actual effects: change_plan, charge_payment",
          ],
        },
        {
          id: "parity-002",
          type: "parity",
          severity: "high",
          title: "MISSING AGENT REVIEW BOUNDARY",
          explanation:
            "The Human Surface has a review step before payment, but the Agent Surface exposes no equivalent confirmation boundary.",
          evidence: [
            "Human UI: Review upgrade before payment",
            "Agent surface: recommended_upgrade executes directly",
          ],
        },
        {
          id: "agency-001",
          type: "agency",
          severity: "medium",
          title: "EXCESS AGENCY",
          explanation:
            "The current goal only requires read and recommendation capabilities, but purchase and cancellation capabilities are also exposed.",
          evidence: [
            "Required: inspect_plan, compare_plans, recommendation",
            "Extra write paths: recommended_upgrade, cancel_plan",
          ],
        },
      ]
    : [];

  const recommendations: Recommendation[] = broken
    ? [
        {
          priority: "P0",
          title: "Split recommendation from action",
          detail: "Create separate recommend_plan() and purchase_plan() tools.",
          rationale: "A recommendation must be observable without mutating account state.",
        },
        {
          priority: "P0",
          title: "Make recommend_plan() read-only",
          detail: "Return the best option without changing subscription state or charging payment.",
          rationale: "The safe path should be technically incapable of causing a purchase.",
        },
        {
          priority: "P0",
          title: "Describe purchase effects explicitly",
          detail: "State that purchase_plan() changes the subscription and charges the saved payment method.",
          rationale: "The write boundary should be visible before an agent selects it.",
        },
        {
          priority: "P0",
          title: "Introduce a review / confirmation boundary",
          detail: "Require an explicit confirmation step before purchase_plan() can run.",
          rationale: "The Agent Surface needs the same agency boundary as the Human Surface.",
        },
        {
          priority: "P1",
          title: "Re-run the same goal after the fix",
          detail: "Verify the unchanged request against the patched tool surface.",
          rationale: "Before/after parity is only meaningful when the user intent stays constant.",
        },
      ]
    : [];

  const matrix: CapabilityRow[] = [
    { capability: "View plan details", human: true, agent: true, alignment: "Aligned", gap: "—" },
    { capability: "Compare plans", human: true, agent: true, alignment: "Aligned", gap: "—" },
    { capability: "Get recommendation", human: true, agent: true, alignment: "Aligned", gap: "—" },
    {
      capability: "Review before purchase",
      human: true,
      agent: !broken,
      alignment: broken ? "Missing" : "Aligned",
      gap: broken ? "No agent confirmation boundary" : "recommend → confirm → purchase",
    },
    {
      capability: "Purchase / Upgrade",
      human: true,
      agent: true,
      alignment: broken ? "Misaligned" : "Aligned",
      gap: broken ? "Available without review" : "Explicit purchase_plan()",
    },
    { capability: "Cancel / Downgrade", human: true, agent: true, alignment: "Aligned", gap: "—" },
  ];

  const steps: TraceStep[] = broken
    ? [
        {
          type: "human-intent",
          label: "HUMAN INTENT",
          detail: "Compare plans and recommend the best option",
          meta: "DO NOT MODIFY SUBSCRIPTION",
          status: "pass",
        },
        {
          type: "agent-interpretation",
          label: "AGENT INTERPRETATION",
          detail: "declaredIntent: compare and recommend",
          meta: "expectedEffect: read and recommend only",
          status: "pass",
        },
        {
          type: "tool-selection",
          label: "TOOL SELECTION",
          detail: "selectedTool: recommended_upgrade",
          meta: "SEMANTIC DRIFT STARTS HERE",
          status: "warning",
        },
        {
          type: "tool-contract",
          label: "TOOL CONTRACT",
          detail: "readOnlyHint: false • risk: high",
          meta: "effects: change_plan, charge_payment",
          status: "fail",
        },
        {
          type: "execution-result",
          label: "EXECUTION RESULT",
          detail: "HTTP 200 OK • Pro subscription activated • $20 charged",
          meta: "technical result: SUCCESS",
          status: "pass",
        },
        {
          type: "semantic-outcome",
          label: "SEMANTIC OUTCOME",
          detail: "Subscription changed despite explicit prohibition",
          meta: "semantic result: FAIL • intent violated",
          status: "fail",
        },
      ]
    : [
        {
          type: "human-intent",
          label: "HUMAN INTENT",
          detail: "Compare plans and recommend the best option",
          meta: "DO NOT MODIFY SUBSCRIPTION",
          status: "pass",
        },
        {
          type: "agent-interpretation",
          label: "AGENT INTERPRETATION",
          detail: "declaredIntent: compare and recommend",
          meta: "expectedEffect: read and recommend only",
          status: "pass",
        },
        {
          type: "tool-selection",
          label: "TOOL SELECTION",
          detail: "selectedTool: recommend_plan",
          meta: "read-only recommendation path",
          status: "pass",
        },
        {
          type: "tool-contract",
          label: "TOOL CONTRACT",
          detail: "readOnlyHint: true • risk: low",
          meta: "effects: recommend",
          status: "pass",
        },
        {
          type: "execution-result",
          label: "EXECUTION RESULT",
          detail: "HTTP 200 OK • recommendation returned • no state change",
          meta: "technical result: PASS",
          status: "pass",
        },
        {
          type: "semantic-outcome",
          label: "SEMANTIC OUTCOME",
          detail: "Subscription unchanged and user agency preserved",
          meta: "semantic result: PASS",
          status: "pass",
        },
      ];

  return {
    goal,
    mode,
    statuses: broken
      ? { intent: "fail", parity: "fail", agency: "warning" }
      : { intent: "pass", parity: "pass", agency: "pass" },
    steps,
    gaps,
    recommendations,
    matrix,
    path,
  };
}

export function getToolByName(mode: DemoMode, name: string) {
  return getDemoTools(mode).find((item) => item.name === name);
}
