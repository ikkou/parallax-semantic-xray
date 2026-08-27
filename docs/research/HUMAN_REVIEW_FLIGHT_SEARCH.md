# PARALLAX Human Review Sheet — Chrome Labs Flight Search

Status: `DRAFT REVIEW ONLY`  
Source of draft: Fresh Agent-Assisted Integration Experiment A  
Semantic authority: Human developer review required  
Final audit: Not run

This sheet uses only the fresh-agent Flight Search draft and its source/runtime observations. The previously validated PARALLAX adapter is not used as semantic authority here.

## Review instructions

The agent has separated implementation facts from semantic proposals. Structural facts are recorded without approval checkboxes. Only meaning-bearing decisions are presented for review.

Provenance labels:

```text
DISCOVERED FACT      Directly supported by source or observed runtime behavior.
INFERRED SEMANTIC   Candidate interpretation proposed by the agent.
UNRESOLVED          Evidence is insufficient to decide safely.
HUMAN DECISION       A policy or semantic choice that code alone cannot establish.
```

No value on this sheet is approved.

## Discovered facts

The following facts do not require semantic approval merely to establish their existence:

1. `searchFlights` is exposed with route, trip type, date, and passenger inputs and `readOnlyHint: false`.
2. `listFlights` is exposed with an empty input schema and `readOnlyHint: true`.
3. `setFilters` is exposed with stop, airline, airport, price, time, and flight ID filter inputs and `readOnlyHint: false`.
4. `resetFilters` is exposed with an empty input schema and `readOnlyHint: false`.
5. A Human Surface search form is visible with origin, destination, dates, trip type, and passenger controls.
6. The Human Surface contains filter controls and a `Clear All` operation.
7. Result cards display flight details including airline, times, airports, duration, stops, and price.
8. A `Select Flight` control is visible in the inspected result view.
9. The fresh agent found no handler proving the semantic effect of `Select Flight`.
10. No review or confirmation dialog was observed for search, filtering, clearing filters, or the visible selection control.
11. In the fresh run, the connected browser environments did not expose `navigator.modelContext`; native discovery and native invocation were not completed.

These facts are observations, not a claim that the application has no native WebMCP support in every environment.

## Human decisions

## Decision A1 — Tested goal

Agent proposal:

```text
Goal:
  Search for an itinerary and inspect or filter the displayed flight results.
```

Evidence:

- The source/runtime exposes a search form and a results surface.
- `searchFlights`, `listFlights`, and filter tools describe a search-and-inspect workflow.

Why human review is required:

The application structure shows available operations, but it cannot determine which user goal should be audited or whether “inspect or filter” is part of the intended completion condition.

Impact on PARALLAX:

`intent.goal`, the audit context, and the interpretation of missing required actions.

Recommended choice:

Keep a read/search-and-inspect goal if that is the intended validation case. Replace it with the developer's exact wording if the goal is narrower.

Confidence: MEDIUM

Human response:

[ ] APPROVE  
[ ] EDIT  
[ ] REJECT  
[ ] NEED MORE EVIDENCE

## Decision A2 — Required actions

Agent proposal:

```text
requiredActions:
  - search_flights
  - list_flights
```

Evidence:

- `searchFlights` starts the search flow.
- `listFlights` returns the currently visible filtered results.

Why human review is required:

The developer must decide whether returning the visible result set is a required semantic action or merely evidence produced by the search UI. This cannot be established from tool availability alone.

Impact on PARALLAX:

`intent.requiredActions` and the `missing-required-action` rule.

Recommended choice:

Require `search_flights`. Include `list_flights` only if the goal explicitly requires an agent-readable result set rather than a successful search state.

Confidence: MEDIUM

Human response:

[ ] APPROVE  
[ ] EDIT  
[ ] REJECT  
[ ] NEED MORE EVIDENCE

## Decision A3 — Forbidden effects for a search-only goal

Agent proposal:

```text
forbiddenEffects:
  - booking_created
  - flight_purchase_completed
  - payment_charged
  - traveler_data_submitted
```

Evidence:

- The selected workflow is search and result inspection.
- The inspected public source did not expose a completed booking or payment flow in the tested surface.

Why human review is required:

Only the developer can define which domain consequences are prohibited for this goal. Absence of an observed purchase flow is not itself a complete guardrail policy.

Impact on PARALLAX:

`intent.forbiddenEffects`, `forbidden-effect`, and `excess-agency` findings.

Recommended choice:

Keep booking, purchase, payment, and traveler submission as candidate guardrails if they reflect the intended policy. Edit the opaque effect names to match the developer's vocabulary.

Confidence: MEDIUM

Human response:

[ ] APPROVE  
[ ] EDIT  
[ ] REJECT  
[ ] NEED MORE EVIDENCE

## Decision A4 — Meaning of search and filter state changes

Agent proposal:

```text
searchFlights:
  action: search_flights
  candidate effects: search_context_updated

setFilters:
  action: set_flight_filters
  candidate effects:
    - filter_state_updated
    - visible_results_updated

resetFilters:
  action: reset_flight_filters
  candidate effects:
    - filter_state_reset
    - visible_results_updated
```

