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

function withTemporaryDirectory(callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "parallax-cli-v2-test-"));
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

function loadV2Fixtures() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "parallax-v2-fixtures-"));
  try {
    const compiler = path.join(repositoryRoot, "node_modules", "typescript", "bin", "tsc");
    const v2Sources = fs.readdirSync(path.join(repositoryRoot, "lib", "core", "v2"))
      .filter((fileName) => fileName.endsWith(".ts") && !fileName.endsWith(".test.ts"))
      .sort()
      .map((fileName) => path.join("lib", "core", "v2", fileName));
    const sources = [
      "lib/core/contract.ts",
      "lib/core/evidence.ts",
      "lib/core/result.ts",
      ...v2Sources,
      "lib/playground/subly/contract.ts",
      "lib/playground/subly/evidence.ts",
      "lib/validation/v2/fixtures.ts",
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
        "--resolveJsonModule",
        "--noEmitOnError",
        "--rootDir", ".",
        "--outDir", directory,
        ...sources,
      ],
      { cwd: repositoryRoot, encoding: "utf8" },
    );
    assert.equal(compile.status, 0, compile.stderr || compile.stdout);
    const module = require(path.join(directory, "lib", "validation", "v2", "fixtures.js"));
    return module.V2_FIXTURES;
  } finally {
    // The compiled module is loaded before the directory is removed; callers receive plain data.
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

const fixtures = loadV2Fixtures();
const byRunId = new Map(fixtures.map((fixture) => [fixture.evidence.runId, fixture]));

function runCheck(directory, name, fixture, { json = true, executionComplete = false } = {}) {
  const contractPath = writeJson(directory, `${name}.contract.json`, fixture.contract);
  const evidencePath = writeJson(directory, `${name}.evidence.json`, fixture.evidence);
  const args = ["check", "--contract", contractPath, "--evidence", evidencePath, "--v2"];
  if (executionComplete) args.push("--execution-complete");
  if (json) args.push("--json");
  return runCli(args);
}

function parseJsonOutput(result) {
  assert.equal(result.stderr, "");
  assert.notEqual(result.stdout.trim(), "");
  return JSON.parse(result.stdout);
}

test("v2 corpus preserves the required Subly, Flight, Order, and boundary outcomes", () => {
  withTemporaryDirectory((directory) => {
    const brokenRun = runCheck(directory, "subly-broken", byRunId.get("subly-broken-v2"));
    const broken = parseJsonOutput(brokenRun);
    assert.equal(brokenRun.status, 1);
    assert.equal(broken.technicalStatus, "pass");
    assert.equal(broken.semanticStatus, "fail");
    assert.deepEqual(broken.path, ["inspect_plan", "compare_plans", "recommended_upgrade"]);
    assert.ok(broken.gaps.some((gap) => gap.rule === "forbidden-effect"));
    assert.ok(broken.gaps.some((gap) => gap.rule === "missing-confirmation-boundary"));
    assert.ok(broken.gaps.some((gap) => gap.rule === "semantic-overloading"));
    assert.match(broken.steps.find((step) => step.type === "execution-result").detail, /HTTP 200/);

    const fixedRun = runCheck(directory, "subly-fixed", byRunId.get("subly-fixed-v2"));
    const fixed = parseJsonOutput(fixedRun);
    assert.equal(fixedRun.status, 0);
    assert.deepEqual(fixed.statuses, { intent: "pass", parity: "pass", agency: "warning" });
    assert.equal(fixed.semanticStatus, "warning");
    assert.deepEqual(fixed.gaps.map((gap) => gap.rule), ["excess-agency"]);

    const flightRun = runCheck(directory, "flight", byRunId.get("flight-search-human-approved-v2"));
    const flight = parseJsonOutput(flightRun);
    assert.equal(flightRun.status, 0);
    assert.deepEqual(flight.statuses, { intent: "pass", parity: "pass", agency: "pass" });
    assert.equal(flight.semanticStatus, "pass");
    assert.deepEqual(flight.gaps, []);

    const orderRun = runCheck(directory, "order", byRunId.get("order-tracking-human-approved-v2"));
    const order = parseJsonOutput(orderRun);
    assert.equal(orderRun.status, 0);
    assert.equal(order.semanticStatus, "pass");
    assert.deepEqual(order.gaps, []);
  });
});

test("v2 Tagboard accepted and rejected paths are distinct while both remain technical PASS", () => {
  withTemporaryDirectory((directory) => {
    const acceptedRun = runCheck(directory, "accepted", byRunId.get("tagboard-allow-v2"));
    const accepted = parseJsonOutput(acceptedRun);
    const rejectedRun = runCheck(directory, "rejected", byRunId.get("tagboard-reject-v2"));
    const rejected = parseJsonOutput(rejectedRun);
    assert.equal(acceptedRun.status, 0);
    assert.equal(rejectedRun.status, 0);
    assert.equal(accepted.technicalStatus, "pass");
    assert.equal(rejected.technicalStatus, "pass");
    assert.deepEqual(accepted.policyOutcomes.map((item) => item.decision), ["allow"]);
    assert.deepEqual(rejected.policyOutcomes.map((item) => item.decision), ["reject"]);
    assert.deepEqual(accepted.effectOutcomes.map((item) => item.outcome), ["occurred"]);
    assert.deepEqual(rejected.effectOutcomes.map((item) => item.outcome), ["prevented"]);
    assert.deepEqual(rejected.gaps, []);
  });
});

test("v2 Kurio, Mabel, and Archive retain scoped boundary, client, and complementary semantics", () => {
  withTemporaryDirectory((directory) => {
    const kurio = parseJsonOutput(runCheck(directory, "kurio", byRunId.get("kurio-live-reaudit-v2")));
    assert.equal(kurio.technicalStatus, "pass");
    assert.equal(kurio.semanticStatus, "warning");
    assert.equal(kurio.gaps.find((gap) => gap.rule === "missing-confirmation-boundary")?.qualification, "CONTRACT-LEVEL FINDING / CLIENT-RUNTIME UNRESOLVED");

    const mabel = parseJsonOutput(runCheck(directory, "mabel", byRunId.get("mabel-live-observation-v2")));
    assert.equal(mabel.technicalStatus, "pass");
    assert.equal(mabel.semanticStatus, "warning");
    assert.equal(mabel.boundaryEvidence[0].origin, "client-runtime");
    assert.equal(mabel.gaps.find((gap) => gap.rule === "missing-confirmation-boundary")?.status, "warning");

    const archive = parseJsonOutput(runCheck(directory, "archive", byRunId.get("archive-case-192-a-live-v2")));
    assert.equal(archive.status, undefined);
    assert.equal(archive.semanticStatus, "pass");
    assert.equal(archive.matrix.find((row) => row.relation === "COMPLEMENTARY")?.alignment, "Aligned");
    assert.deepEqual(archive.gaps, []);
  });
});

test("v2 check uses stable exit codes, JSON-only stdout, and deterministic output", () => {
  withTemporaryDirectory((directory) => {
    const first = runCheck(directory, "first", byRunId.get("tagboard-allow-v2"));
    const second = runCheck(directory, "second", byRunId.get("tagboard-allow-v2"));
    assert.equal(first.status, 0);
    assert.equal(second.status, 0);
    assert.equal(first.stderr, "");
    assert.equal(second.stderr, "");
    assert.equal(first.stdout, second.stdout);
    assert.doesNotThrow(() => JSON.parse(first.stdout));
    assert.match(first.stdout, /^\s*\{/);
  });
});

test("v2 check returns exit 2 for invalid schema, missing correlation, and v1-only flags", () => {
  withTemporaryDirectory((directory) => {
    const invalidContract = writeJson(directory, "invalid.contract.json", { version: 2, applicationId: "bad" });
    const validEvidence = writeJson(directory, "valid.evidence.json", byRunId.get("tagboard-allow-v2").evidence);
    const invalidContractRun = runCli(["check", "--contract", invalidContract, "--evidence", validEvidence, "--v2", "--json"]);
    assert.equal(invalidContractRun.status, 2);
    assert.equal(invalidContractRun.stdout, "");
    assert.match(invalidContractRun.stderr, /contract\.intent/);

    const invalidEvidence = structuredClone(byRunId.get("tagboard-allow-v2").evidence);
    invalidEvidence.entries[0].policyEvidence.invocationId = "missing-invocation";
    const invalidEvidencePath = writeJson(directory, "invalid.evidence.json", invalidEvidence);
    const validContractPath = writeJson(directory, "valid.contract.json", byRunId.get("tagboard-allow-v2").contract);
    const invalidEvidenceRun = runCli(["check", "--contract", validContractPath, "--evidence", invalidEvidencePath, "--v2", "--json"]);
    assert.equal(invalidEvidenceRun.status, 2);
    assert.equal(invalidEvidenceRun.stdout, "");
    assert.match(invalidEvidenceRun.stderr, /invocationId/);

    const flagRun = runCli(["check", "--contract", validContractPath, "--evidence", validEvidence, "--v2", "--execution-complete", "--json"]);
    assert.equal(flagRun.status, 2);
    assert.equal(flagRun.stdout, "");
  });
});

test("v2 human output never prints HTTP 200 without status-code evidence", () => {
  withTemporaryDirectory((directory) => {
    const fixture = structuredClone(byRunId.get("tagboard-allow-v2"));
    fixture.evidence.entries[0].statusCode = undefined;
    const contractPath = writeJson(directory, "contract.json", fixture.contract);
    const evidencePath = writeJson(directory, "evidence.json", fixture.evidence);
    const result = runCli(["check", "--contract", contractPath, "--evidence", evidencePath, "--v2"]);
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.doesNotMatch(result.stdout, /HTTP 200/);
    assert.match(result.stdout, /STATUS CODE UNOBSERVED/);
  });
});

test("v2 diff resolves Subly semantic findings and preserves removed mutation evidence", () => {
  withTemporaryDirectory((directory) => {
    const broken = parseJsonOutput(runCheck(directory, "broken", byRunId.get("subly-broken-v2")));
    const fixed = parseJsonOutput(runCheck(directory, "fixed", byRunId.get("subly-fixed-v2")));
    const brokenPath = writeJson(directory, "broken.audit.json", broken);
    const fixedPath = writeJson(directory, "fixed.audit.json", fixed);
    const result = runCli(["diff", brokenPath, fixedPath, "--json"]);
    const diff = parseJsonOutput(result);
    assert.equal(result.status, 0);
    assert.deepEqual(diff.modelVersions, { before: 2, after: 2 });
    assert.deepEqual(
      diff.findings.resolved.map((finding) => finding.rule),
      ["forbidden-effect", "missing-confirmation-boundary", "semantic-overloading"],
    );
    assert.deepEqual(diff.findings.remaining.map((finding) => finding.rule), ["excess-agency"]);
    assert.deepEqual(diff.observedEffects.removed.map((effect) => effect.effect), ["change_subscription", "charge_payment"]);
  });
});

test("v1 to v2 diff is allowed only for matching application and goal", () => {
  withTemporaryDirectory((directory) => {
    const fixture = byRunId.get("subly-fixed-v2");
    const v1Contract = structuredClone(fixture.contract);
    delete v1Contract.version;
    for (const tool of v1Contract.agentSurface.tools) delete tool.effectClaims;
    const v1Evidence = fixture.evidence.entries.map((entry) => {
      const copy = structuredClone(entry);
      delete copy.effectOutcomes;
      delete copy.invocationId;
      delete copy.origin;
      delete copy.boundaryEvidence;
      delete copy.policyEvidence;
      return copy;
    });
    const v1Run = runCli([
      "check",
      "--contract", writeJson(directory, "v1.contract.json", v1Contract),
      "--evidence", writeJson(directory, "v1.evidence.json", v1Evidence),
      "--execution-complete",
      "--json",
    ]);
    const v1Audit = parseJsonOutput(v1Run);
    const v2Audit = parseJsonOutput(runCheck(directory, "v2", fixture));
    const diff = runCli([
      "diff",
      writeJson(directory, "before.audit.json", v1Audit),
      writeJson(directory, "after.audit.json", v2Audit),
      "--json",
    ]);
    const parsed = parseJsonOutput(diff);
    assert.equal(diff.status, 0);
    assert.deepEqual(parsed.modelVersions, { before: 1, after: 2 });
    assert.ok(parsed.typedEvidence.effectOutcomes.added.length >= 0);

    const different = structuredClone(v2Audit);
    different.applicationId = "different-app";
    const incompatible = runCli(["diff", writeJson(directory, "a.json", v2Audit), writeJson(directory, "b.json", different), "--json"]);
    assert.equal(incompatible.status, 2);
    assert.equal(incompatible.stdout, "");
  });
});

test("the CLI has no browser, DOM, WebMCP, or playground imports", () => {
  const source = fs.readFileSync(cliPath, "utf8");
  assert.doesNotMatch(source, /document\.modelContext|navigator\.modelContext|from ["']react|playwright|WebMCP/);
});
