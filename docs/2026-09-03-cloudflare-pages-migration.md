# PARALLAX Cloudflare Pages Migration

Date: 2026-09-03 (JST)

This record documents the authorized migration of the public PARALLAX Playground from the managed Sites URL to Cloudflare Pages. The semantic model, frozen Core, Developer Contract v1, and v2 runtime behavior were not changed.

## Public deployment

- Canonical URL: https://parallax.oneshotstar.com/
- Pages project: `parallax-semantic-xray`
- Pages fallback: https://parallax-semantic-xray.pages.dev/
- Deployment URL: https://dec5fa55.parallax-semantic-xray.pages.dev/
- Deployed repository HEAD: `58fca1e2aa412516ffac0245077ab57bab15f8df`
- Reviewed v2 runtime source SHA: `188b0962a3f88200046ada924e790859ee1438ac`

The deployed application files are unchanged from the reviewed v2 runtime. The deployed repository HEAD is later only because of documentation commits.

Cloudflare created the single requested DNS mapping:

```text
parallax.oneshotstar.com CNAME parallax-semantic-xray.pages.dev
```

The record is proxied by Cloudflare. No other Pages project, DNS record, repository visibility setting, Devpost item, or video item was changed during this migration.

The final Cloudflare Pages custom-domain status is `Active` with `SSL enabled`.

## Production smoke evidence

- `https://parallax.oneshotstar.com/` returned HTTP 200 over HTTPS.
- `https://parallax-semantic-xray.pages.dev/` returned HTTP 200.
- The previous managed Sites URL remained reachable and was not redirected or redeployed.
- A fresh Chrome production tab showed the PARALLAX v2 production UI.
- A fresh normal-load tab had no PARALLAX-owned console errors.

## Native WebMCP evidence

Environment: Chrome 151 with the known WebMCP-enabled browser environment, using a live production tab on `https://parallax.oneshotstar.com/`.

The page exposed these native APIs:

```text
document.modelContext
document.modelContext.registerTool
document.modelContext.getTools
document.modelContext.executeTool
```

Native `getTools()` discovery returned the scenario tools plus these five PARALLAX meta-tools:

```text
inspect_surface
run_parity_audit
trace_goal
list_gaps
explain_gap
```

The discovered tools included their descriptions, JSON input schemas, and read-only annotations. Native `executeTool()` was used for the audit and meta-tool calls; internal simulation was not substituted.

## BROKEN live audit

Goal:

```text
Compare the Free and Pro plans and recommend the best option. Don't make any changes to my subscription.
```

Native `run_parity_audit` returned structured v2 data:

```text
Technical: PASS / HTTP 200
Intent: FAIL
Parity: FAIL
Agency: WARN
Semantic: FAIL / INTENT VIOLATED
Path: inspect_plan → compare_plans → recommended_upgrade
Observed effects: change_subscription, charge_payment
Findings: forbidden-effect, missing-confirmation-boundary,
          semantic-overloading, excess-agency
```

The visible UI updated to show the native `run_parity_audit` execution, the technical-success/semantic-failure contrast, and the derived findings.

## FIXED live audit

The same goal was used after switching the live playground to FIXED.

```text
Technical: PASS / HTTP 200
Intent: PASS
Parity: PASS
Agency: WARN
Semantic: WARN / SEMANTIC QUALIFIER
Path: inspect_plan → compare_plans → recommend_plan
Mutation effects on executed path: none
Finding: excess-agency
```

The Agency WARN remains because `purchase_plan` and `cancel_plan` are still exposed mutation capabilities for a read/recommend goal. This is the generic Core result, not a Subly-specific exception.

## Meta-tool and resilience checks

- `inspect_surface` returned the declared Human Surface, Agent Surface, boundaries, runtime state, and evidence summary.
- `trace_goal` returned a trace containing the supplied goal rather than a fixed goal substitute.
- `list_gaps` returned the current derived finding list.
- `explain_gap` returned a structured finding explanation.
- Blank/whitespace goal input was rejected by native execution.
- Unknown `gap_id` returned structured `NOT_FOUND`.
- Reset followed by Re-run restored the BROKEN state and regenerated the expected audit.
- A clean tab had no console errors after normal load and native audit execution.

The intentionally rejected blank-goal validation was recorded separately as an expected input-validation error in the test tab; it was not used as evidence of a normal production runtime failure.

## Invariants

- Frozen v1 Core manifest SHA-256: `1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82`
- Developer Contract v1 SHA-256: `c576f4515d680128ef7db83f8096225671e9d4e7d1258c83aeb52c8fab576cfa`
- Production validation matrix SHA-256: `8771f751f28885893fc1898d91618b6b138165a760117507886850578762146b`

All three hashes remain unchanged.
