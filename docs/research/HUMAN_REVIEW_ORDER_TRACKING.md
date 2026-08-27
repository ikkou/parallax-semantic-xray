# PARALLAX Human Review Sheet — Chrome Labs Order Tracking

Status: `DRAFT REVIEW ONLY`  
Source of draft: Fresh Agent-Assisted Integration Experiment B  
Semantic authority: Human developer review required  
Final audit: Not run

This sheet uses only the fresh-agent Order Tracking draft and its permitted source/runtime observations. The previously validated PARALLAX adapter is not used as semantic authority here.

## Review instructions

The agent has separated implementation facts from semantic proposals. Structural facts are recorded without approval checkboxes. Only meaning-bearing decisions are presented for review.

Provenance labels:

```text
DISCOVERED FACT      Directly supported by source or observed runtime behavior.
INFERRED SEMANTIC   Candidate interpretation proposed by the coding agent.
UNRESOLVED          Evidence is insufficient to decide safely.
HUMAN DECISION       A policy or semantic choice that code alone cannot establish.
```

No value on this sheet is approved.

## Discovered facts

The following facts do not require semantic approval merely to establish their existence:

1. The root page declares a `get_order_status` form with the description `Search orders in a given timeframe. Returns order number, shipping status and location`.
2. The order-history page declares an `initiate_return` form with the description `Initiate a return process for a specific order that has been delivered.`.
3. The `get_order_status` form exposes a required timeframe control; the observed values are `today`, `yesterday`, `last_7_days`, `last_30_days`, and `last_6_months`.
4. The `initiate_return` form exposes required `order_id` and `reason` controls; observed reason values include `defective`, `wrong_size`, and `changed_mind`.
5. Both forms use declarative WebMCP attributes including `toolname`, `tooldescription`, and `toolautosubmit`.
6. The history view displays delivered order `ORD123`, plus other order states in the inspected seven-day view.
7. The history view contains a `Confirm Return` submit control for the delivered order.
8. The result page renders a success or error state from URL parameters; the inspected source did not show a persistent return store or API mutation.
9. The inspected source/runtime did not expose `readOnlyHint`, `requestUserInteraction`, or an explicit agent-side boundary declaration.
10. In the fresh browser context, `document.modelContext` and native `fetchTools()` were unavailable; native discovery and native invocation were not completed.
11. The `reason` value is collected by the form but was not found to affect the visible result-page decision.

These facts are observations, not a claim that the application has no native WebMCP support in every environment.

## Human decisions

## Decision B1 — Tested goal and permission scope

Agent proposal:

```text
Goal:
  Retrieve order status for a selected timeframe without initiating or completing a return.
```

Evidence:

- The root form is read-oriented and searches orders by timeframe.
- A separate return form is exposed on the order-history page.

Why human review is required:

The application exposes both status lookup and return initiation, but the code cannot determine whether this audit should be read-only or whether the intended task includes preparing a return with specific guardrails.

Impact on PARALLAX:

`intent.goal`, `intent.forbiddenEffects`, required actions, and all downstream rule outcomes.

Recommended choice:

Use the read-only goal for a conservative first review if that reflects the intended case. If the goal is to prepare a return, state explicitly which return stage is permitted and which later effects are forbidden.

Confidence: LOW

Human response:

[ ] APPROVE  
[ ] EDIT  
[ ] REJECT  
[ ] NEED MORE EVIDENCE

## Decision B2 — Required action for the selected goal

Agent proposal:

```text
requiredActions:
  - query_order_status
```

Evidence:

- The `get_order_status` form is the entry point for the selected timeframe lookup.
- The Human Surface exposes a `Search Orders` operation.

Why human review is required:

The developer must decide whether a rendered order history is the completion condition or whether the goal requires an additional action such as selecting an order or inspecting a return result.

Impact on PARALLAX:

`intent.requiredActions` and the `missing-required-action` rule.

Recommended choice:

Require only `query_order_status` for the read-only goal. Add another action only if the human task explicitly requires it.

Confidence: MEDIUM

