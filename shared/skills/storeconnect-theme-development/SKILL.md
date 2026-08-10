---
name: storeconnect-theme-development
description: Change how a StoreConnect storefront looks or is structured — override base-theme templates by key (pages/blocks/snippets/layouts/components/helpers), ship brand CSS through theme-supplement.css or the store's custom styles, author custom content-block templates, and set theme variables. Use for storefront styling, header/footer/layout work, new block templates, theme assets and packs, starting a theme from scratch, or diagnosing an override that silently does not apply. For template logic and record data inside a file use storeconnect-liquid.
---

# StoreConnect theme development

A StoreConnect store always renders the **built-in base theme** that ships with the platform. A custom theme is a set of Salesforce records that **replace individual base-theme files by key**. You never copy the base theme; you override the specific keys you are changing.

## Non-negotiable rules

Read these before you touch anything. Each one is a failure an agent cannot detect on its own.

1. **Use the supported publish and cache-refresh workflow after every deploy.**
   Then re-check the preview and live page. An explicit `{% cache %}` fragment
   may remain until its configured expiry; wait, re-read, and never repeat a
   write merely because the change is not visible yet. See
   `storeconnect-sync-deploy`.
2. **Never publish without explicit human approval.** Stage the change, use `sc theme preview` or the connected StoreConnect preview tool, show the diff, and wait. Open the returned preview URL without modifying or sharing it. Deployment workflow: `storeconnect-sync-deploy`.
3. **Never hard-code a root path.** Build every internal link from a documented path helper (`current_store.home_path`, `product.path`, `current_store.*_path`, `content_block.link_target`). A literal `/products/x` breaks every store whose storefront is not mounted at the domain root, and it breaks multi-store isolation. See `storeconnect-liquid` → "Store-relative links".
4. **No secrets in a theme.** Theme assets are public URLs, theme variables render into HTML, and `theme-supplement.js` plus the store's custom JavaScript are client-visible. Never place an API key, token, password, or private endpoint in a Theme Asset, Theme Variable, Style Block, Script Block, or any Liquid template. A public site key (captcha, maps) is fine; a secret key is not, ever.
5. **Read the base file before overriding it.** Get the real source: read the base theme through the store's own theme tooling (a base-theme read, or `storeconnect-cli` pull), or from the public mirror at `github.com/GetStoreConnect/base-theme`. The deployed base theme can be newer than the public snapshot, so prefer the store when a detail matters. Never guess its markup, class names, or nested `{% render %}` calls. Review every existing `{% cache %}` block against the public safety rules before preserving it; never cache a form, component container, checkout or payment content, or customer-specific output.
6. **Never invent a template key, a CSS class, or a `--sc-*` token.** A key that does not match a real base-theme key creates a record that is never read: no error, no warning, no effect. A `--sc-*` name the theme does not declare has no effect either. Confirm every one against the reference files below.
7. **Escape for the output context.** Content-block and page fields are author-supplied. `| escape` for HTML text and attributes, `| url_encode` in URLs, `| json` in `<script>` bodies. Never interpolate a request parameter into a selector, a URL, or a SOQL/`{% query %}` filter unscoped.

## Which reference to open

Open only what the task in front of you needs.

| If you are… | Open | Why |
|---|---|---|
| Overriding an existing base-theme template, or unsure a key exists | [references/theme-structure.md](references/theme-structure.md) → "Template key conventions" | Confirm the exact key first. A wrong key is a silent no-op, and the leaf filenames repeat (three different `menu.liquid`, three `results.liquid`) |
| Writing or changing any CSS | [references/css-system.md](references/css-system.md) → "Color variables" and "Component class naming" | Get the real token and class names before you write a selector. Fabricated names are the single most common failure |
| Authoring a custom content-block template | [references/theme-structure.md](references/theme-structure.md) → "Content block templates" | The Salesforce picklist is restricted; the custom path uses a sentinel value, not a new picklist entry |
| Shipping a compiled bundle, adding a page-specific pack, or a file over ~128 KB | [references/assets-and-build.md](references/assets-and-build.md) | Two separate asset subsystems, a hard per-record character cap, and a chunking mechanism for oversized files |
| Diagnosing a 404 / `unknown asset:` / `Resource not found` on the storefront | [references/assets-and-build.md](references/assets-and-build.md) → "Failure modes" | Each message maps to one specific misconfiguration |
| Importing a theme zip, or building a theme locally | [references/theme-structure.md](references/theme-structure.md) → "Theme zip import" | The importer silently skips whole directories and truncates oversized files |
| Setting layout variables, or writing a replacement layout | [references/theme-structure.md](references/theme-structure.md) → "Layout templates" | Omitting one required output blanks the page or breaks all forms |
| Changing wording, labels, or adding a language | [references/theme-structure.md](references/theme-structure.md) → "Translations" | Translations are `Locale_Translation` records under a `Theme_Locale`, not a file in the theme |

Deploying anything you produce here: `storeconnect-sync-deploy`. Liquid syntax, drops, filters, `{% cache %}`, `{% render %}`: `storeconnect-liquid`. Async/reloading UI: `storeconnect-components`. Server-side logic without Apex: `storeconnect-controllers`. Creating the Salesforce records themselves: `storeconnect-salesforce-data`.

