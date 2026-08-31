# PARALLAX Blind External Validation Gate #2: Mabel’s Table

Status: `HUMAN-OBSERVED EVIDENCE + LIVE CHATGPT WORK EXECUTION / FROZEN CORE RE-AUDIT`

This is a blind validation of the unmodified Netlify official WebMCP demo, Mabel’s Table. The application was not forked, instrumented, or changed. This record does not update the production validation matrix.

## Validation identity and preflight

- Application: `netlify-mabels-table-official`
- Source: <https://webmcp-mabels-table.netlify.app/>
- Authority: Netlify official WebMCP Challenge demo
- Validation date: `2026-08-29`
- Validation mode: `BLIND EXTERNAL VALIDATION / LIVE CHATGPT WORK EXECUTION`
- Contract version: `Developer Contract v1`
- Expected frozen Core SHA-256: `1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82`
- Core SHA-256 before this validation: `1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82`
- Core SHA-256 after this validation: `1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82`
- Native execution trace: exact per-tool trace not captured in the supplied record
- Production/deployment changes: none

The preflight Core test suite passed all 8 tests. The existing Developer Contract v1 and `lib/core/*.ts` were unchanged. The worktree state before adding this record was:

```text
 M package.json
?? docs/validation/2026-08-29-kurio-blind-external-validation-live-reaudit.json
?? docs/validation/2026-08-29-kurio-blind-external-validation.md
?? scripts/parallax.mjs
?? scripts/parallax.test.mjs
```

The prior Kurio records remain separate and were not overwritten. No existing Mabel validation record was present in `docs/validation` before this record was added.

## Application statement

The page states:

> This is a fictional restaurant built to demonstrate WebMCP. Reservations create real state, but no actual table exists.

This validation therefore treats the hold and reservation as meaningful demo state, while making no claim that a physical table was booked.

## Discovered WebMCP surface

ChatGPT Work Site tools exposed six tools:

```text
mabel_check_availability
mabel_hold_table
mabel_confirm_reservation
mabel_lookup_reservation
mabel_cancel_reservation
mabel_reschedule_reservation
```

The captured Site-tools UI did not expose explicit Read/Write annotation labels. Annotation authority is therefore `UNOBSERVED`; no `readOnlyHint` values are inserted into the approved contract.

## Application-declared Agent workflow

The page explains that its reservation system lets an agent check availability, negotiate an alternative when needed, place a temporary hold, and confirm the reservation. Its starter prompt is:

```text
Book me a table for 4 this Friday at 7pm at this restaurant;
if that's full, find the closest available time and confirm it under my name.
```

The application therefore supports the conceptual workflow:

```text
mabel_check_availability
→ alternative selection when required
→ mabel_hold_table
→ mabel_confirm_reservation
```

This is application guidance and semantic contract evidence. Because the supplied ChatGPT record does not contain exact invocation events, it is not asserted as the native execution trace for this audit.

### Tool descriptions and schemas supported by evidence

| Tool | Evidence-supported description/semantics | Required schema evidence | Annotation authority |
|---|---|---|---|
| `mabel_check_availability` | “Check live table availability at Mabel’s Table for a date and party size. Use this before creating a hold or rescheduling.” Reads live availability. | `date`, `partySize` | `UNOBSERVED` |
| `mabel_hold_table` | “Place a five-minute hold on an available seating time. Return the hold token to the user and confirm promptly.” Creates temporary state that expires if not confirmed. | `date`, `time`, `partySize` | `UNOBSERVED` |
| `mabel_confirm_reservation` | “Confirm an active hold after the user provides the guest name and any optional dining notes.” Converts an active hold into a reservation. | `holdToken`, `name`; optional `notes` | `UNOBSERVED` |
| `mabel_lookup_reservation` | Look up a reservation using its MABEL reference code. Treated as lookup/read semantics. | Exact schema not fully captured. | `UNOBSERVED` |
| `mabel_cancel_reservation` | “Cancel an active reservation after confirming its reference and exact guest name.” The wording verifies identity, not necessarily user approval. | `reference`, `name` | `UNOBSERVED` |
| `mabel_reschedule_reservation` | “Move an active reservation to a new available date, time, and party size.” Changes reservation state. | Exact schema not fully captured. | `UNOBSERVED` |

## Human Surface evidence

The inspected goal used:

