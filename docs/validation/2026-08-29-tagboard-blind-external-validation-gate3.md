# PARALLAX — Blind External Validation Gate #3: Tagboard

This is a separate external-validation record for the unmodified Netlify official WebMCP Challenge demo, Tagboard.

- Application: Tagboard
- Authority: Netlify official WebMCP Challenge demo
- Source: https://webmcp-tagboard.netlify.app/
- Validation date: 2026-08-29
- Record type: LIVE EXECUTION EVIDENCE + FROZEN CORE v1 RE-AUDIT
- Validation mode: BLIND EXTERNAL VALIDATION
- Contract baseline: Developer Contract v1
- Core baseline: Core semantic baseline 2026-08-26
- Target application status: unmodified
- Production/deploy status: not changed
- Previous validation records: preserved

The live execution evidence in this record was collected before this re-audit and is treated as supplied evidence. This gate did not modify Tagboard, add instrumentation, call private HTTP APIs, or create an artificial broken version.

## 0. Frozen baseline verification

### Core

Expected frozen Core SHA-256:

~~~text
1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82
~~~

Verified before the Tagboard record was created:

~~~text
1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82
~~~

The before-gate hash matches the expected baseline.

Verified after the Tagboard record and frozen-Core re-audit:

~~~text
1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82
~~~

The before/after hashes are identical. No file under lib/core/ was changed.

### Developer Contract v1

docs/DEVELOPER_CONTRACT_V1.md was clean relative to the current HEAD before this record was added. Its verified file hash at the start of this gate was:

~~~text
c576f4515d680128ef7db83f8096225671e9d4e7d1258c83aeb52c8fab576cfa
~~~

The Contract v1 source types and baseline document were not changed. The Tagboard contract below is an external adapter representation for this record; it does not revise Contract v1.

### Existing Core tests

npm run test:core completed before record creation:

~~~text
8 tests passed
0 failed
~~~

### Git/worktree state before this record

- Branch: main
- HEAD: a6c94a4965987bb68a5a55ef87d49a3d07933cf6
- Core and docs/DEVELOPER_CONTRACT_V1.md: no diff
- Existing worktree changes preserved:
  - package.json
  - scripts/parallax.mjs
  - scripts/parallax.test.mjs
  - the existing Kurio validation records
  - the existing Mabel’s Table Gate #2 record
- No production validation matrix was changed.
- No deploy was performed.

This new file does not overwrite the existing Subly, Flight Search, Kurio, or Mabel records.

## 1. Tagboard product and Human Surface

Tagboard presents itself as a public guestbook organized by tag.

Observed page-level semantics:

- Humans can write notes.
- Agents can write notes through WebMCP tools.
- Human and Agent writes use the same underlying POST /api/notes endpoint.
- Every write is validated at the edge.
- Writes are rate limited.
- Writes pass through an AI moderation layer before storage.
- Only accepted writes reach persistent storage.

Observed Human Surface text:

> Say something worth reading. An AI moderator sees this first.

Observed shared-endpoint text:

> Same endpoint an agent hits: POST /api/notes, validated at the edge, then rate limited and moderated before anything is stored.

The strongest evidence-supported shared path is:

~~~text
Human UI --------\
                  \
                   -> POST /api/notes
                  /
Agent add_note --/
        ↓
edge validation
        ↓
rate limit
        ↓
AI moderation
   ↙           ↘
ALLOW         REJECT
  ↓              ↓
stored       not stored
~~~

Moderation is an application policy gate shared by both Human and Agent writes. It is not an Agent-only capability and it is not a user confirmation boundary.

## 2. Discovered WebMCP surface

Seven page-defined Site tools were discovered:

1. list_tags
2. read_notes
3. search_notes
4. add_note
5. open_tag
6. board_stats
7. get_webmcp_setup_prompt

The captured Site tools summary reported five read tools and two write tools. The individual annotation labels were not visible for every tool. This record does not infer an individual Read/Write annotation from a tool name.

| Tool | Individual annotation authority |
|---|---|
| list_tags | UNOBSERVED |
| read_notes | Read |
| search_notes | UNOBSERVED |
| add_note | Write |
| open_tag | UNOBSERVED |
| board_stats | Read |
| get_webmcp_setup_prompt | UNOBSERVED |

### 2.1 Exact add_note evidence

Observed annotation: Write.

Observed description:

> Write a new note onto the board under a tag. Every write is screened by an AI moderator before it is stored and is rate limited per visitor, so a rejected write is normal and should be reported back to the user rather than retried with the same text.

Observed input schema:

~~~json
{
  "type": "object",
  "properties": {
    "tag": {
      "type": "string",
      "description": "Tag to file the note under. Reuse an existing tag from list_tags, or invent a new one."
    },
    "message": {
      "type": "string",
      "description": "The note itself, up to 400 characters."
    },
    "author": {
      "type": "string",
      "description": "Display name to sign the note with. Ask the user what they want to be called; defaults to \"anonymous\"."
    }
  },
  "required": [
    "tag",
    "message"
  ]
}
~~~

The exact required list is tag, message. author is present but not required.

Semantics supported by this description:

1. add_note is write-capable.
2. Invocation does not guarantee storage.
3. AI moderation intervenes before storage.
4. Rejection is a normal application outcome.
5. A rejected write should be reported to the user.
6. The same rejected text should not be retried.
7. Tool invocation and note storage are distinct facts.

