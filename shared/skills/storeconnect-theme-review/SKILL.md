---
name: storeconnect-theme-review
description: Read-only quality audit of a StoreConnect Liquid theme or storefront — layout integrity, SEO and structured data, accessibility, responsive images, caching and performance, form correctness, and translations. Produces a severity-ranked report with before/after code and user-facing impact, plus optional CMS content-completeness and Lighthouse passes. Use when asked to review, audit, health-check, or "find problems in" a StoreConnect theme, storefront, or specific template and you will change nothing, or when asked why a store scores badly on SEO, accessibility, or Core Web Vitals. To instrument or fix one slow or broken template use storeconnect-debug-performance.
---

# StoreConnect theme review

Audit a StoreConnect theme and produce a severity-ranked report. This skill covers layout
integrity, SEO surfaces, accessibility, images, caching and performance, forms, and
translations, with optional CMS content and Lighthouse passes.

## Non-negotiable rules

**This is a reporting skill. It does not change files.** Produce findings with before/after
code. Do not edit, create, or delete a theme template, asset, or store record, and do not push
anything to a store. If the user wants the fixes applied, that is a separate task for
`storeconnect-theme-development` — say so and stop.

**Read the file before you report on it.** Never report from assumption, from a filename, or
from what a theme "probably" does. For every candidate finding, open the template and the
snippet it renders. A wrong finding sends a client to break working code, which is worse than
a missed finding.

**Verify names against source, not memory.** Before flagging any drop attribute, form name,
form field, filter, or translation key, check it against `storeconnect-liquid` and
`storeconnect-forms`, and against the base theme. This is the single largest source of bad
theme-review findings.

**Separate a base-theme gap from a theme defect.** Verify the deployed base
theme before assigning ownership. When a missing skip link, visually hidden
utility, focus treatment, reduced-motion behavior, or ARIA pattern is inherited,
label it as a base-theme gap rather than a custom-theme regression.

**Respect intentional choices.** Tailwind instead of the base CSS is a decision. A brand color
is a decision. A missing `<h1>` may live in a snippet. A `noindex` on a staging store is
correct. Ask or note the ambiguity; do not convert a choice into a defect.

**The CMS content review requires permission.** Ask first, and confirm the target store and
the environment before reading any store data. Stay read-only. Never put credentials, customer
data, raw record dumps, SFIDs, or internal identifiers in the report — report coverage counts
and named field gaps.

**The Lighthouse pass requires permission and public URLs only.** Ask first. Send only URLs
that are already publicly reachable. Never send a preview URL containing a token, an admin
URL, or an authenticated page.

## Audit procedure

Work the phases in order. Each phase names the reference to open and why.

**1. Scope it.** Establish which theme, how many templates, and whether it derives from the
base theme or replaces it wholesale. Ask which environment the store is in — it changes
whether indexing findings are valid at all. Read `layouts/theme.liquid` first; it tells you
more about the theme's quality than any other single file.

**2. Layout and SEO.** Read `references/layout-and-seo.md`. The required-output list there is
exhaustive and each entry states exactly what breaks when it is missing, so check every entry
rather than sampling. Read that file **before** proposing any metadata work: the platform
already synthesizes titles and descriptions server-side and `meta_data` already emits Open
Graph, Twitter cards, and the canonical, so most "missing meta tag" findings are wrong.

**3. Page templates.** Same reference, "Page template checks". Confirm the context variable
matches the route, heading structure, breadcrumbs, product structured data, and that checkout
handles all four steps.

**4. Forms.** Read `references/forms-and-translations.md` before flagging any form name or
field. Confirm the name is registered — several real forms are commonly mistaken for invented
ones — then check field names, labels, and whether field-level errors are rendered at all.

**5. Accessibility.** Read `references/accessibility.md`. Establish the deployed
base-theme baseline before writing any `aria-*` recommendation, then prioritize
findings by user-facing impact and distinguish inherited gaps from custom-theme
regressions.

**6. Images and performance.** Read `references/images-and-performance.md`. Use
it to verify current image behavior and to review safe cache placement, public
variation inputs, and critical non-cacheable content before classifying a
performance finding.

**7. Translations.** Same reference as forms, second half. Check that user-facing strings go
through `t`, and check for the failure modes that render visible diagnostic text to customers
rather than failing silently.

**8. Optional passes.** CMS content review and Lighthouse, each only with permission. See the
two sections near the end of this file.

**9. Write the report.** Severity-ranked, with passing checks listed.

## References

| Read this | When |
|---|---|
| `references/layout-and-seo.md` | Auditing `layouts/theme.liquid`, any page template, or anything affecting titles, descriptions, canonicals, structured data, social images, or indexing. Also the storefront SEO field table used to validate CMS findings. |
| `references/accessibility.md` | Auditing accessibility, triaging a Lighthouse accessibility score, or writing any `aria-*`, focus, contrast, or motion recommendation. |
| `references/images-and-performance.md` | Auditing image markup, `{% cache %}`, `{% require %}`, `{% component %}`, pagination, or any slow page. Read before classifying a cache finding's severity. |
| `references/forms-and-translations.md` | Auditing any `{% form %}`, any field name, error surfacing, or any user-facing string or pluralization. Read before calling a form name invented. |

## Severity model

Four tiers. Classify by user-facing consequence, not by how wrong the code looks.

**Critical — breaks functionality or leaks data.**