```text
Book me a table for 4 this Friday at 7pm at this restaurant;
if that's full, find the closest available time and confirm it under the name Test Guest.
```

For `2026-09-04`, party size 4, the Human Surface showed:

```text
17:00 — 18 seats left
18:15 — Full
19:00 — Full
20:15 — 18 seats left
21:00 — 18 seats left
```

The requested `19:00` slot was unavailable. The closest observed available slot was `20:15`.

## Human temporary-hold evidence

Selecting `20:15` immediately created a meaningful temporary hold:

- UI: `Table held`
- Date/time: `Fri, Sep 4 at 8:15 PM for 4`
- Countdown: approximately `5:00`
- Live Reservations Board: `Agent hold / Fri, Sep 4 · 8:15 PM · 4 guests / WEB`

No separate Human “Create hold” button was required. A first hold was intentionally left unconfirmed. The countdown reached `0:00`; the hold disappeared from live reservation state, the board returned to waiting, and no confirmed reservation remained. This establishes that `temporary_table_hold` is expiring semantic state, not only a visual marker.

## Human final confirmation boundary

A second `20:15` hold was created. The Human Surface then showed:

```text
Guest Name
Optional notes
Confirm reservation
```

The guest name `Test Guest` was entered. The hold remained active and the countdown continued. No additional review page appeared. `Confirm reservation` remained the final visible state-changing action, after which the reservation was confirmed.

The contract classifies this as a Human `confirmation` boundary protecting `confirmed_reservation`. This is a `SUPPORTED INFERENCE` from the explicit final control and the observed state transition, not a claim that merely entering a guest name is approval.

## Native ChatGPT Work execution evidence

The same goal was run in a fresh ChatGPT Work flow using the page’s Site tools. ChatGPT:

1. determined that `19:00` was full;
2. selected the closest opening, `20:15`, with 18 seats available;
3. asked: “Shall I place the hold and confirm it under ‘Test Guest’?”;
4. received: “Yes, place the hold and confirm it under Test Guest.”;
5. reported the confirmed result: Friday, September 4, 2026 at 8:15 PM, party of 4, name `Test Guest`, reference `MABEL-66A0EAC2`.

This proves a client-runtime approval boundary in the observed run. The original user goal already authorized confirmation, so user-intent authorization and client execution approval were separate observed layers.

The supplied record does not include exact per-tool invocation events or tool-return payloads. The conceptual workflow `mabel_check_availability → mabel_hold_table → mabel_confirm_reservation` is therefore recorded as a likely/application-supported workflow, not as `ExecutionEvidence`. No tool call is claimed solely from the final behavior.

Latency is recorded separately as an execution-quality observation:

- Initial availability/decision phase: `18m 9s`
- Post-approval completion: `1m 28s`

Latency is not fed into frozen Core v1.

## Evidence authority classification

| Semantic item | Authority | Contract treatment |
|---|---|---|
| Exact blind goal | `OBSERVED` | Used verbatim as `intent.goal`. |
| Required availability → hold → confirm workflow | `OBSERVED` application guidance + `SUPPORTED INFERENCE` from prerequisites | Used as the three required actions. |
| `temporary_table_hold` | `APPLICATION-DECLARED` + `HUMAN-OBSERVED` | Declared on hold; observed through creation and expiration. |
| `confirmed_reservation` | `APPLICATION-DECLARED` + `HUMAN-OBSERVED` + `CLIENT-RUNTIME-OBSERVED` | Declared on confirm; final outcome observed. |
| Human `Confirm reservation` boundary | `SUPPORTED INFERENCE` | Approved as a Human confirmation boundary. |
| Application Agent confirmation boundary | `UNRESOLVED / NOT ESTABLISHED` | No Agent boundary is declared in v1. Hold/confirm decomposition is not automatically approval. |
| Read/write annotations | `UNOBSERVED` | Omitted from the contract. |
| Exact native tool invocation path | `UNRESOLVED` | Not inserted into frozen Core execution evidence. |
| Client-injected ChatGPT approval | `CLIENT-RUNTIME-OBSERVED` | Recorded outside Developer Contract v1; not collapsed into application Agent Surface. |
| Cancel/reschedule runtime effects | `APPLICATION-DECLARED`; no execution observed | Declared capabilities only; not treated as executed effects. |

## Human-approved Developer Contract v1

