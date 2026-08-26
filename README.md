# PARALLAX

**Semantic debugger for the agentic web**

> **200 OK. Semantically wrong.**

![PARALLAX BROKEN audit](docs/parallax-broken-audit.png)

WebMCP gives websites a second interface: a structured tool surface for agents alongside the visual interface for humans.

PARALLAX detects when those two interfaces disagree.

Ordinary execution testing can report success even when the user's intent has been violated.
PARALLAX asks a different question:

> Did the user's intent survive execution?

## The semantic execution chain

```text
Human Intent
     ↓
Agent Interpretation
     ↓
WebMCP Tool Selection
     ↓
Tool Contract
     ↓
Execution
     ↓
Semantic Outcome
```

## A missing test layer for the agentic web

Traditional web applications have functional testing, accessibility testing, and security testing.

Agent-enabled web applications add another interface: the semantic tool surface exposed to agents.

PARALLAX explores **semantic parity testing**: checking whether the human-facing and agent-facing interfaces preserve the same intent, meaning, capabilities, and safety boundaries.

This project presents a testing category and a concrete controlled experiment.
It does not claim to define an industry standard.

## The controlled experiment

The same goal is used before and after the fix:

```text
Compare the Free and Pro plans and recommend the best option.
Don't make any changes to my subscription.
```

### BROKEN

```text
inspect_plan()
→ compare_plans()
→ recommended_upgrade()
→ HTTP 200 OK
→ Pro activated
→ $20 charged
```

```text
Technical result: SUCCESS
Semantic result: FAIL
```

PARALLAX identifies four gaps:

- **Intent Violation**: the user prohibited subscription changes, but the selected tool changed the plan.
- **Semantic Overloading**: `recommended_upgrade()` combines recommendation with purchase and state mutation.
- **Missing Agent Review Boundary**: the Human Surface has a review step that the Agent Surface does not expose.
- **Excess Agency**: the goal requires reading and recommending, but purchase and cancellation paths are also exposed.

### FIXED

```text
inspect_plan()
→ compare_plans()
→ recommend_plan()
→ recommendation returned
→ no subscription mutation
```

```text
Intent: PASS
Parity: PASS
Agency: PASS
```

The goal is unchanged.
Only the tool surface changes: recommendation becomes read-only, purchase becomes explicit, and the review boundary remains visible.

## Why WebMCP?

Without WebMCP, an agent usually infers capabilities from the human UI or from external APIs.

With WebMCP, the website itself exposes a structured semantic interface that an agent can discover, inspect, and invoke.

That creates a testable dual-interface artifact:

```text
Human Surface ↔ Agent Surface
```

PARALLAX depends on this structure.
WebMCP is not an unrelated integration added after the fact; it is the reason this parity problem exists.

PARALLAX also exposes its own audit tools:

```text
inspect_surface
run_parity_audit
trace_goal
list_gaps
explain_gap
```

This is WebMCP auditing WebMCP.

## Architecture

```text
                 PARALLAX

 Human Surface               Agent Surface
      │                            │
      │                       WebMCP Tools
      │                            │
      └────── Semantic X-Ray ──────┘
                     │
              Audit Engine
                     │
          ┌──────────┼──────────┐
        Intent     Parity     Agency
```

The implementation is intentionally small:

- `app/parallax-app.tsx` renders the three-column dashboard and the broken/fixed demo.
- `lib/audit.ts` contains the deterministic audit model, semantic trace, findings, recommendations, and capability matrix.
- `lib/demoRuntime.ts` simulates the Subly plan state and payment effect in memory.
- `lib/webmcp/` registers browser tools, detects WebMCP support, and defines PARALLAX's audit tools.
- `scripts/prepare-sites.mjs` packages the static Next.js export for the current Sites deployment contract.

## Real WebMCP validation

The following was tested through the browser's native `document.modelContext` surface, not only through the internal simulator.

Environment:

- Google Chrome `151.0.7922.174` on macOS.
- Production HTTPS URL with `secureContext: true`.
- WebMCP enabled with `--enable-features=WebMCP`.
- ModelContext APIs enabled with `--enable-blink-features=ModelContextAPI,ModelContextExecutorAPI`.
- `document.modelContext`, `registerTool`, `getTools`, and `executeTool` were all present.
- `navigator.modelContextTesting` was not required and was not present as an active testing surface.

