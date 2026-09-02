# PARALLAX Video Metadata

## Title

PARALLAX — 200 OK. Semantically wrong.

## Short description

PARALLAX is a semantic testing layer for WebMCP applications. It compares declared human intent, Agent Surface capabilities, safety boundaries, and observed effects so a technically successful workflow can still be checked for semantic correctness.

## Full description

Most WebMCP demos show what an agent can do on a website. PARALLAX shows what happens when the agent succeeds technically but diverges from what the human meant.

The video opens with the exact user goal:

    Compare the Free and Pro plans and recommend the best option. Don't make any changes to my subscription.

In the controlled Subly Playground, the BROKEN path selects a combined recommendation-and-upgrade tool. It returns HTTP 200, activates Pro, and charges $20 in the simulation. PARALLAX reports Technical PASS beside Semantic FAIL and marks the point where semantic drift begins.

The FIXED path uses the same goal and a read-only recommendation action. The recommendation is returned with no subscription mutation. Intent and parity pass; the honest Agency WARN remains because additional mutation capabilities are still exposed.

The video then shows two external validation observations. Tagboard separates a successful tool invocation from an application POLICY REJECT and EFFECT PREVENTED outcome. The Archive declares Human and Agent surfaces COMPLEMENTARY, demonstrating that semantic parity does not require identical surfaces.

Finally, a native WebMCP run_parity_audit invocation returns structured v2 audit data and updates the visible execution log.

Production: https://parallax.oneshotstar.com/

Repository: https://github.com/ikkou/parallax-semantic-xray
Video: https://youtu.be/YXIoZpCsYt0 (public release scheduled)

Demo video: this video

Devpost: https://devpost.com/software/a-f80hps (project published; Challenge submission not submitted)

PARALLAX is an evidence-based semantic audit layer. It requires developer-supplied contract and execution evidence. It is not a security scanner, runtime enforcement gateway, arbitrary URL crawler, CI integration, or universal intent-inference system.

## Challenge context

Built as a WebMCP Challenge project and validated against a controlled reference implementation plus separately labelled external WebMCP evidence.
