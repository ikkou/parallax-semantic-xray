#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const coreDirectory = path.join(projectRoot, "lib", "core");
const v2CoreDirectory = path.join(coreDirectory, "v2");

const stageStatuses = new Set(["pass", "warning", "fail"]);
const evidenceSources = new Set([
  "runtime-instrumentation",
  "state-diff",
  "tool-result",
  "developer-assertion",
]);
const boundaryTypes = new Set(["review", "confirmation"]);
const lenses = new Set(["intent", "parity", "agency"]);
const gapSeverities = new Set(["low", "medium", "high"]);
const v2FindingRules = new Set([
  "forbidden-effect",
  "missing-required-action",
  "missing-required-effect",
  "declaration-observation-mismatch",
  "missing-confirmation-boundary",
  "semantic-overloading",
  "excess-agency",
]);
const v2FindingScopes = new Set(["contract", "exposed", "effective-path", "runtime"]);

class CliError extends Error {}

function fail(message) {
  throw new CliError(message);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value, label) {
  if (!isRecord(value)) fail(`${label} must be an object`);
  return value;
}

function requireString(value, label, { nonEmpty = true } = {}) {
  if (typeof value !== "string" || (nonEmpty && value.length === 0)) {
    fail(`${label} must be a${nonEmpty ? " non-empty" : ""} string`);
  }
  return value;
}

function requireStringArray(value, label) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    fail(`${label} must be an array of strings`);
  }
  return value;
}

function requireOptionalStringArray(value, label) {
  if (value !== undefined) requireStringArray(value, label);
}

function requireOptionalString(value, label) {
  if (value !== undefined) requireString(value, label, { nonEmpty: false });
}

function validateAnnotations(value, label) {
  if (value === undefined) return;
  const annotations = requireRecord(value, label);
  if (annotations.readOnlyHint !== undefined && typeof annotations.readOnlyHint !== "boolean") {
    fail(`${label}.readOnlyHint must be a boolean`);
  }
}

function validateHumanAction(value, index) {
  const action = requireRecord(value, `humanSurface.actions[${index}]`);
  requireString(action.id, `humanSurface.actions[${index}].id`);
  requireString(action.action, `humanSurface.actions[${index}].action`);
  requireStringArray(action.effects, `humanSurface.actions[${index}].effects`);
  requireOptionalStringArray(action.boundaryIds, `humanSurface.actions[${index}].boundaryIds`);
  requireOptionalString(action.label, `humanSurface.actions[${index}].label`);
}

function validateBoundary(value, label) {
  const boundary = requireRecord(value, label);
  requireString(boundary.id, `${label}.id`);
  requireStringArray(boundary.protectsEffects, `${label}.protectsEffects`);
  if (!boundaryTypes.has(boundary.type)) fail(`${label}.type must be review or confirmation`);
  requireOptionalString(boundary.label, `${label}.label`);
}

function validateTool(value, index) {
  const label = `agentSurface.tools[${index}]`;
  const tool = requireRecord(value, label);
  requireString(tool.name, `${label}.name`);
  requireString(tool.description, `${label}.description`, { nonEmpty: false });
  requireRecord(tool.inputSchema, `${label}.inputSchema`);
  requireString(tool.action, `${label}.action`);
  requireStringArray(tool.declaredEffects, `${label}.declaredEffects`);
  requireOptionalStringArray(tool.boundaryIds, `${label}.boundaryIds`);
  validateAnnotations(tool.annotations, `${label}.annotations`);
  requireOptionalString(tool.label, `${label}.label`);
}

function validateContract(value) {
  const contract = requireRecord(value, "contract");
  requireString(contract.applicationId, "contract.applicationId");

  const intent = requireRecord(contract.intent, "contract.intent");
  requireString(intent.goal, "contract.intent.goal");
  requireOptionalStringArray(intent.requiredActions, "contract.intent.requiredActions");
  requireStringArray(intent.forbiddenEffects, "contract.intent.forbiddenEffects");

  const humanSurface = requireRecord(contract.humanSurface, "contract.humanSurface");
  if (!Array.isArray(humanSurface.actions)) fail("contract.humanSurface.actions must be an array");
  humanSurface.actions.forEach(validateHumanAction);
  if (!Array.isArray(humanSurface.boundaries)) fail("contract.humanSurface.boundaries must be an array");
  humanSurface.boundaries.forEach((boundary, index) =>
    validateBoundary(boundary, `humanSurface.boundaries[${index}]`),
  );

  const agentSurface = requireRecord(contract.agentSurface, "contract.agentSurface");
  if (!Array.isArray(agentSurface.tools)) fail("contract.agentSurface.tools must be an array");
  agentSurface.tools.forEach(validateTool);
  if (!Array.isArray(agentSurface.boundaries)) fail("contract.agentSurface.boundaries must be an array");
  agentSurface.boundaries.forEach((boundary, index) =>
    validateBoundary(boundary, `agentSurface.boundaries[${index}]`),
  );

  return contract;
}

