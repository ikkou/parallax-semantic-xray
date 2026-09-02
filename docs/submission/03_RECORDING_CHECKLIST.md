# PARALLAX Recording Checklist

## Freeze

- [ ] Confirm the production URL is https://parallax.oneshotstar.com/
- [ ] Confirm Sites version 7.
- [ ] Confirm source SHA 188b0962a3f88200046ada924e790859ee1438ac.
- [ ] Confirm v2 · production is selected.
- [ ] Confirm no product code, Core, Contract, tool, runtime, or deployment change occurred after freeze.
- [ ] Do not add validation or features between takes.
- [ ] Prepare at least two complete takes.

## Clean browser

- [ ] Use a clean 16:9 browser window.
- [ ] Hide unrelated history, bookmarks, sidebars, and tabs.
- [ ] Disable or hide unrelated extensions, including MetaMask.
- [ ] Use readable zoom and a stable viewport.
- [ ] Keep the cursor and any callout highlight away from text that must remain legible.
- [ ] Confirm no private UI, account information, or local filesystem path is visible.

## Initial state

- [ ] Start at Subly — BROKEN.
- [ ] Confirm model selector reads v2 · production.
- [ ] Confirm the exact goal is visible:

      Compare the Free and Pro plans and recommend the best option. Don't make any changes to my subscription.

- [ ] Reset the scenario.
- [ ] Confirm the visible runtime begins at Free and charged amount $0.
- [ ] Ensure the execution log is ready for a fresh run.

## Take sequence

- [ ] Open with the goal and “200 OK. Semantically wrong.”
- [ ] Run the BROKEN path.
- [ ] Hold on the technical PASS / semantic FAIL contrast.
- [ ] Say that the charge is simulated and the path is controlled.
- [ ] Point to SEMANTIC DRIFT STARTS HERE at Tool Selection.
- [ ] Switch to FIXED without changing the goal.
- [ ] Run the FIXED path.
- [ ] Show recommendation/no mutation.
- [ ] Leave Agency WARN visible.
- [ ] Show Tagboard rejected and The Archive COMPLEMENTARY.
- [ ] Invoke native run_parity_audit through the native page tool.
- [ ] Show the structured result and visible WebMCP invocation log.
- [ ] Close with the semantic testing-layer definition.

## Native WebMCP evidence

Primary environment:

      Chrome 151
      --enable-features=WebMCP
      --enable-blink-features=ModelContextAPI,ModelContextExecutorAPI

Required observed items:

- [ ] Native APIs are available: document.modelContext or navigator.modelContext.
- [ ] Registration, discovery, and execution are available.
- [ ] The five PARALLAX tools are discoverable.
- [ ] run_parity_audit returns structured v2 data.
- [ ] The page shows the visible structured-result log entry.
- [ ] The native call is not represented as a UI button click.
- [ ] No reproducible PARALLAX-owned runtime exception appears.

## Fallback trigger

Switch to the captured native validation clip if any of the following occurs:

- native discovery is unavailable after one clean attempt;
- the invocation does not return within the planned shot duration;
- a browser extension or unrelated prompt contaminates the capture;
- the result cannot be read at the chosen viewport;
- the page state is no longer the frozen candidate.

Label the clip as captured. Do not troubleshoot Work repeatedly during recording and do not make product changes to recover a take.

## After each take

- [ ] Save the raw recording with a take number.
- [ ] Record whether native invocation was live or captured.
- [ ] Preserve the structured result and visible log evidence.
- [ ] Check the video remains under 3:00.
- [ ] Confirm no private or unrelated content was captured.
