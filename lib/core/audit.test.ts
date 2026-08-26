import assert from "node:assert/strict";
import { test } from "node:test";
import { runSemanticAudit } from "./audit";
import type { DeveloperContract } from "./contract";
import type { ExecutionEvidence } from "./evidence";

function contract(overrides: Partial<DeveloperContract> = {}): DeveloperContract {
  return {
    applicationId: "fixture",
    intent: {
      goal: "Inspect and recommend.",
      requiredActions: ["inspect", "recommend"],
      forbiddenEffects: ["charge"],
    },
    humanSurface: {
      actions: [
        { id: "inspect", action: "inspect", effects: [], label: "Inspect" },
        { id: "recommend", action: "recommend", effects: [], label: "Recommend" },
      ],
      boundaries: [],
    },
    agentSurface: {
      tools: [
        {
          name: "inspect_tool",
          description: "Inspect data.",
          inputSchema: { type: "object" },
          action: "inspect",
          declaredEffects: [],
          annotations: { readOnlyHint: true },
        },
        {
          name: "recommend_tool",
          description: "Recommend an option.",
          inputSchema: { type: "object" },
          action: "recommend",
          declaredEffects: [],
          annotations: { readOnlyHint: true },
        },
      ],
      boundaries: [],
    },
    ...overrides,
  };
}

function evidence(
  toolName: string,
  observedEffects: ExecutionEvidence["observedEffects"],
): ExecutionEvidence {
  return {
    toolName,
    technicalStatus: "success",
    statusCode: 200,
    observedEffects,
  };
}

test("forbidden effect is a derived intent failure", () => {
  const result = runSemanticAudit(
    contract({
      intent: {
        goal: "Recommend only.",
        requiredActions: ["recommend"],
        forbiddenEffects: ["charge"],
      },
    }),
    [evidence("recommend_tool", [{ effect: "charge", source: "runtime-instrumentation" }])],
    { executionComplete: true },
  );

  assert.equal(result.statuses.intent, "fail");
  assert.equal(result.gaps.some((gap) => gap.rule === "forbidden-effect" && gap.status === "fail"), true);
  assert.match(result.gaps[0]?.observed?.join(" ") ?? "", /charge/);
});

test("clean read-only workflow passes when required actions and evidence are present", () => {
  const result = runSemanticAudit(
    contract(),
    [
      evidence("inspect_tool", []),
      evidence("recommend_tool", []),
    ],
    { executionComplete: true },
  );

  assert.deepEqual(result.statuses, { intent: "pass", parity: "pass", agency: "pass" });
  assert.equal(result.technicalStatus, "pass");
  assert.equal(result.semanticStatus, "pass");
  assert.equal(result.gaps.length, 0);
});

test("missing execution evidence is warning, never pass", () => {
  const result = runSemanticAudit(contract(), [], { executionComplete: false });

  assert.equal(result.technicalStatus, "warning");
  assert.equal(result.statuses.intent, "warning");
  assert.equal(result.semanticStatus, "warning");
  assert.equal(result.gaps.some((gap) => gap.rule === "missing-required-action" && gap.status === "warning"), true);
});

test("read-only declaration cannot override observed mutation", () => {
  const result = runSemanticAudit(
    contract({
      intent: {
        goal: "Inspect only.",
        requiredActions: ["inspect"],
        forbiddenEffects: [],
      },
      agentSurface: {
        tools: [
          {
            name: "inspect_files",
            description: "Inspect files.",
            inputSchema: { type: "object" },
            action: "inspect_files",
            declaredEffects: [],
            annotations: { readOnlyHint: true },
          },
          {
            name: "delete_files",
            description: "Delete files.",
            inputSchema: { type: "object" },
            action: "delete_files",
            declaredEffects: ["delete_file"],
            annotations: { readOnlyHint: false },
          },
        ],
        boundaries: [],
      },
    }),
    [evidence("inspect_files", [{ effect: "delete_file", source: "state-diff" }])],
    { executionComplete: true },
  );

  const mismatch = result.gaps.find((gap) => gap.rule === "declaration-observation-mismatch");
  assert.equal(mismatch?.status, "fail");
  assert.match(mismatch?.declared?.join(" ") ?? "", /readOnlyHint/);
  assert.match(mismatch?.observed?.join(" ") ?? "", /delete_file/);
});