## Decide the mode first

**Override mode (the default, use it unless told otherwise).** Keep the base theme. Create Theme Template records only for the keys you change, plus a `theme-supplement.css` Theme Asset for styling. Everything you do not override keeps working and keeps getting platform updates.

**Full-replacement mode.** Your own layout, page templates, and CSS/JS
pipeline. Choose this only when the design cannot be reached by overriding,
because you then own every required template and output. Enable it only through
the current supported theme workflow, treat inheritance metadata as read-only,
and verify fallback behavior in preview on the installed release.

The base theme's `SC-`/`sc-` CSS is a reference implementation, not a requirement. Its `{% require %}` packs are optional in a replacement layout. The layout's required outputs are not optional: see "Layout templates" in [references/theme-structure.md](references/theme-structure.md).

## Workflow: override one thing

1. **Locate the real template.** Find the base-theme key and read the file. If the change is styling only, stop here and go to step 5 instead: CSS is cheaper than a template override and survives platform updates.
2. **Confirm the key exactly**, including the directory (`snippets/menu` is the recursive renderer; `snippets/header/menu` is the header instance; `snippets/account/menu` is account nav; all three files are named `menu.liquid`).
3. **Copy the base content, then edit it.** Keep the surrounding structure, the `id`/`class` hooks other base CSS and JS bind to, and nested `{% render %}`/`{% component %}` calls you are not deliberately replacing. Reassess every cache block: keep only stable public read-only fragments, include every documented variation axis, and move forms, component containers, checkout or payment content, and customer-specific output outside.
4. **Create/update one Theme Template record** with that key on the store's theme. Same key = replace; nothing else changes.
5. **Or style it instead**, choosing a channel from the table below.
6. **Deploy, run the supported cache refresh, preview, and verify.** See
   "Verify" below.

## Workflow: start a new theme

1. **Stage the new theme through `sc theme new` or the connected StoreConnect
   tooling.** Keep base-theme fallback enabled and do not activate it. If the
   staged workflow cannot create a theme, stop and hand off to the authorized
   operator rather than constructing a direct record procedure.
2. **Get explicit approval to submit the creation draft, then wait for human
   approval and synchronization.** `sc theme new` does not create the Theme
   record immediately. Confirm it exists with `sc theme list` before trying to
   push templates.
3. **Export and read the current base theme** so you are working against the deployed version, not a memory of it.
4. **Set brand tokens first**, before any template work, via the store's custom styles (`:root { --sc-color-primary: #RRGGBB; … }`). Confirm the site looks broadly right with zero template records. Most "new theme" requests end here.
5. **Add a `theme-supplement.css` Theme Asset** for theme-level CSS that must apply to every store using this theme.
6. **Override templates only where CSS cannot reach**, in this order: `snippets/header`, `snippets/footer`, `snippets/meta_data`, then block templates, then page templates. Reach for `layouts/theme` last.
7. **Set behavioral theme variables** for the knobs the base templates already read (per-page counts, image ratio, variant-selector limits). Full list: [references/theme-structure.md](references/theme-structure.md) → "Theme variables".
8. **Push the staged content draft, then preview it.** Use `sc theme preview` only for
   the draft created by `sc theme push`, or use the connected StoreConnect
   preview tool for its own staged change. Walk home, a category, a product,
   cart, and every checkout step.
9. **Submit the reviewed content draft for human approval and supported activation.**
   Verify the live store after approval. One theme per store; do not share a
   theme record across stores you may need to diverge.

## Choose the CSS channel

Four channels reach the storefront. They load in this order, so each one overrides the ones above it by ordinary cascade.

| Channel | Record | Scope | Use it for |
|---|---|---|---|
| Base pack | built-in | every store | never edited |
| `theme-supplement.css` | `s_c__Theme_Asset__c` (URL-backed) | every store on this theme | theme-level CSS, compiled bundles |
| Store custom styles | `s_c__Store__c.s_c__Custom_Styles__c` | one store | brand tokens (`:root { --sc-* }`), one-store tweaks. **Preferred for brand color and font work** |
| Style Blocks | `s_c__Style_Block__c` | one store | page-scoped or channel-scoped CSS, and any case with no theme-asset channel |

Two facts that decide this:

- **Brand color and fonts belong in the store's custom styles.** That channel derives the `-h/-s/-l` HSL triplets the base CSS actually reads from a plain hex value, and it is the only channel that is linted before publish. A bare `font-family` declaration never loads the typeface; use the store's dedicated fonts input, not raw CSS.
- **`theme-supplement.css` is not linted and does not derive HSL triplets.** Hand-authored token overrides there must set the composite *and* all three `-h`/`-s`/`-l` parts. Details and worked examples: [references/css-system.md](references/css-system.md).

## Naming rules

Wrong names fail silently, so treat each of these as exact.

