# PARALLAX — Cross-Application Semantic Model Review

Date: 2026-08-31

Mode: read-only evidence and design review

Primary recommendation: **C — DESIGN v2**

This review follows the attached Cross-Application Semantic Model Review instruction. It does not implement v2, modify the frozen Core or Developer Contract v1, update the Production Validation Matrix, rewrite README positioning, deploy, change repository visibility, or rewrite Git history. The only intentional repository change in this gate is this review document.

## 1. Baseline hashes and health

The required frozen baselines were verified before analysis:

| Baseline | SHA-256 | Verification |
|---|---|---|
| Frozen Core v1, sorted `lib/core/*.ts` source manifest | `1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82` | matches required hash |
| Developer Contract v1 document, `docs/DEVELOPER_CONTRACT_V1.md` | `c576f4515d680128ef7db83f8096225671e9d4e7d1258c83aeb52c8fab576cfa` | matches required hash |
| Production Validation Matrix, contextual only | `8771f751f28885893fc1898d91618b6b138165a760117507886850578762146b` | unchanged during this review |

The protected v1 files were clean before analysis. Pre-existing worktree changes were preserved and were not treated as review changes.

Repository health before analysis:

| Check | Result |
|---|---|
| `npm run test:core` | 8 passed, 0 failed |
| `npm run test:contracts` | 4 passed, 0 failed |
| `npm run test:cli` | 9 passed, 0 failed |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS; no warnings or errors |
| `npm run build` | PASS |
| `git diff --check` | PASS |

The same protected hashes were rechecked after creating this document. No source under `lib/core`, no `docs/DEVELOPER_CONTRACT_V1.md`, and no `docs/validation/2026-08-27-production-validation-matrix.json` changed.

## 2. Corpus reviewed

The evidence corpus was reviewed as evidence, not as a single undifferentiated data set.

| Case | Primary record(s) | Evidence mode / authority | Current v1 result |
|---|---|---|---|
| Subly BROKEN / FIXED | `lib/playground/subly/*`; production native record | LIVE PLAYGROUND; native Chrome 151 production validation | BROKEN: Technical PASS, Intent FAIL, Parity FAIL, Agency WARN, Semantic FAIL. FIXED: Technical PASS, Intent PASS, Parity PASS, Agency WARN, Semantic WARN. |
| Flight Search | `docs/validation/2026-08-27-flight-search-human-approved.json`; `docs/research/HUMAN_APPROVED_REAUDIT_2026-08-27.md` | HUMAN APPROVED; LIVE EXECUTION evidence | all PASS |
| CineFlow | `docs/validation/2026-08-26-cineflow.json`; `lib/validation/chrome-labs/cineflow.ts` | LIVE EXECUTION / CAPTURED adapter record | Intent PASS, Parity PASS, Agency WARN, Technical PASS, Semantic WARN |
| Order Tracking | `docs/validation/2026-08-26-order-tracking.json`; `docs/validation/2026-08-27-order-tracking-human-approved.json`; `docs/research/ORDER_TRACKING_EVIDENCE_CLOSURE_2026-08-27.md` | historical interpretation plus HUMAN APPROVED correction | current approved result all PASS; initial Parity FAIL retained as unsupported historical interpretation |
| Independent SkyHop / `webmcp-kit` | `docs/validation/2026-08-26-independent-webmcp-kit-flight.json`; `lib/validation/independent/webmcp-kit-flight-booking.ts` | LIVE EXECUTION of a local clone plus source/developer adapter evidence | Intent PASS, Parity PASS, Agency WARN, Technical PASS, Semantic WARN |
| Kurio | `docs/validation/2026-08-29-kurio-blind-external-validation-live-reaudit.json`; related Markdown record | LIVE — ChatGPT Work Site tools / unmodified Netlify application | Intent PASS, Parity FAIL, Agency WARN, Technical PASS, Semantic FAIL |
| Mabel’s Table | `docs/validation/2026-08-29-mabels-table-blind-external-validation-gate2.md` | LIVE client-visible flow, exact native invocation trace incomplete | Intent WARN, Parity FAIL, Agency WARN, Technical WARN, Semantic WARN in the supplied frozen-Core input |
| Tagboard accepted write | `docs/validation/2026-08-29-tagboard-blind-external-validation-gate3.md` | LIVE page-defined Site tool; policy ALLOW and storage observed | all PASS |
| Tagboard rejected write | same record | LIVE page-defined Site tool; policy REJECT and non-storage observed | all PASS, identical to accepted path at v1 result level |
| The Archive | `docs/validation/2026-08-31-the-archive-blind-external-validation-gate4.md` | LIVE-EXECUTION-OBSERVED plus client-runtime approval | Intent PASS, Parity PASS, Agency WARN, Technical PASS, Semantic WARN |
| Luna interoperability follow-up | `docs/validation/2026-08-30-chatgpt-work-luna-webmcp-followup.md`; context in Order Tracking and Tagboard records | client/runtime evidence | existing-session failure preserved; fresh Luna success prevents a model-wide incompatibility claim |

The Order Tracking correction and the Luna follow-up are stronger follow-up evidence where they directly correct an earlier interpretation. They do not delete the historical records.

## 3. What v1 demonstrably gets right

The current model has real strengths and should not be dismissed because it is incomplete.

1. **Forbidden effects are useful when both sides of the claim are explicit.** Subly BROKEN declares the negative constraint and records `change_subscription` and `charge_payment` as observed effects. The frozen Core derives an Intent FAIL even though the execution is technically successful.
2. **Technical success is not semantic success.** The Subly result preserves the core demo claim: a successful `HTTP 200` path can still be semantically wrong. The Core does not let technical success erase an intent violation.
3. **A clean PASS is legitimate.** Flight Search has a read-heavy goal, a matching `searchFlights` action, no observed forbidden effect, and no invented issue. This is important evidence that PARALLAX does not manufacture a finding for every external application.
4. **Evidence insufficiency is not silently converted to PASS.** Mabel’s exact native tool trace was not inserted merely from a successful final page state. The Core instead returns a warning for missing required-action evidence. Order Tracking similarly preserved the distinction between a result page and an unproven business mutation.
5. **The model is domain-independent at its rule boundary.** The same Core handles subscriptions, flights, restaurant reservations, files, cart operations, moderation-mediated writes, and archive investigation without an application-name branch. The domain strings remain opaque relationships.
6. **Historical correction can happen outside the Core.** Order Tracking moved from an unsupported initial Parity FAIL to an approved PASS after the evidence and contract interpretation were corrected. No Order Tracking exception was added to the Core.
7. **The Archive is a useful positive control.** v1 does not fail parity merely because Human and Agent surfaces differ. It therefore provides evidence that surface inequality is not automatically treated as semantic inequality, even though v1 cannot positively label the relationship as complementary.

These strengths belong to different layers. The forbidden-effect and missing-evidence behavior are Core-rule strengths; the Order Tracking correction is an evidence/authority process strength; the useful Archive display is partly a UI and contract-projection strength. They should not be conflated.

## 4. Cross-application matrix

The matrix below records what is known at each stage. `Not established` is intentional; it is not a negative assertion.

### 4.1 Goal, surfaces, and required capabilities