function validateObservedEffect(value, label) {
  const observed = requireRecord(value, label);
  requireString(observed.effect, `${label}.effect`);
  if (!evidenceSources.has(observed.source)) {
    fail(`${label}.source is not a supported evidence source`);
  }
  requireOptionalString(observed.detail, `${label}.detail`);
}

function validateEvidence(value, label = "evidence") {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  value.forEach((entry, index) => {
    const evidence = requireRecord(entry, `${label}[${index}]`);
    requireString(evidence.toolName, `${label}[${index}].toolName`);
    if (evidence.technicalStatus !== "success" && evidence.technicalStatus !== "error") {
      fail(`${label}[${index}].technicalStatus must be success or error`);
    }
    if (evidence.statusCode !== undefined &&
        (typeof evidence.statusCode !== "number" || !Number.isFinite(evidence.statusCode))) {
      fail(`${label}[${index}].statusCode must be a finite number`);
    }
    if (!Array.isArray(evidence.observedEffects)) {
      fail(`${label}[${index}].observedEffects must be an array`);
    }
    evidence.observedEffects.forEach((observed, observedIndex) =>
      validateObservedEffect(observed, `${label}[${index}].observedEffects[${observedIndex}]`),
    );
    requireOptionalString(evidence.resultSummary, `${label}[${index}].resultSummary`);
  });
  return value;
}

function validateStageStatus(value, label) {
  if (!stageStatuses.has(value)) fail(`${label} must be pass, warning, or fail`);
}

function validateGap(value, index) {
  const label = `audit.gaps[${index}]`;
  const gap = requireRecord(value, label);
  requireString(gap.id, `${label}.id`);
  if (!lenses.has(gap.type)) fail(`${label}.type is not a supported lens`);
  requireString(gap.rule, `${label}.rule`);
  if (!gapSeverities.has(gap.severity)) fail(`${label}.severity is invalid`);
  validateStageStatus(gap.status, `${label}.status`);
  requireString(gap.title, `${label}.title`);
  requireString(gap.explanation, `${label}.explanation`);
  requireStringArray(gap.evidence, `${label}.evidence`);
  requireOptionalStringArray(gap.declared, `${label}.declared`);
  requireOptionalStringArray(gap.observed, `${label}.observed`);
}

function validateAuditResult(value, label = "audit") {
  const audit = requireRecord(value, label);
  requireString(audit.applicationId, `${label}.applicationId`);
  requireString(audit.goal, `${label}.goal`, { nonEmpty: false });

  const statuses = requireRecord(audit.statuses, `${label}.statuses`);
  for (const lens of lenses) validateStageStatus(statuses[lens], `${label}.statuses.${lens}`);
  validateStageStatus(audit.technicalStatus, `${label}.technicalStatus`);
  validateStageStatus(audit.semanticStatus, `${label}.semanticStatus`);

  if (!Array.isArray(audit.steps)) fail(`${label}.steps must be an array`);
  if (!Array.isArray(audit.recommendations)) fail(`${label}.recommendations must be an array`);
  if (!Array.isArray(audit.matrix)) fail(`${label}.matrix must be an array`);
  requireStringArray(audit.path, `${label}.path`);
  validateEvidence(audit.execution, `${label}.execution`);
  if (!Array.isArray(audit.gaps)) fail(`${label}.gaps must be an array`);
  audit.gaps.forEach(validateGap);
  return audit;
}

