# WebMCP Extension Interoperability Validation

**Date:** 2026-08-27 (JST)  
**Mode:** LIVE EXECUTION  
**Production URL:** https://parallax-semantic-xray.heavenchan.chatgpt.site/  
**Source under test:** `6c7a369d44cb3cb922d504bdfcd70a57b7272ec6`

## Environment

- Browser: Google Chrome `151.0.7922.174` on macOS.
- Extension: [WebMCP Extension](https://chromewebstore.google.com/detail/webmcp-extension/jigokfbbpcdckjmhbgapmikncfihboec), opened as the Chrome side panel on the production page.
- Native regression browser: the same Chrome version in an isolated headless profile with `--enable-features=WebMCP` and `--enable-blink-features=ModelContextAPI,ModelContextExecutorAPI`.
- Native APIs observed: `document.modelContext`, `registerTool`, `getTools`, and `executeTool`.
- No additional origin-trial prompt was encountered. The WebMCP Extension required site access for the production origin.

## Extension discovery

The Extension discovered 9 tools through the page surface:

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

The required PARALLAX tools were all present. The Extension Tools and Execute views exposed their descriptions and required inputs. The raw native discovery snapshot also confirmed:

```text
run_parity_audit.goal   type=string, minLength=1, required
trace_goal.goal         type=string, minLength=1, required
explain_gap.gap_id      type=string, minLength=1, required
```

The descriptions state that `goal` and `gap_id` must not be empty; the runtime additionally rejects whitespace-only strings.

Discovery capture: [WebMCP Extension tool discovery](screenshots/2026-08-27-webmcp-extension-discovery.jpg)

## Valid Extension invocation

The Extension Execute view invoked `run_parity_audit` with the exact approved goal:

```text
Compare the Free and Pro plans and recommend the best option. Don't make any changes to my subscription.
```

The Extension displayed a successful structured result:

```json
{
  "applicationId": "subly-playground",
  "goal": "Compare the Free and Pro plans and recommend the best option. Don't make any changes to my subscription.",
  "statuses": {
    "intent": "fail",
    "parity": "fail",
    "agency": "warning"
  },
  "technicalStatus": "pass",
  "semanticStatus": "fail",
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

After resetting the Playground to establish a visible baseline, this Extension invocation appended:

```text
run_parity_audit
WebMCP invocation · structured result returned
```

to the PARALLAX Agent Execution Log. The visible X-Ray continued to show the same goal, `TECHNICAL RESULT PASS / HTTP 200`, and `SEMANTIC RESULT FAIL / INTENT VIOLATED`. The broken runtime state remained the controlled demonstration state: Pro activated and `$20` charged.

Valid invocation capture: [successful WebMCP Extension audit](screenshots/2026-08-27-webmcp-extension-valid-audit.jpg)

## Invalid input and state preservation

The Extension executed these invalid cases against the production page:

```text
run_parity_audit({ goal: "" })
run_parity_audit({ goal: "   " })
```

Both were rejected. The Extension presented the browser-level message:

```text
Tool was executed but the invocation failed. For example, the script function threw an error
```

The Extension does not expose the thrown application error text in its result panel. The exact application boundary is covered by the local contract tests as:

```text
INVALID_ARGUMENT: goal must be a non-empty string.
```

The native Chrome regression additionally exercised empty and whitespace-only `goal`, empty `gap_id`, and unknown `gap_id`. The unknown ID returned a structured `NOT_FOUND` result, and invalid calls preserved runtime state, audit gaps, and visible UI state. No audit callback or replacement goal was produced by an invalid call.

The native regression recorded zero `console.error`/`assert` events. Chrome emitted five runtime exception notifications for the five intentionally rejected native calls; these are recorded separately and are not application console errors.

## History and evidence boundary

The Extension History view was available and showed the `run_parity_audit` tool, the goal payload, the structured result, and the failed invalid invocation during the live checks. History state was refreshed when the Extension rescanned the page, so this record treats History as an observed session view rather than durable storage.

The WebMCP Extension validates the mechanics. PARALLAX validates the semantics.

The Extension test does not claim ChatGPT in-app-browser execution. The separate native validation record is [`2026-08-27-native-webmcp-goal-validation.json`](2026-08-27-native-webmcp-goal-validation.json).
