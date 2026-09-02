# PARALLAX Repository Publication Handoff

Status: repository publication completed; video and Devpost remain pending
Current action: none

This document records the publication handoff and its guardrails. The repository publication step has completed; the video upload and Devpost submission remain separate, pending steps.

## Required starting state

- Candidate: 188b0962a3f88200046ada924e790859ee1438ac.
- Production Sites version: 7.
- Production URL: https://parallax-semantic-xray.heavenchan.chatgpt.site/
- Working tree reviewed and free of unintended changes.
- Frozen v1 Core and Contract v1 hashes match their recorded baselines.
- README final draft has been reviewed against the claim and limitation ledger.
- Final video and screenshots have verified provenance.

## Publication sequence

These steps were performed after explicit publication authorization:

1. Run a final secret and credential scan over tracked source and documentation.
2. Scan for absolute local filesystem paths and remove any unintended private paths.
3. Review generated files, screenshots, archives, logs, and temporary artifacts for unnecessary content.
4. Apply only the approved sections from 06_README_FINAL.md to the root README.
5. Confirm LICENSE remains present and correct.
6. Run the build, typecheck, lint, unit tests, integration tests, and git diff check.
7. Review the exact commit or commits to be published.
8. Confirm the source branch and remote have not diverged unexpectedly.
9. Change repository visibility only if the publication gate explicitly authorizes it.
10. If visibility is changed, verify the repository’s public URL manually.
11. Set the repository description to a verified, bounded product description.
12. Add only factual topics relevant to WebMCP, semantic testing, and developer tooling.
13. Do not add competitor claims, security claims, or industry-adoption claims.
14. Recheck the production URL and the Sites version after publication.
15. Replace repository/video/Devpost placeholders only with URLs that have been independently verified.
16. Record the publication result and final URLs in a new handoff record.

## Safe repository description

> PARALLAX — a semantic testing layer for WebMCP applications that compares declared human intent, Agent Surface capabilities, boundaries, and observed effects.

Do not describe PARALLAX as a security scanner, runtime enforcement gateway, universal WebMCP evaluator, or automatic intent-inference system.

## History and visibility guardrails

- Do not force-push.
- Do not rebase or rewrite history.
- Do not squash without an explicit repository policy decision.
- Do not publish unrelated branches.
- Do not expose credentials, tokens, private URLs, or local paths.
- Do not change production access as part of repository publication.
- Keep the Sites source branch and deployment candidate aligned.

## Handoff evidence

The later publication gate should record:

- exact published SHA;
- repository visibility before and after;
- verified public repository URL;
- production URL and Sites version;
- build/test result;
- secret/path scan result;
- README and LICENSE result;
- any files intentionally excluded;
- final video and Devpost URLs, only if they exist;
- remaining limitations.

If any result is ambiguous, stop and return to human review.
