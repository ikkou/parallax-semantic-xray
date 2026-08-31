"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleDot,
  ClipboardCheck,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  GitCompare,
  Layers3,
  Lock,
  Menu,
  Network,
  Play,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Terminal,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type StageStatus,
} from "../lib/core";
import type { ExecutionEvidence } from "../lib/core/evidence";
import type { ToolContract } from "../lib/core/contract";
import type { AuditResult } from "../lib/core/result";
import type { ExecutionEvidenceV2 } from "../lib/core/v2/evidence";
import type { AuditResultV2 } from "../lib/core/v2/result";
import {
  getSublyContract,
  getSublyPath,
  SUBLY_APPLICATION_ID,
  SUBLY_PLAN_DATA,
  type DemoMode,
  type PlanId,
} from "../lib/playground/subly/contract";
import {
  getSublyToolByName,
  getSublyTools,
  type SublyToolDefinition,
} from "../lib/playground/subly/tools";
import {
  getSublyRuntimeState,
  resetSublyRuntime,
  subscribeSublyRuntime,
  type SublyRuntimeState,
} from "../lib/playground/subly/runtime";
import {
  initialSublyAgentLogs,
  initialSublyHumanActions,
} from "../lib/playground/subly/scenarios";
import { getSublyScenarioEvidence } from "../lib/playground/subly/evidence";
import {
  getSublyContractV2,
  getSublyEvidenceV2,
  getSublyToolsV2,
  type SublyToolV2Definition,
} from "../lib/playground/subly/v2";
import { executeLocalTool } from "../lib/integration/webmcp/execute";
import { getLocalTools, clearLocalTools } from "../lib/integration/webmcp/registry";
import { registerTool, resetNativeRegistrations } from "../lib/integration/webmcp/register";
import { getParallaxTools, type ParallaxToolContext } from "../lib/integration/parallaxTools";
import {
  runVersionedAudit,
  type AuditModelVersion,
  type VersionedAuditResult,
} from "../lib/integration/versionedAudit";
import { projectAudit, type XRayAuditViewModel, type XRayCapabilityRow, type XRayTraceStep } from "../lib/integration/xray";
import { getWebMcpSupport } from "../lib/integration/webmcp/support";
import type { EvidenceRecorder } from "../lib/core/evidence";
import type { WebMcpSupport } from "../lib/integration/webmcp/types";
import {
  getValidationContext,
  VALIDATION_CONTEXTS,
  type ValidationContext,
  type ValidationContextId,
} from "../lib/validation/matrix";

type HumanAction = {
  step: number;
  time: string;
  label: string;
  detail: string;
  tone?: "normal" | "active" | "danger";
};

type AgentLog = {
  time: string;
  tool: string;
  status: "queued" | "running" | "done" | "error";
  detail: string;
};

function timeNow() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resultLabel(name: string, mode: DemoMode) {
  if (name === "recommended_upgrade" && mode === "broken") return "HTTP 200 · Pro activated · $20 charged";
  if (name === "recommend_plan" && mode === "fixed") return "HTTP 200 · recommendation · no mutation";
  if (name === "purchase_plan") return "HTTP 200 · explicit purchase · $20 charged";
  if (name === "cancel_plan") return "current plan moved to Free";
  return "read-only result returned";
}

function toolRisk(tool?: Pick<ToolContract, "declaredEffects" | "annotations">) {
  if (!tool || tool.declaredEffects.length === 0) return "low";
  return tool.annotations?.readOnlyHint === true ? "medium" : "high";
}

function technicalResultLabel(
  status: StageStatus,
  audit: Pick<XRayAuditViewModel, "execution">,
  external = false,
) {
  if (status === "pass") {
    const hasHttp200 = audit.execution.some((entry) => entry.statusCode === 200);
    return external ? "PASS / SUCCESS" : hasHttp200 ? "PASS / HTTP 200" : "PASS / SUCCESS";
  }
  if (status === "warning") return "WARN / EVIDENCE INCOMPLETE";
  return "FAIL / TECHNICAL ERROR";
}

function StatusGlyph({ status }: { status: StageStatus }) {
  if (status === "pass") return <Check size={13} strokeWidth={2.5} />;
  if (status === "warning") return <AlertTriangle size={13} strokeWidth={2.5} />;
  return <X size={13} strokeWidth={2.5} />;
}

function StatusBadge({ status, compact = false }: { status: StageStatus; compact?: boolean }) {
  return (
    <span className={`status-badge status-${status} ${compact ? "status-compact" : ""}`}>
      <StatusGlyph status={status} />
      {!compact && <span>{status.toUpperCase()}</span>}
    </span>
  );
}

function LensStatus({ label, status }: { label: string; status: StageStatus }) {
  return (
    <div className="lens-status">
      <span className="lens-label">{label}</span>
      <StatusBadge status={status} />
    </div>
  );
}

function PanelHeading({
  icon,
  title,
  suffix,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  suffix?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel-heading">
      <div className="heading-title">
        <span className="heading-icon">{icon}</span>
        <span>{title}</span>
        {suffix}
      </div>
      {action}
    </div>
  );
}

