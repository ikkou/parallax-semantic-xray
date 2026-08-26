const url = process.argv[2];
const port = Number(process.env.PARALLAX_CDP_PORT ?? 9223);
if (!url) throw new Error("Usage: node scripts/inspect-external-webmcp.mjs <url>");

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
    consoleErrors.push({ type: message.params.type, text: (message.params.args ?? []).map((arg) => arg.value ?? arg.description ?? "").join(" ") });
  }
  if (message.method === "Runtime.exceptionThrown") {
    consoleErrors.push({ type: "exception", text: message.params?.exceptionDetails?.text ?? message.params?.exceptionDetails?.exception?.description ?? "exception" });
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
  if (response.exceptionDetails || response.result?.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails ?? response.result.exceptionDetails));
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

await send("Runtime.enable");
await send("Page.enable");
await send("Page.navigate", { url });
await waitFor("document.body?.innerText ?? ''", (text) => typeof text === "string" && text.length > 0);
await sleep(1200);
const result = await waitFor(`(async () => {
  const mc = document.modelContext;
  const tools = mc && typeof mc.getTools === "function" ? await mc.getTools() : [];
  return {
    environment: { href: location.href, title: document.title, userAgent: navigator.userAgent, secureContext: isSecureContext },
    pageText: (document.body?.innerText ?? "").slice(0, 2000),
    api: { documentModelContext: Boolean(mc), registerTool: typeof mc?.registerTool === "function", getTools: typeof mc?.getTools === "function", executeTool: typeof mc?.executeTool === "function", nativeTesting: Boolean(navigator.modelContextTesting) },
    tools: tools.map((tool) => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema, annotations: tool.annotations ?? null })).sort((a, b) => a.name.localeCompare(b.name)),
  };
})()`, (value) => value?.api?.getTools === true && Array.isArray(value.tools), 18000);

console.log(JSON.stringify({ ...result, consoleErrors }, null, 2));
ws.close();