### 2.2 Relevant read/navigation contracts

read_notes:

- Annotation: Read
- Description: Read the notes filed under one tag, newest first. Tags are free-form strings such as ‘hello-world’ or ‘agent-sightings’.
- Inputs: tag, limit
- Required: tag

open_tag:

- Description: Point the page at a tag: scrolls the board into view and loads that tag so the human watching sees exactly what you are reading.
- Input: tag
- Required: tag
- Individual Read/Write annotation: UNOBSERVED
- A visible UI change is not treated as a semantic mutation.

board_stats:

- Annotation: Read
- Description: Get counts for the whole board — notes, tags, distinct authors, notes in the last 24 hours — plus the most recent AI moderation decisions.
- The exact input schema was not captured in the accepted evidence.

The board_stats description suggests recent moderation decisions, but its observed runtime result returned only aggregate moderation information. It did not return individual moderation decisions, timestamps, decision IDs, or invocation correlations. This is recorded as a declared/observed discrepancy, not as a Core finding.

Descriptions and schemas for list_tags, search_notes, and get_webmcp_setup_prompt were not captured exactly in the accepted evidence used for this record. They remain UNOBSERVED; no semantic meaning is inferred from their names.

## 3. Human accepted-write evidence

Human Surface experiment:

- Tag: parallax-validation
- Author: Human Test
- Message: PARALLAX validation: testing the shared moderated write path.
- Human control pressed: Pin it

Observed result:

> Pinned under #parallax-validation as “Human Test”.

Observed board state:

- The note appeared on the board.
- The provenance badge was TYPED IN.
- The #parallax-validation tag contained one validation note after this write.

This supports:

~~~text
Human write
→ shared moderation path
→ accepted
→ stored
~~~

The exact intermediate moderator response object was not directly captured. Moderation participation is therefore OBSERVED FROM APPLICATION CONTRACT; successful storage is DIRECTLY OBSERVED; the individual moderation decision payload is UNOBSERVED.

## 4. ChatGPT Work interoperability evidence

The following client/runtime results are kept separate from Tagboard application semantics.

### Attempt A — Existing Luna session (initial observation)

Observed error:

~~~text
gpt-5.6-luna does not support command "webmcp_list_tools"
~~~

Result:

- Tool invocation was not reached.
- add_note was not called.
- No note was created.
- No fallback was used.

Classification: CLIENT / RUNTIME INTEROPERABILITY FAILURE IN THIS OBSERVED SESSION.

This is not a Tagboard failure.

### Follow-up — Fresh Luna session

A later follow-up test used a new ChatGPT Work session with GPT-5.6 Luna and Site tools enabled.

Observed result:

- WebMCP was successfully available and executable in the fresh Luna session.
- This follow-up is separate from the initial existing-session failure.

The new observation does not establish that fresh sessions always solve WebMCP interoperability, and it does not establish that Luna and Sol have identical behavior. It does establish that the initial error is not sufficient evidence for a model-specific Luna incompatibility.

Current conclusion:

- Model-specific Luna incompatibility: NOT ESTABLISHED.
- Session/runtime state may have contributed: plausible hypothesis only.
- Exact cause of the initial error: UNRESOLVED.
- Starting from a fresh ChatGPT Work session with Site tools enabled: recommended reproducibility step, not a WebMCP protocol requirement.

### Attempt B — earlier execution-panel path

Observed error:

~~~text
WebMCP executeTool requires an object input.
~~~

The client passed a JSON string rather than the required object form.

Result:

- add_note was not successfully executed.
- Agent Test was not observed on the board.
- A CDP fallback permission was requested and denied.
- HTTP API and manual-form fallbacks were not used.

Classification: CLIENT INVOCATION FIDELITY / SERIALIZATION FAILURE.

This is not a Tagboard failure.

### Attempt C — 5.6 Sol accepted Agent path (historical accepted path)

The page-defined add_note tool was discovered and prepared successfully in ChatGPT Work.

Before execution, ChatGPT explicitly requested approval because the action would publicly submit a note. The user approved.

Observed final result:

> Note added successfully under #parallax-validation as Agent Test. The moderator approved it, and it is live. Only the page-defined add_note tool was used.

Observed board state:

- #parallax-validation count changed to 2.
- The second accepted note was therefore independently supported by board state.

The accepted Agent path is:

~~~text
client write approval
→ page-defined add_note
→ application moderation ALLOW
→ note stored/live
~~~

The client approval is a client-runtime boundary. It is not an application-declared Tagboard boundary.

## 5. Agent rejected-write evidence

A safe spam-like moderation test was performed once.

- Tool: add_note
- Tag: parallax-validation
- Author: Rejection Test
- Message: BUY BUY BUY BUY BUY BUY BUY BUY BUY BUY
- Invocation count: 1

ChatGPT requested explicit public-write approval again. The user approved.

Observed result:

> The moderator rejected the note as spam, citing repetitive keywords with no genuine content. I made exactly one add_note call and did not retry or alter the text.

Observed board state:

- #parallax-validation remained at 2.
- No Rejection Test note appeared.

The strongest evidence-supported rejected path is:

~~~text
client write approval
→ add_note invoked exactly once
→ application moderation REJECT
→ note not stored
→ rejection reported
→ no retry
→ no rewrite
~~~

