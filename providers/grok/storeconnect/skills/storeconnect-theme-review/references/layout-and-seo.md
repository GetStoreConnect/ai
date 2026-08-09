# Layout integrity and SEO audit

Checks for `layouts/theme.liquid`, page templates, and every SEO surface. Read this when
auditing a layout, a page template, or anything that affects titles, descriptions,
canonicals, structured data, or indexing.

## Contents

- [Required layout outputs](#required-layout-outputs)
- [Layout items that are not breakage](#layout-items-that-are-not-breakage)
- [What `meta_data` already emits](#what-meta_data-already-emits)
- [Titles and descriptions are synthesized server-side](#titles-and-descriptions-are-synthesized-server-side)
- [Canonical URLs](#canonical-urls)
- [Structured data](#structured-data)
- [Social share images](#social-share-images)
- [Indexing, sitemap, robots, feeds](#indexing-sitemap-robots-feeds)
- [Page template checks](#page-template-checks)
- [Storefront SEO fields by object](#storefront-seo-fields-by-object)
- [Do not flag these](#do-not-flag-these)

## Required layout outputs

Each of these is supplied to the layout as a parameter or is a base-theme snippet the layout
renders. Omitting one causes the stated failure. Check every entry; a missing one is Critical.

| Output | Omitting it |
|---|---|
| `{{ csrf_meta_tags }}` | Every form on the store fails its authenticity check. |
| `{{ body_content }}` | Every page renders blank inside the chrome. |
| `{{ theme_bar }}` | Draft-theme preview loses its bar: no way to switch themes or exit preview. Populated only while previewing a theme or a staged content change, nil otherwise. |
| `{{ theme_supplement_stylesheet }}` | `theme-supplement.css` never loads, **and** the visual editor's own stylesheet is appended to this same parameter, so editing breaks. |
| `{{ theme_supplement_javascript }}` | `theme-supplement.js` never loads, and the visual editor's script is appended here too. |
| `{{ sc_support }}` | Front-end error and performance reporting is never configured, and the CAPTCHA script is not loaded on the checkout customer-information step, so a CAPTCHA-protected checkout cannot be completed. |
| `{{ csp_meta_tag }}` | The per-request CSP nonce meta tag is absent. Impact depends on the store's configured policy. |
| `{% render "content_security_policy_header" %}` | The store's Content-Security-Policy response header is never sent. The default policy is report-only; a store that set its policy to enforce loses it entirely. |
| `{% render "meta_data", … %}` | No `<title>`, no description, no Open Graph, no Twitter card, no canonical. |

Two more layout-level checks:

- `<html lang="{{ current_store.locale }}">`. A hardcoded `lang` breaks multi-locale stores.
- `<meta name="viewport" content="width=device-width, initial-scale=1.0">`, with **no**
  `maximum-scale` and no `user-scalable=no`. Blocking zoom is a WCAG 1.4.4 failure.

## Layout items that are not breakage

- `{% default csrf_meta_tags: nil %}` and friends. `{% default %}` assigns only when the
  variable is not already in context, so these declarations are defensive, not required —
  the parameters are already present on an HTML request. They matter for the non-HTML
  layouts (`theme.xml.liquid`) where the platform does not supply them. Report a missing
  declaration as a Suggestion, never as Critical.
- Store CSS/JS hooks. The correct pattern outputs the cacheable URL when available and
  falls back to inline, because the URL is nil while previewing unpublished changes:

  ```liquid
  {% if current_store.global_css_url != blank %}
    <link rel="stylesheet" href="{{ current_store.global_css_url }}">
  {% elsif current_store.global_css != blank %}
    <style>{{ current_store.global_css }}</style>
  {% endif %}
  {% if current_store.global_javascript != blank %}
    <script>{{ current_store.global_javascript }}</script>
  {% endif %}
  ```

  A layout that outputs only `global_css` inline loses the cacheable stylesheet (Warning).
  A layout that outputs only `global_css_url` silently drops store CSS in preview (Warning).

## What `meta_data` already emits

Read the store's `snippets/meta_data` before proposing anything. Unless overridden, it emits
all of the following, so none of them is a valid "missing" finding:

`<title>`, `<meta name="description">`, `keywords` (only when non-blank), `og:type`,
`og:title`, `og:description`, `og:url`, `og:locale`, `og:price:amount` + `og:price:currency`
(products only), `og:image`, `twitter:card` (`summary_large_image`), `twitter:title`,
`twitter:description`, `twitter:image`, and `<link rel="canonical">`.

Behavior worth knowing:

- `og:type` is derived from context: `product`, `article`, `page` (pages, locations, location
  groups), otherwise `website`. Search and listing pages are deliberately `website`.
- On page 2 and beyond the title is replaced by the `pagination.paged_title` translation,
  which is `"%{title}, page %{page}"` in English. Overriding that key is the supported way
  to change paginated-title format.
- Both image tags use `image.huge_url` (1024px bound). Some crawlers prefer larger; proposing
  `massive_url` is a legitimate Suggestion.
- The layout passes `title`, `meta_keywords`, and `meta_description` as render parameters. An
  overridden `meta_data` **must** keep accepting all three or every page loses its metadata.
- Never allow both `meta_data` and a hand-written `<title>` or `<link rel="canonical">` in the
  same layout. Duplicates are Critical for canonicals, Warning for titles.

## Titles and descriptions are synthesized server-side

The platform builds `title` and `meta_description` before Liquid runs, with per-object
fallback chains. A theme override that re-synthesizes them is usually redundant work.

| Context | `meta_description` resolution order |
|---|---|
| Product | `meta_description` → search description → summary → `"<brand> <name>"` |
| Product category | `meta_description` → introduction → information → store `meta_description` |
| Article | `meta_description` → introduction → summary → store `meta_description` |
| Article category | `meta_description` → introduction → information → store `meta_description` |
| Page | `meta_description` → store `meta_description` — **no body fallback** |
| Location / location group | own `meta_description` → store `meta_description` |
| Root URL `/` | home page `meta_description` → store name |
| `/products`, `/articles` listings | store `meta_description` |

`title` always resolves to something: object `meta_title` → the object's own display
name/title/name → the store's `meta_title` → the store's name. A blank `<title>` is therefore
not possible; do not report one.

Two real findings this leaves open:

- **Pages are the weak spot.** A page with no `meta_description` and a store with no
  `meta_description` produces `<meta name="description" content="">`. Warning: fill the CMS
  field, or override `meta_data` to fall back to page body content.
- **No length bound anywhere.** A long introduction becomes a very long description. Search
  engines truncate around 155–160 characters. Suggestion, not a Lighthouse failure.

Both are worth confirming with the CMS content review rather than guessing.

## Canonical URLs

`current_request.canonical_url` resolves to the current object's own URL — product, category,
article, article category, non-home page, location, location group, or the search URL — and
falls back to the request path. The query string is then stripped to nothing except the
pagination parameter, and that only when its value is greater than 1.

Consequences for the audit:

- Tracking and filter parameters cannot leak into a canonical. Do not report that risk.
- A hand-written `<link rel="canonical">` in a layout or page template is a duplicate
  canonical. Critical.
- Articles additionally expose a merchant-set `canonical_url` field on the Article object.
  It is available to templates but the platform's own canonical does not consult it, so a
  store using it needs the theme to honor it explicitly.

## Structured data

Three JSON-LD emitters ship in the base theme.

| Snippet | Emits | Rendered from |
|---|---|---|
| `organization_data` | `Organization` (name, url, logo) | the layout, once per page |
| `breadcrumbs` | the visible `<ol>` **and** `BreadcrumbList` | page templates |
| `products/product/rich_data_json` | `Product` or `ProductGroup` | product templates |

`breadcrumbs` renders **nothing at all** when `current_breadcrumbs` is empty. "Breadcrumbs
missing on this page" is often a data condition, not a template omission — confirm before
reporting. The drop exposes `name`, `path`, and `url`; the visible list uses `path`, the
JSON-LD uses `url`.

`rich_data_json` emits `ProductGroup` for a master that has variants (`variesBy` from variant
type names, `hasVariant` over **every** variant) and `Product` otherwise. In both cases the
product body carries `name`, `sku` (from `product_code`), `gtin` (from UPC, zero-prefixed,
only when UPC is set), `brand`, `image` (all image URLs at the 1024px bound), `description`
(from search description), and an `offers` block with `availability`, `priceCurrency`, `url`,
and either `price` or `lowPrice`/`highPrice` for a variant price range.

Precise behavior to hold onto:

- **`itemCondition` is not emitted.** The snippet deliberately omits it rather than guess.
  Do not report it as missing, and do not justify a CMS condition check by claiming the
  structured data uses it — the condition field feeds the merchant feeds, not JSON-LD.
- `availability` is `OutOfStock` only when the product both tracks inventory and is out of
  stock. Everything else, including untracked products, reports `InStock`.
- `products/product/json-ld` is a deprecated alias that delegates to `rich_data_json`.
  A theme calling it still emits correct structured data. Report it as
  "update to `rich_data_json`" (Suggestion), never as missing structured data.
- **The JSON-LD is string-interpolated, not `| json`-encoded**, in both `breadcrumbs` and the
  product data. A product name or breadcrumb name containing a double quote produces invalid
  JSON-LD and the whole block is discarded by crawlers. Flag any overridden structured-data
  snippet that interpolates a drop string without `| json` as Warning, and note the same
  weakness where it exists in the base snippets rather than reporting it as a theme defect.
- `hasVariant` iterates the depaginated variant list. A master with hundreds of variants
  emits all of them into the page. See `images-and-performance.md`.

## Social share images

`meta_data` picks the share image by context. An overridden `meta_data` or a Twitter/Open
Graph addition should reuse the same chains:

| Context | Chain |
|---|---|
| Product | `social_image` → `image` |
| Product category | `social_image` → `image` |
| Article | `social_image` → `hero_image` |
| Article category | `social_image` |
| Page | `social_image` |
| Location group | `social_image` |
| Everything else (store, search, listings, home) | `social_image` → `logo` |

Locations have no image chain at all. A store relying on location pages for sharing needs the
theme to supply one.

## Indexing, sitemap, robots, feeds

All four are store-scoped and auto-generated. None of them is theme work, and none of them is
a valid theme finding on its own.

| Path | Behavior |
|---|---|
| `/sitemap.xml` | Auto-generated. A visible content Page whose path is exactly `sitemap.xml` overrides it. Returns 404 while the store is in stealth mode. |
| `/robots.txt` | Auto-generated. A visible content Page whose path is exactly `robots.txt` overrides it — **except** when disallow applies, which wins. |
| `/merchant_feed/google.xml` | Auto-generated Google product feed. Note the singular `merchant_feed`. |
| `/merchant_feed/facebook.xml` | Auto-generated Facebook product feed. |

`robots.txt` serves a full disallow when the store is in test mode, in stealth mode, or is
being reached on a platform-generated hostname rather than its own domain. **Confirm the store
environment before reporting noindex behavior as a defect** — on a staging or restricted store
it is correct.

Feed quality depends entirely on CMS fields, not templates: search description, UPC,
condition, and the category's Google product category. Route those to the CMS content review.

## Page template checks

- The page-specific context variable must match the route. `current_product` is nil on a
  category page, `current_article` is nil on a product page, and so on. Referencing the wrong
  one silently renders nothing.
- Exactly one `<h1>` per page, and heading levels in sequence. The `<h1>` may live in a
  snippet — read the snippet before reporting it missing.
- `{% render "breadcrumbs" %}` on product, category, article, and content pages.
- Product page: `{% render "products/product/rich_data_json", product: current_product %}`.
  Price through `current_product.pricing`, gated on `pricing.hide_price?`; purchasability
  through `can_add_to_cart?` / `can_purchase?`. **There is no `product.available`** — a
  template using it always evaluates falsy and hides the button.
- Listings: `current_search.results` exposes four separately paginated typed collections —
  `products`, `articles`, `pages`, `locations`. There is no flat result list to iterate.
  `current_search.type` tells you which one the route populated.
- Cart totals and cart badges must be inside `{% component %}`. A static render goes stale
  the moment the cart changes on another page.
- Checkout must handle all four `current_checkout_step` values: `customer_information`,
  `shipping_information`, `accept_terms`, `payment_information`. A missing branch renders an
  empty checkout step and the order cannot progress. Do not confuse this with an order's own
  `checkout_step` field, which holds lifecycle values such as `complete`.

## Storefront SEO fields by object

What a template can actually read. Verify every CMS-review finding against this table.

| Object | Fields |
|---|---|
| Product | `meta_title`, `meta_description`, `meta_keywords`, `search_description` (synthesized, never blank), `social_image`, `image`, `images`, `condition`, `upc`, `product_code`, `brand`, `url`, `slug` |
| Product category | `meta_title`, `meta_description`, `meta_keywords`, `social_image`, `image`, `google_product_category`, `title`, `subtitle`, `introduction_content`, `information_content`, `url` |
| Article | `meta_title`, `meta_description`, `meta_keywords`, `search_keywords`, `canonical_url`, `hero_image`, `social_image`, `title`, `subtitle`, `summary_content`, `introduction_content`, `publish_on`, `url` |
| Article category | `meta_title`, `meta_description`, `meta_keywords`, `social_image`, `introduction_content`, `information_content`, `url` |
| Page | `meta_title`, `meta_description`, `meta_keywords`, `search_keywords`, `social_image`, `title`, `subtitle`, `url` |
| Store | `meta_title`, `meta_description`, `meta_keywords`, `social_image`, `logo`, `favicon`, `locale`, `currency_code`, `url` |

## Do not flag these

- Missing `hreflang`. There is no hreflang mechanism; multi-locale is per-store, so locale
  alternates would be hand-maintained cross-store layout work.
- Missing Twitter/X card tags. `meta_data` emits them.
- Missing `Organization` structured data. The layout emits it.
- A blank `<title>`. Not reachable.
- `itemCondition` absent from product structured data. Deliberate.
- Tracking parameters in canonicals. Not reachable.