Human response:

[ ] APPROVE  
[ ] EDIT  
[ ] REJECT  
[ ] NEED MORE EVIDENCE

## Decision B3 — Semantic action and effect of `initiate_return`

Agent proposal:

```text
Tool:
  initiate_return
candidate action:
  initiate_return
candidate effects:
  - return_request_created
  - return_submission
  - display_return_result
status:
  UNRESOLVED
```

Evidence:

- The tool description says it initiates a return process for a delivered order.
- The form navigates to `result.html`, which renders a `Return Initiated` or error page.
- No persistent return store, API mutation, or other business-state write was found in the inspected source.

Why human review is required:

The phrase “return process” and the result-page text do not establish whether a draft was created, a request was submitted, an irreversible return began, or only a page was rendered. The agent must not select a stronger effect than the evidence supports.

Impact on PARALLAX:

Tool `action`, `declaredEffects`, Human Surface effects, observed effects, `forbidden-effect`, and boundary rules.

Recommended choice:

Keep the business effect `UNRESOLVED` until runtime state, network, or developer assertion distinguishes it. Use a display/navigation effect only if that is the intended semantic contract.

Confidence: LOW

Human response:

[ ] APPROVE  
[ ] EDIT  
[ ] REJECT  
[ ] NEED MORE EVIDENCE

## Decision B4 — Meaning of the observed return state

Agent proposal:

```text
Observed transition:
  initiate_return form submit
  → result.html
  → visible "Return Initiated" state for ORD123

Candidate interpretation:
  display_return_result

Business mutation:
  UNRESOLVED
```

Evidence:

- The result page determines success from query parameters and displays the return status.
- The inspected source contains no confirmed persistence or refund mutation.

Why human review is required:

A technically successful navigation and a success message are not proof of a domain mutation. The developer must decide what the visible transition is intended to represent.

Impact on PARALLAX:

`ExecutionEvidence.observedEffects`, the distinction between technical success and semantic effects, and whether an intent violation can be derived.

Recommended choice:

Do not record `return_request_created`, `refund_initiated`, or another irreversible effect without direct evidence or explicit developer assertion.

Confidence: LOW

Human response:

[ ] APPROVE  
[ ] EDIT  
[ ] REJECT  
[ ] NEED MORE EVIDENCE

## Decision B5 — Human confirmation boundary

Agent proposal:

```text
Human boundary:
  id: return_confirmation
  type: confirmation
  protectsEffects:
    - return_request_created
    - or return_submission
status:
  INFERRED / UNRESOLVED
```

Evidence:

- The Human Surface contains a control labeled `Confirm Return`.
- No separate review page or confirmation dialog was observed.

Why human review is required:

The label may represent a meaningful consent boundary, or it may be the terminal submit button itself. Code alone does not establish which effect the control protects or whether it is an adequate review step.

Impact on PARALLAX:

Human Surface boundaries, protected effects, `missing-confirmation-boundary`, and semantic overloading.

Recommended choice:

Approve a confirmation boundary only if the developer considers `Confirm Return` an explicit consent step for a named effect. Otherwise model it as a submit action without a separate boundary.

Confidence: LOW

Human response:

[ ] APPROVE  
[ ] EDIT  
[ ] REJECT  
[ ] NEED MORE EVIDENCE

## Decision B6 — Agent-side boundary equivalence

Agent proposal:

```text
Agent Surface boundaries:
  []

Candidate implication:
  if initiate_return protects a mutation, no equivalent agent-side
  review or confirmation boundary is currently declared.
```

Evidence:

- No `requestUserInteraction` call or declarative boundary was found in the permitted source.
- The form uses `toolautosubmit`.

Why human review is required:

The absence of a declaration is a source fact, but the developer must decide whether an agent equivalent is required and what would count as equivalent for the approved effect.

Impact on PARALLAX:

Agent Surface boundaries, protected effects, and the `missing-confirmation-boundary` rule.

Recommended choice:

If the approved effect is a protected mutation, require an explicit agent-side confirmation or review boundary. If the flow is display-only, do not invent one.

