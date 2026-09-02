# PARALLAX Demo Video Plan

Target duration: 2:20–2:45
Hard limit: never exceed 3:00
Primary source: production Sites version 7
Reviewed SHA: 188b0962a3f88200046ada924e790859ee1438ac

## Story

The video should answer one question:

> Can an agent complete every technical step and still violate what the user meant?

The answer is shown through the same goal before and after the controlled fix. The video then proves that the model is broader than Subly with two small external validation views and one real native WebMCP invocation.

## Exact structure

| Time | Segment | On-screen action | Spoken point |
| --- | --- | --- | --- |
| 0:00–0:15 | Hook / problem | Show PARALLAX, the exact goal, and the phrase “200 OK. Semantically wrong.” | WebMCP can succeed technically while diverging semantically. |
| 0:15–0:50 | BROKEN | Start Subly BROKEN. Show inspect_plan → compare_plans → recommended_upgrade. Hold on HTTP 200, Pro activated, $20 charged, and the X-Ray drift marker. | This is a controlled regression fixture. The call succeeds, but it violates the explicit no-change guardrail. |
| 0:50–1:15 | FIXED | Switch to FIXED without editing the goal. Run inspect_plan → compare_plans → recommend_plan. Show recommendation returned and no mutation. | The same goal now uses a read-only recommendation action. Intent and parity pass. Agency WARN remains honest because mutation tools are still exposed. |
| 1:15–1:45 | v2 generality | Show Tagboard rejected, then The Archive. Keep authority labels visible. | Policy REJECT / EFFECT PREVENTED is not technical failure. COMPLEMENTARY Human/Agent surfaces are not a parity defect. |
| 1:45–2:10 | Native WebMCP | Invoke run_parity_audit through the native page tool. Show the structured return and the visible execution-log entry. | PARALLAX itself exposes page-defined WebMCP meta-tools, and the audit can be invoked through the native surface. |
| 2:10–2:20 | Close | Return to the X-Ray overview and product line. | PARALLAX tests whether the website meant the same thing to the human and the agent. |

## Recording rules

- Keep the exact goal unchanged between BROKEN and FIXED.
- Say “controlled simulated playground” before showing the simulated charge.
- Do not imply a real payment, subscription, or third-party Subly defect.
- Do not present a UI button click as the native WebMCP invocation.
- The native invocation must be a real page-tool/native WebMCP call in the validated Chrome 151 environment.
- Show the result contrast long enough to read: Technical PASS / HTTP 200 beside Semantic FAIL.
- Leave the FIXED Agency WARN visible; do not hide it with a crop.
- Keep external contexts short. They prove generality; they are not a second demo.
- If native WebMCP stalls, use a captured native validation clip and label it captured.

## On-screen overlays

Use only one overlay at a time, in an unused margin:

| Time | Overlay |
| --- | --- |
| 0:00–0:15 | HTTP 200 ≠ Semantic Success |
| 0:30–0:50 | Technical PASS / Semantic FAIL |
| 1:15–1:45 | Policy REJECT ≠ Technical Failure, then Semantic Parity ≠ Surface Equality |
| 1:45–2:10 | DECLARED → OBSERVED → DERIVED |

Do not cover the goal, the result cards, the drift marker, authority labels, or the native execution log.