function StageCard({
  step,
  index,
  visible,
}: {
  step: XRayTraceStep;
  index: number;
  visible: boolean;
}) {
  return (
    <div className={`trace-stage-wrap ${visible ? "is-visible" : "is-hidden"}`} style={{ ["--stage-index" as string]: index }}>
      {index > 0 && <div className={`trace-connector connector-${step.status}`} aria-hidden="true"><ArrowDown size={15} /></div>}
      <div className={`trace-stage trace-${step.status}`}>
        <div className="trace-index">{String(index + 1).padStart(2, "0")}</div>
        <div className="trace-stage-content">
          <div className="trace-stage-topline">
            <span className="trace-stage-label">{step.label}</span>
            <StatusBadge status={step.status} compact />
          </div>
          <div className="trace-stage-detail">{step.detail}</div>
          <div className="trace-stage-meta">{step.meta}</div>
          {step.evidence && step.evidence.length > 0 && (
            <div className="trace-evidence">
              {step.evidence.slice(0, 3).map((item) => (
                <span key={`${item.layer}-${item.label}-${item.value}`}>
                  <strong>{item.layer}</strong> {item.label}: {item.value}{item.source ? ` · ${item.source}` : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OutcomeSummary({ audit }: { audit: XRayAuditViewModel }) {
  if (audit.modelVersion !== 2) return null;
  if (
    audit.policyOutcomes.length === 0 &&
    audit.effectOutcomes.length === 0 &&
    audit.boundaryEvidence.length === 0
  ) {
    return null;
  }

  return (
    <div className="outcome-summary" aria-label="Observed policy and effect outcomes">
      {audit.policyOutcomes.map((outcome) => (
        <span className={`outcome-chip outcome-${outcome.decision}`} key={`${outcome.toolName}-${outcome.decision}`}>
          POLICY OUTCOME: {outcome.decision.toUpperCase()} <small>{outcome.toolName} · {outcome.source}</small>
        </span>
      ))}
      {audit.effectOutcomes.map((outcome) => (
        <span className={`outcome-chip outcome-${outcome.outcome}`} key={`${outcome.toolName}-${outcome.effect}`}>
          EFFECT OUTCOME: {outcome.outcome.toUpperCase()} <small>{outcome.effect} · {outcome.source}</small>
        </span>
      ))}
      {audit.boundaryEvidence.map((boundary, index) => (
        <span className="outcome-chip outcome-boundary" key={`${boundary.toolName ?? "boundary"}-${boundary.origin}-${boundary.type}-${index}`}>
          {boundary.origin.toUpperCase()} BOUNDARY: {boundary.type.toUpperCase()} {boundary.status.toUpperCase()}
        </span>
      ))}
    </div>
  );
}

function CapabilityCell({ value }: { value: boolean }) {
  return value ? (
    <span className="matrix-check"><Check size={13} /></span>
  ) : (
    <span className="matrix-cross"><X size={13} /></span>
  );
}

function ExternalSurfaceSummary({ context }: { context: ValidationContext }) {
  const isHumanApproved = context.authority === "HUMAN APPROVED";
  const observedEffects = context.executionEvidence.flatMap((entry) =>
    entry.observedEffects.map((observed) => ({ ...observed, toolName: entry.toolName })),
  );

  return (
    <div className="external-surface-summary">
      <div className={`captured-marker ${isHumanApproved ? "is-approved" : "is-captured"}`}><CircleDot size={11} /> {context.authority} · EXTERNAL VALIDATION</div>
      <div className="external-summary-title">{context.label}</div>
      <div className="external-summary-meta"><span>source</span><a href={context.source} target="_blank" rel="noreferrer">{context.source}</a></div>
      <div className="external-summary-meta"><span>evidence</span><strong>MODEL v{context.modelVersion} · {context.evidenceMode} · {context.evidenceCompleteness.toUpperCase()}</strong></div>
      <div className="evidence-chain" aria-label="Evidence trust model">
        <span>DECLARED</span><ArrowRight size={10} /> <span>OBSERVED</span>
        {isHumanApproved && <><ArrowRight size={10} /> <strong>HUMAN APPROVED</strong></>}
        <ArrowRight size={10} /> <span>DERIVED</span>
      </div>
      <div className="external-goal-block">
        <span className="muted-label">GOAL</span>
        <p>{context.goal}</p>
      </div>
      <div className="external-flow-heading"><Layers3 size={12} /> HUMAN WORKFLOW</div>
      <div className="external-flow-list">
        {context.contract.humanSurface.actions.map((action, index) => (
          <div className="external-flow-row" key={action.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{action.label ?? action.action}</strong>
            {action.effects.length > 0 && <code>{action.effects.join(" · ")}</code>}
          </div>
        ))}
      </div>
      {observedEffects.length > 0 && (
        <div className="external-observed-list">
          <span className="muted-label">OBSERVED EFFECTS</span>
          {observedEffects.map((observed) => (
            <div key={`${observed.toolName}-${observed.effect}-${observed.source}`}><ArrowRight size={10} /> <code>{observed.effect}</code><span>{observed.toolName} · {observed.source}</span></div>
          ))}
        </div>
      )}
      {context.contract.humanSurface.boundaries.length > 0 && (
        <div className="external-boundary-list">
          <span className="muted-label">BOUNDARIES</span>
          {context.contract.humanSurface.boundaries.map((boundary) => (
            <div key={boundary.id}><Lock size={11} /> {boundary.label ?? boundary.id} <code>{boundary.type}</code></div>
          ))}
        </div>
      )}
      {context.audit.boundaryEvidence.length > 0 && (
        <div className="external-boundary-list observed-boundaries">
          <span className="muted-label">OBSERVED BOUNDARIES</span>
          {context.audit.boundaryEvidence.map((boundary, index) => (
            <div key={`${boundary.origin}-${boundary.type}-${index}`}><CircleDot size={11} /> {boundary.origin.toUpperCase()} · {boundary.type} · {boundary.status}</div>
          ))}
        </div>
      )}
      {context.audit.surfaceRelations.length > 0 && (
        <div className="external-boundary-list observed-boundaries">
          <span className="muted-label">SURFACE RELATIONS</span>
          {context.audit.surfaceRelations.map((relation, index) => (
            <div key={`${relation.relation}-${index}`}><ArrowRight size={10} /> {relation.relation} · declared relationship</div>
          ))}
        </div>
      )}
      {context.auditHistory && (
        <div className="audit-history-block">
          <div className="external-flow-heading"><Activity size={12} /> AUDIT HISTORY</div>
          <div className="audit-history-list">
            {context.auditHistory.map((entry) => (
              <div className={`audit-history-row audit-history-${entry.tone}`} key={entry.label}>
                <span>{entry.label}</span>
                <strong>{entry.detail}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="external-summary-note">
        {isHumanApproved
          ? "Human-approved contract and observed evidence are re-run through Core v2."
          : "Captured fixture · the source application is not cloned here; invoke it in its own environment to collect new evidence."}
      </div>
    </div>
  );
}

function runSublyVersionedAudit(
  modelVersion: AuditModelVersion,
  mode: DemoMode,
  execution: ExecutionEvidence[],
  executionComplete = true,
): VersionedAuditResult {
  if (modelVersion === 2) {
    return runVersionedAudit({
      modelVersion: 2,
      contract: getSublyContractV2(mode),
      evidence: getSublyEvidenceV2(mode, execution),
    });
  }

  return runVersionedAudit({
    modelVersion: 1,
    contract: getSublyContract(mode),
    execution,
    executionComplete,
  });
}

function App() {
  const [mode, setMode] = useState<DemoMode>("broken");
  const [auditVersion, setAuditVersion] = useState<AuditModelVersion>(2);
  const [selectedContext, setSelectedContext] = useState<ValidationContextId>("subly-broken");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("pro");
  const [humanActions, setHumanActions] = useState<HumanAction[]>(initialSublyHumanActions);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>(initialSublyAgentLogs);
  const [selectedTool, setSelectedTool] = useState("recommended_upgrade");
  const initialRuntime = getSublyRuntimeState();
  const initialEvidence = getSublyScenarioEvidence("broken");
  const initialAudit = runSublyVersionedAudit(2, "broken", initialEvidence);
  const [audit, setAudit] = useState<XRayAuditViewModel>(() => projectAudit(initialAudit));
  const rawAuditRef = useRef<VersionedAuditResult>(initialAudit);
  const [runtime, setRuntime] = useState<SublyRuntimeState>(initialRuntime);
  const executionRef = useRef(initialEvidence);
  const initialEvidenceV2 = getSublyEvidenceV2("broken", initialEvidence);
  const [executionEvidence, setExecutionEvidence] = useState<ExecutionEvidenceV2[]>(initialEvidenceV2.entries);
  const [support, setSupport] = useState<WebMcpSupport>({
    supported: false,
    registration: false,
    discovery: false,
    execution: false,
    label: "Browser check pending",
    detail: "The WebMCP surface is checked after the app mounts.",
  });
  const [registeredCount, setRegisteredCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [visibleStages, setVisibleStages] = useState(6);
  const [needsRetest, setNeedsRetest] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const isExternalContext = selectedContext !== "subly-broken" && selectedContext !== "subly-fixed";
  const activeContext = getValidationContext(selectedContext);

  const onExternalAudit = useCallback((nextAudit: VersionedAuditResult) => {
    rawAuditRef.current = nextAudit;
    const projectedAudit = projectAudit(nextAudit);
    setAudit(projectedAudit);
    setNeedsRetest(false);
    setVisibleStages(6);
    setSelectedTool(projectedAudit.path[projectedAudit.path.length - 1] ?? "recommended_upgrade");
    setAgentLogs((current) => [
      ...current.slice(-4),
      { time: timeNow(), tool: "run_parity_audit", status: "done", detail: "WebMCP invocation · structured result returned" },
    ]);
  }, []);

  const recordEvidence = useCallback<EvidenceRecorder>((entry) => {
    executionRef.current = [...executionRef.current, entry];
    setExecutionEvidence(getSublyEvidenceV2(mode, executionRef.current).entries);
  }, [mode]);

  const stateRef = useRef<ParallaxToolContext>({
    modelVersion: 2,
    applicationId: SUBLY_APPLICATION_ID,
    contract: getSublyContractV2("broken"),
    audit: initialAudit as AuditResultV2,
    execution: initialEvidenceV2,
    runtimeState: initialRuntime,
    onAudit: onExternalAudit,
  });

  const tools = useMemo<Array<SublyToolDefinition | SublyToolV2Definition>>(
    () => auditVersion === 2 ? getSublyToolsV2(mode, recordEvidence) : getSublyTools(mode, recordEvidence),
    [auditVersion, mode, recordEvidence],
  );
  const path = useMemo(() => getSublyPath(mode), [mode]);
  const displayTools = useMemo<(ToolContract | SublyToolDefinition | SublyToolV2Definition)[]>(
    () => isExternalContext ? activeContext.contract.agentSurface.tools : tools,
    [activeContext, isExternalContext, tools],
  );
  const displayPath = isExternalContext ? activeContext.audit.path : path;
  const selectedToolDefinition = displayTools.find((tool) => tool.name === selectedTool);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => subscribeSublyRuntime(setRuntime), []);

  useEffect(() => {
    if (auditVersion === 2) {
      stateRef.current = {
        modelVersion: 2,
        applicationId: SUBLY_APPLICATION_ID,
        contract: getSublyContractV2(mode),
        audit: rawAuditRef.current as AuditResultV2,
        execution: getSublyEvidenceV2(mode, executionRef.current),
        runtimeState: runtime,
        onAudit: onExternalAudit,
      };
    } else {
      stateRef.current = {
        modelVersion: 1,
        applicationId: SUBLY_APPLICATION_ID,
        contract: getSublyContract(mode),
        audit: rawAuditRef.current as AuditResult,
        execution: executionRef.current,
        executionComplete: true,
        runtimeState: runtime,
        onAudit: onExternalAudit,
      };
    }
  }, [auditVersion, executionEvidence, mode, onExternalAudit, runtime]);

  useEffect(() => {
    if (!isExternalContext) return;
    const context = activeContext;
    executionRef.current = context.executionEvidence;
    setExecutionEvidence(context.executionEvidence);
    setAudit(context.audit);
    setSelectedTool(context.audit.path[context.audit.path.length - 1] ?? context.contract.agentSurface.tools[0]?.name ?? "");
    setHumanActions(context.contract.humanSurface.actions.map((action, index) => ({
      step: index + 1,
      time: "captured",
      label: action.label ?? action.action,
      detail: action.effects.length > 0 ? `effects · ${action.effects.join(", ")}` : "declared human action",
      tone: action.effects.length > 0 ? "active" : "normal",
    })));
    setAgentLogs(context.executionEvidence.map((entry) => ({
      time: "captured",
      tool: entry.toolName,
      status: entry.technicalStatus === "error" ? "error" : "done",
      detail: entry.resultSummary ?? "captured execution evidence",
    })));
    setNeedsRetest(false);
    setVisibleStages(6);
  }, [activeContext, isExternalContext]);

  useEffect(() => {
    if (isExternalContext) {
      resetNativeRegistrations(SUBLY_APPLICATION_ID);
      clearLocalTools(SUBLY_APPLICATION_ID);
      setSupport({
        supported: false,
        registration: false,
        discovery: false,
        execution: false,
        label: "Captured fixture",
        detail: "This application is represented by a stored external validation record.",
      });
      setRegisteredCount(activeContext.toolSnapshot.length);
      return;
    }
    const nextSupport = getWebMcpSupport();
    setSupport(nextSupport);
    resetNativeRegistrations(SUBLY_APPLICATION_ID);
    clearLocalTools(SUBLY_APPLICATION_ID);
    const parallaxTools = getParallaxTools(() => stateRef.current);
    const allTools = [...tools, ...parallaxTools];
    void Promise.allSettled(
      allTools.map((tool) => registerTool(tool, { applicationId: SUBLY_APPLICATION_ID })),
    ).then(() => {
      setRegisteredCount(getLocalTools(SUBLY_APPLICATION_ID).length);
    });
  }, [activeContext, auditVersion, isExternalContext, mode, tools]);

  const addHumanAction = useCallback((label: string, detail: string, tone: HumanAction["tone"] = "normal") => {
    setHumanActions((current) => [
      ...current.slice(-5),
      { step: current.length + 1, time: timeNow(), label, detail, tone },
    ]);
  }, []);

  const selectAuditVersion = useCallback((nextVersion: AuditModelVersion) => {
    if (nextVersion === auditVersion || isExternalContext) return;
    const nextAudit = runSublyVersionedAudit(nextVersion, mode, executionRef.current, true);
    rawAuditRef.current = nextAudit;
    setAudit(projectAudit(nextAudit));
    setAuditVersion(nextVersion);
    setNeedsRetest(false);
    setVisibleStages(6);
  }, [auditVersion, isExternalContext, mode]);

  const runAuditSequence = useCallback(async () => {
    if (isRunning || isExternalContext) return;
    setIsRunning(true);
    setNeedsRetest(false);
    setVisibleStages(0);
    setAgentLogs([]);
    executionRef.current = [];
    setExecutionEvidence([]);
    resetSublyRuntime();
    await wait(160);

    for (const [index, name] of path.entries()) {
      const tool = getSublyToolByName(mode, name);
      if (!tool) continue;
      setSelectedTool(name);
      setVisibleStages(Math.max(1, index + 1));
      setAgentLogs((current) => [
        ...current,
        { time: timeNow(), tool: name, status: "running", detail: "contract queued" },
      ]);
      await wait(340);
      const input =
        name === "inspect_plan"
          ? { plan_id: "free" }
          : name === "compare_plans"
            ? { from: "free", to: "pro" }
            : {};
      await executeLocalTool(name, input, SUBLY_APPLICATION_ID);
      setAgentLogs((current) =>
        current.map((entry, entryIndex) =>
          entryIndex === current.length - 1
            ? { ...entry, status: "done", detail: resultLabel(name, mode) }
            : entry,
        ),
      );
      setVisibleStages(Math.min(6, index + 3));
      await wait(240);
    }

    const nextAudit = runSublyVersionedAudit(auditVersion, mode, executionRef.current, true);
    rawAuditRef.current = nextAudit;
    setAudit(projectAudit(nextAudit));
    setVisibleStages(6);
    setIsRunning(false);
  }, [auditVersion, isExternalContext, isRunning, mode, path]);

  const executeSingleTool = useCallback(async (name: string) => {
    if (isExternalContext) return;
    const tool = getSublyToolByName(mode, name);
    if (!tool || isRunning) return;
    setSelectedTool(name);
    setAgentLogs((current) => [
      ...current.slice(-4),
      { time: timeNow(), tool: name, status: "running", detail: "manual invocation" },
    ]);
    await wait(280);
    await executeLocalTool(
      name,
      name === "purchase_plan" ? { plan_id: "pro" } : {},
      SUBLY_APPLICATION_ID,
    );
    setAgentLogs((current) =>
      current.map((entry, index) =>
        index === current.length - 1
          ? { ...entry, status: "done", detail: resultLabel(name, mode) }
          : entry,
      ),
    );
    setVisibleStages(6);
    const nextAudit = runSublyVersionedAudit(auditVersion, mode, executionRef.current, true);
    rawAuditRef.current = nextAudit;
    setAudit(projectAudit(nextAudit));
  }, [auditVersion, isExternalContext, isRunning, mode]);

  const selectPlan = (plan: PlanId) => {
    setSelectedPlan(plan);
    addHumanAction(`Select ${plan === "pro" ? "Pro" : "Free"}`, `Plan selected for ${plan === "pro" ? "comparison" : "review"}`, "active");
  };

  const comparePlans = async () => {
    addHumanAction("Compare plans", "Free → Pro feature delta", "active");
    setSelectedTool("compare_plans");
    setAgentLogs((current) => [
      ...current.slice(-4),
      { time: timeNow(), tool: "compare_plans", status: "done", detail: "human surface request · read-only" },
    ]);
  };

  const reviewUpgrade = () => {
    addHumanAction(mode === "fixed" ? "Review order" : "Review upgrade", mode === "fixed" ? "Confirmation boundary opened" : "No purchase requested", "active");
  };

  const patchScenario = () => {
    resetSublyRuntime();
    const fixedEvidence = getSublyScenarioEvidence("fixed");
    executionRef.current = fixedEvidence;
    setExecutionEvidence(getSublyEvidenceV2("fixed", fixedEvidence).entries);
    setMode("fixed");
    setSelectedContext("subly-fixed");
    setSelectedTool("recommend_plan");
    setNeedsRetest(true);
    setVisibleStages(6);
    setAgentLogs([
      { time: timeNow(), tool: "recommend_plan", status: "queued", detail: "read-only replacement ready" },
      { time: timeNow(), tool: "purchase_plan", status: "queued", detail: "explicit confirmation boundary" },
    ]);
    const nextAudit = runSublyVersionedAudit(auditVersion, "fixed", fixedEvidence, true);
    rawAuditRef.current = nextAudit;
    setAudit(projectAudit(nextAudit));
  };

  const resetScenario = () => {
    resetSublyRuntime();
    const brokenEvidence = getSublyScenarioEvidence("broken");
    executionRef.current = brokenEvidence;
    setExecutionEvidence(getSublyEvidenceV2("broken", brokenEvidence).entries);
    setMode("broken");
    setSelectedContext("subly-broken");
    setSelectedPlan("pro");
    setSelectedTool("recommended_upgrade");
    setNeedsRetest(false);
    setVisibleStages(6);
    setHumanActions(initialSublyHumanActions);
    setAgentLogs(initialSublyAgentLogs);
    const nextAudit = runSublyVersionedAudit(auditVersion, "broken", brokenEvidence, true);
    rawAuditRef.current = nextAudit;
    setAudit(projectAudit(nextAudit));
  };

  const statusCounts = audit.gaps.length;
  const semanticBreak = audit.semanticStatus === "fail";
  const agencyWarning = audit.statuses.agency === "warning";
  const semanticResultLabel = semanticBreak
    ? audit.statuses.intent === "fail"
      ? "FAIL / INTENT VIOLATED"
      : audit.statuses.parity === "fail"
        ? "FAIL / SEMANTIC DRIFT"
        : "FAIL / TECHNICAL ERROR"
    : audit.semanticStatus === "warning"
      ? "WARN / SEMANTIC QUALIFIER"
      : audit.technicalStatus !== "pass"
      ? "WARN / EVIDENCE INCOMPLETE"
      : agencyWarning
        ? "PASS / AGENCY WARN"
        : "PASS / AGENCY PRESERVED";
  const activeTool = selectedToolDefinition ?? displayTools[0];
  const selectedContextLabel = activeContext.label;
  const displayedToolCount = isExternalContext ? displayTools.length : registeredCount || tools.length + 5;
  const viewContract = isExternalContext
    ? activeContext.contract
    : auditVersion === 2
      ? getSublyContractV2(mode)
      : getSublyContract(mode);
  const semanticBreakDetail = audit.statuses.intent === "fail"
    ? "Observed execution violated a declared intent guardrail"
    : audit.statuses.parity === "fail"
      ? "A declared Human Surface boundary has no equivalent Agent Surface boundary"
      : "Technical execution failed before semantic completion";
  const semanticPassTitle = audit.semanticStatus === "warning"
    ? isExternalContext ? "PATH VERIFIED WITH QUALIFIER" : "SEMANTIC PATH QUALIFIED"
    : isExternalContext
      ? activeContext.authority === "HUMAN APPROVED" ? "HUMAN-APPROVED PATH VERIFIED" : "CAPTURED PATH VERIFIED"
      : "SEMANTIC PATH VERIFIED";
  const semanticPassDetail = isExternalContext
    ? audit.semanticStatus === "warning"
      ? "No direct intent violation was observed; a non-fatal contract asymmetry remains."
      : activeContext.authority === "HUMAN APPROVED"
        ? "Human-approved contract and observed evidence agree for this workflow."
        : "Declared and observed evidence agree for this captured workflow."
    : `Recommendation returned without changing the subscription.${agencyWarning ? " Mutation tools remain exposed for this read-only goal." : ""}`;

  if (!hydrated) {
    return (
      <main className="app-shell boot-shell">
        <div className="boot-card">
          <div className="brand-name">PARALLAX</div>
          <div className="boot-label"><ScanLine size={13} /> INITIALIZING X-RAY SURFACE</div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></div>
          <div>
            <div className="brand-name">PARALLAX</div>
            <div className="brand-subtitle">Semantic debugger for the agentic web</div>
          </div>
        </div>
        <div className="topbar-status">
          <div className={`webmcp-indicator ${isExternalContext ? "is-captured" : support.supported ? "is-live" : "is-local"}`}>
            <CircleDot size={13} />
            <span>{isExternalContext ? activeContext.authority.toLowerCase() : support.supported ? "WebMCP live" : "local simulator"}</span>
          </div>
          <div className="topbar-divider" />
          <div className="audit-id"><span className="muted-label">{isExternalContext ? "APPLICATION" : "AUDIT ID"}</span> {isExternalContext ? activeContext.applicationId : "AUD-2026-0826-0017"}</div>
          <button className="icon-button" title="More workspace options" aria-label="More workspace options"><Menu size={17} /></button>
        </div>
      </header>

      <section className="mode-strip">
        <div className="mode-strip-left">
          <div className="xray-badge"><ScanLine size={15} /><span>X-RAY MODE</span></div>
          <div className="strip-caption">Human semantic surface <ArrowRight size={13} /> Agent tool surface</div>
        </div>
        <div className="mode-controls">
          <label className="audit-version-select">
            <span>MODEL</span>
            <select
              aria-label="Audit model version"
              value={auditVersion}
              disabled={isExternalContext}
              onChange={(event) => selectAuditVersion(Number(event.target.value) as AuditModelVersion)}
            >
              <option value="2">v2 · production</option>
              <option value="1">v1 · fallback</option>
            </select>
          </label>
          {isExternalContext ? (
            <span className={`captured-chip ${activeContext.authority === "HUMAN APPROVED" ? "is-approved" : "is-captured"}`}><CircleDot size={11} /> {activeContext.authority} · READ-ONLY VIEW</span>
          ) : (
            <>
              <div className="mode-toggle" role="group" aria-label="Scenario mode">
                <button className={mode === "broken" ? "is-selected is-broken" : ""} onClick={resetScenario}>BROKEN</button>
                <button className={mode === "fixed" ? "is-selected is-fixed" : ""} onClick={patchScenario}>FIXED</button>
              </div>
              <button className="subtle-button" onClick={resetScenario}><RefreshCw size={14} />Reset demo</button>
              <button className="primary-button" onClick={() => void runAuditSequence()} disabled={isRunning}>
                {isRunning ? <RefreshCw className="spin" size={14} /> : <Play size={14} fill="currentColor" />}
                {isRunning ? "Tracing..." : "Re-run audit"}
              </button>
            </>
          )}
        </div>
      </section>

      <section className="context-strip" aria-label="Application context">
        <div className="context-label"><Layers3 size={13} /> APPLICATION</div>
        <select
          aria-label="Application context"
          value={selectedContext}
          onChange={(event) => {
            const next = event.target.value as ValidationContextId;
            if (next === "subly-broken") resetScenario();
            else if (next === "subly-fixed") patchScenario();
            else setSelectedContext(next);
          }}
        >
          <optgroup label="LIVE PLAYGROUND">
            {VALIDATION_CONTEXTS.filter((context) => context.kind === "live-playground").map((context) => (
              <option key={context.id} value={context.id}>{context.label}</option>
            ))}
          </optgroup>
          <optgroup label="EXTERNAL VALIDATION">
            {VALIDATION_CONTEXTS.filter((context) => context.kind === "captured-external").map((context) => (
              <option key={context.id} value={context.id}>{context.label} · {context.authority}</option>
            ))}
          </optgroup>
        </select>
        <span className={`context-kind ${isExternalContext ? activeContext.authority === "HUMAN APPROVED" ? "is-approved" : "is-captured" : "is-live"}`}>
          <CircleDot size={10} /> {isExternalContext ? `${activeContext.authority} · ${activeContext.evidenceMaturity}` : "LIVE PLAYGROUND"}
        </span>
      </section>

      <section className="goal-bar">
        <div className="goal-main">
          <div className="goal-label"><Sparkles size={14} /> AUDIT GOAL</div>
          <div className="goal-text">“{audit.goal}”</div>
        </div>
        <div className="goal-meta">
          <span><span className="muted-label">SCOPE</span> {isExternalContext ? activeContext.applicationId : "/plans"}</span>
          <span><span className="muted-label">LENS</span> intent · parity · agency</span>
          <span><span className="muted-label">TOOLS</span> {displayedToolCount} exposed</span>
        </div>
      </section>

      {!isExternalContext && !support.supported && (
        <div className="support-banner">
          <ShieldAlert size={15} />
          <span><strong>WebMCP is not available in this browser.</strong> {support.detail}</span>
          <span className="support-banner-tail">The local simulation remains fully interactive.</span>
        </div>
      )}

      {needsRetest && (
        <div className="retest-banner">
          <WrenchGlyph />
          <span><strong>FIX APPLIED</strong> Tool surface patched. Re-run the audit to verify the new semantic contract.</span>
          <button onClick={() => void runAuditSequence()}><Play size={12} fill="currentColor" /> Run verification</button>
        </div>
      )}

      <section className="workspace-grid">
        <section className="panel human-panel">
          <PanelHeading
            icon={<Eye size={15} />}
            title="HUMAN SURFACE"
            suffix={<span className="surface-count">{isExternalContext ? `${activeContext.authority} · EXTERNAL` : "LIVE PLAYGROUND · SUBLY / PLANS"}</span>}
            action={<span className={`surface-live ${isExternalContext ? "is-captured-label" : ""}`}><CircleDot size={11} /> {isExternalContext ? "captured" : "observed"}</span>}
          />
          {isExternalContext ? <ExternalSurfaceSummary context={activeContext} /> : <div className="browser-frame">
            <div className="browser-chrome">
              <div className="traffic-lights"><span /><span /><span /></div>
              <div className="address-bar"><Lock size={11} /> app.subly.local/plans</div>
              <ExternalLink size={13} className="browser-action" />
            </div>
            <div className="subly-app">
              <div className="subly-nav">
                <div className="subly-logo">Subly<span>.</span></div>
                <div className="subly-links"><span>Pricing</span><span>Features</span><span>FAQ</span><span>Sign in</span></div>
                <button className="subly-cta">Get started</button>
              </div>
              <div className="subly-intro">
                <span className="eyebrow">PLANS FOR YOUR NEXT MOVE</span>
                <h2>Choose the right plan for you</h2>
                <p>Simple pricing. Cancel anytime.</p>
              </div>
              <div className="plan-grid">
                {(Object.keys(SUBLY_PLAN_DATA) as PlanId[]).map((plan) => {
                  const item = SUBLY_PLAN_DATA[plan];
                  const selected = selectedPlan === plan;
                  const current = runtime.currentPlan === plan;
                  return (
                    <button key={plan} className={`plan-card ${selected ? "is-selected" : ""} ${current && runtime.chargedAmount > 0 ? "has-runtime-event" : ""}`} onClick={() => selectPlan(plan)}>
                      <div className="plan-card-topline">
                        <span className="plan-name">{item.name}</span>
                        {plan === "pro" && <span className="plan-recommended">RECOMMENDED</span>}
                      </div>
                      <div className="plan-price">{item.price}<span>/ month</span></div>
                      <div className="plan-descriptor">{item.descriptor}</div>
                      <div className="plan-features">
                        {item.features.map((feature) => <span key={feature}><Check size={12} />{feature}</span>)}
                      </div>
                      <div className={`plan-select ${selected ? "selected" : ""}`}>
                        {current && runtime.chargedAmount > 0 ? <><AlertTriangle size={12} /> Agent changed plan</> : selected ? <><BadgeCheck size={12} /> Selected</> : "Select plan"}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="subly-actions">
                <button className="outline-action" onClick={() => void comparePlans()}><GitCompare size={13} /> Compare plans</button>
                <button className={`review-action ${mode === "fixed" ? "is-fixed" : ""}`} onClick={reviewUpgrade}><ClipboardCheck size={13} /> {mode === "fixed" ? "Review order" : "Review upgrade"}</button>
              </div>
              {runtime.chargedAmount > 0 && (
                <div className="runtime-alert"><AlertTriangle size={13} /><span><strong>Observed side effect:</strong> {runtime.lastEvent}</span></div>
              )}
            </div>
          </div>}
          <div className="subpanel action-log">
            <div className="subpanel-heading"><span><Activity size={13} /> {isExternalContext ? "CAPTURED HUMAN CONTRACT" : "HUMAN ACTION LOG"}</span><span className={`live-label ${isExternalContext ? "is-captured-label" : ""}`}><CircleDot size={10} /> {isExternalContext ? "captured" : "live"}</span></div>
            <div className="action-list">
              {humanActions.map((action) => (
                <div className={`action-row ${action.tone === "active" ? "action-active" : ""} ${action.tone === "danger" ? "action-danger" : ""}`} key={`${action.step}-${action.time}`}>
                  <span className="action-step">{String(action.step).padStart(2, "0")}</span>
                  <span className="action-time">{action.time}</span>
                  <span className="action-label">{action.label}</span>
                  <span className="action-detail">{action.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel trace-panel">
          <PanelHeading
            icon={<Network size={15} />}
            title="SEMANTIC X-RAY"
            suffix={<span className={`scenario-label ${isExternalContext ? "captured" : mode}`}>{isExternalContext ? `${activeContext.authority} · VALIDATION` : mode === "broken" ? "BROKEN SCENARIO" : "FIXED SCENARIO"}</span>}
            action={<span className="trace-signal"><span className="signal-dot" /> tracing</span>}
          />
          <div className="trace-goal-card">
            <div className="trace-goal-title"><span className="mini-number">01</span> Goal under inspection</div>
            <div className="trace-goal-copy">{audit.goal}</div>
            <div className="trace-goal-tags">{viewContract.intent.forbiddenEffects.map((effect) => <span key={effect}>forbidden: {effect}</span>)}</div>
          </div>
          <div className={`trace-list ${isRunning ? "is-running" : ""}`}>
            {audit.steps.map((step, index) => <StageCard key={step.type} step={step} index={index} visible={index < visibleStages} />)}
          </div>
          {semanticBreak ? (
            <div className="semantic-break">
              <div className="break-icon"><Zap size={19} fill="currentColor" /></div>
              <div className="break-copy">
                <div className="break-title">SEMANTIC BREAK DETECTED</div>
                <div className="break-detail">{semanticBreakDetail}</div>
                <div className="result-contrast">
                  <div className="result-item result-technical"><span>TECHNICAL RESULT</span><strong>{technicalResultLabel(audit.technicalStatus, audit, isExternalContext)}</strong></div>
                  <div className="result-item result-semantic"><span>SEMANTIC RESULT</span><strong>{semanticResultLabel}</strong></div>
                </div>
              </div>
              <div className="break-code">GAP / {audit.gaps[0]?.id?.toUpperCase() ?? "—"}</div>
            </div>
          ) : (
            <div className={`semantic-pass ${audit.semanticStatus === "warning" ? "is-warning" : ""}`}><div className="pass-icon">{audit.semanticStatus === "warning" ? <AlertTriangle size={18} /> : <Check size={18} />}</div><div className="break-copy"><div className="pass-title">{semanticPassTitle}</div><div className="pass-detail">{semanticPassDetail}</div><div className="result-contrast"><div className="result-item result-technical"><span>TECHNICAL RESULT</span><strong>{technicalResultLabel(audit.technicalStatus, audit, isExternalContext)}</strong></div><div className={`result-item result-semantic ${audit.semanticStatus === "warning" ? "is-warning" : ""}`}><span>SEMANTIC RESULT</span><strong>{semanticResultLabel}</strong></div></div></div><span className="break-code">VERIFY / {agencyWarning ? "WARN" : "PASS"}</span></div>
          )}
          <OutcomeSummary audit={audit} />
          <div className="trace-footer"><span><span className="muted-label">TRACE</span> {isExternalContext ? `${selectedContextLabel} / captured` : "trc_01J8RX5Z6VQ4K2B9M3H6D7E1F"}</span><span><span className="muted-label">LATENCY</span> {isRunning ? "—" : isExternalContext ? "captured" : "842ms"}</span><span><span className="muted-label">CONTRACT</span> {activeTool?.name ?? "—"}</span></div>
        </section>

        <section className="panel agent-panel">
          <PanelHeading
            icon={<Code2 size={15} />}
            title="AGENT SURFACE"
            suffix={<span className="surface-count">{isExternalContext ? `${activeContext.authority} · EXTERNAL TOOL SURFACE` : "LIVE PLAYGROUND · DOCUMENT.MODELCONTEXT"}</span>}
            action={<span className={`surface-live ${isExternalContext ? "is-captured-label" : support.supported ? "" : "is-local-label"}`}><CircleDot size={11} /> {isExternalContext ? "captured" : support.supported ? "live" : "local"}</span>}
          />
          <div className="agent-toolbar"><span><Layers3 size={13} /> AVAILABLE TOOLS</span><span className="tool-count">{displayTools.length} exposed</span></div>
          <div className="tool-list">
            {displayTools.map((tool) => {
              const selected = selectedTool === tool.name;
              const active = displayPath.includes(tool.name);
              const readOnly = tool.annotations?.readOnlyHint === true || tool.declaredEffects.length === 0;
              return (
                <div key={tool.name} className={`tool-row ${selected ? "is-selected" : ""} ${active ? "is-path" : ""}`}>
                  <button className="tool-select" onClick={() => setSelectedTool(tool.name)} aria-label={`Inspect ${tool.name}`}>
                    <span className="tool-status"><CircleDot size={10} /></span>
                    <span className="tool-name">{tool.name}</span>
                  </button>
                  <span className={`tool-mode ${readOnly ? "is-read" : "is-write"}`}>{readOnly ? "READ" : "WRITE"}</span>
                  {!isExternalContext && <button className="tool-run" onClick={() => void executeSingleTool(tool.name)} disabled={isRunning} title={`Execute ${tool.name}`}><Play size={11} fill="currentColor" /></button>}
                </div>
              );
            })}
          </div>
          <div className="tool-inspector">
            <div className="inspector-topline"><span className="inspector-label"><Terminal size={13} /> TOOL CONTRACT</span><span className={`risk-label risk-${toolRisk(activeTool)}`}>RISK / {toolRisk(activeTool).toUpperCase()}</span></div>
            <div className="inspector-name">{activeTool?.name ?? "Select a tool"}<span>()</span></div>
            <p className="inspector-description">{activeTool?.description}</p>
            <div className="inspector-kv"><span>readOnlyHint</span><strong className={activeTool?.annotations?.readOnlyHint ? "kv-pass" : "kv-fail"}>{activeTool?.annotations?.readOnlyHint === undefined ? "unset" : String(activeTool.annotations.readOnlyHint)}</strong></div>
            <div className="inspector-kv"><span>semanticAction</span><strong>{activeTool?.action ?? "—"}</strong></div>
            <div className="inspector-effects"><span>declared effects</span><div>{activeTool?.declaredEffects.map((effect) => <code key={effect}>{effect}</code>)}</div></div>
            <div className="inspector-effects"><span>observed effects</span><div>{audit.execution.filter((entry) => entry.toolName === activeTool?.name).flatMap((entry) => entry.observedEffects).map((observed) => <code key={`${observed.effect}-${observed.source}`}>{observed.effect} · {observed.source}</code>)}</div></div>
            {isExternalContext ? <div className="captured-inspector-note"><CircleDot size={11} /> {activeContext.authority} record · invoke in the source environment to collect new evidence.</div> : <button className="inspector-cta" onClick={() => void executeSingleTool(activeTool?.name ?? "")} disabled={isRunning || !activeTool}><Play size={12} fill="currentColor" /> Execute {activeTool?.name ?? "tool"}</button>}
          </div>
          <div className="subpanel execution-log">
            <div className="subpanel-heading"><span><Activity size={13} /> AGENT EXECUTION LOG</span><span className={`live-label ${isExternalContext ? "is-captured-label" : ""}`}><CircleDot size={10} /> {isExternalContext ? "captured" : "live"}</span></div>
            <div className="execution-list">
              {agentLogs.length === 0 && <div className="empty-log">Run the audit to stream tool execution.</div>}
              {agentLogs.map((entry, index) => (
                <div className={`execution-row execution-${entry.status}`} key={`${entry.time}-${entry.tool}-${index}`}>
                  <span className="execution-time">{entry.time}</span>
                  <span className="execution-status">{entry.status === "running" ? <RefreshCw className="spin" size={11} /> : entry.status === "error" ? <X size={11} /> : <Check size={11} />}</span>
                  <span className="execution-tool">{entry.tool}</span>
                  <span className="execution-detail">{entry.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      <section className="audit-section">
        <div className="audit-section-heading">
          <div><span className="section-kicker">DOWNSTREAM FINDINGS</span><h2>Audit surface</h2></div>
          <div className="audit-summary"><span>{statusCounts} issues found</span><span className="summary-divider" /><LensStatus label="Intent" status={audit.statuses.intent} /><LensStatus label="Parity" status={audit.statuses.parity} /><LensStatus label="Agency" status={audit.statuses.agency} /></div>
        </div>
        <div className="audit-grid">
          <section className="panel audit-panel issues-panel">
            <PanelHeading icon={<ShieldAlert size={15} />} title="ISSUES" suffix={<span className="issue-count">{statusCounts}</span>} />
            <div className="issue-list">
              {audit.gaps.length === 0 ? <div className="clear-state"><BadgeCheck size={22} /><strong>No semantic gaps detected</strong><span>Intent, parity, and agency now agree.</span></div> : audit.gaps.map((gap) => (
                <article className="issue-row" key={gap.id}>
                  <div className="issue-row-top"><span className={`severity severity-${gap.severity}`}>{gap.severity}</span><span className="issue-id">{gap.id}</span><span className={`issue-type type-${gap.type}`}>{gap.type}</span></div>
                  <h3>{gap.title}</h3>
                  <p>{gap.explanation}</p>
                  <div className="evidence-list">{gap.evidence.map((line) => <span key={line}><ArrowRight size={11} />{line}</span>)}</div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel audit-panel recommendations-panel">
            <PanelHeading icon={<WandSparklesGlyph />} title="RECOMMENDATIONS" suffix={<span className="section-note">explainable fixes</span>} />
            <div className="recommendation-list">
              {audit.recommendations.length === 0 ? <div className="clear-state"><BadgeCheck size={22} /><strong>Contract verified</strong><span>Separate recommendation and payment semantics are visible.</span></div> : audit.recommendations.map((recommendation) => (
                <article className="recommendation-row" key={recommendation.title}>
                  <div className={`priority priority-${recommendation.priority.toLowerCase()}`}>{recommendation.priority}</div>
                  <div className="recommendation-copy"><h3>{recommendation.title}</h3><p>{recommendation.detail}</p><span>{recommendation.rationale}</span></div>
                  <ArrowRight className="recommendation-arrow" size={14} />
                </article>
              ))}
            </div>
            {!isExternalContext && mode === "broken" && <button className="patch-button" onClick={patchScenario}><WrenchGlyph /> Patch to FIXED <ArrowRight size={13} /></button>}
          </section>

          <section className="panel audit-panel matrix-panel">
            <PanelHeading icon={<Network size={15} />} title="CAPABILITY MATRIX" suffix={<span className="section-note">human vs agent</span>} />
            <div className="matrix-wrap">
              <table className="matrix-table">
                <thead><tr><th>Capability</th><th>Human UI</th><th>Agent tools</th><th>Alignment</th><th>Gap</th></tr></thead>
                <tbody>{audit.matrix.map((row) => <CapabilityTableRow key={row.capability} row={row} />)}</tbody>
              </table>
            </div>
            <div className="matrix-legend"><span><i className="legend-dot legend-green" /> aligned</span><span><i className="legend-dot legend-amber" /> warning</span><span><i className="legend-dot legend-red" /> missing / drift</span></div>
          </section>
        </div>
      </section>

      <footer className="app-footer">
        <span>PARALLAX / Semantic supply chain inspection</span>
        <span><span className="muted-label">MODEL</span> v{audit.modelVersion} <span className="footer-divider" /><span className="muted-label">MODE</span> {isExternalContext ? `${activeContext.authority} VALIDATION` : mode.toUpperCase()} <span className="footer-divider" /><span className="muted-label">WEBMCP</span> {support.label} <span className="footer-divider" /><span className="muted-label">SURFACE</span> {displayedToolCount} tools</span>
        <button className="footer-link"><Copy size={12} /> Copy audit JSON</button>
      </footer>
    </main>
  );
}

function CapabilityTableRow({ row }: { row: XRayCapabilityRow }) {
  const relation = "relation" in row ? row.relation : undefined;

  return (
    <tr className={`matrix-row matrix-${row.alignment.toLowerCase()}`}>
      <td className="matrix-capability">{row.capability}</td>
      <td><CapabilityCell value={row.human} /></td>
      <td><CapabilityCell value={row.agent} /></td>
      <td>
        <span className={`alignment alignment-${row.alignment.toLowerCase()}`}>{row.alignment}</span>
        {relation && relation !== "UNRESOLVED" && <span className={`matrix-relation relation-${relation.toLowerCase()}`}>{relation}</span>}
      </td>
      <td className="matrix-gap">{row.gap}</td>
    </tr>
  );
}

function WrenchGlyph() {
  return <span className="wrench-glyph"><Zap size={12} /></span>;
}

function WandSparklesGlyph() {
  return <Sparkles size={15} />;
}

export default App;