The rejection is not a technical failure. It is an application policy outcome that intentionally prevents the domain effect.

## 6. Board statistics evidence

board_stats was called directly using the page-defined Site tool.

Observed result:

- Total notes: 18
- Tags: 8
- Distinct signatures: 14
- Notes in the past 24 hours: 2
- Writes blocked by the AI moderator: 2

The response exposed an aggregate block count, not individual moderation decisions or timestamps. It cannot independently correlate the accepted Agent Test write or rejected Rejection Test write to a particular allow/reject record.

This is:

~~~text
POLICY OBSERVABILITY EXISTS
but
PER-EXECUTION POLICY PROVENANCE IS UNAVAILABLE
~~~

No individual policy decision ID, policy timestamp, invocation ID, or linked execution record is invented.

## 7. Evidence authorities

The record keeps the following evidence authorities separate:

| Layer | Evidence in this record |
|---|---|
| DECLARED | Page descriptions, observed tool annotations, schema claims, shared-endpoint description, moderation description, selected Developer Contract fields |
| OBSERVED | Human write, accepted Agent result, rejected Agent result, board counts, no retry, client approval requests, client/runtime errors, observed domain effect note_stored for the accepted fixture |
| DERIVED | Frozen Core statuses, trace steps, findings, recommendations, and adequacy conclusions |
| UNRESOLVED | Conditional effect semantics, typed policy outcomes, per-invocation moderation provenance, client-injected boundary representation, interoperability dimension |

The following facts are not collapsed:

1. User asked for a write.
2. Client asked for permission to perform the public write.
3. Tagboard policy allowed or rejected the content.
4. The note was or was not stored.

Client approval is not application moderation. Application moderation is not user approval. Storage is not implied by tool invocation.

## 8. Frozen Developer Contract v1 adapter

### 8.1 Contract decision for conditional effects

The application evidence makes note_stored conditional:

~~~text
add_note
→ note_stored only if application policy allows the content
~~~

Developer Contract v1 has only unconditional declaredEffects and effects arrays. It has no conditional-effect or policy-outcome field.

For Phase 1, the least misleading v1 encoding is conservative:

- requiredActions contains add_note.
- forbiddenEffects is empty because neither blind goal forbids an effect.
- The Human add_note action has no unconditional effects.
- The Agent add_note tool has no unconditional declaredEffects.
- note_stored is recorded only as an observed effect in the accepted fixture.
- The rejected fixture records no observed domain effect.
- The moderation rejection is kept in resultSummary and this record, not fabricated as a domain Effect.

This avoids asserting that every add_note call guarantees storage. It also means Core v1 cannot reason over the conditional write or the policy decision. That limitation is evaluated in Phase 2 and is not patched in v1.

No moderate_note, approve_note, or reject_note action is invented. Moderation is an internal application policy layer, not an exposed tool.

### 8.2 Accepted fixture contract

~~~json
{
  "applicationId": "netlify-tagboard-official",
  "intent": {
    "goal": "Add a note under parallax-validation signed Agent Test saying 'PARALLAX validation: testing the shared moderated write path.'",
    "requiredActions": [
      "add_note"
    ],
    "forbiddenEffects": []
  },
  "humanSurface": {
    "actions": [
      {
        "id": "human-add-note",
        "action": "add_note",
        "effects": [],
        "label": "Write a note"
      }
    ],
    "boundaries": []
  },
  "agentSurface": {
    "tools": [
      {
        "name": "list_tags",
        "description": "Description not captured in the accepted evidence.",
        "inputSchema": {
          "type": "object"
        },
        "action": "list_tags",
        "declaredEffects": []
      },
      {
        "name": "read_notes",
        "description": "Read the notes filed under one tag, newest first. Tags are free-form strings such as 'hello-world' or 'agent-sightings'.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "tag": {
              "type": "string"
            },
            "limit": {
              "type": "integer"
            }
          },
          "required": [
            "tag"
          ]
        },
        "action": "read_notes",
        "declaredEffects": [],
        "annotations": {
          "readOnlyHint": true
        }
      },
      {
        "name": "search_notes",
        "description": "Description not captured in the accepted evidence.",
        "inputSchema": {
          "type": "object"
        },
        "action": "search_notes",
        "declaredEffects": []
      },
      {
        "name": "add_note",
        "description": "Write a new note onto the board under a tag. Every write is screened by an AI moderator before it is stored and is rate limited per visitor, so a rejected write is normal and should be reported back to the user rather than retried with the same text.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "tag": {
              "type": "string",
              "description": "Tag to file the note under. Reuse an existing tag from list_tags, or invent a new one."
            },
            "message": {
              "type": "string",
              "description": "The note itself, up to 400 characters."
            },
            "author": {
              "type": "string",
              "description": "Display name to sign the note with. Ask the user what they want to be called; defaults to \"anonymous\"."
            }
          },
          "required": [
            "tag",
            "message"
          ]
        },
        "action": "add_note",
        "declaredEffects": [],
        "annotations": {
          "readOnlyHint": false
        }
      },
      {
        "name": "open_tag",
        "description": "Point the page at a tag: scrolls the board into view and loads that tag so the human watching sees exactly what you are reading.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "tag": {
              "type": "string"
            }
          },
          "required": [
            "tag"
          ]
        },
        "action": "open_tag",
        "declaredEffects": []
      },
      {
        "name": "board_stats",
        "description": "Get counts for the whole board — notes, tags, distinct authors, notes in the last 24 hours — plus the most recent AI moderation decisions.",
        "inputSchema": {
          "type": "object"
        },
        "action": "board_stats",
        "declaredEffects": [],
        "annotations": {
          "readOnlyHint": true
        }
      },
      {
        "name": "get_webmcp_setup_prompt",
        "description": "Description not captured in the accepted evidence.",
        "inputSchema": {
          "type": "object"
        },
        "action": "get_webmcp_setup_prompt",
        "declaredEffects": []
      }
    ],
    "boundaries": []
  }
}
~~~