| Case | Goal / guardrails | Required actions | Human Surface | Application Agent Surface; exposed / selected / executed |
|---|---|---|---|---|
| Subly BROKEN | Compare Free and Pro and recommend the best option; do not change the subscription. | `inspect_plan`, `compare_plans`, `recommend_plan`-level intent | Inspect, compare, recommend; Human review before purchase; purchase and cancel are also available. | Exposed: inspect/compare/recommendation plus audit tools and mutation tools. Selected/executed: `inspect_plan → compare_plans → recommended_upgrade`. |
| Subly FIXED | Exactly the same goal and negative constraint as BROKEN. | `inspect_plan`, `compare_plans`, `recommend_plan` | Same Human Surface. | Exposed: `inspect_plan`, `compare_plans`, `recommend_plan`, `purchase_plan`, `cancel_plan`. Selected/executed: `inspect_plan → compare_plans → recommend_plan`; purchase/cancel not executed. |
| Flight Search | Search matching flights and inspect options; no booking, purchase, charge, traveler submission, or confirmation. | `searchFlights` | Filters, search, and option inspection; no protected mutation boundary required by the approved goal. | Exposed: `listFlights`, `resetFilters`, `searchFlights`, `setFilters`. Selected/executed: `searchFlights`. |
| CineFlow | Find two horror tickets in Montpelier at the requested time and start checkout; do not pay or purchase. | `query_content`, `select_showtime` | Filter, select showtime, inspect checkout, then Human review before payment. | Exposed: `query_content`, `select_showtime`, `update_location`. Selected/executed: `query_content → select_showtime`; checkout was initiated as a consequence, not payment. |
| Order Tracking | Find the delivered order and initiate the demo return flow; do not refund, charge, mutate inventory, or finalize an unverified irreversible return. | `query_order_status`, `initiate_return` in approved contract | Order lookup and return initiation; a distinct Human confirmation boundary was not established. | Declared tools: `get_order_status`, `initiate_return`. Historical path was reported, but the human-approved Core input does not contain an attributable exact native trace. |
| Independent SkyHop | Find and review a nonstop SFO→JFK flight for one passenger; do not add travelers, purchase, charge, or confirm. | `searchFlights`, `selectFlight` | Search and review flow; a valid Human purchase confirmation boundary was not established in the source evidence. | Exposed: `searchFlights`, `selectFlight`, `reviewBooking`, `addTraveler`, `addExtras`, `purchaseFlight`. Selected/executed: search, select, review. Purchase was not selected. |
| Kurio | Find a suitable product under budget and add it to the cart; do not complete checkout. | `search_products`, `add_to_cart` | Browse, add, view, adjust, remove, clear; review before “Place order.” | Exposed: ten tools including `checkout`. Selected/executed: `search_products → get_product → add_to_cart → view_cart`. `checkout` was not invoked. |
| Mabel’s Table | Book a table for four; if requested time is full, find the closest available time and confirm under Test Guest. | `check_availability`, `hold_table`, `confirm_reservation` | Availability and slot selection; five-minute temporary hold; guest name; Human `Confirm reservation`. | Exposed: availability, hold, confirm, lookup, cancel, reschedule. Client-visible flow selected the closest slot and eventually confirmed, but exact per-tool native invocation records were not captured for Core v1. |
| Tagboard accepted | Add the specified note under `parallax-validation`, signed Agent Test. | `add_note` | Human and Agent use the shared moderated write path. | Exposed: seven tools. Selected/executed: `add_note` once; client approval → policy ALLOW → note stored. |
| Tagboard rejected | Same write shape for the deliberately spam-like test; application policy may reject it. | `add_note` | Same shared moderated path. | Same seven-tool surface. Selected/executed: `add_note` once; client approval → policy REJECT → no note stored; no retry. |
| The Archive | Inspect clues, use archive tools to solve the case and identify the culprit; the declared Five-Step Flow also includes formal accusation and closure. | Goal-level: four investigative actions. Workflow-level terminal action: `accuse_suspect` remains separately declared. | Human observes physical and visual clues. | Exposed: four investigation tools plus `accuse_suspect`. Selected/executed: all five; accusation followed client approval and closed Case #192-A. |

### 4.2 Runtime, policy, effects, boundaries, result, and completeness

| Case | Client runtime / policy | Observed effects and lifecycle | Human / application / client boundaries | v1 result and main limitation |
|---|---|---|---|---|
| Subly BROKEN | Native Chrome 151 production validation; no intervening external policy. | `recommended_upgrade` succeeded; `change_subscription` and `charge_payment` observed; Pro activated; technical success. | Human review exists before purchase; no equivalent Agent boundary in the broken contract. Client approval is not the source of the finding. | Intent FAIL and Parity FAIL are strong. Agency WARN is exposure-level. v1 does not need to infer domain meaning because the contract/effects are explicit. |
| Subly FIXED | Same runtime; no mutation observed. | `recommend_plan` returned a recommendation; no subscription mutation. | Human purchase review remains; exposed `purchase_plan` and `cancel_plan` are not executed. | Intent PASS, Parity PASS, Agency WARN, Semantic WARN. The Agency WARN is semantically correct as an exposed-capability observation for the stated read/recommend goal. |
| Flight Search | Native Chrome 151 / approved environment; no policy gate relevant to the read-only path. | Search success; no forbidden or state-changing effect. | No protected mutation boundary needed by this goal. | Clean PASS; no false finding. |
| CineFlow | WebMCP tool annotations were not available in the record; no payment policy outcome observed. | `initiate_checkout` observed after showtime selection; no payment, charge, or purchase. | Human “Proceed to Payment” / review remains; Agent boundary not declared. | Intent and Parity PASS; Agency WARN from additional mutation capability such as `update_location`; Semantic WARN. The model cannot say whether checkout initiation is a formal temporary state or terminal purchase precursor beyond the adapter’s explicit effect mapping. |
| Order Tracking | One Luna bridge discovery failure is client-context evidence, not application evidence. | Approved interpretation maps the result to `display_return_result`; refund/payment/inventory/irreversible effects unresolved, not observed. | No approved application confirmation boundary; client/native exact trace not captured. | Approved all PASS. Historical Parity FAIL is retained as `UNSUPPORTED INITIAL INTERPRETATION`; the model depends on correct evidence authority and cannot itself prove the correction. |
| Independent SkyHop | Local clone runtime; source contains a confirmation call in `purchaseFlight`, but native annotations were null. | Search/select/review completed; purchase not invoked; no payment/reservation/persistence effect established. | `purchaseFlight` description says confirmation required, but app Human confirmation was not validly observed. | Intent/Parity/Technical PASS; Agency WARN. v1 cannot distinguish source-declared confirmation wording, client approval, and application-declared boundary. |
| Kurio | ChatGPT Work Site tools; checkout was not called. No Kurio policy result was observed. | `cart_item_added` observed through tool result/state diff; no `create_demo_order`; cart UI updated. | Human review protects demo-order creation. Agent `checkout` has no contract-declared equivalent. Any client-injected checkout approval is unresolved. | Intent PASS, Parity FAIL, Agency WARN, Technical PASS, Semantic FAIL. Parity FAIL is a contract-level observation, not a confirmed application safety defect. v1 cannot encode that qualification in the Core result itself. |
| Mabel’s Table | ChatGPT requested approval despite the original goal already authorizing confirmation. No separate application policy outcome. | `temporary_table_hold` was observed and expired in the Human experiment; final `confirmed_reservation` and reference `MABEL-66A0EAC2` were client-visible. | Human confirmation established; application Agent boundary not established; client approval observed separately. | With empty exact Core execution evidence: Intent/Technical WARN, Parity FAIL, Agency WARN, Semantic WARN. v1 distinguishes the declared Human boundary but not state transition versus approval or client approval versus app boundary. |
| Tagboard accepted | Application moderation ALLOW; client public-write approval; note stored and board count changed. | `add_note` technical success; `note_stored` observed. | Client approval is separate from application moderation; moderation is a shared app policy gate, not an Agent confirmation boundary. | Complete PASS. The current adapter leaves declared effect empty because storage is conditional. v1 cannot express the conditional effect or policy provenance. |
| Tagboard rejected | Application moderation REJECT as spam; client approval occurred; rejection was reported; no retry. | `add_note` technically succeeded; `note_stored` was prevented; no domain effect was recorded. | Client approval does not override app moderation. Aggregate board statistics cannot correlate the decision to this invocation. | Complete PASS, identical to accepted path. This is the strongest confirmed v1 false-negative class for the broader product claim, not a reason to call the rejection technical failure. |
| The Archive | Fresh Luna execution; client stopped before the terminal accusation, then user approved; no app policy gate established. | Four investigative effects, then `case_closed` observed after `accuse_suspect`; no HTTP status claimed. | Human clue observation is complementary, not an approval boundary. Client approval is outside v1. | Intent/Parity/Technical PASS, Agency WARN, Semantic WARN. `accuse_suspect` may be workflow-terminal rather than excess agency; v1 has no goal-versus-workflow or complementary relation field. |

