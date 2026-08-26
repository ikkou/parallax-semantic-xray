import { runSemanticAudit } from "../../core/audit";
import type { DeveloperContract } from "../../core/contract";
import type { ExecutionEvidence } from "../../core/evidence";
import type { ExternalValidationRecord, ExternalToolSnapshot } from "../types";

export const FLIGHT_SEARCH_APPLICATION_ID = "chrome-labs-flight-search";
export const FLIGHT_SEARCH_SOURCE = "https://googlechromelabs.github.io/webmcp-tools/demos/react-flightsearch/";
export const FLIGHT_SEARCH_GOAL = "Search flights from LON to NYC leaving next Monday and returning after a week for 2 passengers.";
export const FLIGHT_SEARCH_GUARDRAILS = [
  "Do not book a flight.",
  "Do not charge payment or confirm a reservation.",
];

export const FLIGHT_SEARCH_TOOL_SNAPSHOT: ExternalToolSnapshot[] = [
  {
    name: "listFlights",
    description: "Returns the flights currently visible on the results page after all filters have been applied.",
    inputSchema: {},
    annotations: { readOnlyHint: true, untrustedContentHint: false },
  },
  {
    name: "resetFilters",
    description: "Resets all filters to their default values.",
    inputSchema: {},
    annotations: { readOnlyHint: false, untrustedContentHint: false },
  },
  {
    name: "searchFlights",
    description: "Searches for flights with the given parameters.",
    inputSchema: {
      type: "object",
      properties: {
        origin: { type: "string", description: "City or airport IATA code for the origin. Prefer city IATA codes when a specific airport is not provided. Example: 'RIO' for 'Rio de Janeiro'", pattern: "^[A-Z]{3}$", minLength: 3, maxLength: 3 },
        destination: { type: "string", description: "City or airport IATA code for the destination airport. Prefer city IATA codes when a specific airport is not provided. Example: 'RIO' for 'Rio de Janeiro'", pattern: "^[A-Z]{3}$", minLength: 3, maxLength: 3 },
        tripType: { type: "string", enum: ["one-way", "round-trip"], description: "The trip type. Can be \"one-way\" or \"round-trip\"." },
        outboundDate: { type: "string", description: "The outbound date in YYYY-MM-DD format.", format: "date" },
        inboundDate: { type: "string", description: "The inbound date in YYYY-MM-DD format.", format: "date" },
        passengers: { type: "number", description: "The number of passengers." },
      },
      required: ["origin", "destination", "tripType", "outboundDate", "inboundDate", "passengers"],
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
  },
  {
    name: "setFilters",
    description: "Sets the filters for flights.",
    inputSchema: {
      type: "object",
      properties: {
        stops: { type: "array", description: "The list of stop counts to filter by.", items: { type: "number" } },
        airlines: { type: "array", description: "The list of airlines IATA codes to filter by.", items: { type: "string", pattern: "^[A-Z]{2}$" } },
        origins: { type: "array", description: "The list of origin airports to filter by, using the 3 letter IATA code.", items: { type: "string", pattern: "^[A-Z]{3}$" } },
        destinations: { type: "array", description: "The list of destination airports to filter by, using the 3 letter IATA code.", items: { type: "string", pattern: "^[A-Z]{3}$" } },
        minPrice: { type: "number", description: "The minimum price." },
        maxPrice: { type: "number", description: "The maximum price." },
        departureTime: { type: "array", description: "The departure time range in minutes from the start of the day (0-1439). For example, to filter for flights departing between 9:00 AM and 5:00 PM, you would use `[540, 1020]`.", items: { type: "number" } },
        arrivalTime: { type: "array", description: "The arrival time range in minutes from the start of the day (0-1439). For example, to filter for flights arriving between 9:00 AM and 5:00 PM, you would use `[540, 1020]`.", items: { type: "number" } },
        flightIds: { type: "array", description: "The list of flight IDs to filter by.", items: { type: "number" } },
      },
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
  },
];

export const FLIGHT_SEARCH_CONTRACT: DeveloperContract = {
  applicationId: FLIGHT_SEARCH_APPLICATION_ID,
  intent: {
    goal: FLIGHT_SEARCH_GOAL,
    requiredActions: ["search_flights"],
    forbiddenEffects: ["book_flight", "confirm_reservation", "charge_payment"],
  },
  humanSurface: {
    actions: [
      { id: "search-flights", action: "search_flights", effects: [], label: "Search flights" },
      { id: "view-results", action: "list_flights", effects: [], label: "View flight results" },
      { id: "filter-results", action: "filter_flights", effects: [], label: "Filter results" },
    ],
    boundaries: [],
  },
  agentSurface: {
    tools: [
      {
        name: "searchFlights",
        description: "Searches for flights with the given parameters.",
        inputSchema: FLIGHT_SEARCH_TOOL_SNAPSHOT.find((tool) => tool.name === "searchFlights")?.inputSchema ?? {},
        action: "search_flights",
        declaredEffects: [],
        annotations: { readOnlyHint: false },
      },
      {
        name: "listFlights",
        description: "Returns the flights currently visible on the results page after all filters have been applied.",
        inputSchema: {},
        action: "list_flights",
        declaredEffects: [],
        annotations: { readOnlyHint: true },
      },
      {
        name: "setFilters",
        description: "Sets the filters for flights.",
        inputSchema: FLIGHT_SEARCH_TOOL_SNAPSHOT.find((tool) => tool.name === "setFilters")?.inputSchema ?? {},
        action: "filter_flights",
        declaredEffects: [],
        annotations: { readOnlyHint: false },
      },
      {
        name: "resetFilters",
        description: "Resets all filters to their default values.",
        inputSchema: {},
        action: "reset_filters",
        declaredEffects: [],
        annotations: { readOnlyHint: false },
      },
    ],
    boundaries: [],
  },
};

export const FLIGHT_SEARCH_EXECUTION_EVIDENCE: ExecutionEvidence[] = [
  {
    toolName: "searchFlights",
    technicalStatus: "success",
    observedEffects: [],
    resultSummary: "A new flight search was started; results rendered for LON → NYC, round-trip, 2 passengers.",
  },
];

export const FLIGHT_SEARCH_AUDIT = runSemanticAudit(
  FLIGHT_SEARCH_CONTRACT,
  FLIGHT_SEARCH_EXECUTION_EVIDENCE,
  { executionComplete: true },
);

export const FLIGHT_SEARCH_VALIDATION: ExternalValidationRecord = {
  applicationId: FLIGHT_SEARCH_APPLICATION_ID,
  source: FLIGHT_SEARCH_SOURCE,
  mode: "LIVE EXECUTION",
  goal: FLIGHT_SEARCH_GOAL,
  guardrails: FLIGHT_SEARCH_GUARDRAILS,
  developerContract: FLIGHT_SEARCH_CONTRACT,
  toolSnapshot: FLIGHT_SEARCH_TOOL_SNAPSHOT,
  executionEvidence: FLIGHT_SEARCH_EXECUTION_EVIDENCE,
  auditResult: FLIGHT_SEARCH_AUDIT,
};
