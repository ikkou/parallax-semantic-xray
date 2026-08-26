# PARALLAX External Validation Plan

The external suite demonstrates that the same generic Core evaluates WebMCP applications PARALLAX did not author. It is intentionally an adapter-and-evidence workflow, not a URL crawler.

## Validation record

Each case stores:

```ts
type ValidationCase = {
  applicationId: string;
  source: string;
  mode: "LIVE EXECUTION" | "CAPTURED VALIDATION FIXTURE";
  contract: DeveloperContract;
  goal: string;
  guardrails: string[];
  webmcpToolSnapshot: unknown;
  executionEvidence: ExecutionEvidence[];
  audit: AuditResult;
};
```

The `mode` field is mandatory in reports. A captured fixture is never presented as a live browser run.

## Initial order

1. **Chrome Labs Flight Search** — read-heavy PASS baseline. The suite must be able to return `PASS` when the declared and observed evidence agree; it must not manufacture a gap.
2. **CineFlow** — inspect selection, checkout semantics, and the presence or absence of a finalization boundary.
3. **Order Tracking / Returns** — return initiation versus return mutation, review, and confirmation.
4. **Hotel Chain** — booking finalization and confirmation semantics.
5. **Independently authored application** — prioritize `webmcp-kit`, `webmcp-ecommerce-example`, or another credible public example if it provides a clearer contract and observable evidence.

The minimum evidence target is two Chrome Labs applications plus one independently authored application. Suitable cases can return `PASS`, `WARN`, or `FAIL`; all three are valid outcomes.

## Integration method

The developer of the external application supplies or co-locates:

- the Developer Contract v1;
- the human action and boundary semantics;
- WebMCP tool metadata and a native tool snapshot;
- runtime effect instrumentation or state-diff evidence;
- the goal and forbidden effects;
- the execution completeness signal.

PARALLAX then calls the unchanged `runSemanticAudit()` interface. If a case exposes a genuinely generic missing concept, the contract revision must be documented, all Core tests rerun, and Subly rerun before the case is accepted.

## Evidence language

External findings are semantic design observations. Unless independent evidence supports a stronger claim, reports should say:

> PARALLAX observed that the Human Surface contains an explicit review boundary while the Agent Surface exposes the state-changing action directly.

They should not call the result a vulnerability, security flaw, or bug by default.

## Current live records

The current external cases have records from the flagged Chrome 151 environment:

- `docs/validation/2026-08-26-flight-search.json` — `PASS` read-heavy baseline.
- `docs/validation/2026-08-26-cineflow.json` — `WARN` because `update_location` is an exposed mutation capability not required by the selected goal; no payment tool was exposed and no payment was executed.
- `docs/validation/2026-08-26-order-tracking.json` — `FAIL` on parity: the native `initiate_return` path reaches a successful return result, while the Human Surface's `Confirm Return` boundary has no Agent Surface equivalent.
- `docs/validation/2026-08-26-independent-webmcp-kit-flight.json` — `WARN` on agency: the independently authored SkyHop Flights example passes the read/review goal, while traveler, extras, and purchase mutation tools remain exposed.

The independent candidate comparison selected `webmcp-kit` over `webmcp-ecommerce-example` because its runnable flight-booking example exposes a stateful multi-step WebMCP surface and implements an explicit `requestUserInteraction({ type: "confirmation" })` boundary inside `purchaseFlight`. The ecommerce candidate exposes product/cart tools but keeps checkout human-only, so it is weaker evidence for human/agent mutation parity. Neither source application was modified to create a finding.

The machine-readable roll-up is `docs/validation/2026-08-26-external-validation-matrix.json`. The dashboard's application selector renders the same generic `AuditResult` for the two live Subly Playground modes and the four captured external records. External contexts are explicitly marked `CAPTURED EXTERNAL VALIDATION`; the source applications are not cloned or silently re-invoked by the selector.

## Product UI timing

The first external records now exist and are visible through the smallest practical context selector. The primary dashboard remains the live Subly Playground; external contexts use the same X-Ray, findings, recommendations, and capability matrix but disable re-invocation because the displayed evidence is captured from the source environment.

The source/runtime distinction is visible in three places: the selector group label, the panel badges, and the Agent Surface inspector note. Each external record also retains its source URL, native tool snapshot, environment, provenance, and limitations.
