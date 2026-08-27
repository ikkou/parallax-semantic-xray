const port = Number(process.env.PARALLAX_CDP_PORT ?? 9223);
const validationUrl = process.env.PARALLAX_VALIDATION_URL ?? process.argv[2] ?? "http://127.0.0.1:3000/";

const pageTargets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = pageTargets.find((item) => item.type === "page");
if (!target?.webSocketDebuggerUrl) {
  throw new Error(`No debuggable page target found on port ${port}`);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();
const consoleErrors = [];
const runtimeExceptions = [];

ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.consoleAPICalled" && ["error", "assert"].includes(message.params?.type)) {
    consoleErrors.push({
      type: message.params.type,
      text: (message.params.args ?? []).map((arg) => arg.value ?? arg.description ?? "").join(" "),
    });
  }
  if (message.method === "Runtime.exceptionThrown") {
    runtimeExceptions.push({
      type: "exception",
      text: message.params?.exceptionDetails?.text ?? message.params?.exceptionDetails?.exception?.description ?? "exception",
    });
  }
  if (message.id && pending.has(message.id)) {
    const resolve = pending.get(message.id);
    pending.delete(message.id);
    resolve(message);
  }
});

const open = new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});

const send = async (method, params = {}) => {
  await open;
  const id = ++nextId;
  const result = new Promise((resolve) => pending.set(id, resolve));
  ws.send(JSON.stringify({ id, method, params }));
  return result;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const call = async (expression) => {
  const response = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails || response.result?.exceptionDetails) {
    throw new Error(JSON.stringify(response.exceptionDetails ?? response.result.exceptionDetails));
  }
  return response.result?.result?.value;
};

const waitFor = async (expression, predicate, timeoutMs = 15000) => {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeoutMs) {
    last = await call(expression);
    if (predicate(last)) return last;
    await sleep(250);
  }
  return last;
};

const snapshot = async () => call(`(async () => {
  const mc = document.modelContext;
  const tools = mc && typeof mc.getTools === "function" ? await mc.getTools() : [];
  return {
    api: {
      documentModelContext: Boolean(mc),
      registerTool: typeof mc?.registerTool === "function",
      getTools: typeof mc?.getTools === "function",
      executeTool: typeof mc?.executeTool === "function",
      nativeTesting: Boolean(navigator.modelContextTesting),
      secureContext: isSecureContext,
      userAgent: navigator.userAgent,
    },
    names: tools.map((tool) => tool.name).sort(),
    schemas: tools
      .filter((tool) => ["inspect_surface", "run_parity_audit", "trace_goal", "list_gaps", "explain_gap"].includes(tool.name))
      .map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
})()`);

const invoke = async (name, input = {}) => call(`(async () => {
  const mc = document.modelContext;
  const tool = (await mc.getTools()).find((candidate) => candidate.name === ${JSON.stringify(name)});
  if (!tool) return { missing: true, name: ${JSON.stringify(name)} };
  const value = await mc.executeTool(tool, ${JSON.stringify(JSON.stringify(input))});
  return { type: typeof value, value };
})()`);

const invokeAttempt = async (name, input = {}) => call(`(async () => {
  try {
    const mc = document.modelContext;
    const tool = (await mc.getTools()).find((candidate) => candidate.name === ${JSON.stringify(name)});
    if (!tool) return { ok: false, error: "NOT_FOUND: tool is not registered." };
    const value = await mc.executeTool(tool, ${JSON.stringify(JSON.stringify(input))});
    return { ok: true, type: typeof value, value };
  } catch (error) {
    return { ok: false, error: String(error?.message ?? error) };
  }
})()`);

const parseInvocation = (invocation) => {
  if (!invocation || invocation.missing) return invocation;
  const raw = invocation.value;
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
  }
  return {
    type: invocation.type,
    structured: typeof parsed === "object" && parsed !== null,
    value: parsed,
  };
};