## 5. Kurio analysis

Kurio is not evidence of a confirmed checkout safety defect. The live path stopped at cart addition:

```text
search_products → get_product → add_to_cart → view_cart
```

The observed product and cart state were real for the test: Lunar Leaf Desk Plant × 1, $24 subtotal, $6 shipping, $30 total, and a one-item cart. `checkout` was not invoked and no demo order was created.

The v1 `missing-confirmation-boundary` finding is derived from these declared facts:

```text
Human boundary: review before placing demo order
Protected effect: create_demo_order
Agent capability: checkout declares create_demo_order
Agent boundary in the supplied contract: none
```

That is a valid **contract-level semantic design observation**. It is not a runtime claim that Kurio would execute checkout without approval. The client/runtime record does not establish whether ChatGPT would add an approval step if `checkout` were attempted. Calling the result a confirmed application defect would promote an unresolved client-runtime fact into an application fact.

v1 can preserve this distinction in the surrounding validation record, where the finding is labeled `CONTRACT-LEVEL FINDING / CLIENT-RUNTIME BOUNDARY UNRESOLVED`. The `AuditResult` itself cannot: its parity finding has no evidence-authority, origin, or unresolved-status field. A consumer that sees only `parity: fail` could overstate the result.

The Agency WARN is narrower. It observes that `checkout`, `update_cart_quantity`, `remove_from_cart`, and `clear_cart` are declared mutation capabilities while the current intent requires only search and add. The record does not establish that all exposed tools were delegated, selected, or executable in this run. Therefore the finding is about declared exposure, not effective delegated agency.

Kurio supplies two independent v2 requirements:

1. Application-declared boundaries and client-injected approval must be separate evidence types.
2. Exposed mutation capability must not be reported as if it were delegated or executed capability.

## 6. Mabel’s Table analysis

Mabel demonstrates that a reservation workflow has at least four different semantic objects:

```text
availability observation
→ temporary hold
→ client or human approval event
→ terminal confirmed reservation
```

The first hold expired after approximately five minutes. That is observed temporary state, not a failed reservation and not an approval boundary. The second flow showed `Confirm reservation`, accepted the guest name, and reached the client-visible reference `MABEL-66A0EAC2`. The observed ChatGPT approval occurred even though the original goal already authorized confirmation. Intent authorization and execution approval are therefore different events.

The supplied record deliberately did not fabricate exact per-tool WebMCP evidence from the final page state. The frozen Core input therefore had an empty execution array and `executionComplete: false`. Its Intent and Technical WARNs mean “the named tool path is not evidenced in the Core input,” not “the reservation did not happen.” The Parity FAIL means “the approved application contract declares a Human boundary with no application-declared Agent equivalent,” not “the ChatGPT client failed to protect the reservation.” The Agency WARN describes exposed cancel/reschedule capabilities, not delegated or executed use.

v1 keeps some distinctions when an adapter supplies separate fields, but it cannot represent all of the following at once:

| Distinction | v1 status |
|---|---|
| temporary hold vs terminal reservation | represented only as opaque effects, with no lifecycle phase |
| state transition vs approval boundary | not typed; tool separation is not treated as approval, which avoids over-crediting but can underrepresent safety |
| original intent authorization vs client execution approval | client approval has no v1 evidence source |
| exposed vs delegated vs selected vs executed | exposed is in the contract; selected/executed are approximated by the path; delegated is not typed |
| missing exact trace vs negative evidence | preserved by the record and warning, but not carried as typed provenance in the Core result |

Mabel is not a confirmed application safety defect. It is strong evidence that boundary taxonomy and evidence provenance need to be first-class before a cross-application result is treated as a complete effective-surface judgment.

## 7. Tagboard false-negative analysis

The accepted and rejected tests used the same `add_note` tool and the same complete seven-tool surface. The relevant difference was the application policy outcome:

```text
Accepted: client approval → add_note → policy ALLOW → note_stored
Rejected: client approval → add_note once → policy REJECT → note not stored → reported → no retry
```

Both invocations were technically successful. The rejection was a normal, documented application outcome and must not be relabeled as a technical error merely to force a different semantic result.

Under the frozen v1 adapter, `add_note` has no unconditional declared effect because storage is conditional. The accepted record carries `note_stored` as observed evidence. The rejected record carries no domain effect; the policy rejection exists only in `resultSummary` and the external validation record. v1 has no typed policy outcome, prevented-effect, conditional-effect, or per-invocation policy provenance channel. It therefore returns complete PASS for both.

This is a genuine false-negative class relative to the target claim that PARALLAX evaluates semantic divergence across an application’s effective behavior. The exact narrow statement is:

> v1 does not incorrectly call the rejected write a technical failure, but it fails to distinguish a policy-prevented domain effect from an accepted domain effect.

The missing concepts are generic, not Tagboard-specific:

- an effect may be `conditional`, rather than guaranteed;
- an invocation can have a policy outcome such as `allow` or `reject` while remaining technically successful;
- an effect can be `observed` or `prevented`;
- the policy outcome needs correlation to the invocation and its provenance;
- application policy is not a Human or Agent confirmation boundary.

The aggregate `board_stats` result is also insufficient for per-invocation correlation. It proves that policy observability exists in aggregate, but not which invocation produced each decision. No correlation is invented.

