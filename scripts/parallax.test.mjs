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
const cliPath = path.join(repositoryRoot, "scripts", "parallax.mjs");
const flightRecordPath = path.join(
  repositoryRoot,
  "docs",
  "validation",
  "2026-08-27-flight-search-human-approved.json",
);

function withTemporaryDirectory(callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "parallax-cli-test-"));
  try {
    return callback(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function writeJson(directory, name, value) {
  const filePath = path.join(directory, name);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return filePath;
}

function runCli(args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
}

function loadSublyFixtures() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "parallax-subly-fixture-"));
  try {
    const compiler = path.join(repositoryRoot, "node_modules", "typescript", "bin", "tsc");
    const sources = [
      "lib/core/contract.ts",
      "lib/core/evidence.ts",
      "lib/playground/subly/contract.ts",
      "lib/playground/subly/evidence.ts",
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
        ...sources,
      ],
      { cwd: repositoryRoot, encoding: "utf8" },
    );
    assert.equal(compile.status, 0, compile.stderr || compile.stdout);

    const contractModule = require(path.join(directory, "lib", "playground", "subly", "contract.js"));
    const evidenceModule = require(path.join(directory, "lib", "playground", "subly", "evidence.js"));
    return {
      broken: {
        contract: contractModule.getSublyContract("broken"),
        evidence: evidenceModule.getSublyScenarioEvidence("broken"),
      },
      fixed: {
        contract: contractModule.getSublyContract("fixed"),
        evidence: evidenceModule.getSublyScenarioEvidence("fixed"),
      },
    };
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

const sublyFixtures = loadSublyFixtures();
const flightRecord = JSON.parse(fs.readFileSync(flightRecordPath, "utf8"));
const flightFixture = {
  contract: flightRecord.developerContract,
  evidence: flightRecord.executionEvidence,
};

function runCheck(directory, name, fixture, { executionComplete = true, json = true } = {}) {
  const contractPath = writeJson(directory, `${name}.contract.json`, fixture.contract);
  const evidencePath = writeJson(directory, `${name}.evidence.json`, fixture.evidence);
  const args = ["check", "--contract", contractPath, "--evidence", evidencePath];
  if (executionComplete) args.push("--execution-complete");
  if (json) args.push("--json");
  return runCli(args);
}

function parseJsonOutput(result) {
  assert.equal(result.stderr, "");
  assert.notEqual(result.stdout.trim(), "");
  return JSON.parse(result.stdout);
}

test("check preserves the Subly BROKEN/FIXED acceptance results", () => {
  withTemporaryDirectory((directory) => {
    const brokenRun = runCheck(directory, "broken", sublyFixtures.broken);
    const brokenAudit = parseJsonOutput(brokenRun);
    assert.equal(brokenRun.status, 1);
    assert.equal(brokenAudit.technicalStatus, "pass");
    assert.equal(brokenAudit.semanticStatus, "fail");
    assert.deepEqual(brokenAudit.path, ["inspect_plan", "compare_plans", "recommended_upgrade"]);

    const fixedRun = runCheck(directory, "fixed", sublyFixtures.fixed);
    const fixedAudit = parseJsonOutput(fixedRun);
    assert.equal(fixedRun.status, 0);
    assert.deepEqual(fixedAudit.statuses, { intent: "pass", parity: "pass", agency: "warning" });
    assert.equal(fixedAudit.semanticStatus, "warning");
    assert.deepEqual(fixedAudit.gaps.map((gap) => gap.rule), ["excess-agency"]);
  });
});

test("check returns PASS for the human-approved Flight Search fixture", () => {
  withTemporaryDirectory((directory) => {
    const result = runCheck(directory, "flight-search", flightFixture);
    const audit = parseJsonOutput(result);
    assert.equal(result.status, 0);
    assert.equal(audit.technicalStatus, "pass");
    assert.equal(audit.semanticStatus, "pass");
    assert.deepEqual(audit.gaps, []);
  });
});

test("check returns WARN for incomplete required-action evidence", () => {
  withTemporaryDirectory((directory) => {
    const incomplete = {
      contract: sublyFixtures.fixed.contract,
      evidence: sublyFixtures.fixed.evidence.slice(0, 1),
    };
    const result = runCheck(directory, "incomplete", incomplete, { executionComplete: false });
    const audit = parseJsonOutput(result);
    assert.equal(result.status, 0);
    assert.equal(audit.semanticStatus, "warning");
    assert.ok(audit.gaps.some((gap) => gap.rule === "missing-required-action"));
  });
});

