# Liquid Tags Reference

Liquid tags available in StoreConnect templates — standard Liquid control-flow tags plus StoreConnect-registered tags.

Templates render with strict parsing, strict variables and strict filters. A malformed tag is a **parse** error, which discards the whole template's output rather than just that tag. A render-time error in most tags prints `Liquid error (line N): <message>` **into the page**. See [runtime-gotchas.md](runtime-gotchas.md).

## Table of Contents

- [Control Flow](#control-flow)
- [Iteration](#iteration)
- [Variable](#variable)
- [Template](#template)
- [Data & Integration](#data--integration)
- [State Management](#state-management)
- [Development](#development)
- [Liquid Controller System](#liquid-controller-system)

---

## Control Flow

### `if` / `elsif` / `else`

Executes a block if a condition is true.

```liquid
{% if product.can_add_to_cart? %}
  <p>In stock</p>
{% elsif product.on_backorder? %}
  <p>Available on backorder</p>
{% else %}
  <p>Out of stock</p>
{% endif %}
```

**Comparison operators:** `==`, `!=`, `>`, `<`, `>=`, `<=`, `contains`
**Logical operators:** `and`, `or`

```liquid
{% if product.can_add_to_cart? and product.pricing.price < 100 %}
  <p>Affordable and in stock</p>
{% endif %}

{% if product.tags contains "sale" %}
  <span class="badge">Sale</span>
{% endif %}
```

### `unless`

Executes a block if a condition is **false** (inverse of `if`).

```liquid
{% unless product.can_add_to_cart? %}
  <p>Sold out</p>
{% endunless %}
```

Does not support `elsif`.

### `case` / `when`

Switch statement for matching values.

```liquid
{% case current_checkout_step %}
{% when "customer_information" %}
  {% render "checkout/customer_information" %}
{% when "shipping_information" %}
  {% render "checkout/shipping_information" %}
{% else %}
  {% render "checkout/default" %}
{% endcase %}
```

Multiple values: `{% when "Monday", "Tuesday", "Wednesday" %}`

---

## Iteration

### `for`

Iterates over a collection.

```liquid
{% for product in all_products %}
  <p>{{ product.name }}</p>
{% endfor %}
```

**Parameters:**
- `limit` - Max iterations: `{% for item in items limit: 5 %}`
- `offset` - Skip items: `{% for item in items offset: 3 %}`
- `reversed` - Reverse order: `{% for item in items reversed %}`

**Range:** `{% for i in (1..10) %}{{ i }}{% endfor %}`

**`forloop` object:**

| Property | Description |
|----------|-------------|
| `forloop.index` | Current iteration (1-based) |
| `forloop.index0` | Current iteration (0-based) |
| `forloop.rindex` | Remaining iterations (1-based) |
| `forloop.rindex0` | Remaining iterations (0-based) |
| `forloop.first` | True on first iteration |
| `forloop.last` | True on last iteration |
| `forloop.length` | Total number of iterations |
| `forloop.parentloop` | The enclosing `forloop` when nested |

> `limit:` controls **rendering**, not fetching. On a paginated collection (any `all_*` global, `current_search.results.*`) a bare `for` loop renders **nothing at all** — wrap it in `{% paginate %}` or use the `paginate` filter. See [runtime-gotchas.md](runtime-gotchas.md).

### `else` in `for` (empty)

```liquid
{% for product in collection %}
  {{ product.name }}
{% else %}
  <p>No products found</p>
{% endfor %}
```

### `break` / `continue`

```liquid
{% for item in items %}
  {% if item.hidden %}{% continue %}{% endif %}
  {% if forloop.index > 10 %}{% break %}{% endif %}
  {{ item.name }}
{% endfor %}
```

### `tablerow`

Generates HTML table rows.

```liquid
<table>
  {% tablerow product in products cols: 3 %}
    {{ product.name }}
  {% endtablerow %}
</table>
```

Parameters: `cols`, `limit`, `offset`, `range`. Inside the block a `tablerowloop` object mirrors `forloop`.

---

## Variable

### `assign`

Assigns a value to a variable.

```liquid
{% assign my_variable = "Hello" %}
{% assign product_count = all_products.size %}
{% assign is_sale = product.pricing.on_sale? %}
```

### `capture`

Captures rendered content into a variable.

```liquid
{% capture full_name %}{{ customer.first_name }} {{ customer.last_name }}{% endcapture %}
<p>Welcome, {{ full_name }}</p>
```

### `increment` / `decrement`

Creates and increments/decrements a counter. `increment` outputs the value **before** adding one; `decrement` subtracts first, then outputs.

```liquid
{% increment counter %}  {%- comment -%} 0 {%- endcomment -%}
{% increment counter %}  {%- comment -%} 1 {%- endcomment -%}
{% increment counter %}  {%- comment -%} 2, counter is now 3 {%- endcomment -%}

{% decrement counter %}  {%- comment -%} 2 {%- endcomment -%}
{% decrement counter %}  {%- comment -%} 1 {%- endcomment -%}
```

Both tags share one counter per name, and it is separate from any `{% assign %}` variable of the same name. A `decrement` on a name that was never incremented starts at `-1`.

### `default`

Sets default values for variables if they don't exist. Used at the top of snippets to define parameter defaults.

```liquid
{% default title: "Untitled", show_price: true, max_items: 10 %}
```

Only sets the variable if it doesn't already exist. Does not override passed values.

### `new`

Creates new objects.

**UUID:**
```liquid
{% new UUID my_id %}
{{ my_id }}  {%- comment -%} e.g., 550e8400-e29b-41d4-a716-446655440000 {%- endcomment -%}
```

**List (empty or with initial values):**
```liquid
{% new List my_list %}
{% new List my_list = "[1,2,3]" %}
```

**Map (empty or with initial values):**
```liquid
{% new Map my_map %}
{% new Map config = '{"theme":"dark"}' %}
{{ config.theme }}
```

The empty form (`{% new Map my_map %}` / `{% new List my_list %}`) is the most common pattern — build up the object with filters afterward. Invalid JSON given to `new List`/`new Map` silently yields an empty list/map. Full Map/List recipes: the `storeconnect-debug-performance` skill.

**Random number:**
```liquid
{% new Rand dice, min: 1, max: 6 %}
{{ dice }}
```

`min` defaults to 0, `max` to 100; the range is inclusive.

Only `UUID`, `List`, `Map` and `Rand` exist. Any other type raises `Liquid::SyntaxError: unknown object type <name>` — a parse-level failure that blanks the template.

### `struct`

Creates a validated structured object. The `=` is mandatory and the type name may use single or double quotes.

```liquid
{% struct my_obj = "struct_name", key: "value", count: 42 %}
```

Keys are lowercased, so key lookups are case-insensitive. The tag itself renders nothing. A type that is not registered, or a value that fails the struct's validation, raises `Liquid syntax error: Invalid Struct '<type>': …`. The only struct currently used by theme code is `distance` — see [query-tag.md](query-tag.md).

---

## Template

### `comment`

Prevents content from being rendered.

```liquid
{% comment %}
  This won't be output
{% endcomment %}

{%- comment -%} Inline comment {%- endcomment -%}
```

Also supports inline form: `{%# This is a comment %}`

### `raw`

Temporarily disables Liquid processing.

```liquid
{% raw %}
  {{ this will not be processed }}
{% endraw %}
```

### `render`

Renders a snippet/partial template.

```liquid
{% render "header" %}
{% render "products/card", product: product, show_price: true %}
```

Variables are passed as named parameters. The **caller's local assigns are not inherited** — pass everything the snippet needs. Globals (`current_store`, `current_cart`, every `current_*` and `all_*`) and any controller-set variables *are* still available inside the snippet.

Declare defaults at the top of every snippet with `{% default %}` so a forgotten parameter is visible rather than blank.

`{% include %}` is registered by Liquid but always fails with `This liquid context does not allow includes.` Use `{% render %}`.

### `layout`

Wraps this template's output in an **additional inner** layout.

```liquid
{% layout "account" %}
```

The outer `layouts/theme` (doctype, `<head>`, `csrf_meta_tags`) is always rendered. `{% layout %}` does not replace it — `layouts/account.liquid` and friends are fragments containing `{{ yield }}`. Omitting the tag means no inner layout, not "no layout".

### `require`

Loads a compiled theme resource and emits the matching tag. Repeat requires of the same path collapse to one.

```liquid
{% require "styles/theme.css" %}
{% require "scripts/theme.js" %}
{% require "scripts/product-variants.js" %}
```

**Parameters:**
- First arg: the resource path from the current theme build
- `multiple: true` — bypass the duplicate check and emit the tag again
- Any other named option is passed to the resource wrapper template as `options`

The extension chooses the wrapper: `.css` produces a stylesheet link, `.js` a script tag, anything else produces no wrapper at all.

Put `{% require %}` inside the snippet that needs the script, and inside the conditional that decides whether that UI renders, so pages that do not use it never load it:

```liquid
{% if product.variants.size > 0 %}
  {% require "scripts/product-variants.js" %}
  …
{% endif %}
```

`{% resource_path "styles/theme.css" %}` returns the resolved asset URL only — no tag markup, and no entry in the duplicate-tracking register.

### `header`

Sets an HTTP response header on the current request.

```liquid
{% header name: "X-Robots-Tag", value: "noindex" %}
```

Usable from a page, snippet or layout template. Repeated calls merge; the same name set twice takes the last value.

### `component`

Renders a reloadable component that can refresh via JavaScript events.

```liquid
{% component "cart", reload: "sc.cart-updated" %}
{% component "cart-menu", reload: "sc.cart-updated sc.voucher-applied sc.voucher-removed" %}
{% component "checkout/vouchers", reload: "sc.voucher-applied sc.voucher-removed", lazy: true %}
{% component "checkout/shipping_rates/page", defer: true %}
```

**Parameters:**
- First arg: Component template name (in `components/` directory)
- `reload` - Space-separated event names triggering reload
- `lazy` - Renders empty and fills on the **first firing of a `reload:` event**. There is no automatic fetch, so `lazy:` without `reload:` renders empty forever.
- `defer` - Renders empty and the client fetches it **automatically after page load**. Use this, not `lazy:`, for expensive content that has no triggering event (shipping rates, recommendation panels).

Additional tag parameters are initial-render inputs only; they are not resent on a reload. For state a reload needs, set minimal non-sensitive `{% context %}` values inside the component template. See `storeconnect-components`.

`defer:` is the right tool for taking slow content off the critical render path. `{% cache %}` and `defer:` solve different problems and combine well: cache the expensive fragment, defer when it is fetched.

### `form`

Renders a registered StoreConnect form with its required fields and validation state.

```liquid
{% form "add-to-cart", product: product %}
  <label for="{{ form.fields["quantity"].id }}">Quantity</label>
  <input id="{{ form.fields["quantity"].id }}" type="number"
         name="{{ form.fields["quantity"].name }}"
         value="{{ form.fields["quantity"].value | default: 1 }}">
  <button type="submit">Add to cart</button>
{% endform %}
```

Field access is `form.fields["<name>"]`, **not** `form.<name>`. A bare `form.<name>` is not on the Drop, so under strict variables it raises and the page shows `Liquid error (line N): undefined method quantity` where the value belonged.

The `form` Drop has exactly three attributes: `fields`, `errors`, `path`. A field exposes `name`, `id`, `value`, `original_value`, `required?`, `errors` — and **no `label`**, so supply your own label text. `form.errors` is a collection of error objects, each with `field`, `messages` and `full_messages`; the field name is `"base"` for form-level errors.

`add-to-cart` accepts `product:` (a Product Drop, no lookup) or `product_id:` (does a lookup) — prefer `product:`.

Form names, per-form options and per-form fields are in the `storeconnect-forms` skill. Only a registered name works.

### `paginate`

Paginates a collection.

```liquid
{% paginate all_products by 20, window: 5 %}
  {% for product in all_products %}
    {{ product.name }}
  {% endfor %}

  {% if paginate.pages > 1 %}
    {% for part in paginate.parts %}
      {% if part.gap? %}...
      {% elsif part.current? %}<strong>{{ part.page }}</strong>
      {% else %}<a href="{{ part.url }}">{{ part.page }}</a>
      {% endif %}
    {% endfor %}
  {% endif %}
{% endpaginate %}
```

**Parameters:**
- `by <n>` - Items per page. **Positional syntax, not a keyword** — `by 20`, never `by: 20`. Required. `<n>` may be a variable.
- `as` - Query-parameter name for the page number. Defaults to `<collection_name>_page` for a Drop collection (`all_products_page`, `products_page`), and to `page` for a plain array. Set it explicitly when a page has two paginated regions.
- `window` - Page links to show on each side (default: 5)

**`paginate` drop properties:** `page_size`, `current_page`, `pages`, `records` (the total, not the page), `current_offset`, `param_name`, `window`, `next`, `previous`, `first`, `last`, `parts`

**Part properties:** `url`, `page`, `current?`, `gap?`

Always test `part.gap?` before `part.current?` — a gap part carries no page or URL, and calling `current?` on one errors. The example above does this correctly.

A page number beyond the last page is clamped to the last page rather than rendering empty. The base theme's ready-made navigation is `{% render "shared/pagination-nav", paginate: paginate %}`.

`{% paginate %}` is what makes a paginated collection produce rows at all. Without it, `{% for %}` over `all_products` or `current_search.results.products` renders nothing while `.size` still reports the true total.

### `cache`

Caches rendered HTML fragments for performance.

```liquid
{% cache "article-card", items: [article, current_store, display_mode], expires_in: 60 %}
  {% render "articles/card", article: article, display_mode: display_mode %}
{% endcache %}
```

**Parameters:**
- First arg: cache name. Required — a literal string or a variable. A blank value prints `Liquid error (line N): internal` into the page.
- `items` - Stable objects and scalars that change the public, read-only output. Accepts an array literal.
- `expires_in` - Expiry in seconds.

Cache only stable, public, read-only markup. Never cache forms, component containers, checkout or
payment content, pricing, cart or account state, consent controls, flash messages, one-time values,
or any visitor- or request-specific output. Do not try to make personalized output safe by adding
customer, cart, price-book, privacy, path, query, or other request state to `items:`. Move that
output outside the cache instead.

For a safe public fragment, include every stable record, store, locale, and display option that can
change its markup. Follow the complete authoring and verification rules in
`storeconnect-debug-performance`.

### `process_event`

Consumes one analytics event from `current_events` and exposes it inside the block. It marks the event handled, so each event fires once.

Inside the block you get `type` (the event name) and `event_data` (a Map), plus any objects the event carries — in practice `order` on a purchase event. **`event_type` and `order_number` do not exist**; under strict variables they render blank.

```liquid
{% for event in current_events %}
  {% process_event event %}
    {%- case type %}
      {%- when "purchase" %}
        <script>trackPurchase({{ event_data | json }});</script>
      {%- when "cart.add" %}
        <script>trackAddToCart({{ event_data | json }});</script>
    {%- endcase %}
  {% endprocess_event %}
{% endfor %}
```

Outside a `{% process_event %}` block, a `CustomerEvent` Drop's `type` and `event_data` both return nil. That is a deliberate gate, not a fault.

---

## Data & Integration

### `query`

Queries supported StoreConnect/Salesforce objects and stores results in a variable.

**Authoritative reference: [query-tag.md](query-tag.md).** Read it before writing a query — the store-scoping rule and the two incompatible custom-field syntaxes are there.

```liquid
{% query 'Product2' as records,
    s_c__store__c: current_store.sfid,
    isactive: true,
    data.featured__c: true
    order by 'name asc' %}

{% for record in records %}
  {% assign product = record | cast: 'Product' %}
  {% if product != blank %}{{ product.name }} - {{ product.pricing.price | money }}{% endif %}
{% endfor %}
```

**Syntax:** `{% query <object_name> as <variable> [, field: value] [order by '<field> [asc|desc]'] %}`

**Notes:**
- The object name may be quoted (single or double) or a variable. It is matched case-insensitively against the available query object name.
- Condition keys are **lowercase query field names** and the check is case-sensitive: `isactive`, not `IsActive`; `name`, not `Name`. A capitalized key raises `Invalid liquid query field`.
- Custom fields mapped onto a standard or managed object need the `data.` prefix in a condition: `data.featured__c: true`.
- Returns a collection of untyped record Drops. Use `| cast: '<DropName>'` to get the typed Drop with its relationships and helpers.
- Read a mapped field off a record with `record.custom_data.field__c` (lowercase, case-sensitive); off a typed Drop with `drop.data.field__c`.
- The `order by` clause must be quoted, or the whole template fails to parse.
- Always add the current Store condition and, for customer-owned data, the authenticated customer condition.

### `api`

Makes an HTTP request to an approved external service. Prefer a supported integration; never embed credentials or customer secrets in a theme.

```liquid
{% api url: "https://api.example.com/data", method: "get" %}
  Status: {{ response.status }}
  Data: {{ response.body.message }}
{% endapi %}
```

**Parameters:**
- `url` - Target URL from the approved integration configuration.
- `method` - HTTP method: `get`, `post`, `put`, `patch`, `delete` (default: `get`)
- `data` - Request body for POST/PUT/PATCH. Must be a variable, not an inline literal.
- `async: true` - Fire and forget. **No `response` object exists at all in async mode**, so `{{ response.status }}` inside an async block fails. The `final` controller phase forces async regardless of what you pass.

**Response object:** `response.status` (integer), `response.body` (parsed JSON; on a parse failure the raw string is wrapped as `{ "body": "…" }`), `response.headers` (Map).

Never hard-code a credential or construct authorization headers in a theme. For an authenticated
call, use only the documented Store Variable integration pattern or another supported
server-managed integration; never render or log its configuration. Keep the destination on the
project allowlist and never render response diagnostics to a customer.

**Important:** The `data` parameter must be a Map variable, not inline JSON. Build it first, either with `{% new Map %}` and `set_key`, or by deserializing a literal:

```liquid
{%- new Map post_data -%}
{%- assign post_data = post_data | set_key: "event", "catalog_view" | set_key: "source", "storefront" -%}
{% api url: "https://api.example.com/track", method: "post", data: post_data %}
  {% if response.status == 200 %}
    <p>{{ response.body.message }}</p>
  {% endif %}
{% endapi %}
```

An alternative when the payload is a fixed shape:

```liquid
{%- assign post_data = '{"event":"catalog_view","source":"storefront"}' | deserialize -%}
```

Send only fields the approved integration needs. Obtain any required consent, and do not
transmit customer email addresses, customer or record IDs, raw request paths, payment
details, or other personal data from a theme.

A synchronous `{% api %}` blocks the page render on a third party. Put it in a
`defer:`red component or the `final` controller phase rather than inline in a page.

---

## State Management

### `session`

Stores values in the visitor's session, readable on later requests.

```liquid
{% session last_viewed: product.id, preference: "compact" %}

{%- comment -%} Readable immediately and on subsequent requests: {%- endcomment -%}
{{ session_variables.last_viewed }}
{{ session_variables.preference }}
```

Writes are visible through `session_variables` in the same render. With no session (some
non-browser render contexts) the tag is a silent no-op. Never store a credential, a payment
value, or anything you would not accept back from the client in a session variable.

### `context`

Persists variables for a component across its reloads.

```liquid
{% context product_id: current_product.id, show_details: true %}
{{ context.product_id }}
```

Only works inside a `components/` template. Anywhere else it prints
`Liquid error (line N): Context tag can only be used within a component` into the page — it is
not silently ignored. Values are readable immediately through the `context` variable, do not
leak to parent or sibling components, and survive a reload.

Component context travels to and from the browser. Put only the minimum non-sensitive
identifiers there — never a customer identifier, a price you have not recalculated
server-side, a token, or anything that grants access.

---

## Development

Remove both of these before publishing.

### `debug`

Writes one line per key to the debug Console. Nothing appears in the page, which is why this
is the correct way to inspect values.

```liquid
{% debug product_id: product.id, cart_items: current_cart.items.size %}
```

Never pass a whole customer, cart, request-parameter set, payment value, or authorization
value — even to the Console.

### `timer`

Measures execution time of a template block and reports it to the Console. Use it to locate a
slow region rather than guessing.

```liquid
{% timer "product_list_render" %}
  {% for product in products %}
    {% render "products/card", product: product %}
  {% endfor %}
{% endtimer %}
```

---

## Liquid Controller System

Controller templates live at `controllers/<controller>/<action>` and run logic in three
phases. Full coverage is in the `storeconnect-controllers` skill.

> **Every tag in this section is a silent no-op outside a controller template.** `params`,
> `variables`, `respond`, `redirect`, `update` and `action` return immediately when the
> template being rendered is not a controller template — no output, no error, nothing in the
> page. If your `{% update %}` "does nothing", check where the tag lives first.

### Phase Tags

#### `before`
Runs before page rendering. Use for data preparation, validation, and actions.

```liquid
{% before %}
  {% params product_id: current_request.params.id %}
  {% action "cart.add", product_identifier: product_id, quantity: 1 %}
{% endbefore %}
```

#### `after`
Runs after the main controller action. Use for redirects and responses.

```liquid
{% after %}
  {% redirect to: current_store.cart_path %}
{% endafter %}
```

#### `final`
Runs after the response. Use it for non-blocking post-render work only.

```liquid
{% final %}
  {%- new Map payload -%}
  {%- assign payload = payload | set_key: "event", "purchase" -%}
  {% api url: "https://analytics.example.com/track", method: "post", data: payload %}{% endapi %}
{% endfinal %}
```

`{% respond %}` and `{% redirect %}` in `final` are hard no-ops — the response has already been
built. `{% api %}` is forced to async here, so no `response` object exists inside the block.

### Action Tags (inside phases)

#### `params`
Sets controller parameters consumed by the standard action.
```liquid
{% params product_id: current_request.params.id, quantity: 1 %}
```
Validate anything sourced from `current_request.params` before you pass it on.

#### `variables`
Sets variables that become available as top-level names in every subsequent template render for this request, including snippets.
```liquid
{% variables page_title: "Products", show_sidebar: true %}
```

#### `respond`
Sends a response body and stops normal page rendering.
```liquid
{%- new Map result -%}
{%- assign result = result | set_key: "success", true -%}
{%- assign response_body = result | json -%}
{% respond body: response_body, status: 200, layout: false %}
```
Options: `body:`, `status:` (default 302), `layout:` (default true), `notice:`, `alert:`,
`data:`, `to:`. Pre-serialize structured output with `| json`.

#### `redirect`
Redirects and stops further controller execution — a redirect in `before` skips the standard action, `after` and `final`. A `respond` skips only the phases after it.
```liquid
{% redirect to: current_store.cart_path %}
{% redirect to: current_store.cart_path, notice: "Item added" %}
```
Options: `to:`, `notice:`, `alert:`, `status:`, `data:`. Build `to:` from a Store path Drop, not
a hard-coded root-relative URL, or the redirect breaks on a store hosted under a path. Never
redirect to a raw request-supplied URL.

#### `update`
Writes one Custom Data Mapping field on a Drop.
```liquid
{%- assign new_count = current_product.data.view_count__c | default: 0 | plus: 1 -%}
{% update current_product, field: "view_count__c", value: new_count %}
```
Four preconditions, each of which fails silently:
1. Must be inside a controller template.
2. The first argument must be a **Drop**, not a record from `{% query %}`. Use `| cast:` first.
3. The field must have a Custom Data Mapping marked editable; otherwise you get a Console
   warning only.
4. Only mapped custom fields can be written — never a standard or managed-package field.

Scope the target by Store and, for customer data, by the authenticated customer, and require
exactly one match before writing. See [runtime-gotchas.md](runtime-gotchas.md) for a worked
example.

#### `action`
Invokes a built-in controller action.
```liquid
{% action "cart.add", product_identifier: product_id, quantity: 1 %}
```
Available actions: `cart.select`, `cart.create`, `cart.clone`, `cart.add`, `cart.update`,
`cart.remove`, `cart.empty`, `shipping.set`, `pricebook.set`, `pricebook.clear`, `outlet.set`,
`outlet.clear`, `promotion.apply`, `promotion.remove`, `promotion.clear`. On `cart.update` and
`cart.remove`, use `cart_item:` — `line_item:` is deprecated.

Prefer a registered `{% form %}` for a customer-initiated commerce action; it brings
validation and error state with it. Reach for `{% action %}` when the flow is server-driven,
and validate the Store and customer context first.

---

## Whitespace Control

Add `-` to trim whitespace around tags:

```liquid
{%- assign x = "hello" -%}
{%- if true -%}Content{%- endif -%}
```
