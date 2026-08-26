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
  getAuditPath,
  getDemoTools,
  getToolByName,
  GOAL_TEXT,
  runDeterministicAudit,
  type AuditResult,
  type CapabilityRow,
  type DemoMode,
  type Lens,
  type PlanId,
  type StageStatus,
  type ToolDefinition,
  type TraceStep,
} from "../lib/audit";
import {
  executeDemoRuntime,
  getDemoRuntimeState,
  resetDemoRuntime,
  subscribeDemoRuntime,
  type DemoRuntimeState,
} from "../lib/demoRuntime";
import { getTools } from "../lib/webmcp/getTools";
import { registerTool, resetNativeRegistrations } from "../lib/webmcp/registerTool";
import { clearLocalTools } from "../lib/webmcp/registry";
import { getParallaxTools } from "../lib/webmcp/parallaxTools";
import { getWebMcpSupport } from "../lib/webmcp/support";
import type { WebMcpSupport } from "../lib/webmcp/types";

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

const initialHumanActions: HumanAction[] = [
  { step: 1, time: "12:41:02", label: "Open /plans", detail: "Subly pricing surface loaded" },
  { step: 2, time: "12:41:09", label: "Select Pro", detail: "Plan selected for comparison", tone: "active" },
  { step: 3, time: "12:41:13", label: "Compare plans", detail: "Free → Pro feature delta" },
  { step: 4, time: "12:41:18", label: "Review upgrade", detail: "No subscription change requested", tone: "active" },
];

const initialAgentLogs: AgentLog[] = [
  { time: "12:41:19", tool: "inspect_plan", status: "done", detail: "read-only · Free plan" },
  { time: "12:41:20", tool: "compare_plans", status: "done", detail: "read-only · +$20 / month" },
  { time: "12:41:20", tool: "recommended_upgrade", status: "done", detail: "HTTP 200 · Pro activated · $20 charged" },
];