function validateGapV2(value, index, label = "audit") {
  const gapLabel = `${label}.gaps[${index}]`;
  const gap = requireRecord(value, gapLabel);
  requireString(gap.id, `${gapLabel}.id`);
  if (!lenses.has(gap.type)) fail(`${gapLabel}.type is not a supported lens`);
  requireString(gap.rule, `${gapLabel}.rule`);
  if (!v2FindingRules.has(gap.rule)) fail(`${gapLabel}.rule is not a supported v2 finding rule`);
  if (!gapSeverities.has(gap.severity)) fail(`${gapLabel}.severity is invalid`);
  validateStageStatus(gap.status, `${gapLabel}.status`);
  requireString(gap.title, `${gapLabel}.title`);
  requireString(gap.explanation, `${gapLabel}.explanation`);
  requireStringArray(gap.evidence, `${gapLabel}.evidence`);
  requireOptionalStringArray(gap.declared, `${gapLabel}.declared`);
  requireOptionalStringArray(gap.observed, `${gapLabel}.observed`);
  requireOptionalString(gap.scope, `${gapLabel}.scope`);
  if (gap.scope !== undefined && !v2FindingScopes.has(gap.scope)) fail(`${gapLabel}.scope is invalid`);
  requireOptionalString(gap.qualification, `${gapLabel}.qualification`);
}

