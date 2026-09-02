# PARALLAX — Final Publication Record

Status: `BLOCKED` — video release and Challenge submission remain pending

Date: 2026-09-02 (JST)

This record captures the final publication-gate state. No production code, frozen v1 Core, Developer Contract v1, or v2 semantic model was changed during this gate.

## Verified production candidate

- Production URL: https://parallax-semantic-xray.heavenchan.chatgpt.site/
- Sites version: `7`
- Current production source SHA: `188b0962a3f88200046ada924e790859ee1438ac`
- Frozen v1 Core manifest SHA-256: `1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82`
- Frozen Developer Contract v1 SHA-256: `c576f4515d680128ef7db83f8096225671e9d4e7d1258c83aeb52c8fab576cfa`
- Frozen production validation matrix SHA-256: `8771f751f28885893fc1898d91618b6b138165a760117507886850578762146b`

The current live Sites version points to the reviewed v2 SHA. No redeployment was performed during this gate.

## Presentation review note

Two historical native WebMCP extension captures include browser chrome and unrelated tabs. Visual inspection found no visible token, credential, or personal email. They remain historical validation evidence and were not used as final Devpost media; they should be reviewed before public repository publication. No historical evidence was deleted or altered during this gate.

## Repository publication

- Intended public repository URL: https://github.com/ikkou/parallax-semantic-xray
- Initial public repository commit: `952f180f2a4781ea990115d2be67f53189291b62`
- Public repository visibility: `Public`
- Repository license: MIT

The repository was created as a separate public GitHub source repository. The private managed ChatGPT Sites source remote was not exposed.

## Final demo video

- Public video URL: https://youtu.be/YXIoZpCsYt0
- Video visibility: `PUBLIC RELEASE SCHEDULED`; current public accessibility remains unverified
- Frozen source artifact: `PARALLAX_demo_v2_FINAL_v2.mp4`
- Source SHA-256: `28965d14821efb7e087694664858526cc555dea403f64e24891e5a94bdf0c74f`
- Duration: `161.466016` seconds (`2:41.466`)
- Verified streams: H.264 1920x1080 at 30 fps, AAC 44.1 kHz mono, mov_text subtitles

The exact frozen video is uploaded to the verified YouTube video URL above. YouTube Studio currently reports `公開予約`; no alternate or unrelated video was substituted.

## Devpost

- Existing draft: https://devpost.com/software/a-f80hps
- State: `PROJECT PUBLISHED`; Challenge submission `NOT SUBMITTED`
- Final Submit action: not performed
- Repository, production, and video fields: populated in the project record

The project page is published with the verified repository, production, and video URLs. The video is still scheduled for release, so public playback must be rechecked after the scheduled time. The final Challenge Submit action remains a human-controlled step.

## Local verification

The current local candidate passed:

- `npm run test:core` — 8 passed
- `npm run test:contracts` — 5 passed
- `npm run test:cli` — 9 passed
- `npm run test:v2` — 15 passed
- `npm run test:cli:v2` — 9 passed
- `npm run test:integration` — 3 passed
- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm run build` — passed
- `git diff --check` — passed
- source, history, credential-pattern, absolute-path, and tracked-junk scans — no finding requiring publication stop

The previous native Chrome 151 validation remains the evidence for native WebMCP discovery, structured invocation, visible audit updates, reset/re-run, BROKEN/FIXED behavior, the five PARALLAX meta tools, Tagboard policy/effect states, The Archive complementary relation, and v1 fallback. The current Sites version was separately confirmed to point to the same reviewed SHA.

## Remaining publication blockers

1. Verify public video accessibility after the scheduled release.
2. Visually review the published Devpost project after the video URL is accessible. The final Challenge Submit action remains human-controlled.

Until those destinations are identified, the correct gate decision is:

**BLOCKED**

Repository publication completed at the initial commit above. No video upload, Sites redeploy, or Devpost submission was performed.
