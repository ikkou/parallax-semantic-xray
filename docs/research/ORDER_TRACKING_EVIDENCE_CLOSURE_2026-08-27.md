# Order Tracking Evidence Closure

Date: 2026-08-27  
Status: `PARTIAL EVIDENCE CLOSURE — SEMANTIC APPROVAL OPEN`  
Scope: Chrome Labs Order Tracking public demo  
PARALLAX Core: unchanged  
PARALLAX audit: not run

## Executive result

The implementation evidence for the public Order Tracking return path is now recorded more precisely:

```
Human Surface
  delivered order
  → Confirm Return submit control

Declared tool surface
  initiate_return
  → GET result.html

Observed public-demo behavior
  → result page renders success/error from URL parameters
  → no persistent return store or API mutation was found in the inspected path

Still unresolved
  whether the developer intends this flow to mean
  display_return_result, return_submission, or return_request_created
```

This closes several implementation-evidence questions, but it does not authorize a semantic contract or a final audit result. The remaining open decisions require the application developer's meaning and policy.

## Evidence sources

- [Order Tracking root source](https://github.com/GoogleChromeLabs/webmcp-tools/blob/main/demos/order-tracking/index.html)
- [Order Tracking history source](https://github.com/GoogleChromeLabs/webmcp-tools/blob/main/demos/order-tracking/history.html)
- [Order Tracking result source](https://github.com/GoogleChromeLabs/webmcp-tools/blob/main/demos/order-tracking/result.html)
- Runtime inspected at `https://googlechromelabs.github.io/webmcp-tools/demos/order-tracking/`

The source pages are the public GitHub implementation corresponding to the deployed GitHub Pages demo. The runtime checks used read-only navigation and DOM inspection.

## Environment and safety boundary

Inspected through:

1. Codex In-app Browser.
2. The connected Google Chrome browser through the browser-control connector.

The connector did not expose the connected Chrome version, so this closure run is not labeled Chrome 151. Native WebMCP re-validation in the known WebMCP-enabled Chrome 151 environment remains a separate open gate.

The following potentially state-changing action was deliberately not performed:

```
Confirm Return
→ form submission
→ initiate_return
```

No native `initiate_return` invocation was performed. Direct navigation to the public result URL was used only to inspect the renderer and is not evidence that a return request was created.

## Closed implementation facts

### 1. Status lookup tool

The root page exposes a form with:

```
toolname: get_order_status
tooldescription: Search orders in a given timeframe. Returns order number, shipping status and location
toolautosubmit: present
method: GET
action: history.html
required input: timeframe
```

The observed timeframe values are `today`, `yesterday`, `last_7_days`, `last_30_days`, and `last_6_months`.

### 2. Return tool declaration

The history page exposes:

```
<form
  id="initiate-return-form"
  toolname="initiate_return"
  tooldescription="Initiate a return process for a specific order that has been delivered."
  toolautosubmit
  action="result.html"
  method="GET"
>
```

Its required inputs are:

```
order_id
reason ∈ defective | wrong_size | changed_mind
```

The delivered `ORD123` card contains an enabled `Confirm Return` submit button. The inspected markup does not declare `readOnlyHint`, `requestUserInteraction`, or an explicit agent-side boundary.

### 3. Human Surface boundary evidence

The observed Human Surface contains a terminal control labeled `Confirm Return`. No separate review page, dialog, consent copy, or second confirmation control was observed in the inspected history-page flow.

This supports the following implementation statement:

```
No distinct review/confirmation step was observed before the return form's terminal submit.
```

It does not decide whether the terminal button itself should count as a semantic confirmation boundary. That remains a contract-owner decision.

### 4. Result-page behavior

Read-only direct navigation produced two states:

```
result.html?order_id=ORD123&reason=defective
→ Return Initiated
→ Your return request for ORD123 has been successfully processed.
```

```
result.html?order_id=ORD456&reason=defective
→ Return Failed
→ only successfully delivered orders such as ORD123 can be returned
```

The inspected `result.html` script:

1. reads `order_id` from `window.location.search`;
2. treats only `ORD123` as success;
3. toggles the success/error DOM blocks;
4. updates the JSON-LD text.

It does not read `reason` for the success decision and does not contain a fetch, API call, persistence write, refund operation, inventory update, or return-request store in the inspected path.

Therefore the strongest evidence-backed observation is:

```
The public demo renders a URL-driven return result.
```

The following stronger claim is not established by this evidence:

```
A real return request was created.
```

### 5. Console and network evidence

No page-level console errors were observed on the inspected root, history, or result pages. The connected Chrome log contained extension-origin warnings from an installed browser extension; those warnings were not emitted by the Order Tracking page and are not counted as application errors.

The browser connector did not provide a network-trace API for this run. Consequently, this record relies on the public source's absence of a mutation call plus read-only runtime rendering; it does not claim a full packet-level network capture.

## Native WebMCP status

Native WebMCP was not available through the current connected browser contexts:

`@
document.modelContext: undefined
navigator.modelContext: undefined / unavailable through the page evaluator
native getTools: not exposed
`@

The In-app Browser advertised a `webmcp` capability, but its `fetchTools()` bridge failed with a connector/model limitation:

`@
gpt-5.6-luna does not support command "webmcp_list_tools"
`@

This is not treated as proof that the public application lacks WebMCP support in every environment. It means that this closure run did not obtain native discovery or native invocation evidence.

## Decision closure matrix

| Review item | Evidence closure | Current conclusion |
| --- | --- | --- |
| B1 goal and permission scope | Open | The read-only goal is a conservative proposal, not an approval. |
| B2 required action | Partially evidenced | `get_order_status` is the clear lookup entry point; completion semantics still require approval. |
| B3 semantic action/effect of `initiate_return` | Implementation ambiguity narrowed | The flow visibly renders a return result; business mutation remains unproven and must not be asserted. |
| B4 meaning of the return result | Partially closed | Success text is URL-driven presentation, not proof of persistent state. |
| B5 Human confirmation boundary | Structural evidence closed; meaning open | `Confirm Return` is the terminal submit; no separate review/dialog was observed. Its boundary semantics remain human-owned. |
| B6 Agent-side boundary equivalence | Source evidence only | No boundary declaration was found; native agent discovery was not available to verify the live surface. |
| B7 permission for return versus later effects | Open | The allowed return stage is a policy choice in the goal. |
| B8 meaning of `reason` | Implementation fact closed; business meaning open | The field is collected and placed in the URL, but the result script does not use it. |

## Contract guidance without approval

Until the developer approves the semantic meaning, an adapter should not silently encode a business mutation. The evidence supports one of these two explicit paths.

### Conservative evidence-only representation

`@
initiate_return
  action: initiate_return (candidate)
  observed effect: display_return_result
  business effect: unresolved
`@

### Developer-asserted business representation

If the application owner confirms that the success page represents a real submitted return, the owner must name the exact domain-opaque effect, for example `return_request_created`, and identify the Human and Agent boundaries that protect it. That assertion would be declared evidence, not a fact inferred by PARALLAX from the page label.

## Remaining closure gates

The Order Tracking evidence gate is not fully closed. To complete it, the next authorized run needs:

1. an approved goal and guardrail set;
2. an approved semantic effect for `initiate_return`;
3. an explicit decision about whether `Confirm Return` is a confirmation boundary;
4. a native WebMCP-capable browser context for discovery and invocation; and
5. explicit authorization before submitting the return form if the run could represent a state-changing action.

No PARALLAX result is reported from this record, and no Core rule or application adapter was changed.

## Final status

`@
Implementation evidence:      PARTIALLY CLOSED
Semantic approval:             OPEN
Native WebMCP discovery:       OPEN
Native WebMCP invocation:      OPEN
Final PARALLAX audit:          NOT RUN
`@
