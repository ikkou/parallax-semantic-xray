import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";

const require = createRequire(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadIntegrationModules() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "parallax-integration-test-"));
  try {
    const compiler = path.join(repositoryRoot, "node_modules", "typescript", "bin", "tsc");
    const sourceFiles = [
      ...fs.readdirSync(path.join(repositoryRoot, "lib", "core"))
        .filter((fileName) => fileName.endsWith(".ts") && !fileName.endsWith(".test.ts"))
        .sort()
        .map((fileName) => path.join("lib", "core", fileName)),
      ...fs.readdirSync(path.join(repositoryRoot, "lib", "core", "v2"))
        .filter((fileName) => fileName.endsWith(".ts") && !fileName.endsWith(".test.ts"))
        .sort()
        .map((fileName) => path.join("lib", "core", "v2", fileName)),
      "lib/integration/versionedAudit.ts",
      "lib/integration/xray.ts",
      "lib/integration/parallaxTools.ts",
      "lib/integration/webmcp/types.ts",
    ];
    const compile = spawnSync(
      process.execPath,
      [
        compiler,
        "--module", "commonjs",
        "--target", "es2020",
        "--moduleResolution", "node",
        "--esModuleInterop",
        "--strict",
        "--skipLibCheck",
        "--noEmitOnError",
        "--rootDir", ".",
        "--outDir", directory,
        ...sourceFiles,
      ],
      { cwd: repositoryRoot, encoding: "utf8" },
    );
    assert.equal(compile.status, 0, compile.stderr || compile.stdout);
    return {
      audit: require(path.join(directory, "lib", "integration", "versionedAudit.js")),
      xray: require(path.join(directory, "lib", "integration", "xray.js")),
      tools: require(path.join(directory, "lib", "integration", "parallaxTools.js")),
    };
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

const modules = loadIntegrationModules();

function readOnlyFixture() {
  return {
    version: 2,
    applicationId: "integration-fixture",
    intent: {
      goal: "Inspect the catalog and recommend an option.",
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

function readOnlyEvidence() {
  return {
    version: 2,
    runId: "integration-read-only-v2",
    mode: "live-execution",
    completeness: "complete",
    applicationId: "integration-fixture",
    entries: [{
      toolName: "inspect_catalog",
      technicalStatus: "success",
      statusCode: 200,
      observedEffects: [],
      effectOutcomes: [],
    }],
  };
}

test("versioned audit and X-Ray projection preserve typed v2 outcomes", () => {
  const contract = readOnlyFixture();
  const evidence = readOnlyEvidence();
  const result = modules.audit.runVersionedAudit({ modelVersion: 2, contract, evidence });
  const view = modules.xray.projectAudit(result);

  assert.equal(result.modelVersion, 2);
  assert.equal(view.modelVersion, 2);
  assert.equal(view.technicalStatus, "pass");
  assert.equal(view.semanticStatus, "pass");
  assert.equal(view.execution[0].statusCode, 200);
  assert.deepEqual(view.policyOutcomes, []);
  assert.deepEqual(view.effectOutcomes, []);
  assert.deepEqual(view.boundaryEvidence, []);
});

test("goal input participates in the computed result and v1 remains an explicit fallback", () => {
  const contract = readOnlyFixture();
  const evidence = readOnlyEvidence();
  const goal = "Inspect the catalog for a read-only recommendation.";
  const v2 = modules.audit.runVersionedAudit({ modelVersion: 2, contract, evidence, goal });
  assert.equal(v2.goal, goal);
  assert.equal(v2.steps[0].evidence[0].value, goal);

  const v1Contract = structuredClone(contract);
  delete v1Contract.version;
  const v1Evidence = evidence.entries.map((entry) => {
    const copy = structuredClone(entry);
    delete copy.effectOutcomes;
    return copy;
  });
  const v1 = modules.audit.runVersionedAudit({
    modelVersion: 1,
    contract: v1Contract,
    execution: v1Evidence,
    executionComplete: true,
    goal,
  });
  const view = modules.xray.projectAudit(v1);
  assert.equal(view.modelVersion, 1);
  assert.equal(view.goal, goal);
  assert.deepEqual(view.policyOutcomes, []);
});

test("PARALLAX meta tools return the selected model result and expose evidence mode", async () => {
  const contract = readOnlyFixture();
  const evidence = readOnlyEvidence();
  const audit = modules.audit.runVersionedAudit({ modelVersion: 2, contract, evidence });
  const observedAudits = [];
  const context = {
    modelVersion: 2,
    applicationId: contract.applicationId,
    contract,
    audit,
    execution: evidence,
    onAudit: (nextAudit) => observedAudits.push(nextAudit),
  };
  const registered = modules.tools.getParallaxTools(() => context);
  assert.deepEqual(registered.map((tool) => tool.name), [
    "inspect_surface",
    "run_parity_audit",
    "trace_goal",
    "list_gaps",
    "explain_gap",
  ]);

  const inspect = await registered[0].execute({});
  assert.deepEqual(inspect.evidence, { mode: "live-execution", completeness: "complete", entry_count: 1 });
  const result = await registered[1].execute({ goal: "Inspect the catalog and recommend an option." });
  assert.equal(result.modelVersion, 2);
  assert.equal(result.goal, "Inspect the catalog and recommend an option.");
  assert.equal(observedAudits.length, 1);
});
