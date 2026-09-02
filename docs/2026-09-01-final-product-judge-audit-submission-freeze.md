# PARALLAX — Final Product / Judge Audit + Submission Freeze

Date: 2026-09-01 (JST)
Audit mode: READ-ONLY PRODUCT / JUDGE AUDIT + FREEZE DECISION
Decision: **FREEZE**

This record evaluates the reviewed production candidate as a judge would encounter it. It does not add product features, change the Core, change Developer Contract v1, modify the production deployment, rewrite history, record video, or prepare the final Devpost submission. The only new runtime check authorized by the gate was a fresh ChatGPT Work-style production attempt; that limitation is recorded in section 25.

## 1. Production baseline

The reviewed production candidate is:

| Field | Verified value |
| --- | --- |
| Production URL | https://parallax-semantic-xray.heavenchan.chatgpt.site/ |
| Sites version | 7 |
| Reviewed source SHA | 188b0962a3f88200046ada924e790859ee1438ac |
| Source branch | main |
| Source remote | https://git.chatgpt-team.site/067958b3-f5ee-45c1-acad-8fc1f5f25451/appgprj_6a8e5c057d4c8191ad9d7158a68309ee.git |
| Deployment visibility | Public HTTPS site; repository visibility was not changed |
| Current product model | v2 · production |
| Fallback | v1 · fallback remains available |

The production page is a single PARALLAX X-Ray surface with this architectural flow:

    Production page
      → app/parallax-app.tsx
          → WebMCP browser adapter
              → native registration / discovery / execution
              → application-scoped local mirror
          → Playground and external validation adapters
          → Core v2: Developer Contract + Evidence → AuditResultV2
          → X-Ray projection, issues, recommendations, matrix, execution log

The production candidate was previously built and checked successfully. The recorded local candidate checks were:

    npm run test:core        PASS — 8 tests
    npm run test:contracts   PASS — 5 tests
    npm run test:cli         PASS — 9 tests
    npm run test:v2          PASS — 15 tests
    npm run test:cli:v2      PASS — 9 tests
    npm run test:integration PASS — 3 tests
    npm run typecheck        PASS
    npm run lint             PASS
    npm run build            PASS
    git diff --check         PASS

Frozen references remain:

| Baseline | SHA-256 |
| --- | --- |
| Frozen v1 Core, sorted lib/core/*.ts source manifest | 1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82 |
| Developer Contract v1 document | c576f4515d680128ef7db83f8096225671e9d4e7d1258c83aeb52c8fab576cfa |
| Production Validation Matrix | 8771f751f28885893fc1898d91618b6b138165a760117507886850578762146b |
| v2 aggregate baseline | f5f3a97017f620d28bed3c8088d80081e8c4c156fd81994e7841f59e3ea8a0c2 |

The Sites connector metadata does not declare a separate MCP server. That connector-level limitation does not invalidate the page-level native WebMCP APIs observed in Chrome 151.

## 2. First-30-seconds audit

This is a judge read-through of the production page, not a proposed redesign.

| Judge question | What is visible | Assessment |
| --- | --- | --- |
| What is PARALLAX? | PARALLAX, Semantic debugger for the agentic web, X-RAY MODE | No P0; the product category becomes clear after reading the goal card |
| Why does it exist? | Human Surface, Agent Surface, goal, forbidden effect, and a technical/semantic result contrast | No P0; P1 copy opportunity to state “semantic testing layer” in the first viewport |
| What is the failure? | TECHNICAL RESULT: PASS / HTTP 200 beside SEMANTIC RESULT: FAIL / INTENT VIOLATED | No issue; the thesis is visually present |
| Is BROKEN different from FIXED? | BROKEN/FIXED controls, path changes, and the same goal remain visible | No issue |
| Where does meaning drift? | TOOL SELECTION is marked SEMANTIC DRIFT STARTS HERE | No issue |
| Is the result a runtime crash? | The execution path shows HTTP 200 / SUCCESS and the semantic panel shows the separate failure | No issue |
| Is Subly a real third-party defect claim? | The selector labels it LIVE PLAYGROUND; the surrounding record identifies the controlled reference implementation | P1: narration should state “controlled simulated playground” explicitly |
| Is PARALLAX reusable? | Application selector includes external validation contexts and their authority labels | No P0; a judge must scan below the primary hero to see the generality story |
| Is the evidence trustworthy? | Declared/observed/approved/derived evidence labels appear in external-context views | No issue; the distinction is strongest after selecting an external record |
| Is the fallback visible? | v1 · fallback is available in the model selector | No issue; keep secondary so it does not compete with v2 |

The first 30 seconds are sufficient to understand the central demo. The remaining improvements are submission-copy and capture work, not a product-correctness blocker.

## 3. Core product thesis

10 words:

> PARALLAX finds WebMCP success that violates human intent and boundaries.

25 words:

> PARALLAX is a semantic regression debugger for WebMCP applications: it compares declared human intent, agent capabilities, safety boundaries, and observed effects after technically successful execution.

One sentence:

> PARALLAX is a semantic testing layer for WebMCP applications that detects when technically successful agent execution diverges from human intent, safety boundaries, or application-declared semantics.

One paragraph:

> PARALLAX accepts a developer-supplied semantic contract and execution evidence, keeps declared claims separate from observed runtime facts, and applies deterministic rules to derive intent, parity, agency, technical, and semantic results. Its X-Ray makes the meaning change visible even when the tool call returns successfully. The Subly Playground demonstrates the controlled BROKEN/FIXED case, while separately labelled external records show that the same Core can produce PASS, WARN, or FAIL without URL crawling or universal natural-language inference.

## 4. BROKEN/FIXED credibility

Subly is a deterministic LIVE PLAYGROUND fixture: BROKEN and FIXED are two controlled contract/evidence states, not a claim that a real third-party Subly deployment is defective. The simulated BROKEN path shows the semantic shape “recommended_upgrade → HTTP 200 → Pro activated → $20 charged”; the fixed path uses the same goal and returns a recommendation without mutation.

The credibility claim is therefore bounded and honest:

    Subly proves the thesis visibly and repeatably.
    External records test whether the Core generalizes beyond Subly.
    Neither is presented as universal semantic inference or a security guarantee.

## 5. v1 → v2 story

v1 established the central observation: a technically successful WebMCP action can still violate the user’s intent. Cross-application validation then exposed cases that required a richer semantic model: policy ALLOW/REJECT versus domain effect, intentional Human/Agent complementarity, and client-runtime approval distinct from application-declared boundaries.

v2 adds those distinctions as explicit contract/evidence data and retains v1 as a usable fallback. It does not replace the original thesis or hide earlier uncertainty; it makes the evidence boundary more explicit and preserves the same generic Core approach across Subly and external records.

## 6. Tagboard

Tagboard demonstrates a technically successful write with two different application outcomes:

    Accepted: client approval → add_note → policy ALLOW → note_stored
    Rejected: client approval → add_note once → policy REJECT → note_stored prevented

The approved explanation is:

> PARALLAX is evaluating whether declared semantics were preserved. The tool executed correctly, the application policy intentionally rejected the write, and the storage effect was prevented; therefore this is Technical PASS / Semantic PASS under the approved contract, with POLICY REJECT and EFFECT PREVENTED shown separately.

This is not a claim that Tagboard has a bug, vulnerability, or safety defect. It is evidence that technical execution, application policy, and domain effect must not be collapsed into one status. A normal policy rejection is a valid and useful PASS when the contract says the application may reject the content and no forbidden effect occurred.

## 7. The Archive

The Archive establishes that semantic parity is not the same as surface equality. Humans observe physical and visual clues; agents investigate archive, manifest, document, and timeline records. The declared COMPLEMENTARY relationship makes the combined workflow the semantic unit.

The safe explanation is:

> Semantic parity does not mean Human and Agent surfaces must be identical. In The Archive, humans collect visual clues and agents investigate backend records; the declared COMPLEMENTARY relationship makes the combined workflow the semantic unit.

The relation is not inferred from a label or from any Human/Agent mismatch. It is valid only because the application-specific contract explicitly declares it and the evidence supports the related workflow. This is why the current result must not be described as “The Archive is unsafe.”

## 8. Client-runtime boundary

PARALLAX separates three facts:

    APPLICATION-DECLARED
      The application contract declares its Human and Agent boundaries.

    HUMAN-OBSERVED
      A human saw a review or confirmation step in the application.

    CLIENT-RUNTIME-OBSERVED
      ChatGPT or another client requested, granted, or enforced approval.

The application contract declares application boundaries; ChatGPT/client approval events are separate observed runtime evidence. A client approval may qualify an audit or establish an event, but it is not relabelled as an application-declared boundary.

This distinction explains the Kurio, Mabel’s Table, Tagboard, and The Archive records. It also prevents a client prompt from being silently promoted into a property of the external application.

## 9. Competitive differentiation

The competitive-product descriptions in prior feasibility material are not authoritative evidence and are not copied into README text or product claims. No independently verified competitor research source was found in the current repository/workspace, so no feature-level comparison is approved in this freeze.

| Named comparison candidate | Evidence status in this audit | Safe comparison boundary |
| --- | --- | --- |
| WebMCP Observatory | Unverified in the current repository | Do not publish feature claims; PARALLAX’s supported claim is contract/evidence-based semantic auditing of WebMCP surfaces |
| Agent Lighthouse | Unverified in the current repository | Do not publish feature claims |
| FlowProof | Unverified in the current repository | Do not publish feature claims |
| WebMCP Evals | Unverified in the current repository | Do not publish feature claims |
| WebMCP Sentinel | Unverified in the current repository | Do not publish feature claims |
| PARALLAX | Supported by this repository and production evidence | Detects divergence between declared Human/Agent semantics and observed effects; does not claim security scanning, enforcement, arbitrary URL scanning, or universal inference |

The differentiation that is safe to state is problem-based rather than competitor-based: PARALLAX makes the relationship between human intent, agent capability, application boundaries, and observed semantic effects inspectable after a technically successful run. A public comparison table requires a separate authoritative research pass before submission copy is finalized.

## 10. Adversarial objections

| Objection | Evidence-backed response |
| --- | --- |
| “This is just a broken toy.” | Subly is explicitly a controlled fixture. The same Core is also exercised against independently authored or official external records, including valid PASS outcomes and neutral WARN observations. |
| “This is just observability.” | The execution log records what happened; the Core derives whether it agrees with declared intent, boundaries, and effects. The semantic result can fail while the technical result passes. |
| “This is a security scanner.” | No. PARALLAX requires a developer contract and evidence adapter; it does not crawl arbitrary URLs, infer all DOM meaning, or enforce runtime policy. |
| “Why not assert safety from tool names?” | A tool name does not prove an effect, policy result, boundary, or client approval. The system preserves provenance and requires explicit contract/evidence inputs. |
| “Why does Human/Agent difference count as a gap?” | It does not automatically. The Archive’s explicit COMPLEMENTARY relation is a positive control against the rule that every surface must be identical. |
| “Why does a policy rejection pass?” | The tool executed technically, the application policy made the decision, and the forbidden domain effect was prevented. That is not a technical failure. |
| “Does an exposed purchase tool mean the agent purchased?” | No. The current Agency WARN is exposure-level. Delegated, selected, executed, and client-approved capabilities remain distinct evidence questions. |
| “Does WebMCP support work in every ChatGPT session?” | No such claim is made. Chrome 151 native production behavior is verified; client/session support varies and the fresh Work attempt in section 25 did not reach discovery. |

## 11. WebMCP leverage

PARALLAX uses WebMCP as the structured Agent Surface it audits, and it also exposes its own page-defined audit tools. The production regression was performed in a dedicated Chrome 151 environment with:

    --enable-features=WebMCP
    --enable-blink-features=ModelContextAPI,ModelContextExecutorAPI

Observed page-level native APIs:

    document.modelContext
    navigator.modelContext
    registerTool
    getTools
    executeTool

The production native surface exposed application-scoped scenario tools plus the five PARALLAX meta tools:

    inspect_surface
    run_parity_audit
    trace_goal
    list_gaps
    explain_gap

Native execution returned structured v2 results and appended a visible “WebMCP invocation · structured result returned” entry to the Agent Execution Log. The test also covered blank/whitespace goal rejection, unknown gap_id as structured NOT_FOUND, application-scoped BROKEN/FIXED replacement, reset, re-run, and visible UI updates.

This is page-level native WebMCP evidence. It is not a claim that the ChatGPT Sites connector exposes a separate MCP server declaration.

## 12. Execution

The production execution gate is green for the P0 path:

| Path | Technical | Semantic / derived result | Evidence |
| --- | --- | --- | --- |
| Subly BROKEN | PASS / HTTP 200 | FAIL / Intent violated; Intent FAIL, Parity FAIL, Agency WARN | Native Chrome 151 production invocation; observed change_subscription and charge_payment |
| Subly FIXED | PASS / HTTP 200 | WARN / semantic qualifier; Intent PASS, Parity PASS, Agency WARN | Native Chrome 151 production invocation; recommend_plan returned with no mutation |
| Flight Search | PASS | PASS | Human-approved read-heavy validation record; no purchase or payment evidence |
| Tagboard accepted | PASS | PASS with POLICY ALLOW / EFFECT OCCURRED | Live external record |
| Tagboard rejected | PASS | PASS with POLICY REJECT / EFFECT PREVENTED | Live external record; no retry |
| The Archive | PASS | WARN with explicit COMPLEMENTARY relation | Live external record plus client-runtime evidence |

Production reset/re-run behavior and v1 fallback were usable. A clean production reload had no reproducible PARALLAX-owned runtime exception. Unrelated extension warnings such as MetaMask or injected hydration attributes are not attributed to PARALLAX.

The remaining execution limitation is the fresh Work-style discovery attempt in section 25. It does not invalidate the already verified native Chrome 151 path.

## 13. Potential impact

The immediate user is a WebMCP developer or application team adding an Agent Surface to an existing Human Surface. The highest-value workflows are those where read/recommend actions sit near irreversible effects:

    purchase and upgrade
    booking and reservation confirmation
    returns and refunds
    cancellation
    file deletion

PARALLAX is useful because these workflows can return successful HTTP responses while still violating an explicit guardrail or bypassing a review boundary. The contract/evidence model also gives teams a way to record uncertainty instead of manufacturing a finding.

## 14. Creativity and ambition

The strongest creative move is the framing:

> 200 OK. Semantically wrong.

The product turns a subtle agentic-web failure into a visible semantic trace: human intent, agent interpretation, tool selection, tool contract, technical execution, and semantic outcome. The ambition is not to claim universal understanding; it is to establish a practical, deterministic testing layer at the seam between a website’s Human Surface and Agent Surface.

The v2 additions strengthen that thesis without obscuring its boundaries: policy outcome is separated from effect outcome, complementary surfaces are explicit, and client-runtime approval is not confused with application declaration.

## 15. Exact demo video structure

Recommended total: approximately 2:35, safely below the three-minute limit.

| Time | Segment | Exact story |
| --- | --- | --- |
| 0:00–0:18 | Problem | Show the exact goal and the line 200 OK. Semantically wrong. |
| 0:18–0:58 | BROKEN | Run inspect_plan → compare_plans → recommended_upgrade; show HTTP 200, simulated Pro activation/$20 charge, drift at Tool Selection, and Semantic FAIL |
| 0:58–1:25 | FIXED | Keep the exact same goal; switch to recommend_plan; show recommendation/no mutation, Intent PASS, Parity PASS, and the honest Agency WARN |
| 1:25–1:55 | Generality | Show Tagboard REJECT/PREVENTED and The Archive COMPLEMENTARY; keep both records clearly labelled |
| 1:55–2:20 | Native WebMCP | Invoke run_parity_audit through the native page tool; show structured output and the visible execution-log entry |
| 2:20–2:35 | Close | State that PARALLAX tests whether the website meant the same thing to the human and the agent |

The video should not imply a real subscription charge, claim that an external application is defective without sufficient evidence, or rely on an unavailable ChatGPT Work runtime as the only proof.

## 16. Shot list and durations

| Shot | Duration | Visual | Proof point |
| --- | ---: | --- | --- |
| 1 | 18s | Production hero, goal card, thesis line | Problem is semantic divergence, not a crash |
| 2 | 12s | BROKEN path and Agent Execution Log | The selected tool is visible |
| 3 | 16s | Technical/semantic contrast and simulated Subly result | HTTP 200 and Semantic FAIL coexist |
| 4 | 12s | Semantic X-Ray zoom on Tool Selection | Drift begins before technical execution fails |
| 5 | 15s | FIXED path with same goal | recommend_plan is read-only in the executed path |
| 6 | 12s | FIXED status cards and Agency WARN | The warning is preserved rather than forced to PASS |
| 7 | 15s | Semantic diff / resolved gaps | Forbidden effect, boundary, and overloading findings resolve |
| 8 | 15s | Tagboard rejected context | Policy REJECT and EFFECT PREVENTED are separate |
| 9 | 15s | The Archive context | COMPLEMENTARY is not treated as a gap |
| 10 | 25s | Native tool invocation and structured result | Actual WebMCP discovery/execution evidence |
| 11 | 15s | Final X-Ray overview | Reusable testing-layer thesis and bounded claims |

Total: approximately 2:30–2:35, depending on transitions.

## 17. Narration and audio

Use clear English narration with mandatory captions. A human voice is preferred if it is easy to understand; otherwise use a restrained synthetic English voice with manually timed captions. No face camera is required.

Suggested narration:

> Most WebMCP demos ask what an agent can do on a website. PARALLAX asks whether the website meant the same thing to the human and the agent.
>
> The user only asked to compare Free and Pro and recommend an option. In the BROKEN playground, the agent selects a combined recommendation-and-upgrade tool. It returns HTTP 200, activates Pro, and charges twenty dollars. Technically successful. Semantically wrong.
>
> Now the same goal runs through the fixed surface. recommend_plan returns a recommendation and does not mutate the subscription. Intent and parity pass. Agency remains WARN because other mutation tools are still exposed.
>
> The same Core also handles external evidence. Tagboard separates policy rejection from technical failure. The Archive declares complementary Human and Agent surfaces. These are evidence-derived observations, not universal inference or security claims.
>
> PARALLAX is a semantic testing layer for WebMCP applications: 200 OK can still be semantically wrong.

The phrase “simulated Subly playground” should be spoken or captioned before the $20 charged visual. The native WebMCP invocation should be identified explicitly rather than represented as a button click.

## 18. Environment freeze

Primary recording environment:

    URL: https://parallax-semantic-xray.heavenchan.chatgpt.site/
    Sites version: 7
    Source SHA: 188b0962a3f88200046ada924e790859ee1438ac
    Browser: dedicated Chrome 151 native WebMCP environment
    Flags: --enable-features=WebMCP
            --enable-blink-features=ModelContextAPI,ModelContextExecutorAPI
    Model selector: v2 · production
    Initial context: Subly — BROKEN
    Initial runtime state: free plan, charged amount $0
    Goal: Compare the Free and Pro plans and recommend the best option. Don't make any changes to my subscription.

Use a clean browser/session for recording, with unrelated extensions and history out of frame. If a live native invocation stalls, use a captured native validation clip and label it as captured; do not present a fixture as live execution.

Backup environment:

    http://127.0.0.1:3000/

The local development server remains running for fallback inspection. The local simulator is an interactive backup, not a replacement for the recorded native WebMCP evidence.

No additional origin-trial prompt was encountered in the known Chrome 151 environment. ChatGPT Work/client support remains runtime- and session-dependent as recorded in section 25.

## 19. Screenshot freeze

Required final submission captures, to be verified or recaptured against Sites version 7 in the next gate:

1. Production Subly BROKEN hero: technical PASS / HTTP 200 beside semantic FAIL / intent violated.
2. Production Subly FIXED: same goal, recommendation/no mutation, Intent PASS, Parity PASS, Agency WARN.
3. Semantic X-Ray close-up showing SEMANTIC DRIFT STARTS HERE at Tool Selection.
4. Tagboard rejected context showing POLICY REJECT / EFFECT PREVENTED without Technical FAIL.
5. The Archive context showing COMPLEMENTARY and its authority/evidence label.
6. Native run_parity_audit structured result and the visible execution-log entry.
7. Optional v1 fallback view, only if it clarifies compatibility rather than distracting from v2.

The existing screenshot directory is useful evidence, but no version-7 screenshot set was captured during this final judge audit. The next submission-package gate must verify the source version before reusing any capture; native-extension screenshots from an earlier production version are not automatically final-package evidence.

## 20. Devpost architecture

The final submission should map the product to the following architecture:

| Submission section | Content |
| --- | --- |
| Title/tagline | PARALLAX — Semantic debugger for the agentic web |
| Inspiration/problem | Successful tool calls can violate intent or bypass semantic boundaries |
| What it does | Contract + evidence → X-Ray trace, findings, recommendations, and PASS/WARN/FAIL result |
| WebMCP use | Native page tool registration, discovery, structured invocation, and visible result update |
| How it was built | Pure domain-independent Core, WebMCP browser adapter, Subly Playground adapter, external validation adapters |
| Challenges | Provenance, client-runtime boundaries, policy/effect separation, complementary surfaces, honest evidence status |
| Accomplishments | Production v2, BROKEN/FIXED contrast, native regression, external records, v1 fallback |
| Learning | Surface equality is not parity; technical success is not semantic success |
| What’s next | Better evidence adapters and validation tooling after the Challenge; no claims of current CI/npm readiness |
| Testing instructions | Production URL, exact goal, native WebMCP environment, expected BROKEN/FIXED results, fallback path |
| Links/video | Production URL, repository, final video, and evidence records only after their respective gates |

The v2 evolution belongs in “How it was built” and “Challenges.” The controlled BROKEN/FIXED flow belongs in “What it does.” Limitations belong in “Challenges” and “What’s next.”

## 21. Judge testing instructions

1. Open the production URL in a fresh session.
2. Keep v2 · production selected and start with Subly — BROKEN.
3. Confirm the goal is exactly:

       Compare the Free and Pro plans and recommend the best option. Don't make any changes to my subscription.

4. Run the audit. Expected result: Technical PASS / HTTP 200, Semantic FAIL / INTENT VIOLATED, with the simulated Pro/$20 effect visible in the controlled playground.
5. Select FIXED and run the same exact goal. Expected result: recommendation returned, no subscription mutation, Intent PASS, Parity PASS, Agency WARN, Semantic WARN.
6. In a Chrome 151 environment with the documented WebMCP flags, use native run_parity_audit if direct page-tool invocation is available. Confirm the structured result and visible execution-log entry.
7. Select an external context only to inspect its clearly labelled captured or human-approved record; do not describe a captured fixture as live execution.
8. Use Reset demo and Re-run audit to verify the BROKEN path can be reproduced.

If the browser has no native WebMCP APIs, the local simulator remains usable, but that run must be described as the simulator path rather than native WebMCP validation.

## 22. README plan

The current README is broadly aligned with the product and should not be rewritten during this freeze. Before the submission package is finalized, make a bounded documentation pass to:

- align production wording with Sites version 7 and the reviewed v2 SHA;
- state the tested Chrome 151 environment and the fresh Work discovery limitation;
- keep “not a security scanner,” “not an arbitrary URL crawler,” “not CI-ready,” and “not npm-published” explicit;
- add concise judge testing steps with the exact goal and BROKEN/FIXED expectations;
- distinguish LIVE PLAYGROUND, LIVE EXECUTION, HUMAN APPROVED, and CAPTURED VALIDATION FIXTURE;
- reconcile stale sentences in older validation reports that predate production v2 integration;
- keep competitor descriptions out until authoritative sources are reviewed.

This is a submission-copy task for the next gate, not a reason to alter the Core or current production surface now.

## 23. Claim ledger

| Claim | Disposition |
| --- | --- |
| PARALLAX can show semantic failure after HTTP 200 | SUPPORTED, when explicit contract and observed effect evidence exist |
| PARALLAX compares Human and Agent surfaces | SUPPORTED, through developer contracts and X-Ray projections |
| PARALLAX derives deterministic results from contract + evidence | SUPPORTED, through the pure v1/v2 Core and tests |
| PARALLAX distinguishes policy outcome from domain effect in v2 | SUPPORTED when policy/effect evidence is supplied |
| Production page works with native WebMCP in Chrome 151 | SUPPORTED for the tested environment and documented flags |
| The five PARALLAX meta tools are available on the production page | SUPPORTED for the tested native page surface |
| PARALLAX works with any WebMCP application | SUPPORTED WITH SCOPE: a developer must provide a contract/evidence adapter; no zero-configuration claim |
| PARALLAX understands complementary surfaces | SUPPORTED WITH SCOPE: only when COMPLEMENTARY is explicitly declared and evidenced |
| PARALLAX prevents unsafe actions | DO NOT CLAIM as a general property; the controlled policy/demo path can prevent a demonstrated effect, while PARALLAX primarily detects and reports |
| ChatGPT Work/in-app browser compatibility is universal | DO NOT CLAIM; the current fresh runtime did not reach discovery |
| Luna is unsupported or Sol is required | DO NOT CLAIM; existing evidence is session/runtime-specific |
| PARALLAX is a security scanner or industry standard | DO NOT CLAIM |
| PARALLAX automatically infers intent from natural language or arbitrary DOM state | DO NOT CLAIM |
| PARALLAX is CI-ready, npm-published, or an arbitrary URL scanner | DO NOT CLAIM |

## 24. Limitations ledger

| Limitation | Where it must be stated |
| --- | --- |
| Contract and evidence adapters are required; no universal semantic inference | README, Devpost, testing instructions, deep validation docs |
| Client-runtime observations may be partial and are not application declarations | README, Devpost challenges, external records |
| WebMCP availability varies by browser flags, session, and client runtime | README/testing instructions and validation docs |
| Captured fixtures are not live execution | UI authority labels, README, Devpost, evidence records |
| CLI is local and not npm-published | README and integration example |
| Current Agency WARN can describe exposed capability rather than delegated or executed agency | README, FIXED demo narration, v2 documentation |
| Complementarity requires explicit contract declaration; it is not inferred | The Archive record and v2 documentation |
| Sites connector metadata does not expose a separate MCP server declaration | Deep validation/testing note; do not confuse it with page-native WebMCP failure |
| External findings are semantic design observations, not accusations | Devpost, README, and external validation records |

## 25. Fresh ChatGPT Work production validation

The authorized fresh Work-style check was attempted against the production URL.

| Item | Result |
| --- | --- |
| Environment | Fresh Codex in-app browser tab, production HTTPS URL, GPT-5.6 Luna-backed browser runtime |
| Page load | PASS; production page loaded |
| WebMCP capability request | Returned a WebMCP capability object |
| Native discovery attempt | NOT REACHED / unavailable before discovery |
| Exact runtime error | gpt-5.6-luna does not support command "webmcp_list_tools". |
| Tool list | Not available in this runtime; no list is fabricated |
| Native run_parity_audit invocation | NOT ATTEMPTED because discovery was unavailable |
| Structured result | Not available from this fresh runtime |
| Visible UI update | Not claimed for this attempt |
| Application mutation | None; no PARALLAX audit tool was invoked |

This is a client/runtime compatibility limitation for the tested fresh session, not evidence that the production page lacks native WebMCP. The dedicated Chrome 151 native production regression already verified discovery, structured invocation, visible UI updates, reset/re-run, and no reproducible PARALLAX-owned runtime exception. This attempt also does not establish a model-wide Luna incompatibility; it records only the exact observed runtime constraint.

## 26. P0 / P1 / P2

### P0 — submission blockers

None found.

The production candidate satisfies the central P0 requirements: the BROKEN path is Technical PASS / Semantic FAIL; the FIXED path preserves Intent PASS / Parity PASS with a justified Agency WARN; native Chrome 151 WebMCP invocation works; v1 fallback remains usable; and the v2 policy/effect and complementary-surface semantics are represented without changing the frozen v1 model.

### P1 — deferred submission-quality work

- Put the one-sentence product definition in the first-viewport copy or opening narration.
- State “controlled simulated playground” before showing the Subly charge visual.
- Recapture or verify every final screenshot against Sites version 7.
- Refresh README and stale validation wording for the current production v2 state.
- Carry the fresh Work discovery limitation into judge instructions without making model-wide claims.
- Refresh competitor research from authoritative sources before adding any public comparison claim.

These are important for presentation quality and claim hygiene, but no P1 requires changing the semantic model or blocking the freeze.

### P2 — explicitly out of scope

- Demo-video production.
- Final Devpost rewriting.
- Repository publicization or cleanup beyond a later authorized package pass.
- CI integration, npm publication, arbitrary URL scanning, browser extension work, accounts, authentication, and unrelated product features.

## 27. Freeze decision

**FREEZE**

The production candidate is suitable to freeze as the reviewed v2 baseline. The evidence supports a judge-facing claim that PARALLAX detects divergence between human intent and agent execution, including a technically successful semantic failure. The remaining caveats are documented runtime, evidence, capture, and submission-copy limitations rather than P0 product defects.

## 28. Repo-publication readiness

The repository is technically close to a submission-package baseline:

- the reviewed SHA is exact and the source branch is readable;
- the working tree was clean before this required audit record was added;
- the frozen v1 Core, Developer Contract v1, and Production Validation Matrix hashes remain recorded and unchanged;
- MIT licensing is present;
- no tracked secrets, credentials, absolute local paths, or generated build directories were found in the candidate review;
- the recent history is understandable: production evidence, v2 integration, then the small duplicate-key fix.

This is not authorization to publish the repository. Before publicization, perform the separate submission-package review for README accuracy, stale evidence references, screenshot provenance, links, history policy, and any repository-specific privacy decision. Do not force-push, change visibility, or rewrite history as part of this freeze.

## 29. Exact next gate

**PARALLAX Submission Package Production**

That gate may produce the final video, Devpost copy, verified version-7 screenshots, and a final claim/limitation pass. It must preserve this frozen production candidate and the evidence boundaries recorded here.

## 30. DO-NOT-CHANGE list

Until a later gate explicitly authorizes a change, do not change:

- Frozen v1 Core files or their hash.
- Developer Contract v1 or its hash.
- The current v2 semantic model, generic rules, or result vocabulary.
- The five PARALLAX meta tool names and schemas.
- The separation between DECLARED, OBSERVED, and DERIVED evidence.
- The distinction between application-declared boundaries and client-runtime approval.
- The COMPLEMENTARY surface relation semantics.
- The exact Subly goal and BROKEN/FIXED controlled paths.
- The honest FIXED Agency WARN expectation.
- The distinction between Technical PASS and Semantic FAIL/WARN.
- The labels separating LIVE PLAYGROUND, LIVE EXECUTION, HUMAN APPROVED, and CAPTURED records.
- Production visibility, source branch history, or the reviewed SHA.
- External applications or their validation records to manufacture findings.
- New P2 features, CI, npm publication, URL scanning, browser extensions, accounts, authentication, or universal inference.
- Video recording, final Devpost writing, or repository publicization before the next gate.

FREEZE
