# Controller patterns and phase selection

Working starting points for the common Liquid controller jobs, plus the rules for
choosing a phase and finding the right key. Read `SKILL.md` first: the security
rules there are not repeated here, and every example below assumes them.

## Contents

- [Choosing a phase](#choosing-a-phase)
- [What is available in which phase](#what-is-available-in-which-phase)
- [Finding the right key](#finding-the-right-key)
- [Pattern: capture an extra field on a platform form](#pattern-capture-an-extra-field-on-a-platform-form)
- [Pattern: gate access with a redirect](#pattern-gate-access-with-a-redirect)
- [Pattern: inject data for the render](#pattern-inject-data-for-the-render)
- [Pattern: call an external service with failure handling](#pattern-call-an-external-service-with-failure-handling)
- [Pattern: return a non-HTML body from a registered route](#pattern-return-a-non-html-body-from-a-registered-route)
- [Pattern: add a virtual route](#pattern-add-a-virtual-route)
- [Pattern: keep the global controller cheap](#pattern-keep-the-global-controller-cheap)
- [Common silent failures](#common-silent-failures)

## Choosing a phase

| The job | Phase | Why |
|---|---|---|
| Stop the request, or send the visitor somewhere else | `before` | It is the only phase that can cancel the platform action |
| Supply or override a param or variable the page reads | `before` | The page renders after `before` and before `after` |
| Read state the platform action is about to destroy (a cart item before a delete, a value before an overwrite) | `before` | It is gone by `after` |
| Read state the platform action creates (a new cart line, an updated total) | `after` | It does not exist yet in `before` |
| Wrap, annotate, or replace the rendered body | `after` | `original_response.content` only exists there |
| A record lookup that needs `current_page`, `current_product`, `current_article`, or `current_order` | `after` or `final` | Those are not resolved yet in `before` |
| Work that must happen on every branch, including redirects and non-standard responses | `final` | It is the only phase that always runs |
| An outbound call that must not delay the response | `final` | Calls there are forced async |

## What is available in which phase

Resolved before `{% before %}` runs, so available in all three phases:
`current_store`, `current_customer`, `current_account`, `current_cart`,
`current_outlet`, `current_pricebook`, `current_privacy`, `current_request`,
`store_variables`, `session_variables`.

Resolved by the platform action, so **empty in `{% before %}`** and available in
`{% after %}` and `{% final %}`: `current_page`, `current_product`,
`current_product_category`, `current_article`, `current_order`,
`current_search`, `current_breadcrumbs`.

`original_response` exists in `{% after %}` only, and only on a render path.

If you are unsure whether a drop is populated in the phase you are writing,
confirm it with `{% debug %}` rather than assuming. Reading an attribute of an
empty drop is safe; referencing an undefined variable is a Liquid error, and a
Liquid error discards the whole controller.

## Finding the right key

Confirm the pair against the `controllers.csv` exported with the theme, or the
published Liquid Controllers reference on `https://support.storeconnect.com/`.
Around 170 pairs are registered across roughly 70 controllers, so do not try to
memorize them. The ones most often wanted, and the ones whose names are least
guessable from the URL:

| Job | Key |
|---|---|
| Every request to the store | `controllers/theme` |
| A content page | `controllers/pages/show` |
| The home page (separate from `pages/show`) | `controllers/pages/home` |
| An unmatched URL | `controllers/pages/not_found` |
| Product detail / product listing | `controllers/products/show`, `controllers/products/index` |
| Category page | `controllers/product_categories/show` |
| Add to cart from a product page | `controllers/carts/add` |
| Cart page / cart update / remove a line | `controllers/carts/show`, `controllers/carts/update`, `controllers/cart_items/destroy` |
| Checkout customer step | `controllers/checkout/steps/customer/{show,update}` |
| Checkout shipping step | `controllers/checkout/steps/shipping/{show,update}` |
| Checkout payment step | `controllers/checkout/steps/payment/{show,update}` |
| Checkout terms step (URL says `accept_terms`) | `controllers/checkout/steps/terms/{show,update}` |
| Custom form submission | `controllers/form_submission/create` |
| Sign in / sign out / register | `controllers/auth/sessions/{new,create,destroy}`, `controllers/accounts/{register,create}` |
| Account pages / profile update | `controllers/accounts/show`, `controllers/accounts/profiles/update` |
| Order confirmation | `controllers/orders/show` |
| Component reload | `controllers/async/components/load` |
| Async platform fragments | `controllers/helpers/availabilities/index`, `controllers/helpers/delivery_options/index`, `controllers/helpers/custom_form_answers/{show,update}` |

Two names that catch people out: the cart-line delete controller is `cart_items`
(an older `line_items` key still resolves but logs a deprecation warning), and the
checkout terms controller is `checkout/steps/terms`, not `checkout/accept_terms`.

## Pattern: capture an extra field on a platform form

Extra `<input>` elements added inside a `{% form %}` block are ignored by the
platform handler, which permits only its own fields, but they still arrive in
`current_request.params`. Validate in `before`, persist in `after`.

```liquid
{%- comment -%} key: controllers/checkout/steps/terms/update {%- endcomment -%}
{% before %}
  {%- liquid
    # Reject bad input before the platform action runs, so the visitor sees the
    # form again rather than a half-applied submit.
    assign submitted = current_request.params.gift_message | default: "" | strip
    if submitted.size > 255
      redirect to: current_request.local_path, alert: "Your gift message is too long."
    endif
  -%}
{% endbefore %}

{% after %}
  {%- liquid
    assign message = current_request.params.gift_message | default: "" | strip

    # Params are HTML-escaped on read; unescape to store the visitor's own text.
    assign message = message | unescape

    # A string passed as a tag option is re-evaluated as Liquid, so strip the
    # delimiters before this value reaches `update`.
    assign message = message | replace: "{", "" | replace: "}", ""

    if message != ""
      update current_cart, field: "Gift_Message__c", value: message
    endif
  -%}
{% endafter %}
```

Requirements and caveats:

- `Gift_Message__c` needs a **read-write** Custom Data Mapping on the cart object.
  Without it the write is silently discarded.
- `{% after %}` fires whether the platform action succeeded or failed, and
  `original_response` is empty because this action redirects. If the write must
  only happen on success, key it off observable state (for example, only write
  when the value the standard action was supposed to set is now present).
- For a **custom** form (`controllers/form_submission/create`), a configured
  success page bypasses `{% after %}` altogether. Do the write in `{% final %}`
  there, and make it idempotent.
- Form field inventory is in `storeconnect-forms`.

When the extra input identifies **which** record to write to, the identifier is
untrusted and must resolve to exactly one record in a collection you already
trust. Count the matches; act only on one.

```liquid
{%- comment -%} key: controllers/carts/update {%- endcomment -%}
{% after %}
  {%- liquid
    assign requested_line = current_request.params.line_id | default: ""
    assign note = current_request.params.line_note | default: "" | strip | unescape
    assign note = note | replace: "{", "" | replace: "}", ""

    assign match_count = 0
    for item in current_cart.items
      if item.id == requested_line
        assign match_count = match_count | plus: 1
      endif
    endfor

    if match_count == 1 and note != ""
      for item in current_cart.items
        if item.id == requested_line
          update item, field: "Line_Note__c", value: note
        endif
      endfor
    endif
  -%}
{% endafter %}
```

`current_cart.items` is the trust boundary: it can only ever contain the current
session's own lines, so a forged identifier finds nothing. Never replace it with a
broader collection or a `{% query %}` that is not scoped to the current customer
and store.

## Pattern: gate access with a redirect

A cheap path-prefix gate belongs in `before`, where it cancels the render
entirely:

```liquid
{%- comment -%} key: controllers/theme {%- endcomment -%}
{% before %}
  {%- liquid
    assign path = current_request.local_path
    assign gated = false
    if path contains "/members"
      assign gated = true
    endif

    if gated and current_customer == blank
      redirect to: current_store.login_path, alert: "Please sign in to view this page."
    endif
  -%}
{% endbefore %}
```

A gate driven by a field on the record needs `after`, because the record is not
resolved yet in `before`. `{% redirect %}` still works there; the rendered body is
discarded rather than sent.

```liquid
{%- comment -%} key: controllers/pages/show {%- endcomment -%}
{% after %}
  {%- liquid
    assign members_only = current_page.data.Members_Only__c | default: false
    if members_only and current_customer == blank
      redirect to: current_store.login_path, alert: "Please sign in to view this page."
    endif
  -%}
{% endafter %}
```

Notes:

- Do not record a return path. The platform already remembers the last visited
  storefront page for an unauthenticated GET and returns there after sign-in.
- `controllers/pages/show` does not cover the home page; add
  `controllers/pages/home` if it needs the same gate.
- A gate is not a substitute for record-level security. If the content must never
  be retrievable by the wrong customer, enforce that in Salesforce
  (`storeconnect-apex-integration`), not in a template.
- Do not cache gated or customer-specific output. Keep it outside every `{% cache %}` block.

## Pattern: inject data for the render

Compute once in `before`, consume in the page. This keeps the page template free
of request-shaped logic and gives you one place to validate.

```liquid
{%- comment -%} key: controllers/products/index {%- endcomment -%}
{% before %}
  {%- liquid
    # Normalize a request-supplied sort to an allowed value. Never pass the raw
    # parameter through.
    assign requested = current_request.params.sort | default: ""
    assign allowed = ["newest", "price_asc", "price_desc"]
    assign sort_mode = "newest"
    if allowed contains requested
      assign sort_mode = requested
    endif

    new Map view
    assign view = view | set_key: "sort_mode", sort_mode
    assign view = view | set_key: "compact", false

    variables listing_view: view
  -%}
{% endbefore %}
```

In `pages/products.liquid`:

```liquid
{% if listing_view.sort_mode == "price_asc" %}…{% endif %}
```

Use `{% params %}` instead of `{% variables %}` when a platform template already
reads that name from `current_request.params`. Use `{% variables %}` for anything
new.

## Pattern: call an external service with failure handling

`{% api %}` inside `before` or `after` can block the response. Use it synchronously
only when the page genuinely cannot render without the answer, and only against
an approved integration with an availability budget and fallback.

```liquid
{%- comment -%} key: controllers/checkout/steps/shipping/show {%- endcomment -%}
{% before %}
  {%- liquid
    # Define the result first so the template still works when the call fails.
    assign quote_status = "unavailable"
    assign quote_amount = 0

    new Map body
    assign body = body | set_key: "postal_code", current_cart.shipping_address.postal_code
    assign body = body | set_key: "item_count", current_cart.item_count

    api url: "https://rates.example.com/v1/quote", method: "post", data: body
      if response.status >= 200 and response.status < 300
        assign quote_status = "ok"
        assign quote_amount = response.body.amount | default: 0
      else
        debug quote_error_status: response.status
      endif
    endapi

    variables quote_status: quote_status
    variables quote_amount: quote_amount
  -%}
{% endbefore %}
```

Rules this example follows, all of which matter:

- The result variables are assigned **before** the block, so a failed call
  degrades instead of leaving an undefined variable. An undefined variable is a
  Liquid error, and a Liquid error discards the whole controller's params,
  variables, and responder.
- Success is decided by `response.status`, never assumed.
- The payload carries the minimum needed and no identifiers or credentials.
- The URL is a literal, not built from request data.
- No secret appears anywhere. If the endpoint needs authentication, front it with
  a trusted proxy or move the call to Salesforce with a Named Credential.
- The page template caches the *rendered result*, not this block. Wrapping
  `{% api %}` in `{% cache %}` inside a controller means the block body is skipped
  on a cache hit and nothing happens at all.

For fire-and-forget work such as an analytics ping, use `final`, where the call is
forced async and cannot delay or alter the response:

```liquid
{% final %}
  {%- liquid
    new Map payload
    assign payload = payload | set_key: "event", "page_view"
    assign payload = payload | set_key: "source", "storefront"
    api url: "https://events.example.com/collect", method: "post", data: payload
    endapi
  -%}
{% endfinal %}
```

Send only what an approved integration needs, with any required consent. Do not
transmit request paths, customer or record identifiers, cart contents, or payment
details.

## Pattern: return a non-HTML body from a registered route

`{% respond %}` replaces the response for a route that is already registered. It
does not create a route.

```liquid
{%- comment -%} key: controllers/carts/show {%- endcomment -%}
{% after %}
  {%- liquid
    new Map summary
    assign summary = summary | set_key: "item_count", current_cart.item_count
    assign summary = summary | set_key: "total", current_cart.total_payable
    assign body = summary | json

    header name: "Content-Type", value: "application/json"
    respond body: body, layout: false
  -%}
{% endafter %}
```

- `layout: false` is required, or the JSON is wrapped in the theme layout.
- `body:` is emitted unescaped. Build it only from trusted, serialized data.
- A client that sends `Accept: application/json` gets the body wrapped again as
  `{"html": "…"}`. Either have the client request HTML and parse the body, or use
  the platform's built-in JSON response instead — see `storeconnect-components`.
- `status:` does not take effect on the respond branch, so this cannot return a
  real error code. If a caller needs proper status codes, this is the wrong tool.

## Pattern: add a virtual route

`controllers/pages/not_found` runs for any URL the platform does not match, so it
can serve a small set of extra paths without Apex. Keep it tightly bounded: this
runs for every 404, including bot traffic and mistyped URLs.

Keep it read-only. These paths have no CSRF protection, and the template cannot
see the HTTP method, so a state-changing operation here is reachable by a link or
a prefetch.

```liquid
{%- comment -%} key: controllers/pages/not_found {%- endcomment -%}
{% before %}
  {%- liquid
    assign parts = current_request.local_path | split: "/"

    if parts[0] == "cart-line" and parts[2] == "summary"
      # parts[1] is untrusted. Resolve it against a trusted collection and
      # require exactly one match before using it.
      assign requested = parts[1] | default: ""
      assign match_count = 0
      new Map found
      for item in current_cart.items
        if item.id == requested
          assign match_count = match_count | plus: 1
          assign found = found | set_key: "name", item.name
          assign found = found | set_key: "quantity", item.quantity
        endif
      endfor

      if match_count == 1
        assign body = found | json
      else
        assign body = '{"error":"not_found"}'
      endif

      header name: "Content-Type", value: "application/json"
      respond body: body, layout: false
    endif
  -%}
{% endbefore %}
```

- Fall through silently for anything you do not recognize so the normal 404 page
  still renders.
- Every path segment is untrusted input. The single-match loop above is the
  minimum discipline; a bare lookup on `parts[1]` is not acceptable.
- Scoping to `current_cart.items` is what makes this safe: the data can only ever
  be the current session's own. Never widen the collection you match against.
- If the requirement is a real URL space with real status codes, real HTTP
  methods, and record-level authorization, use `storeconnect-apex-integration`
  instead.

## Pattern: keep the global controller cheap

`controllers/theme` runs on every request, including component reloads. Establish
the cheapest possible exit first.

```liquid
{%- comment -%} key: controllers/theme {%- endcomment -%}
{% before %}
  {%- liquid
    # Test the cheapest condition first and do nothing at all otherwise. There is
    # no early return in Liquid, so guard with a single enclosing condition
    # rather than a chain of separate ifs.
    assign path = current_request.local_path

    if path contains "/checkout"
      # …narrow work here: a query, a cart action, an external call…
      variables checkout_banner: "Free delivery over the threshold"
    endif
  -%}
{% endbefore %}
```

If the global controller needs a query or an external call, that cost lands on
every page of the store. Move it to the specific route's controller instead.

## Common silent failures

These patterns can fail without an operator-visible error.

| Mistake | What happens |
|---|---|
| `{% session %}` / `{% params %}` / `{% action %}` at the top level of the file, outside any phase block | Runs in all three phases: three writes per request |
| `{% action "cart.add", product_id: id %}` | Wrong option name. The action needs `product_identifier:`. Nothing is added, nothing is logged as an error. |
| `{% respond body: x, status: 200 %}` relied on for the status code | `status:` is ignored on the respond branch |
| A Store Variable credential rendered, logged, or compared in customer-facing output | The value is exposed through the theme surface. Use it only through the documented server-side integration option and never emit it. |
| A request parameter written straight to a session variable or a custom field | Unvalidated input, and a string option value is re-evaluated as Liquid |
| An `{% action %}` inside nested `for` loops | One write per iteration pair, on every matching request |
| `{% debug %}` left in a shipped template | Console noise, and a leak risk if the values are not trivial |