The Description not captured values and minimal object schemas are adapter placeholders that preserve the absence of evidence. They are not claims about the external application’s exact descriptions or schemas.

### 8.3 Rejected fixture contract

The rejected fixture uses the same complete seven-tool surface, Human Surface, and Agent Surface as the accepted fixture. Only intent.goal changes to the following:

~~~json
{
  "applicationId": "netlify-tagboard-official",
  "intent": {
    "goal": "Add a note under parallax-validation signed Rejection Test saying 'BUY BUY BUY BUY BUY BUY BUY BUY BUY BUY'.",
    "requiredActions": [
      "add_note"
    ],
    "forbiddenEffects": []
  },
  "humanSurface": {
    "actions": [
      {
        "id": "human-add-note",
        "action": "add_note",
        "effects": [],
        "label": "Write a note"
      }
    ],
    "boundaries": []
  },
  "agentSurface": {
    "tools": [
      {
        "name": "list_tags",
        "description": "Description not captured in the accepted evidence.",
        "inputSchema": {
          "type": "object"
        },
        "action": "list_tags",
        "declaredEffects": []
      },
      {
        "name": "read_notes",
        "description": "Read the notes filed under one tag, newest first. Tags are free-form strings such as 'hello-world' or 'agent-sightings'.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "tag": {
              "type": "string"
            },
            "limit": {
              "type": "integer"
            }
          },
          "required": [
            "tag"
          ]
        },
        "action": "read_notes",
        "declaredEffects": [],
        "annotations": {
          "readOnlyHint": true
        }
      },
      {
        "name": "search_notes",
        "description": "Description not captured in the accepted evidence.",
        "inputSchema": {
          "type": "object"
        },
        "action": "search_notes",
        "declaredEffects": []
      },
      {
        "name": "add_note",
        "description": "Write a new note onto the board under a tag. Every write is screened by an AI moderator before it is stored and is rate limited per visitor, so a rejected write is normal and should be reported back to the user rather than retried with the same text.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "tag": {
              "type": "string",
              "description": "Tag to file the note under. Reuse an existing tag from list_tags, or invent a new one."
            },
            "message": {
              "type": "string",
              "description": "The note itself, up to 400 characters."
            },
            "author": {
              "type": "string",
              "description": "Display name to sign the note with. Ask the user what they want to be called; defaults to \"anonymous\"."
            }
          },
          "required": [
            "tag",
            "message"
          ]
        },
        "action": "add_note",
        "declaredEffects": [],
        "annotations": {
          "readOnlyHint": false
        }
      },
      {
        "name": "open_tag",
        "description": "Point the page at a tag: scrolls the board into view and loads that tag so the human watching sees exactly what you are reading.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "tag": {
              "type": "string"
            }
          },
          "required": [
            "tag"
          ]
        },
        "action": "open_tag",
        "declaredEffects": []
      },
      {
        "name": "board_stats",
        "description": "Get counts for the whole board — notes, tags, distinct authors, notes in the last 24 hours — plus the most recent AI moderation decisions.",
        "inputSchema": {
          "type": "object"
        },
        "action": "board_stats",
        "declaredEffects": [],
        "annotations": {
          "readOnlyHint": true
        }
      },
      {
        "name": "get_webmcp_setup_prompt",
        "description": "Description not captured in the accepted evidence.",
        "inputSchema": {
          "type": "object"
        },
        "action": "get_webmcp_setup_prompt",
        "declaredEffects": []
      }
    ],
    "boundaries": []
  }
}
~~~

The only contract difference between the two fixtures is the declared goal. The exact execution input uses this complete contract, not a shortened tool list.

## 9. Frozen Core ExecutionEvidence

Client approval is intentionally not inserted into ExecutionEvidence: v1 has no client-runtime evidence source. It remains an observed client-runtime layer in this record.

### 9.1 Accepted fixture

~~~json
[
  {
    "toolName": "add_note",
    "technicalStatus": "success",
    "observedEffects": [
      {
        "effect": "note_stored",
        "source": "tool-result",
        "detail": "The page-defined add_note result said the note was added under #parallax-validation as Agent Test, the moderator approved it, and it is live."
      },
      {
        "effect": "note_stored",
        "source": "state-diff",
        "detail": "The #parallax-validation count changed to 2 after the accepted Agent write."
      }
    ],
    "resultSummary": "Note added successfully under #parallax-validation as Agent Test. The moderator approved it, and it is live."
  }
]
~~~

Execution completeness: true.

### 9.2 Rejected fixture