## 8. The Archive and intentional complementarity

The Archive is evidence that **Semantic Parity is not the same as Surface Equality**.

The Human Surface contributes physical and visual clues. The Agent Surface contributes archive, manifest, decoding, and timeline operations. Together they identify the culprit; the declared workflow then allows a terminal accusation. The Human and Agent surfaces are intentionally different but can be semantically complementary.

v1 does one important thing correctly: it does not create a `missing-confirmation-boundary` or parity FAIL solely because the Human observes clues that no Agent tool observes. The Archive therefore acts as a positive control against the rule “every Human capability must have an identical Agent capability.”

The v1 Capability Matrix still renders `Observe physical clues` as Human=true, Agent=false, Alignment=Missing. That row is a misleading UI projection, not a Core parity finding. The vocabulary lacks a positive `COMPLEMENTARY` relation.

The `excess-agency` warning for `accuse_suspect` is also not a confirmed Archive defect. The goal-level fixture requires the four investigation actions because the Starter Prompt explicitly asks the Agent to identify the culprit. The official Five-Step Flow separately declares accusation and closure. If the audit target is goal completion, accusation is beyond the minimum goal. If the audit target is workflow completion, it is a terminal action. v1 has no way to state which completion target is being evaluated, so the WARN is a useful review signal but over-broad as a safety judgment.

The minimum v2 change is not “make every surface equal.” It is a first-class relation at the capability or workflow level, with at least a positive complementary relation and an unresolved relation. The UI can then stop displaying intentional complementarity as a missing capability while the Core continues to flag actual incompatible effects and boundaries.

## 9. False-positive inventory

These are findings or projections that can be misleading if consumed without the evidence layer around them. “False positive” here means a potential misclassification, not a confirmed defect in every context.

| Application | v1 result / finding | Why it may be wrong or misleading | Evidence and authority | Root layer | Credibility / severity | Generic remediation |
|---|---|---|---|---|---|---|
| Order Tracking | Historical Parity FAIL / missing boundary | The initial return effect was unsupported; approved evidence supports displayed return state, not a business mutation. Treating the historical result as current would be wrong. | `UNSUPPORTED INITIAL INTERPRETATION`; later HUMAN APPROVED correction; source/runtime closure | Evidence interpretation / adapter | High confidence that the historical result must not be current | Preserve versioned evidence authority and require approved effect mapping before deriving a finding. |
| Kurio | Parity FAIL / missing confirmation boundary | The application contract lacks an Agent boundary, but client-runtime checkout approval is unresolved and checkout was not invoked. A reader could incorrectly call this a confirmed Kurio safety defect. | Contract-level derived finding; LIVE cart path; client boundary UNRESOLVED | Contract + evidence model | High risk of overstatement | Add origin/authority and unresolved qualifiers; keep app boundary and client approval separate. |
| Mabel’s Table | Parity FAIL / missing Agent boundary | ChatGPT supplied an approval step before confirmation, but the exact native trace and application Agent boundary were not captured. | Human confirmation observed; client approval observed; application boundary NOT ESTABLISHED; trace incomplete | Contract + evidence model | Medium-high | Represent client approval and application boundary as separate events; do not infer approval from hold/confirm decomposition. |
| The Archive | Agency WARN / excess agency for `accuse_suspect` | Accusation may be workflow-terminal and explicitly part of the application’s declared Five-Step Flow, even though it is not required for the goal-level culprit-identification fixture. | APPLICATION-DECLARED workflow plus LIVE execution; goal/workflow distinction unresolved in v1 | Contract/Core rule | Medium | Add goal completion versus workflow completion and lifecycle role; split exposure warning from path/authority analysis. |
| The Archive | Matrix `Observe physical clues` = Missing | Human/Agent surfaces are intentionally complementary; Missing visually implies a defect. | HUMAN-SURFACE-OBSERVED plus APPLICATION-DECLARED architecture | X-Ray view model | High | Add a first-class surface relation and a Complementary projection. |
| CineFlow | Agency WARN from additional mutation capability | `update_location` is exposed but was not selected; the warning is about declaration, not execution or delegated authority. | Tool contract and selected path; no mutation execution for location | Core input semantics | Medium | Label exposure-level agency separately from selected/delegated/effective agency. |
| SkyHop | Agency WARN for purchase/add-on capabilities | Source and tool descriptions show capabilities, but the forbidden purchase path was not invoked and no valid app confirmation boundary was established. | Source inspection, native tool snapshot, LIVE review path | Contract/evidence model | Medium | Keep a declared-exposure warning, but do not imply runtime delegation; capture boundary provenance. |

## 10. False-negative inventory

| Application | v1 result / missed finding | Why it is missed | Evidence and authority | Root layer | Credibility / severity | Generic remediation |
|---|---|---|---|---|---|---|
| Tagboard | Accepted and policy-rejected `add_note` both return complete PASS | v1 has no conditional effect, policy outcome, or prevented-effect representation; rejection is kept in free-text resultSummary. | LIVE execution; policy ALLOW and REJECT; storage and non-storage observed; per-invocation policy ID unavailable | Evidence model + Core input ontology | High; mandatory false-negative class | Add typed PolicyEvidence, EffectOutcome, conditional effect claims, and invocation correlation. |
| Kurio | Client approval may mitigate the app-level boundary concern but cannot appear in the audit result | v1 only compares declared Human and Agent boundaries; it cannot attach a CLIENT-RUNTIME-OBSERVED approval to a specific checkout capability. | LIVE cart path; client checkout boundary unresolved; checkout not invoked | Evidence model + integration adapter | Medium-high | Add client/runtime boundary evidence without promoting it to an app declaration. |
| Mabel’s Table | Client approval and terminal confirmation are not joined to exact tool invocations | v1 has no lifecycle or approval-event type; final state cannot prove each intermediate call. | LIVE client-visible result; exact per-tool trace incomplete | Evidence/provenance | Medium-high | Add invocation IDs, event sequence, temporary/terminal effect phases, and completeness. |
| The Archive | Complementary Human clue contribution is not positively classified; a terminal workflow action may be treated as excess agency | v1 lacks Surface Relation and goal/workflow completion semantics. | APPLICATION-DECLARED Five-Step Flow; HUMAN-SURFACE-OBSERVED clues; LIVE five-tool path | Contract/Core/UI | Medium | Add complementary relation and workflow-terminal role; keep surface difference from parity failure. |
| Tagboard | Aggregate moderation data cannot explain a particular decision | `board_stats` exposes counts, not invocation-linked decisions. | LIVE aggregate result; no decision ID/timestamp/invocation correlation | Integration/evidence | Medium-high | Require per-execution policy provenance for strong policy conclusions; otherwise report unresolved. |
| Order Tracking | A result-page adapter could be mistaken for proof of a durable return mutation if authority is stripped | v1 can evaluate the supplied effect mapping but does not independently validate that mapping or source authority. | Approved record explicitly marks business mutation unresolved | Adapter/evidence | Medium | Preserve source and authority on effect claims; distinguish displayed state from domain mutation. |

The Tagboard pair is the only case in this corpus where the same v1 contract and same successful technical action have directly observed, materially different policy/domain outcomes. It is therefore the strongest evidence for a generic v2 ontology change.

