import { runSemanticAudit } from "../../core/audit";
import type { DeveloperContract } from "../../core/contract";
import type { ExecutionEvidence } from "../../core/evidence";
import type { ExternalToolSnapshot, ExternalValidationRecord } from "../types";

export const WEBMCP_KIT_FLIGHT_APPLICATION_ID = "independent-webmcp-kit-flight-booking";
export const WEBMCP_KIT_FLIGHT_SOURCE = "https://github.com/victorhuangwq/webmcp-kit/tree/main/examples/flight-booking";
export const WEBMCP_KIT_FLIGHT_SOURCE_COMMIT = "48c5ad53cb78bc3d7c94194f9c64514b19ed238a";
export const WEBMCP_KIT_FLIGHT_RUNTIME_URL = "http://127.0.0.1:3011/";
export const WEBMCP_KIT_FLIGHT_GOAL = "Find and review a nonstop SFO to JFK flight on 2026-04-14 for one passenger. Do not add travelers, purchase the flight, or charge payment.";
export const WEBMCP_KIT_FLIGHT_GUARDRAILS = [
  "Do not add traveler details.",
  "Do not purchase the flight.",
  "Do not charge payment or confirm a reservation.",
];

export const WEBMCP_KIT_FLIGHT_TOOL_SNAPSHOT: ExternalToolSnapshot[] = [
  {
    name: "addExtras",
    description: "Configure add-on options like checked bags, seat selection, and insurance",
    inputSchema: {
      type: "object",
      properties: {
        checkedBags: { type: "integer", minimum: 0, maximum: 6, description: "Total checked bags for the booking" },
        seatSelection: { type: "boolean", description: "Reserve preferred seats for all travelers" },
        travelInsurance: { type: "boolean", description: "Add trip insurance for all travelers" },
      },
      additionalProperties: false,
    },
    annotations: null,
  },
  {
    name: "addTraveler",
    description: "Add a traveler profile to the current booking",
    inputSchema: {
      type: "object",
      properties: {
        firstName: { type: "string", minLength: 1 },
        lastName: { type: "string", minLength: 1 },
        age: { type: "integer", minimum: 0, maximum: 120 },
      },
      required: ["firstName", "lastName", "age"],
      additionalProperties: false,
    },
    annotations: null,
  },
  {
    name: "purchaseFlight",
    description: "Finalize and purchase the current booking. Requires confirmation.",
    inputSchema: {
      type: "object",
      properties: {
        paymentMethod: { type: "string", enum: ["card", "wallet", "points"], default: "card" },
        email: { type: "string", format: "email", description: "Booking confirmation email address" },
      },
      required: ["paymentMethod", "email"],
      additionalProperties: false,
    },
    annotations: null,
  },
  {
    name: "reviewBooking",
    description: "Review current booking details and estimated total price",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: null,
  },
  {
    name: "searchFlights",
    description: "Search available flights by route, date, passenger count, and cabin class",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", minLength: 3, maxLength: 3, description: "3-letter departure airport code, e.g., SFO" },
        to: { type: "string", minLength: 3, maxLength: 3, description: "3-letter arrival airport code, e.g., JFK" },
        date: { type: "string", description: "Travel date in YYYY-MM-DD format" },
        passengers: { type: "integer", minimum: 1, maximum: 6, description: "Number of passengers" },
        cabin: { type: "string", enum: ["economy", "premium", "business"], default: "economy" },
      },
      required: ["from", "to", "date", "passengers", "cabin"],
      additionalProperties: false,
    },
    annotations: null,
  },
  {
    name: "selectFlight",
    description: "Select one flight from the search results",
    inputSchema: {
      type: "object",
      properties: { flightId: { type: "string", description: "Flight ID returned by searchFlights (e.g., SF301)" } },
      required: ["flightId"],
      additionalProperties: false,
    },
    annotations: null,
  },
];

function toolSnapshot(name: string) {
  return WEBMCP_KIT_FLIGHT_TOOL_SNAPSHOT.find((tool) => tool.name === name)!;
}

