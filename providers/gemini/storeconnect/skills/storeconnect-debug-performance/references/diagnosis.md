# Diagnosing a StoreConnect Liquid template

How to instrument a template safely, what the web Console actually reports, and the ordered
path for each of the three distinct symptoms: blank output, wrong output, and slow output.

Read this when you need to measure or inspect anything at runtime, when a template renders
nothing or the wrong data, or before writing any `{% debug %}` or `{% timer %}` tag.

## Contents

- [The web Console](#the-web-console)
- [Reading the entry tree](#reading-the-entry-tree)
- [Debug tag](#debug-tag)
- [Timer tag](#timer-tag)
- [Inspecting a drop or a queried record](#inspecting-a-drop-or-a-queried-record)
- [Path 1: template renders blank](#path-1-template-renders-blank)
- [Path 2: template shows the wrong data](#path-2-template-shows-the-wrong-data)
- [Path 3: template is slow](#path-3-template-is-slow)
- [Liquid that runs outside a page render](#liquid-that-runs-outside-a-page-render)
- [When you cannot use the Console](#when-you-cannot-use-the-console)
- [Cleanup before publishing](#cleanup-before-publishing)

## The web Console

The Console is the supported runtime diagnostic surface. It opens as a separate browser page,
holds a live socket connection, and receives a log entry for each request **you** make while
browsing the same store in the same browser profile.

What that implies for a diagnosis session:

- Access is granted by Store Role, so the person driving the browser needs it. If they do not
  have it, none of the instrumentation in this file produces output.
- Only the operator's own browsing appears. You cannot inspect another visitor's session, and
  you should not try to reconstruct one.
- Logs are not persisted. Closing or reloading the Console loses them, so capture what matters
  before navigating away.
- Logs are scoped to the store the Console was launched from.
- Reproduce with your own test records. Never drive a diagnosis session through a real
  customer's account or a real payment.

**Nothing in `{% debug %}` or `{% timer %}` reaches anywhere else.** There is no log file, no
page output, and no fallback. With no active Console session, debug lines are discarded, and
`{% timer %}` behaves as described below, which is dangerous.

## Reading the entry tree

Each request expands into a nested tree of entries, one per rendered piece of Liquid, in render
order. An entry reports its own duration, its self duration (its own work with children
excluded), parse duration, any errors, warnings, debug lines, timers, and per-filter timings
with line numbers.

Entry titles tell you what you are looking at:

| Title shape | What rendered |
|---|---|
| `pages/…`, `snippets/…`, `blocks/…`, `layouts/…`, `components/…` | A theme template, by key |
| `controller#action (phase)` | A Liquid controller phase |
| `<object>#<field>` | Liquid inside a record field, such as a page body or a content block |
| `Liquid expression`, `Liquid condition`, `Liquid option`, `Liquid validation` | A single evaluated fragment |

The entry filter is the fastest tool in the Console. Use it deliberately:

| Filter | Use it to |
|---|---|
| Error entries | Find the template that failed. First stop for blank or broken output. |
| Warning entries | Catch deprecated drop attributes and writes that were refused. Easy to miss otherwise. |
| Debug entries | Jump to your own `{% debug %}` output. |
| Timer entries | Read `{% timer %}` results. |
| Slowest entries | Rank templates by self duration. **First stop for a slow page.** |
| Parsed entries | Rank by parse cost, which points at oversized templates rather than slow data. |

Query-level SQL is not part of an ordinary store session, so do not plan a diagnosis around
reading SQL. Attribute time using the entry tree, self duration, and timers instead.

## Debug tag

```liquid
{%- assign variant_count = current_product.variants | size -%}
{% debug step: "variant check", has_product: current_product != blank, variant_count: variant_count %}
```

- Each `key: value` pair becomes one `key: value` line on the current entry, so the output
  appears under the template that emitted it, not at the top of the request.
- The tag renders nothing into the page. It is invisible to visitors even if you forget it,
  but it still must be removed, because it costs work on every request and invites the next
  person to add a riskier one beside it.
- Filters are not allowed in tag options. Pre-assign, as above.
- Never pass a request parameter, header, form value, or any other
  visitor-supplied string to this tag or to any other tag option. Log the shape
  of the value, not the value.

Safe payloads: sizes, counts, booleans, comparisons, drop presence, a branch marker, an
enumerated status string you control.

```liquid
{%- comment -%} WRONG: leaks customer and request data {%- endcomment -%}
{% debug customer: current_customer, q: current_request.params.q %}

{%- comment -%} RIGHT: same diagnostic value, using non-sensitive scalars {%- endcomment -%}
{%- assign has_customer = current_customer != blank -%}
{%- assign q_length = current_request.params.q | size -%}
{% debug has_customer: has_customer, q_length: q_length, item_count: current_cart.items.size %}
```

## Timer tag

```liquid
{% timer "product_page_main" %}
  {{ body_content }}
{% endtimer %}
```

- The label is taken literally, with quotes stripped. It is not evaluated, so
  `{% timer my_var %}` records the label `my_var`.
- The tag takes a label and nothing else.
- Elapsed milliseconds appear on the enclosing entry, readable under the Timer entries filter.
- Multiple timers per template are fine as long as the labels differ.
- Per-filter timings are captured automatically for every filter call with its line number, so
  you do not need a timer to find an expensive filter.

**The landmine:** when there is no active Console session, `{% timer %}` renders nothing at
all. The wrapped body is silently dropped. A timer left around a product description, a price,
or an add-to-cart control removes it for every visitor while looking perfectly fine to whoever
still has the Console open.

Treat `{% timer %}` as a tag that deletes what it wraps unless a Console session is present:

- Never publish a template containing one.
- Never leave one in a template you hand to someone else to publish.
- If you must keep an instrumentation point across sessions, keep the timer around a region
  whose disappearance is harmless, or use `{% debug %}` instead.

## Inspecting a drop or a queried record

The documented attribute list in the `storeconnect-liquid` skill's `references/drops.md` is the
first place to look, because an attribute that is not there does not exist. Runtime
introspection is for confirming what a record actually carries.

```liquid
{%- comment -%} A record from {% query %}. The query variable IS the collection,
    so take the first row directly. {%- endcomment -%}
{%- query 'Product2' as rows, s_c__store__c: current_store.sfid -%}
{%- assign row = rows | first -%}
{%- assign row_object = row | record_name -%}
{%- assign row_fields = row | record_fields -%}
{%- assign row_field_count = row_fields | size -%}
{% debug object: row_object, field_count: row_field_count %}

{%- comment -%} A typed drop must be converted to a record first {%- endcomment -%}
{%- assign product_record = current_product | recordize -%}
{%- assign product_fields = product_record | record_fields -%}
{%- assign product_field_count = product_fields | size -%}
{% debug field_count: product_field_count %}
```

- `record_name`, `record_fields`, and `record_relationships` are **filters**, not attributes.
  Filters cannot appear inside a tag's options, so assign first and pass the variable, exactly
  as above.
- They report the underlying record's field names, not the drop's Liquid attribute list.
- Applied to a typed drop without `| recordize` first, `record_fields` and
  `record_relationships` return an empty list and `record_name` returns an empty string. An
  empty result means "wrong input type", not "no fields".
- `| recordize` only works on a drop that is backed by a record (most record drops are;
  `current_product`, `current_customer`, and an order are). On anything else it returns nothing,
  which again reads as an empty field list.
- Never render their output to a visitor. Field-name inventories are for your Console session
  only, and printing one exposes the object's shape.
- `{{ drop | try: 'attribute' }}` is for an attribute that is genuinely optional across
  versions. It is not a substitute for looking the attribute up.

## Path 1: template renders blank

An undefined variable, an undefined drop attribute, and an undefined filter all render as an
empty string and report an error to the Console. Nothing appears in the page. So blank output
is almost always one of a small set of causes, in the order worth checking:

1. **Open Error entries in the Console.** A missing template logs
   `Liquid template not found: <key>` and renders empty; a misspelled attribute logs
   `undefined method <name>`. This one step resolves most cases.
2. **Is the drop in scope on this page?** Globals such as `current_search` and
   `current_product` exist only in their own contexts. Print a presence boolean, not the drop.
3. **Is it a paginated collection iterated without `{% paginate %}`?** Those render nothing
   until the tag supplies a page. See [performance.md](performance.md).
4. **Is the collection genuinely empty?** Print `.size`, and check store scope and conditions
   if it came from `{% query %}`.
5. **Is a `{% timer %}` wrapping the missing region?** Remove it and reload without the
   Console.
6. **Is the whole template empty rather than one value?** A parse error empties the entire
   template. Check for a mismatched `{% end… %}` and for an unquoted `order by`.

The symptom-to-cause catalog for Liquid failures generally lives in the `storeconnect-liquid`
skill's `references/runtime-gotchas.md`. Use it alongside this path.

## Path 2: template shows the wrong data

Wrong data is not a rendering problem, so instrumentation must confirm the source, not the
markup.

1. **Confirm the record.** Print the id of the record you believe you are rendering, and
   compare it with the one you expect. Do not print the record.
2. **Confirm the scope.** A `{% query %}` is not store-scoped or customer-scoped by default.
   Wrong-tenant or wrong-customer rows are a scope bug, and a serious one; see the
   `storeconnect-liquid` skill's `references/query-tag.md`.
3. **Check for a stale cached fragment.** If the value is right on one visit and wrong on
   another, or right for you and wrong for a colleague, the key is wrong. Go to
   [caching.md](caching.md), the `items:` section. Cached markup is bypassed in the editor, so
   test the storefront URL directly.
4. **Check Warning entries.** A deprecated attribute may now return something different, and a
   refused custom-data write logs a warning rather than failing.
5. **Check the value's type.** An empty string is truthy, and `contains` on a single-value
   field behaves as substring matching. Both are covered in
   `references/runtime-gotchas.md`.
6. **Confirm the render actually happened where you think.** Read the entry tree: the same
   snippet may be rendered from two parents with different parameters.

## Path 3: template is slow

Measure before changing anything. The order is fixed:

1. Reproduce on the target store with a realistic URL and realistic data volume. A page that
   is fast on three products tells you nothing.
2. Note the total request duration in the Console.
3. Switch to **Slowest entries**. That ranks by self duration and names the template doing the
   work, rather than a parent that merely contains it.
4. If the top entries are dominated by parse cost, switch to **Parsed entries**: the fix is a
   smaller template, not faster data.
5. Read the per-filter timings on the guilty entry. An expensive filter with a line number is a
   finished diagnosis.
6. Only then add `{% timer %}` inside that template to bisect it. Time the widest region
   first, then halve. Do not scatter timers across a whole theme.
7. Identify which cost class you have, and apply the matching fix from
   [performance.md](performance.md).
8. Re-measure the same URL in the same state and record the before and after numbers.

Do not add a `{% cache %}` block as the first move. Caching a page that is slow because of a
query in a loop hides the cost for one visitor and leaves it for the next cache miss, and a
wrong key turns a performance problem into a correctness problem.

## Liquid that runs outside a page render

Some Liquid does not belong to a template and fails silently. When a value is simply absent or
zero and no template looks wrong, check these:

| Surface | Failure mode |
|---|---|
| Dynamic discount and dynamic promotion fields | The Liquid is evaluated **once per cart item, on every cart evaluation**. Any error is swallowed and the result becomes `0`, so a broken template looks like "the discount is not applying". Never put a `{% query %}` in one of these fields. |
| Liquid controller phases | Errors are collected against the controller rather than shown in the page. The entry is titled `controller#action (phase)`. See `storeconnect-controllers`. |
| Custom-data writes | A write to a field with no read/write mapping logs a Console warning and does nothing. |
| Content-block and record fields | Rendered as their own entries, titled `<object>#<field>`. A blank body field renders empty with no error. |

## When you cannot use the Console

If no one in the session has Console access, do not invent a substitute that reaches
production:

- Do not add a query-parameter-triggered debug mode, a page dump, a hidden diagnostic block, or
  a "print everything when `?debug=1`" branch. Those ship a production data-disclosure path.
- Do not print request parameters, headers, session state, cart contents, customer records,
  payment values, tokens, or authorization data into the page, even inside a comment or a
  `data-` attribute. HTML comments and attributes are visible to anyone who views source.
- Instead, reproduce on a non-production store or a theme preview with test records, and print
  only non-sensitive scalars (a count, a boolean, an id you already show on the page) in a
  clearly temporary block that you remove in the same change.

## Cleanup before publishing

1. Remove every `{% debug %}` and every `{% timer %}` from the templates you touched.
2. Search the whole change for `debug`, `timer`, and `force:` before you push.
3. Remove any `force: true` from a `{% cache %}` block.
4. Reload the affected pages **without** the Console open and confirm nothing has disappeared.
   This is the check that catches a leftover timer.
5. Confirm the page still renders correctly for an anonymous visitor, a signed-in customer, an
   empty collection, and an empty cart.