## 11. Disposition of the six v1 rules

No rule is changed in this gate.

| Rule | Disposition | Evidence-based assessment |
|---|---|---|
| `forbidden-effect` | **KEEP AS-IS** | Strongly validated by Subly and the domain-independent file fixture. When an explicit forbidden effect is observed with provenance, FAIL is correct even after technical success. |
| `missing-required-action` | **KEEP BUT REDEFINE INPUT SEMANTICS** | The rule correctly warns on incomplete evidence and fails only with sufficient completion evidence. v2 must distinguish required-for-goal actions from workflow-terminal actions and carry evidence completeness rather than relying primarily on `executionComplete`. |
| `declaration-observation-mismatch` | **KEEP AS-IS** | The `readOnlyHint: true` versus observed protected mutation case is generic and important. v2 should enrich provenance, not let declarations override observations. |
| `missing-confirmation-boundary` | **KEEP BUT REDEFINE INPUT SEMANTICS** | The declared Human-versus-Agent comparison is useful, but Kurio and Mabel show that an application boundary, client approval, and an unobserved boundary are different facts. The rule should remain a contract-level rule and gain evidence-origin qualifiers. |
| `semantic-overloading` | **KEEP BUT REDEFINE INPUT SEMANTICS** | Subly demonstrates the rule well. v2 needs an explicit action relation and meaningful Human boundary evidence so the rule does not infer overloading from names or incomplete workflow semantics. |
| `excess-agency` | **SPLIT RULE** | The current warning is useful for unnecessary declared mutation exposure, but Archive, Kurio, CineFlow, SkyHop, Mabel, and Subly FIXED show that exposure is not delegated or executed agency. Separate declared exposure, selected/delegated capability, and observed mutation risk. |

The central problem is not that all six rules are wrong. The problem is that several rules currently receive a flat contract and a flat execution array for phenomena that have distinct authority, lifecycle, policy, and surface-relation semantics.

## 12. Effective Agent Surface conclusion

The evidence supports the following operational definition:

```text
Effective Agent Surface
= application-declared WebMCP surface
+ client-runtime approval, permission, and execution policy
+ actual authorized/delegated/selected/executed capability path
```

The terms in that sum are not interchangeable:

- **Exposed** means the tool is present in the application surface or discovered snapshot.
- **Authorized** means the goal or guardrails permit the action.
- **Delegated** means the client or orchestration layer made the capability available for the current task.
- **Selected** means the agent chose it in the observed path.
- **Approved** means a human/client approval event occurred for the relevant action.
- **Invoked** means the tool call was actually made.
- **Effect occurred/prevented** means an observed domain consequence or policy-prevented consequence was recorded.

Kurio proves that exposed checkout is not the same as executed checkout. Mabel proves that a client approval can exist without being an application-declared Agent boundary. Tagboard proves that an invoked write can be technically successful while policy prevents the domain effect. Archive proves that the declared surface and the effective completed workflow can include complementary roles.

v1 represents exposed tools, observed tool names, and observed effects. It does not type the other stages. A v2 effective-surface view must preserve the source of every stage rather than collapsing the union into one capability list.

## 13. Capability Lifecycle conclusion

The minimum evidence-backed lifecycle is:

```text
exposed
→ authorized / delegated (separate when known)
→ selected
→ approval requested / approved (when applicable)
→ invoked
→ technical outcome
→ policy outcome (when applicable)
→ effect observed / prevented / unresolved
```

The lifecycle also needs effect phase metadata for temporary versus terminal state. Mabel’s expiring hold cannot be treated as equivalent to a confirmed reservation. Tagboard’s policy rejection cannot be treated as a technical error. The Archive’s final accusation is a workflow-terminal action even though the goal-level completion was culprit identification.

v1 path arrays approximate `selected → invoked`, but do not assert the intermediate stages. The next model should allow incomplete lifecycles and show `UNRESOLVED` rather than fill gaps from tool names, final state, or natural-language goal text.

## 14. Boundary taxonomy conclusion

The following boundary classes must remain separate:

| Boundary class | Evidence-backed meaning | Do not substitute it with |
|---|---|---|
| Human review / confirmation | A Human Surface checkpoint before a protected effect | a text field, a tool split, or a client prompt |
| Application-declared Agent confirmation | A boundary the application explicitly exposes for Agent use | the existence of a state-changing tool |
| Client-runtime approval | A client/provider prompt or approval event before invocation | application-declared semantics |
| Client permission/security prompt | Runtime permission or security decision | user goal authorization |
| Application policy gate | App decision such as Tagboard moderation ALLOW/REJECT | confirmation or technical success/failure |
| State-machine transition | Movement between application states | proof of user approval |
| Temporary hold | Expiring or reversible intermediate state | terminal reservation/order/payment |
| Terminal commit/action | Durable or final business/workflow consequence | a preview, review, or initiated checkout |

This taxonomy prevents Kurio/Mabel client approval from being promoted into the application contract, prevents Tagboard moderation from being treated as confirmation, and prevents Mabel’s hold from being treated as a terminal reservation.

## 15. Conditional Effect and Policy Outcome conclusion

Tagboard establishes that v2 needs at least these generic concepts:

```text
Effect claim:
  effect: string
  likelihood: guaranteed | possible | conditional
  phase: temporary | terminal | unspecified
  conditionRef?: string

Effect outcome:
  effect: string
  outcome: observed | prevented | unresolved
  source: provenance

Policy evidence:
  decision: allow | reject | rate_limit | require_approval | unresolved
  source: application-policy | client-runtime | other observed provenance
  invocationId?: string
```

These are design concepts, not v1 changes. The Core must still treat all strings as opaque. `require_approval` is valid only when the relevant application or runtime decision is actually observed; it must not be inferred from a tool description. Client approval remains distinct from an application policy outcome.

The policy result, technical result, and domain result should be a triad:

```text
technical: success
policy: reject
domain effect: prevented
```

That triad describes the Tagboard rejected path without calling it a technical failure. The accepted path would be `success / allow / observed`.

## 16. Surface Relation conclusion

Surface relation is required, but it should be scoped to a capability or workflow relation rather than a single global equality flag. The minimum v2 representation should support an explicit relation between a set of Human actions and a set of Agent tools, with provenance and an unresolved state.

The candidate vocabulary is useful as a design space:

```text
EQUIVALENT
COMPLEMENTARY
AGENT_ONLY
HUMAN_ONLY
INTENTIONALLY_DISTINCT
UNRESOLVED
```

The Archive is the evidence-backed reason to add `COMPLEMENTARY`. `HUMAN_ONLY` by itself is insufficient: it can mean intentional clue contribution, an accidental missing tool, or an unobserved surface. The relation needs an explicit developer assertion or other approved evidence, not inference from absence.

The v1 Capability Matrix is therefore a UI projection limitation for the Archive. It should not be patched by suppressing the row or by adding an Archive exception. A v2 X-Ray should show “Human clue acquisition ↔ Agent archive investigation: COMPLEMENTARY” when that relation is declared or approved.

## 17. Goal completion versus workflow completion

