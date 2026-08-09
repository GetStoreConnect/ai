# StoreConnect Liquid `query` tag

`{% query %}` reads StoreConnect and Salesforce records that are available to
Liquid. Use it only when no Drop in scope exposes the data. Apply store and
customer conditions explicitly, and avoid repeated queries.

## Contents

- [Syntax](#syntax)
- [Object names](#object-names)
- [Store and customer scope](#store-and-customer-scope)
- [Condition field names](#condition-field-names)
- [Conditions by field type](#conditions-by-field-type)
- [Custom fields and merchant custom objects](#custom-fields-and-merchant-custom-objects)
- [Ordering](#ordering)
- [Distance](#distance)
- [Reading results](#reading-results)
- [Limiting and pagination](#limiting-and-pagination)
- [What the tag cannot do](#what-the-tag-cannot-do)
- [Errors and their exact text](#errors-and-their-exact-text)

## Syntax

```liquid
{%- query '<Object_API_Name>' as <variable>
    [, <field>: <value>, ...]
    [order by '<field> [asc|desc], <field2> [asc|desc]'] -%}
```

- The variable name after `as` must start with a letter.
- Every `field: value` pair adds an `AND` condition. There is no `OR`.
- The whole `order by` value must be quoted, single or double. It goes last.
- Never run the same query inside a loop. See [Reading results](#reading-results).

```liquid
{%- query 's_c__article__c' as articles,
    s_c__store__c: current_store.sfid,
    s_c__published__c: true
    order by 's_c__publish_on__c desc' -%}

{%- for article in articles -%}
  <a href="{{ article.s_c__path__c }}">{{ article.name }}</a>
{%- endfor -%}
```

## Object names

The object name is matched **case-insensitively** against the available query object name,
so `'Product2'`, `'product2'` and `'PRODUCT2'` are equivalent. It can be a literal string or
a Liquid variable.

| Kind | Form | Examples |
|---|---|---|
| Standard Salesforce | the object API name | `Product2`, `Account`, `Contact`, `Order`, `OrderItem`, `Pricebook2`, `PricebookEntry`, `Campaign` |
| StoreConnect managed | `s_c__<name>__c` | `s_c__store__c`, `s_c__promotion__c`, `s_c__collection_point__c`, `s_c__article__c`, `s_c__voucher__c`, `s_c__tag__c`, `s_c__availability__c` |
| Merchant custom object | the full API name, including any namespace | `address__c`, `mch_account_data__c` |

A merchant custom object resolves only when a Custom Data Mapping exists for it.

> **An object name that does not resolve is silent.** The variable is set to nil and the loop
> renders nothing — no error, no message. If a query produces nothing and there is no
> `Liquid error` in the page, suspect the object name first. `{{ records.size }}` prints
> nothing when the object failed to resolve, and `0` when it resolved but nothing matched.

## Store and customer scope

`{% query %}` adds **no application scope of its own.** Always add the current
store condition and, for customer-owned data, the authenticated customer
condition.

```liquid
{%- query 's_c__article__c' as articles,
    s_c__store__c: current_store.sfid,
    s_c__published__c: true -%}
```

For customer-owned data, scope by the authenticated customer as well, and require exactly one
match before using the record.

```liquid
{%- comment -%} Scope by owner and store, then require one unambiguous match {%- endcomment -%}
{%- query 'Some_Request__c' as records,
    sfid: current_request.params.id,
    contact__c: current_customer.id,
    store__c: current_store.sfid -%}

{%- if records.size == 1 -%}
  {%- for record in records -%}{{ record.name }}{%- endfor -%}
{%- else -%}
  <p>Not found.</p>
{%- endif -%}
```

If you are not certain which field holds ownership on that object, inspect the object in
Salesforce and stop. Do not broaden the query to make it return something.

## Condition field names

Condition keys are the **lowercase query field names**, and the check is
**case-sensitive**. A capitalized Salesforce API name raises.

```liquid
{%- comment -%} Raises: Invalid liquid query field: Featured__c {%- endcomment -%}
{%- query 'Product2' as records, Featured__c: true -%}

{%- comment -%} Raises: Invalid liquid query field: IsActive {%- endcomment -%}
{%- query 'Product2' as records, IsActive: true -%}

{%- comment -%} Correct: lowercase column, and a mapped custom field needs the data. prefix {%- endcomment -%}
{%- query 'Product2' as records, isactive: true, data.featured__c: true -%}
```

- Standard columns: `name`, `sfid`, `firstname`, `lastname`, `createddate`, `isactive`.
- StoreConnect managed columns: `s_c__slug__c`, `s_c__store__c`, `s_c__published__c`.
- `sfid` is the Salesforce record ID. `s_c__sc_id__c` is the StoreConnect external ID.
- Mapped custom fields on a standard or managed object need the `data.` prefix — see below.

## Conditions by field type

### Text and lookup fields

Equality is **case-insensitive**. `%` triggers a case-insensitive `LIKE`. An array matches any
listed value.

| Value | Behavior |
|---|---|
| `'Hiking Boots'` | equals, case-insensitive |
| `'%shirt%'` | contains |
| `'My%'` | starts with |
| `'%cow'` | ends with |
| `['a-slug', 'b-slug']` | matches any of |

```liquid
{%- query 'Product2' as records,
    s_c__store__c: current_store.sfid,
    name: '%boot%' -%}

{%- assign slugs = current_cart.items | map: 'product' | map: 'slug' -%}
{%- query 'Product2' as records, s_c__slug__c: slugs -%}
```

This applies to `string`, `text`, `email`, `textarea`, `url`, `phone`, and `reference`
(lookup) columns. Because equality is case-insensitive, there is no way to do a
case-sensitive exact match on a text column.

### Numbers

Pass a number for equality, or a comparison string for a range.

```liquid
{%- query 's_c__promotion__c' as records,
    s_c__store__c: current_store.sfid,
    s_c__usage_limit__c: '>0' -%}
```

`>`, `>=`, `<`, `<=` are all supported. **Only unsigned digits are recognized.** `'>-100'`
does not raise — it falls through to equality against a string, which becomes `0`, and you
get the wrong rows silently. For a negative bound, fetch a bounded set and compare in Liquid.

### Dates, times and datetimes

The same four operators work on `date`, `time` and `datetime` columns.

```liquid
{%- query 's_c__availability__c' as records,
    s_c__store__c: current_store.sfid,
    s_c__start_date__c: '>=2026-01-01' -%}

{%- query 'Order' as records,
    s_c__store__c: current_store.sfid,
    s_c__submitted_date__c: '>=2026-01-01T00:00:00Z' -%}
```

> An invalid date or time string returns **zero rows silently**. Validate anything that came
> from a request parameter before passing it in, and treat an unexpected empty result as a
> possible format problem rather than missing data.

### Booleans

Pass a Liquid boolean, not a string.

```liquid
{%- query 's_c__article__c' as records,
    s_c__store__c: current_store.sfid,
    s_c__published__c: true -%}
```

## Custom fields and merchant custom objects

These are two different mechanisms with **different matching rules**. Using the wrong syntax
either raises or silently returns nothing.

| Target | Condition syntax | Matching |
|---|---|---|
| Mapped custom field on a standard or StoreConnect object | `data.color__c: 'blue'` | Exact, **case-sensitive**. No wildcards. No `>` `<` operators. |
| Mapped field on a merchant custom object | `color__c: 'blue'` — no `data.` prefix | Case-**insensitive**. `%` wildcards and arrays both work. |

A Custom Data Mapping must exist for the object and for every field referenced. Without one
the tag raises `Invalid liquid query field`.

```liquid
{%- comment -%} Mapped fields on a managed object: exact, case-sensitive {%- endcomment -%}
{%- query 's_c__article__c' as articles,
    s_c__store__c: current_store.sfid,
    s_c__published__c: true,
    data.color__c: 'blue',
    data.material__c: 'suede' -%}
```

```liquid
{%- comment -%} Merchant custom object: bare mapped names, wildcards allowed {%- endcomment -%}
{%- query 'featured_brand__c' as brands,
    store__c: current_store.sfid,
    active__c: true,
    name__c: 'Acme%' -%}
```

Mark a mapping Indexed only for fields the storefront genuinely filters or sorts by.

## Ordering

```liquid
{%- query 's_c__article__c' as articles,
    s_c__store__c: current_store.sfid
    order by 's_c__publish_on__c desc, name asc' -%}
```

- The clause must be quoted. An unquoted `order by` is a **parse** error, which blanks the
  entire template's output.
- Multiple fields, comma-separated. `asc` is the default. Direction is case-insensitive, and
  so is the column name.
- **Only real columns on the queried object, or an alias created by the same query** (see
  [Distance](#distance)), are orderable. You cannot order by a `data.` mapped field on a
  standard or managed object, and you cannot order by a mapped field on a merchant custom
  object — both raise `Invalid order clause: unknown field`. Sort in Liquid instead, or ask
  for a real column on the object.
- **Never pass a request value in.** Map it onto a fixed allowlist:

```liquid
{%- assign sort_key = 'createddate desc' -%}
{%- case current_request.params.sort -%}
  {%- when 'newest' -%}{%- assign sort_key = 'createddate desc' -%}
  {%- when 'name'   -%}{%- assign sort_key = 'name asc' -%}
{%- endcase -%}

{%- query 'Product2' as records,
    s_c__store__c: current_store.sfid
    order by sort_key -%}
```

## Distance

Build a `distance` struct and pass it as a condition. The condition key you choose becomes a
column alias on each returned record, and is the only thing you can `order by` other than a
real column.

```liquid
{%- struct origin = "distance",
    lat_field: "s_c__geolocation__latitude__s",
    lng_field: "s_c__geolocation__longitude__s",
    lat_value: latitude,
    lng_value: longitude,
    units: "km",
    lte: 25 -%}

{%- query 's_c__collection_point__c' as nearby,
    s_c__store__c: current_store.sfid,
    distance_km: origin
    order by 'distance_km asc' -%}

<ul>
{%- for point in nearby limit: 5 -%}
  <li>{{ point.name }} ({{ point.distance_km | round: 1 }} km)</li>
{%- endfor -%}
</ul>
```

| Struct key | Required | Notes |
|---|---|---|
| `lat_field` | Yes | Latitude column on the queried object |
| `lng_field` | Yes | Longitude column on the queried object |
| `lat_value` | Yes | Origin latitude. Must be numeric. |
| `lng_value` | Yes | Origin longitude. Must be numeric. |
| `units` | Yes | `"km"` or `"mi"` only. Anything else raises. |
| `gt` / `gte` | No | Lower bound. If both are given, `gt` wins. |
| `lt` / `lte` | No | Upper bound. If both are given, `lt` wins. |

The bounds filter in the database, so they are far cheaper than fetching everything and
filtering in Liquid. Always keep the Store condition alongside the distance condition.
Validate coordinates that came from a request before passing them in.

## Reading results

The variable holds a list of untyped records. It renders as `List[Record]` if you print it
directly, and supports `.size` and `{% for %}`.

- Field access is by **lowercase column name**: `record.name`, `record.sfid`,
  `record.s_c__slug__c`.
- `record.id` returns the Salesforce primary key (the sfid or the StoreConnect external ID),
  not a numeric row ID.
- `datetime` values come back as ISO 8601 strings and `time` values as `HH:MM:SS`, so a
  `| date:` filter is operating on a string.
- Mapped custom fields on the record are under `record.custom_data`, and that lookup is
  **case-sensitive with lowercase keys**: `record.custom_data.color__c`.
- An attribute that is not a column returns nil rather than raising, so a typo here is silent.

| Filter | Result |
|---|---|
| `record \| cast: 'Product'` | Converts the record into the typed Drop, giving you `.pricing`, `.images`, `.path`, and everything else in `drops.md`. Returns blank if the record is not of that type. |
| `drop \| recordize` | The inverse: a typed Drop back to an untyped record. |
| `record \| record_fields` | The record's readable column names. Debug use only. |
| `record \| record_name` | The query object name, for example `product2`. Not a display name. |

```liquid
{%- query 'Product2' as records,
    s_c__store__c: current_store.sfid,
    s_c__slug__c: 'hiking-boots' -%}

{%- for record in records -%}
  {%- assign product = record | cast: 'Product' -%}
  {%- if product != blank -%}
    {{ product.name }} — {{ product.pricing.price | money }}
  {%- endif -%}
{%- endfor -%}
```

Never render `record_fields` or `record_relationships` output to a customer.

### One query, not one per row

```liquid
{%- comment -%} Wrong: a database round trip per cart item {%- endcomment -%}
{%- for item in current_cart.items -%}
  {%- query 'Product2' as match, sfid: item.product.id -%}
{%- endfor -%}

{%- comment -%} Right: one query for the whole set {%- endcomment -%}
{%- assign product_ids = current_cart.items | map: 'product' | map: 'id' -%}
{%- query 'Product2' as products,
    s_c__store__c: current_store.sfid,
    sfid: product_ids -%}
```

## Limiting and pagination

There is no `limit:` or `offset:` on the tag. The full matching set is loaded into memory
before Liquid sees it.

```liquid
{%- comment -%} Renders 10 rows, but fetched all of them {%- endcomment -%}
{%- for record in records limit: 10 -%}…{%- endfor -%}

{%- comment -%} Paged, with navigation {%- endcomment -%}
{% paginate records by 24 %}
  {% for record in records %}{{ record.name }}{% endfor %}
  {% render "shared/pagination-nav", paginate: paginate %}
{% endpaginate %}
```

`{% paginate %}` on a query result slices in memory, so it gives you the navigation but not
the fetch saving. The only real saving comes from narrower conditions, a distance bound, or a
Drop. Do not query a high-volume object without selective conditions.

## What the tag cannot do

| Limitation | Work around it with |
|---|---|
| No `OR` — conditions are AND only | Two scoped queries, then `\| concat` and `\| uniq` |
| No joins — one object per tag | A second scoped query keyed on the first result's IDs |
| No `SELECT` projection — every column is loaded | Nothing; keep the result set small |
| No `COUNT`, `SUM` or `GROUP BY` | `.size`, and `map` / `sum` on a small result set |
| No `limit` / `offset` | Selective conditions; `{% paginate %}` for the UI |
| No full-text relevance search | The search system — see `search-system.md` |
| No ordering by mapped custom fields | A real column on the object, or sort in Liquid |
| Only the `distance` computed alias exists | Nothing; arbitrary SQL is not exposed |

## Errors and their exact text

Query errors other than the syntax error print **into the page**, so customers see them.

| Text | Cause |
|---|---|
| `Invalid liquid query field: <field>` | The condition key is not a column on the object; the case is wrong (columns are lowercase); a mapped field was used without `data.`; or no Custom Data Mapping exists. |
| `Invalid order clause: unknown field "<field>"` | `order by` names something that is neither a real column nor an alias from the same query. |
| `Invalid order clause segment: expected '<field name> [asc\|desc]'` | A malformed segment, such as `name ascending`, `end_date desc asc`, or a leading comma. |
| `Liquid syntax error: order by clause must be quoted` | The `order by` value was not wrapped in quotes. This is a parse error — the whole template renders empty. |
| `Liquid syntax error: valid syntax: {% query <object_name> as <variable_name> … %}` | Missing `as`, missing variable name, or a malformed tag. |
| No error, no rows | The object name did not resolve, or an invalid date/time or negative comparison string was passed. |

See [runtime-gotchas.md](runtime-gotchas.md) for the full symptom-to-cause table.