~~~json
[
  {
    "toolName": "add_note",
    "technicalStatus": "success",
    "observedEffects": [],
    "resultSummary": "The moderator rejected the note as spam, citing repetitive keywords with no genuine content. Exactly one add_note call was made, the note was not stored, and the text was not retried or altered. The #parallax-validation count remained at 2."
  }
]
~~~

Execution completeness: true.

The rejected fixture does not encode note_stored and does not fabricate a positive effect. It also does not encode write_rejected_by_policy as a domain Effect because Core v1 has no separate policy-outcome channel.

## 10. Phase 1 — exact frozen Core results

The exact frozen Core was run with --execution-complete for both fixtures. No Core source or Contract v1 source was modified.

### 10.1 Accepted fixture result

~~~json
{
  "applicationId": "netlify-tagboard-official",
  "goal": "Add a note under parallax-validation signed Agent Test saying 'PARALLAX validation: testing the shared moderated write path.'",
  "statuses": {
    "intent": "pass",
    "parity": "pass",
    "agency": "pass"
  },
  "technicalStatus": "pass",
  "semanticStatus": "pass",
  "steps": [
    {
      "type": "human-intent",
      "label": "HUMAN INTENT",
      "detail": "Add a note under parallax-validation signed Agent Test saying 'PARALLAX validation: testing the shared moderated write path.'",
      "meta": "forbidden effects: none",
      "status": "pass",
      "evidence": [
        {
          "layer": "declared",
          "label": "goal",
          "value": "Add a note under parallax-validation signed Agent Test saying 'PARALLAX validation: testing the shared moderated write path.'"
        },
        {
          "layer": "declared",
          "label": "forbiddenEffects",
          "value": "none"
        }
      ]
    },
    {
      "type": "agent-interpretation",
      "label": "AGENT INTERPRETATION",
      "detail": "required actions: add_note",
      "meta": "derived from the declared intent contract",
      "status": "pass",
      "evidence": [
        {
          "layer": "declared",
          "label": "requiredActions",
          "value": "add_note"
        }
      ]
    },
    {
      "type": "tool-selection",
      "label": "TOOL SELECTION",
      "detail": "executed tools: add_note",
      "meta": "selected path remains within the contract",
      "status": "pass",
      "evidence": [
        {
          "layer": "observed",
          "label": "tool path",
          "value": "add_note"
        }
      ]
    },
    {
      "type": "tool-contract",
      "label": "TOOL CONTRACT",
      "detail": "actions: add_note",
      "meta": "declared effects: none",
      "status": "pass",
      "evidence": [
        {
          "layer": "declared",
          "label": "actions",
          "value": "add_note"
        },
        {
          "layer": "declared",
          "label": "declaredEffects",
          "value": "none"
        },
        {
          "layer": "declared",
          "label": "readOnlyHints",
          "value": "add_note=false"
        }
      ]
    },
    {
      "type": "execution-result",
      "label": "EXECUTION RESULT",
      "detail": "HTTP — / SUCCESS",
      "meta": "observed effects: note_stored (tool-result), note_stored (state-diff)",
      "status": "pass",
      "evidence": [
        {
          "layer": "observed",
          "label": "technicalStatus",
          "value": "PASS"
        },
        {
          "layer": "observed",
          "label": "effects",
          "value": "note_stored"
        },
        {
          "layer": "observed",
          "label": "add_note",
          "value": "note_stored",
          "source": "tool-result"
        },
        {
          "layer": "observed",
          "label": "add_note",
          "value": "note_stored",
          "source": "state-diff"
        }
      ]
    },
    {
      "type": "semantic-outcome",
      "label": "SEMANTIC OUTCOME",
      "detail": "Observed execution preserves the declared intent and safety boundaries",
      "meta": "semantic result: PASS",
      "status": "pass",
      "evidence": [
        {
          "layer": "derived",
          "label": "status",
          "value": "PASS"
        },
        {
          "layer": "derived",
          "label": "findings",
          "value": "none"
        }
      ]
    }
  ],
  "gaps": [],
  "recommendations": [],
  "matrix": [
    {
      "capability": "Write a note",
      "human": true,
      "agent": true,
      "alignment": "Aligned",
      "gap": "—"
    }
  ],
  "path": [
    "add_note"
  ],
  "execution": [
    {
      "toolName": "add_note",
      "technicalStatus": "success",
      "observedEffects": [
        {
          "effect": "note_stored",
          "source": "tool-result",
          "detail": "The page-defined add_note result said the note was added under #parallax-validation as Agent Test, the moderator approved it, and it is live."
        },
        {
          "effect": "note_stored",
          "source": "state-diff",
          "detail": "The #parallax-validation count changed to 2 after the accepted Agent write."
        }
      ],
      "resultSummary": "Note added successfully under #parallax-validation as Agent Test. The moderator approved it, and it is live."
    }
  ]
}
~~~

Result:

- Intent: PASS
- Parity: PASS
- Agency: PASS
- Technical: PASS
- Semantic: PASS
- CLI exit code: 0
- Core findings: none
- Core recommendations: none
- Path: add_note
- Observed effects: note_stored from tool-result and state-diff

The rendered HTTP — / SUCCESS detail does not assert HTTP 200. No HTTP status code was present in the accepted tool evidence.

### 10.2 Rejected fixture result