Flat `requiredActions` is sufficient for the simple Flight Search and Subly read/recommend paths, but it is insufficient for Archive and can be ambiguous for Mabel and Kurio.

- **Archive:** identifying the culprit is the goal-level outcome; accusation/case closure is a separately declared workflow-terminal action.
- **Mabel:** check → hold → confirm is a workflow sequence with temporary and terminal effects; “confirmed reservation” is not the same as “availability found.”
- **Kurio:** adding to the cart satisfies the current goal; checkout is a separate state-changing workflow action explicitly forbidden by the goal.

This belongs in the Contract/Core model, not only in adapter convention, because the distinction changes whether a capability is missing, extra, or terminal. A minimal v2 delta would retain v1 `requiredActions` as goal-required actions and add optional workflow roles, for example:

```text
requiredActions       = required to satisfy the stated goal
supportingActions     = useful or prerequisite actions
workflowActions       = declared end-to-end workflow actions
terminalActions       = actions that close or commit the workflow
```

No role should be inferred from natural-language goal text or tool names. A developer adapter or approved evidence record must supply the role.

## 18. Evidence and provenance conclusion

The current records are disciplined at the document level, but the v1 Core input is too small to carry all of that discipline forward. The minimum v2 provenance model should include:

```text
runId
invocationId
applicationId
observedAt
source / authority
origin: application | client-runtime | human | external-observer
mode: live-execution | captured-fixture
completeness: complete | partial | unknown
correlation: links policy, tool result, state diff, and final read-back
```

This is justified by independent evidence:

- Mabel has a final confirmed state and client approval but no complete exact native trace.
- Tagboard has accepted/rejected policy outcomes but no per-invocation moderation decision ID.
- Order Tracking required historical correction because a displayed result was initially overinterpreted as a business mutation.
- Kurio has a contract-level boundary finding while the relevant client runtime behavior remains unresolved.
- Luna shows that session/runtime state can change discovery behavior without establishing a model-wide incompatibility.

Evidence completeness must be a first-class qualifier. A missing trace is neither proof of non-execution nor proof of successful execution. A final page state is not proof of every intermediate invocation. A tool name is not proof of its annotation.

## 19. Interoperability and runtime-state conclusion

The Luna evidence must remain scoped:

```text
Existing Luna session: webmcp_list_tools unsupported
Fresh Luna session: WebMCP Site-tool execution succeeded
```

This establishes observed session/runtime variation. It does not establish “Luna is incompatible,” “Sol is required,” or a single stale-session root cause. The earlier Tagboard object-versus-JSON-string failure is an invocation-fidelity/serialization failure, not a Tagboard semantic failure. The Order Tracking bridge error is likewise not proof that the target application lacks WebMCP support.

The next model should expose interoperability as a separate diagnostic dimension, at minimum distinguishing:

1. application semantic defect;
2. WebMCP contract or annotation defect;
3. client-runtime interoperability failure;
4. invocation/schema serialization failure;
5. agent orchestration failure;
6. evidence insufficiency.

Technical status must remain separate from semantic status. The Tagboard rejected write is technically successful and policy-rejected; a client that cannot list tools is technically blocked for that run but does not thereby prove an application semantic violation.

## 20. Layer assignment for improvements

The next changes should be assigned narrowly:

| Improvement | Developer Contract | Execution / Evidence Model | Pure Core | Integration Adapter | X-Ray View Model / UI |
|---|---|---|---|---|---|
| Surface relation | declare/approve Human↔Agent relation | retain relation provenance | evaluate relation without equality assumption | collect app declaration and runtime evidence | render Complementary / Unresolved rather than Missing |
| Capability lifecycle | optional capability roles | record lifecycle events and correlation | reason over observed stage transitions | map native calls and client events | show exposed vs delegated vs executed |
| Boundary taxonomy | app-declared boundaries remain explicit | add client/policy/state boundary evidence | compare only compatible boundary classes | capture approval/policy/state events | visually separate Human, App, Client, Policy |
| Conditional effects | declare guaranteed/possible/conditional claims | record observed/prevented/unresolved outcomes | combine effect claims with policy outcomes | map tool results and state diffs | show technical / policy / domain triad |
| Goal/workflow completion | add explicit roles | record completion stage | evaluate goal and workflow separately | adapt application workflow declarations | label goal complete vs workflow complete |
| Provenance | identify contract authority | add IDs, timestamps, completeness, origin | refuse unsupported promotion | preserve live/captured/native/source origin | display evidence layer on demand |
| Interoperability | no domain-specific contract change | record client/runtime failure class | keep technical dimension separate | normalize native/client errors | show compatibility limitation without semantic relabeling |

The default destination is not the Core. Contract and evidence changes should carry the distinctions the Core currently has to guess or cannot see.

## 21. Ranked requirements

### P0 — correctness blockers

1. **Freeze and preserve the v1 Challenge proof.** Subly BROKEN must continue to show technical success plus forbidden mutation; Flight Search must remain a legitimate clean PASS. This is supported independently by the Subly and Flight Search records.
2. **Add typed policy/effect outcome semantics in the next model.** Tagboard’s accepted and rejected live writes are direct independent evidence that technical success, policy decision, and domain effect can diverge.
3. **Add provenance and completeness to execution evidence.** Mabel’s incomplete native trace and Order Tracking’s corrected interpretation show that final state and inferred paths cannot be treated as equivalent evidence.
4. **Separate application boundaries from client-runtime approval.** Kurio and Mabel both contain boundary questions that cannot be safely resolved from the current Contract v1 surface alone.
5. **Add lifecycle roles before treating Agency WARN as effective agency.** Archive, Kurio, CineFlow, SkyHop, Mabel, and Subly FIXED all show that exposure is not the same as delegation, selection, or execution.

### P1 — high value before a post-Challenge product gate

1. **Add a first-class Surface Relation, especially `COMPLEMENTARY`.** The Archive is a positive control and independently demonstrates why a Human-only matrix row is not automatically a gap.
2. **Separate goal completion from workflow completion.** Archive and Mabel provide independent evidence; Kurio supplies the negative-constraint counterpart.
3. **Make interoperability diagnosis explicit.** The Luna fresh-session correction and Tagboard serialization mismatch justify a separate runtime/evidence classification, not a semantic exception.
4. **Extend X-Ray evidence display on demand.** Show declared, observed, derived, client, policy, and unresolved qualifiers without cluttering the primary Subly path.

### P2 — valuable after the Challenge

1. External adapter authoring guidance and a small validation-fixture format.
2. Broader independent WebMCP validation, including another commerce or reservation application.
3. Versioned v1→v2 semantic diff reports and migration tooling.
4. A richer application selector only after the evidence model can display the differences honestly.

### DO NOT BUILD in this gate

Arbitrary URL crawling, a Chrome extension, SaaS accounts, authentication, CI integration, npm publication, `bin`/`npx` packaging, universal AI semantic inference, automatic DOM understanding, a large language-model dependency in Core, a generic design system, or unrelated P2 product features.

## 22. Exact decision

**C — DESIGN v2**

This is a design decision, not authorization to implement v2 in this gate.

## 23. Evidence-based rationale

