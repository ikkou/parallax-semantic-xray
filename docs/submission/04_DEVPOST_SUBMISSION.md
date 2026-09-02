# PARALLAX — Devpost Submission Copy

Status: final copy draft; do not submit from this file
Production URL: https://parallax-semantic-xray.heavenchan.chatgpt.site/
Repository URL: https://github.com/ikkou/parallax-semantic-xray
Video URL: https://youtu.be/YXIoZpCsYt0 (public release scheduled)

## Project title

PARALLAX

## Tagline

Semantic debugger for the agentic web.

## Inspiration / problem

WebMCP makes it easier for agents to use websites through structured tools. But a successful tool call does not necessarily mean a successful interaction. An agent can follow a valid technical path, receive HTTP 200, and still violate the user’s intent or skip a meaningful review boundary.

PARALLAX asks a different question from a typical WebMCP demo:

> Did the website mean the same thing to the human and the agent?

## What it does

PARALLAX is a semantic testing layer for WebMCP applications. A developer supplies a semantic contract describing the user goal, guardrails, Human Surface actions, Agent Surface tools, effects, and safety boundaries. An execution adapter supplies observed technical results and semantic effects with provenance. PARALLAX keeps those inputs separate and derives an explainable X-Ray trace, findings, recommendations, and PASS/WARN/FAIL statuses.

The central demonstration is a controlled Subly Playground. The BROKEN path uses a combined recommendation-and-upgrade tool. It returns HTTP 200, activates Pro, and charges $20 in the simulation even though the user said not to change the subscription. The FIXED path uses a read-only recommendation action with the same goal and produces no mutation.

## How WebMCP is used

PARALLAX audits the structured Agent Surface exposed by WebMCP and compares it with declared Human Surface intent and boundaries. It also exposes five page-defined WebMCP meta-tools:

- inspect_surface
- run_parity_audit
- trace_goal
- list_gaps
- explain_gap

In the validated Chrome 151 environment, a native run_parity_audit invocation returned structured v2 audit data and updated the visible execution log. The demo distinguishes native WebMCP evidence from the local interactive simulator.

## How it was built

The pure Core accepts a Developer Contract and execution evidence. It does not access React, the DOM, browser APIs, network state, or an application registry. The WebMCP adapter handles browser registration, discovery, execution, and support states. The Subly Playground and external validation records are adapters around the same semantic model.

The product preserves three evidence layers:

- DECLARED: what the developer contract and tool declarations claim.
- OBSERVED: what runtime, policy, state, and client evidence record.
- DERIVED: what PARALLAX concludes from the first two layers.

## Challenges

The hardest part was preventing technical success from becoming semantic success by default. Blind validation against unmodified WebMCP demos exposed additional distinctions: an application policy can reject a technically successful write; a client can add an approval event that is not an application-declared boundary; and Human and Agent surfaces can be intentionally complementary rather than identical.

v1 first established the Technical PASS / Semantic FAIL pattern. v2 generalized the model with policy/effect outcomes, explicit complementary surface relations, lifecycle-aware evidence, and separate client-runtime observations without adding application-specific Core exceptions.

## Accomplishments

- A production HTTPS PARALLAX Playground with a visible BROKEN/FIXED semantic contrast.
- Native Chrome 151 WebMCP discovery and invocation evidence.
- A pure, deterministic semantic audit Core with v1 fallback.
- Evidence-derived intent, parity, agency, technical, and semantic results.
- External records that preserve PASS, WARN, and FAIL outcomes instead of manufacturing findings.
- A CLI and local integration example based on explicit contract and evidence inputs.

## What I learned

Semantic parity is not the same as surface equality. An HTTP response describes technical execution, not whether the action respected the user’s meaning. Exposed capability is not the same as delegated or executed agency. Reliable semantic testing therefore needs explicit contracts, provenance, and a clear boundary between application behavior and client-runtime behavior.

## What’s next

The next step is better developer instrumentation and more evidence adapters for WebMCP applications. CI integration, npm publication, arbitrary URL scanning, runtime enforcement, and universal semantic inference are intentionally outside this Challenge submission.

## Testing instructions

Open the production URL in a fresh session. Select v2 · production and Subly — BROKEN. Run the audit with this exact goal:

    Compare the Free and Pro plans and recommend the best option. Don't make any changes to my subscription.

Expected BROKEN result: Technical PASS / HTTP 200 and Semantic FAIL / Intent violated.

Select FIXED and run the same exact goal. Expected result: recommendation returned, no subscription mutation, Intent PASS, Parity PASS, Agency WARN, and Semantic WARN.

For native WebMCP testing, use Chrome 151 with the documented WebMCP flags when available. If native APIs are unavailable, the local simulator remains an interactive fallback and must be labelled as such.

## Known limitations and scope

PARALLAX requires a developer-supplied contract and execution evidence adapter. It does not automatically infer all intent from natural language or DOM state. Some external records are captured fixtures or human-approved evidence rather than exhaustive live-native executions. Client-runtime behavior can vary by session and environment. PARALLAX audits and reports semantic design observations; it is not a runtime enforcement or security gateway.

## Links

- Production: https://parallax-semantic-xray.heavenchan.chatgpt.site/
- Repository: https://github.com/ikkou/parallax-semantic-xray
- Demo video: https://youtu.be/YXIoZpCsYt0 (public release scheduled)
- Devpost: https://devpost.com/software/a-f80hps (project published; Challenge submission not submitted)
