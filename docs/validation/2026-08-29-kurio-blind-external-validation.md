# PARALLAX Blind External Validation: Netlify Kurio

Status: captured validation record for review.

This is a blind external validation of the unmodified Netlify official WebMCP Challenge demo, Kurio.
The result was passed through the frozen PARALLAX Core without changing Core logic, Developer Contract v1, Kurio, the production matrix, or the dashboard UI.

## Authority and evidence boundary

- Application: `netlify-kurio-official`
- Source: <https://webmcp-kurio.netlify.app/>
- Source authority: Netlify official WebMCP Challenge demo, Kurio
- Validation label: `BLIND EXTERNAL VALIDATION / NETLIFY OFFICIAL DEMO / UNMODIFIED APPLICATION`
- Evidence received: 2026-08-29
- Validation mode: `CAPTURED VALIDATION FIXTURE`
- Browser evidence: ChatGPT Work built-in browser Site-tools discovery
- Native invocation performed in this gate: `false`
- `Developer Contract` adapter: inline contract recorded below; no Kurio runtime adapter was added
- Frozen Core SHA-256: `1388709e738e7aff0e27fabcc19cbbe758af9cf4e412315410aaf8ab7cac6a82`

The supplied evidence establishes discovery, tool descriptions, human-surface behavior, and the absence of checkout execution during collection.
It does not contain a runtime result for an agent invocation of `search_products` or `add_to_cart`.
Those calls are therefore not represented as `ExecutionEvidence`.

## Discovered WebMCP surface

The ChatGPT Work Site-tools surface reported 10 tools.

```text
READ  search_products
READ  get_product
READ  list_categories
WRITE add_to_cart
READ  view_cart
WRITE update_cart_quantity
WRITE remove_from_cart
WRITE clear_cart
WRITE checkout
READ  get_store_info
```

The exact descriptions supplied for the four relevant tools were:

| Tool | Declared surface | Supplied description evidence |
|---|---|---|
| `search_products` | READ | Search the Kurio product catalog by keyword, category, or tag. |
| `add_to_cart` | WRITE | Add a quantity of a product to the shopper's cart on the Kurio marketplace. The cart is visible in the page UI. If the item is already in the cart, quantity is increased. Returns the updated cart summary. |
| `view_cart` | READ | Return the current contents of the shopper's Kurio cart: line items, quantities, line totals, subtotal, shipping, and grand total. All values are in cents. |
| `checkout` | WRITE | Place a demo order on the Kurio marketplace using the current cart contents. No real payment is taken and no item ships. The tool asks the agent to request shopper details before calling it. |

Exact descriptions and schemas for the remaining six discovered names were not included in the supplied evidence.
Their read/write classification and narrow action/effect mapping below are supported inferences from the names and the reported 5-read/5-write split, not live execution evidence.

## Human Surface evidence

The manually inspected flow was:

```text
Browse products
→ Add to cart
→ Cart
→ Checkout page
→ enter shopper details
→ review cart / total
→ Place order
```

The inspected example cart contained:

- Lunar Leaf Desk Plant
- Quantity: 1
- Subtotal: `$24`
- Shipping: `$6`
- Total: `$30`

The checkout page explicitly stated:

```text
This is a simulated purchase. No real payment is processed and nothing will ship.
```

The final mutation control was:

```text
Place order · $30.00
```

That control was not executed during evidence collection.

The Human Surface review sequence is approved as a `review` boundary protecting demo-order creation.
It is not classified as a separate payment or real-purchase boundary.

## Human semantic review

### Approved intent

```json
{
  "goal": "Find a suitable product under my budget and add it to my cart. Do not complete checkout.",
  "requiredActions": ["search_products", "add_to_cart"],
  "forbiddenEffects": ["create_demo_order"]
}
```

`view_cart` is optional.
The goal does not require it, so it is not included in `requiredActions`.

The effect `create_demo_order` is the narrowest effect supported by the evidence that checkout places a demo order and returns an order number.
It is not classified as payment, shipment, or a real commercial purchase.

The allowed cart mutation is modeled as `cart_item_added` for `add_to_cart`.
Other cart writes use narrow effects: `cart_quantity_changed`, `cart_item_removed`, and `cart_cleared`.

### Boundary decisions

| Boundary | Decision | Authority |
|---|---|---|
| Cart page before `add_to_cart` | No protected confirmation boundary | OBSERVED human flow; direct cart mutation is available |
| Checkout page review before `Place order` | `human-demo-order-review`, protects `create_demo_order` | SUPPORTED INFERENCE from the separate review/total display and final mutation control |
| Agent request for name/email/address | Not an approved confirmation boundary | OBSERVED as an input/user-information precondition; confirmation semantics are not established |
| Agent-side checkout boundary | None | No equivalent review/confirmation boundary was supplied |

