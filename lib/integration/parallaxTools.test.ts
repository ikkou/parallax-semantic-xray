import assert from "node:assert/strict";
import { test } from "node:test";
import { runSemanticAudit } from "../core/audit";
import type { DeveloperContract } from "../core/contract";
import type { ExecutionEvidence } from "../core/evidence";
import { getParallaxTools, type ParallaxToolContext } from "./parallaxTools";

const VALID_GOAL = "Inspect the catalog and recommend an option.";

function contract(): DeveloperContract {
  return {
    applicationId: "contract-fixture",
    intent: {
      goal: "Original goal must remain unchanged after invalid calls.",
      requiredActions: ["inspect_catalog"],
      forbiddenEffects: ["purchase_item"],
    },
    humanSurface: {
      actions: [{ id: "inspect", action: "inspect_catalog", effects: [], label: "Inspect catalog" }],
      boundaries: [],
    },
    agentSurface: {
      tools: [{
        name: "inspect_catalog",
        description: "Inspect the catalog.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        action: "inspect_catalog",
        declaredEffects: [],
        annotations: { readOnlyHint: true },
      }],
      boundaries: [],
    },
  };
}

function evidence(): ExecutionEvidence[] {
  return [{
    toolName: "inspect_catalog",
    technicalStatus: "success",
    statusCode: 200,
    observedEffects: [],
  }];
}

function context(onAudit?: ParallaxToolContext["onAudit"]): ParallaxToolContext {
  const developerContract = contract();
  const execution = evidence();
  return {
    applicationId: developerContract.applicationId,
    contract: developerContract,
    audit: runSemanticAudit(developerContract, execution, { executionComplete: true }),
    execution,
    executionComplete: true,
    onAudit,
  };
}

function tool(name: string, getContext: () => ParallaxToolContext) {
  const registered = getParallaxTools(getContext).find((candidate) => candidate.name === name);
  assert.ok(registered, `Expected ${name} to be registered.`);
  return registered;
}

test("goal tools require non-empty runtime input and expose minLength schemas", async () => {
  let auditCalls = 0;
  const current = context(() => {
    auditCalls += 1;
  });
  const runAudit = tool("run_parity_audit", () => current);
  const traceGoal = tool("trace_goal", () => current);

  const runSchema = runAudit.inputSchema.properties as Record<string, Record<string, unknown>>;
  const traceSchema = traceGoal.inputSchema.properties as Record<string, Record<string, unknown>>;
  assert.equal(runSchema.goal.minLength, 1);
  assert.equal(traceSchema.goal.minLength, 1);

  for (const input of [{ goal: "" }, { goal: "   " }, {}, { goal: null }]) {
    await assert.rejects(() => runAudit.execute(input), /INVALID_ARGUMENT: goal must be a non-empty string/);
    await assert.rejects(() => traceGoal.execute(input), /INVALID_ARGUMENT: goal must be a non-empty string/);
  }
  await assert.rejects(() => runAudit.execute(null as unknown as Record<string, unknown>), /INVALID_ARGUMENT: goal must be a non-empty string/);
  await assert.rejects(() => traceGoal.execute(null as unknown as Record<string, unknown>), /INVALID_ARGUMENT: goal must be a non-empty string/);

  assert.equal(auditCalls, 0);
  assert.equal(current.contract.intent.goal, "Original goal must remain unchanged after invalid calls.");
  assert.equal(current.audit.goal, "Original goal must remain unchanged after invalid calls.");
});

test("valid goal input is trimmed, participates in the audit, and preserves valid trace behavior", async () => {
  let auditedGoal = "";
  const current = context((result) => {
    auditedGoal = result.goal;
  });
  const runAudit = tool("run_parity_audit", () => current);
  const traceGoal = tool("trace_goal", () => current);

  const result = await runAudit.execute({ goal: `  ${VALID_GOAL}  ` });
  assert.equal((result as { goal: string }).goal, VALID_GOAL);
  assert.equal(auditedGoal, VALID_GOAL);

  const trace = await traceGoal.execute({ goal: `  ${VALID_GOAL}  ` });
  assert.ok(Array.isArray(trace));
  assert.equal((trace as Array<{ evidence?: Array<{ value: string }> }>)[0]?.evidence?.[0]?.value, VALID_GOAL);
});

test("explain_gap rejects empty IDs and returns an explicit not-found result", async () => {
  const current = context();
  const explainGap = tool("explain_gap", () => current);
  const schema = explainGap.inputSchema.properties as Record<string, Record<string, unknown>>;
  assert.equal(schema.gap_id.minLength, 1);

  for (const input of [{ gap_id: "" }, { gap_id: "   " }, {}, { gap_id: null }]) {
    await assert.rejects(() => explainGap.execute(input), /INVALID_ARGUMENT: gap_id must be a non-empty string/);
  }
  await assert.rejects(() => explainGap.execute(null as unknown as Record<string, unknown>), /INVALID_ARGUMENT: gap_id must be a non-empty string/);

  const missing = await explainGap.execute({ gap_id: "unknown-gap" });
  assert.deepEqual(missing, {
    error: "NOT_FOUND",
    message: "No semantic finding exists for gap_id unknown-gap.",
    gap_id: "unknown-gap",
  });
});

test("the five PARALLAX tools keep explicit descriptions and required fields", () => {
  const tools = getParallaxTools(() => context());
  assert.deepEqual(tools.map((candidate) => candidate.name), [
    "inspect_surface",
    "run_parity_audit",
    "trace_goal",
    "list_gaps",
    "explain_gap",
  ]);
  assert.ok(tools.every((candidate) => candidate.description.trim().length > 0));
  assert.deepEqual(tools.find((candidate) => candidate.name === "run_parity_audit")?.inputSchema.required, ["goal"]);
  assert.deepEqual(tools.find((candidate) => candidate.name === "trace_goal")?.inputSchema.required, ["goal"]);
  assert.deepEqual(tools.find((candidate) => candidate.name === "explain_gap")?.inputSchema.required, ["gap_id"]);
});