The Codex in-app browser did not expose WebMCP during this validation.
The results below come from the isolated Chrome 151 environment above.

### Discovered tools

BROKEN:

```text
cancel_plan
compare_plans
explain_gap
inspect_plan
inspect_surface
list_gaps
recommended_upgrade
run_parity_audit
trace_goal
```

FIXED:

```text
cancel_plan
compare_plans
explain_gap
inspect_plan
inspect_surface
list_gaps
purchase_plan
recommend_plan
run_parity_audit
trace_goal
```

The required PARALLAX tool schemas were inspected as follows:

```text
inspect_surface: {}
run_parity_audit: { goal: string }
trace_goal: { goal: string }
list_gaps: {}
explain_gap: { gap_id: string }
```

The Chrome 151 invocation used the registered tool object returned by `getTools()`:

```js
const tools = await document.modelContext.getTools();
const tool = tools.find(({ name }) => name === "run_parity_audit");
const result = await document.modelContext.executeTool(
  tool,
  JSON.stringify({ goal }),
);
const audit = JSON.parse(result);
```

### Actual BROKEN result

```json
{
  "mode": "broken",
  "statuses": {
    "intent": "fail",
    "parity": "fail",
    "agency": "warning"
  },
  "path": [
    "inspect_plan",
    "compare_plans",
    "recommended_upgrade"
  ],
  "gapIds": [
    "intent-001",
    "parity-001",
    "parity-002",
    "agency-001"
  ]
}
```

The visible UI updated after the native invocation.
It showed the execution log entry `WebMCP invocation · structured result returned`, `SUCCESS / HTTP 200`, and `FAIL / INTENT VIOLATED`.

### Actual FIXED result

```json
{
  "mode": "fixed",
  "statuses": {
    "intent": "pass",
    "parity": "pass",
    "agency": "pass"
  },
  "path": [
    "inspect_plan",
    "compare_plans",
    "recommend_plan"
  ],
  "gapIds": []
}
```

The same goal returned a read-only recommendation and the visible UI showed `PASS / HTTP 200` and `PASS / AGENCY PRESERVED`.

## Reproduce the demo

### Live app

<https://parallax-semantic-xray.heavenchan.chatgpt.site/>

### Standard browser

Open the live app in a current browser.
The dashboard is fully viewable and the local simulator supports the same BROKEN/FIXED product flow.

### WebMCP-enabled Chrome

WebMCP is experimental in the tested Chrome build.
Use a clean Chrome profile with the feature flags enabled:

```bash
open -na "Google Chrome" --args \
  --user-data-dir="$TMPDIR/parallax-webmcp-profile" \
  --no-first-run \
  --no-default-browser-check \
  --enable-features=WebMCP \
  --enable-blink-features=ModelContextAPI,ModelContextExecutorAPI \
  https://parallax-semantic-xray.heavenchan.chatgpt.site/
```

Then:

1. Confirm the header says `WebMCP live`.
2. Discover tools with `await document.modelContext.getTools()`.
3. Invoke `run_parity_audit` with the exact goal above.
4. Inspect the center trace: technical success, semantic failure, and drift beginning at tool selection.
5. Switch to `FIXED`.
6. Invoke `run_parity_audit` again with the unchanged goal.
7. Confirm Intent, Parity, and Agency are all `pass`.

## Limitations

The current scope is deliberately a controlled subscription application.

PARALLAX does not yet:

- crawl arbitrary third-party websites;
- define a universal semantic scoring standard;
- replace WebMCP security testing;
- replace probabilistic agent evaluations;
- perform real billing or account mutations.

These are scope boundaries for the challenge submission, not promises of the current P0.

The WebMCP API is browser-dependent.
In Chrome 151, `executeTool` required a RegisteredTool object and a JSON-encoded input string in this validation.
The production page has no origin-trial token; the tested browser required the feature flags above.

## Local development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Validation:

```bash
npm run lint
npm run typecheck
npm run build
```

## License

MIT. See [LICENSE](LICENSE).
