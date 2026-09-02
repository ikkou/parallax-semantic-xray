# PARALLAX Submission Package

Status: repository and Devpost project published; video release pending; Challenge submission not submitted
Product state: frozen v2
Production: Sites version 7
Reviewed source: 188b0962a3f88200046ada924e790859ee1438ac

This directory contains the judge-facing submission package for PARALLAX. It packages the frozen product story, demo plan, narration, testing instructions, README draft, screenshot plan, video metadata, claims ledger, final checklist, repository-publication handoff, and final publication record.

The package does not change PARALLAX behavior. Its current publication state and remaining submission blockers are recorded in [12_FINAL_PUBLICATION_RECORD.md](12_FINAL_PUBLICATION_RECORD.md). It does not add validation or submit to Devpost.

## Start here

1. Read [01_DEMO_VIDEO_PLAN.md](01_DEMO_VIDEO_PLAN.md) for the two-minute-forty-second demo structure.
2. Read [02_NARRATION_SCRIPT.md](02_NARRATION_SCRIPT.md) for the spoken English script.
3. Use [03_RECORDING_CHECKLIST.md](03_RECORDING_CHECKLIST.md) to prepare a clean production recording.
4. Use [04_DEVPOST_SUBMISSION.md](04_DEVPOST_SUBMISSION.md) for the final judge-facing copy draft.
5. Give judges [05_TESTING_INSTRUCTIONS.md](05_TESTING_INSTRUCTIONS.md).
6. Review [06_README_FINAL.md](06_README_FINAL.md) before applying any README changes in a later authorized gate.
7. Capture the five evidence views in [07_SCREENSHOT_PLAN.md](07_SCREENSHOT_PLAN.md).
8. Use [08_VIDEO_METADATA.md](08_VIDEO_METADATA.md) when uploading the finished video.
9. Review [09_CLAIMS_AND_LIMITATIONS.md](09_CLAIMS_AND_LIMITATIONS.md) before publishing any claim.
10. Run [10_FINAL_SUBMISSION_CHECKLIST.md](10_FINAL_SUBMISSION_CHECKLIST.md) before submission.
11. Follow [11_REPOSITORY_PUBLICATION_HANDOFF.md](11_REPOSITORY_PUBLICATION_HANDOFF.md) only after a separate publication authorization.
12. Read [12_FINAL_PUBLICATION_RECORD.md](12_FINAL_PUBLICATION_RECORD.md) for the current publication-gate decision and verified blockers.

## Frozen product thesis

> PARALLAX audits whether an agent-facing WebMCP workflow preserves user intent and declared application semantics — even when every technical call succeeds.

The central phrase is:

> 200 OK. Semantically wrong.

The controlled goal is:

> Compare the Free and Pro plans and recommend the best option. Don't make any changes to my subscription.

Subly is the controlled LIVE PLAYGROUND. External validation records are labelled according to their evidence authority and mode. A captured record is never presented as live execution.

## Production link

- Production: https://parallax-semantic-xray.heavenchan.chatgpt.site/
- Repository URL: https://github.com/ikkou/parallax-semantic-xray
- Video URL: https://youtu.be/YXIoZpCsYt0 (public release scheduled)
- Devpost URL: https://devpost.com/software/a-f80hps (project published; Challenge submission not submitted)

## Evidence boundary

PARALLAX keeps these layers separate:

- DECLARED: intent, guardrails, tool contracts, application boundaries, and explicit surface relations.
- OBSERVED: technical invocation, runtime effects, policy outcomes, state changes, and client-runtime events.
- DERIVED: Core statuses, findings, trace, recommendations, and semantic result.

The system is a developer-instrumented semantic testing layer. It is not an arbitrary URL crawler, security scanner, runtime enforcement gateway, universal intent-inference system, CI integration, or published npm package.

## Package map

| File | Purpose |
| --- | --- |
| 01_DEMO_VIDEO_PLAN.md | Exact video structure, timings, overlays, and shot direction |
| 02_NARRATION_SCRIPT.md | Final spoken-English script and pacing guidance |
| 03_RECORDING_CHECKLIST.md | Production environment, take, WebMCP, and evidence checklist |
| 04_DEVPOST_SUBMISSION.md | Judge-readable Devpost copy draft |
| 05_TESTING_INSTRUCTIONS.md | Short production and native WebMCP test instructions |
| 06_README_FINAL.md | Final root README draft, to be applied only in a later gate |
| 07_SCREENSHOT_PLAN.md | Five production v2 evidence captures |
| 08_VIDEO_METADATA.md | Final video title and description draft |
| 09_CLAIMS_AND_LIMITATIONS.md | Supported-claim and limitation ledger |
| 10_FINAL_SUBMISSION_CHECKLIST.md | Final package and freeze verification |
| 11_REPOSITORY_PUBLICATION_HANDOFF.md | Publication steps for a later authorized gate |
| 12_FINAL_PUBLICATION_RECORD.md | Current final publication-gate record and decision |

## Source records

The detailed evidence remains in the existing records:

- [Final judge audit and freeze](../2026-09-01-final-product-judge-audit-submission-freeze.md)
- [Cross-application semantic model review](../2026-08-31-cross-application-semantic-model-review.md)
- [v2 minimal implementation plan](../2026-08-31-v2-minimal-implementation-plan.md)
- [v2 corpus report](../validation/v2/2026-09-01-v2-corpus-report.md)
- [Tagboard Gate #3](../validation/2026-08-29-tagboard-blind-external-validation-gate3.md)
- [The Archive Gate #4](../validation/2026-08-31-the-archive-blind-external-validation-gate4.md)
- [Developer Contract v1](../DEVELOPER_CONTRACT_V1.md)
- [Developer Contract v2](../DEVELOPER_CONTRACT_V2.md)

These documents retain historical and unresolved evidence. This submission package summarizes only what is safe to say to a judge.
