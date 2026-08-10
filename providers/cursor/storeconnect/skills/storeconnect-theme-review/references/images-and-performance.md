# Images and performance audit

Checks for responsive images, caching, asset loading, and collection cost. Read this when
auditing image markup, when a page is slow, when triaging a Lighthouse performance score, or
before writing any `{% cache %}` recommendation.

## Contents

- [The nine named image sizes](#the-nine-named-image-sizes)
- [What the Image object does not give you](#what-the-image-object-does-not-give-you)
- [Building a srcset](#building-a-srcset)
- [Hand-built transform URLs: common, and a coupling risk](#hand-built-transform-urls-common-and-a-coupling-risk)
- [Intrinsic dimensions and layout shift](#intrinsic-dimensions-and-layout-shift)
- [Loading priority](#loading-priority)
- [Image checks in order of value](#image-checks-in-order-of-value)
- [Review cache placement first](#review-cache-placement-first)
- [What must never be cached](#what-must-never-be-cached)
- [Review every variation axis](#review-every-variation-axis)
- [Safe cache shapes](#safe-cache-shapes)
- [Split stable presentation from dynamic output](#split-stable-presentation-from-dynamic-output)
- [Asset loading](#asset-loading)
- [The include tag does not work at all](#the-include-tag-does-not-work-at-all)
- [Components: reload, lazy, defer](#components-reload-lazy-defer)
- [Pagination and collection cost](#pagination-and-collection-cost)
- [Theme variables that bound cost](#theme-variables-that-bound-cost)

## The nine named image sizes

Every Image object exposes exactly these URL accessors, plus `url` for the untransformed
original. There is no tenth size and no way to ask for an arbitrary width.

| Accessor | Bound |
|---|---|
| `pico_url` | 16 |
| `icon_url` | 32 |
| `tiny_url` | 50 |
| `small_url` | 100 |
| `thumb_url` | 240 |
| `medium_url` | 480 |
| `large_url` | 640 |
| `huge_url` | 1024 |
| `massive_url` | 2048 |

**The bound is a fit, not a crop.** Each size constrains the longest edge and preserves aspect
ratio. `thumb_url` on a 3:1 banner returns roughly 240×80, not 240×240. Two consequences:

- A `srcset` width descriptor built from the named size is correct for landscape and square
  images and **overstates** the delivered width for portrait ones. Prefer `sizes` plus honest
  descriptors over trying to be clever.
- You cannot derive a `width`/`height` pair from the size name alone.

Video and externally linked video expose the same nine as `preview_pico_url` through
`preview_massive_url` for poster frames.

Typical use: `pico` for a blurred placeholder, `icon` for favicons, `tiny` for cart line
items, `thumb` for gallery thumbnails, `medium`/`large` for cards, `huge` for a page hero and
for Open Graph, `massive` only for a retina hero or the top of a `srcset`.

## What the Image object does not give you

| Missing | Consequence for the audit |
|---|---|
| Arbitrary width | A theme cannot request 320w or 768w from the object. See the next two sections. |
| `width` / `height` | Intrinsic dimensions cannot come from the object, so `<img width height>` and CLS prevention need another source. |
| `alt` | The accessor is `alt_text`. There is also `description`. `image.alt` is always empty — flag it. |

## Building a srcset

Using only the supported accessors:

```liquid
<img
  src="{{ image.large_url }}"
  srcset="{{ image.thumb_url }} 240w,
          {{ image.medium_url }} 480w,
          {{ image.large_url }} 640w,
          {{ image.huge_url }} 1024w,
          {{ image.massive_url }} 2048w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
  alt="{{ image.alt_text | default: product.name | escape }}"
  loading="lazy"
  decoding="async">
```

A `srcset` with no `sizes` is close to useless — the browser assumes `100vw` and downloads the
largest candidate. Flag `srcset` without `sizes` as Warning.

For a card grid, drop the top two candidates. Serving `massive_url` into a 300px card is one of
the highest-impact wins available and is easy to grep for: any `huge_url` or `massive_url` used
as the `src` of a thumbnail or card image.

## Hand-built transform URLs: common, and a coupling risk

Production themes frequently need widths the nine sizes do not cover (400, 768, 960, 1280,
1536, 1920 and their retina doubles), and build them by string-manipulating `image.url` into
the media host's own transform syntax.

It works, and it is the only way to get those widths today. It also hardcodes one media
provider's URL format into the theme, which the platform's own image layer deliberately avoids
so the provider can change.

How to report it: **do not "fix" it and do not call it a bug.** Note it once, as a Suggestion,
naming the coupling and the blast radius (every image on the store breaks if the media URL
format changes). If the theme guards it — checking that the URL matches the expected shape and
falling through to `image.url` untouched when it does not, and skipping SVGs — say so, because
that guard is the difference between a risk and an outage.

## Intrinsic dimensions and layout shift

Since the Image object exposes no dimensions, a theme that wants `width`/`height` on every
`<img>` has to store them. The workable pattern is custom data on the media record — an
intrinsic width and an aspect ratio — read through the object's `data` map:

```liquid
{%- assign w = image.data.intrinsic_width | default: 1024 -%}
{%- assign ratio = image.data.aspect_ratio -%}
{%- if ratio != blank -%}{%- assign h = w | divided_by: ratio | round -%}{%- endif -%}
<img src="{{ image.large_url }}" width="{{ w }}"{% if h %} height="{{ h }}"{% endif %} …>
```

Absent that, the fallback is CSS `aspect-ratio` on the container. Either is acceptable; no
dimensions at all on a hero or card image is a Warning, because it is a direct CLS cause and
CLS is a ranking signal.

## Loading priority

| Position | Attributes |
|---|---|
| Above the fold, largest element | `fetchpriority="high"`, **no** `loading="lazy"`, `decoding="sync"` or omitted |
| Below the fold | `loading="lazy" decoding="async"` |
| In a carousel past the first slide | `loading="lazy"` |

`loading="lazy"` on the hero image is a direct LCP regression and is a Warning every time.
Note that the base theme sets `loading="lazy"` on almost nothing, so on a base-derived theme
the more common finding is the opposite: no lazy loading anywhere below the fold.

## Image checks in order of value

1. Oversized source for the rendered box (`huge_url`/`massive_url` in a card or thumbnail).
2. `loading="lazy"` on the LCP image, or no lazy loading on long below-fold grids.
3. `srcset` with no `sizes`, or no `srcset` at all on content and product imagery.
4. No `width`/`height` and no CSS `aspect-ratio` on above-fold imagery.
5. Missing `alt` — but read any populating script first (see `accessibility.md`).
6. Unescaped `alt` / `aria-label` interpolation.

## Review cache placement first

Review the entire body of every `{% cache %}` block before reviewing `items:`. The region must be
stable, public, read-only markup that is safe to share. A technically plausible key does not make
interactive or customer-specific content safe to cache.

Treat an existing theme pattern as code to review, not as permission to repeat it.

## What must never be cached

| Content | Review outcome |
|---|---|
| A `{% form %}` block, including generated fields, values, messages, and controls | Critical. Move the complete form outside the cached region |
| A `{% component %}` container | Critical when live behavior matters. Move the container outside and cache only a stable inner fragment if useful |
| Checkout or payment content, provider markup, totals, balances, or payment scripts | Critical. Remove the cache |
| Cart, account, entitlement, approval, customer-specific price, or other personalized output | Critical. Remove the personalized output from the cache |
| Flash messages or other one-time output | Critical. Remove the cache |
| Path, query, pagination, filters, search, referrer, geolocation, timestamps, random values, or other request-specific output | Do not cache the request-specific region |
| Secrets, credentials, tokens, private endpoints, or customer data | Critical independently of caching; remove them from the theme |

## Review every variation axis

For a cacheable public fragment, confirm every stable input that changes the output appears in
`items:`:

- The rendered record or content entity.
- The current loop item.
- Store.
- Every render parameter and display flag that changes markup, text, classes, images, or links.
- Locale, language, currency, or channel when applicable.

Also check price book or pricing context, customer/authentication, approval, entitlement, cart,
consent/privacy, path, query, pagination, filters, search, referrer, and geolocation. If any of
those axes change the region, move the affected output outside the cache instead of attempting to
make visitor-specific or request-specific markup cacheable.

An omitted axis that can disclose one customer's output to another is Critical. An omission that
only shows the wrong public content is still a correctness finding. A declared axis that cannot
change the output may be a hit-rate concern, but address safety first.

## Safe cache shapes

| Cached region | `items:` review |
|---|---|
| Public product media or name | Product, store when relevant, and every display flag |
| Public navigation | Store, menu source, and presentation parameters |
| Public content block | Store, content record, and presentation parameters |
| A pure presentational snippet | Every stable render parameter it accepts |

Do not recommend cached prices, cart summaries, customer-aware footers or headers, forms, component
containers, checkout, or payment regions.

## Split stable presentation from dynamic output

The most useful safe optimization is often to split public presentation from personalized or
interactive content:

```liquid
<article class="card">
  {%- cache "card-media", items: [product, current_store, display_mode] -%}
    {%- render "cards/media", product: product, display_mode: display_mode -%}
  {%- endcache -%}

  {%- render "cards/current-price", product: product -%}
  {%- render "cards/add-to-cart", product: product -%}
</article>
```

Only public media is cached; current pricing and the complete form remain outside. Prefer
item-level public fragments over a whole grid so one changing item does not invalidate unrelated
work.

Verify every caching change in two separate clean browser sessions. Exercise anonymous and signed-in
states plus every applicable variation axis, submit nearby forms, trigger nearby component updates,
and confirm no content or state crosses between sessions.

## Asset loading

- `{% require "scripts/foo.js" %}` and `{% require "styles/foo.css" %}` are **de-duplicated by
  resource name** — requiring the same asset from ten snippets emits it once. `multiple: true`
  opts out. So "this asset is required in several snippets" is not a finding.
- Require page-specific packs from the snippet that needs them, not from the layout. A pack
  loaded in the layout is loaded on every page including checkout.
- Third-party scripts belong behind `async`/`defer` and, where the store uses consent
  management, behind the consent gate.
- No inline `<script>` inside a reloadable component. See below.

## The include tag does not work at all

There is no file system configured for Liquid's `include` tag, so `{% include "x" %}` raises
`This liquid context does not allow includes.` and renders a Liquid error string in the page.

This is **Critical**, not a performance nit. The tag is `{% render %}`.

## Components: reload, lazy, defer

`{% component "path/to/component", reload: "sc.event-one sc.event-two" %}` renders a container
that re-fetches itself when any listed event fires on the document. Two more options exist and
are underused:

| Option | Behavior | When to propose it |
|---|---|---|
| `defer: true` | Renders a loader placeholder and fetches the real content immediately after registration. | Below-fold or expensive regions that should not block first paint. |
| `lazy: true` | Defers the initial render. | Content the visitor may never scroll to. |

Reloads are debounced and guarded against overlapping requests, so wiring several events to one
component is fine.

**Inline `<script>` inside a component body never executes after a reload.** The replacement
HTML is parsed into an inert template and swapped in, and that path does not run scripts. The
initial server render works, the reload silently loses the behavior, and it looks like an
intermittent bug. Move the logic into a required script that binds by delegation or re-binds on
DOM change. Critical when the component is interactive.

## Pagination and collection cost

`{% paginate collection by N %}` sets up the page window and exposes a `paginate` object
(`pages`, `parts`, `previous`, `next`, `first`, `last`). Options: `as:` to name the query
parameter when a page has more than one paginated collection, `window:` to size the page-number
run. A page size below 1 is clamped to 1.

For a listing, cache only a stable public sub-fragment of each item:

```liquid
{% paginate products by current_search.per_page %}
  <div class="grid">
    {% for product in products %}
      {%- cache "product-media", items: [product, current_store, display_mode] -%}
        {%- render "products/media", product: product, display_mode: display_mode -%}
      {%- endcache -%}
      {%- render "products/current-price", product: product -%}
      {%- render "products/add-to-cart", product: product -%}
    {% endfor %}
  </div>
  {% render "shared/pagination-nav", paginate: paginate %}
{% endpaginate %}
```

**`| depaginate` loads the entire collection.** It is defined as "page 1, page size = total
size", so it costs a count query plus a full read of every row, then builds an object per row.
On a large catalog that is the single most expensive thing a template can do. Warning on any
collection that can grow; Critical if it is on the home page or a listing page.

Two more `depaginate` traps:

- It returns nil for anything that is not a paginated collection, so a typo produces a silently
  empty loop rather than an error.
- Structured-data output can expand a full variant collection. Review and bound the collection
  rather than depending on page-level caching to hide the cost.

Other collection costs:

- `{% query %}` inside a `{% for %}` loop is one query per iteration. Hoist it, or restructure
  to a single query. Warning, escalating with the loop bound.
- A drop relationship walked inside a loop (`product.brand.name`, `product.categories`) can be
  an N+1. Where the loop is large, isolate any stable public sub-fragment and cache it only when it
  satisfies the cache safety rules above.
- An unpaginated `{% for %}` over a paginated collection iterates only the default page, which
  looks like missing data rather than a performance problem. Check for a missing
  `{% paginate %}` whenever a listing seems truncated.

## Theme variables that bound cost

Read the theme's variables before recommending a limit — some of these already exist and may
have been raised.

| Variable | Base default | Effect |
|---|---|---|
| `products.per_page` | 12 | Products per listing page. |
| `product.variants.images.max_variant_images` | 8 | Caps how many variant images a master's gallery pulls in. |
| `images.ratio` | 4:5 | The theme's nominal image aspect ratio. |

Access them as `theme_variables["products.per_page"]`. A theme that raised `products.per_page`
to a large number to avoid building pagination has traded a real performance problem for a
cosmetic one; flag it.
