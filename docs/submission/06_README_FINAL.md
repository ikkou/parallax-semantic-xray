# PARALLAX

## Semantic debugger for the agentic web

PARALLAX is a semantic testing layer for WebMCP applications that detects when human intent and agent execution diverge.

> 200 OK. Semantically wrong.

WebMCP gives a website a structured Agent Surface alongside its Human Surface. PARALLAX checks whether a declared user goal, tool capability, safety boundary, and observed effect still mean the same thing after execution.

## The problem

A successful technical call can still be semantically wrong.

A tool may return HTTP 200 while changing state the user explicitly prohibited. A client may request an approval that the application itself did not declare. A policy may correctly reject a write even though the tool invocation succeeds. A Human Surface may intentionally contribute information that no Agent tool exposes.

PARALLAX makes those distinctions visible rather than collapsing them into one success status.

## Live demo

Open the production Playground:

https://parallax-semantic-xray.heavenchan.chatgpt.site/

The Subly Playground is a controlled reference implementation. It is not a real third-party subscription service.

Use this exact goal:

    Compare the Free and Pro plans and recommend the best option. Don't make any changes to my subscription.

### BROKEN

    inspect_plan
      → compare_plans
      → recommended_upgrade
      → HTTP 200
      → Pro activated / $20 charged in the simulation

Expected result:

- Technical PASS / HTTP 200.
- Semantic FAIL / Intent violated.
- Observed subscription and payment effects are shown with their evidence.

### FIXED

    inspect_plan
      → compare_plans
      → recommend_plan
      → recommendation returned
      → no subscription mutation

Expected result:

- Technical PASS.
- Intent PASS.
- Parity PASS.
- Agency WARN may remain because mutation capabilities remain exposed for a read/recommend goal.
- Semantic WARN is retained when that exposure warning is present.

## 30-second quick test

1. Open the production URL.
2. Select v2 · production and Subly — BROKEN.
3. Confirm the exact goal above.
4. Run the audit and look for Technical PASS beside Semantic FAIL.
5. Select FIXED and run the same goal again.
6. Confirm recommendation/no mutation and Intent PASS / Parity PASS.
7. In native WebMCP-enabled Chrome, invoke run_parity_audit and confirm the structured result appears in the Agent Execution Log.

## How WebMCP is used

PARALLAX inspects the structured Agent Surface exposed through WebMCP and compares it with the declared Human Surface contract. It audits structured execution evidence and exposes five page-defined WebMCP tools of its own:

- inspect_surface
- run_parity_audit
- trace_goal
- list_gaps
- explain_gap

The production native path was verified in Chrome 151 with WebMCP enabled. If a browser does not expose native WebMCP, the local simulator remains available as a labelled fallback.

## Architecture

    Developer Contract + Execution Evidence
                ↓
          Pure semantic Core
                ↓
       Audit result and X-Ray trace
                ↓
      WebMCP adapter and UI projection

The Core is domain-independent. It does not infer meaning from the natural-language goal and does not access React, the DOM, browser APIs, network state, or global application registries.

The evidence model keeps:

- DECLARED: contract, intent, tool claims, and application boundaries.
- OBSERVED: technical invocation, runtime effects, policy outcomes, state changes, and client events.
- DERIVED: statuses, findings, trace, and recommendations.

## v2 semantics

The v2 model adds explicit support for conditional and prevented effects, application policy outcomes, lifecycle-aware effects, workflow roles, complementary Human/Agent surfaces, and client-runtime boundary evidence. It preserves v1 as a fallback.

The same generic Core produced:

- Subly BROKEN: Technical PASS / Semantic FAIL.
- Subly FIXED: Intent PASS / Parity PASS / Agency WARN / Semantic WARN.
- Flight Search: Semantic PASS.
- Tagboard rejected: Technical PASS with POLICY REJECT / EFFECT PREVENTED.
- The Archive: COMPLEMENTARY relation without treating the asymmetric surfaces as a semantic gap.

## CLI

The repository contains a local, dependency-free semantic test runner. It accepts explicit contract and evidence JSON and recomputes the audit result. It does not discover websites, execute browser tools, scan URLs, or consume a stored audit result.

The CLI is a local module example, not an npm package claim.

## External validation

The same model was applied to unmodified or independently authored WebMCP examples through application-specific contract and evidence adapters. Records are labelled LIVE EXECUTION, HUMAN APPROVED, or CAPTURED VALIDATION FIXTURE. A valid result may be PASS, WARN, or FAIL.

Detailed records are in the validation directory, including the [v2 corpus report](../validation/v2/2026-09-01-v2-corpus-report.md), [Tagboard record](../validation/2026-08-29-tagboard-blind-external-validation-gate3.md), and [The Archive record](../validation/2026-08-31-the-archive-blind-external-validation-gate4.md).

## Local development

    npm install
    npm run dev

Open http://127.0.0.1:3000/ for the local interactive Playground.

## Testing

    npm run test:core
    npm run test:contracts
    npm run test:v2
    npm run test:cli
    npm run test:cli:v2
    npm run test:integration
    npm run typecheck
    npm run lint
    npm run build

For native WebMCP validation, use Chrome 151 with:

    --enable-features=WebMCP
    --enable-blink-features=ModelContextAPI,ModelContextExecutorAPI

## Limitations

- A developer-supplied contract and execution evidence adapter are required.
- PARALLAX does not automatically infer all semantic intent from natural language or arbitrary DOM state.
- WebMCP availability varies by browser, flags, session, and client runtime.
- Some external records use captured evidence rather than exhaustive live-native execution.
- Client-runtime approval is separate from application-declared boundaries.
- The CLI is local and not npm-published.
- PARALLAX audits and reports; it is not a runtime enforcement or security gateway.
- It is not an arbitrary URL scanner or CI integration.

## Challenge context

The project began with a controlled Technical PASS / Semantic FAIL demonstration and then used blind validation against unmodified WebMCP examples to refine the evidence model. Tagboard established policy/effect separation; The Archive established intentional complementarity. v2 records those distinctions without application-specific Core branches.

## License

MIT. See LICENSE.