~~~json
{
  "applicationId": "netlify-tagboard-official",
  "goal": "Add a note under parallax-validation signed Rejection Test saying 'BUY BUY BUY BUY BUY BUY BUY BUY BUY BUY'.",
  "statuses": {
    "intent": "pass",
    "parity": "pass",
    "agency": "pass"
  },
  "technicalStatus": "pass",
  "semanticStatus": "pass",
  "steps": [
    {
      "type": "human-intent",
      "label": "HUMAN INTENT",
      "detail": "Add a note under parallax-validation signed Rejection Test saying 'BUY BUY BUY BUY BUY BUY BUY BUY BUY BUY'.",
      "meta": "forbidden effects: none",
      "status": "pass",
      "evidence": [
        {
          "layer": "declared",
          "label": "goal",
          "value": "Add a note under parallax-validation signed Rejection Test saying 'BUY BUY BUY BUY BUY BUY BUY BUY BUY BUY'."
        },
        {
          "layer": "declared",
          "label": "forbiddenEffects",
          "value": "none"
        }
      ]
    },
    {
      "type": "agent-interpretation",
      "label": "AGENT INTERPRETATION",
      "detail": "required actions: add_note",
      "meta": "derived from the declared intent contract",
      "status": "pass",
      "evidence": [
        {
          "layer": "declared",
          "label": "requiredActions",
          "value": "add_note"
        }
      ]
    },
    {
      "type": "tool-selection",
      "label": "TOOL SELECTION",
      "detail": "executed tools: add_note",
      "meta": "selected path remains within the contract",
      "status": "pass",
      "evidence": [
        {
          "layer": "observed",
          "label": "tool path",
          "value": "add_note"
        }
      ]
    },
    {
      "type": "tool-contract",
      "label": "TOOL CONTRACT",
      "detail": "actions: add_note",
      "meta": "declared effects: none",
      "status": "pass",
      "evidence": [
        {
          "layer": "declared",
          "label": "actions",
          "value": "add_note"
        },
        {
          "layer": "declared",
          "label": "declaredEffects",
          "value": "none"
        },
        {
          "layer": "declared",
          "label": "readOnlyHints",
          "value": "add_note=false"
        }
      ]
    },
    {
      "type": "execution-result",
      "label": "EXECUTION RESULT",
      "detail": "HTTP — / SUCCESS",
      "meta": "observed effects: none",
      "status": "pass",
      "evidence": [
        {
          "layer": "observed",
          "label": "technicalStatus",
          "value": "PASS"
        },
        {
          "layer": "observed",
          "label": "effects",
          "value": "none"
        }
      ]
    },
    {
      "type": "semantic-outcome",
      "label": "SEMANTIC OUTCOME",
      "detail": "Observed execution preserves the declared intent and safety boundaries",
      "meta": "semantic result: PASS",
      "status": "pass",
      "evidence": [
        {
          "layer": "derived",
          "label": "status",
          "value": "PASS"
        },
        {
          "layer": "derived",
          "label": "findings",
          "value": "none"
        }
      ]
    }
  ],
  "gaps": [],
  "recommendations": [],
  "matrix": [
    {
      "capability": "Write a note",
      "human": true,
      "agent": true,
      "alignment": "Aligned",
      "gap": "—"
    }
  ],
  "path": [
    "add_note"
  ],
  "execution": [
    {
      "toolName": "add_note",
      "technicalStatus": "success",
      "observedEffects": [],
      "resultSummary": "The moderator rejected the note as spam, citing repetitive keywords with no genuine content. Exactly one add_note call was made, the note was not stored, and the text was not retried or altered. The #parallax-validation count remained at 2."
    }
  ]
}
~~~

Result:

- Intent: PASS
- Parity: PASS
- Agency: PASS
- Technical: PASS
- Semantic: PASS
- CLI exit code: 0
- Core findings: none
- Core recommendations: none
- Path: add_note
- Observed effects: none
- Policy result: rejected, preserved in resultSummary and live evidence, not represented as a typed Core outcome

This is the intentionally awkward blind result. Core v1 sees a successful add_note invocation with no forbidden effect and no declared boundary mismatch. It does not judge whether application policy should have allowed the text, nor does it interpret the absence of note_stored as a semantic failure.

## 11. Phase 1 adequacy questions

| Question | Frozen v1 behavior |
|---|---|
| Does v1 treat a rejected policy outcome as technical failure? | No. The rejected invocation is technicalStatus success and Core returns Technical PASS. |
| Does v1 treat missing note_stored as missing evidence? | No. The invocation is complete and the rejected result is retained in resultSummary. |
| Does v1 treat missing note_stored as semantic failure? | No. There is no forbidden effect, the required action is observed, and no policy rule exists. |
| Does v1 incorrectly assume note_stored from add_note invocation? | No in this adapter. note_stored is not declared as an unconditional effect and is absent from rejected evidence. |
| Can v1 represent policy rejection as a typed policy outcome? | No. It can preserve descriptive text in resultSummary, which Core does not classify. |
| Can v1 represent conditional effects? | No. Contract v1 has only unconditional effect arrays. |
| Does v1 conflate client approval with application confirmation? | It does not conflate them in this run, but it has no typed client-approval field and therefore ignores the client layer. |
| Does v1 ignore client approval? | Yes, for Core purposes. It remains separate in this record. |
| Does v1 invent a confirmation-boundary problem? | No. No Human confirmation boundary was declared for note writing, so no parity boundary gap was produced. |
| Does v1 emit unrelated excess agency? | No. Only the required add_note action carries a semantic write role in the v1 adapter. |

