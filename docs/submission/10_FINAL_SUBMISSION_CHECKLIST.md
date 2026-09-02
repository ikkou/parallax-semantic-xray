# PARALLAX Final Submission Checklist

Status: execute at the final submission gate
Current package state: prepared, not submitted

## Freeze invariants

- [ ] Production URL is https://parallax-semantic-xray.heavenchan.chatgpt.site/
- [ ] Sites version is 7.
- [ ] Reviewed SHA is 188b0962a3f88200046ada924e790859ee1438ac.
- [ ] Frozen v1 Core hash is unchanged.
- [ ] Developer Contract v1 hash is unchanged.
- [ ] Production Validation Matrix hash is unchanged.
- [ ] v2 semantic model and five meta-tool names are unchanged.
- [ ] No product code changed after the FREEZE record.
- [ ] No deployment, visibility change, force-push, rebase, squash, or unrelated branch push occurred.
- [x] Repository publication is explicitly authorized by the current gate; the public repository target is verified.

## Product proof

- [ ] BROKEN uses the exact approved goal.
- [ ] BROKEN shows Technical PASS / HTTP 200.
- [ ] BROKEN shows Semantic FAIL / Intent violated.
- [ ] BROKEN preserves forbidden subscription/payment effects.
- [ ] FIXED uses the same exact goal.
- [ ] FIXED shows recommendation/no mutation.
- [ ] FIXED shows Intent PASS and Parity PASS.
- [ ] FIXED Agency WARN remains visible and explained.
- [ ] Technical success is not presented as semantic success.
- [ ] Subly is labelled as a controlled simulated playground.

## WebMCP proof

- [ ] Chrome 151 native environment is documented.
- [ ] Native API availability is captured.
- [ ] Five PARALLAX meta-tools are discoverable.
- [ ] run_parity_audit is invoked through native WebMCP.
- [ ] Structured v2 return is captured.
- [ ] Visible Agent Execution Log update is captured.
- [ ] trace_goal, list_gaps, and explain_gap remain available.
- [ ] Blank/whitespace goal rejection remains documented.
- [ ] Unknown gap_id returns structured NOT_FOUND.
- [ ] Reset/re-run remains usable.
- [ ] No reproducible PARALLAX-owned runtime exception is present.
- [ ] Fresh Work limitation is stated without claiming Luna-wide incompatibility.

## External evidence

- [ ] Tagboard REJECT/PREVENTED is described as a policy/effect observation, not technical failure.
- [ ] The Archive COMPLEMENTARY relation is described as intentional surface asymmetry.
- [ ] External evidence mode and authority labels are preserved.
- [ ] No external application is called vulnerable, insecure, or broken without stronger evidence.
- [ ] Captured validation is never presented as live execution.

## Video

- [ ] Duration is 2:20–2:45 and below 3:00.
- [ ] English narration is clear.
- [ ] English captions are present.
- [ ] At least two complete takes were recorded.
- [ ] No private UI or unrelated extension content appears.
- [ ] Native invocation is represented accurately.
- [ ] Overlays do not obscure the X-Ray.
- [ ] Video metadata contains no invented repository, video, or Devpost URL.

## Screenshots

- [ ] BROKEN X-Ray capture is from production v2.
- [ ] FIXED X-Ray capture is from production v2.
- [ ] Tagboard rejected capture shows POLICY REJECT / EFFECT PREVENTED.
- [ ] The Archive capture shows COMPLEMENTARY.
- [ ] Native invocation capture shows structured result and visible log.
- [ ] Each capture records version, URL, timestamp, state, and live/captured mode.
- [ ] No private UI or token is visible.

## Documentation

- [ ] Devpost copy is judge-readable and contains no giant validation table.
- [ ] README claims match the claim ledger.
- [ ] README includes the exact testing goal and limitations.
- [ ] README links only to verified pages or explicit placeholders.
- [ ] Competitor descriptions are not copied from unverified feasibility material.
- [ ] Deep validation records remain unchanged.
- [ ] Root README changes, if any, occur only in the authorized submission-package gate.

## Repository publication

- [ ] Final secret scan completed.
- [ ] Absolute local path scan completed.
- [ ] Unnecessary generated files reviewed.
- [ ] LICENSE is present.
- [ ] Build and tests pass on the exact candidate.
- [x] Publication visibility change is separately authorized.
- [x] Public repository URL is verified after publication.
- [ ] Production URL is rechecked after publication.
- [ ] No public link is invented before it exists.

## Stop conditions

Stop and return to review if:

- production version or SHA differs;
- frozen hashes differ;
- a P0 requirement fails;
- the native result cannot be reproduced or accurately labelled;
- a document makes an unsupported claim;
- a screenshot shows private or unrelated content;
- a placeholder URL is replaced with an unverified URL.

Do not begin demo-video production, final Devpost submission, or repository publicization until the appropriate gate authorizes that action.