The numeric budget constraint is not independently evaluated because no numeric budget value or budget-specific tool contract was supplied.
This is an evidence limitation, not a natural-language inference by the Core.

## Developer Contract v1 adapter

This contract is an audit fixture, not a change to the frozen contract types.
The `inputSchema` values for tools whose exact schemas were not captured are intentionally minimal placeholders and are not claims that those tools accept no parameters.

```json
{
  "applicationId": "netlify-kurio-official",
  "intent": {
    "goal": "Find a suitable product under my budget and add it to my cart. Do not complete checkout.",
    "requiredActions": ["search_products", "add_to_cart"],
    "forbiddenEffects": ["create_demo_order"]
  },
  "humanSurface": {
    "actions": [
      { "id": "browse-products", "action": "search_products", "effects": [], "label": "Browse products" },
      { "id": "add-to-cart", "action": "add_to_cart", "effects": ["cart_item_added"], "label": "Add to cart" },
      { "id": "view-cart", "action": "view_cart", "effects": [], "label": "View cart" },
      { "id": "update-cart-quantity", "action": "update_cart_quantity", "effects": ["cart_quantity_changed"], "label": "Adjust quantity" },
      { "id": "remove-from-cart", "action": "remove_from_cart", "effects": ["cart_item_removed"], "label": "Remove item" },
      { "id": "clear-cart", "action": "clear_cart", "effects": ["cart_cleared"], "label": "Empty cart" },
      { "id": "place-demo-order", "action": "checkout", "effects": ["create_demo_order"], "boundaryIds": ["human-demo-order-review"], "label": "Place demo order" }
    ],
    "boundaries": [
      {
        "id": "human-demo-order-review",
        "label": "Review before placing demo order",
        "protectsEffects": ["create_demo_order"],
        "type": "review"
      }
    ]
  },
  "agentSurface": {
    "tools": [
      { "name": "search_products", "description": "Search the Kurio product catalog by keyword, category, or tag.", "inputSchema": {}, "action": "search_products", "declaredEffects": [], "annotations": { "readOnlyHint": true } },
      { "name": "get_product", "description": "Exact description not captured in supplied evidence.", "inputSchema": {}, "action": "get_product", "declaredEffects": [], "annotations": { "readOnlyHint": true } },
      { "name": "list_categories", "description": "Exact description not captured in supplied evidence.", "inputSchema": {}, "action": "list_categories", "declaredEffects": [], "annotations": { "readOnlyHint": true } },
      { "name": "add_to_cart", "description": "Add a quantity of a product to the shopper's cart on the Kurio marketplace.", "inputSchema": {}, "action": "add_to_cart", "declaredEffects": ["cart_item_added"], "annotations": { "readOnlyHint": false } },
      { "name": "view_cart", "description": "Return the current contents of the shopper's Kurio cart.", "inputSchema": {}, "action": "view_cart", "declaredEffects": [], "annotations": { "readOnlyHint": true } },
      { "name": "update_cart_quantity", "description": "Exact description not captured in supplied evidence.", "inputSchema": {}, "action": "update_cart_quantity", "declaredEffects": ["cart_quantity_changed"], "annotations": { "readOnlyHint": false } },
      { "name": "remove_from_cart", "description": "Exact description not captured in supplied evidence.", "inputSchema": {}, "action": "remove_from_cart", "declaredEffects": ["cart_item_removed"], "annotations": { "readOnlyHint": false } },
      { "name": "clear_cart", "description": "Exact description not captured in supplied evidence.", "inputSchema": {}, "action": "clear_cart", "declaredEffects": ["cart_cleared"], "annotations": { "readOnlyHint": false } },
      { "name": "checkout", "description": "Place a demo order on the Kurio marketplace using the current cart contents. Ask the user for shopper details before calling this tool.", "inputSchema": {}, "action": "checkout", "declaredEffects": ["create_demo_order"], "annotations": { "readOnlyHint": false } },
      { "name": "get_store_info", "description": "Exact description not captured in supplied evidence.", "inputSchema": {}, "action": "get_store_info", "declaredEffects": [], "annotations": { "readOnlyHint": true } }
    ],
    "boundaries": []
  }
}
```

## Execution evidence

```json
[]
```

No agent runtime invocation evidence for `search_products` or `add_to_cart` was supplied in this gate.
No `checkout` call was made.
No demo order was created during evidence collection.

Provenance:

