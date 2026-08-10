# Controller action tags

Exact signatures and options for the tags a Liquid controller uses. Read the
safety rules in `SKILL.md` first; this file is the mechanics only.

Everything here except `{% api %}`, `{% session %}`, `{% header %}`, and
`{% debug %}` is inert outside a controller template, and inert outside a
`{% before %}` / `{% after %}` / `{% final %}` block if the platform is not in
that phase.

## Contents

- [Tag-option rules](#tag-option-rules)
- [params](#params)
- [variables](#variables)
- [redirect](#redirect)
- [respond](#respond)
- [original_response](#original_response)
- [update](#update)
- [action](#action)
- [api](#api)
- [session](#session)
- [header](#header)
- [debug](#debug)
- [What is not available in a controller](#what-is-not-available-in-a-controller)

## Tag-option rules

These apply to every tag on this page and cause silent breakage when ignored.

- **No inline filters in an option value.** Pre-assign:
  `{%- assign body = result | json -%}` then `{% respond body: body %}`.
- **No inline object literals.** Build a Map or List first with `{% new %}` and
  the `set_key` / `push` filters, then pass the variable.
- **Arrays are allowed** in the literal bracket form: `items: [a, b, "c"]`.
- **Option keys may contain hyphens or underscores.**
- `true` and `false` are cast to booleans. A value starting with `t.` is treated
  as a translation key and looked up.
- **Never pass raw request values into options.** Validate them against an
  expected set, or rebuild them from trusted data, first.
- An unknown variable in an option resolves to nil rather than erroring, so a
  typo produces a silent no-op rather than a visible failure.

## params

```liquid
{% params key: value, other_key: other_value %}
```

Deep-merges into the request's params. The injected values, including Maps and
Lists, are then readable as `current_request.params.key` from the page, snippets,
components, and the layout for the rest of the request. Repeated calls merge;
same-key values from the page controller win over the theme controller.

Use this when a platform page template already reads a param and you want to
supply or override it.

## variables

```liquid
{% variables greeting: "Hello", offers: offers_map %}
```

Sets top-level template variables readable as `{{ greeting }}` in the page.
Merges shallowly (not deeply) across repeated calls and across the two
controllers, page controller winning.

Set variables in `{% before %}` if the page must see them. Set in `{% after %}`
the page has already rendered and only the layout will see them. Variables do
not survive into a later component-reload request.

## redirect

```liquid
{% redirect to: current_store.cart_path, notice: "Item added", alert: "Check your details", status: 301, data: payload %}
```

| Option | Notes |
|---|---|
| `to:` | The target path. **This is the only URL option — `path:` is silently ignored and the redirect goes nowhere.** |
| `notice:` / `alert:` | Flash message shown on the destination page |
| `status:` | Defaults to 302. Applied on the redirect branch. |
| `data:` | Included in the JSON-format payload `{ redirect, flash, alert, notice, data }` returned to an AJAX submitter |

- Build `to:` from trusted values. A target taken from a request parameter is an
  open-redirect hazard.
- Prefix internal paths with the store-relative `store_link` pattern (see
  `storeconnect-liquid`) so the link is correct on a path-mounted store.
- Use the Store Drop's documented authentication path helpers. Never hard-code
  or reconstruct authentication routes.
- You do not need to record where the visitor came from before gating. The
  platform already remembers the last visited storefront page for an
  unauthenticated GET and returns there after sign-in. A `{% session %}`
  variable will **not** influence that.

## respond

```liquid
{%- assign body = payload | json -%}
{% respond body: body, layout: false, notice: "Saved" %}
```

| Option | Notes |
|---|---|
| `body:` | The response body. Emitted **unescaped**, so never build it from unvalidated request data. |
| `layout:` | Defaults to true, which wraps `body` in the theme layout. Pass `layout: false` for JSON, plain text, or a fragment. |
| `alert:` / `notice:` | Flash rendered *by the layout*, so they are invisible when `layout: false`. |
| `status:` | Parsed but **not applied** on the respond branch. Do not rely on it for an error code. |

Content negotiation caveat: on an HTML request the body is returned as-is, but on
a request that asks for JSON the platform wraps it as
`{"html": "<your body>", "flash": null, "alert": null, "notice": null}`. If a
client needs raw JSON, either have it request HTML and parse the body, or use the
platform's built-in JSON response described in `storeconnect-components`.

## original_response

Available as a Map inside `{% after %}` only, and only on the render path — after
a redirect it is empty.

| Key | Contents |
|---|---|
| `content` | The rendered body the platform was about to send |
| `format` | For example `text/html` |
| `html`, `json`, `js` | Populated only when the action set that variant |
| `flash`, `alert`, `notice` | Pending flash values |

```liquid
{% after %}
  {%- assign wrapped = original_response.content | prepend: "<!-- reviewed -->" -%}
  {% respond body: wrapped %}
{% endafter %}
```

## update

```liquid
{% update current_cart, field: "Gift_Message__c", value: message %}
```

Writes a custom-data field on a drop. Works in all three phases.

- The first argument must be a drop (`current_cart`, `current_customer`, a record
  from `{% query %}`). Anything else is ignored.
- Requires a **read-write** Custom Data Mapping for that object and field, with
  the required field access configured. An unmapped field name and a read-only mapped
  field are both **silently ignored** — no error, no warning.
- Values read back through `.data.<field>` are HTML-escaped. Apply `| unescape`
  to a param before writing if you need the original characters, and remember
  that doing so re-arms any markup the value contained.
- Cast and type rules are in `storeconnect-liquid`.

## action

```liquid
{% action "cart.add", product_identifier: code, quantity: 2 %}
```

The complete set of registered action names:

| Action | Options |
|---|---|
| `cart.add` | `product_identifier:` (required — product sfid, slug (case-insensitive), or product code; there is **no** `product_id` or `variant_id` option), `quantity:` (default 1), `price:` (variable-price products), `override_price:` (boolean, forces a price on a non-variable product) |
| `cart.update` | `cart_item:` (a cart-item drop such as `current_cart.items.first`, not an id string), `quantity:`, `price:`, `override_price:` |
| `cart.remove` | `cart_item:` (a cart-item drop) |
| `cart.empty` | none |
| `cart.create` | none — starts a fresh empty cart for the session |
| `cart.select` | `cart_identifier:` (cart sfid or sc_id). Requires a logged-in customer and a resumable cart; scoped to that customer and the current store. |
| `cart.clone` | `cart_identifier:` (cart sfid or sc_id). Requires a logged-in session. **Never pass a request value here** — resolve the cart from the authenticated customer's own carts first and pass only a verified single match. |
| `shipping.set` | `price:` and/or `name:` to override the cart's shipping line price and displayed service name; `group:` to target one delivery group when multi-shipping is enabled. Does not set addresses. |
| `pricebook.set` | `pricebook_id:` (a price book **sfid**). Resolve it from the current store's permitted price books; never pass a request value here. |
| `pricebook.clear` | none |
| `outlet.set` | `outlet_id:` (an outlet **sfid**; validated against the current store) |
| `outlet.clear` | none |
| `promotion.apply` | `code:` |
| `promotion.remove` | `code:` |
| `promotion.clear` | none |

`line_item:` is a deprecated alias for `cart_item:` on `cart.update` and
`cart.remove`. It still works and logs a deprecation warning; use `cart_item:`.

Failure behavior: a failed action does not raise. Missing prerequisites (no
logged-in customer, no cart, no identifier) and unresolvable identifiers log to
the platform Console and no-op. `cart.add` silently does nothing for a product
that is not renderable, not in the current price book, or not approved for the
current visitor. Verify the outcome by inspecting `current_cart` rather than
assuming the action ran.

## api

```liquid
{% liquid
  assign result = ""
  api url: "https://api.example.com/v1/lookup", method: "get"
    if response.status >= 200 and response.status < 300
      assign result = response.body.status
    endif
  endapi
%}
```

| Option | Notes |
|---|---|
| `url:` | The approved integration URL. A blank value makes the tag a no-op. |
| `method:` | `get` (default), `post`, `put`, `patch`, `delete`. A body is only sent for post/put/patch. |
| `data:` | A Map, serialized to JSON as the request body |
| `async:` | `true` dispatches fire-and-forget; `response` is **not** available |

For an authenticated call, use only the documented Store Variable integration
pattern or another supported server-managed integration. Do not construct
authorization headers, name or copy credential fields into the template, or
render or log the configured value.

The `response` object inside the block exposes `status`, `body` (JSON parsed
automatically; a non-JSON body arrives as `{"body": "<raw text>"}`), and
`headers`.

Behavior and hazards:

- Unlike the other tags on this page, `{% api %}` also works outside a controller
  — in pages, snippets, and components. That makes it easy to put a blocking
  network call on a hot render path by accident.
- A slow or unreachable integration can hold the page render open. Treat a
  synchronous third-party call as an availability risk and prefer a supported
  asynchronous or server-managed integration when the response is not required
  for the page.
- **A failed call becomes a Liquid error**, and a Liquid error in a controller
  discards that controller's params, variables, and responder — including a
  redirect. Always branch on `response.status` and always define your result
  variable before the block so the template still works when the call fails.
- Inside `{% final %}` the call is **forced async** regardless of `async:`, so
  `response` is unavailable there and the call cannot affect the response.
- Never build `url:` from a request value, and never forward request headers,
  cookies, raw paths, customer or record identifiers, or payment details.
- Cache the *result* in the consuming template. Never wrap the `{% api %}` block
  itself in `{% cache %}` inside a controller: on a cache hit the block body is
  not rendered, so nothing happens at all.

## session

```liquid
{% session selected_view: view_name %}
```

Stores a value in a Liquid-only session bucket, readable anywhere in the store as
`session_variables["selected_view"]`. Values persist for the browser session, so
they are per-visitor state.

- The tag does not check the phase, so at the top level of a controller template
  it writes three times per request. Keep it inside a phase block.
- It cannot influence platform session behavior such as the post-login return
  path. It is a separate namespace.
- Do not store anything sensitive, and validate before storing — a session
  variable read back into a template is still untrusted input.
- Any fragment whose output depends on a session variable must include the
  distinguishing value in the `{% cache %}` `items:` key, or be left uncached.

## header

```liquid
{% header name: "Content-Type", value: "application/json" %}
```

Adds a response header. Usable from a controller phase; pair it with
`{% respond ... layout: false %}` when returning a non-HTML body, and confirm the
header on the real response before relying on it.

## debug

```liquid
{% debug phase: "before", matched: item_count %}
```

Writes a line per key to the platform Console. Works in any phase and anywhere in
Liquid. Use non-sensitive values only, and remove probes after testing. More in
`storeconnect-debug-performance`.

## What is not available in a controller

- **The HTTP method.** `current_request` does not expose it. The request's route
  parameters do appear in `current_request.params`, so a global controller can
  branch on those; confirm what is present with `{% debug %}` rather than
  assuming.
- **`{% context %}`.** Component context can only be set inside a component
  template; the tag raises a syntax error elsewhere. Pass data to a component
  through `{% variables %}` or `{% params %}` instead.
- **`{% respond %}` and `{% redirect %}` in `{% final %}`.** Both are inert there.
- **Any indication of whether the platform action succeeded, in `{% after %}`
  after a redirect.** `original_response` is empty on that path.
