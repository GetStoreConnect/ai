---
name: storeconnect-liquid
description: Write StoreConnect Liquid template logic and read record data — Drops and their exact attributes, the {% query %} tag, {% cache %}, {% component %}, {% paginate %}, {% update %}, search pages, store-relative links, and escaping. Use when authoring or editing a .liquid template, page or article body, content-block template, snippet, or layout, and when querying, filtering, or updating records. For a form or field name use storeconnect-forms; for theme structure and styling use storeconnect-theme-development; to instrument a blank or slow page use storeconnect-debug-performance.
---

# StoreConnect Liquid

StoreConnect renders storefront HTML from Liquid templates with commerce Drops
(`current_store`, `current_product`, `current_cart`, …) and added tags: `{% query %}`,
`{% form %}`, `{% cache %}`, `{% component %}`, `{% paginate %}`, `{% require %}`,
`{% session %}`, `{% struct %}`, `{% update %}`, `{% debug %}`, `{% timer %}`.

## Non-negotiable rules

Read these before writing anything. They are the rules that produce broken stores, leaked
data, or silent failure when ignored.

1. **Never invent a Drop attribute.** Every Drop has a fixed declared attribute list.
   An attribute that does not exist renders as an **empty string with no error in the page** —
   you will not notice, and neither will the merchant. Confirm the name in
   `references/drops.md` (or `references/drops-extended.md` for the long tail) before you
   type it.
2. **`{% query %}` is not scoped to the current store.** It returns records for every store
   in the Salesforce org. Any query against an object that can hold records for more than one
   store must include an explicit Store condition, for example
   `s_c__store__c: current_store.sfid`. Verify the correct field name on the object rather
   than guessing it.
3. **Never trust a request-supplied record ID on its own.** For customer-owned data, filter
   by the authenticated customer (`current_customer.id` / `current_account.sfid`) *and* the
   Store, and require exactly one match before you use or write the record. A bare
   `sfid: current_request.params.id` lets any visitor read any record.
4. **Never pass a request value into `order by`.** Map allowed request values onto a fixed
   allowlist of column names.
5. **Cache only stable, public, read-only markup.** Never cache forms, component containers,
   checkout or payment content, cart or account state, customer-specific pricing, consent
   controls, or any visitor- or request-specific output. For a safe public fragment, list every
   stable input that changes it in `items:`. See `storeconnect-debug-performance`.
6. **Escape for the destination, not by habit.** Values read through a Drop or hash lookup
   are already HTML-escaped; adding `| escape` produces `&amp;lt;`. Automatic escaping is HTML
   only, so a value going into a URL still needs `| url_encode`, and into JavaScript still
   needs `| json`.
7. **Never print a request parameter dump, a customer object, a cart, a payment value, or an
   authorization value into the page**, including while debugging. Use `{% debug %}`, which
   writes to the Console instead.
8. **Liquid is not an administration tool.** Do not use it for credential handling, payment
   data, bulk record maintenance, or anything privileged. Those belong in Apex or a
   Salesforce admin flow.
9. **`{% update %}` writes only Custom Data Mapping fields, only from a controller
   template.** It is a silent no-op everywhere else. See rule 3 before writing anything.
10. **Verify on the target Store and theme preview.** Drop availability and data shape differ
    per Store. A template that works on one store can render blank on another.

## Which reference to read

Open the file that matches the task. Do not open others speculatively.

| Read this | When |
|---|---|
| `references/liquid-api.md` | Starting a template and you need orientation: the list of globals, which page contexts expose which `current_*` Drop, and where each of the other references picks up. Read first if you do not yet know what data is in scope. |
| `references/drops.md` | Any time you are about to write `drop.attribute`. The attribute inventory for the everyday Drops: globals, Store and Request, Product, variants, traits, Cart and Order, Account and Contact, content, search, media, fulfillment, location, promotions, taxes, forms, payment, booking, privacy. It also holds the complete index of every Drop that exists. |
| `references/drops-extended.md` | The attribute you need is not in `drops.md`, **or** you are working with promotion actions and scopes, applied vouchers and credits, account credit or points transactions, product components and bundles, product approvals, collection points and pickup options, fulfillment items, location groups or stock locations, outlets, registers, price book entries, campaigns, staff, tags, style or script blocks, or the theme/session/store variable objects. |
| `references/query-tag.md` | Before writing or debugging a `{% query %}`. Mandatory reading — store scoping, the two incompatible custom-field filter syntaxes (`data.field__c:` on managed objects versus a bare mapped name on merchant custom objects), what is and is not orderable, and the distance struct. |
| `references/tags.md` | Choosing or configuring a tag: exact parameter names for `{% cache %}`, `{% component %}`, `{% paginate %}`, `{% form %}`, `{% api %}`, `{% new %}`, and the controller phase and action tags. |
| `references/filters.md` | Choosing a filter, or a filter is not doing what you expect. Includes money and number formatting, date handling, Map and List building, and record casting. |
| `references/search-system.md` | Building or changing a search, product-listing, category, or location-finder page — anything that reads `current_search`. The available filter fields differ by page type, and getting that wrong raises rather than rendering blank. |
| `references/runtime-gotchas.md` | **Something is already wrong.** A value renders blank, a loop renders nothing, `Liquid error` text appears in the page, the whole template is empty, output looks plausible but is wrong, or the page is slow. Start at its symptom table. Also read it before publishing a template that caches, paginates, or writes. |