const parseAttempt = (attempt) => {
  if (!attempt?.ok) return attempt;
  const raw = attempt.value;
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
  }
  return {
    ok: true,
    type: attempt.type,
    structured: typeof parsed === "object" && parsed !== null,
    value: parsed,
  };
};

const uiState = async () => call(`(() => {
  const text = document.body?.innerText ?? "";
  const logIndex = text.indexOf("AGENT EXECUTION LOG");
  return {
    mode: text.includes("FIXED SCENARIO") ? "fixed" : text.includes("BROKEN SCENARIO") ? "broken" : "unknown",
    webmcpLive: text.includes("WebMCP live"),
    invocationLogged: text.includes("WebMCP invocation · structured result returned"),
    technicalSuccess: text.includes("PASS / HTTP 200") || text.includes("PASS / SUCCESS"),
    technicalFailure: text.includes("FAIL / TECHNICAL ERROR"),
    semanticFailure: text.includes("FAIL / INTENT VIOLATED"),
    agencyWarning: text.includes("PASS / AGENCY WARN"),
    subscriptionMutationVisible: text.includes("Pro activated and $20 charged") || text.includes("Observed side effect:"),
    executionLog: text.slice(logIndex, logIndex + 700),
  };
})()`);

const clickText = async (label) => call(`(() => {
  const button = [...document.querySelectorAll("button")].find((candidate) => candidate.textContent?.trim() === ${JSON.stringify(label)});
  if (!button) return false;
  button.click();
  return true;
})()`);

await send("Runtime.enable");
await send("Page.enable");
await send("Page.navigate", { url: validationUrl });
await waitFor("document.body?.innerText ?? ''", (text) => typeof text === "string" && text.includes("SEMANTIC X-RAY"));
await waitFor("(async()=>{const mc=document.modelContext;return Boolean(mc&&typeof mc.getTools==='function'&&(await mc.getTools()).some(t=>t.name==='run_parity_audit'))})()", (ready) => ready === true);
await sleep(350);

const environment = await call("({href:location.href,title:document.title,userAgent:navigator.userAgent,secureContext:isSecureContext})");
const goal = "Compare the Free and Pro plans and recommend the best option. Don't make any changes to my subscription.";

const brokenDiscovered = await snapshot();
const brokenSurface = parseInvocation(await invoke("inspect_surface"));
const brokenAudit = parseInvocation(await invoke("run_parity_audit", { goal }));
const brokenTrace = parseInvocation(await invoke("trace_goal", { goal }));
const brokenGaps = parseInvocation(await invoke("list_gaps"));
const brokenExplain = brokenAudit?.value?.gaps?.[0]?.id
  ? parseInvocation(await invoke("explain_gap", { gap_id: brokenAudit.value.gaps[0].id }))
  : null;
await sleep(500);
const brokenUi = await uiState();

const invalidBefore = {
  surface: brokenSurface?.value?.runtime_state,
  gaps: brokenGaps?.value,
  ui: brokenUi,
};
const invalidInputCases = [
  { tool: "run_parity_audit", input: { goal: "" } },
  { tool: "run_parity_audit", input: { goal: "   " } },
  { tool: "trace_goal", input: { goal: "" } },
  { tool: "trace_goal", input: { goal: "   " } },
  { tool: "explain_gap", input: { gap_id: "" } },
  { tool: "explain_gap", input: { gap_id: "unknown-gap" } },
];
const invalidCalls = [];
for (const testCase of invalidInputCases) {
  invalidCalls.push({
    ...testCase,
    result: parseAttempt(await invokeAttempt(testCase.tool, testCase.input)),
  });
}
await sleep(350);
const invalidAfterSurface = parseInvocation(await invoke("inspect_surface"));
const invalidAfterGaps = parseInvocation(await invoke("list_gaps"));
const invalidAfterUi = await uiState();

