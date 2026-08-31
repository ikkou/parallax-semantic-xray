# PARALLAX — ChatGPT Work / Luna WebMCP Interoperability Evidence Correction

Status: `EVIDENCE CORRECTION / HISTORICAL RECORD PRESERVED`

Validation date: `2026-08-30`

Scope: correction of the Luna interoperability interpretation in the Tagboard Gate #3 record. This is not a Core, Contract, WebMCP, application, deployment, or production-matrix change.

## 1. Original observation

During the Tagboard validation, an existing ChatGPT Work session using GPT-5.6 Luna returned:

~~~text
gpt-5.6-luna does not support command "webmcp_list_tools"
~~~

Observed consequences:

- Native tool invocation was not reached in that attempt.
- `add_note` was not called.
- No Tagboard write occurred.
- No fallback was used.

The original observation remains historical evidence. It describes that observed session; it does not establish that GPT-5.6 Luna is generally unsupported for WebMCP.

## 2. Follow-up observation

A later follow-up test used:

- ChatGPT Work;
- GPT-5.6 Luna;
- a new/fresh session; and
- Site tools enabled.

Observed result:

~~~text
WebMCP was successfully available and executable in the fresh Luna session.
~~~

This record preserves the supplied follow-up observation without claiming more detail than was observed. It does not claim that a fresh session always resolves WebMCP interoperability.

## 3. Corrected conclusion

Evidence layers:

| Layer | Statement |
|---|---|
| OBSERVED | An existing Luna session returned `webmcp_list_tools` unsupported before invocation. |
| OBSERVED | A fresh Luna session subsequently had WebMCP available/executable. |
| DERIVED | Model-specific Luna/WebMCP incompatibility is not established. |
| UNRESOLVED | The exact cause of the initial failure. |

The initial failure may have depended on session or runtime state, but that is a hypothesis, not an established defect. The evidence is also insufficient to conclude that Luna and Sol have identical WebMCP behavior.

The strongest operational recommendation supported by the evidence is:

> Start testing from a fresh ChatGPT Work session with Site tools enabled.

This is a reproducibility recommendation. It is not a protocol requirement, and GPT-5.6 Sol is not established as required.

## 4. Impact on Tagboard Gate #3

`docs/validation/2026-08-29-tagboard-blind-external-validation-gate3.md` was corrected narrowly:

- the initial Luna error remains preserved as an existing-session observation;
- the fresh Luna success is appended as a separate observation;
- the classification is scoped to the observed session;
- the table now states that model-specific incompatibility is not established;
- the v2 interoperability note now supports session/runtime-state variation, not model-dependent support.

The accepted 5.6 Sol path remains historical evidence of one successful client/runtime path. It is not presented as proof that Sol is required.

## 5. Other documentation review

The following files were reviewed for the affected claims:

- `README.md`
- `docs/validation/2026-08-29-tagboard-blind-external-validation-gate3.md`
- `docs/research/ORDER_TRACKING_EVIDENCE_CLOSURE_2026-08-27.md`
- `docs/validation/2026-08-29-kurio-blind-external-validation.md`
- `docs/validation/2026-08-29-kurio-blind-external-validation-live-reaudit.json`
- the remaining `docs/` validation and research records containing the search terms.

Only the Tagboard Gate #3 interpretation was invalidated by the new Tagboard follow-up evidence. The Order Tracking record remains unchanged because it explicitly scopes its Luna bridge failure to that connected browser context and already says it is not proof that the public application lacks WebMCP support in every environment.

No README or submission document contains a claim that GPT-5.6 Sol is required or that GPT-5.6 Luna is universally unsupported. No broad submission rewrite was made.

Search conclusions:

- `Sol required`: not established and not present as a requirement claim.
- `Luna unsupported`: the original error text remains as historical evidence; a universal unsupported-model conclusion is not present after this correction.

## 6. Interoperability model implication

The broader PARALLAX question remains valid: future evidence may need to distinguish application semantic findings from client interoperability, agent orchestration, and runtime/session failures.

The current evidence supports:

~~~text
INTEROPERABILITY STATE CAN VARY ACROSS OBSERVED SESSIONS
~~~

It does not support:

~~~text
INTEROPERABILITY SUPPORT DIFFERS BY MODEL
~~~

No v2 model change is implemented in this correction. A future interoperability dimension should record observed session, discovery, invocability, schema fidelity, runtime, and client-approval evidence without treating model identity as the explanation by default.

## 7. Preservation and verification

- Core source: unchanged.
- Developer Contract v1: unchanged.
- WebMCP registration and tool schemas: unchanged.
- Production validation matrix: unchanged.
- Deployment: none.
- Historical failed Luna observation: preserved in the Gate #3 record and the prior Order Tracking closure record.
- Core SHA-256 before/after: `1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82`.
- `git diff --check`: passed.

This addendum is the evidence-correction record; it does not erase or reinterpret the original failed-session observation as if it never occurred.