Confidence: MEDIUM for absence; LOW for semantic sufficiency.

Human response:

[ ] APPROVE  
[ ] EDIT  
[ ] REJECT  
[ ] NEED MORE EVIDENCE

## Decision B7 — Goal treatment of return initiation versus later effects

Agent proposal:

```text
Conservative read-only contract:
  requiredActions: [query_order_status]
  forbiddenEffects: [return_request_created]

Alternative preparation contract:
  allow a named return-preparation action
  forbid later irreversible effects such as refund or final completion
```

Evidence:

- The application exposes status lookup and return initiation as separate forms.
- The current agent draft could not prove the real business effect of the return path.

Why human review is required:

Whether initiating a return is allowed is a policy choice in the user goal. A developer may intentionally permit preparation while forbidding refund or irreversible completion, or may forbid the entire return path.

Impact on PARALLAX:

`intent.requiredActions`, `intent.forbiddenEffects`, and interpretation of any observed return effect.

Recommended choice:

Choose one explicit goal variant before running an audit. Do not derive permission from the presence of the return form.

Confidence: LOW

Human response:

[ ] APPROVE  
[ ] EDIT  
[ ] REJECT  
[ ] NEED MORE EVIDENCE

## Decision B8 — Meaning of the return reason input

Agent proposal:

```text
Input:
  reason: defective | wrong_size | changed_mind

Semantic status:
  UNRESOLVED
```

Evidence:

- The form collects the reason value.
- The result-page success/error branch does not use the reason to determine the visible outcome.

Why human review is required:

The developer must decide whether `reason` is a meaningful business attribute that must be preserved and observed, or a demo-only input with no semantic effect.

Impact on PARALLAX:

Tool schema fidelity, action/effect interpretation, and runtime evidence requirements.

Recommended choice:

Treat the reason as input schema only until a developer confirms a business effect or a runtime observation demonstrates one.

Confidence: MEDIUM for the unused branch; LOW for business meaning.

Human response:

[ ] APPROVE  
[ ] EDIT  
[ ] REJECT  
[ ] NEED MORE EVIDENCE

## Additional evidence requests

Use `NEED MORE EVIDENCE` when the current record cannot support a safe semantic decision.

- Inspect the complete Human Surface submit behavior for `Confirm Return`, including any dialog, review step, or consent text that is not present in the current snapshot.
- Run `get_order_status` and `initiate_return` in a known WebMCP-capable environment and capture native discovery, technical status, returned result, and post-call state.
- Capture before/after URL, DOM, visible order state, network requests, storage, and any application state mutation around `initiate_return`.
- Determine whether any refund, inventory, return-request, or other irreversible state changes occur.
- Confirm whether `reason` is persisted, transmitted, or only used to construct the result URL.
- If a return effect is approved, identify the exact agent-side confirmation or review mechanism required to protect it.

## Review summary

| Measure | Count |
| --- | ---: |
| Discovered facts | 11 |
| Agent-inferred semantic fields/proposal units | 8 |
| Human decisions requiring review | 8 |
| Unresolved items, including runtime/business-state evidence gaps | 4 |
| Unsupported or hallucinated claims | 0 observed |
| Estimated review burden | HIGH |

The high estimate reflects ambiguity about the return effect and boundary, not a time estimate.

## Draft quality metrics

Counting basis: one field unit is either one discovered contract/runtime fact or one decision-bearing semantic proposal listed above. Copied syntax such as individual schema properties is not double-counted.

| Metric | Count |
| --- | ---: |
| Fields proposed by agent | 19 total: 11 direct fact units + 8 semantic proposal units |
| Directly supported | 11 |
| Human review required | 8 |
| Unsupported/hallucinated | 0 observed |
| Missing important semantic fields | 3: confirmed return effect, confirmed protected boundary mapping, and runtime evidence for actual state change |

## Audit gate

No fields have been converted to `APPROVED`. No new PARALLAX audit was run. This sheet is ready for review outside Codex.
