# PARALLAX Claims and Limitations

Use this ledger as the final copy gate. Do not publish a stronger formulation than the disposition permits.

## Claim ledger

| Claim | Disposition | Safe wording |
| --- | --- | --- |
| Catches semantic failures after HTTP 200 | SUPPORTED | PARALLAX can derive Semantic FAIL when explicit forbidden effects are observed after a technically successful call. |
| Compares Human and Agent surfaces | SUPPORTED | PARALLAX compares declared Human Surface actions and boundaries with the Agent Surface contract and observed path. |
| Deterministic semantic regression | SUPPORTED | The pure Core deterministically derives results from explicit contract and evidence inputs. |
| Policy-aware effects | SUPPORTED WITH SCOPE | v2 can separate application policy outcome from technical status and domain effect when the adapter supplies policy/effect evidence. |
| Complementary surfaces | SUPPORTED WITH SCOPE | v2 represents an explicitly declared COMPLEMENTARY Human/Agent relation; it does not infer complementarity automatically. |
| Blind-tested unmodified demos | SUPPORTED WITH SCOPE | The same model was applied to selected unmodified or independently authored demos through separately labelled evidence records. Do not imply every test was exhaustive live-native execution. |
| ChatGPT in-app browser compatibility | SUPPORTED WITH SCOPE | A fresh Work-style runtime was tested and its discovery limitation was recorded; native Chrome 151 remains the verified live path. |
| Chrome WebMCP compatibility | SUPPORTED WITH SCOPE | The production page was validated in the documented Chrome 151 WebMCP-enabled environment. |
| Works with any WebMCP app | SUPPORTED WITH SCOPE | The Core is domain-independent for applications that supply the required semantic contract and execution evidence adapter. Never claim zero-configuration universality. |
| Automatic intent inference | DO NOT CLAIM | PARALLAX does not infer the complete semantic contract from natural language alone. |
| Prevents unsafe actions | DO NOT CLAIM generally | The controlled demo can display a prevented effect; PARALLAX primarily audits and reports rather than enforcing runtime safety. |
| Runtime enforcement | DO NOT CLAIM | PARALLAX is not a runtime policy gateway. |
| Security scanner | DO NOT CLAIM | It does not scan for vulnerabilities or arbitrary URLs. |
| CI-ready | DO NOT CLAIM | The local CLI is not a CI integration. |
| npm-published package | DO NOT CLAIM | The CLI is a local/module integration example. |

## Evidence language

Use:

- “observed” for runtime or state evidence.
- “declared” for developer/application contract data.
- “derived” for a Core result.
- “client-runtime observed” for ChatGPT or browser approval events.
- “contract-level semantic design observation” when a missing application boundary is not confirmed by runtime behavior.
- “captured validation fixture” when the source application was not live-executed in the current run.

Avoid:

- vulnerability
- security flaw
- unsafe application
- broken external demo
- guaranteed client behavior
- universal WebMCP support
- automatic semantic understanding

## Required limitations

Include a short version in README and Devpost:

- A developer contract and execution evidence adapter are required.
- PARALLAX does not automatically infer all semantic intent from natural language or arbitrary DOM state.
- WebMCP availability varies by browser, flags, session, and client runtime.
- Some external validations use captured or human-approved evidence.
- Application-declared boundaries and client-runtime approval remain separate.
- The CLI is local and not npm-published.
- PARALLAX audits and reports; it is not a runtime enforcement or security gateway.

## Submission copy stop rule

If a sentence cannot be tied to production behavior, a unit test, a validation record, or an explicitly scoped inference, remove it or label it as a limitation.