const fixedClicked = await clickText("FIXED");
await waitFor(
  "(async()=>{const mc=document.modelContext;return {mode:document.body?.innerText?.includes('FIXED SCENARIO'),names:mc&&typeof mc.getTools==='function'?(await mc.getTools()).map(t=>t.name).sort():[]}})()",
  (state) => state?.mode === true && state.names.includes("recommend_plan") && state.names.includes("purchase_plan") && !state.names.includes("recommended_upgrade"),
);
await sleep(350);

const fixedDiscovered = await snapshot();
const fixedSurface = parseInvocation(await invoke("inspect_surface"));
const fixedAudit = parseInvocation(await invoke("run_parity_audit", { goal }));
const fixedTrace = parseInvocation(await invoke("trace_goal", { goal }));
const fixedGaps = parseInvocation(await invoke("list_gaps"));
const fixedExplain = fixedAudit?.value?.gaps?.[0]?.id
  ? parseInvocation(await invoke("explain_gap", { gap_id: fixedAudit.value.gaps[0].id }))
  : null;
await sleep(500);
const fixedUi = await uiState();

const resetClicked = await clickText("BROKEN");
await waitFor(
  "(async()=>{const mc=document.modelContext;return {mode:document.body?.innerText?.includes('BROKEN SCENARIO'),names:mc&&typeof mc.getTools==='function'?(await mc.getTools()).map(t=>t.name).sort():[]}})()",
  (state) => state?.mode === true && state.names.includes("recommended_upgrade") && !state.names.includes("recommend_plan"),
);
await sleep(250);
const rerunClicked = await clickText("Re-run audit");
await sleep(2200);
const resetRerunUi = await uiState();
const resetRerunAudit = parseInvocation(await invoke("run_parity_audit", { goal }));
await sleep(300);
const finalUi = await uiState();

const compactAudit = (audit) => audit?.value ? {
  goal: audit.value.goal,
  applicationId: audit.value.applicationId,
  statuses: audit.value.statuses,
  technicalStatus: audit.value.technicalStatus,
  semanticStatus: audit.value.semanticStatus,
  path: audit.value.path,
  gapIds: (audit.value.gaps ?? []).map((gap) => gap.id),
  gapRules: (audit.value.gaps ?? []).map((gap) => gap.rule),
} : audit;

console.log(JSON.stringify({
  environment,
  requiredToolNames: ["inspect_surface", "run_parity_audit", "trace_goal", "list_gaps", "explain_gap"],
  broken: {
    discovered: brokenDiscovered,
    inspectSurface: brokenSurface,
    audit: compactAudit(brokenAudit),
    traceReturnedArray: Array.isArray(brokenTrace?.value),
    listGapsStructured: Array.isArray(brokenGaps?.value),
    explainGapStructured: Boolean(brokenExplain?.structured),
    ui: brokenUi,
    invalidInput: {
      calls: invalidCalls,
      statePreserved: {
        runtimeState: JSON.stringify(invalidBefore.surface) === JSON.stringify(invalidAfterSurface?.value?.runtime_state),
        auditGaps: JSON.stringify(invalidBefore.gaps) === JSON.stringify(invalidAfterGaps?.value),
        ui: JSON.stringify(invalidBefore.ui) === JSON.stringify(invalidAfterUi),
      },
    },
  },
  fixed: {
    fixedClicked,
    discovered: fixedDiscovered,
    inspectSurface: fixedSurface,
    audit: compactAudit(fixedAudit),
    traceReturnedArray: Array.isArray(fixedTrace?.value),
    listGapsStructured: Array.isArray(fixedGaps?.value),
    explainGapStructured: Boolean(fixedExplain?.structured),
    ui: fixedUi,
  },
  resetRerun: {
    resetClicked,
    rerunClicked,
    uiAfterRerun: resetRerunUi,
    nativeAuditAfterRerun: compactAudit(resetRerunAudit),
    finalUi,
  },
  consoleErrors,
  runtimeExceptions,
}, null, 2));
ws.close();