Related skills: `storeconnect-forms` for the registered form names and their fields;
`storeconnect-components` for the `{% component %}` reload system and events;
`storeconnect-controllers` for controller phases and action tags;
`storeconnect-debug-performance` for the Console, `{% timer %}`, and Map/List recipes;
`storeconnect-theme-development` for the base-theme override system and template keys.

## Pick the data source, in this order

1. **A global Drop already in scope** — `current_product`, `current_cart`, `current_store`,
   `current_customer`. Already store-scoped, already customer-scoped, cheapest.
2. **A relationship on that Drop** — `current_product.categories`,
   `current_customer.orders`, `current_cart.items`. Also scoped, no query needed.
3. **An `all_*` lookup** — `all_products['slug']`, `all_pages['path']`,
   `all_content_blocks['identifier']`. Store-scoped. Note these are **paginated** collections
   (see the pagination rule below).
4. **`{% query %}`** — only when steps 1 to 3 genuinely cannot reach the data. Requires the
   Store condition from rule 2 above, and a Custom Data Mapping for any custom field.

If you find yourself querying `Product2`, `Order`, `Contact` or `Account` for data about the
current page or the logged-in customer, go back to step 1. A Drop exists for it.

## Pagination is not optional

Every `all_*` global, every `current_search.results.*` collection, and
`account_points.transactions` are **paginated**. They contain no rows until a `{% paginate %}`
tag or the `paginate` filter fetches a page, while `.size` still reports the true total. A
bare `{% for %}` over one of them renders **nothing**, which reads as missing data.

```liquid
{% paginate all_products by 24 %}
  {% for product in all_products %}{% render "products/card", product: product %}{% endfor %}
  {% render "shared/pagination-nav", paginate: paginate %}
{% endpaginate %}
```

For a fixed small number with no pagination UI, use the filter instead:
`{% assign featured = all_products | paginate: 4 %}`.

Do not reach for `| depaginate` to make a loop work — it fetches the entire collection. Use
it only on a set you know is small, such as `product.variants`.

## Store-relative links

A storefront can be hosted at a domain root or under a store path, so a hard-coded
root-relative URL breaks on some stores. Build links from the Store Drop's path attributes
(`current_store.home_path`, `.cart_path`, `.search_path`, `.account_path`, …) or from a
record's own `.path`. Reserve `.url` for cases that need an absolute URL, such as canonical
tags, JSON-LD, and email content.

## Writes go through a form or a controller

- Customer-facing mutations use `{% form '<registered-name>' %}`. Render the fields the form
  Drop gives you and keep the generated hidden inputs; do not hand-roll the markup or the
  action URL. Form names and fields are in the `storeconnect-forms` skill.
- Server-side logic (redirects, gating, capturing extra fields, `{% update %}`) belongs in a
  controller template's `before` / `after` / `final` phase. Outside a controller template the
  action tags do nothing at all and report nothing.
- `{% update %}` writes only fields that have an editable Custom Data Mapping. It cannot
  write standard or managed-package fields.
- Writes reach Salesforce asynchronously. Verify the Salesforce value and the visible
  storefront result after propagation, not immediately.

## Before publishing

1. Render on the target Store and theme preview — not only locally.
2. Check the page source for `Liquid error` text. It renders inline and is visible to
   customers.
3. Check that every value you expected is actually present. A blank value is as likely to be
   a wrong attribute name as missing data.
4. Test the empty, anonymous, authenticated, validation-error, and no-results states.
5. Confirm links resolve on a store hosted under a path, not just at a domain root.
6. Confirm multi-store isolation: every `{% query %}` has its Store condition, and every
   `{% cache %}` key names everything that varies the fragment.
7. Remove all `{% debug %}` and `{% timer %}` output and any test data.
8. Publish through the reviewed change workflow and confirm the visible storefront result.