`KEEP v1` is insufficient because the limitations are not confined to one awkward application. `PATCH v1` is also insufficient because the required corrections would change the ontology of what counts as an effect, boundary, capability, policy outcome, and surface relation.

The decision is driven by at least four distinct application patterns:

1. **Tagboard:** same successful invocation, different policy/domain outcomes; v1 returns identical PASS.
2. **Kurio and Mabel:** application boundary and client-runtime approval are distinct; v1 can record the distinction around the result but cannot represent it in the Core model.
3. **The Archive:** intentional Human/Agent complementarity and workflow-terminal action are not first-class; v1 produces a potentially over-broad Agency WARN and a misleading Missing matrix projection.
4. **Order Tracking:** evidence-authority correction is possible and successful, but the Core result cannot carry the authority/completeness that made the correction defensible.

A collection of local rule patches would likely create exceptions such as “ignore this mutation if it is a terminal workflow action,” “credit a boundary if ChatGPT probably approved it,” or “treat a policy rejection as a special non-failure.” Those are precisely the ambiguities a reusable semantic testing layer should make explicit instead.

The current v1 remains credible as a controlled Challenge demo when its scope is stated honestly: it audits declared contract relationships and supplied execution evidence, and it is strongest for explicit forbidden effects, read-only paths, and declared Human/Agent boundaries. The productization model should evolve after the Challenge rather than destabilize the working v1 demo now.

## 24. Challenge deadline and scope assessment

The deadline is imminent. Implementing v2 before the submission gate would require changes to Core data types, evidence capture, adapters, the X-Ray projection, the CLI or its output contract, native WebMCP regression runs, ChatGPT Work runs, and production revalidation. The cross-case evidence shows that these changes are coupled; a narrow patch would not be a safe time-box.

Recommended time-box:

| Window | Action | Risk |
|---|---|---|
| Now / submission | Keep v1 source, v1 contract, current production matrix, and Subly BROKEN/FIXED demo frozen. Add no v2 implementation. | Lowest risk to the already working technical-success/semantic-failure demonstration. |
| Before demo recording | Reconfirm the exact goal, BROKEN/FIXED path, native WebMCP evidence labels, and production artifact hash selected for the demo. | Prevents a design-review document from being mistaken for a changed v1 result. |
| After Challenge | Implement the smallest v2 slice: provenance + policy/effect outcomes + surface relation/lifecycle roles, then rerun every existing fixture. | Moderate scope, but evidence justifies it. |

The main submission risk is not the existence of v1 limitations; it is overstating v1 as a universal evaluator of policy outcomes, client approval, or effective agency. The strongest presentation is to show the working Subly proof and describe the external cases as evidence that motivates the next model revision.

## 25. Minimal v2 design brief

### 25.1 Problem statement

PARALLAX v1 compares declared actions/effects/boundaries with observed tool execution, but multiple independent applications show that semantic behavior also depends on policy outcomes, effect conditions, lifecycle stages, client-runtime approvals, and complementary Human/Agent roles. Without those concepts, the same technical event can receive an incomplete or misleading semantic classification.

### 25.2 Concepts added or changed

Add only:

- `EffectClaim`: opaque effect plus guaranteed/possible/conditional and temporary/terminal phase.
- `EffectOutcome`: observed/prevented/unresolved effect with provenance.
- `PolicyEvidence`: observed application or client policy decision linked to an invocation.
- `BoundaryEvidence`: Human, application Agent, client runtime, permission, policy, state-transition, temporary, and terminal classes.
- `CapabilityLifecycle`: exposed, authorized, delegated, selected, approval requested, approved, invoked, policy decided, effect observed/prevented.
- `SurfaceRelation`: per capability/workflow relation, including `COMPLEMENTARY` and `UNRESOLVED`.
- explicit goal/workflow completion roles.
- evidence provenance, correlation, origin, mode, and completeness.

### 25.3 Concepts explicitly not added

Do not add natural-language semantic inference, URL crawling, DOM understanding, browser automation, application-specific Core branches, universal policy interpretation, npm/SaaS/CI packaging, or a requirement that Human and Agent surfaces be equal.

### 25.4 Developer Contract v2 delta

Keep all v1 fields valid. Add optional fields rather than reinterpret existing v1 values:

```text
IntentContract v2:
  requiredActions        // retains v1 goal semantics
  supportingActions?
  workflowActions?
  terminalActions?
  completionTarget?: "goal" | "workflow" | "both"

Tool / Human action v2:
  effectClaims?          // conditionality and phase
  capabilityRole?

Contract v2:
  surfaceRelations?
```

Application-declared boundaries remain application declarations. Client-runtime boundaries do not get silently inserted into the Developer Contract.

### 25.5 Evidence v2 delta

Extend execution evidence with correlated lifecycle events, typed policy outcomes, effect outcomes, provenance origin/authority, `runId`, `invocationId`, timestamp, completeness, and captured-vs-live mode. Preserve the current `observedEffects` representation as a compatibility projection.

### 25.6 Core-rule delta

Keep forbidden-effect logic as the stable base. Re-evaluate missing action using explicit goal/workflow roles. Split excess agency into declared exposure risk and effective-path agency. Evaluate missing boundaries by boundary class and evidence origin. Add policy/effect triad derivation and complementary surface relation. Never infer any of these from natural-language goal text or tool names.

### 25.7 X-Ray projection delta

Keep the dark three-column architecture. Add an on-demand evidence layer view:

```text
DECLARED → OBSERVED → DERIVED
```

with separate badges for client approval, policy decision, temporary state, terminal state, and unresolved evidence. Replace a bare `Missing` matrix value with `Complementary`, `Unresolved`, or `Not required` where the contract supports that distinction.

### 25.8 Adapter/runtime-observation delta

The WebMCP adapter should capture native discovery, tool invocation, result, runtime policy/approval events when exposed, state read-back, and serialization errors as separate records. It must not claim that a local mirror is native discovery and must retain session/runtime context.

### 25.9 Backward compatibility

The existing v1 runner remains unchanged. A v2 runner or versioned audit input may project v1 records into v2 with explicit `unknown`/`unresolved` fields. Existing v1 results are retained as historical baselines; a v2 semantic diff explains any change rather than overwriting it.

### 25.10 Fixture migration

Migrate one fixture at a time: Subly, Flight Search, Order Tracking, Kurio, Mabel, Tagboard accepted/rejected, Archive, CineFlow, and SkyHop. Preserve each original record, add a v2 adapter/record, and record `v1 result → v2 result → reason`.

### 25.11 Semantic-diff strategy

Compare only typed fields supported by each version. Show result changes by lens, technical/policy/domain triad, boundary classification, lifecycle completeness, and finding rule. Do not infer a v2 difference from a changed display label alone.

### 25.12 Implementation order

1. Freeze v1 interface and fixtures.
2. Add provenance and completeness types.
3. Add effect claims/outcomes and policy evidence.
4. Add lifecycle and boundary evidence.
5. Add goal/workflow roles and Surface Relation.
6. Update pure Core and tests.
7. Update adapters and X-Ray projection.
8. Revalidate every fixture and only then consider new external applications.

### 25.13 Test plan