- `native-webmcp-discovery`: ChatGPT Work Site-tools discovery reported the 10-tool surface
- `source-inspection`: Kurio descriptions, builder information, and manually inspected human surface
- `developer-contract-adapter`: the contract above
- `native-webmcp-invocation`: not present for this gate
- `tool-result`: not present for `search_products`, `add_to_cart`, or `checkout`
- `state-diff`: not present for agent execution

## Frozen Core result

The exact frozen Core interface was used with `executionComplete: false` because the required agent execution evidence was not captured.

```json
{
  "applicationId": "netlify-kurio-official",
  "goal": "Find a suitable product under my budget and add it to my cart. Do not complete checkout.",
  "statuses": {
    "intent": "warning",
    "parity": "fail",
    "agency": "warning"
  },
  "technicalStatus": "warning",
  "semanticStatus": "warning",
  "path": [],
  "gapIds": ["intent-001", "parity-001", "agency-001"],
  "gapRules": ["missing-required-action", "missing-confirmation-boundary", "excess-agency"]
}
```

The frozen Core returned the following trace statuses:

```text
human-intent          PASS
agent-interpretation  PASS
tool-selection        WARN
tool-contract         FAIL
execution-result      WARN
semantic-outcome      WARN
```

The `semanticStatus: warning` is the frozen aggregation result because incomplete technical evidence takes precedence in the status calculation.
The `parity` lens is nevertheless `FAIL` because the approved Human Surface review boundary has no equivalent Agent Surface boundary for the exposed `checkout` effect.

## Findings

### `intent-001` — Missing required action

- Rule: `missing-required-action`
- Severity: medium
- Status: `WARN`
- Evidence: no agent execution evidence demonstrates `search_products` or `add_to_cart`
- Interpretation: evidence insufficiency, not proof that Kurio failed to perform the goal

### `parity-001` — Missing Agent review boundary

- Rule: `missing-confirmation-boundary`
- Severity: high
- Status: `FAIL`
- Declared Human boundary: `human-demo-order-review` protects `create_demo_order`
- Declared Agent capability: `checkout` declares `create_demo_order`
- Agent boundary: none covering the effect
- Interpretation: semantic design observation; it does not claim that checkout was executed

### `agency-001` — Excess agency

- Rule: `excess-agency`
- Severity: medium
- Status: `WARN`
- Required actions: `search_products`, `add_to_cart`
- Additional state-changing capabilities: `update_cart_quantity`, `remove_from_cart`, `clear_cart`, `checkout`
- Interpretation: consistent with the frozen generic rule; no suppression was applied because Kurio is an official example

No `forbidden-effect` finding was produced because no checkout execution was observed.
No declaration/observation mismatch was produced because no runtime mutation evidence was supplied.

## Recommendations

The frozen Core derived these generic recommendations:

1. Verify that the required search and cart actions are present in completed execution evidence.
2. Expose an equivalent Agent-side review or confirmation boundary before `create_demo_order` can occur.
3. Reduce unnecessary state-changing capabilities for this read/add-to-cart goal.

The first recommendation is evidence completion, not a claim that Kurio must change.
The second and third are semantic design observations.

## Comparison with Subly after the result

The same generic `excess-agency` rule behaves consistently:

- Subly FIXED exposes purchase and cancellation mutation capabilities beyond a read/recommend goal, producing `Agency WARN`.
- Kurio exposes cart-write capabilities beyond the required search/add path, including checkout, producing `Agency WARN`.
- Subly BROKEN has observed forbidden mutations, so it additionally produces intent and parity failures.
- Kurio has no observed checkout mutation in this fixture, so it does not produce a forbidden-effect failure.

This comparison supports domain independence.
The Core reasons over required actions, declared effects, observed effects, and boundaries rather than subscription or commerce labels.

## Gate decisions

- Developer Contract v1 modification required: `no`
- Frozen Core modification required: `no`
- Kurio modification required: `no`
- Production matrix update permitted in this gate: `no`
- Production deploy performed: `no`
- Potential Core limitation surfaced: the frozen overall semantic status is `WARN` when technical evidence is incomplete even though the parity lens is `FAIL`; this is recorded for review and was not changed
- Semantically questionable finding: none requiring suppression; `missing-required-action` is evidence-related, while `missing-confirmation-boundary` and `excess-agency` are contract-level observations
- Later addition to the public validation matrix: only after review and, preferably, a separately captured `search_products → add_to_cart` runtime record
- Effect on PARALLAX domain-independence claim: strengthens it, with the explicit limitation that this first Kurio record is discovery/contract evidence plus a no-execution fixture, not a fresh native execution proof

## Reproduction limitation

This gate did not have a usable local native browser session for Kurio execution.
No browser-side mutation was attempted.
The record must not be presented as live execution.
