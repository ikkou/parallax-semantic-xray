# PARALLAX

**Semantic debugger for the agentic web.**

The web now has two interfaces: one for humans, one for agents. PARALLAX shows you when they disagree.

PARALLAX is a working WebMCP challenge submission that compares a human-facing application surface with its WebMCP tool surface. The included Subly demo makes the mismatch concrete: a human asks to compare the Free and Pro plans and recommend the best option without changing the subscription, while a semantically overloaded agent tool technically succeeds and still violates that intent.

## Why WebMCP creates a dual-interface problem

WebMCP gives an application a second interface. The visible UI may communicate a careful sequence such as “review before purchase,” while a tool description can collapse recommendation, confirmation, payment, and state mutation into one operation. An agent can follow the tool contract, receive `200 OK`, and still violate the meaning a human saw.

PARALLAX treats this as a semantic supply-chain problem, not a generic MCP inventory or security scan. It checks whether intent, visible UI language, tool selection, tool annotations, and execution effects still agree.

## Human Surface vs Agent Surface

The main screen has three synchronized surfaces:

- **Human Surface** — a usable Subly `/plans` page with Free and Pro plans, plan selection, compare, review, and an action log.
- **Semantic X-Ray** — a five-stage trace that exposes structured execution metadata without simulating hidden chain-of-thought.
- **Agent Surface** — the live local tool registry, WebMCP annotations, tool contract inspector, and execution log.

The lower audit surface contains explainable issues, concrete fixes, and a capability matrix.

## Semantic supply chain

```text
Human Intent
      ↓
Human UI
      ↓
Agent Interpretation
      ↓
WebMCP Tool Selection
      ↓
Tool Contract
      ↓
Execution
      ↓
Visible Application State
```

PARALLAX audits semantic drift across this chain. It uses explicit structured metadata such as `declaredIntent`, `selectedTool`, `expectedEffect`, WebMCP annotations, and deterministic effect metadata. It does not expose or depend on hidden model reasoning.

## Architecture

- Next.js App Router with React and TypeScript.
- Tailwind CSS is included for the project styling pipeline; the dense dashboard surface uses a small set of named CSS tokens and components in `app/globals.css`.
- Client-side state drives the demo, audit replay, trace animation, action history, and fixed/broken scenario switch.
- `lib/webmcp/` provides a browser-safe wrapper around `document.modelContext.registerTool`, a local registry, tool execution, support detection, and PARALLAX's own tool definitions.
- `lib/audit.ts` contains the deterministic MVP audit model and capability matrix.
- `lib/demoRuntime.ts` simulates Subly plan state and payment effects for the demo only. It is not production billing.

## WebMCP tools exposed by the demo

### Broken scenario

| Tool | Contract | Annotation | PARALLAX effect metadata |
| --- | --- | --- | --- |
| `inspect_plan` | Read plan price, features, and current status. | `readOnlyHint: true` | `read_plan` |
| `compare_plans` | Compare feature and price differences. | `readOnlyHint: true` | `read_plan`, `compare_plans` |
| `recommended_upgrade` | Return the recommended plan and apply the upgrade immediately. | `readOnlyHint: false` | `recommend`, `change_plan`, `charge_payment` |
| `cancel_plan` | Cancel the subscription and move the account to Free. | `readOnlyHint: false` | `change_plan` |

`recommended_upgrade` is intentionally unsafe for the initial goal. Its name suggests a recommendation while its technically successful execution returns `200 OK`, changes state, and simulates a `$20` charge.

### Fixed scenario

The fixed surface replaces the overloaded operation with:

- `recommend_plan` — read-only recommendation, no state change, no payment.
- `purchase_plan` — explicitly named write operation that requires a purchase-shaped input and clearly describes the state change and payment effect.

The human copy changes from **Review upgrade** to **Review order**, and the confirmation boundary is visible in the UI.

## WebMCP tools exposed by PARALLAX

PARALLAX registers these read-only tools in addition to the demo application's tools:

- `inspect_surface` — inspect the current human surface, mode, plan state, and tool path.
- `run_parity_audit` — run the deterministic audit for a supplied goal.
- `trace_goal` — return the structured five-stage semantic trace.
- `list_gaps` — list current intent, parity, and agency gaps.
- `explain_gap` — explain one gap by ID, such as `intent-001`.

This demonstrates WebMCP auditing WebMCP.

## How the audit works

PARALLAX implements three deterministic MVP lenses:

1. **Intent** — compares prohibited actions from the user goal with effects declared by the selected tool path. The broken route fails semantically because `change_plan` and `charge_payment` are prohibited, even though execution succeeds.
2. **Parity** — compares human-facing operation language with the tool's semantic action and effects. A review/recommendation intent does not match an immediate upgrade and charge.
3. **Agency** — identifies unnecessary write capabilities for a compare-and-recommend goal. `recommended_upgrade` and `cancel_plan` exceed the current goal's required agency.

The output is explainable state, not an arbitrary score:

```text
Intent   FAIL
Parity   FAIL
Agency   WARN
4 issues found
```

## Broken vs fixed example

Broken path:

```text
Goal: Compare the Free and Pro plans and recommend the best option. Don't make any changes to my subscription.
inspect_plan()
compare_plans()
recommended_upgrade()
→ HTTP 200 OK
→ Pro subscription activated
→ $20 charged
```

The center trace reports **SEMANTIC BREAK DETECTED** and shows the evidence: the technical result is `SUCCESS / HTTP 200`, while the semantic result is `FAIL / INTENT VIOLATED`. The trace marks **TOOL SELECTION** as the point where semantic drift starts.

Fixed path:

```text
inspect_plan()
compare_plans()
recommend_plan()
→ HTTP 200 OK
→ recommendation returned
→ no subscription change
```

After switching to **FIXED** and re-running the audit, the lenses become:

```text
Intent   PASS
Parity   PASS
Agency   PASS
```

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Validation commands:

```bash
npm run lint
npm run typecheck
npm run build
```

## Browser requirements

The normal UI works in a regular modern browser using a local simulator. When `document.modelContext.registerTool` is available, PARALLAX registers the demo tools and its own audit tools directly against that WebMCP surface. When it is not available, the header and warning banner say **local simulator** and the app remains fully usable.

For a real agent invocation, use a browser/runtime that exposes the current WebMCP API through `document.modelContext`.

## Testing with ChatGPT or WebMCP-enabled Chrome

1. Run the app locally and open it in a WebMCP-enabled browser/runtime.
2. Confirm the header changes from **local simulator** to **WebMCP live**.
3. Ask the agent to `run_parity_audit` with the goal `Compare Free and Pro. Don't change my plan.`
4. Ask for `list_gaps`, then `explain_gap` with `intent-001`.
5. Switch PARALLAX to **FIXED** and re-run the audit.
6. Call `run_parity_audit` again and confirm all three lenses return `pass`.

The local UI's **Execute** controls exercise the same registered tool definitions and are useful for a deterministic demo rehearsal.

## Limitations

- The audit model is deterministic and focused on the included Subly demo; it does not crawl arbitrary third-party sites.
- The WebMCP wrapper gracefully degrades when the browser does not expose `document.modelContext`.
- Subly payment and plan changes are simulated in memory. No authentication, accounts, database, or real billing exists.
- PARALLAX does not claim to provide a complete MCP security review, browser automation platform, or hidden reasoning trace.
- Production hosting and real WebMCP availability depend on the target deployment environment.

## License

MIT. See [LICENSE](./LICENSE).
