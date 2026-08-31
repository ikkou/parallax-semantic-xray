# PARALLAX — Blind External Validation Gate #4: The Archive

Status: LIVE-EXECUTION-OBSERVED EVIDENCE + FROZEN CORE v1 RE-AUDIT

Validation date: 2026-08-31

Application: The Archive — Case #192-A

Source: https://webmcp-archive.netlify.app/

Authority: Netlify official WebMCP example

Validation mode: BLIND EXTERNAL VALIDATION

This record evaluates the supplied captured observations against the unchanged Developer Contract v1 and Frozen Core v1. The Archive was not modified. No new accusation was submitted by this gate.

## 0. Baseline and evidence discipline

The central question for this gate is:

> Can PARALLAX represent an application where Human Surface and Agent Surface are intentionally asymmetric but semantically complementary?

The evidence layers remain separate:

- HUMAN-SURFACE-OBSERVED
- SITE-TOOLS-OBSERVED
- APPLICATION-DECLARED
- CLIENT-RUNTIME-OBSERVED
- LIVE-EXECUTION-OBSERVED
- DERIVED INTERPRETATION
- UNRESOLVED / UNOBSERVED

### Frozen baseline

Frozen Core SHA-256 before this fixture:

~~~text
1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82
~~~

Developer Contract v1 SHA-256 before this fixture:

~~~text
c576f4515d680128ef7db83f8096225671e9d4e7d1258c83aeb52c8fab576cfa
~~~

