# PARALLAX v2 Minimal Validation Corpus

Status: `IMPLEMENTED / LOCAL VALIDATION`

This report records the first additive v2 corpus. The source adapters are in [`lib/validation/v2/fixtures.ts`](../../../lib/validation/v2/fixtures.ts). Results are recomputed with `runSemanticAuditV2(DeveloperContractV2, EvidenceBundleV2)`; no stored v1 `auditResult` is used as an input to the v2 Core.

## Baseline

| Item | Value |
|---|---|
| Frozen v1 Core manifest | `1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82` |
| Developer Contract v1 | `c576f4515d680128ef7db83f8096225671e9d4e7d1258c83aeb52c8fab576cfa` |
| Production Validation Matrix | `8771f751f28885893fc1898d91618b6b138165a760117507886850578762146b` |
| v2 evidence modes | live execution and captured validation fixture, explicitly labeled |

The existing v1 records and Production Validation Matrix are not overwritten.

## Recomputed corpus results

| Case | Evidence | Intent | Parity | Agency | Technical | Semantic | Derived observation |
|---|---|---:|---:|---:|---:|---:|---|
| Subly BROKEN | LIVE EXECUTION / complete | FAIL | FAIL | WARN | PASS | FAIL | Forbidden effects occurred; missing boundary and overloading are derived from the contract. |
| Subly FIXED | LIVE EXECUTION / complete | PASS | PASS | WARN | PASS | WARN | `recommend_plan` is read-only; purchase/cancel remain exposed mutation capabilities. |
| Flight Search | CAPTURED VALIDATION FIXTURE / complete | PASS | PASS | PASS | PASS | PASS | Read-heavy, human-approved baseline remains clean. |
| Order Tracking | CAPTURED VALIDATION FIXTURE / complete | PASS | PASS | PASS | PASS | PASS | Approved `display_return_result` interpretation is preserved; refund mutation is not invented. |
| Kurio | LIVE EXECUTION / complete | PASS | WARN | WARN | PASS | WARN | Checkout is exposed but uninvoked; boundary result is `CONTRACT-LEVEL FINDING / CLIENT-RUNTIME UNRESOLVED`. |
| Mabel’s Table | CAPTURED VALIDATION FIXTURE / partial | PASS | WARN | WARN | PASS | WARN | Temporary hold, terminal confirmation, and client approval remain separate; app boundary is not asserted. |
| Tagboard accepted | LIVE EXECUTION / complete | PASS | PASS | PASS | PASS | PASS | `add_note` → `ALLOW` → `note_stored OCCURRED`. |
| Tagboard rejected | LIVE EXECUTION / complete | PASS | PASS | PASS | PASS | PASS | `add_note` → `REJECT` → `note_stored PREVENTED`; no technical failure or retry is manufactured. |
| The Archive | LIVE EXECUTION / complete | PASS | PASS | PASS | PASS | PASS | Explicit `COMPLEMENTARY` relation and workflow-terminal role avoid a surface-inequality false finding. |

The Tagboard accepted and rejected cases intentionally have the same top-level result under the approved contract because `note_stored` is not declared as a required effect. Their typed policy and effect outcomes remain observably different.

## Subly BROKEN → FIXED semantic diff

The v2 CLI diff resolves these findings:

```text
forbidden-effect
missing-confirmation-boundary
semantic-overloading
```

The remaining finding is:

```text
excess-agency [exposed]
```

The observed path changes from:

```text
inspect_plan → compare_plans → recommended_upgrade
```

to:

```text
inspect_plan → compare_plans → recommend_plan
```

Removed observed effects are preserved with provenance:

```text
recommended_upgrade → change_subscription [runtime-instrumentation]
recommended_upgrade → charge_payment [runtime-instrumentation]
```

Technical status remains `PASS`; semantic status changes from `FAIL` to `WARN` because the fixed surface still exposes unnecessary mutation capabilities.

## Freeze decision for this gate

The additive v2 Core, contract/evidence validation, v1 normalizer, mandatory corpus adapters, unit tests, and v2 CLI check/diff are implemented locally. Production integration, WebMCP runtime changes, X-Ray wiring, deployment, Production Matrix updates, README positioning, and further external validation remain outside this gate.