- A missing required layout output (`csrf_meta_tags`, `body_content`, and the rest of the list).
- An unregistered `{% form %}` name, or a removed hidden field.
- A nonexistent drop attribute in a decision (`product.available` is the classic — it is always
  falsy, so the add-to-cart button never renders).
- `{% include %}` — there is no file system for it, so it renders a Liquid error, not a slow
  include.
- **A cached block that can expose one visitor's output to another.** This includes forms,
  component containers, payment or checkout markup, and visitor-specific pricing, credit, cart,
  or account output. This is a data-exposure bug, not a performance nit — classify it Critical
  and name the affected output.
- A cache name that can evaluate to nil, or a cached payment-provider fragment.
- A duplicate `<link rel="canonical">`.
- A checkout step with no branch, so the order cannot progress.

**Warning — significant SEO, accessibility, or performance impact; the task still completes.**

No `srcset`/`sizes`, `loading="lazy"` on the LCP image, an oversized image in a small box,
missing `alt`, no skip link, no field-level form errors, unpaginated growing collections,
`| depaginate` on a large collection, `| t | default:` chains, blocked pinch-zoom, a stale
`expires_in` on price or stock content.

**Suggestion — enhancement.**

`aria-live` on the cart count, `role="status"` on flash, `fetchpriority`, splitting a cache by
what it varies on, `#N`/`N_M` plural keys, `massive_url` for Open Graph, updating a deprecated
snippet or translation alias.

**Pass — what is already right.** List these. A report with no passing checks reads as hostile
and gives the reader no way to calibrate the rest.

Two calibration rules:

- Group repeated instances into one finding with a count and one example location.
- Where a finding is inherited from the base theme, say so in the finding itself. It changes
  who is responsible and how urgent it is.

## Report format

Structure, with each level rendered as the heading shown:

    # Theme quality report — {theme} ({date}, {n} files)

    ## Summary
    | Category | Critical | Warning | Suggestion | Pass |
    (SEO / Accessibility / Performance / Responsive / Forms / Translations / Best practices)

    ## Critical issues
    ### C1: {title}
    **File** `path:line` · **Impact** {what breaks for the user}
    **Current** — the exact current code, in a fenced liquid block
    **Suggested** — the exact replacement, in a fenced liquid block
    **Why** {one or two sentences}
    {"Inherited from the base theme." where that applies}

    ## Warnings
    ## Suggestions
    ## Passing checks
    ## Not verified
    {anything you could not confirm, and what you checked}

Number findings by tier: `C1`, `C2` for Critical, `W1` onward for Warnings, `S1` onward for
Suggestions, so they can be referenced in follow-up work.

Output to the terminal by default. Write `theme-review-report.md` into the theme directory only
if asked.

Every finding needs the file and line, the user-facing impact, the exact current code, the
exact replacement, and a reason. A finding without a before/after is not actionable and should
not ship.

## Optional: CMS content review

Ask first. Confirm the target store and the environment before reading anything.

Prefer the connected StoreConnect tools and follow their
current schemas; stay read-only. If those tools are not available, ask the user for an approved
content export rather than reconstructing another access path.

Sample representative products, pages, articles, and categories rather than reading the whole
catalog, and use bounded reads. Check for complete titles and meta descriptions, social images,
body content, product identifiers, condition, and category taxonomy. Validate every finding
against the storefront SEO field table in `references/layout-and-seo.md` — a field the theme
cannot read is not a theme finding.

Report a coverage table (type × total × has title × has description × has social image) plus
itemized field gaps by object name. **No credentials, no customer data, no raw record dumps, no
SFIDs or other internal identifiers in the report.**

Two content findings are worth looking for specifically, because the platform's own fallbacks
do not cover them: a page with no meta description on a store that also has none, and
merchant-feed fields (UPC, condition, Google product category) that the auto-generated product
feeds depend on.

## Optional: Lighthouse

Ask first. Public URLs only.

```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=<PUBLIC_URL>&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo"
```

Run three to five representative pages — home, a product, a listing, a content page. The free
tier is rate-limited; space requests by 30 seconds or more.

Then triage every result into one of these before reporting it:

- **Template-fixable** — `alt`, accessible names, roles, invalid nesting, heading skips, missing
  `srcset`, missing skip link.
- **CSS-fixable** — contrast, target size, font size.
- **CMS or platform, not theme** — the rendered output of `{{ menu.render }}` or
  `{{ content_block.render }}`, missing CMS meta fields, or deliberate `noindex` on a
  non-production or restricted store.
- **Preview artifact, ignore** — auditing a URL with a theme-preview parameter adds a redirect
  and injects an unlabeled control. Audit a URL where the theme is live, or discount these
  explicitly.
- **Brand decision** — propose an accessible variant; do not report the brand color as a bug.

A Lighthouse item you have not traced to a specific template line is not a finding yet. Trace
it or list it under "Not verified".

## Related skills

- `storeconnect-liquid` — drops, filters, tags, and runtime gotchas. The authority for any
  attribute or filter name you are about to flag.
- `storeconnect-forms` — the registered form names and their fields. The authority for any form
  finding.
- `storeconnect-theme-development` — where the fixes get applied, if the user asks for that
  next.
- `storeconnect-debug-performance` — `{% debug %}` and `{% timer %}` for measuring a slow
  template rather than inferring cost from reading it.