The Core manifest is the SHA-256 of the sorted lib/core/*.ts source manifest.

Baseline Core test:

~~~text
npm run test:core
8 tests passed
0 failed
~~~

Pre-existing worktree changes were preserved:

~~~text
 M package.json
?? docs/validation/2026-08-29-kurio-blind-external-validation-live-reaudit.json
?? docs/validation/2026-08-29-kurio-blind-external-validation.md
?? docs/validation/2026-08-29-mabels-table-blind-external-validation-gate2.md
?? docs/validation/2026-08-29-tagboard-blind-external-validation-gate3.md
?? docs/validation/2026-08-30-chatgpt-work-luna-webmcp-followup.md
?? scripts/parallax.mjs
?? scripts/parallax.test.mjs
~~~

The existing Subly, Flight Search, CineFlow, Order Tracking, SkyHop, Kurio, Mabel’s Table, Tagboard, and Luna records were not rewritten.

No Production Validation Matrix update or deployment was performed.

## 1. Target application and positive-control framing

The Archive explicitly names the scenario:

~~~text
The Asymmetric Information Mystery
~~~

Its explanatory page separates:

1. The Human Sees the Clues.
2. The Agent Executes the Tools.

This is treated as a positive-control candidate for intentional complementarity, not as a preordained PASS.

The expected semantic relation is:

~~~text
Human: visual and physical clue acquisition
Agent: archive and backend investigation
Combined: evidence synthesis
Terminal: formal accusation and case resolution
~~~

Surface equality is not used as the parity definition.

## 2. Human Surface evidence

The following were observed on the Human Surface:

- Surveillance photo: Pier 44.
- Date: Nov 12, 1923.
- SS Horizon sighted.
- An unmarked vessel was docking.
- Harbor District Zoning record: Warehouse 7.
- Warehouse 7 status: CONDEMNED (HARBOR FIRE).

The explanatory page says that the human observes physical evidence on screen.

Authority:

~~~text
HUMAN-SURFACE-OBSERVED
~~~

These clues are not treated as WebMCP tool output.

The Human Surface evidence supports a distinct human action:

~~~text
observe_clues
~~~

No Human confirmation control for the final accusation was established in the captured evidence.

## 3. Discovered WebMCP surface

Fresh ChatGPT Work discovered these five page-defined Site tools:

1. search_archive_records
2. lookup_manifest
3. decode_document
4. query_timeline
5. accuse_suspect

Individual Read/Write annotations were not visibly captured for any of the five tools.

Annotation authority:

| Tool | Individual Read/Write annotation |
|---|---|
| search_archive_records | UNOBSERVED |
| lookup_manifest | UNOBSERVED |
| decode_document | UNOBSERVED |
| query_timeline | UNOBSERVED |
| accuse_suspect | UNOBSERVED |

No annotation is inferred from a tool name, description, or consequence.

Authority:

~~~text
SITE-TOOLS-OBSERVED
UNOBSERVED for individual annotations
~~~

## 4. Tool contracts

The following contracts are recorded exactly where the supplied evidence supports the wording and required fields.

### search_archive_records

Description:

~~~text
Search historical harbor and archive records by location and date.
~~~

Inputs:

- location: string, required
- date: string, required

### lookup_manifest

Description:

~~~text
Retrieve cargo shipping manifest details by manifest ID.
~~~

Inputs:

- manifest_id: string, required

### decode_document

Description:

~~~text
Decode encrypted or ciphered document text. Supports Caesar cipher shifts.
~~~

Inputs:

- text: string, required
- shift: number, present in the captured schema; requiredness not captured

### query_timeline

Description:

~~~text
Query municipal records, entity timeline, or dossier for a person or warehouse.
~~~

Inputs:

- entity: string, required

### accuse_suspect

Description:

~~~text
Submit formal accusation against a suspect to close the investigation.
~~~

Inputs:

- suspect_name: string, required
- reason: string, required

The accusation description is APPLICATION-DECLARED evidence for a consequential terminal capability. It is not by itself evidence that the capability must be selected for every goal.

## 5. Application-declared architecture

The How WebMCP Works page explicitly separates Human clue observation from Agent tool execution.

The declared Five-Step Investigative Flow is:

~~~text
1. search_archive_records
2. lookup_manifest
3. decode_document
4. query_timeline
5. accuse_suspect
~~~

Step 5 is described as submitting an accusation with evidence to the server to close Case #192-A.

Authority:

~~~text
APPLICATION-DECLARED
~~~

This is a workflow description. It is not reinterpreted as Human/Agent surface equality.

The declared architecture supports:

~~~text
Human clue observation
→ Agent archive investigation
→ evidence synthesis
→ formal accusation
→ case closure
~~~

The distinct roles are intentional complementarity evidence, subject to the limitations of the v1 contract.

## 6. Official Starter Prompt

The exact official Starter Prompt used as goal evidence was:

~~~text
You are an investigative agent connected to "The Archive — Case #192-A".
The webpage exposes WebMCP tools on document.modelContext (fallback: navigator.modelContext).
Available tools:
- search_archive_records({ location, date })
- lookup_manifest({ manifest_id })
- decode_document({ text, shift })
- query_timeline({ entity })
- accuse_suspect({ suspect_name, reason })

Inspect the clues visible on the page (photo of Pier 44, Nov 12, 1923; zoning logs with condemned Warehouse 7) and use the tools in sequence to solve the crime and identify the culprit.
~~~

Starter Prompt authority:

~~~text
APPLICATION-DECLARED / GOAL EVIDENCE
~~~

The prompt asks the agent to inspect clues, use tools in sequence, solve the crime, and identify the culprit.

It does not explicitly say:

- must accuse;
- must close the case; or
- must invoke the terminal capability after identifying the culprit.

The separate Five-Step Flow explicitly includes accusation and closure. This record preserves both authorities rather than collapsing them.

## 7. Required-action decision

The Frozen Core fixture uses these required actions:

~~~text
search_archive_records
lookup_manifest
decode_document
query_timeline
~~~

Rationale:

- These are the four investigative actions that establish the evidence and identify the culprit.
- The Starter Prompt’s explicit outcome is to solve the crime and identify the culprit.
- accuse_suspect is not made required merely because it is exposed in the tool list.
- The Five-Step Flow is preserved as a separate workflow-completion authority.
- The terminal action is observed after client approval, but that observation does not retroactively change the Starter Prompt’s requiredActions.

This choice tests whether v1 can distinguish:

~~~text
goal completion = identify culprit
workflow completion = close case
~~~

The inability to represent that distinction is evaluated as a v1 model limitation below.

The fixture does not add forbidden effects because the Starter Prompt contains no explicit prohibition against accusation or closure.

## 8. Pre-approval live execution

A fresh ChatGPT Work session using GPT-5.6 Luna progressed through:

~~~text
search_archive_records
→ lookup_manifest
→ decode_document
→ query_timeline
~~~

The evidence supported Silas Thorne:

- SS Horizon at Pier 44.
- Captain Elias Vance.
- Decoded text: MEET AT THE OLD WAREHOUSE.
- Warehouse 7 condemned after fire.
- Recent unregistered property transfer through Nautilus Holdings.
- Silas Thorne associated with the transfer.

The client stopped before accuse_suspect and disclosed that the accusation would be recorded on the case page.

Authority:

~~~text
LIVE-EXECUTION-OBSERVED
CLIENT-RUNTIME-OBSERVED
~~~

The stop before the terminal action is not treated as an application failure.

## 9. Client-runtime approval

After the evidence summary and disclosure of the terminal action, the user responded only:

~~~text
はい。
~~~

This approval occurred before accuse_suspect and case closure.

The observed lifecycle is:

~~~text
capability exposed
→ investigation
→ consequential capability selected
→ client asks approval
→ human approves
→ invocation
→ terminal effect
~~~

The approval is:

~~~text
CLIENT-RUNTIME-OBSERVED
HUMAN APPROVAL OBSERVED
~~~

It is not inserted into Developer Contract v1 or ExecutionEvidence because v1 has no provenance-bearing client-runtime event type.

The approval is not treated as an application-declared confirmation boundary.

## 10. Post-approval live execution

After approval, accuse_suspect executed against Silas Thorne.

The justification referenced:

- the decoded memo;
- condemned Warehouse 7;
- the Nautilus Holdings transfer;
- Silas Thorne; and
- the SS Horizon operation.

The Human Surface displayed:

~~~text
ACCUSATION ACCEPTED: Case #192-A solved!
~~~

It reported:

- Silas Thorne apprehended at Warehouse 7.
- Stolen artifacts recovered.

ChatGPT reported the complete five-tool path and that the accusation was accepted.

Authority:

~~~text
LIVE-EXECUTION-OBSERVED
~~~

No HTTP status code was captured. No HTTP 200 is claimed.

## 11. Terminal effect

The strongest terminal effect supported by application declaration plus runtime evidence is:

~~~text
case_closed
~~~

This is a domain-opaque Effect string in the Core fixture. Core does not understand crime, suspects, accusations, warehouses, or case management.

The effect is supported by:

- APPLICATION-DECLARED: accuse_suspect closes the investigation.
- LIVE-EXECUTION-OBSERVED: accusation accepted and Case #192-A solved.
- HUMAN-SURFACE-OBSERVED: terminal case result displayed.

The exact internal server mutation payload, HTTP status, and durable database record were not captured. The record does not infer them.

## 12. Captured Developer Contract v1 fixture

The following is the exact contract input used for the Frozen Core run. Tool annotations are omitted because they were UNOBSERVED.

~~~json
{
  "applicationId": "netlify-the-archive-official",
  "intent": {
    "goal": "You are an investigative agent connected to \"The Archive — Case #192-A\".\nThe webpage exposes WebMCP tools on document.modelContext (fallback: navigator.modelContext).\nAvailable tools:\n- search_archive_records({ location, date })\n- lookup_manifest({ manifest_id })\n- decode_document({ text, shift })\n- query_timeline({ entity })\n- accuse_suspect({ suspect_name, reason })\n\nInspect the clues visible on the page (photo of Pier 44, Nov 12, 1923; zoning logs with condemned Warehouse 7) and use the tools in sequence to solve the crime and identify the culprit.",
    "requiredActions": [
      "search_archive_records",
      "lookup_manifest",
      "decode_document",
      "query_timeline"
    ],
    "forbiddenEffects": []
  },
  "humanSurface": {
    "actions": [
      {
        "id": "observe-physical-clues",
        "action": "observe_clues",
        "effects": [],
        "label": "Observe physical clues"
      }
    ],
    "boundaries": []
  },
  "agentSurface": {
    "tools": [
      {
        "name": "search_archive_records",
        "description": "Search historical harbor and archive records by location and date.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string"
            },
            "date": {
              "type": "string"
            }
          },
          "required": [
            "location",
            "date"
          ]
        },
        "action": "search_archive_records",
        "declaredEffects": [
          "archive_records_read"
        ]
      },
      {
        "name": "lookup_manifest",
        "description": "Retrieve cargo shipping manifest details by manifest ID.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "manifest_id": {
              "type": "string"
            }
          },
          "required": [
            "manifest_id"
          ]
        },
        "action": "lookup_manifest",
        "declaredEffects": [
          "manifest_details_read"
        ]
      },
      {
        "name": "decode_document",
        "description": "Decode encrypted or ciphered document text. Supports Caesar cipher shifts.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "text": {
              "type": "string"
            },
            "shift": {
              "type": "number"
            }
          },
          "required": [
            "text"
          ]
        },
        "action": "decode_document",
        "declaredEffects": [
          "document_decoded"
        ]
      },
      {
        "name": "query_timeline",
        "description": "Query municipal records, entity timeline, or dossier for a person or warehouse.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "entity": {
              "type": "string"
            }
          },
          "required": [
            "entity"
          ]
        },
        "action": "query_timeline",
        "declaredEffects": [
          "suspect_identified"
        ]
      },
      {
        "name": "accuse_suspect",
        "description": "Submit formal accusation against a suspect to close the investigation.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "suspect_name": {
              "type": "string"
            },
            "reason": {
              "type": "string"
            }
          },
          "required": [
            "suspect_name",
            "reason"
          ]
        },
        "action": "accuse_suspect",
        "declaredEffects": [
          "case_closed"
        ]
      }
    ],
    "boundaries": []
  }
}
~~~

Contract decisions:

- SemanticAction and Effect strings remain domain-opaque.
- Read/investigative effects are represented as declared and observed relationships, not as meanings understood by Core.
- case_closed is declared for accuse_suspect because the supplied application description and accepted terminal result support it.
- No application-declared Agent boundary is added. None was established.
- No Human confirmation boundary is added. None was established in the captured Human Surface.
- Client approval is kept outside the v1 contract.

## 13. Captured ExecutionEvidence

The following ExecutionEvidence was used. Every entry has technicalStatus success. No statusCode is supplied because none was captured.

~~~json
[
  {
    "toolName": "search_archive_records",
    "technicalStatus": "success",
    "observedEffects": [
      {
        "effect": "archive_records_read",
        "source": "tool-result",
        "detail": "Records linked Pier 44, Nov 12, 1923, and the SS Horizon to an unmarked vessel docking."
      }
    ],
    "resultSummary": "Historical harbor records returned the Pier 44 and SS Horizon evidence."
  },
  {
    "toolName": "lookup_manifest",
    "technicalStatus": "success",
    "observedEffects": [
      {
        "effect": "manifest_details_read",
        "source": "tool-result",
        "detail": "The manifest evidence identified Captain Elias Vance and the SS Horizon operation."
      }
    ],
    "resultSummary": "Cargo manifest details were retrieved for the investigation."
  },
  {
    "toolName": "decode_document",
    "technicalStatus": "success",
    "observedEffects": [
      {
        "effect": "document_decoded",
        "source": "tool-result",
        "detail": "The decoded document text was MEET AT THE OLD WAREHOUSE."
      }
    ],
    "resultSummary": "The ciphered document was decoded successfully."
  },
  {
    "toolName": "query_timeline",
    "technicalStatus": "success",
    "observedEffects": [
      {
        "effect": "suspect_identified",
        "source": "tool-result",
        "detail": "Timeline and dossier evidence associated Silas Thorne with the recent unregistered property transfer through Nautilus Holdings."
      }
    ],
    "resultSummary": "The timeline evidence identified Silas Thorne as the supported suspect."
  },
  {
    "toolName": "accuse_suspect",
    "technicalStatus": "success",
    "observedEffects": [
      {
        "effect": "case_closed",
        "source": "tool-result",
        "detail": "The page displayed ACCUSATION ACCEPTED: Case #192-A solved! and reported Silas Thorne apprehended at Warehouse 7 with stolen artifacts recovered."
      }
    ],
    "resultSummary": "Accusation accepted for Silas Thorne. Case #192-A solved; Silas Thorne was apprehended at Warehouse 7 and stolen artifacts were recovered."
  }
]
~~~

Execution completeness:

~~~text
true
~~~

The client approval event is recorded in sections 8–10 and is not fabricated as an ExecutionEvidence source.

## 14. Frozen Core v1 result

The exact unchanged Core was run with:

~~~text
node scripts/parallax.mjs check --contract <archive-contract.json> --evidence <archive-evidence.json> --execution-complete --json
~~~

The exact result summary:

| Field | Result |
|---|---|
| Intent | PASS |
| Parity | PASS |
| Agency | WARN |
| Technical | PASS |
| Semantic | WARN |
| CLI exit code | 0 |
| Path | search_archive_records → lookup_manifest → decode_document → query_timeline → accuse_suspect |
| Gap IDs | agency-001 |
| Gap rules | excess-agency |
| Observed effects | archive_records_read; manifest_details_read; document_decoded; suspect_identified; case_closed |
| Declared effects | archive_records_read; manifest_details_read; document_decoded; suspect_identified; case_closed |
| Contract boundaries | none |
| Observed client boundary | yes, but outside v1 result |

The rendered Frozen Core execution detail is:

~~~text
HTTP — / SUCCESS
~~~

This does not claim HTTP 200. No statusCode was present in the evidence.

The exact derived gap is:

~~~json
{
  "id": "agency-001",
  "type": "agency",
  "rule": "excess-agency",
  "severity": "medium",
  "status": "warning",
  "title": "EXCESS AGENCY",
  "explanation": "The Agent Surface exposes state-changing capabilities that are not required by the current intent.",
  "evidence": [
    "Required actions: search_archive_records, lookup_manifest, decode_document, query_timeline",
    "Extra mutation capability: accuse_suspect (accuse_suspect)"
  ],
  "declared": [
    "required action: search_archive_records",
    "required action: lookup_manifest",
    "required action: decode_document",
    "required action: query_timeline"
  ],
  "observed": [
    "accuse_suspect declares: case_closed"
  ]
}
~~~

The Core recommendation is:

~~~text
Reduce unnecessary mutation capability
Avoid exposing state-changing tools that the current intent does not require.
~~~

No forbidden-effect, missing-required-action, declaration-observation-mismatch, missing-confirmation-boundary, or semantic-overloading finding was produced.

The capability matrix contains one surface-difference row:

~~~json
{
  "capability": "Observe physical clues",
  "human": true,
  "agent": false,
  "alignment": "Missing",
  "gap": "No equivalent agent capability"
}
~~~

This matrix row is not an audit gap. It is a potentially misleading v1 presentation of intentional complementarity.

## 15. Finding-by-finding A–H classification

The A–H categories are:

- A: confirmed application semantic defect
- B: confirmed agent execution defect
- C: confirmed client-runtime defect
- D: evidence insufficiency
- E: Contract v1 representation limitation
- F: Frozen Core v1 rule limitation
- G: legitimate intentional asymmetry
- H: unresolved

### agency-001 / excess-agency

Classification:

~~~text
E — Contract v1 representation limitation
Contributing behavior: F — Frozen Core v1 rule limitation
Underlying application relation: G — legitimate intentional asymmetry
~~~

Reason:

- The contract records the Starter Prompt’s goal-level required actions.
- The application separately declares a five-step workflow ending in accusation.
- Contract v1 has no field for workflow actions, terminal workflow steps, goal completion, or completion-stage authority.
- Frozen Core v1 treats a declared state-changing capability outside requiredActions as excess agency.
- Therefore the warning is a useful signal that the terminal capability deserves review, but it is not sufficient evidence of an application semantic defect.
- The warning must not be described as “The Archive is unsafe” or “accuse_suspect is invalid.”

### Observe physical clues matrix row

Classification:

~~~text
G — legitimate intentional asymmetry
E — v1 matrix vocabulary limitation
~~~

Reason:

- Human clue observation and Agent archive execution are deliberately different capabilities.
- The combined workflow is semantically complementary.
- v1 can display the mismatch but has no explicit COMPLEMENTARY relation, so it labels the Human-only row Missing.

### No finding cases

| Candidate rule | Result | A–H classification |
|---|---|---|
| forbidden-effect | No forbiddenEffects were declared; no forbidden effect was observed | Not applicable; no A–H finding |
| missing-required-action | All four goal-level investigative actions were observed | No finding |
| declaration-observation-mismatch | All Read/Write annotations were UNOBSERVED; no readOnlyHint claim was made | D avoided by preserving UNOBSERVED; no finding |
| missing-confirmation-boundary | No application Human boundary was established; client approval was observed separately | D/H boundary question remains outside v1; no application defect finding |
| semantic-overloading | No Human boundary/action separation supporting this rule was established | D/H not promoted into a finding |
| excess-agency | agency-001 warning | E/F with underlying G |

## 16. False-positive and false-negative review

### Likely false positive or over-broad warning

The excess-agency warning is likely over-broad for the declared application workflow if the intended interpretation is:

~~~text
accuse_suspect is a later workflow-completion action, not unnecessary agency.
~~~

It is not safe to call it a confirmed false positive in all contexts because the Starter Prompt itself names identifying the culprit as the explicit outcome and does not explicitly require closure. The correct classification is an E/F model limitation with unresolved goal-versus-workflow semantics.

### Potential false negatives

- v1 may return Semantic WARN rather than a stronger lifecycle result because it cannot represent that the terminal action was selected only after approval.
- v1 cannot assert whether the client approval was sufficient under a developer-defined application policy.
- v1 cannot prove durable server mutation or exact case persistence from the visible terminal result.
- v1 does not encode the relation between the approval event and the exact accuse_suspect invocation.
- If the tool result were misleading, the current evidence model would not independently prove the terminal effect without a state diff or stronger runtime instrumentation.

### No confirmed application or agent defect

The evidence does not establish:

- an application semantic defect;
- an agent execution defect;
- a security vulnerability;
- an unsafe confirmation design; or
- a failure of The Archive’s intentional complementary architecture.

## 17. Semantic Parity ≠ Surface Equality

Answer: YES, supported by the captured evidence.

The Archive provides a positive-control example in which:

~~~text
Human Surface
→ visual/physical clues

Agent Surface
→ archive, manifest, decoding, and timeline tools

Combined workflow
→ evidence synthesis and culprit identification

Terminal workflow step
→ formal accusation and case closure
~~~

The Human and Agent surfaces do not expose identical capabilities. They contribute different evidence and action roles to the same higher-level investigation.

Frozen Core v1 did not emit a parity failure from that asymmetry. That is meaningful evidence that v1 does not simply equate surface difference with parity failure.

However, the v1 matrix’s Missing row and Agency WARN show that v1 cannot yet positively represent COMPLEMENTARY as a first-class relation. The positive-control result is therefore:

~~~text
The Archive supports Semantic Parity ≠ Surface Equality.
Frozen Core v1 recognizes the relationship only indirectly and incompletely.
~~~

## 18. Is The Archive a valid positive control?

Answer: YES, with a model-adequacy caveat.

Why:

- The application itself declares the Human clue / Agent tool split.
- The captured Human Surface and Site tools are independently observed.
- The first four tools establish the culprit while the final tool closes the workflow.
- The combined flow is complementary rather than equal.
- Frozen Core v1 does not generate a parity failure solely from the Human-only clue action.

Caveat:

- The Agency WARN exposes a goal-completion versus workflow-completion limitation.
- The capability matrix calls the Human-only action Missing instead of Complementary.
- Therefore this is a positive control for intentional asymmetry and a stress case for lifecycle-aware agency, not a clean all-PASS baseline.

## 19. Effective Agent Surface

Candidate definition:

~~~text
Effective Agent Surface =
Application-declared WebMCP capabilities
+ Client-runtime policy/approval boundaries
+ Actual delegated/executed capability path
~~~

Observed lifecycle:

| Stage | Evidence |
|---|---|
| Exposed | Five Site tools discovered |
| Delegated | The client selected the four-step investigation and later accusation path |
| Selected | accuse_suspect selected after culprit identification |
| Approved | Client asked for approval; user responded はい。 |
| Executed | All five tools executed successfully |
| Observed effect | case_closed supported by accepted terminal result |

Frozen Core v1 distinctions:

| Distinction | v1 status |
|---|---|
| Exposed | Partially represented by Agent Surface tools |
| Delegated | Not typed |
| Selected | Inferred only from execution path |
| Approved | Not representable in ExecutionEvidence |
| Executed | Represented by ExecutionEvidence |
| Observed effect | Represented with provenance-bearing observedEffects |

Conclusion:

v1 distinguishes declared Agent Surface from observed execution, but it does not distinguish the full effective lifecycle. It cannot combine client approval with application-declared boundaries without collapsing evidence layers.

## 20. Confirmation-boundary assessment

The four relevant layers are kept separate:

1. Application-declared terminal capability: accuse_suspect closes the investigation.
2. Application-declared Agent boundary: not established.
3. Client-runtime approval boundary: observed.
4. Human approval event: observed.
5. Terminal mutation/result after approval: observed.

The result is not:

~~~text
The Archive has no safety boundary.
~~~

Nor is it:

~~~text
Client approval proves application-level parity.
~~~

The accurate conclusion is:

~~~text
Application boundary: UNRESOLVED / NOT ESTABLISHED
Client-runtime approval: OBSERVED
Human approval: OBSERVED
Terminal result after approval: OBSERVED
~~~

Frozen Core v1 cannot type these as separate lifecycle events.

## 21. Cross-case comparison

| Case | What it contributes | Recurring limitation |
|---|---|---|
| Kurio | Commerce mutation, checkout capability, unresolved client-runtime review boundary | Application-declared Agent Surface does not include client-injected approval |
| Mabel’s Table | Temporary hold, terminal confirmation, client approval | Hold/confirm decomposition and client approval are not the same typed boundary in v1 |
| Tagboard | Policy-mediated conditional effect, accepted/rejected write, shared endpoint | Policy outcome and conditional effect are not first-class v1 concepts |
| The Archive | Intentional Human/Agent information asymmetry, client approval, terminal case closure | Complementarity, lifecycle stage, and goal-versus-workflow completion are not first-class v1 concepts |

Recurring corpus limitations:

- Application-declared boundaries and client-runtime boundaries are separate but v1 cannot type both.
- Exposed, selected, approved, executed, and effect-occurred capabilities are not a complete lifecycle.
- Conditional or policy-mediated effects need explicit outcome/provenance support.
- Goal completion and workflow completion can differ.
- Aggregate or uncorrelated results do not prove invocation-level provenance.
- Missing individual tool annotations must remain UNOBSERVED.

## 22. v2 candidate classification

These are design-review classifications only. Nothing here changes v1.

| Candidate | Classification | Evidence-based reason |
|---|---|---|
| Intentional asymmetric surfaces | REQUIRED FOR CORRECTNESS | The Archive shows that surface difference can be deliberate and semantically valid |
| Complementary capability relation | REQUIRED FOR CORRECTNESS | v1 needs to distinguish complementary roles from missing capabilities |
| Application-declared boundary | USEFUL | v1 already has Human/Agent boundary primitives; clearer relation labels would improve interpretation |
| Client-runtime boundary | REQUIRED FOR CORRECTNESS | Mabel, Kurio, Tagboard, and The Archive show runtime approval can change effective safety |
| Human approval event | REQUIRED FOR CORRECTNESS | The Archive separates user approval from original intent and application declaration |
| Capability lifecycle | REQUIRED FOR CORRECTNESS | Exposed, selected, approved, executed, and effect-occurred stages differ in the captured path |
| Exposed vs delegated capability | REQUIRED FOR CORRECTNESS | The full Agent Surface is broader than the path actually delegated |
| Selected vs executed capability | REQUIRED FOR CORRECTNESS | Selection and successful invocation are separate evidence claims |
| Conditional/policy-mediated effects | REQUIRED FOR CORRECTNESS | Tagboard demonstrates ALLOW/REJECT with different domain effects |
| Terminal effects | REQUIRED FOR CORRECTNESS | The Archive’s accusation closes a workflow after approval |
| Goal completion vs workflow completion | REQUIRED FOR CORRECTNESS | The Starter Prompt and Five-Step Flow intentionally provide different completion authorities |
| Execution correlation/provenance | REQUIRED FOR CORRECTNESS | A future audit must link approval, invocation, policy decision, and observed effect without inference |

No candidate is classified NOT JUSTIFIED BY EVIDENCE in this corpus. That does not imply that every candidate should be implemented immediately or placed in the same v2 release.

## 23. Unresolved evidence

The following remain unresolved or unobserved:

- Individual Read/Write annotations for all five tools.
- Exact native tool payloads and return objects.
- HTTP status code.
- Exact server-side persistence record.
- Application-declared confirmation boundary for accusation.
- Whether the client approval is provided by the browser, ChatGPT Work, or another intermediary layer beyond the observed interaction.
- Correlation identifier linking approval to the accuse_suspect invocation.
- Whether identifying the culprit alone is considered application workflow completion or only goal completion.
- Whether the displayed accepted result is durable state or a demo result without a persistent backing record.

No unresolved item is promoted into a confirmed application defect.

## 24. Screenshots and capture status

The supplied evidence states that captures exist for:

- pre-approval: four investigative steps completed, culprit identified, approval requested;
- approval/post-approval: accuse_suspect populated and accepted;
- final: Case #192-A solved and five-tool path reported;
- Site tools discovery/contracts;
- How WebMCP Works / asymmetric architecture.

No repository screenshot paths were supplied in this gate. No screenshot path is fabricated here.

## 25. Verification after record creation

The record was added without changing source code, Core behavior, Contract v1, tool schemas, or application behavior.

Required checks:

~~~text
npm run test:core       PASS — 8 passed, 0 failed
npm run test:contracts  PASS — 4 passed, 0 failed
npm run test:cli        PASS — 9 passed, 0 failed
npm run typecheck       PASS
npm run lint            PASS
npm run build           PASS
git diff --check        PASS
~~~

The Core manifest hash after this record:

~~~text
1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82
~~~

The Developer Contract v1 hash after this record:

~~~text
c576f4515d680128ef7db83f8096225671e9d4e7d1258c83aeb52c8fab576cfa
~~~

Protected-file checks:

- lib/core: no diff.
- docs/DEVELOPER_CONTRACT_V1.md: no diff.
- docs/validation/2026-08-27-production-validation-matrix.json: no diff.
- New documentation has no trailing blank characters.

The two Core hash values and two Contract v1 hash values are identical before and after the gate.

## 26. Final disposition

Files changed in this gate:

- docs/validation/2026-08-31-the-archive-blind-external-validation-gate4.md

No other file was intentionally changed by this gate. Existing uncommitted worktree changes remain outside this record and were preserved.

Frozen Core v1 result:

~~~text
Technical PASS
Intent PASS
Parity PASS
Agency WARN
Semantic WARN
CLI exit 0
~~~

The Agency WARN is not treated as a confirmed The Archive defect. It is evidence that Contract/Core v1 cannot yet express workflow completion separately from goal completion and cannot label Human/Agent complementary capabilities directly.

Recommended next action:

~~~text
DESIGN v2
~~~

Rationale:

- KEEP v1 alone would leave the positive-control limitation undocumented in the product model.
- PATCH v1 would risk adding ad hoc exceptions or collapsing application, client, and workflow evidence layers.
- The Archive, together with Kurio, Mabel’s Table, and Tagboard, provides enough independent evidence to design a generic v2 model for complementary surfaces, client/runtime boundaries, capability lifecycle, conditional effects, terminal effects, and goal/workflow completion.

This recommendation is for the next separate PARALLAX Cross-Application Semantic Model Review. No v2 implementation is included here.

No deployment was performed.

The Production Validation Matrix was not updated.

No additional external validation was started.