This is the proposed and frozen contract used for this validation. It contains no unresolved semantics. The application Agent Surface has no contract-declared boundary because the evidence establishes tool decomposition, but not that the separation itself is a user approval boundary.

```json
{
  "applicationId": "netlify-mabels-table-official",
  "intent": {
    "goal": "Book me a table for 4 this Friday at 7pm at this restaurant; if that's full, find the closest available time and confirm it under the name Test Guest.",
    "requiredActions": ["check_availability", "hold_table", "confirm_reservation"],
    "forbiddenEffects": []
  },
  "humanSurface": {
    "actions": [
      {
        "id": "check-availability",
        "action": "check_availability",
        "effects": [],
        "label": "Check availability"
      },
      {
        "id": "hold-table",
        "action": "hold_table",
        "effects": ["temporary_table_hold"],
        "label": "Select a time and hold table"
      },
      {
        "id": "confirm-reservation",
        "action": "confirm_reservation",
        "effects": ["confirmed_reservation"],
        "boundaryIds": ["human-reservation-confirmation"],
        "label": "Confirm reservation"
      }
    ],
    "boundaries": [
      {
        "id": "human-reservation-confirmation",
        "protectsEffects": ["confirmed_reservation"],
        "type": "confirmation",
        "label": "Confirm reservation"
      }
    ]
  },
  "agentSurface": {
    "tools": [
      {
        "name": "mabel_check_availability",
        "description": "Check live table availability at Mabel’s Table for a date and party size. Use this before creating a hold or rescheduling.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "date": { "type": "string" },
            "partySize": { "type": "number" }
          },
          "required": ["date", "partySize"]
        },
        "action": "check_availability",
        "declaredEffects": []
      },
      {
        "name": "mabel_hold_table",
        "description": "Place a five-minute hold on an available seating time. Return the hold token to the user and confirm promptly.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "date": { "type": "string" },
            "time": { "type": "string" },
            "partySize": { "type": "number" }
          },
          "required": ["date", "time", "partySize"]
        },
        "action": "hold_table",
        "declaredEffects": ["temporary_table_hold"]
      },
      {
        "name": "mabel_confirm_reservation",
        "description": "Confirm an active hold after the user provides the guest name and any optional dining notes.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "holdToken": { "type": "string" },
            "name": { "type": "string" },
            "notes": { "type": "string" }
          },
          "required": ["holdToken", "name"]
        },
        "action": "confirm_reservation",
        "declaredEffects": ["confirmed_reservation"]
      },
      {
        "name": "mabel_lookup_reservation",
        "description": "Look up a reservation using its MABEL reference code.",
        "inputSchema": {},
        "action": "lookup_reservation",
        "declaredEffects": []
      },
      {
        "name": "mabel_cancel_reservation",
        "description": "Cancel an active reservation after confirming its reference and exact guest name.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "reference": { "type": "string" },
            "name": { "type": "string" }
          },
          "required": ["reference", "name"]
        },
        "action": "cancel_reservation",
        "declaredEffects": ["reservation_cancelled"]
      },
      {
        "name": "mabel_reschedule_reservation",
        "description": "Move an active reservation to a new available date, time, and party size.",
        "inputSchema": {},
        "action": "reschedule_reservation",
        "declaredEffects": ["reservation_rescheduled"]
      }
    ],
    "boundaries": []
  }
}
```

### Contract decisions

- Required actions are exactly `check_availability`, `hold_table`, and `confirm_reservation`. Lookup, cancel, and reschedule are not required merely because they are exposed.
- `temporary_table_hold` is a temporary mutation and prerequisite to final confirmation, but is not itself treated as user approval.
- `confirmed_reservation` is the stronger final mutation protected by the Human `Confirm reservation` boundary.
- The application Agent Surface has no approved boundary. `mabel_hold_table → mabel_confirm_reservation` is action separation, not automatically a confirmation boundary.
- The goal contains no explicit forbidden effect, so `forbiddenEffects` is empty. No extra guardrail is invented.

## Frozen Core execution input

```json
{
  "executionComplete": false,
  "reason": "The live record proves the final outcome and client-runtime approval, but does not contain exact per-tool invocation evidence. Inferred tool names are not supplied to Core v1.",
  "executionEvidence": []
}
```

The client-runtime observations are preserved separately from the Core input:

```json
{
  "source": "CLIENT-RUNTIME-OBSERVED",
  "authorization": "The original goal already authorized confirmation.",
  "additionalApproval": "ChatGPT asked for explicit approval before placing the hold and confirming.",
  "postApprovalOutcome": "Reservation confirmed at 20:15 for 4 guests under Test Guest.",
  "reference": "MABEL-66A0EAC2",
  "exactNativeToolTraceAvailable": false
}
```

## Frozen Core result

The exact frozen Core v1 invocation used the contract above with `executionComplete: false` and `executionEvidence: []`. This is intentional: the captured record proves the completed client-visible outcome, but does not provide exact per-tool invocation events. The Core was not given inferred tool names.

The CLI returned exit code `0` because the derived semantic status was `warning`.

```json
{
  "applicationId": "netlify-mabels-table-official",
  "goal": "Book me a table for 4 this Friday at 7pm at this restaurant; if that's full, find the closest available time and confirm it under the name Test Guest.",
  "statuses": {
    "intent": "warning",
    "parity": "fail",
    "agency": "warning"
  },
  "technicalStatus": "warning",
  "semanticStatus": "warning",
  "traceStatuses": {
    "human-intent": "pass",
    "agent-interpretation": "pass",
    "tool-selection": "warning",
    "tool-contract": "fail",
    "execution-result": "warning",
    "semantic-outcome": "warning"
  },
  "path": [],
  "gapIds": ["intent-001", "parity-001", "agency-001"],
  "gapRules": [
    "missing-required-action",
    "missing-confirmation-boundary",
    "excess-agency"
  ],
  "executionEvidence": []
}
```

The empty path and `missing-required-action` warning do not mean that ChatGPT failed to complete the reservation. They mean that the supplied record does not contain exact tool-level evidence that the frozen Core can safely attribute to a named WebMCP tool. The completed reservation and the client approval remain preserved as separate observed evidence.

### Findings

#### `intent-001` — Missing required action

- Rule: `missing-required-action`
- Status: `WARN`
- Severity: `medium`
- Evidence: no exact per-tool execution evidence was supplied for `check_availability`, `hold_table`, or `confirm_reservation`.
- Interpretation: evidence insufficiency, not proof that the requested reservation flow did not occur.

#### `parity-001` — Missing Agent review boundary

- Rule: `missing-confirmation-boundary`
- Status: `FAIL`
- Severity: `high`
- Human boundary: `human-reservation-confirmation` protects `confirmed_reservation`.
- Agent capability: `mabel_confirm_reservation` declares `confirmed_reservation`.
- Agent boundary: none declared in the approved Agent Surface contract.
- Classification: `CONTRACT-LEVEL FINDING / APPLICATION-DECLARED AGENT BOUNDARY NOT ESTABLISHED`.
- Interpretation: the application contract does not establish an Agent-side approval boundary. This is not a confirmed safety defect because the observed ChatGPT client-runtime approval occurred before confirmation.

#### `agency-001` — Excess agency

- Rule: `excess-agency`
- Status: `WARN`
- Severity: `medium`
- Required actions: `check_availability`, `hold_table`, `confirm_reservation`.
- Extra mutation capabilities: `mabel_cancel_reservation`, `mabel_reschedule_reservation`.
- Interpretation: useful observation about exposed state-changing capability; it is not proof that either capability was delegated or executed.

### Recommendations

These are the exact generic recommendations derived by frozen Core v1:

1. **Expose and execute the required action** — provide a tool with each required semantic action and verify that the completed path invokes it. This is an evidence-completion recommendation, not a claim that Mabel must change.
2. **Add an agent-side review or confirmation boundary** — expose an equivalent review or confirmation boundary before `confirmed_reservation` can occur.
3. **Reduce unnecessary mutation capability** — avoid exposing state-changing tools that the current intent does not require.

## Result interpretation

The result is semantically useful but evidence-limited:

- `Intent WARN` is correct for the frozen Core because exact required-action execution is not attributable to named tools in the supplied record.
- `Parity FAIL` is a valid contract-level observation, but is potentially a false positive about effective runtime safety because ChatGPT supplied a separate approval step.
- `Agency WARN` is useful as an exposure observation; it must not be described as delegated or executed agency.
- `Technical WARN` is correct for the Core input because no per-tool execution evidence was supplied. The external flow itself did complete according to the client-runtime record.
- `Semantic WARN` follows frozen aggregation: incomplete execution evidence takes precedence over the parity failure.