function validateAuditResultV2(value, core, label = "audit") {
  const audit = requireRecord(value, label);
  if (audit.modelVersion !== 2) fail(`${label}.modelVersion must be 2`);
  requireString(audit.runId, `${label}.runId`);
  requireString(audit.applicationId, `${label}.applicationId`);
  requireString(audit.goal, `${label}.goal`, { nonEmpty: false });
  const statuses = requireRecord(audit.statuses, `${label}.statuses`);
  for (const lens of lenses) validateStageStatus(statuses[lens], `${label}.statuses.${lens}`);
  validateStageStatus(audit.technicalStatus, `${label}.technicalStatus`);
  validateStageStatus(audit.semanticStatus, `${label}.semanticStatus`);
  if (!Array.isArray(audit.steps)) fail(`${label}.steps must be an array`);
  if (!Array.isArray(audit.recommendations)) fail(`${label}.recommendations must be an array`);
  if (!Array.isArray(audit.matrix)) fail(`${label}.matrix must be an array`);
  requireStringArray(audit.path, `${label}.path`);
  if (!Array.isArray(audit.gaps)) fail(`${label}.gaps must be an array`);
  audit.gaps.forEach((gap, index) => validateGapV2(gap, index, label));
  if (audit.evidenceMode !== "live-execution" && audit.evidenceMode !== "captured-fixture") {
    fail(`${label}.evidenceMode is invalid`);
  }
  if (!new Set(["complete", "partial", "unknown"]).has(audit.evidenceCompleteness)) {
    fail(`${label}.evidenceCompleteness is invalid`);
  }
  if (!Array.isArray(audit.execution)) fail(`${label}.execution must be an array`);
  try {
    core.validateEvidenceBundleV2({
      version: 2,
      runId: audit.runId,
      mode: audit.evidenceMode,
      completeness: audit.evidenceCompleteness,
      applicationId: audit.applicationId,
      entries: audit.execution,
    });
  } catch (error) {
    fail(`${label}.execution is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
  for (const field of ["policyOutcomes", "effectOutcomes", "boundaryEvidence", "surfaceRelations", "evidenceQualifiers"]) {
    if (!Array.isArray(audit[field])) fail(`${label}.${field} must be an array`);
  }
  return audit;
}

function readJson(filePath, label) {
  let contents;
  try {
    contents = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    fail(`could not read ${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
  try {
    return JSON.parse(contents);
  } catch (error) {
    fail(`could not parse ${label} as JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function resolveInputPath(value) {
  return path.resolve(process.cwd(), value);
}

function parseCheckArgs(args) {
  let contractPath;
  let evidencePath;
  let json = false;
  let executionComplete = false;
  let v2 = false;
  const positionals = [];

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--json") {
      if (json) fail("--json was provided more than once");
      json = true;
      continue;
    }
    if (argument === "--execution-complete") {
      if (executionComplete) fail("--execution-complete was provided more than once");
      executionComplete = true;
      continue;
    }
    if (argument === "--v2") {
      if (v2) fail("--v2 was provided more than once");
      v2 = true;
      continue;
    }
    if (argument === "--contract" || argument.startsWith("--contract=")) {
      if (contractPath !== undefined) fail("--contract was provided more than once");
      contractPath = argument === "--contract" ? args[++index] : argument.slice("--contract=".length);
      if (!contractPath) fail("--contract requires a file path");
      continue;
    }
    if (argument === "--evidence" || argument.startsWith("--evidence=")) {
      if (evidencePath !== undefined) fail("--evidence was provided more than once");
      evidencePath = argument === "--evidence" ? args[++index] : argument.slice("--evidence=".length);
      if (!evidencePath) fail("--evidence requires a file path");
      continue;
    }
    if (argument.startsWith("--")) fail(`unknown check option: ${argument}`);
    positionals.push(argument);
  }

  if (positionals.length > 0) fail("check does not accept positional arguments");
  if (contractPath === undefined) fail("check requires --contract");
  if (evidencePath === undefined) fail("check requires --evidence");
  return { contractPath: resolveInputPath(contractPath), evidencePath: resolveInputPath(evidencePath), json, executionComplete, v2 };
}

function parseDiffArgs(args) {
  let json = false;
  const positionals = [];

  for (const argument of args) {
    if (argument === "--json") {
      if (json) fail("--json was provided more than once");
      json = true;
      continue;
    }
    if (argument.startsWith("--")) fail(`unknown diff option: ${argument}`);
    positionals.push(argument);
  }

  if (positionals.length !== 2) fail("diff requires a before and after audit JSON file");
  return { beforePath: resolveInputPath(positionals[0]), afterPath: resolveInputPath(positionals[1]), json };
}

function compileCore() {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "parallax-cli-core-"));
  const cleanup = () => {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  };

  try {
    const compiler = path.join(projectRoot, "node_modules", "typescript", "bin", "tsc");
    if (!fs.existsSync(compiler)) fail("TypeScript compiler is required to run the local Core");

    const sourceFiles = fs.readdirSync(coreDirectory)
      .filter((fileName) => fileName.endsWith(".ts") && !fileName.endsWith(".test.ts"))
      .sort()
      .map((fileName) => path.join("lib", "core", fileName));

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
        "--outDir", temporaryDirectory,
        ...sourceFiles,
      ],
      { cwd: projectRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );

    if (compile.error || compile.status !== 0) {
      const details = [compile.stdout, compile.stderr].filter(Boolean).join("\n").trim();
      fail(`could not compile the frozen Core${details ? `:\n${details}` : ""}`);
    }

    const modulePath = path.join(temporaryDirectory, "lib", "core", "index.js");
    if (!fs.existsSync(modulePath)) fail("compiled Core entry point was not produced");
    const core = require(modulePath);
    if (typeof core.runSemanticAudit !== "function") fail("compiled Core does not export runSemanticAudit");
    return { core, cleanup };
  } catch (error) {
    cleanup();
    if (error instanceof CliError) throw error;
    fail(`could not load the frozen Core: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function compileCoreV2() {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "parallax-cli-core-v2-"));
  const cleanup = () => {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  };

  try {
    const compiler = path.join(projectRoot, "node_modules", "typescript", "bin", "tsc");
    if (!fs.existsSync(compiler)) fail("TypeScript compiler is required to run the local v2 Core");

    const sourceFiles = [
      path.join("lib", "core", "contract.ts"),
      path.join("lib", "core", "evidence.ts"),
      path.join("lib", "core", "result.ts"),
      ...fs.readdirSync(v2CoreDirectory)
        .filter((fileName) => fileName.endsWith(".ts") && !fileName.endsWith(".test.ts"))
        .sort()
        .map((fileName) => path.join("lib", "core", "v2", fileName)),
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
        "--outDir", temporaryDirectory,
        ...sourceFiles,
      ],
      { cwd: projectRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );

    if (compile.error || compile.status !== 0) {
      const details = [compile.stdout, compile.stderr].filter(Boolean).join("\n").trim();
      fail(`could not compile the v2 Core${details ? `:\n${details}` : ""}`);
    }

    const modulePath = path.join(temporaryDirectory, "lib", "core", "v2", "index.js");
    if (!fs.existsSync(modulePath)) fail("compiled v2 Core entry point was not produced");
    const core = require(modulePath);
    if (typeof core.runSemanticAuditV2 !== "function") fail("compiled v2 Core does not export runSemanticAuditV2");
    return { core, cleanup };
  } catch (error) {
    cleanup();
    if (error instanceof CliError) throw error;
    fail(`could not load the v2 Core: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function writeJsonOutput(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function statusLabel(status) {
  return { pass: "PASS", warning: "WARN", fail: "FAIL" }[status] ?? status;
}

function printHumanAudit(audit) {
  const lines = [
    "PARALLAX semantic audit",
    `Application: ${audit.applicationId}`,
    `Goal: ${audit.goal}`,
    "",
    `Technical Result: ${statusLabel(audit.technicalStatus)}`,
    `Semantic Result: ${statusLabel(audit.semanticStatus)}`,
    `Intent: ${statusLabel(audit.statuses.intent)}`,
    `Parity: ${statusLabel(audit.statuses.parity)}`,
    `Agency: ${statusLabel(audit.statuses.agency)}`,
    "",
    "Observed execution path:",
    ...(audit.path.length === 0 ? ["  (none)"] : audit.path.map((toolName) => `  - ${toolName}`)),
    "",
    "Semantic X-Ray:",
    ...audit.steps.map((step) => `  ${step.label}: ${step.detail}`),
    "",
    "Findings:",
  ];

  if (audit.gaps.length === 0) {
    lines.push("  (none)");
  } else {
    for (const gap of audit.gaps) {
      lines.push(`  - [${statusLabel(gap.status)}] ${gap.title} (${gap.rule})`);
      lines.push(`    ${gap.explanation}`);
      for (const evidence of gap.evidence) lines.push(`    evidence: ${evidence}`);
      for (const declared of gap.declared ?? []) lines.push(`    declared: ${declared}`);
      for (const observed of gap.observed ?? []) lines.push(`    observed: ${observed}`);
    }
  }

  lines.push("", "Recommendations:");
  if (audit.recommendations.length === 0) {
    lines.push("  (none)");
  } else {
    for (const recommendation of audit.recommendations) {
      lines.push(`  - [${recommendation.priority}] ${recommendation.title}: ${recommendation.detail}`);
    }
  }
  process.stdout.write(`${lines.join("\n")}\n`);
}

function printHumanAuditV2(audit) {
  const lines = [
    "PARALLAX semantic audit",
    `Model: v${audit.modelVersion}`,
    `Application: ${audit.applicationId}`,
    `Run: ${audit.runId}`,
    `Goal: ${audit.goal}`,
    `Evidence: ${audit.evidenceMode} / ${audit.evidenceCompleteness}`,
    "",
    `Technical Result: ${statusLabel(audit.technicalStatus)}`,
    `Semantic Result: ${statusLabel(audit.semanticStatus)}`,
    `Intent: ${statusLabel(audit.statuses.intent)}`,
    `Parity: ${statusLabel(audit.statuses.parity)}`,
    `Agency: ${statusLabel(audit.statuses.agency)}`,
    "",
    "Observed execution path:",
    ...(audit.path.length === 0 ? ["  (none)"] : audit.path.map((toolName) => `  - ${toolName}`)),
    "",
    "Policy outcomes:",
    ...(audit.policyOutcomes.length === 0
      ? ["  (none)"]
      : audit.policyOutcomes.map((outcome) => `  - ${outcome.toolName}: ${outcome.decision.toUpperCase()} [${outcome.source}]`)),
    "",
    "Effect outcomes:",
    ...(audit.effectOutcomes.length === 0
      ? ["  (none)"]
      : audit.effectOutcomes.map((outcome) => `  - ${outcome.toolName}: ${outcome.effect} ${outcome.outcome.toUpperCase()} [${outcome.source}]`)),
    "",
    "Semantic X-Ray:",
    ...audit.steps.map((step) => `  ${step.label}: ${step.detail}`),
    "",
    "Findings:",
  ];

  if (audit.gaps.length === 0) {
    lines.push("  (none)");
  } else {
    for (const gap of audit.gaps) {
      const scope = gap.scope === undefined ? "" : ` [${gap.scope}]`;
      lines.push(`  - [${statusLabel(gap.status)}] ${gap.title} (${gap.rule})${scope}`);
      lines.push(`    ${gap.explanation}`);
      if (gap.qualification !== undefined) lines.push(`    qualification: ${gap.qualification}`);
      for (const evidence of gap.evidence) lines.push(`    evidence: ${evidence}`);
      for (const declared of gap.declared ?? []) lines.push(`    declared: ${declared}`);
      for (const observed of gap.observed ?? []) lines.push(`    observed: ${observed}`);
    }
  }

  if (audit.evidenceQualifiers.length > 0) {
    lines.push("", "Evidence qualifiers:");
    for (const qualifier of audit.evidenceQualifiers) lines.push(`  - ${qualifier}`);
  }
  lines.push("", "Recommendations:");
  if (audit.recommendations.length === 0) {
    lines.push("  (none)");
  } else {
    for (const recommendation of audit.recommendations) {
      lines.push(`  - [${recommendation.priority}] ${recommendation.title}: ${recommendation.detail}`);
    }
  }
  process.stdout.write(`${lines.join("\n")}\n`);
}

function semanticExitCode(status) {
  return status === "fail" ? 1 : 0;
}

function runCheck(args) {
  const options = parseCheckArgs(args);
  const rawContract = readJson(options.contractPath, "contract");
  const rawEvidence = readJson(options.evidencePath, "evidence");
  const useV2 = options.v2 ||
    (isRecord(rawContract) && rawContract.version === 2) ||
    (isRecord(rawEvidence) && rawEvidence.version === 2);

  if (useV2) {
    if (options.executionComplete) fail("--execution-complete cannot be used with v2 evidence; set evidence.completeness");
    const loadedCore = compileCoreV2();
    let audit;
    try {
      const contract = loadedCore.core.validateDeveloperContractV2(rawContract);
      const evidence = loadedCore.core.validateEvidenceBundleV2(rawEvidence);
      audit = loadedCore.core.runSemanticAuditV2(contract, evidence);
    } finally {
      loadedCore.cleanup();
    }
    if (options.json) writeJsonOutput(audit);
    else printHumanAuditV2(audit);
    return semanticExitCode(audit.semanticStatus);
  }

  const contract = validateContract(rawContract);
  const evidence = validateEvidence(rawEvidence);
  const loadedCore = compileCore();
  let audit;
  try {
    audit = loadedCore.core.runSemanticAudit(contract, evidence, {
      executionComplete: options.executionComplete,
    });
  } finally {
    loadedCore.cleanup();
  }

  if (options.json) writeJsonOutput(audit);
  else printHumanAudit(audit);
  return semanticExitCode(audit.semanticStatus);
}

function findingKey(gap) {
  return `${gap.type}\u0000${gap.rule}`;
}

function summarizeFinding(gap) {
  return {
    type: gap.type,
    rule: gap.rule,
    severity: gap.severity,
    status: gap.status,
    title: gap.title,
    ...(gap.scope === undefined ? {} : { scope: gap.scope }),
    ...(gap.qualification === undefined ? {} : { qualification: gap.qualification }),
  };
}

function isV2Audit(value) {
  return isRecord(value) && value.modelVersion === 2;
}

function typedAuditRecords(audit, field) {
  return Array.isArray(audit[field]) ? audit[field] : [];
}

function diffRecords(before, after, key) {
  const beforeMap = new Map(before.map((record) => [key(record), record]));
  const afterMap = new Map(after.map((record) => [key(record), record]));
  const removed = [];
  const added = [];
  const remaining = [];

  for (const [recordKey, record] of beforeMap) {
    if (afterMap.has(recordKey)) remaining.push(afterMap.get(recordKey));
    else removed.push(record);
  }
  for (const [recordKey, record] of afterMap) {
    if (!beforeMap.has(recordKey)) added.push(record);
  }
  return { removed, added, remaining };
}

function buildTypedEvidenceDiff(before, after) {
  const policyKey = (record) => JSON.stringify([
    record.toolName,
    record.decision,
    record.source,
    record.invocationId ?? null,
    record.policyDecisionId ?? null,
  ]);
  const effectKey = (record) => JSON.stringify([
    record.toolName,
    record.effect,
    record.outcome,
    record.phase ?? null,
    record.source,
    record.invocationId ?? null,
    record.effectObservationId ?? null,
  ]);
  const boundaryKey = (record) => JSON.stringify([
    record.toolName ?? null,
    record.origin,
    record.type,
    record.status,
    record.evidenceSource,
    record.invocationId ?? null,
  ]);

  return {
    metadata: {
      before: {
        modelVersion: isV2Audit(before) ? before.modelVersion : 1,
        ...(isV2Audit(before) ? {
          evidenceMode: before.evidenceMode,
          evidenceCompleteness: before.evidenceCompleteness,
        } : {}),
      },
      after: {
        modelVersion: isV2Audit(after) ? after.modelVersion : 1,
        ...(isV2Audit(after) ? {
          evidenceMode: after.evidenceMode,
          evidenceCompleteness: after.evidenceCompleteness,
        } : {}),
      },
    },
    policyOutcomes: diffRecords(
      typedAuditRecords(before, "policyOutcomes"),
      typedAuditRecords(after, "policyOutcomes"),
      policyKey,
    ),
    effectOutcomes: diffRecords(
      typedAuditRecords(before, "effectOutcomes"),
      typedAuditRecords(after, "effectOutcomes"),
      effectKey,
    ),
    boundaryEvidence: diffRecords(
      typedAuditRecords(before, "boundaryEvidence"),
      typedAuditRecords(after, "boundaryEvidence"),
      boundaryKey,
    ),
  };
}

function diffFindings(before, after) {
  const beforeMap = new Map(before.gaps.map((gap) => [findingKey(gap), gap]));
  const afterMap = new Map(after.gaps.map((gap) => [findingKey(gap), gap]));
  const resolved = [];
  const added = [];
  const remaining = [];

  for (const [key, gap] of beforeMap) {
    if (afterMap.has(key)) remaining.push(summarizeFinding(afterMap.get(key)));
    else resolved.push(summarizeFinding(gap));
  }
  for (const [key, gap] of afterMap) {
    if (!beforeMap.has(key)) added.push(summarizeFinding(gap));
  }
  return { resolved, added, remaining };
}

function observedEffects(audit) {
  const entries = [];
  for (const execution of audit.execution) {
    for (const observed of execution.observedEffects) {
      entries.push({
        toolName: execution.toolName,
        effect: observed.effect,
        source: observed.source,
        ...(observed.detail === undefined ? {} : { detail: observed.detail }),
      });
    }
  }
  const unique = new Map();
  for (const entry of entries) {
    const key = JSON.stringify([entry.toolName, entry.effect, entry.source, entry.detail ?? null]);
    unique.set(key, entry);
  }
  return unique;
}

function diffObservedEffects(before, after) {
  const beforeMap = observedEffects(before);
  const afterMap = observedEffects(after);
  const removed = [];
  const added = [];
  const remaining = [];

  for (const [key, entry] of beforeMap) {
    if (afterMap.has(key)) remaining.push(afterMap.get(key));
    else removed.push(entry);
  }
  for (const [key, entry] of afterMap) {
    if (!beforeMap.has(key)) added.push(entry);
  }
  return { removed, added, remaining };
}

function statusChanges(before, after) {
  const pairs = [
    ["technicalStatus", before.technicalStatus, after.technicalStatus],
    ["semanticStatus", before.semanticStatus, after.semanticStatus],
    ["intent", before.statuses.intent, after.statuses.intent],
    ["parity", before.statuses.parity, after.statuses.parity],
    ["agency", before.statuses.agency, after.statuses.agency],
  ];
  return pairs
    .filter(([, from, to]) => from !== to)
    .map(([field, from, to]) => ({ field, from, to }));
}

function buildDiff(before, after) {
  if (before.applicationId !== after.applicationId) {
    fail("diff requires matching applicationId values");
  }
  if (before.goal !== after.goal) fail("diff requires matching goal values");

  const diff = {
    kind: "semantic-diff",
    applicationId: after.applicationId,
    goal: after.goal,
    before: {
      technicalStatus: before.technicalStatus,
      semanticStatus: before.semanticStatus,
      statuses: before.statuses,
    },
    after: {
      technicalStatus: after.technicalStatus,
      semanticStatus: after.semanticStatus,
      statuses: after.statuses,
    },
    statusChanges: statusChanges(before, after),
    findings: diffFindings(before, after),
    observedPath: {
      before: before.path,
      after: after.path,
      changed: JSON.stringify(before.path) !== JSON.stringify(after.path),
    },
    observedEffects: diffObservedEffects(before, after),
  };

  if (isV2Audit(before) || isV2Audit(after)) {
    diff.modelVersions = {
      before: isV2Audit(before) ? 2 : 1,
      after: isV2Audit(after) ? 2 : 1,
    };
    diff.typedEvidence = buildTypedEvidenceDiff(before, after);
  }
  return diff;
}

function printHumanDiff(diff) {
  const lines = [
    "PARALLAX semantic diff",
    `Application: ${diff.applicationId}`,
    `Goal: ${diff.goal}`,
    "",
    `Before: Technical ${statusLabel(diff.before.technicalStatus)} / Semantic ${statusLabel(diff.before.semanticStatus)}`,
    `After:  Technical ${statusLabel(diff.after.technicalStatus)} / Semantic ${statusLabel(diff.after.semanticStatus)}`,
    "",
    "Status changes:",
  ];

  if (diff.statusChanges.length === 0) lines.push("  (none)");
  else for (const change of diff.statusChanges) lines.push(`  - ${change.field}: ${statusLabel(change.from)} → ${statusLabel(change.to)}`);

  lines.push("", "Resolved findings:");
  if (diff.findings.resolved.length === 0) lines.push("  (none)");
  else for (const finding of diff.findings.resolved) lines.push(`  - ${finding.title} (${finding.rule})`);

  lines.push("", "Added findings:");
  if (diff.findings.added.length === 0) lines.push("  (none)");
  else for (const finding of diff.findings.added) lines.push(`  - ${finding.title} (${finding.rule})`);

  lines.push("", "Remaining findings:");
  if (diff.findings.remaining.length === 0) lines.push("  (none)");
  else for (const finding of diff.findings.remaining) lines.push(`  - [${statusLabel(finding.status)}] ${finding.title} (${finding.rule})`);

  lines.push("", "Observed path:", `  before: ${diff.observedPath.before.join(" → ") || "(none)"}`, `  after:  ${diff.observedPath.after.join(" → ") || "(none)"}`);
  lines.push("", "Removed observed effects:");
  if (diff.observedEffects.removed.length === 0) lines.push("  (none)");
  else for (const effect of diff.observedEffects.removed) lines.push(`  - ${effect.toolName}: ${effect.effect} [${effect.source}]`);
  lines.push("", "Added observed effects:");
  if (diff.observedEffects.added.length === 0) lines.push("  (none)");
  else for (const effect of diff.observedEffects.added) lines.push(`  - ${effect.toolName}: ${effect.effect} [${effect.source}]`);

  if (diff.typedEvidence !== undefined) {
    lines.push("", "Typed evidence changes:");
    for (const [label, changes] of [
      ["policy outcomes", diff.typedEvidence.policyOutcomes],
      ["effect outcomes", diff.typedEvidence.effectOutcomes],
      ["boundary evidence", diff.typedEvidence.boundaryEvidence],
    ]) {
      lines.push(`  ${label}: -${changes.removed.length} / +${changes.added.length} / =${changes.remaining.length}`);
    }
  }

  process.stdout.write(`${lines.join("\n")}\n`);
}

function runDiff(args) {
  const options = parseDiffArgs(args);
  const rawBefore = readJson(options.beforePath, "before audit");
  const rawAfter = readJson(options.afterPath, "after audit");
  const useV2 = isV2Audit(rawBefore) || isV2Audit(rawAfter);
  let loadedCore;
  let before;
  let after;
  if (useV2) {
    loadedCore = compileCoreV2();
    try {
      before = isV2Audit(rawBefore)
        ? validateAuditResultV2(rawBefore, loadedCore.core, "before audit")
        : validateAuditResult(rawBefore, "before audit");
      after = isV2Audit(rawAfter)
        ? validateAuditResultV2(rawAfter, loadedCore.core, "after audit")
        : validateAuditResult(rawAfter, "after audit");
    } finally {
      loadedCore.cleanup();
    }
  } else {
    before = validateAuditResult(rawBefore, "before audit");
    after = validateAuditResult(rawAfter, "after audit");
  }
  const diff = buildDiff(before, after);
  if (options.json) writeJsonOutput(diff);
  else printHumanDiff(diff);
  return semanticExitCode(after.semanticStatus);
}

function printUsage() {
  process.stdout.write([
    "Usage:",
    "  npm run parallax -- check --contract <file> --evidence <file> [--v2] [--execution-complete] [--json]",
    "  npm run parallax -- diff <before.audit.json> <after.audit.json> [--json]",
  ].join("\n") + "\n");
}

function main(args) {
  const [command, ...commandArgs] = args;
  if (command === undefined || command === "--help" || command === "-h") {
    printUsage();
    return 0;
  }
  if (command === "check") return runCheck(commandArgs);
  if (command === "diff") return runDiff(commandArgs);
  fail(`unknown command: ${command}`);
}

let exitCode = 0;
try {
  exitCode = main(process.argv.slice(2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`PARALLAX error: ${message}\n`);
  exitCode = 2;
}
process.exitCode = exitCode;