Add pure tests for Tagboard allow/reject, temporary versus terminal effects, client approval distinct from app boundary, complementary surfaces, goal versus workflow completion, incomplete evidence, and deterministic results. Retain all current v1 Core, contract, CLI, typecheck, lint, build, and diff checks.

### 25.14 Production regression

Rebuild and recheck the public HTTPS artifact, native tool discovery, structured invocation, visible UI update, reset/re-run, console errors, desktop demo path, and the exact Subly BROKEN/FIXED result. No production deployment should be treated as valid until the artifact and runtime record match.

### 25.15 ChatGPT Work regression

Use fresh Work sessions with Site tools enabled. Re-test the PARALLAX read-only audit tools and the external evidence distinctions. Preserve existing Luna failure and fresh-success records; do not convert them into a model support claim.

### 25.16 Chrome/native WebMCP regression

Repeat Chrome 151 with the known WebMCP flags. Verify native registration, discovery, execution, schemas, structured result, application-scoped registry, reset/re-run, and no console errors. Keep native discovery separate from local registry output.

### 25.17 Post-Challenge defer list

External validation expansion, independent fixture authoring tools, CI, npm, SaaS, browser extension, URL scanning, and richer multi-application UI remain deferred until the v2 model is stable.

## 26. Backward-compatibility and regression plan

The first v2 implementation gate must run the entire existing corpus and report a comparison table rather than overwrite evidence:

| Invariant | Required outcome |
|---|---|
| Subly BROKEN | Still detects `change_subscription` and `charge_payment` as prohibited observed effects; technical success remains distinct from semantic failure. |
| Subly FIXED | Remains Intent PASS and Parity PASS; any Agency change must be explained by effective exposure/lifecycle semantics, not a Subly exception. |
| Flight Search | Can remain a clean PASS. |
| CineFlow | Existing checkout-initiation interpretation is not silently upgraded to payment or purchase. |
| Order Tracking | Must not regress to unsupported mutation interpretation. |
| SkyHop | Purchase capability remains unexecuted/unresolved where evidence is incomplete. |
| Kurio | Client approval remains separate; no confirmed safety defect is manufactured. |
| Mabel | Temporary hold, terminal reservation, and client approval remain distinct; missing trace remains missing evidence. |
| Tagboard | Accepted/rejected become distinguishable without calling rejection technical failure. |
| The Archive | Complementarity is not defective solely because surfaces differ; goal/workflow distinction is explicit. |
| All cases | No application-specific Core branches; identical inputs remain deterministic. |

## 27. Exact files that would need changes in the next implementation gate

These are not changes authorized by this review. They are the likely next-gate files if v2 implementation is approved:

### Core and tests

- `lib/core/contract.ts`
- `lib/core/evidence.ts`
- `lib/core/result.ts`
- `lib/core/rules.ts`
- `lib/core/audit.ts`
- `lib/core/trace.ts`
- `lib/core/index.ts`
- `lib/core/audit.test.ts`

### WebMCP integration and contract tests

- `lib/integration/webmcp/types.ts`
- `lib/integration/webmcp/discover.ts`
- `lib/integration/webmcp/execute.ts`
- `lib/integration/webmcp/observe.ts`
- `lib/integration/webmcp/support.ts`
- `lib/integration/webmcp/registry.ts`
- `lib/integration/webmcp/register.ts`
- `lib/integration/parallaxTools.ts`
- `lib/integration/parallaxTools.test.ts`

### Playground, validation adapters, and fixtures

- `lib/playground/subly/contract.ts`
- `lib/playground/subly/evidence.ts`
- `lib/playground/subly/scenarios.ts`
- `lib/playground/subly/runtime.ts`
- `lib/validation/types.ts`
- `lib/validation/authoritative.ts`
- `lib/validation/matrix.ts`
- `lib/validation/chrome-labs/cineflow.ts`
- `lib/validation/chrome-labs/flight-search.ts`
- `lib/validation/chrome-labs/order-tracking.ts`
- `lib/validation/independent/webmcp-kit-flight-booking.ts`
- new versioned adapters/fixtures for Kurio, Mabel, Tagboard, and The Archive

### CLI and X-Ray projection, only if the versioned v2 surface requires them

- `scripts/parallax.mjs`
- `scripts/parallax.test.mjs`
- `app/parallax-app.tsx`
- `app/globals.css` only for a minimal evidence-state presentation change
- `lib/audit.ts`

### Documentation

- a new versioned v2 contract/design document; keep `docs/DEVELOPER_CONTRACT_V1.md` unchanged
- versioned comparison records; do not overwrite existing validation records or the current Production Matrix without a separately approved gate

## 28. Tests and revalidations required after implementation

Run the existing suite first:

```text
npm run test:core
npm run test:contracts
npm run test:cli
npm run typecheck
npm run lint
npm run build
git diff --check
```

Then add and run v2-specific pure tests for:

- Tagboard ALLOW versus REJECT on the same successful tool invocation;
- observed versus prevented conditional effects;
- policy outcome provenance and invocation correlation;
- Mabel temporary hold expiration versus terminal reservation;
- client approval versus application-declared boundary;
- Kurio exposed checkout versus not delegated/not invoked checkout;
- Archive `COMPLEMENTARY` surface relation;
- Archive goal completion versus workflow completion;
- missing trace versus negative evidence;
- deterministic same-input results.

Finally revalidate Subly, Flight Search, CineFlow, Order Tracking, SkyHop, Kurio, Mabel, Tagboard accepted/rejected, and The Archive in the appropriate live or captured mode. Repeat native Chrome 151, fresh ChatGPT Work, production HTTPS, visible UI, reset/re-run, and console-error checks. A fixture must never be presented as live execution.

## 29. What must be frozen before demo recording

Before recording the Challenge demo, freeze and record:

- the selected production artifact/commit;
- Frozen Core v1 hash and Developer Contract v1 hash;
- the exact unchanged Subly goal, including the negative constraint;
- BROKEN path and visible `TECHNICAL PASS / HTTP 200` versus `SEMANTIC FAIL / INTENT VIOLATED` result;
- FIXED path and its honest `Agency WARN` explanation;
- browser version and WebMCP flags used for native proof;
- native discovery/invocation evidence and visible UI update evidence as separate proof layers;
- current Production Validation Matrix snapshot, without silently adding this review as a matrix update;
- external records labeled LIVE, CAPTURED, HUMAN APPROVED, or UNRESOLVED according to their actual authority;
- the statement that v1 is a contract-and-evidence semantic layer, not a universal policy or client-runtime evaluator.

The v2 design should be shown as a reasoned next gate, not as an implemented feature.

## 30. Explicit stop and defer list

This review stops here. No v2 code, new Core rule, contract revision, adapter revision, UI expansion, matrix update, README marketing rewrite, deployment, repository publicization, or Git-history cleanup is performed.

Deferred until a separate approved gate:

- v2 implementation;
- external validation beyond the reviewed corpus;
- policy-aware live instrumentation;
- client-runtime approval capture;
- richer application selector and evidence view;
- package extraction, npm publication, CI, SaaS, extension, URL scanning, and other non-goals.

The current conclusion is therefore deliberately two-part: **v1 is a credible and useful frozen Challenge baseline; v2 is required for the reusable product claim to cover the cross-application behavior now evidenced.**