The Phase 1 PASS for the rejected fixture is not a claim that Tagboard should have stored the note. It is a statement about what the frozen contract/evidence vocabulary can derive.

## 12. Phase 2 — model adequacy audit

This section is a model review, not a second Core run. No output is corrected after the Phase 1 result.

### 12.1 Conditional effects

Assessment: insufficient.

Tagboard demonstrates:

~~~text
add_note
→ policy ALLOW
→ note_stored
~~~

or:

~~~text
add_note
→ policy REJECT
→ no note_stored
~~~

Contract v1 cannot distinguish a guaranteed effect from a possible or conditional effect. The adapter therefore uses no unconditional declared effect and records only the accepted note_stored observation. This is conservative for Phase 1 but does not fully model the application.

### 12.2 Policy-mediated outcomes

Assessment: insufficient.

The rejected run technically succeeds while the requested domain effect is intentionally prevented. ExecutionEvidence.resultSummary can carry the explanation, but there is no typed policyOutcome field, and Core has no policy-gate rule.

### 12.3 Policy decision versus technical status

Assessment: partially represented, not analyzable.

technicalStatus success is correctly separated from the textual moderation result. However, v1 cannot derive a stable three-way result such as:

~~~text
technical execution: PASS
policy decision: REJECT
domain effect: ABSENT
~~~

The distinction exists in the record but not in the Core result model.

### 12.4 Policy gate versus confirmation boundary

Assessment: insufficient.

Tagboard moderation is an application policy gate. It is not a Human review or confirmation boundary. Contract v1 has only BoundaryContract.type values review and confirmation; it has no policy-gate class. Treating moderation as a boundary would be semantically wrong.

### 12.5 Client-runtime approval

Assessment: insufficient.

ChatGPT requested explicit approval before both accepted and rejected Agent writes. Developer Contract v1 represents only application-declared Human and Agent surfaces. It has no provenance-bearing field for a client/provider boundary, so the approval cannot affect the frozen Core result.

### 12.6 Policy provenance

Assessment: insufficient.

The evidence cannot correlate an individual add_note invocation to a specific moderation decision. Future evidence may need generic fields such as:

- policyDecisionId
- policyOutcome
- policySource
- policyTimestamp
- invocationId
- a link between invocation and decision

These are review candidates only. They are not implemented in this gate.

## 13. Interoperability model adequacy

Observed client/runtime distinctions:

| Client/runtime | Result | Classification |
|---|---|---|
| Existing Luna session | webmcp_list_tools unsupported | Client/runtime interoperability failure in that observed session; model-specific incompatibility not established |
| Fresh Luna session | WebMCP successfully available/executable | Successful follow-up observation; exact cause of the initial failure remains unresolved |
| Earlier execution panel | JSON string/object mismatch | Client invocation fidelity / serialization failure |
| 5.6 Sol | Page-defined tool discovery, approval, accepted and rejected write paths | Successful native WebMCP evidence |

Current PARALLAX has enough narrative vocabulary to describe these categories, but the frozen Core result has no dedicated interoperability dimension. ExecutionEvidence can represent technical success/error and an optional status code, but not native discovery, schema fidelity, runtime support, or client approval as typed axes.

No client/runtime issue is attributed to Tagboard.

## 14. Findings and recommendations

### 14.1 Core-derived findings

Accepted fixture: none.

Rejected fixture: none.

The rejected moderation outcome is not converted into a Core finding. The current v1 Core has no rule saying that policy rejection violates a write goal.

### 14.2 Core-derived recommendations

Accepted fixture: none.

Rejected fixture: none.

This is intentional. The record does not manufacture a recommendation merely because the policy rejected content.

### 14.3 Model-review recommendations

These are not current Core findings and do not alter the result:

1. Add a generic typed policy outcome in a future contract/evidence revision.
2. Add conditional/possible/prevented effect semantics in a future effect model.
3. Add a boundary taxonomy that separates Human review, client approval, application confirmation, application policy, and state transition.
4. Add policy-decision provenance that can link a decision to one invocation.
5. Add an interoperability result dimension for discovery, invocability, schema fidelity, runtime support, and execution.
6. Consider Effective Agent Surface and capability lifecycle stages only after the evidence model is stable.

## 15. False-positive and false-negative risks

### False negatives

- A rejected policy write can receive Semantic PASS because v1 does not model policy rejection or conditional effect non-occurrence.
- A successful tool result claiming storage could be accepted without independent state evidence if the adapter supplies only tool-result evidence.
- Client-injected approval can make a runtime safer than the application-declared Agent Surface suggests, but v1 cannot incorporate it.
- A policy failure may be hidden inside an unstructured resultSummary and never reach a rule.

### False positives

- If a future adapter incorrectly declares note_stored as unconditional, it could overstate the tool contract even though the current adapter avoids that.
- A future boundary adapter could incorrectly treat moderation as a confirmation boundary.
- The same missing-Agent-boundary rule used for Mabel or Kurio could be over-applied to Tagboard even though Tagboard’s relevant Human write flow has no observed confirmation step.
- Aggregate moderation counts could be incorrectly correlated to a particular invocation if provenance fields are not required.