test("check rejects invalid JSON and invalid schema shapes with exit code 2", () => {
  withTemporaryDirectory((directory) => {
    const invalidJsonPath = path.join(directory, "invalid.json");
    const evidencePath = writeJson(directory, "evidence.json", []);
    fs.writeFileSync(invalidJsonPath, "{\n", "utf8");
    const invalidJson = runCli([
      "check",
      "--contract", invalidJsonPath,
      "--evidence", evidencePath,
      "--json",
    ]);
    assert.equal(invalidJson.status, 2);
    assert.equal(invalidJson.stdout, "");
    assert.match(invalidJson.stderr, /could not parse contract as JSON/);

    const missingContractPath = writeJson(directory, "missing.contract.json", {});
    const missingContract = runCli([
      "check",
      "--contract", missingContractPath,
      "--evidence", evidencePath,
      "--json",
    ]);
    assert.equal(missingContract.status, 2);
    assert.match(missingContract.stderr, /contract\.applicationId/);

    const invalidEvidencePath = writeJson(directory, "invalid.evidence.json", [{}]);
    const invalidEvidence = runCli([
      "check",
      "--contract", writeJson(directory, "valid.contract.json", flightFixture.contract),
      "--evidence", invalidEvidencePath,
      "--json",
    ]);
    assert.equal(invalidEvidence.status, 2);
    assert.match(invalidEvidence.stderr, /evidence\[0\]\.toolName/);
  });
});

test("check is deterministic and keeps JSON-only stdout", () => {
  withTemporaryDirectory((directory) => {
    const first = runCheck(directory, "flight-first", flightFixture);
    const second = runCheck(directory, "flight-second", flightFixture);
    assert.equal(first.status, 0);
    assert.equal(second.status, 0);
    assert.equal(first.stderr, "");
    assert.equal(second.stderr, "");
    assert.equal(first.stdout, second.stdout);
    assert.doesNotThrow(() => JSON.parse(first.stdout));
    assert.match(first.stdout, /^\s*\{/);
  });
});

test("check human output reports the computed status without a JSON banner", () => {
  withTemporaryDirectory((directory) => {
    const result = runCheck(directory, "human", flightFixture, { json: false });
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.match(result.stdout, /PARALLAX semantic audit/);
    assert.match(result.stdout, /Technical Result: PASS/);
    assert.match(result.stdout, /Semantic Result: PASS/);
  });
});

test("diff reports the expected Subly semantic transition", () => {
  withTemporaryDirectory((directory) => {
    const brokenRun = runCheck(directory, "broken", sublyFixtures.broken);
    const fixedRun = runCheck(directory, "fixed", sublyFixtures.fixed);
    const brokenPath = writeJson(directory, "broken.audit.json", JSON.parse(brokenRun.stdout));
    const fixedPath = writeJson(directory, "fixed.audit.json", JSON.parse(fixedRun.stdout));
    const result = runCli(["diff", brokenPath, fixedPath, "--json"]);
    const diff = parseJsonOutput(result);

    assert.equal(result.status, 0);
    assert.equal(diff.before.semanticStatus, "fail");
    assert.equal(diff.after.semanticStatus, "warning");
    assert.deepEqual(
      diff.findings.resolved.map((finding) => finding.rule),
      ["forbidden-effect", "missing-confirmation-boundary", "semantic-overloading"],
    );
    assert.deepEqual(diff.findings.remaining.map((finding) => finding.rule), ["excess-agency"]);
    assert.deepEqual(diff.observedPath.before, ["inspect_plan", "compare_plans", "recommended_upgrade"]);
    assert.deepEqual(diff.observedPath.after, ["inspect_plan", "compare_plans", "recommend_plan"]);
    assert.deepEqual(
      diff.observedEffects.removed.map((effect) => effect.effect),
      ["change_subscription", "charge_payment"],
    );
  });
});

test("diff rejects incompatible application or goal inputs with exit code 2", () => {
  withTemporaryDirectory((directory) => {
    const audit = JSON.parse(runCheck(directory, "flight", flightFixture).stdout);
    const differentApplication = { ...audit, applicationId: "another-application" };
    const differentGoal = { ...audit, goal: "A different goal" };
    const auditPath = writeJson(directory, "audit.json", audit);
    const applicationPath = writeJson(directory, "different-application.json", differentApplication);
    const goalPath = writeJson(directory, "different-goal.json", differentGoal);

    const applicationResult = runCli(["diff", auditPath, applicationPath, "--json"]);
    assert.equal(applicationResult.status, 2);
    assert.equal(applicationResult.stdout, "");
    assert.match(applicationResult.stderr, /matching applicationId/);

    const goalResult = runCli(["diff", auditPath, goalPath, "--json"]);
    assert.equal(goalResult.status, 2);
    assert.equal(goalResult.stdout, "");
    assert.match(goalResult.stderr, /matching goal/);
  });
});

test("diff rejects a result that is missing required AuditResult fields", () => {
  withTemporaryDirectory((directory) => {
    const audit = JSON.parse(runCheck(directory, "flight", flightFixture).stdout);
    delete audit.execution;
    const beforePath = writeJson(directory, "before.json", audit);
    const afterPath = writeJson(directory, "after.json", JSON.parse(runCheck(directory, "flight-2", flightFixture).stdout));
    const result = runCli(["diff", beforePath, afterPath, "--json"]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /before audit\.execution/);
  });
});