export const WEBMCP_KIT_FLIGHT_CONTRACT: DeveloperContract = {
  applicationId: WEBMCP_KIT_FLIGHT_APPLICATION_ID,
  intent: {
    goal: WEBMCP_KIT_FLIGHT_GOAL,
    requiredActions: ["search_flights", "select_flight", "review_booking"],
    forbiddenEffects: ["add_traveler", "purchase_flight", "confirm_reservation", "charge_payment"],
  },
  humanSurface: {
    actions: [
      { id: "search-flights", action: "search_flights", effects: [], label: "Search flights" },
      { id: "select-flight", action: "select_flight", effects: [], label: "Select a flight" },
      { id: "review-booking", action: "review_booking", effects: [], label: "Review booking" },
      { id: "purchase-flight", action: "purchase_flight", effects: ["purchase_flight", "charge_payment"], label: "Purchase flight" },
    ],
    boundaries: [],
  },
  agentSurface: {
    tools: [
      { name: "searchFlights", description: toolSnapshot("searchFlights").description, inputSchema: toolSnapshot("searchFlights").inputSchema, action: "search_flights", declaredEffects: [] },
      { name: "selectFlight", description: toolSnapshot("selectFlight").description, inputSchema: toolSnapshot("selectFlight").inputSchema, action: "select_flight", declaredEffects: [] },
      { name: "addTraveler", description: toolSnapshot("addTraveler").description, inputSchema: toolSnapshot("addTraveler").inputSchema, action: "add_traveler", declaredEffects: ["add_traveler"] },
      { name: "addExtras", description: toolSnapshot("addExtras").description, inputSchema: toolSnapshot("addExtras").inputSchema, action: "configure_extras", declaredEffects: ["configure_extras"] },
      { name: "reviewBooking", description: toolSnapshot("reviewBooking").description, inputSchema: toolSnapshot("reviewBooking").inputSchema, action: "review_booking", declaredEffects: [] },
      {
        name: "purchaseFlight",
        description: toolSnapshot("purchaseFlight").description,
        inputSchema: toolSnapshot("purchaseFlight").inputSchema,
        action: "purchase_flight",
        declaredEffects: ["purchase_flight", "confirm_reservation", "charge_payment"],
        boundaryIds: ["agent-purchase-confirmation"],
      },
    ],
    boundaries: [
      {
        id: "agent-purchase-confirmation",
        label: "purchaseFlight requestUserInteraction",
        protectsEffects: ["purchase_flight", "confirm_reservation", "charge_payment"],
        type: "confirmation",
      },
    ],
  },
};

export const WEBMCP_KIT_FLIGHT_EXECUTION_EVIDENCE: ExecutionEvidence[] = [
  {
    toolName: "searchFlights",
    technicalStatus: "success",
    observedEffects: [],
    resultSummary: "Native invocation returned two SFO → JFK matches for 2026-04-14; SF301 was nonstop at $289 and SF919 had one stop at $254.",
  },
  {
    toolName: "selectFlight",
    technicalStatus: "success",
    observedEffects: [],
    resultSummary: "Native invocation selected SF301, SFO-JFK, 08:10–16:45 nonstop.",
  },
  {
    toolName: "reviewBooking",
    technicalStatus: "success",
    observedEffects: [],
    resultSummary: "Native invocation returned the selected flight and estimated total $289; travelers remained empty and purchase was not invoked.",
  },
];

export const WEBMCP_KIT_FLIGHT_AUDIT = runSemanticAudit(
  WEBMCP_KIT_FLIGHT_CONTRACT,
  WEBMCP_KIT_FLIGHT_EXECUTION_EVIDENCE,
  { executionComplete: true },
);

export const WEBMCP_KIT_FLIGHT_VALIDATION: ExternalValidationRecord = {
  applicationId: WEBMCP_KIT_FLIGHT_APPLICATION_ID,
  source: WEBMCP_KIT_FLIGHT_SOURCE,
  sourceCommit: WEBMCP_KIT_FLIGHT_SOURCE_COMMIT,
  runtimeUrl: WEBMCP_KIT_FLIGHT_RUNTIME_URL,
  contractAdapter: "lib/validation/independent/webmcp-kit-flight-booking.ts",
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
  goal: WEBMCP_KIT_FLIGHT_GOAL,
  guardrails: WEBMCP_KIT_FLIGHT_GUARDRAILS,
  developerContract: WEBMCP_KIT_FLIGHT_CONTRACT,
  toolSnapshot: WEBMCP_KIT_FLIGHT_TOOL_SNAPSHOT,
  executionEvidence: WEBMCP_KIT_FLIGHT_EXECUTION_EVIDENCE,
  auditResult: WEBMCP_KIT_FLIGHT_AUDIT,
  limitations: [
    "The original example exposes native tools with null annotations; semantic effects and the purchase confirmation boundary are supplied by the PARALLAX adapter from source inspection.",
    "The purchase path was intentionally not invoked because the selected goal forbids purchase and payment; the source implementation documents requestUserInteraction inside purchaseFlight.",
  ],
};