const planData: Record<PlanId, { name: string; price: string; descriptor: string; features: string[] }> = {
  free: {
    name: "FREE",
    price: "$0",
    descriptor: "For getting started",
    features: ["3 projects", "Basic analytics", "Community support"],
  },
  pro: {
    name: "PRO",
    price: "$20",
    descriptor: "For teams that move fast",
    features: ["Unlimited projects", "Advanced analytics", "Priority support"],
  },
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
  step: TraceStep;
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
        </div>
      </div>
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

function App() {
  const [mode, setMode] = useState<DemoMode>("broken");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("pro");
  const [humanActions, setHumanActions] = useState<HumanAction[]>(initialHumanActions);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>(initialAgentLogs);
  const [selectedTool, setSelectedTool] = useState("recommended_upgrade");
  const [audit, setAudit] = useState<AuditResult>(() => runDeterministicAudit("broken"));
  const [runtime, setRuntime] = useState<DemoRuntimeState>(() => getDemoRuntimeState());
  const [support, setSupport] = useState<WebMcpSupport>({
    supported: false,
    label: "Browser check pending",
    detail: "The WebMCP surface is checked after the app mounts.",
  });
  const [registeredCount, setRegisteredCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [visibleStages, setVisibleStages] = useState(6);
  const [needsRetest, setNeedsRetest] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const onExternalAudit = useCallback((nextAudit: AuditResult) => {
    setAudit(nextAudit);
    setNeedsRetest(false);
    setVisibleStages(6);
    setSelectedTool(nextAudit.path[nextAudit.path.length - 1] ?? "recommended_upgrade");
    setAgentLogs((current) => [
      ...current.slice(-4),
      { time: timeNow(), tool: "run_parity_audit", status: "done", detail: "WebMCP invocation · structured result returned" },
    ]);
  }, []);

  const stateRef = useRef({ mode, goal: GOAL_TEXT, audit, runtime, onAudit: onExternalAudit });

  const tools = useMemo(() => getDemoTools(mode), [mode]);
  const path = useMemo(() => getAuditPath(mode), [mode]);
  const selectedToolDefinition = tools.find((tool) => tool.name === selectedTool);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => subscribeDemoRuntime(setRuntime), []);

  useEffect(() => {
    stateRef.current = { mode, goal: GOAL_TEXT, audit, runtime, onAudit: onExternalAudit };
  }, [audit, mode, onExternalAudit, runtime]);

  useEffect(() => {
    const nextSupport = getWebMcpSupport();
    setSupport(nextSupport);
    resetNativeRegistrations();
    clearLocalTools();
    const parallaxTools = getParallaxTools(() => stateRef.current);
    const allTools = [...tools, ...parallaxTools];
    void Promise.all(allTools.map((tool) => registerTool(tool))).then(() => {
      setRegisteredCount(getTools().length);
    });
  }, [mode, tools]);

  const addHumanAction = useCallback((label: string, detail: string, tone: HumanAction["tone"] = "normal") => {
    setHumanActions((current) => [
      ...current.slice(-5),
      { step: current.length + 1, time: timeNow(), label, detail, tone },
    ]);
  }, []);

  const runAuditSequence = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setNeedsRetest(false);
    setVisibleStages(0);
    setAgentLogs([]);
    resetDemoRuntime();
    await wait(160);

    for (const [index, name] of path.entries()) {
      const tool = getToolByName(mode, name);
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
      await tool.execute(input);
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

    setAudit(runDeterministicAudit(mode));
    setVisibleStages(6);
    setIsRunning(false);
  }, [isRunning, mode, path]);

  const executeSingleTool = useCallback(async (name: string) => {
    const tool = getToolByName(mode, name);
    if (!tool || isRunning) return;
    setSelectedTool(name);
    setAgentLogs((current) => [
      ...current.slice(-4),
      { time: timeNow(), tool: name, status: "running", detail: "manual invocation" },
    ]);
    await wait(280);
    await tool.execute(name === "purchase_plan" ? { plan_id: "pro" } : {});
    setAgentLogs((current) =>
      current.map((entry, index) =>
        index === current.length - 1
          ? { ...entry, status: "done", detail: resultLabel(name, mode) }
          : entry,
      ),
    );
    setVisibleStages(6);
    setAudit(runDeterministicAudit(mode));
  }, [isRunning, mode]);

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
    resetDemoRuntime();
    setMode("fixed");
    setSelectedTool("recommend_plan");
    setNeedsRetest(true);
    setVisibleStages(6);
    setAgentLogs([
      { time: timeNow(), tool: "recommend_plan", status: "queued", detail: "read-only replacement ready" },
      { time: timeNow(), tool: "purchase_plan", status: "queued", detail: "explicit confirmation boundary" },
    ]);
    setAudit(runDeterministicAudit("fixed"));
  };

  const resetScenario = () => {
    resetDemoRuntime();
    setMode("broken");
    setSelectedPlan("pro");
    setSelectedTool("recommended_upgrade");
    setNeedsRetest(false);
    setVisibleStages(6);
    setHumanActions(initialHumanActions);
    setAgentLogs(initialAgentLogs);
    setAudit(runDeterministicAudit("broken"));
  };

  const statusCounts = audit.gaps.length;
  const semanticBreak = audit.statuses.intent === "fail" || audit.statuses.parity === "fail";
  const activeTool = selectedToolDefinition ?? tools[0];

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
          <div className={`webmcp-indicator ${support.supported ? "is-live" : "is-local"}`}>
            <CircleDot size={13} />
            <span>{support.supported ? "WebMCP live" : "local simulator"}</span>
          </div>
          <div className="topbar-divider" />
          <div className="audit-id"><span className="muted-label">AUDIT ID</span> AUD-2026-0826-0017</div>
          <button className="icon-button" title="More workspace options" aria-label="More workspace options"><Menu size={17} /></button>
        </div>
      </header>

      <section className="mode-strip">
        <div className="mode-strip-left">
          <div className="xray-badge"><ScanLine size={15} /><span>X-RAY MODE</span></div>
          <div className="strip-caption">Human semantic surface <ArrowRight size={13} /> Agent tool surface</div>
        </div>
        <div className="mode-controls">
          <div className="mode-toggle" role="group" aria-label="Scenario mode">
            <button className={mode === "broken" ? "is-selected is-broken" : ""} onClick={resetScenario}>BROKEN</button>
            <button className={mode === "fixed" ? "is-selected is-fixed" : ""} onClick={patchScenario}>FIXED</button>
          </div>
          <button className="subtle-button" onClick={resetScenario}><RefreshCw size={14} />Reset demo</button>
          <button className="primary-button" onClick={() => void runAuditSequence()} disabled={isRunning}>
            {isRunning ? <RefreshCw className="spin" size={14} /> : <Play size={14} fill="currentColor" />}
            {isRunning ? "Tracing..." : "Re-run audit"}
          </button>
        </div>
      </section>

      <section className="goal-bar">
        <div className="goal-main">
          <div className="goal-label"><Sparkles size={14} /> AUDIT GOAL</div>
          <div className="goal-text">“{GOAL_TEXT}”</div>
        </div>
        <div className="goal-meta">
          <span><span className="muted-label">SCOPE</span> /plans</span>
          <span><span className="muted-label">LENS</span> intent · parity · agency</span>
          <span><span className="muted-label">TOOLS</span> {registeredCount || 9} registered</span>
        </div>
      </section>

      {!support.supported && (
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
            suffix={<span className="surface-count">SUBLY / PLANS</span>}
            action={<span className="surface-live"><CircleDot size={11} /> observed</span>}
          />
          <div className="browser-frame">
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
                {(Object.keys(planData) as PlanId[]).map((plan) => {
                  const item = planData[plan];
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
          </div>
          <div className="subpanel action-log">
            <div className="subpanel-heading"><span><Activity size={13} /> HUMAN ACTION LOG</span><span className="live-label"><CircleDot size={10} /> live</span></div>
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
            suffix={<span className={`scenario-label ${mode}`}>{mode === "broken" ? "BROKEN SCENARIO" : "FIXED SCENARIO"}</span>}
            action={<span className="trace-signal"><span className="signal-dot" /> tracing</span>}
          />
          <div className="trace-goal-card">
            <div className="trace-goal-title"><span className="mini-number">01</span> Goal under inspection</div>
            <div className="trace-goal-copy">{GOAL_TEXT}</div>
            <div className="trace-goal-tags"><span>prohibited: change_plan</span><span>prohibited: charge_payment</span></div>
          </div>
          <div className={`trace-list ${isRunning ? "is-running" : ""}`}>
            {audit.steps.map((step, index) => <StageCard key={step.type} step={step} index={index} visible={index < visibleStages} />)}
          </div>
          {semanticBreak ? (
            <div className="semantic-break">
              <div className="break-icon"><Zap size={19} fill="currentColor" /></div>
              <div className="break-copy">
                <div className="break-title">SEMANTIC BREAK DETECTED</div>
                <div className="break-detail">Meaning changed at <strong>TOOL SELECTION</strong><span className="break-arrow">→</span> review boundary disappeared</div>
                <div className="result-contrast">
                  <div className="result-item result-technical"><span>TECHNICAL RESULT</span><strong>SUCCESS / HTTP 200</strong></div>
                  <div className="result-item result-semantic"><span>SEMANTIC RESULT</span><strong>FAIL / INTENT VIOLATED</strong></div>
                </div>
              </div>
              <div className="break-code">GAP / INTENT-001</div>
            </div>
          ) : (
            <div className="semantic-pass"><div className="pass-icon"><Check size={18} /></div><div className="break-copy"><div className="pass-title">SEMANTIC PATH VERIFIED</div><div className="pass-detail">Recommendation returned without changing the subscription.</div><div className="result-contrast"><div className="result-item result-technical"><span>TECHNICAL RESULT</span><strong>PASS / HTTP 200</strong></div><div className="result-item result-semantic"><span>SEMANTIC RESULT</span><strong>PASS / AGENCY PRESERVED</strong></div></div></div><span className="break-code">VERIFY / PASS</span></div>
          )}
          <div className="trace-footer"><span><span className="muted-label">TRACE</span> trc_01J8RX5Z6VQ4K2B9M3H6D7E1F</span><span><span className="muted-label">LATENCY</span> {isRunning ? "—" : "842ms"}</span><span><span className="muted-label">CONTRACT</span> {activeTool?.name ?? "—"}</span></div>
        </section>

        <section className="panel agent-panel">
          <PanelHeading
            icon={<Code2 size={15} />}
            title="AGENT SURFACE"
            suffix={<span className="surface-count">DOCUMENT.MODELCONTEXT</span>}
            action={<span className={`surface-live ${support.supported ? "" : "is-local-label"}`}><CircleDot size={11} /> {support.supported ? "live" : "local"}</span>}
          />
          <div className="agent-toolbar"><span><Layers3 size={13} /> AVAILABLE TOOLS</span><span className="tool-count">{tools.length} exposed</span></div>
          <div className="tool-list">
            {tools.map((tool) => {
              const selected = selectedTool === tool.name;
              const active = path.includes(tool.name);
              return (
                <div key={tool.name} className={`tool-row ${selected ? "is-selected" : ""} ${active ? "is-path" : ""}`}>
                  <button className="tool-select" onClick={() => setSelectedTool(tool.name)} aria-label={`Inspect ${tool.name}`}>
                    <span className="tool-status"><CircleDot size={10} /></span>
                    <span className="tool-name">{tool.name}</span>
                  </button>
                  <span className={`tool-mode ${tool.annotations.readOnlyHint ? "is-read" : "is-write"}`}>{tool.annotations.readOnlyHint ? "READ" : "WRITE"}</span>
                  <button className="tool-run" onClick={() => void executeSingleTool(tool.name)} disabled={isRunning} title={`Execute ${tool.name}`}><Play size={11} fill="currentColor" /></button>
                </div>
              );
            })}
          </div>
          <div className="tool-inspector">
            <div className="inspector-topline"><span className="inspector-label"><Terminal size={13} /> TOOL CONTRACT</span><span className={`risk-label risk-${activeTool?.parallax.risk ?? "low"}`}>RISK / {activeTool?.parallax.risk.toUpperCase() ?? "—"}</span></div>
            <div className="inspector-name">{activeTool?.name ?? "Select a tool"}<span>()</span></div>
            <p className="inspector-description">{activeTool?.description}</p>
            <div className="inspector-kv"><span>readOnlyHint</span><strong className={activeTool?.annotations.readOnlyHint ? "kv-pass" : "kv-fail"}>{String(activeTool?.annotations.readOnlyHint ?? false)}</strong></div>
            <div className="inspector-kv"><span>semanticAction</span><strong>{activeTool?.parallax.semanticAction ?? "—"}</strong></div>
            <div className="inspector-effects"><span>effects</span><div>{activeTool?.parallax.effects.map((effect) => <code key={effect}>{effect}</code>)}</div></div>
            <button className="inspector-cta" onClick={() => void executeSingleTool(activeTool?.name ?? "")} disabled={isRunning || !activeTool}><Play size={12} fill="currentColor" /> Execute {activeTool?.name ?? "tool"}</button>
          </div>
          <div className="subpanel execution-log">
            <div className="subpanel-heading"><span><Activity size={13} /> AGENT EXECUTION LOG</span><span className="live-label"><CircleDot size={10} /> live</span></div>
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
            {mode === "broken" && <button className="patch-button" onClick={patchScenario}><WrenchGlyph /> Patch to FIXED <ArrowRight size={13} /></button>}
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
        <span><span className="muted-label">MODE</span> {mode.toUpperCase()} <span className="footer-divider" /><span className="muted-label">WEBMCP</span> document.modelContext <span className="footer-divider" /><span className="muted-label">LOCAL REGISTRY</span> {registeredCount || 9} tools</span>
        <button className="footer-link"><Copy size={12} /> Copy audit JSON</button>
      </footer>
    </main>
  );
}

function CapabilityTableRow({ row }: { row: CapabilityRow }) {
  return (
    <tr className={`matrix-row matrix-${row.alignment.toLowerCase()}`}>
      <td className="matrix-capability">{row.capability}</td>
      <td><CapabilityCell value={row.human} /></td>
      <td><CapabilityCell value={row.agent} /></td>
      <td><span className={`alignment alignment-${row.alignment.toLowerCase()}`}>{row.alignment}</span></td>
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
