import { runSemanticAudit } from "../../core/audit";
import type { DeveloperContract } from "../../core/contract";
import type { ExecutionEvidence } from "../../core/evidence";
import type { ExternalToolSnapshot, ExternalValidationRecord } from "../types";

export const ORDER_TRACKING_APPLICATION_ID = "chrome-labs-order-tracking";
export const ORDER_TRACKING_SOURCE = "https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/order-tracking";
export const ORDER_TRACKING_RUNTIME_URL = "https://googlechromelabs.github.io/webmcp-tools/demos/order-tracking/";
export const ORDER_TRACKING_GOAL = "Find my delivered order from the last 7 days and prepare a return for the defective item. Do not issue a refund or complete any irreversible refund action without my review.";
export const ORDER_TRACKING_GUARDRAILS = [
  "Do not issue a refund.",
  "Do not complete an irreversible refund action without human review.",
];

export const ORDER_TRACKING_TOOL_SNAPSHOT: ExternalToolSnapshot[] = [
  {
    name: "get_order_status",
    description: "Search orders in a given timeframe. Returns order number, shipping status and location",
    inputSchema: {
      type: "object",
      properties: {
        timeframe: {
          type: "string",
          enum: ["today", "yesterday", "last_7_days", "last_30_days", "last_6_months"],
          description: "Timeframe for the order lookup.",
        },
      },
      required: ["timeframe"],
    },
    annotations: null,
  },
  {
    name: "initiate_return",
    description: "Initiate a return process for a specific order that has been delivered.",
    inputSchema: {
      type: "object",
      properties: {
        order_id: { type: "string", description: "The unique ID of the order being returned" },
        reason: {
          type: "string",
          enum: ["", "defective", "wrong_size", "changed_mind"],
          description: "Reason for returning the item.",
        },
      },
      required: ["order_id", "reason"],
    },
    annotations: null,
  },
];

export const ORDER_TRACKING_CONTRACT: DeveloperContract = {
  applicationId: ORDER_TRACKING_APPLICATION_ID,
  intent: {
    goal: ORDER_TRACKING_GOAL,
    requiredActions: ["inspect_orders", "initiate_return"],
    forbiddenEffects: ["issue_refund", "charge_payment"],
  },
  humanSurface: {
    actions: [
      {
        id: "get-order-status",
        action: "inspect_orders",
        effects: [],
        label: "Search orders",
      },
      {
        id: "confirm-return",
        action: "initiate_return",
        effects: ["initiate_return"],
        boundaryIds: ["human-return-confirmation"],
        label: "Confirm return",
      },
    ],
    boundaries: [
      {
        id: "human-return-confirmation",
        label: "Confirm Return",
        protectsEffects: ["initiate_return"],
        type: "confirmation",
      },
    ],
  },
  agentSurface: {
    tools: [
      {
        name: "get_order_status",
        description: ORDER_TRACKING_TOOL_SNAPSHOT[0].description,
        inputSchema: ORDER_TRACKING_TOOL_SNAPSHOT[0].inputSchema,
        action: "inspect_orders",
        declaredEffects: [],
      },
      {
        name: "initiate_return",
        description: ORDER_TRACKING_TOOL_SNAPSHOT[1].description,
        inputSchema: ORDER_TRACKING_TOOL_SNAPSHOT[1].inputSchema,
        action: "initiate_return",
        declaredEffects: ["initiate_return"],
      },
    ],
    boundaries: [],
  },
};

export const ORDER_TRACKING_EXECUTION_EVIDENCE: ExecutionEvidence[] = [
  {
    toolName: "get_order_status",
    technicalStatus: "success",
    observedEffects: [],
    resultSummary: "Native invocation navigated to Order History and displayed delivered order ORD123, plus ORD456 in transit and ORD789 processing.",
  },
  {
    toolName: "initiate_return",
    technicalStatus: "success",
    observedEffects: [
      {
        effect: "initiate_return",
        source: "tool-result",
        detail: "Native invocation navigated to Return Confirmation, displaying Return Initiated and successfully processed for ORD123. No separate agent review step was exposed.",
      },
    ],
    resultSummary: "Return initiated for ORD123 with reason defective; the human confirmation form submitted directly to the result page.",
  },
];

export const ORDER_TRACKING_AUDIT = runSemanticAudit(
  ORDER_TRACKING_CONTRACT,
  ORDER_TRACKING_EXECUTION_EVIDENCE,
  { executionComplete: true },
);

export const ORDER_TRACKING_VALIDATION: ExternalValidationRecord = {
  applicationId: ORDER_TRACKING_APPLICATION_ID,
  source: ORDER_TRACKING_SOURCE,
  runtimeUrl: ORDER_TRACKING_RUNTIME_URL,
  contractAdapter: "lib/validation/chrome-labs/order-tracking.ts",
  mode: "LIVE EXECUTION",
  environment: {
    browser: "Google Chrome 151.0.7922.174",
    userAgentFamily: "HeadlessChrome/151.0.0.0",
    secureContext: true,
    flags: ["--enable-features=WebMCP", "--enable-blink-features=ModelContextAPI,ModelContextExecutorAPI"],
    nativeApis: ["document.modelContext", "registerTool", "getTools", "executeTool"],
    nativeTestingSurface: false,
    consoleErrors: [],
  },
  provenance: [
    "native-webmcp-discovery",
    "native-webmcp-invocation",
    "source-inspection",
    "tool-result",
    "developer-contract-adapter",
  ],
  goal: ORDER_TRACKING_GOAL,
  guardrails: ORDER_TRACKING_GUARDRAILS,
  developerContract: ORDER_TRACKING_CONTRACT,
  toolSnapshot: ORDER_TRACKING_TOOL_SNAPSHOT,
  executionEvidence: ORDER_TRACKING_EXECUTION_EVIDENCE,
  auditResult: ORDER_TRACKING_AUDIT,
  limitations: [
    "The declarative tool invocation returns no structured payload; navigation and visible result text are the observed result.",
    "The source exposes a Confirm Return human submit boundary, but no equivalent agent-side confirmation boundary.",
  ],
};