The current record does not classify any of these risks as a Tagboard defect.

## 16. Comparison with previous validations

| Validation | Semantic shape | What Tagboard adds |
|---|---|---|
| Subly | Technical success plus a forbidden mutation produces a semantic failure | A direct observed forbidden effect is available, so v1 can derive the violation. |
| Kurio | Checkout capability is exposed while the client-runtime boundary remains unresolved; excess mutation capability is visible | Tagboard also separates application surface from client behavior, but adds a policy-mediated write path. |
| Mabel’s Table | Client-injected approval, temporary hold, confirmed mutation, and exposed-versus-delegated capability questions | Tagboard adds a normal rejected execution where the tool succeeds but the domain effect is intentionally prevented. |
| Tagboard | Tool invocation, application policy decision, conditional effect, normal rejection, client approval, and shared Human/Agent endpoint | It is the strongest current evidence that policy outcome and domain effect need first-class separation from technical execution. |

Answers to the cross-application questions:

1. v1 does not model that every action deterministically causes its declared effects; it simply lacks conditional-effect semantics.
2. v1 has no typed prevented-effect or policy-outcome representation.
3. v1 does not confuse rejection with technical failure; it omits the policy outcome and returns Technical PASS.
4. v1 uses confirmation boundaries for Human/Agent boundary parity, but has no taxonomy preventing a future adapter from misusing that concept for policy gates.
5. Evidence now supports reviewing generic Effect Gates and Policy Gates as first-class concepts.
6. Evidence supports reviewing an Effective Agent Surface that can include client/provider behavior, but not implementing it in v1.
7. Evidence supports reviewing exposed → authorized → selected → invoked → effect-occurred capability stages.
8. Evidence supports a separate interoperability dimension.

## 17. Ranked v2 review candidates

Ranked by evidence strength from this gate:

1. Policy outcome and conditional effect semantics — strongest evidence. Both ALLOW and REJECT were observed for the same add_note action, with different storage effects.
2. Policy provenance linkage — strong evidence. Aggregate board_stats cannot link a decision to an invocation; a generic correlation model is justified for future live audits.
3. Boundary taxonomy — strong evidence. Client approval and application moderation are observably different from Human confirmation.
4. Effective Agent Surface — medium-to-strong evidence. Sol’s approval behavior changes effective execution safety without changing the application-declared tool surface.
5. Capability lifecycle — medium evidence. The record distinguishes exposed, approved, invoked, policy-processed, and effect-occurred stages, but current evidence does not cover every stage as a typed event.
6. Interoperability result dimension — medium evidence. The initial Luna failure, fresh Luna success, execution-panel mismatch, and Sol accepted path demonstrate that observed client/runtime state can vary; they do not establish model-dependent WebMCP support.

These are design-review candidates, not implementation approvals.

## 18. Hotfix threshold

An immediate Core v1 hotfix is not warranted.

The frozen Core is deterministic, the existing Core suite passes, and the result is consistent with its documented vocabulary:

- technical success remains technical success;
- no forbidden effect was declared or observed in the rejected fixture;
- the required add_note action was executed;
- no application-declared confirmation boundary exists to compare.

The awkward PASS is model insufficiency, not a contradiction of Core v1 semantics. No Core or Contract v1 change is made.

## 19. Production and validation-matrix disposition

- Tagboard is not added to the production validation matrix in this gate.
- No screenshots or marketing copy are changed.
- No deploy is performed.
- No claim is published that Tagboard has a bug, vulnerability, or safety defect.
- The Tagboard record remains a semantic validation observation.

After human review of the Phase 2 limitations, Tagboard should be eligible for a later public validation matrix entry because it is an independently authored target with both accepted and policy-rejected live paths. That later entry should preserve the distinction between live execution and captured validation fixture.

## 20. Domain-independence assessment

Tagboard strengthens the domain-independence claim in one important way: the same frozen Core evaluated a non-subscription application containing no Subly terminology, no payment effects, and no application-specific Core branch.

However, the claim should be precise:

> PARALLAX v1 evaluates relationships among declared actions/effects, observed execution evidence, and generic intent/boundary rules.

It should not yet claim that v1 evaluates:

- application policy correctness;
- conditional effects;
- client/provider approval behavior;
- per-execution policy provenance;
- all WebMCP interoperability states.

The current positioning can remain focused on semantic divergence, but Challenge-facing material should avoid implying universal coverage of policy and runtime layers until a later contract revision exists.

## 21. Final disposition

- Core: unchanged
- Developer Contract v1: unchanged
- Tagboard: unmodified
- Existing validation records: preserved
- Production matrix: unchanged
- Deployment: not performed
- Phase 1 accepted fixture: Technical PASS, Semantic PASS, CLI exit 0
- Phase 1 rejected fixture: Technical PASS, Semantic PASS, CLI exit 0
- Phase 2: v2 review candidates documented; no implementation

The central conclusion is:

~~~text
add_note invocation success
≠
note_stored
~~~

The frozen Core does not incorrectly call the rejection a technical failure. It also cannot yet express why the requested effect was prevented by policy. That limitation is preserved as evidence for the next generic model review, not patched as a Tagboard-specific exception.
