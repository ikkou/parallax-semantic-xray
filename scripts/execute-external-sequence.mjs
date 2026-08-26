const url = process.argv[2];
const sequence = JSON.parse(process.argv[3] ?? "[]");
const port = Number(process.env.PARALLAX_CDP_PORT ?? 9223);
if (!url || !Array.isArray(sequence) || sequence.length === 0) {
  throw new Error("Usage: node scripts/execute-external-sequence.mjs <url> <json-sequence>");
}

const pageTargets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = pageTargets.find((item) => item.type === "page");
if (!target?.webSocketDebuggerUrl) throw new Error(`No debuggable page target found on port ${port}`);

const ws = new WebSocket(target.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();
const consoleErrors = [];
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.consoleAPICalled" && ["error", "assert"].includes(message.params?.type)) {
    consoleErrors.push({
      type: message.params.type,
      text: (message.params.args ?? []).map((arg) => arg.value ?? arg.description ?? "").join(" "),
    });
  }
  if (message.method === "Runtime.exceptionThrown") {
    consoleErrors.push({
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
  const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails || response.result?.exceptionDetails) {
    throw new Error(JSON.stringify(response.exceptionDetails ?? response.result.exceptionDetails));
  }
  return response.result?.result?.value;
};
const waitFor = async (expression, predicate, timeoutMs = 18000) => {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeoutMs) {
    last = await call(expression);
    if (predicate(last)) return last;
    await sleep(350);
  }
  return last;
};
const parseStructured = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};
const snapshot = async () => call(`(async () => {
  const mc = document.modelContext;
  const tools = mc && typeof mc.getTools === "function" ? await mc.getTools() : [];
  return {
    href: location.href,
    title: document.title,
    text: (document.body?.innerText ?? "").slice(0, 4000),
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: tool.annotations ?? null,
    })).sort((a, b) => a.name.localeCompare(b.name)),
  };
})()`);

await send("Runtime.enable");
await send("Page.enable");
await send("Page.navigate", { url });
await waitFor("document.body?.innerText ?? ''", (text) => typeof text === "string" && text.length > 0);
await sleep(800);

const steps = [];
for (const step of sequence) {
  if (!step?.toolName) throw new Error("Each sequence item must include toolName");
  const ready = await waitFor(`(async()=>{const mc=document.modelContext;return Boolean(mc&&typeof mc.getTools==='function'&&(await mc.getTools()).some(t=>t.name===${JSON.stringify(step.toolName)}))})()`, (value) => value === true);
  if (!ready) throw new Error(`Tool not available: ${step.toolName}`);
  const raw = await call(`(async () => {
    const mc = document.modelContext;
    const tools = await mc.getTools();
    const tool = tools.find((candidate) => candidate.name === ${JSON.stringify(step.toolName)});
    const value = await mc.executeTool(tool, ${JSON.stringify(JSON.stringify(step.input ?? {}))});
    return { type: typeof value, value };
  })()`);
  await sleep(800);
  const page = await snapshot();
  steps.push({
    toolName: step.toolName,
    input: step.input ?? {},
    invocation: {
      type: raw?.type,
      structured: typeof parseStructured(raw?.value) === "object" && parseStructured(raw?.value) !== null,
      value: parseStructured(raw?.value),
    },
    pageAfter: page,
  });
}

console.log(JSON.stringify({
  url,
  runtime: await call("({ userAgent: navigator.userAgent, secureContext: isSecureContext, documentModelContext: Boolean(document.modelContext) })"),
  steps,
  consoleErrors,
}, null, 2));
ws.close();
