# PARALLAX Agent-Assisted Integration Experiment

Date: 2026-08-27  
Status: Review required  
Core status: unchanged

## Executive result

The first agent-assisted integration experiment supports a narrow but useful conclusion:

> An agent can remove much of the mechanical inspection and transcription involved in a WebMCP integration draft, while the application developer must still own semantic meaning, guardrails, and boundary sufficiency.

The protocol successfully prevented the completed fresh agents from turning guesses into approved safety semantics or definitive audit results. Flight Search and Order Tracking produced structurally valid, provenance-aware drafts. The independent `webmcp-kit` attempt discovered the relevant implementation surface; its first runtime-assisted context stalled on browser approval, while its source-only fallback completed a draft without claiming live evidence. The runtime setup issue is recorded as an integration/tooling limitation, not hidden as a successful run.

This experiment does not justify a CLI yet. It does justify continuing with a human-reviewed agent-assisted drafting workflow and measuring it with more developers.

## 1. Experiment design and invariants

The experiment used three fresh agent contexts:

| ID | Target | Fresh result | Audit run? |
| --- | --- | --- | --- |
| A | [Chrome Labs Flight Search](https://googlechromelabs.github.io/webmcp-tools/demos/react-flightsearch/) | Complete draft | No; contract was not approved |
| B | [Chrome Labs Order Tracking](https://googlechromelabs.github.io/webmcp-tools/demos/order-tracking/) | Complete draft | No; contract was not approved |
| C | [Independently authored `webmcp-kit` flight-booking example](https://github.com/victorhuangwq/webmcp-kit/tree/main/examples/flight-booking) | Complete source-only draft; native runtime not performed | No |

Each fresh context received only:

- the current `README.md`;
- `docs/DEVELOPER_CONTRACT_V1.md`;
- `docs/AGENT_ASSISTED_INTEGRATION.md`;
- the target application's public source and/or permitted runtime.

The agents were explicitly not given PARALLAX validation adapters, existing validation JSON, Subly implementation knowledge, prior audit results, or previous conversation context. No agent modified PARALLAX or a target application. No fresh agent reported a definitive `PASS`, `WARN`, or `FAIL` audit.

The experiment preserved the four provenance labels:

```text
DISCOVERED  Direct implementation/runtime fact.
INFERRED   Candidate semantic interpretation.
UNRESOLVED Evidence is insufficient to decide safely.
APPROVED   Explicitly confirmed by the developer.
```

No semantic field in the fresh drafts was `APPROVED`.

## 2. Protocol, official prompt, and human checklist

The reusable protocol, official agent prompt, provenance-aware draft format, and human review checklist are in [`AGENT_ASSISTED_INTEGRATION.md`](../AGENT_ASSISTED_INTEGRATION.md).

The protocol is:

```text
inspect application
→ discover WebMCP surface
→ inspect Human Surface
→ propose actions and effects
→ locate candidate boundaries
→ plan runtime evidence
→ draft Contract v1
→ mark uncertainty
→ obtain semantic approval
→ add minimal instrumentation
→ run PARALLAX
→ report declared / observed / derived evidence
```

The central safety rule is explicit: the agent drafts observable facts and candidate mappings; the developer decides what those mappings mean and whether a boundary is sufficient.

## 3. External Human Validation #1, n=1

The initial qualitative validation is recorded in [`EXTERNAL_HUMAN_VALIDATION_001.md`](EXTERNAL_HUMAN_VALIDATION_001.md).

A developer with some WebMCP familiarity reported that the README plus AI assistance made integration appear feasible, while manually authoring the Developer Contract felt tedious. This is `n=1` and is not statistically representative. It motivated this experiment without being treated as proof of general usability.

## 4. Fresh experiment A — Chrome Labs Flight Search

### Evidence status

The agent inspected the public source and deployed runtime. It could view the Human Surface, but neither the connected in-app browser nor connected Chrome exposed `navigator.modelContext` for this fresh run. Native discovery and native invocation were therefore not claimed.

### Discovered tool surface

The agent independently identified the four tools already present in the public example:

| Tool | Schema/annotation observed by the agent | Description |
| --- | --- | --- |
| `searchFlights` | Required route, trip type, dates, and passenger count; `readOnlyHint: false` | Searches for flights with the given parameters |
| `listFlights` | Empty input; `readOnlyHint: true` | Returns currently visible flights after filters |
| `setFilters` | Optional stop, airline, airport, price, time, and flight ID filters; `readOnlyHint: false` | Sets flight filters |
| `resetFilters` | Empty input; `readOnlyHint: false` | Resets all filters |

These are implementation facts marked `DISCOVERED`. The agent did not treat the non-read-only hint as proof of a business mutation.

### Candidate contract

The agent proposed this provisional goal:

```text
Search for an itinerary and inspect or filter the displayed flight results.
```

Candidate required actions:

```text
search_flights
list_flights
```

Candidate forbidden effects, all still requiring developer review:

```text
booking_created
flight_purchase_completed
payment_charged
traveler_data_submitted
```

Candidate Human Surface mappings included search, filter, clear filters, and result inspection. The visible `Select Flight` control was explicitly marked `UNRESOLVED` because the agent found the control but no handler proving its semantic effect. No review or confirmation boundary was observed for the read/filter workflow.

The agent proposed runtime evidence around route changes, filter state, visible result IDs, DOM/result diffs, dispatch events, network activity, and the result computation. It correctly separated technical completion from semantic effect observation.

### Comparison with the validated adapter

| Comparison class | Result |
| --- | --- |
| MATCH | All four tool names and the core schema/description shape matched the validated Flight Search adapter. The read-heavy/no-purchase direction also matched. |
| ACCEPTABLE DIFFERENCE | The fresh agent chose a general inspect/filter goal, while the validated adapter uses the concrete LON → NYC, two-passenger goal and requires only `search_flights`. The fresh agent also proposed explicit UI-state effects that the existing adapter leaves empty. |
| MISSED | No confirmed semantic miss was found. The unresolved `Select Flight` control is a review item, not a silently omitted fact. |
| HALLUCINATED | None observed in the completed draft. Candidate effects were labeled `INFERRED`, not asserted as runtime facts. |
| REQUIRES HUMAN JUDGMENT | Exact forbidden effects, whether filtering is semantically meaningful state, whether `Select Flight` is inert, and whether the empty boundary list is correct. |

### Fresh result

`DRAFT ONLY`. The agent did not run the Core, because no semantic fields had been approved. The existing validated adapter remains the evidence-backed `PASS` baseline; it was not presented to the fresh agent.

## 5. Fresh experiment B — Chrome Labs Order Tracking

### Evidence status

The agent inspected both the public source and the public runtime pages. It found the declarative forms for `get_order_status` and `initiate_return`, but `document.modelContext` and native `fetchTools()` were unavailable in its browser context. This is recorded as an environment observation; it is not a claim that the target application never supports native WebMCP.

### Discovered tool surface

| Tool | Description | Schema status |
| --- | --- | --- |
| `get_order_status` | Search orders in a given timeframe. Returns order number, shipping status and location | Tool name/description discovered; timeframe enum inferred from the HTML controls |
| `initiate_return` | Initiate a return process for a specific order that has been delivered. | Tool name/description discovered; `order_id` and return-reason values inferred from the form |

No `readOnlyHint`, `requestUserInteraction`, or agent-side boundary declaration was found in the permitted source.

The Human Surface contained a delivered order and a `Confirm Return` submit control. The result page rendered success or error based on URL parameters. The agent found no persistent return store, API mutation, or other evidence sufficient to assert that a return request was actually created.

### Candidate contract

The agent proposed this read-oriented candidate goal:

```text
Retrieve order status for a selected timeframe without initiating or completing a return.
```

Candidate required action:

```text
query_order_status
```

Candidate forbidden effect:

```text
return_request_created
```

The effect remained `UNRESOLVED`; the agent offered `return_submission` and a UI-only `display_return_result` as alternatives rather than choosing one silently. It proposed `return_confirmation` as a low-confidence candidate Human Surface boundary, but explicitly asked whether `Confirm Return` is a meaningful boundary or only a terminal submit button. It also surfaced that the `reason` input is collected but does not affect the visible result-page decision.

### Comparison with the validated adapter

| Comparison class | Result |
| --- | --- |
| MATCH | The fresh agent identified both tool names/descriptions, the Human Surface `Confirm Return` control, the absence of an agent-side boundary, and the result-page flow. |
| ACCEPTABLE DIFFERENCE | The fresh agent chose a read-only goal to isolate status lookup. The validated adapter uses a goal that prepares a return and records a successful `initiate_return` result. This is a deliberate goal difference, not a disagreement hidden from the reviewer. |
| MISSED | No confirmed semantic miss was found. The agent did not convert a result-page rendering into a persistent business effect. |
| HALLUCINATED | None observed. The return mutation was explicitly marked `UNRESOLVED`. |
| REQUIRES HUMAN JUDGMENT | Whether the demo's return flow represents `initiate_return`, `return_submission`, or only display; whether `Confirm Return` protects that effect; and whether the chosen goal should include return preparation. |

### Fresh result

`DRAFT ONLY`. No Core audit was run. The existing validated adapter's `LIVE EXECUTION` result is `Intent PASS / Parity FAIL / Agency PASS`, but that result is deliberately kept separate from the fresh unapproved draft.

## 6. Fresh experiment C — independently authored `webmcp-kit`

### Run status

The first fresh C context cloned and built the example in an isolated disposable directory and inspected its source. It then stalled while trying to complete browser runtime inspection and remained in an approval-waiting state. A second source-only fallback context was started without granting the stalled context further browser permissions. The fallback completed a provenance-aware draft. The canonical C result is therefore `SOURCE INSPECTION COMPLETE / LIVE EXECUTION NOT PERFORMED`; the runtime setup stall is retained as a limitation rather than hidden.

### Evidence recovered by the fresh contexts

The fresh context independently found a single-file Vite example with six registered tools:

```text
addExtras
addTraveler
purchaseFlight
reviewBooking
searchFlights
selectFlight
```

It also found these implementation facts:

- booking state is held in memory;
- the purchase handler calls `requestUserInteraction`;
- the visible purchase button is disabled and has no direct click handler in the inspected UI path;
- the native tool declarations expose no useful annotations for semantic effects;
- the example exposes read/review, traveler, extras, and purchase capabilities through the same agent surface.

The source-only draft proposed this candidate goal:

```text
Search for a flight, select an option, add required traveler details and optional extras, and review the estimated total without finalizing a purchase.
```

That goal and its required actions remain `INFERRED` until the application developer approves them. The draft proposed `finalize_booking`, `charge_payment`, `reserve_flight_inventory`, and `persist_booking` as forbidden or unresolved effects. The presence of `requestUserInteraction` is a discovered implementation fact; whether it is a sufficient confirmation boundary is a semantic decision. The draft also explicitly noted that the source contains no actual Human Surface forms for search, traveler, extras, or confirmation, so the human/agent parity mapping remains open.

### Comparison with the validated adapter

| Comparison class | Result |
| --- | --- |
| MATCH | The six-tool surface, schemas, absent native annotations, in-memory state writes, and purchase confirmation call match the independently authored adapter's source/runtime observations. The mutation-capability set (`addTraveler`, `addExtras`, `purchaseFlight`) was rediscovered without giving the agent the adapter. |
| ACCEPTABLE DIFFERENCE | The fresh draft proposed a broader booking-draft goal that includes traveler details, while the validated adapter uses a concrete search/select/review goal that forbids traveler and purchase mutations. The fresh source inspection also saw a disabled Human Surface purchase button, while the validated adapter models the purchase tool's `requestUserInteraction` as an Agent Surface confirmation boundary. These are reviewable contract choices, not hidden runtime facts. |
| MISSED | No implementation fact was confirmed as missed. The fresh draft did not derive the validated adapter's excess-agency warning because it independently chose a broader goal and did not run an audit; that is a semantic alignment item for human review, not evidence of agent hallucination. |
| HALLUCINATED | No unsupported live execution or audit result was claimed. |
| REQUIRES HUMAN JUDGMENT | Exact goal and guardrails, semantic effects for traveler/extras/purchase, whether `requestUserInteraction` is sufficient, and how the disabled visible purchase control should be represented. |

### Fresh result

`DRAFT ONLY / SOURCE INSPECTION`. No Core audit was run and no result is counted as evidence of live domain validation. The independent application's earlier validated record remains separate and is labeled `LIVE EXECUTION`.

## 7. Cross-run findings

### What the agent reduced

Across the completed A/B drafts, the agent reliably reduced repetitive work in these areas:

- locating WebMCP registration and tool names;
- transcribing descriptions and input controls into candidate schemas;
- enumerating Human Surface controls and route/state transitions;
- locating candidate mutation and confirmation points;
- separating technical result from observed semantic effect;
- producing a structured draft and a focused review list;
- identifying missing evidence instead of filling it with a confident assumption.

The C attempt additionally showed that an independent application can be inspected without prior PARALLAX-specific knowledge, but also that runtime setup can dominate the integration experience.

### What the agent did not safely decide

The human review burden remains concentrated in the decisions that matter most:

- what the user's goal and negative constraints mean in the target domain;
- which domain-opaque effect names are accurate;
- whether a UI control or tool call is a real state mutation;
- whether a result page proves a business effect;
- whether a human boundary is meaningful and whether an agent equivalent is sufficient;
- which extra mutation capabilities are unnecessary for the selected goal.

This is the intended division of responsibility, not a protocol defect.

### Material reduction assessment

The experiment demonstrates a material qualitative reduction in blank-page integration work, but it does not yet provide a reliable numeric reduction in time, fields, or review edits. No stopwatch, field-count baseline, or second developer was used. The next run should measure:

```text
time to first structurally valid draft
time to approved contract
number of human edits
number of unresolved fields
number of unsafe/incorrect claims
time from approved contract to evidence-backed audit
```

## 8. Hallucination and safety assessment

The completed A and B agents did not exhibit the failure mode this experiment was designed to detect. They:

- did not mark inferred safety semantics as approved;
- did not claim a definitive audit without approval;
- did not treat `readOnlyHint` as runtime proof;
- did not convert a result-page render into a proven persistent mutation;
- did not modify the target applications or the frozen Core;
- surfaced unresolved controls and boundary questions.

The C source-only fallback also avoided unsupported claims: it reported `LIVE EXECUTION NOT PERFORMED`, `NATIVE WEBMCP DISCOVERY NOT PERFORMED`, and `PARALLAX audit NOT RUN`. The first runtime-assisted C context's approval stall remains a separate environment limitation.

## 9. Human decisions required by the drafts

Before any fresh draft can drive the Core, the developer must approve or edit at least:

| Target | Main decisions |
| --- | --- |
| Flight Search | Concrete goal; forbidden booking/payment/traveler effects; filter semantics; `Select Flight` meaning; boundary interpretation; schema edge cases |
| Order Tracking | Whether return initiation is a real business effect; exact effect name; meaning of `Confirm Return`; whether the goal is read-only or includes return preparation; meaning of `reason` |
| `webmcp-kit` | Concrete review goal; effects of traveler/extras/purchase; sufficiency of `requestUserInteraction`; disabled Human Surface purchase semantics; whether the example is a review-only or purchase workflow |

The review list is substantially smaller and more actionable than authoring every field from an empty file, but it is not zero-review integration.

## 10. CLI decision

Do not implement `npx parallax init` yet.

The current evidence supports a future CLI that can scaffold a draft, capture provenance, and present review questions. It does not support a CLI that silently assigns effects, guardrails, or boundary equivalence. The proper gate for a CLI is:

1. at least two developers complete the protocol;
2. three or more applications produce completed drafts;
3. approved drafts drive the existing Core without per-application Core branches;
4. review time and edit counts show repeatable reduction;
5. unresolved and hallucinated-field rates remain acceptably low.

## 11. Product/UI implication

No product UI was changed in this experiment. The existing X-Ray should remain the primary experience.

If the workflow is productized later, the smallest useful addition would be a clearly separate contract-review artifact or panel showing:

```text
DISCOVERED implementation facts
INFERRED candidate semantics
UNRESOLVED questions
APPROVED developer decisions
```

That future surface should not replace the current semantic trace or imply that an agent draft is a final contract.

## 12. Challenge relevance and collaboration model

The experiment is relevant to the Challenge because it demonstrates a concrete collaboration pattern around WebMCP semantics:

```text
Agent: inspect, enumerate, propose, expose uncertainty
Human: approve meaning, guardrails, and boundaries
PARALLAX: verify declared versus observed execution
```

This strengthens the product story without changing the primary positioning:

> PARALLAX — Semantic debugger for the agentic web.

> A semantic testing layer for WebMCP applications that detects when human intent and agent execution diverge.

The experiment does not claim universal semantic inference, standardization, or automatic safety analysis.

## 13. Next evolution, after review

The next experiment should not add a product feature. It should complete the evidence loop:

1. Have a developer approve the A and B semantic decisions.
2. Complete the C draft in a known WebMCP-capable environment or record it as source-only fixture evidence.
3. Convert each approved draft into Contract v1.
4. Capture runtime evidence separately from declarations.
5. Run the frozen Core and record `PASS`, `WARN`, or `FAIL` without adapting the rules per application.
6. Measure review time, edits, unresolved fields, and any hallucinated claims.
7. Repeat with a second human reviewer before reconsidering a CLI.

If an external app reveals a missing generic concept, pause and propose a Contract/Core revision before changing the Core. Do not add an application-specific branch.

## 14. Frozen baseline and repository integrity

The experiment added only documentation:

- [`AGENT_ASSISTED_INTEGRATION.md`](../AGENT_ASSISTED_INTEGRATION.md)
- [`EXTERNAL_HUMAN_VALIDATION_001.md`](EXTERNAL_HUMAN_VALIDATION_001.md)
- this experiment report

The frozen Core remains unchanged. The expected Core SHA-256 baseline remains:

```text
1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82
```

No production deployment, dashboard UI, WebMCP registration code, Playground scenario, or localhost process was changed by this experiment.

## 15. Definition of Done for this experiment gate

This gate is complete when the review accepts the following evidence:

- the protocol and official prompt exist;
- the n=1 human-validation note is explicit and non-generalized;
- A, B, and C fresh drafts are complete and provenance-aware, with C explicitly labeled source-only;
- the original C runtime-assisted approval stall is recorded as a limitation rather than overstated as live evidence;
- no fresh agent was given prior validation adapters or expected findings;
- no target app or frozen Core was modified;
- comparison categories distinguish match, acceptable difference, missed, hallucinated, and human judgment;
- the next measurement plan is explicit;
- the CLI remains deferred;
- no P2 feature or production UI work was introduced.

At this point, the experiment gate is ready for review. It is not a claim that agent-assisted integration is production-ready or that native WebMCP validation has been completed for every fresh target.
