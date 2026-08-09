# StoreConnect Liquid runtime failure modes

Read this when a template renders blank, renders the wrong thing, prints a `Liquid error`,
or is slow. Start from the symptom table, then go to the matching section.

Templates render with strict variables, strict filters, and strict parsing. That combination
decides how every mistake below surfaces, so read [How failures surface](#how-failures-surface)
first.

## Contents

- [How failures surface](#how-failures-surface)
- [Symptom table](#symptom-table)
- [Blank output, no error text](#blank-output-no-error-text)
- [Visible `Liquid error` text](#visible-liquid-error-text)
- [Whole template renders empty](#whole-template-renders-empty)
- [Plausible but wrong output](#plausible-but-wrong-output)
- [Escaping and output context](#escaping-and-output-context)
- [Writes that silently do nothing](#writes-that-silently-do-nothing)
- [Slow page](#slow-page)
- [Diagnostic order](#diagnostic-order)

## How failures surface

Three different outcomes, and knowing which one you have narrows the cause immediately.

| Error class | What the visitor sees | Where you find it |
|---|---|---|
| Undefined variable, undefined drop attribute, undefined filter | **Nothing.** The expression renders as an empty string and the rest of the page renders normally. | Debug Console session only. Raises in test environments. |
| Any other render-time error (bad `{% query %}` field, blank cache key, `{% context %}` in the wrong place) | `Liquid error (line N): <message>` printed **in the page** where the tag was. | Same text, plus the Console. |
| Parse/syntax error | **The whole template's output is empty.** Not just the bad tag. | Console; `Liquid syntax error (<template> line N): …`. |

The practical consequence: a blank value is never proof the data is missing. It is equally
likely that you named an attribute that does not exist. Confirm which before you go looking
for a data problem.

## Symptom table

| Symptom | Most likely cause | Section |
|---|---|---|
| One value renders blank, page otherwise fine | Attribute does not exist on that Drop | [Blank output](#blank-output-no-error-text) |
| `{% for %}` over a collection renders nothing but `.size` is non-zero | Paginated collection outside `{% paginate %}` | [Blank output](#blank-output-no-error-text) |
| `{% for %}` renders nothing and `.size` is also blank | `{% query %}` object name did not resolve | [Blank output](#blank-output-no-error-text) |
| `{{ cart.item_count }}` blank but `{{ current_cart.item_count }}` works | `cart` is not a global | [Blank output](#blank-output-no-error-text) |
| `Liquid error (line N): Invalid liquid query field: x` | Wrong field API name, wrong case, or no Custom Data Mapping | [Visible error](#visible-liquid-error-text) |
| `Liquid error (line N): internal` | Blank `{% cache %}` key | [Visible error](#visible-liquid-error-text) |
| Entire page or block is empty | Parse error — usually an unquoted `order by` or an unclosed tag | [Whole template empty](#whole-template-renders-empty) |
| `&amp;lt;b&amp;gt;` in the page | Double escaping | [Escaping](#escaping-and-output-context) |
| Two `<option>` tags marked `selected` | `contains` used on a single-value field | [Plausible but wrong](#plausible-but-wrong-output) |
| Flash message container always renders | `current_flash.notice` returns `""`, which is truthy | [Plausible but wrong](#plausible-but-wrong-output) |
| `{% update %}` changes nothing, no error | Not in a controller template, or target is not a Drop, or field is not writable | [Silent writes](#writes-that-silently-do-nothing) |
| Page slow, no errors | Query in a loop, `depaginate`, or a cache miss on every request | [Slow page](#slow-page) |

## Blank output, no error text

### Attribute does not exist on the Drop

Every Drop has a fixed, declared attribute list. Anything outside it renders empty.

```liquid
{%- comment -%} Broken: ImageDrop has no alt, width, or height {%- endcomment -%}
<img src="{{ product.image.url }}" alt="{{ product.image.alt }}"
     width="{{ product.image.width }}" height="{{ product.image.height }}">
{%- comment -%} → <img src="https://…" alt="" width="" height=""> {%- endcomment -%}
```

```liquid
{%- comment -%} Correct {%- endcomment -%}
<img src="{{ product.image.medium_url }}"
     alt="{{ product.image.alt_text | default: product.name }}"
     loading="lazy">
```

Look the attribute up in [drops.md](drops.md) before you write it. Frequent offenders:

| Wrong | Right |
|---|---|
| `image.alt` | `image.alt_text` |
| `article.slug`, `page.slug` | `article.identifier`, `page.identifier` |
| `article.body`, `article.summary` | `article.body_content`, `article.summary_content` |
| `cart.subtotal` | `cart.sub_total` |
| `cart_item.unit_price`, `cart_item.line_total` | `cart_item.pricing.price`, `cart_item.total_payable` |
| `order.identifier` | `order.order_number` |
| `menu.items`, `menu_item.children` | `menu.menu_items` (both levels) |
| `content_block.summary`, `content_block.media` | `content_block.summary_content`, `content_block.medium` |
| `account_credit.balance`, `account_points.balance` | `.current_balance` |
| `form_field.label` | no such attribute — supply your own label text |

Use `{{ drop | try: 'attribute' }}` only when the attribute is genuinely optional across
platform versions. `try` returns `""` for anything missing, so it also hides real typos.

### `cart` is not a global

The cart global is `current_cart`. There is no `cart` alias.

```liquid
{%- comment -%} Broken: renders nothing {%- endcomment -%}
{% if cart.item_count > 0 %}…{% endif %}

{%- comment -%} Correct {%- endcomment -%}
{% if current_cart.item_count > 0 %}…{% endif %}
```

`cart_item`, `product`, `form`, `paginate` and `content_block` are **block-local** names
supplied by a tag or a `{% render %}` parameter, not globals. Using one outside its block
renders blank.

### Paginated collection iterated without `{% paginate %}`

Every `all_*` global, `current_search.results.*`, and `account_points.transactions` is a
paginated collection. It holds **no rows** until a `{% paginate %}` tag or the `paginate`
filter fetches a page. `.size` still returns the true total, which makes this look like a
data problem when it is not.

```liquid
{%- comment -%} Broken: prints "412" then renders zero rows {%- endcomment -%}
{{ all_products.size }}
{% for product in all_products %}{{ product.name }}{% endfor %}
```

```liquid
{%- comment -%} Correct: paged list with navigation {%- endcomment -%}
{% paginate all_products by 24 %}
  {% for product in all_products %}
    {% render "products/card", product: product %}
  {% endfor %}
  {% render "shared/pagination-nav", paginate: paginate %}
{% endpaginate %}
```

```liquid
{%- comment -%} Correct: first N only, no pagination UI, one bounded fetch {%- endcomment -%}
{% assign featured = all_products | paginate: 4 %}
{% for product in featured %}
  {% render "products/card", product: product %}
{% endfor %}
```

Plain collections (`current_cart.items`, `product.categories`, `current_breadcrumbs`) iterate
normally without `{% paginate %}`.

### `{% query %}` object name did not resolve

An unknown **object** name is silent: the variable is set to nil and the loop renders nothing.
An unknown **field** name raises. So a blank query result with no error text points at the
object name, not the conditions.

```liquid
{%- comment -%} Broken: typo in the object name → records is nil, no error {%- endcomment -%}
{% query 's_c__Promotions__c' as records, s_c__store__c: current_store.sfid %}

{%- comment -%} Diagnose: this prints nothing at all when the object did not resolve,
    and prints 0 when the object resolved but nothing matched {%- endcomment -%}
{{ records.size }}
```

The object name is matched case-insensitively against the available query object name, so
`'Product2'` and `'product2'` both work. A merchant custom object resolves only when a
Custom Data Mapping exists for it.

### Action tags outside a controller template

`{% params %}`, `{% variables %}`, `{% respond %}`, `{% redirect %}`, `{% update %}` and
`{% action %}` return immediately and do nothing unless the template being rendered is a
controller template. No error, no output. See
[Writes that silently do nothing](#writes-that-silently-do-nothing).

## Visible `Liquid error` text

These print into the page, so they are visible to customers. Fix them before publishing.

| Text in the page | Cause | Fix |
|---|---|---|
| `Invalid liquid query field: Featured__c` | Condition key is not a column on the object. Condition keys are **case-sensitive** and columns are lowercase. | `featured__c: true` |
| `Invalid liquid query field: color__c` | Used a mapped custom field without the `data.` prefix on a standard/managed object, or no Custom Data Mapping exists. | `data.color__c: 'blue'`, and confirm the mapping |
| `Invalid order clause: unknown field "x"` | `order by` names something that is not a real column on the object or an alias created by the same query. | Use a real column, or the distance alias |
| `Invalid order clause segment: expected '<field name> [asc\|desc]'` | Malformed segment: `name ascending`, `end_date desc asc`, a leading comma. | `order by 'name asc'` |
| `internal` | `{% cache %}` got a blank first argument, usually an undefined variable. | Give the cache a literal name, or guard the variable |
| `Context tag can only be used within a component` | `{% context %}` used outside a `components/` template. | Move it into the component, or pass the value as a tag parameter |

`order by` cannot sort by a `data.` mapped field on a standard or managed object, and cannot
sort by a mapped field on a merchant custom object — only real columns and the distance alias
are orderable. Sort in Liquid instead, or add a real column.

## Whole template renders empty

A parse error discards the entire template's output, not just the offending tag. If a page,
block or snippet renders as nothing at all, suspect syntax before data.

```liquid
{%- comment -%} Broken: unquoted order by → syntax error → whole template blank {%- endcomment -%}
{% query 's_c__article__c' as articles order by s_c__publish_on__c desc %}

{%- comment -%} Correct: the entire order clause is one quoted string {%- endcomment -%}
{% query 's_c__article__c' as articles order by 's_c__publish_on__c desc' %}
```

Other parse-time failures: an unclosed block tag, `{% endfor %}` without `{% for %}`, an
unknown tag name, and `{% new SomeType x %}` with a type that is not `UUID`, `List`, `Map`
or `Rand`.

## Plausible but wrong output

### `""` is truthy

Several Drops return `""` rather than nil. `{% if x %}` is true for `""`, so guard with
`!= blank`.

```liquid
{%- comment -%} Broken: the container always renders {%- endcomment -%}
{% if current_flash.notice %}<div class="flash">{{ current_flash.notice }}</div>{% endif %}

{%- comment -%} Correct {%- endcomment -%}
{% if current_flash.notice != blank %}<div class="flash">{{ current_flash.notice }}</div>{% endif %}
```

`| try:` also returns `""` on a miss, so test its result with `!= blank`, never with `if`.

### `contains` on a single-value field

`contains` is a substring test on a string. Use it only for multi-value fields.

```liquid
{%- comment -%} Broken: sort value "points-low-high" also matches "low-high",
    so two options render as selected {%- endcomment -%}
{% for option in sort.options %}
  <option value="{{ option.value }}" {% if sort.value contains option.value %}selected{% endif %}>
{% endfor %}

{%- comment -%} Correct: equality for a single-value field {%- endcomment -%}
{% for option in sort.options %}
  <option value="{{ option.value }}" {% if sort.value == option.value %}selected{% endif %}>
{% endfor %}

{%- comment -%} Correct: contains for a genuinely multi-value field {%- endcomment -%}
{% for option in brands.options %}
  <input type="checkbox" name="{{ brands.name }}" value="{{ option.value }}"
         {% if brands.value contains option.value %}checked{% endif %}>
{% endfor %}
```

### `{% query %}` comparison operators only accept unsigned numbers

The numeric comparison forms match digits only. A negative bound falls through to equality
against a string, which converts to `0` and returns the wrong rows with no error.

```liquid
{%- comment -%} Broken: silently becomes "= 0" {%- endcomment -%}
{% query 'x__c' as records, balance__c: '>-100' %}

{%- comment -%} Correct: fetch a bounded set, then filter in Liquid {%- endcomment -%}
{% query 'x__c' as records, store__c: current_store.sfid %}
{% for record in records %}
  {% if record.balance__c > -100 %}…{% endif %}
{% endfor %}
```

Invalid dates and times behave the same way: `'>2026-21-02'` returns zero rows and raises
nothing. Validate any date that came from a request parameter before passing it in.

### Two different custom-field filter syntaxes

They are not interchangeable, and picking the wrong one either raises or silently misses.

| Target | Syntax | Matching |
|---|---|---|
| Mapped custom field on a standard or managed object | `data.color__c: 'blue'` | Exact, **case-sensitive**, no wildcards, no comparison operators |
| Mapped field on a merchant custom object | `color__c: 'blue'` (no `data.`) | Case-**insensitive**, supports `%` wildcards and arrays |

Direct (non-mapped) string columns on any object are case-insensitive and support `'%x%'`,
`'x%'` and `'%x'` wildcards plus arrays for an `IN` match.

### `{% render %}` has an isolated scope

Nothing from the caller is visible inside the snippet unless you pass it.

```liquid
{%- comment -%} Broken: product is nil inside the snippet {%- endcomment -%}
{% assign product = current_product %}
{% render "products/card" %}

{%- comment -%} Correct {%- endcomment -%}
{% render "products/card", product: current_product %}
```

Declare defaults at the top of every snippet so a missing parameter is obvious rather than
blank: `{% default product: nil, show_price: true %}`.

### `| sample` requires a count

```liquid
{%- comment -%} Broken: wrong number of arguments {%- endcomment -%}
{% assign pick = products | sample %}

{%- comment -%} Correct: sample returns an array {%- endcomment -%}
{% assign pick = products | sample: 1 | first %}
```

## Escaping and output context

Values read **through a Drop or hash lookup** are HTML-escaped automatically. Values held in
a plain local variable are **not**.

```liquid
{%- comment -%} Already escaped once — safe {%- endcomment -%}
<p>{{ current_search.term }}</p>
<input value="{{ current_search.term }}">

{%- comment -%} Broken: double-escaped, renders &amp;lt;b&amp;gt; {%- endcomment -%}
<p>{{ current_search.term | escape }}</p>
```

Rules that follow from this:

- Do not add `| escape` to a Drop attribute you are printing as HTML text or into a quoted
  attribute. It is already escaped, and `| escape` gives you `&amp;lt;`.
- Automatic escaping is **HTML escaping only**. It is not correct for a URL, a JavaScript
  string, or JSON. Escape for the destination explicitly:

```liquid
{%- comment -%} URL parameter {%- endcomment -%}
<a href="{{ current_store.search_path }}?q={{ current_search.term | url_encode }}">

{%- comment -%} JSON consumed by JavaScript {%- endcomment -%}
<script type="application/json" id="config">
  {{ payload | json }}
</script>
```

- Rich merchant content is deliberately **not** escaped. That is why the `*_content`
  accessors exist. `{{ article.body_content }}` renders HTML; `{{ article.raw_body_content }}`
  gives the unevaluated source. Do not run merchant content through `| markdown` a second
  time, and do not build your own HTML from a raw field.
- Values you construct yourself and print as a bare variable are not escaped. Escape them
  explicitly:

```liquid
{%- comment -%} Broken: unescaped {%- endcomment -%}
{% capture label %}{{ some_untrusted_value }}{% endcapture %}
<div title="{{ label }}">

{%- comment -%} Correct {%- endcomment -%}
<div title="{{ label | escape }}">
```

Never print `current_request.params` wholesale, a customer object, a cart, or any payment or
authorization value for debugging. Use `{% debug %}`, which goes to the Console rather than
the page.

## Writes that silently do nothing

`{% update %}` has four preconditions. Miss any one and it is a no-op with no page-visible
error.

1. The template must be a **controller template**. In a page, snippet, block or component
   template the tag returns immediately.
2. The first argument must be a **Drop**, not a record returned by `{% query %}`.
3. The field must have a Custom Data Mapping that is marked editable. A missing or read-only
   mapping logs a Console warning and returns.
4. Only Custom Data Mapping fields can be written. Standard and managed-package fields
   cannot be set from Liquid.

```liquid
{%- comment -%} Broken: query returns records, not Drops — nothing is written {%- endcomment -%}
{% query 'Product2' as records, s_c__slug__c: slug %}
{% for record in records %}
  {% update record, field: "view_count__c", value: 1 %}
{% endfor %}
```

```liquid
{%- comment -%} Correct, inside controllers/<controller>/<action>.liquid {%- endcomment -%}
{% before %}
  {% query 'Product2' as records,
      s_c__store__c: current_store.sfid,
      s_c__slug__c: slug %}
  {% if records.size == 1 %}
    {% for record in records %}
      {% assign product = record | cast: 'Product' %}
      {% assign next_count = product.data.view_count__c | default: 0 | plus: 1 %}
      {% update product, field: "view_count__c", value: next_count %}
    {% endfor %}
  {% endif %}
{% endbefore %}
```

Note the two safety steps in the correct version: the query is scoped by Store, and the
update runs only when exactly one record matched. Never update a record found by an
unscoped, request-supplied identifier — require the Store condition and, for customer-owned
data, the authenticated customer as well.

A write reaches Salesforce asynchronously. Verify the Salesforce field value and the
customer-visible result after propagation, not immediately.

## Slow page

### A query inside a loop

Each `{% query %}` is a separate database round trip.

```liquid
{%- comment -%} Broken: one query per cart item {%- endcomment -%}
{% for item in current_cart.items %}
  {% query 'Product2' as matches, sfid: item.product.id %}
{% endfor %}

{%- comment -%} Correct: one query, then look up in Liquid {%- endcomment -%}
{% assign product_ids = current_cart.items | map: 'product' | map: 'id' %}
{% query 'Product2' as products, sfid: product_ids %}
```

### `| depaginate`

`depaginate` fetches the **entire** collection. Use it only when you know the set is small
and you need a whole-collection filter.

```liquid
{%- comment -%} Broken on a large catalog: loads every product {%- endcomment -%}
{% assign all = all_products | depaginate %}

{%- comment -%} Correct: bound it {%- endcomment -%}
{% assign first_page = all_products | paginate: 12 %}

{%- comment -%} Acceptable: a variant set is inherently small {%- endcomment -%}
{% assign variants = product.variants | depaginate %}
```

`{% for x in collection limit: 10 %}` limits **rendering**, not fetching. On a paginated
collection it renders nothing at all; on a query result the whole result set is already in
memory. Narrow with conditions and pagination, not with `limit:`.

### Cache that never hits, or hits when it should not

Cache only stable, public, read-only markup, and include every stable input that changes it in
`items:`.

```liquid
{%- comment -%} Broken: a product card may contain personalized pricing or controls. {%- endcomment -%}
{% cache "product-card", items: [product] %}
  {% render "products/card", product: product %}
{% endcache %}

{%- comment -%} Correct: cache only a stable public media fragment. {%- endcomment -%}
{% cache "product-media", items: [product, current_store, display_mode] %}
  {% render "products/media", product: product, display_mode: display_mode %}
{% endcache %}
```

```liquid
{%- comment -%} Broken: a per-request value in the key means a miss every time {%- endcomment -%}
{% cache "banner", items: [current_store, current_request.path] %}…{% endcache %}
```

Never cache forms, component containers, checkout or payment content, pricing, cart or account
state, consent controls, or any visitor- or request-specific output. See [tags.md](tags.md) for
the tag syntax and `storeconnect-debug-performance` for the complete safety rule.

### Asset loading

Put `{% require %}` inside the snippet that needs the script, and inside the conditional that
decides whether that UI renders, so pages that do not use it never load it. Duplicate
requires of the same file collapse to one automatically.

```liquid
{% if product.variants.size > 0 %}
  {% require "scripts/product-variants.js" %}
  …
{% endif %}
```

## Diagnostic order

1. Reproduce on the target Store and theme preview. Behavior differs by Store data.
2. Decide which failure class you have: blank, `Liquid error` in the page, or whole template
   empty. That alone rules out most causes.
3. For a blank value, print `.size` on the collection and confirm the attribute exists in
   [drops.md](drops.md) before investigating data.
4. For a slow page, wrap the suspect region in `{% timer %}` and check the Console rather
   than guessing.
5. Test the empty, anonymous, authenticated, validation-error and no-results states.
6. Remove all `{% debug %}` and `{% timer %}` output before publishing.