Evidence:

- The source shows search, filter, and reset handlers changing route, filter, or displayed-result state.
- The agent proposed state-diff and runtime instrumentation around those transitions.

Why human review is required:

The code establishes UI/query state changes, but not whether those changes are domain-semantic effects, protected mutations, or ordinary presentation state. The Core must not assign that meaning automatically.

Impact on PARALLAX:

Human and Agent Surface `effects`, tool `declaredEffects`, observed effects, and declaration/observation mismatch analysis.

Recommended choice:

Treat these as candidate UI/query effects until the developer decides whether they belong in the semantic contract. Do not classify them as protected domain mutations without stronger evidence.

Confidence: MEDIUM

Human response:

[ ] APPROVE  
[ ] EDIT  
[ ] REJECT  
[ ] NEED MORE EVIDENCE

## Decision A5 — Read-only meaning of `listFlights`

Agent proposal:

```text
Tool:
  listFlights
action:
  list_flights
declaredEffects:
  []
candidate annotation:
  readOnlyHint: true
```

Evidence:

- The tool description says it returns currently visible results.
- The tool is declared with `readOnlyHint: true`.

Why human review is required:

`readOnlyHint` is a declaration, not runtime proof. The developer must decide whether the tool is semantically read-only for this workflow and whether any state or external effect must be observed.

Impact on PARALLAX:

Tool `declaredEffects`, runtime `observedEffects`, and declaration/observation mismatch.

Recommended choice:

Use an empty effect list if runtime evidence confirms it only reads the visible result set. Preserve the annotation as declared evidence, never as proof.

Confidence: HIGH for the declaration; MEDIUM for semantic read-only behavior.

Human response:

[ ] APPROVE  
[ ] EDIT  
[ ] REJECT  
[ ] NEED MORE EVIDENCE

## Decision A6 — Meaning of `Select Flight`

Agent proposal:

```text
Human action:
  Select Flight
status:
  UNRESOLVED
candidate effect:
  unknown
```

Evidence:

- A `Select Flight` control is visible in the result view.
- The inspected source did not show a handler proving what the control does.

Why human review is required:

The label suggests selection, but a label alone cannot establish whether the action is inert, changes a local selection, starts booking, or represents another transition.

Impact on PARALLAX:

Human Surface actions, required actions, effect mapping, and possible confirmation-boundary analysis.

Recommended choice:

Leave this action outside the approved contract until its handler or a runtime observation is available. If it is intentionally inert, record that explicitly.

Confidence: LOW

Human response:

[ ] APPROVE  
[ ] EDIT  
[ ] REJECT  
[ ] NEED MORE EVIDENCE

## Decision A7 — Boundary model for the read/filter workflow

Agent proposal:

```text
Human Surface boundaries: []
Agent Surface boundaries: []
```

Evidence:

- No review or confirmation UI was observed for search, filtering, clearing, or the visible selection control.
- Native WebMCP execution was not available in the fresh environment.

Why human review is required:

The absence of a visible dialog is evidence about the inspected surface, but the developer must decide whether any search/filter operation is a protected effect and whether a boundary is semantically necessary.

Impact on PARALLAX:

Human and Agent Surface boundaries and the `missing-confirmation-boundary` rule.

Recommended choice:

Use no boundary for a confirmed read/filter-only workflow. Request more evidence if `Select Flight` or another control can enter a booking or mutation flow.

Confidence: LOW

Human response:

[ ] APPROVE  
[ ] EDIT  
[ ] REJECT  
[ ] NEED MORE EVIDENCE

## Additional evidence requests

Use `NEED MORE EVIDENCE` when the developer cannot decide from the current record.

- Run the same tool calls in a known WebMCP-capable environment and capture discovery, structured results, technical status, and visible state changes.
- Capture before/after route, filter state, visible result IDs, DOM, console, and network state for `searchFlights`, `setFilters`, and `resetFilters`.
- Inspect or instrument the `Select Flight` handler to determine whether it changes only local selection or begins another workflow.
- Confirm whether search/filter state is local presentation state or a domain-semantic mutation.

## Review summary

| Measure | Count |
| --- | ---: |
| Discovered facts | 11 |
| Agent-inferred semantic fields/proposal units | 7 |
| Human decisions requiring review | 7 |
| Unresolved items, including the native-runtime evidence gap | 3 |
| Unsupported or hallucinated claims | 0 observed |
| Estimated review burden | LOW |

The low estimate reflects a read/search workflow with no observed transaction boundary, not a time estimate.

## Draft quality metrics

Counting basis: one field unit is either one discovered contract/runtime fact or one decision-bearing semantic proposal listed above. Copied syntax such as individual schema properties is not double-counted.

| Metric | Count |
| --- | ---: |
| Fields proposed by agent | 18 total: 11 direct fact units + 7 semantic proposal units |
| Directly supported | 11 |
| Human review required | 7 |
| Unsupported/hallucinated | 0 observed |
| Missing important semantic fields | 2: approved meaning for `Select Flight`; runtime effect evidence from native execution |

## Audit gate

No fields have been converted to `APPROVED`. No new PARALLAX audit was run. This sheet is ready for review outside Codex.
