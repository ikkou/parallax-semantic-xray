# PARALLAX Narration Script

Target length: approximately 330 words
Language: English
Captions: required
Voice: clear human English when practical; otherwise a clean, restrained synthetic voice

## Script

Most WebMCP demos ask what an agent can do on a website. PARALLAX asks whether the website meant the same thing to the human and the agent.

Here is the user’s goal: compare the Free and Pro plans and recommend the best option. Do not make any changes to the subscription.

This is the PARALLAX Playground, a controlled simulated regression fixture. In the BROKEN state, the agent inspects the plan, compares the plans, and selects a combined recommendation-and-upgrade action. The tool returns HTTP 200. Pro is activated, and twenty dollars is charged in the simulation.

Nothing crashed. The technical result is a PASS. The semantic result is a FAIL, because the user explicitly prohibited a subscription change. The Semantic X-Ray shows where the drift starts: at tool selection, when a recommendation is connected to a state-changing operation.

Now the same exact goal runs through the FIXED surface. The agent inspects and compares the plans, then calls recommend_plan. A recommendation is returned and no subscription mutation occurs. Intent and parity pass. Agency remains WARN because purchase and cancellation capabilities are still exposed even though this goal only asks for reading and recommending. That warning is a useful exposure observation, not evidence that those tools were executed.

The same semantic model was tested beyond Subly. Blind validation against unmodified WebMCP demos exposed two important cases. In Tagboard, a tool can execute successfully while application policy rejects the requested write. That is POLICY REJECT and EFFECT PREVENTED, not technical failure. In The Archive, the Human Surface contributes physical clues while the Agent Surface contributes archive records. The declared relationship is COMPLEMENTARY, so semantic parity does not require identical surfaces.

Finally, PARALLAX exposes its own page-defined WebMCP meta-tools. In a native WebMCP-enabled Chrome environment, run_parity_audit returns structured audit data and the visible execution log records the invocation.

PARALLAX is not a security scanner or universal intent inference engine. It is a semantic testing layer: developers declare intent, effects, capabilities, and boundaries; execution evidence records what happened; the Core derives an explainable result.

200 OK can still be semantically wrong. PARALLAX makes that divergence visible before it ships.