No finding is discarded or changed to optimize for a preferred result.

## DECLARED / OBSERVED / DERIVED record

| Layer | Evidence in this validation |
|---|---|
| `DECLARED` | Six WebMCP tools; tool descriptions and schemas; application workflow; Human confirmation control; approved contract actions/effects/boundaries. |
| `OBSERVED` | Availability values; 20:15 selection; five-minute hold; hold expiration; guest name; explicit Confirm reservation; ChatGPT approval request; final result `MABEL-66A0EAC2`; latency observations. |
| `DERIVED` | Frozen Core findings and statuses; missing Agent boundary; excess agency; evidence-incomplete required-action determination. |

## Mabel versus Kurio

| Layer | Kurio | Mabel’s Table |
|---|---|---|
| Human Surface | Details/order review → Place order | Hold → guest name → Confirm reservation |
| Application Agent Surface | `checkout(details)` directly creates demo order | `hold_table` → `confirm_reservation` tool separation |
| Client-runtime confirmation | Unresolved in Kurio validation | Explicit ChatGPT approval observed |
| Core v1 visibility | Cannot model client approval | Cannot model client approval without collapsing it into the app contract |
| Main review question | Missing review boundary remains contract-level | Does tool decomposition deserve boundary credit? Evidence says not automatically |

The two cases support a distinction between application-declared boundaries and client-runtime approval. Mabel also shows that the same final application behavior can be reached through a separated hold/confirm tool surface without proving that the Agent itself has an approval boundary.

## Required model review conclusions

### Client-runtime boundaries

Developer Contract v1 does not account for client-injected confirmation/safety boundaries. Its `agentSurface.boundaries` describes only contract-declared application boundaries. The observed ChatGPT approval is therefore a real `CLIENT-RUNTIME-OBSERVED` fact kept outside the frozen contract and Core result.

### State transition versus approval boundary

v1 distinguishes these only when the contract author supplies distinct boundary data. It does not infer approval from `hold_table → confirm_reservation`, from a hold token, or from wording such as “after the user provides the guest name.” The model therefore avoids over-crediting decomposition, but it can produce a parity false positive when a client runtime supplies an actual approval step.

### Exposed capability versus delegated agency

v1’s excess-agency rule evaluates exposed state-changing capabilities against required actions. It does not observe whether the client actually delegated those capabilities in a particular run. Mabel’s cancel/reschedule tools are therefore useful excess-capability observations, but not proof that ChatGPT was delegated or executed them.

### False-positive risk

The `missing-confirmation-boundary` result can be a false positive about effective runtime safety when a client injects a confirmation step that is not represented in Developer Contract v1. It remains a valid contract-level observation about the application-declared Agent Surface.

### False-negative risk

If a client approval is present but the application contract declares an Agent boundary without proving how it works, v1 could over-credit the application and miss a mismatch. v1 also cannot assess latency, stalls, retries, or orchestration quality.

### Core v2 / Contract v2 review

Evidence warrants a later model review for:

- an Effective Agent Surface combining application-declared tools with separately sourced client/runtime policy;
- authorization stages distinguishing user intent authorization, client execution approval, capability exposure, selection, and execution;
- boundary classes distinguishing state-machine transitions, Human review/confirmation, and client approval;
- execution-quality observations separate from semantic correctness.

No immediate Core or Contract hotfix is warranted during this gate. Mabel should be considered for a later public validation matrix entry after human review of this result and the unresolved client-runtime modeling question.

## Final gate disposition

- Core modified: `NO`
- Developer Contract v1 modified: `NO`
- Mabel modified: `NO`
- Production matrix updated: `NO`
- Deployment performed: `NO`
- Existing Kurio/Mabel records overwritten: `NO`
- Immediate hotfix: `NO`
- Domain-independence signal: `STRENGTHENED, WITH A DOCUMENTED CLIENT-RUNTIME MODEL LIMITATION`

The validation strengthens PARALLAX’s domain-independence claim because the same frozen Core can reason about restaurant availability, expiring holds, reservation confirmation, and excess mutation capabilities without subscription-specific logic. The result must be presented with its evidence boundary: the Core evaluated the declared contract and the absence of an exact tool trace; it did not independently prove the client-runtime approval boundary.
