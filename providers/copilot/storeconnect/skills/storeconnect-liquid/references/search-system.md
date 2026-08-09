# StoreConnect search in Liquid

Search pages read the `current_search` Drop. The fields and result collections it exposes
**differ by page type**, and asking for a collection the current page does not have is a hard
error rather than a blank. Read [Which page you are on](#which-page-you-are-on) before
anything else.

## Contents

- [Which page you are on](#which-page-you-are-on)
- [Start a search](#start-a-search)
- [`current_search` attributes](#current_search-attributes)
- [Result collections](#result-collections)
- [Search fields](#search-fields)
- [Rendering a filter](#rendering-a-filter)
- [Scope navigation](#scope-navigation)
- [Empty state](#empty-state)
- [Search Keywords](#search-keywords)

## Which page you are on

`current_search` exists on exactly four page types and is **nil everywhere else**. Guard it
before use. Each page type provides a different set of fields and result collections.

| Page | `current_search.type` | Result collections available | Filter fields |
|---|---|---|---|
| Store search (`search_path`) | `products`, `articles` or `pages` — follows the `source` field | `products`, `articles`, `pages` | `filters` group, **but only when `source == "products"`** |
| Product listing | `products` | `products` only | `filters` group, `traits` group present but empty |
| Product category | `products` | `products` only | `filters` group **including populated `traits`** |
| Location finder | `locations` | `locations` only | none — a flat, ungrouped field set |

Consequences you must design around:

- `current_search.results.articles` on a product listing or category page **raises**, because
  those searches have no article search at all. Only the store search page has all three
  content collections.
- `current_search.results.products` on a location page **raises** for the same reason.
- On a location page `current_search.term` is always `""` and `current_search.sort` is always
  the literal `"none"`, because that search registers no keyword or sort field.
- `current_search.count` is **nil** on a location page.
- Trait filters exist only on a **product category** page. A product listing page has the
  `traits` group but with no options in it.
- The store search page is the only one with `source` / `sources` fields, and its `type` is
  never `locations`.

Write a snippet per page type, or guard on `current_search.type` before touching a
collection. Do not write one "generic" search partial that reaches for every collection.

## Start a search

```liquid
<form action="{{ current_store.search_path }}" method="get" role="search">
  <label for="store-search">Search the store</label>
  <input id="store-search" type="search" name="q" value="{{ current_search.term }}">
  <button type="submit">Search</button>
</form>
```

Keep a working GET form even when you add JSON or client-side enhancement. `current_search.term`
is already HTML-escaped — do not add `| escape`.

## `current_search` attributes

Exactly nine, and no others.

| Attribute | Use |
|---|---|
| `term` | Current keyword text. `""` on a location page. |
| `type` | Active result scope: `products`, `articles`, `pages`, `locations`. |
| `count` | Result count for the active scope. **Nil on a location page.** On a product search it accounts for active filters; on articles and pages it is the keyword count. |
| `sort` | Active sort key. `"none"` where the page has no sort field. |
| `per_page` | Current page size — pass this to `{% paginate %}`. |
| `path` | Store-relative URL for the current search state. Use it for links and form actions. |
| `url` | Absolute current-search URL, for canonical tags and sharing. |
| `fields` | The input contract for this page. Case-insensitive map. |
| `results` | The typed result collections. |

There is no `id` and no `data` on this Drop.

## Result collections

`results` has exactly `products`, `articles`, `pages` and `locations` — no categories, no
brands. **All four are paginated**, so a bare `{% for %}` renders nothing while `.size`
reports the true total. Always wrap in `{% paginate %}`.

`results` is not iterable itself; there is no flat list of everything.

```liquid
{% assign products = current_search.results.products %}
{% paginate products by current_search.per_page %}
  <ul class="SC-ProductGrid">
    {% for product in products %}
      <li>{% render "products/card", product: product %}</li>
    {% endfor %}
  </ul>
  {% render "shared/pagination-nav", paginate: paginate %}
{% endpaginate %}
```

Product cards commonly contain customer-specific pricing, points, forms, or controls, so do not
cache the card. If measurement shows a real need, split a stable public media fragment into its
own snippet and cache only that fragment under the categorical rules in
`storeconnect-debug-performance`.

Indexing by the active type works: `current_search.results[current_search.type]`.

## Search fields

`current_search.fields` is the page's input contract. A field exposes exactly five things.

| Attribute | Use |
|---|---|
| `id` | Stable DOM id, built from the field's group path — for example `products-filters-brands`. |
| `name` | The exact HTML input name, for example `filters[brands][]`. Use it verbatim. |
| `label` | Display label. **Populated only for trait filters** — every other field returns nil, so supply your own text or a translation. |
| `value` | Current selection. A list for multi-select fields, a scalar for single-value fields. |
| `options` | The advertised choices. |

An option exposes `id`, `label`, `value`, and `name` — where `name` is the **parent field's**
input name, shared by every option in the field.

Field paths by page type:

| Page | Paths |
|---|---|
| Store search | `q`, `source`, `sources`, `sort`, `per_page`, and when `source == "products"`: `filters.on_sale`, `filters.in_stock`, `filters.brands`, `filters.tags`, `filters.price.min`, `filters.price.max`, `filters.points.min`, `filters.points.max` |
| Product listing | `q`, `per_page`, `sort`, and the same `filters.*` set plus an empty `filters.traits` |
| Product category | as product listing, with `filters.traits.<trait-type-slug>` populated |
| Location finder | `address`, `categories`, `category`, `country`, `distance`, `distance_unit`, `lat`, `lng`, `postcode`, `ref`, `search_by`, `state` — flat, no `filters` group |

A group is absent from the map entirely when its condition fails, so guard with
`{% if current_search.fields.filters %}` before rendering a filter panel on the store search
page.

Never reconstruct a nested input name yourself; read `field.name`. The one documented
exception is a range slider, where the base theme does hard-code
`filters[price][min]` / `filters[price][max]` because the sub-fields are not enumerable
options.

## Rendering a filter

Multi-select field — `contains` is correct here:

```liquid
{% assign field = current_search.fields.filters.brands %}
{% if field and field.options.size > 0 %}
  <fieldset>
    <legend>{{ "search.filters.brands" | t }}</legend>
    {% for option in field.options %}
      {% assign option_id = field.id | append: option.label | parameterize %}
      <label for="{{ option_id }}">
        <input id="{{ option_id }}" type="checkbox"
               name="{{ field.name }}" value="{{ option.value }}"
               {% if field.value contains option.value %}checked{% endif %}>
        {{ option.label }}
      </label>
    {% endfor %}
  </fieldset>
{% endif %}
```

Single-value field — use `==`, never `contains`:

```liquid
{% assign sort = current_search.fields.sort %}
{% if sort %}
  <label for="{{ sort.id }}">{{ "search.sort.label" | t }}</label>
  <select id="{{ sort.id }}" name="{{ sort.name }}">
    {% for option in sort.options %}
      <option value="{{ option.value }}"
              {% if sort.value == option.value %}selected{% endif %}>
        {{ option.label }}
      </option>
    {% endfor %}
  </select>
{% endif %}
```

> `contains` on a single-value field is a **substring** test. The product sort options include
> both `low-high` and `points-low-high`, so an active sort of `points-low-high` matches
> `low-high` too and two options render as `selected`. Use `contains` only for a field whose
> `value` is genuinely a list.

Sort option labels are raw keys, not display text — translate them rather than printing
`option.label` for sort. Use only advertised option values; never pass a request value into
ordering logic.

## Scope navigation

On the store search page, drive the scope tabs from the `sources` field rather than
hard-coding types. This is how the base theme does it, and it gets the counts right.

```liquid
{% assign source = current_search.fields.source %}
{% assign sources = current_search.fields.sources %}
{% if sources %}
  {% for source_option in sources.options %}
    {% if sources.value contains source_option.value %}
      <a href="{{ current_search.path }}"
         class="SC-PageNav_link{% if source.value == source_option.value %} is-current{% endif %}">
        {{ source_option.label }} ({{ current_search.results[source_option.value].size }})
      </a>
    {% endif %}
  {% endfor %}
{% endif %}
```

Note the two different comparisons in one snippet: `sources.value contains …` because
`sources` is multi-value, `source.value == …` because `source` is single-value.

## Empty state

Drive the empty state from `current_search.count`, not from a collection's `.size`. It avoids
the nil and unavailable-collection cases described in
[Which page you are on](#which-page-you-are-on), and it is one lookup instead of forcing a
collection.

```liquid
{% if current_search.count > 0 %}
  {% paginate products by current_search.per_page %}
    …
  {% endpaginate %}
{% else %}
  <p role="status">{{ "search.products.index.no_results" | t }}</p>
{% endif %}
```

Give the visitor a clear way to clear filters or return to browsing. Never expose query
diagnostics, field internals, or record counts from other stores.

## Search Keywords

`s_c__Search_Keywords__c` is a long-text field on **Product, Article and Page** records only.
It adds customer language that is not already prominent in the title or body. Limit 1024
characters, one concept or phrase per line.

Worth adding:

- common misspellings;
- regional or colloquial names;
- abbreviations and model codes;
- alternate terminology for the same thing.

Not worth adding: the record's own title, unrelated popular terms, competitor names, or
anything containing customer or operational data.

Weighting differs by record type. On a product, keywords sit alongside the name in the highest
relevance band, and variant titles, variant product codes and variant keywords are aggregated
into a lower band. On articles and pages, keywords sit one band below the title.

Search reads from materialized views that are refreshed on a schedule, so a keyword change is
not visible immediately. Verify the field value in Salesforce, wait for propagation, then test
on the target storefront. Do not publish refresh schedules or ranking formulas in a theme.
