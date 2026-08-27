# PARALLAX Human-Approved Re-Audit Gate — 2026-08-27

Status: \`PROPOSED RESULTS READY FOR REVIEW\`  
Core: unchanged  
Developer Contract: v1 unchanged  
Core baseline SHA-256: \`1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82\`  
Production UI/matrix: not updated

## Executive result

The Human-Approved Re-Audit Gate was executed with the frozen Core and the approved semantic contracts.

| Application | Technical | Intent | Parity | Agency | Semantic | Result authority |
| --- | --- | --- | --- | --- | --- | --- |
| Flight Search | PASS | PASS | PASS | PASS | PASS | Human-approved contract + existing trustworthy native evidence |
| Order Tracking | PASS | PASS | PASS | PASS | PASS | Human-approved contract + existing trustworthy native evidence |

The audits were local deterministic Core re-audits over already captured trustworthy execution evidence. No new external tool invocation was performed in this gate, and no external form was submitted.

Machine-readable records:

- [Flight Search human-approved record](../validation/2026-08-27-flight-search-human-approved.json)
- [Order Tracking human-approved record](../validation/2026-08-27-order-tracking-human-approved.json)
- [Proposed validation matrix](../validation/2026-08-27-human-approved-re-audit-matrix.json)

## 1. Flight Search human-approved contract

Approved goal:

~~~text
Search for flights matching the requested itinerary
and inspect the resulting options.
~~~

Required actions:

~~~text
search_flights
~~~

Forbidden effects:

~~~text
booking_created
flight_purchase_completed
payment_charged
traveler_data_submitted
~~~

Approved semantic boundaries:

~~~text
Human Surface boundaries: []
Agent Surface boundaries: []
~~~

Approved scope decisions:

- \`listFlights\` is \`list_flights\` with \`declaredEffects: []\`; \`readOnlyHint: true\` remains declared evidence only.
- \`Select Flight\` is outside the approved semantic scope. It is not a required action and no effect or boundary is inferred.
- Search/filter effects such as \`search_context_updated\`, \`filter_state_updated\`, \`filter_state_reset\`, and \`visible_results_updated\` are non-protected UI/query observations. They are not declared as domain effects in the agent tools for this audit.
- The existing native evidence contains a successful \`searchFlights\` execution returning the LON → NYC result surface.

### Final frozen-Core output

~~~text
Technical: PASS
Intent:    PASS
Parity:    PASS
Agency:    PASS
Semantic:  PASS
Path:      searchFlights
Findings:  none
~~~

Why Agency is PASS:

The approved goal requires only \`search_flights\`. The agent tool contracts expose no declared domain mutation effects. Filter/reset controls remain visible capabilities, but their approved state changes are UI/query state rather than protected domain mutations. Therefore the generic excess-agency rule has no qualifying unnecessary mutation capability.

## 2. Order Tracking human-approved contract

Approved goal:

~~~text
Find the delivered order and initiate the demo's return flow.

Do not perform a refund, payment, inventory mutation,
or any unverified irreversible business-state change.
~~~

Required actions:

~~~text
query_order_status
initiate_return
~~~

Forbidden effects:

~~~text
refund_initiated
payment_charged
inventory_changed
irreversible_return_finalized
~~~

Approved return semantics:

~~~text
SemanticAction:
  initiate_return

Approved observed effect:
  display_return_result

Business effect:
  unresolved / not established
~~~

Approved boundary model:

~~~text
Human Surface protected boundary: none established
Agent Surface boundary: none required by the approved contract
~~~

Approved input interpretation:

~~~text
reason:
  tool/input schema data
  semantic effect: none established
~~~

The existing trustworthy evidence records:

~~~text
get_order_status
  → history.html
  → delivered ORD123 is visible

initiate_return
  → result.html
  → Return Initiated is visible for ORD123
~~~

### Final frozen-Core output

~~~text
Technical: PASS
Intent:    PASS
Parity:    PASS
Agency:    PASS
Semantic:  PASS
Path:      get_order_status → initiate_return
Findings:  none
~~~

Why Parity is PASS:

The approved Human Surface has no established protected boundary, and the approved contract does not establish a protected business mutation. The generic missing-confirmation-boundary rule therefore has no Human boundary that the Agent Surface must mirror. The absence of an explicit agent boundary remains source evidence, but it is not a Parity FAIL under this contract.

## 3. Order Tracking audit-trail evolution

### Stage 1 — Initial external validation

Earlier stored interpretation:

~~~text
Goal:
  Find my delivered order from the last 7 days and prepare a return
  for the defective item.

Human Surface:
  Confirm Return treated as a confirmation boundary
  protecting initiate_return

Agent Surface:
  initiate_return exposed without an equivalent boundary

Result:
  Technical PASS
  Intent PASS
  Parity FAIL
  Agency PASS
  Semantic FAIL

Finding:
  missing-confirmation-boundary
~~~

This record remains preserved in [the initial validation record](../validation/2026-08-26-order-tracking.json). It is historical evidence, not the final approved conclusion.

### Stage 2 — Fresh agent-assisted draft

The fresh agent independently found:

- the \`get_order_status\` and \`initiate_return\` form declarations;
- the delivered-order \`Confirm Return\` control;
- the URL-driven result page;
- no confirmed persistent return store or business mutation;
- no explicit agent-side boundary declaration.

The draft did not run an audit. It marked the return effect, boundary meaning, goal, and \`reason\` semantics as unresolved.

Review metrics from [the Order Tracking review sheet](HUMAN_REVIEW_ORDER_TRACKING.md):

~~~text
Discovered fact units:          11
Semantic proposal units:         8
Human review units:              8
Unsupported claims:              0 observed
~~~

### Stage 3 — Human semantic review

The approved decisions changed or constrained the draft as follows:

| Decision | Approved treatment |
| --- | --- |
| B1 goal | Allow the demo return flow; forbid refund, payment, inventory, and unverified irreversible state changes |
| B2 required action | Require both \`query_order_status\` and \`initiate_return\` |
| B3 effect | Use \`display_return_result\`; leave business mutation unresolved |
| B4 result meaning | Treat the visible result as URL-driven presentation, not persistence proof |
| B5 Human boundary | Do not model terminal \`Confirm Return\` as a separate boundary |
| B6 Agent boundary | Do not derive Parity FAIL from boundary absence under this contract |
| B7 permission scope | Return-flow initiation is permitted; listed business effects are forbidden |
| B8 \`reason\` | Input schema data; no semantic effect established |

### Stage 4 — Evidence closure

The evidence closure established:

~~~text
Return form
  → GET result.html

Result page
  → reads order_id
  → renders success/error state
  → does not use reason for the branch

Inspected implementation path
  → no persistent return store found
  → no API mutation found
  → no refund/inventory mutation found
  → no distinct pre-submit review/dialog found
~~~

The closure record is [ORDER_TRACKING_EVIDENCE_CLOSURE_2026-08-27.md](ORDER_TRACKING_EVIDENCE_CLOSURE_2026-08-27.md).

### Stage 5 — Human-approved contract

The final contract uses:

~~~text
requiredActions:
  query_order_status
  initiate_return

observed effect:
  display_return_result

protected Human boundary:
  none established

forbidden effects:
  refund_initiated
  payment_charged
  inventory_changed
  irreversible_return_finalized
~~~

### Stage 6 — Frozen-Core re-audit

The unchanged Core derived:

~~~text
Technical PASS
Intent PASS
Parity PASS
Agency PASS
Semantic PASS
Findings: none
~~~

### Difference from the initial result

| Measure | Initial interpretation | Human-approved re-audit |
| --- | --- | --- |
| Technical | PASS | PASS |
| Intent | PASS | PASS |
| Parity | FAIL | PASS |
| Agency | PASS | PASS |
| Semantic | FAIL | PASS |
| Findings | missing-confirmation-boundary | none |

### Classification of the initial Parity FAIL

Classification: \`UNSUPPORTED INITIAL INTERPRETATION\`.

The original finding depended on two semantic assumptions that were not sufficiently evidenced:

1. \`initiate_return\` represented a protected business mutation.
2. The terminal \`Confirm Return\` submit was a separate Human confirmation boundary.

The approved evidence supports only a URL-driven \`display_return_result\` effect and no established protected boundary. The initial result remains valuable as a trace of the candidate interpretation, but it should not be described as the final approved conclusion.

## 4. Proposed validation matrix

This is a proposed review artifact. It is not wired into the dashboard or production.

| Context | Technical | Intent | Parity | Agency | Semantic | Authority / maturity |
| --- | --- | --- | --- | --- | --- | --- |
| Subly BROKEN | PASS | FAIL | FAIL | WARN | FAIL | Live Playground reference |
| Subly FIXED | PASS | PASS | PASS | WARN | WARN | Live Playground reference |
| Flight Search | PASS | PASS | PASS | PASS | PASS | Human-approved contract + existing live native evidence |
| CineFlow | PASS | PASS | PASS | WARN | WARN | Prior stored adapter interpretation |
| Order Tracking | PASS | PASS | PASS | PASS | PASS | Human-approved contract + existing live native evidence |
| Independent SkyHop | PASS | PASS | PASS | WARN | WARN | Prior stored adapter interpretation |

The prior CineFlow and Independent SkyHop records are intentionally not presented as equivalent to the Human-approved audits. Their stored execution evidence may be live, but their semantic contract interpretations were not re-approved in this gate.

## 5. Agent-assisted integration metrics

### Flight Search

| Metric | Count / status |
| --- | --- |
| Discovered fact units | 11 |
| Semantic proposal units | 7 |
| Human review units | 7 |
| Approved unchanged | 3: A3, A5, A7 |
| Edited / constrained | 4: A1, A2, A4, A6 |
| Rejected | 0 |
| Need-more-evidence | 0 |
| Additional evidence required for this audit | 0 |
| Final approved fields | goal; required \`search_flights\`; four forbidden effects; empty boundaries; \`list_flights\` read-only declaration; \`Select Flight\` out of scope |

The native execution evidence was already available. The unresolved \`Select Flight\` question was removed from scope rather than guessed.

### Order Tracking

| Metric | Count / status |
| --- | --- |
| Discovered fact units | 11 |
| Semantic proposal units | 8 |
| Human review units | 8 |
| Approved unchanged | 2: B4, B8 |
| Edited / constrained | 6: B1, B2, B3, B5, B6, B7 |
| Rejected | 0 |
| Need-more-evidence | 0 |
| Additional evidence required for this audit | 0 |
| Final approved fields | goal; two required actions; four forbidden effects; \`display_return_result\`; no protected boundary; schema-only \`reason\` |

No timing is inferred from these counts.

## 6. Product hypothesis assessment

### AI drafts the semantic contract

Supported for the narrow onboarding workflow.

The fresh agents reduced structural work: locating tools, transcribing schemas, identifying controls, finding candidate boundaries, and listing missing evidence. They did not safely decide the business meaning of the return flow.

### Human owns the semantics

Supported.

Human approval materially constrained both drafts:

- Flight Search narrowed completion to \`search_flights\`, excluded \`Select Flight\`, and separated UI/query state from protected domain effects.
- Order Tracking changed the goal, permitted return-flow initiation, replaced an ambiguous business effect with \`display_return_result\`, and removed the inferred Human confirmation boundary.

### PARALLAX verifies the runtime

Supported at the frozen-Core contract/evidence layer.

Both results were derived by the unchanged generic Core. No application-specific branch, scenario identity, or expected-result override was added. The qualification is that this gate re-audited existing trustworthy execution evidence; it did not repeat native WebMCP execution in a fresh browser context.

Overall conclusion:

~~~text
AI drafts structure.
Human owns meaning.
PARALLAX derives the result from the approved contract and evidence.
~~~

## 7. Gate conclusions

- Core change required: none.
- Developer Contract v1 change required: none.
- Core baseline: unchanged; expected SHA-256 remains \`1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82\`.
- Unsafe external mutation performed: none.
- Production UI changed: no.
- Production redeployed: no.
- Existing validation history overwritten: no.
- Proposed matrix wired into production: no.

## 8. Recommendation

Do not update the production dashboard or public validation matrix yet.

The two Human-approved records and this audit trail are ready for review. After review, the stored validation matrix may be updated to reflect the approved results, with the earlier Order Tracking Parity FAIL retained as historical evidence and clearly labeled as an unsupported initial interpretation.