test("missing agent confirmation boundary is derived from human boundary parity", () => {
  const result = runSemanticAudit(
    contract({
      intent: {
        goal: "Book a reservation.",
        forbiddenEffects: [],
      },
      humanSurface: {
        actions: [
          { id: "book", action: "book", effects: ["confirm_booking"], boundaryIds: ["review"] },
        ],
        boundaries: [{ id: "review", type: "review", protectsEffects: ["confirm_booking"] }],
      },
      agentSurface: {
        tools: [
          {
            name: "book_reservation",
            description: "Book the reservation.",
            inputSchema: { type: "object" },
            action: "book",
            declaredEffects: ["confirm_booking"],
            annotations: { readOnlyHint: false },
          },
        ],
        boundaries: [],
      },
    }),
    [evidence("book_reservation", [{ effect: "confirm_booking", source: "tool-result" }])],
    { executionComplete: true },
  );

  assert.equal(result.gaps.some((gap) => gap.rule === "missing-confirmation-boundary" && gap.status === "fail"), true);
});

test("semantic overloading is detected when an agent combines separated human actions", () => {
  const result = runSemanticAudit(
    contract({
      intent: { goal: "Recommend without buying.", forbiddenEffects: ["charge"] },
      humanSurface: {
        actions: [
          { id: "recommend", action: "recommend", effects: [] },
          { id: "buy", action: "buy", effects: ["charge"], boundaryIds: ["review"] },
        ],
        boundaries: [{ id: "review", type: "review", protectsEffects: ["charge"] }],
      },
      agentSurface: {
        tools: [
          {
            name: "recommend_and_buy",
            description: "Recommend and buy.",
            inputSchema: { type: "object" },
            action: "recommend",
            declaredEffects: ["charge"],
            annotations: { readOnlyHint: false },
          },
        ],
        boundaries: [],
      },
    }),
    [],
    { executionComplete: false },
  );

  assert.equal(result.gaps.some((gap) => gap.rule === "semantic-overloading"), true);
});

test("excess agency warns on unnecessary mutation tools but not read-only tools", () => {
  const result = runSemanticAudit(
    contract({
      intent: {
        goal: "Inspect files.",
        requiredActions: ["inspect_files"],
        forbiddenEffects: ["delete_file"],
      },
      humanSurface: {
        actions: [{ id: "inspect", action: "inspect_files", effects: [] }],
        boundaries: [],
      },
      agentSurface: {
        tools: [
          {
            name: "inspect_files",
            description: "Inspect files.",
            inputSchema: { type: "object" },
            action: "inspect_files",
            declaredEffects: [],
            annotations: { readOnlyHint: true },
          },
          {
            name: "delete_file",
            description: "Delete a file.",
            inputSchema: { type: "object" },
            action: "delete_file",
            declaredEffects: ["delete_file"],
            annotations: { readOnlyHint: false },
          },
        ],
        boundaries: [],
      },
    }),
    [evidence("inspect_files", [])],
    { executionComplete: true },
  );

  const excess = result.gaps.find((gap) => gap.rule === "excess-agency");
  assert.equal(excess?.status, "warning");
  assert.match(excess?.observed?.join(" ") ?? "", /delete_file/);
});

test("the same core evaluates a domain-independent file fixture", () => {
  const result = runSemanticAudit(
    contract({
      intent: {
        goal: "Inspect files without deleting anything.",
        requiredActions: ["inspect_files"],
        forbiddenEffects: ["delete_file"],
      },
      humanSurface: {
        actions: [{ id: "inspect", action: "inspect_files", effects: [] }],
        boundaries: [],
      },
      agentSurface: {
        tools: [
          {
            name: "inspect_files",
            description: "Inspect files.",
            inputSchema: { type: "object" },
            action: "inspect_files",
            declaredEffects: [],
            annotations: { readOnlyHint: true },
          },
        ],
        boundaries: [],
      },
    }),
    [evidence("inspect_files", [{ effect: "delete_file", source: "state-diff" }])],
    { executionComplete: true },
  );

  assert.equal(result.statuses.intent, "fail");
  assert.equal(result.gaps.some((gap) => gap.rule === "forbidden-effect"), true);
  assert.equal(result.gaps.some((gap) => gap.rule === "declaration-observation-mismatch"), true);
  assert.equal(JSON.stringify(result).includes("subscription"), false);
});
