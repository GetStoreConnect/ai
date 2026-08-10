# StoreConnect Liquid performance

The cost model of drops, collections, and renders, and the fix for each class of cost. Read
this after measuring (see [diagnosis.md](diagnosis.md)), not before: the cost classes below are
only distinguishable by measurement, and the wrong fix makes the page slower.

## Contents

- [Cost model](#cost-model)
- [Collections: size, any, and pagination](#collections-size-any-and-pagination)
- [Fix by cost class](#fix-by-cost-class)
- [Hoist repeated work out of a loop](#hoist-repeated-work-out-of-a-loop)
- [Build a lookup index with a Map](#build-a-lookup-index-with-a-map)
- [Maps and Lists reference](#maps-and-lists-reference)
- [Push a calculation into the query](#push-a-calculation-into-the-query)
- [Expensive but not cacheable](#expensive-but-not-cacheable)
- [Render and template cost](#render-and-template-cost)
- [Asset weight](#asset-weight)
- [Liquid on a per-item hot path](#liquid-on-a-per-item-hot-path)
- [Client-side cost](#client-side-cost)
- [Anti-patterns](#anti-patterns)

## Cost model

| Operation | Cost | Notes |
|---|---|---|
| A drop attribute already in scope | Computed once per drop instance per render | Attributes are memoized on the instance, so reading the same attribute repeatedly is free. A new instance memoizes separately. |
| A drop relationship (`product.brand`, `item.product`) | One lookup, then memoized | Cheap once, expensive multiplied by a loop. |
| `{% query %}` | One round trip per tag, the whole matching set, every column, all instantiated | No `limit`, no projection. Narrow with conditions. |
| Iterating a paginated collection inside `{% paginate %}` | One page query plus a count query | The efficient shape. |
| `.size` on a paginated collection | One count query | Cheap and correct. |
| `.size` on a plain collection or query result | Loads and builds every row | There is no cheap count. |
| `\| depaginate` | One query returning every row | Fine for an inherently small set, catastrophic on a catalog. |
| `\| paginate: N` | First page only | The bounded alternative to `depaginate`. |
| `{% for … limit: N %}` | Limits rendering, not fetching | On a paginated collection it renders nothing at all. |
| `{% render %}` | A nested template render. Parsing is reused within a request, so a snippet rendered 50 times is parsed once, but the parse recurs on every request | The unit to cache, because a cache hit skips the whole nested render. |
| `{% cache %}` hit | Skips the entire body | Nothing inside runs. See [caching.md](caching.md). |
| `{% component %}` | A full nested render, plus a token per render | Never cacheable. Use `defer:`/`lazy:` instead. |
| `{% include %}` | **Unusable.** Prints `Liquid error: This liquid context does not allow includes.` into the page | Always `{% render %}`. |

## Collections: size, any, and pagination

Two collection kinds behave differently, and the difference is not visible from the template.
Paginated collections include `all_products`, `all_pages`, `all_articles`, a category's
`products`, `product.variants`, a price book's entries, and the typed collections under
`current_search.results`. Everything else, including every `{% query %}` result, is a plain
collection.

| | Paginated collection | Plain collection / query result |
|---|---|---|
| `{% for %}` without `{% paginate %}` | Renders **nothing** | Renders everything |
| `.size` | Count query, correct and cheap | Loads and builds the whole set |
| `.any?` | **Always false** outside `{% paginate %}` | Correct, but loads the whole set |
| Correct emptiness test | `{% if collection.size > 0 %}` | Either, but `.size` is no worse |

The one exception is `product.variants`, which provides a real existence check, so
`product.variants.any?` is both correct and cheap.

```liquid
{%- comment -%} WRONG: always false, so the block never renders {%- endcomment -%}
{%- if current_product_category.products.any? -%}…{%- endif -%}

{%- comment -%} RIGHT: a count query {%- endcomment -%}
{%- if current_product_category.products.size > 0 -%}
  {% paginate current_product_category.products by 24 %}
    {% for product in current_product_category.products %}…{% endfor %}
    {% render "shared/pagination-nav", paginate: paginate %}
  {% endpaginate %}
{%- endif -%}
```

Inside `{% paginate %}`, `collection.size` still reports the **total**, not the page size. Use
`paginate.page_size` and `paginate.current_page` for page facts.

When you genuinely need every row of a paginated collection, size the page to the total rather
than reaching for `depaginate`, and only where the set is bounded by nature:

```liquid
{%- paginate all_article_categories by all_article_categories.size %}
  {% for category in all_article_categories %}…{% endfor %}
{%- endpaginate %}
```

## Fix by cost class

| What the measurement showed | Fix | Where |
|---|---|---|
| One entry repeated once per row | Hoist the work, or build an index | [Hoist repeated work](#hoist-repeated-work-out-of-a-loop) |
| A `{% query %}` inside a loop | One scoped query for the whole set | `storeconnect-liquid`, `references/query-tag.md` |
| A single huge data load | Paginate, or narrow the conditions | [Collections](#collections-size-any-and-pagination) |
| Distance or geo filtering done in Liquid | A `distance` struct in the query | [Push a calculation into the query](#push-a-calculation-into-the-query) |
| One slow region, output not shareable | A deferred component | [Expensive but not cacheable](#expensive-but-not-cacheable) |
| One slow region, output identical for many visitors | `{% cache %}` with a correct key | [caching.md](caching.md) |
| High parse duration, no slow data | Split the template | [Render and template cost](#render-and-template-cost) |
| Server fast, page still feels slow | Asset and client-side work | [Asset weight](#asset-weight), [Client-side cost](#client-side-cost) |

## Hoist repeated work out of a loop

The shape of the bug is always the same: something that does not depend on the loop variable is
evaluated once per iteration.

```liquid
{%- comment -%} WRONG: the mapped store field is read once per row, and the whole
    query result is counted once per row {%- endcomment -%}
{%- for item in current_cart.items -%}
  {%- if item.product.brand.name == current_store.data.featured_brand -%}
    Featured, {{ promotions.size }} offers
  {%- endif -%}
{%- endfor -%}

{%- comment -%} RIGHT: resolve both invariants once, before the loop {%- endcomment -%}
{%- assign featured_brand = current_store.data.featured_brand -%}
{%- assign promotion_count = promotions.size -%}
{%- for item in current_cart.items -%}
  {%- if item.product.brand.name == featured_brand -%}
    Featured, {{ promotion_count }} offers
  {%- endif -%}
{%- endfor -%}
```

(`current_store.data.<field>` reads a mapped custom field, so the name in the example is
whatever the store's Custom Data Mapping defines.)

Also hoist: `{% query %}` calls, `| depaginate`, `.size` on a plain collection, translation
lookups with a computed key, and anything that renders a record field.

`{% require %}` is the exception that needs no hoisting: repeated requires of the same resource
collapse to one automatically, so putting it inside the card snippet that needs the script is
correct even though the snippet renders many times.

## Build a lookup index with a Map

When a loop needs to match rows against another set, a Map turns a nested scan into a direct
lookup. This is the Liquid analogue of a batched lookup, and it is the main reason to reach for
Map and List at all.

```liquid
{%- comment -%} WRONG: a nested scan, rows × entries comparisons {%- endcomment -%}
{%- for row in rows -%}
  {%- for entry in entries -%}
    {%- if entry.code == row.code -%}{{ entry.label }}{%- endif -%}
  {%- endfor -%}
{%- endfor -%}

{%- comment -%} RIGHT: index once, then look up {%- endcomment -%}
{%- new Map labels_by_code -%}
{%- for entry in entries -%}
  {%- assign labels_by_code = labels_by_code | set_key: entry.code, entry.label -%}
{%- endfor -%}

{%- for row in rows -%}
  {%- assign label = labels_by_code[row.code] -%}
  {%- if label != blank -%}{{ label }}{%- endif -%}
{%- endfor -%}
```

Notes that matter in practice:

- A missing key returns nothing rather than raising, so guard with `!= blank` when absence is
  meaningful.
- Keys are strings and are case-sensitive. Normalize with `| downcase` on both sides if the
  source casing is unreliable.
- **The `assign` around `set_key` is required, not decoration.** Reading a Map created by
  `{% new Map %}` yields a fresh copy each time, so `{{ my_map | set_key: "a", 1 }}` on its own
  is discarded and the key never appears. Once the result has been assigned back, later
  `set_key` calls operate on the same object.
- A List behaves differently: `push` and `unshift` mutate the underlying list. Assign anyway for
  consistency, and never mutate a list you are currently iterating.
- `{% assign %}` writes to the outermost scope, so a Map built inside a `{% for %}` loop is
  still available after the loop. That is what makes the index pattern above work.

## Maps and Lists reference

Creation:

```liquid
{%- new Map settings -%}                         {%- comment -%} empty {%- endcomment -%}
{%- new Map settings = '{"mode":"grid"}' -%}     {%- comment -%} from JSON {%- endcomment -%}
{%- new List codes -%}
{%- new List codes = '["a","b"]' -%}
{%- new UUID request_ref -%}
{%- new Rand dice, min: 1, max: 6 -%}
```

Invalid JSON is swallowed and yields an empty Map or List, so a typo looks like missing data
rather than an error.

| Filter | Applies to | Result |
|---|---|---|
| `set_key: key, value` | Map | Sets or replaces a key |
| `unset_key: key[, key2]` | Map | Removes keys |
| `merge: other_map` | Map | Second map's values win |
| `keys` | Map | List of keys |
| `collect_keys: "a"[, "b"]` | List of Maps | The named keys from each entry |
| `push: value` / `unshift: value` | List | Append / prepend |
| `contains: value` | List | Boolean |
| `pluck: "field"` | List of objects | The field from each entry |
| `group_by: "field"` | List of objects | Groups with `.name` and `.items` |
| `intersection:`, `union:`, `difference:` | Two Lists | Set operations |
| `json` (alias `serialize`) | Either | JSON string |

A Map renders as its JSON when printed directly, which makes `{{ my_map }}` a tempting debug
shortcut. Do not use it on anything built from customer, cart, or request data, and never emit
a serialized Map into markup unless every key in it is intended to be public.

## Push a calculation into the query

Distance filtering and sorting is the one calculation the query tag can do in the database. Do
that instead of loading a set and measuring in Liquid.

```liquid
{%- assign latitude = current_request.geolocation_latitude -%}
{%- assign longitude = current_request.geolocation_longitude -%}
{%- struct origin = "distance",
    lat_field: "s_c__geolocation__latitude__s",
    lng_field: "s_c__geolocation__longitude__s",
    lat_value: latitude,
    lng_value: longitude,
    units: "km",
    lte: 50 -%}
```

`distance` is currently the only registered struct type, and the alias you assign the struct to
in the query becomes a sortable, printable field on each row. Full syntax, the store-scope
requirement, and the field list: the `storeconnect-liquid` skill,
`references/query-tag.md`.

## Expensive but not cacheable

Personalized, session-dependent, or externally sourced regions cannot be cached, but they can
be moved off the critical path with a component:

- `defer: true` renders a placeholder and loads itself immediately after the page registers it.
  Use it for a slow region that every visitor needs: shipping rates, recommendations, live
  stock.
- `lazy: true` renders nothing until a reload event fires, and **requires** a `reload:` list.
  Use it for content revealed on demand.

Neither is in the first paint and neither is indexed, so never defer primary content, headings,
prices, or links. Mechanics, the event catalog, and the failure table: the
`storeconnect-components` skill, `references/component-reload.md`.

## Render and template cost

- Parsing is cached for the duration of a request only, so a large template pays its parse cost
  on every request. That is what the Parsed entries ranking measures. The fix is to split the
  template so the expensive parts are snippets rendered conditionally; splitting a template that
  always renders in full buys nothing.
- Because parsing is reused within a request, only the first render of a repeated snippet
  reports a parse duration. Later renders of the same snippet showing none is expected, not a
  reporting gap.
- `{% render %}` has an isolated scope. Pass exactly what the snippet needs; passing a whole
  collection so the snippet can pick one row from it does the work at both ends.
- Wrap the snippet, not the pieces inside it, when caching. One cached snippet skips its own
  nested renders too.

## Asset weight

- Put `{% require %}` inside the snippet that needs the script, and inside the conditional that
  decides whether that UI renders. Pages that do not use the feature then never request it.
  Duplicate requires collapse automatically, so this is safe inside loops.
- `{% require %}` emits its tag where it appears; nothing is hoisted into `<head>`. Requiring a
  blocking script in the middle of the body delays everything after it. Any option other than
  `multiple:` becomes an attribute on the emitted tag, so
  `{% require "scripts/cards.js", defer: true %}` renders a deferred script. Use it for
  behavior that does not need to run before paint.
- Prefer a page-specific pack over adding to the global bundle for a feature that only one
  template uses.
- Inline a small SVG rather than requesting an image for it: no extra request, it inherits
  `currentColor`, and it survives a strict content policy.
- Size and lazy-load images: eager-load only what is above the fold.

Pipeline mechanics, pack creation, and the manifest: the `storeconnect-theme-development`
skill, `references/assets-and-build.md`.

## Liquid on a per-item hot path

Some Liquid runs far more often than a template does. Treat these as hot paths and keep them to
arithmetic and comparisons on values already in scope:

| Surface | How often it runs |
|---|---|
| Dynamic discount and dynamic promotion fields | Once per cart item, on every cart evaluation |
| Liquid controller `before` phase | Every request to the matched route, before the page renders |
| Content-block and record fields rendered in a loop | Once per iteration |

Never put a `{% query %}`, a `| depaginate`, or a `.size` on a plain collection in one of these.
In a discount field an error is also swallowed and the result becomes `0`, so the cost arrives
as a silent wrong answer rather than an error.

## Client-side cost

Treat repeated client-side work as multiplied cost and stay inside documented
theme or component extension points.

- Run optional behavior only on pages that need it.
- Combine repeated lookups and updates where the public component contract
  supports doing so.
- Ignore stale results when a newer visitor action supersedes them.
- Keep reference data separate from prices, availability, carts, customers,
  payments, permissions, and other volatile or sensitive state.
- Prefer component reloads and supported lifecycle hooks over watching or
  patching application-wide page structure.
- Keep diagnostics disabled by default, sanitized, and free of customer,
  transaction, payment, credential, and authorization data.
- Test with representative row counts, repeated component updates, slow
  responses, navigation, and connection failure.

Do not publish selector maps, observer recipes, storage names, or application
lifecycle details as an integration contract. If the current StoreConnect
documentation does not provide a supported hook, request one rather than
reverse-engineering it.

## Anti-patterns

| Do not | Because |
|---|---|
| Add `{% cache %}` before measuring | You cannot tell whether it helped, and a wrong key is a correctness bug |
| Cache a page that is slow from a query in a loop | The cost simply moves to the next miss |
| Use `{% for … limit: N %}` as a performance fix | It limits rendering, not fetching, and renders nothing on a paginated collection |
| Use `.any?` on a paginated collection | Always false outside `{% paginate %}` |
| Reach for `\| depaginate` to make a collection filterable | It fetches every row; narrow the source instead |
| Micro-optimize filters and whitespace | Filter timings are already reported; if they are not in the top entries, they are not the problem |
| Defer or lazy-load primary content | Not in the first paint, not indexed |
| Leave `{% timer %}` in a published template | It deletes the content it wraps for every visitor without a Console session |
