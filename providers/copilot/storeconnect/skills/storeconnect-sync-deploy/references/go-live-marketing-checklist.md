# Go-live checks: indexability, SEO, structured data, analytics

Work through this **before** the go-live publish, so the gaps are known while
there is still time to fix them, then confirm each item **after** the cutover on
the production domain. Use it for a domain cutover or the first production
publish of a new or replaced storefront.

Complements the product go-live guidance at
[preparing to launch your store](https://support.storeconnect.com/article/preparing-to-launch-your-store);
this file covers the parts that are only checkable against the live domain.

## Before you begin

Confirm the production domain resolves and that the theme intended for launch is
the one currently live on the Store, per this skill's own
[verification step](../SKILL.md#verification).

## Indexability — the two switches that silently block a launch

These are the highest-consequence items here, because both look like a normal
storefront to a human but tell every crawler to stay out.

- **`s_c__Store__c.s_c__Test_Mode__c` must be unchecked.** While it is checked,
  `robots.txt` serves `Disallow: /` for the whole site. It also forces every
  checkout into test mode, so the store cannot take real payments. A store that
  went live still in Test Mode is not launched.
- **The `stealth_mode` store variable must be off.** While it is on, `robots.txt`
  serves `Disallow: /`, the `Sitemap:` line is omitted, and `/sitemap.xml`
  returns 404.
- **Confirm the store is being served on its own domain**, not on a
  platform-provided hosting hostname. Requests arriving on the platform host are
  served `Disallow: /` regardless of the settings above, so a launch that never
  moved off it is not indexable.

Fetch `https://<production-domain>/robots.txt` and read the actual body. Do not
infer it from the configuration.

Note that a Content Page whose path is `robots.txt` or `sitemap.xml` overrides the
generated one. If either looks wrong, check for such a page before changing store
settings.

## Redirects from a replaced site

- If the launch replaces an existing site, get the list of previously indexed URLs
  (from the operator, an old sitemap, or a search-console export) and fetch a
  sample against the new domain.
- Confirm each sampled URL returns a 301 to its StoreConnect equivalent, not a 404
  and not a blanket redirect to the homepage.
- Prioritize the operator's top pages and anything linked from external sites.
  Report any that do not resolve before calling the check complete.

## SEO metadata

- For the store's key content pages, a product page, a category page, and the
  article listing, confirm the rendered `<title>` and meta description are the
  intended production copy, not a theme default or a placeholder.
- Confirm `/sitemap.xml` returns entries for the current published catalog and
  content. The sitemap is generated on a schedule and hosted, so immediately
  after a cutover it can still be the pre-cutover version. If it is stale, wait
  for the next generation and re-check rather than assuming it is broken.
- Confirm the `Sitemap:` line in `robots.txt` points at the production domain.
- Check canonical URLs on a paginated collection and on a product reachable by
  more than one path.

## Structured data

- Fetch a live product page and confirm the `products/product/rich_data_json`
  snippet rendered valid JSON-LD. It emits `Product` for a simple product and
  `ProductGroup` with nested `Product` variants for a variant product.
- A theme that overrode the product page or its layout may have dropped the
  snippet. Absence is silent — check the rendered HTML, not the theme source.
- The deprecated `products/product/json-ld` snippet just delegates to
  `rich_data_json`. A theme still calling it works; prefer the current name.
- Field-level structured-data review is `storeconnect-theme-review`'s job, not
  this checklist's.
- There is no separate answer-engine setting in StoreConnect. Sitemap accuracy,
  indexability, and structured data are the levers this check verifies.

## Analytics

- Confirm any configured analytics or pixel actually fires on the production
  domain, not only on a staging or pre-cutover host. A container ID configured
  against the old domain will load and record nothing useful.
- Confirm consent gating behaves as intended: a script that must wait for consent
  belongs in a Script Block, which the consent system binds to.

## Verification

Report every item as confirmed, not applicable (no prior site, no tracking
installed), or outstanding, and name the domain you checked. Do not report the
check complete while an outstanding item remains. Keep the customer domain out of
public repositories and shared examples; it may remain in the access-restricted
project configuration used by the client or partner.