| Thing | Rule | Correct | Wrong |
|---|---|---|---|
| Base component class | PascalCase, `SC-` prefix, `_element`, `-modifier` | `SC-Header_inner`, `SC-Button-primary` | `sc-header`, `SC-header_Inner`, `SC-Button-cta` (no such modifier) |
| Base utility class | lowercase `sc-` | `sc-hide-up-to-medium`, `sc-flex` | `SC-Flex`, `sc-hideUpToMedium` |
| Theme token | `--sc-*`, exactly as the base declares it | `--sc-font-large`, `--sc-color-primary-h` | `--sc-font-size-large`, `--sc-primary-color` |
| Template key | path under the theme root, no extension, no leading slash | `snippets/products/card`, `blocks/acme_video_grid` | `snippets/products/card.liquid`, `/snippets/header`, `templates/snippets/header` |
| Custom block template key | Confirm the current supported naming contract | project-prefixed key validated by the current tool | guessed prefix or a managed field written from an old example |
| Your own CSS component class | project prefix, PascalCase | `ACME-ArticleCard` | `SC-ArticleCard` (collides with a future base class) |
| Your own CSS utility class | project prefix, lowercase | `acme-prose-invert` | `sc-prose-invert` |
| Your own CSS custom property | project prefix, **not** `--sc-` | `--acme-max-width` | `--sc-max-width` (reads as a real token, is not one) |
| Theme variable key | dotted lowercase namespace | `acme.plp.interstitial_slot` | `AcmePlpInterstitialSlot` |

Pick one project prefix per project and use it for every artifact you create. Salesforce-side naming (LWC, Apex, custom objects) follows the same prefix: `acmeArticleHero`, `AcmeCaseController`, `Acme_Bookmark__c`.

## Custom content-block templates

The highest-leverage extension point is a reusable block type a content editor
can place on supported pages.

1. Create the custom block template through the supported theme workflow.
2. Confirm its key and naming rules in the current documentation.
3. Select that template on the Content Block through the connected tool or live
   schema, preserving every generated and platform-managed field.
4. Stage and verify the template before any content that references it.
5. Read only documented `content_block` values and handle optional data safely.

Field names, the built-in template list, the closed `sub_type` / `layout_style` / `alignment` vocabularies, and how to extend them: [references/theme-structure.md](references/theme-structure.md) → "Content block templates".

## What you cannot do from a theme

Stop and route the work elsewhere when you hit one of these. A theme renders; it does not own data or routes.

| Need | Where it belongs |
|---|---|
| New field, object, or picklist value | Salesforce metadata (`storeconnect-salesforce-data`) |
| Exposing a custom Salesforce field to Liquid | Custom Data Mapping (`storeconnect-salesforce-data`) |
| Creating/updating records beyond what a `{% form %}` or `{% update %}` supports | `storeconnect-controllers`, then `storeconnect-apex-integration` |
| A brand-new URL or route | The route table is fixed. Path-based routing through `pages/not_found` (`storeconnect-apex-integration`) |
| Pricing, tax, inventory, or payment behavior | Salesforce configuration and Apex, never Liquid |
| Reading another store's or another customer's records | Not possible and not to be attempted; every query is store-scoped and customer-scoped by design |
| Sending email, or any privileged write | Salesforce automation |

## Verify

After every theme change, in this order:

1. Use the current supported publish and cache-refresh workflow.
2. Load the affected page through the preview URL returned by the supported
   workflow and confirm the change is visible. If it is not, allow
   synchronization and any configured fragment-cache expiry to complete, then
   re-read the resolved key and affected records. Never repeat a write merely
   because the result is not visible yet.
3. Read and resolve the supported validation warnings. Treat each warning as a
   defect or document why it does not apply.
4. Check sanitized browser diagnostics for missing resources and render errors
   (see [references/assets-and-build.md](references/assets-and-build.md) →
   "Failure modes").
5. Walk the pages the change can reach at mobile and desktop widths: home, a category, a product, cart, every checkout step, and account.
6. Confirm no other store changed.

## Anti-patterns

- Skipping the supported cache refresh, or repeating a write before
  synchronization and configured fragment-cache expiry complete.
- Guessing a class name or token instead of reading the base source. `SC-Button-cta`, `SC-Footer_bottom`, and `--sc-font-size-large` all look right and none exist.
- Lowercasing a component class (`.sc-header`) or PascalCasing a utility (`SC-Flex`).
- Naming your own tokens `--sc-*`. They read as real theme tokens, get flagged as unknown, and will collide with a future base token.
- Setting a Store Variable and expecting a Theme Variable to change. They are separate namespaces read through separate globals; neither overrides the other.
- Adding a picklist value to register a custom block instead of using the `custom` sentinel.
- Copying or retaining a cache block without reviewing its content and every variation axis.
- `{% render %}` for anything that must react to cart or voucher changes. Use `{% component %}` with a `reload:` event list.
- Hardcoded colors and spacing in selectors instead of `var(--sc-*)`.
- Copying base templates you are not changing, which freezes them at today's version.
- Hand-editing a generated bundle (`dist/**`, a compiled `theme-supplement.css`). Edit the source and rebuild.
- `!important` to win a specificity fight the load order already gives you.
