# StoreConnect fragment caching

Public authoring guidance for `{% cache %}`. Use it to cache stable, read-only storefront markup
without caching interactive, payment, or customer-specific output.

Read this before adding, changing, or removing a cache block, and whenever output is stale or
differs between visitors.

## Contents

- [What the tag does](#what-the-tag-does)
- [Safety boundary](#safety-boundary)
- [Review every variation axis](#review-every-variation-axis)
- [Safe cache patterns](#safe-cache-patterns)
- [What actually invalidates a fragment](#what-actually-invalidates-a-fragment)
- [Granularity: what to wrap](#granularity-what-to-wrap)
- [Verifying a cache block](#verifying-a-cache-block)

## What the tag does

`{% cache %}` reuses rendered markup. Use a stable, non-blank name and list every stable input that
can change the output in `items:`.

```liquid
{%- cache "product-media", items: [product, current_store, display_mode] -%}
  {% render "products/media", product: product, display_mode: display_mode %}
{%- endcache -%}
```

Only use caching when the whole block is safe to share and expensive enough to justify it. If part
of a region is interactive or personalized, split the stable public presentation into its own
snippet and cache that snippet only.

## Safety boundary

Never cache any of the following:

- A `{% form %}` block, including its generated fields, submitted values, validation messages, and
  action controls.
- A `{% component %}` container. A cached container can render but fail to update for another
  visitor.
- Checkout or payment content, provider markup, totals, balances, or payment-related scripts.
- Cart, account, entitlement, approval, customer-specific pricing, or any other personalized
  output.
- Flash messages or other one-time output.
- Request-specific output, including path, query parameters, page number, filters, search terms,
  referrer, geolocation, or values generated for one request.
- Secrets, credentials, tokens, private endpoints, or customer data.

Do not treat an existing theme cache block as permission. Move forms, components, payment content,
and customer-specific output outside the block even when the surrounding theme uses a broader
cache.

## Review every variation axis

For a stable public fragment, list every input that can change its rendered output. If an axis is
visitor-specific, request-specific, or otherwise unsafe to share, do not cache the region.

| Variation axis | Review action |
|---|---|
| Rendered record or content entity | Include the specific record used by the fragment |
| Loop item | Include the current item; never let all rows share one undifferentiated entry |
| Store | Include the current store when output can differ by store |
| Render parameters and display flags | Include every parameter that changes markup, text, classes, images, or links |
| Locale, language, currency, or channel | Include the applicable value when the public output changes |
| Price book or pricing context | Keep price output outside the cache; do not rely on keying to make personalized pricing safe |
| Customer, authentication, approval, or entitlement state | Keep the affected output outside the cache |
| Cart state | Keep cart-dependent output outside the cache |
| Consent or privacy state | Keep consent-dependent controls and messages outside the cache |
| Path, query, pagination, filters, search, referrer, geolocation, or other request state | Do not cache the request-specific region |

A cache-key omission that can expose one customer's output to another is Critical. An omission
that only produces the wrong public content is still a correctness defect.

## Safe cache patterns

### Cache a stable item inside a loop

```liquid
{%- for item in items -%}
  {%- cache "catalog-media", items: [item, current_store, display_mode] -%}
    {% render "catalog/media", item: item, display_mode: display_mode %}
  {%- endcache -%}
{%- endfor -%}
```

### Split public presentation from interactive output

```liquid
<article class="card">
  {%- cache "card-media", items: [product, current_store, display_mode] -%}
    {% render "cards/media", product: product, display_mode: display_mode %}
  {%- endcache -%}

  {% render "cards/current-price", product: product %}
  {% render "cards/add-to-cart", product: product %}
</article>
```

The cached region contains only public, read-only presentation. Pricing and the form remain outside
it.

### Cache a stable fragment inside a component

```liquid
{% comment %} Inside the component template; never wrap the component container. {% endcomment %}
{%- cache "delivery-help", items: [current_store, help_content, display_mode] -%}
  {% render "delivery/help", content: help_content, display_mode: display_mode %}
{%- endcache -%}
```

## What actually invalidates a fragment

Fragment freshness follows the cache block's documented expiry and declared variation inputs. A
supported deploy refresh does not guarantee that every explicit fragment is immediately refreshed.

If a recently deployed page still shows an old fragment:

1. Confirm the supported deployment and cache-refresh workflow completed.
2. Wait for synchronization and the fragment's configured expiry.
3. Re-read and re-test; never repeat a write merely because the change is not visible yet.
4. If immediate freshness is a business requirement, shorten or remove caching for that region and
   verify the behavior before publishing.

Version asset filenames whenever their contents change; do not rely on a page cache operation to
refresh an unchanged asset URL.

## Granularity: what to wrap

Cache the largest stable, public, read-only unit whose complete output is covered by the reviewed
variation axes.

Good candidates include:

- Public product media or names, with the product and all display flags included.
- Public navigation or content blocks, with store, source record, and presentation parameters
  included.
- Pure presentational snippets whose every input is stable and declared.

Do not cache a whole page, card, header, footer, or component merely because a smaller stable
fragment inside it is expensive. Split the safe fragment out. Also avoid caching inexpensive markup:
the added complexity is only justified by a measured saving.

## Verifying a cache block

1. Measure the fragment before and after caching. If there is no meaningful saving, remove the
   cache.
2. Confirm the cached region contains no form, component container, checkout or payment content,
   customer-specific output, or request-specific output.
3. Exercise every applicable variation axis: record or loop item, store, display flags, locale,
   language, currency, channel, price book, authentication, approval, entitlement, cart, consent,
   path, query, pagination, filters, search, referrer, and geolocation.
4. Repeat the same checks in two separate clean browser sessions. Include anonymous and signed-in
   sessions when authentication can affect the page.
5. Submit every nearby form and trigger every nearby component update from both sessions.
6. Change the underlying public content and confirm the observed freshness matches the intended
   expiry.
7. Remove diagnostic timing output before publishing, then verify both preview and live storefront.
