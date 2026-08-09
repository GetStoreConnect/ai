# Theme assets and build pipelines

How CSS and JavaScript reach a StoreConnect storefront, and how to build it.

## Contents

- [Two asset subsystems](#two-asset-subsystems)
- [Load order](#load-order)
- [The supplement path](#the-supplement-path-most-themes)
- [Page-specific packs](#page-specific-packs)
- [The full pipeline path](#the-full-pipeline-path)
- [Oversized resources](#oversized-resources)
- [Choosing how to serve a large file](#choosing-how-to-serve-a-large-file)
- [Style Blocks and Script Blocks](#style-blocks-and-script-blocks)
- [Client-side JavaScript and component reloads](#client-side-javascript-and-component-reloads)
- [Performance checklist](#performance-checklist)
- [Failure modes](#failure-modes)

## Two asset subsystems

Confusing these is the top cause of a 404 on a theme asset. They never cross.

| | **Theme assets** | **Resources** |
|---|---|---|
| Reached by | `asset_url` filter; the two supplement keys | `{% require %}`, `{% resource_path %}` |
| Stored as | `s_c__Theme_Asset__c` - **`s_c__Key__c` plus `s_c__Url__c` only, no content field** | `s_c__Theme_Template__c` records keyed `resources/dist/...`, content stored inline |
| Resolution | the theme assets map: the base theme's own asset map merged with the theme's Theme_Asset records | `resources/dist/manifest.json` maps a logical name (`styles/theme.css`) to a fingerprinted filename, served under `/assets/*` with far-future cache headers |
| Miss behavior | `asset_url` returns the literal string `unknown asset: <key>` | `{% require %}` renders nothing usable and the page logs `Liquid error: Resource not found` |
| Typical content | `theme-supplement.css`, `theme-supplement.js`, images, fonts, vendor files hosted at a URL | compiled CSS/JS packs with content hashes |

The base theme's own asset map is empty, so **every `asset_url` key on a store comes from a
Theme_Asset record**. There is no base-theme image or font to inherit.

### `{% require %}` semantics

- Renders the `<link>` or `<script>` **inline at the call position**. Nothing is hoisted to `<head>`.
- Deduplicates per page: a second `{% require %}` of the same logical name emits nothing. Pass
  `multiple: true` to bypass.
- Resolves through `manifest.json`, so a stale manifest means stale filenames in the HTML even
  though the files on disk are new.
- Extra named arguments become escaped attributes on the tag: `{% require "scripts/x.js", defer: true %}`.

`{% resource_path %}` returns the resolved URL with no markup and no deduplication, for when you
need the URL in an attribute or a JS constant.

## Load order

From the base layout, in emitted order:

```
require "styles/theme.css"          base CSS pack
{{ theme_supplement_stylesheet }}   theme-supplement.css (Theme Asset URL)
store custom styles                 as a <link> when a cacheable URL exists, ELSE inline <style>
render "styles"                     Style Blocks, ordered by Position
require "scripts/configure.js", "scripts/metadata.js", "scripts/theme.js"
{{ theme_supplement_javascript }}   theme-supplement.js
store custom JavaScript             inline <script>
render "scripts"                    Script Blocks
{{ sc_support }}                    platform configuration script
render "store/head"                 Store Head content block
render "events"                     analytics hooks
```

The supplement always loads after the base pack, and Style Blocks after the supplement. In
visual-editor mode the platform **appends the editor stylesheet and script to the two supplement
variables**, so a layout that omits them breaks the editor as well as the theme's own CSS.

## The supplement path (most themes)

Write plain CSS and JavaScript, host it, and point a Theme Asset at the URL with key
`theme-supplement.css` or `theme-supplement.js`. No build is required, and any framework's compiled
output works the same way:

```bash
# Tailwind
npx @tailwindcss/cli -i src/theme.css -o theme-supplement.css --minify   # add --watch to develop

# Sass or Bootstrap
npx sass src/theme.scss theme-supplement.css --style=compressed
```

Treat the compiled file as build output: gitignore it, never hand-edit it, and rebuild rather than
patching. A rebuild that empties the output directory will also delete anything you dropped in there
by hand.

To replace base styling entirely, omit `{% require "styles/theme.css" %}` from your layout. A
`theme.css` Theme Asset key does **not** do this; no runtime replacement behavior exists for it.
Keep `{% require "scripts/theme.js" %}` (or an equivalent bundle) unless you are also replacing the
component reloader, and preserve whatever the payment gateway scripts need.

## Page-specific packs

Loading one bundle on every page is the most common performance mistake in a StoreConnect theme.
Because `{% require %}` renders at the call position and deduplicates, the fix is to require a pack
from the template that needs it:

```liquid
{%- comment -%} pages/product.liquid - only product pages pay for this {%- endcomment -%}
{%- require "styles/product-gallery.css" %}
{%- require "scripts/product-gallery.js", defer: true %}
```

```liquid
{%- comment -%} snippets/products/card.liquid - required once no matter how many cards render {%- endcomment -%}
{%- require "scripts/quick-view.js", defer: true %}
```

The base theme does exactly this: `snippets/header` requires `scripts/menu.js` from inside the
header, not from the layout, so a header replaced by a content block never loads it.

Rules of thumb:

- Global pack: only what every page genuinely needs.
- One pack per heavy feature (gallery, filters, booking calendar, map), required from the template
  that renders it.
- Never require a pack from `layouts/theme` for a feature that appears on one page type.

## The full pipeline path

The base theme's own build (esbuild plus SCSS) can be copied for themes that want fingerprinted
multi-pack builds:

```
resources/
├── build/                      esbuild config (scripts, styles, files)
├── src/
│   ├── styles/packs/*.scss  -> dist/styles/<name>.<hash>.css
│   ├── scripts/packs/*.js   -> dist/scripts/<name>.<hash>.js
│   └── files/**             -> dist/files/<name>.<hash>.<ext>
├── package.json                npm install / npm run build / npm run watch
└── dist/manifest.json          logical name -> fingerprinted filename
```

- **Add a pack:** create `src/styles/packs/my-page.scss`, build, then
  `{% require "styles/my-page.css" %}` in the template that needs it.
- **SCSS import order** in the base `theme.scss`: `base/dependencies` → `base/core` → theme
  components → `base/utilities`. Load paths are `src/styles` and `node_modules`, so use
  `@import 'base/...'`, not a relative path.
- **Changes not appearing?** Check that `dist/manifest.json` regenerated. The `{% require %}` lookup
  goes through the manifest.
- **`resources/dist/manifest-override.json`**, if present, is merged **over** the theme's manifest.
  Use it to redirect a single pack without regenerating and redeploying the whole manifest.

**Deploying a pipeline build:** every `dist/` file becomes a Theme Template record with key
`resources/dist/<fingerprinted filename>`, plus the manifest record `resources/dist/manifest.json`.
Deploy the whole set as one unit and update the manifest only once its files are present, or the
HTML points at filenames that do not exist yet. Deploy rules: `storeconnect-sync-deploy`.

## Oversized resources

A Theme Template's content field is capped at **131,072 characters**. A resource larger than that is
split into sequentially numbered part records and reassembled at serve time:

```
resources/dist/scripts/vendor.a1b2c3.js.part0
resources/dist/scripts/vendor.a1b2c3.js.part1
resources/dist/scripts/vendor.a1b2c3.js.part2
```

- The manifest entry for a chunked resource is an **array** of part filenames instead of a string.
- Assembly probes for `.part0`, `.part1`, … in order and concatenates until one is missing, so parts
  must be contiguous from zero. A missing middle part truncates the file with no error.
- **Normalize line endings to `\n` before splitting.** Salesforce stores text with `\n`; a `\r` that
  falls on a split boundary is lost and the reassembled file no longer matches the original byte for
  byte, which breaks any file with an integrity check or a minified single-line body.
- Find the chunked entries in a build by scanning the manifest for array values.
- **The theme zip importer skips part files entirely** (their extension is `part0`, `part1`, … which
  is not in its allowlist). Push them separately after import.

## Choosing how to serve a large file

| Serve via | Size limit | Origin | Use when |
|---|---|---|---|
| `{% require %}` (resources, chunked if needed) | none, via chunking | the store's own domain | the file must be same-origin: a service worker, or a vendor SDK that only accepts requests from the registered domain |
| `asset_url` (Theme Asset, CDN-hosted) | none | the asset CDN | anything that does not need the store's origin. Simpler, cached, no chunking |

A file loaded with `asset_url` must have a Theme_Asset record. Build output that lands in `dist/` but
is loaded with `asset_url` has no record, so `asset_url` returns `unknown asset: <key>`, the browser
requests that literal string as a URL, and you get a failed request rather than an error. Either put
the file under `assets/` so it gets an asset record, or load it with `{% require %}` instead.

## Style Blocks and Script Blocks

`s_c__Style_Block__c` and `s_c__Script_Block__c` inject CSS and JavaScript site-wide when no build or
theme-asset channel is available.

A block renders on the storefront only when **all three** of these hold. Miss any one and the block
is silently absent, which looks exactly like a caching problem:

| Field | Requirement |
|---|---|
| `s_c__Active__c` | must be `true` |
| `s_c__Global__c` | must be `true` |
| `s_c__Channels__c` | must include `web` (also enforced by a validation rule) |

Then:

| Field | Behavior |
|---|---|
| `s_c__Url__c` | If set, emitted as a `<link>` / `<script src>`. **Takes precedence over `Content__c`**, which is then ignored |
| `s_c__Content__c` | Long Text Area, 131,072-character cap. Emitted inline. Split large CSS by topic across several blocks |
| `s_c__Position__c` | Load order, ascending, nulls last. Put token and variable definitions first so later blocks can resolve `var()` |
| `s_c__Media__c` | Style Blocks only. Emitted as the `media` attribute; defaults to `all` |

Both are rendered by `snippets/styles` and `snippets/scripts`. A replacement layout that omits
`{% render "styles" %}` / `{% render "scripts" %}` silently disables every block on the store.

**Prefer a Script Block for a consent-gated script.** When the store's privacy settings are in use,
the storefront renders only those Script Blocks that are either unattached to a cookie or attached
to a cookie the visitor has enabled. A `<script>` pasted into a template or content block bypasses
that entirely and fires regardless of consent.

Deployment guidance and orphan cleanup: `storeconnect-sync-deploy`.

## Client-side JavaScript and component reloads

The storefront reloads `{% component %}` regions over the network without a full page load. A script
that binds only on `DOMContentLoaded` therefore stops working on any element inside a region that has
reloaded: the handler was attached to a node that no longer exists.

Initialize per element, from a `data-` attribute, and make initialization idempotent and repeatable:

```js
function initCarousels(root = document) {
  root.querySelectorAll('[data-acme-carousel]:not([data-acme-carousel-ready])').forEach((el) => {
    el.dataset.acmeCarouselReady = 'true';
    // ... set up this one element
  });
}

document.addEventListener('DOMContentLoaded', () => initCarousels());
// Re-run after a component region reloads. Confirm the current event names
// against the components skill rather than assuming them.
document.addEventListener('sc.cart-updated', () => initCarousels());
```

Two further rules:

- **Delegate instead of binding per node** where you can: one listener on a stable ancestor survives
  every reload and costs one handler instead of hundreds.
- **Look up base-theme structure through `closest()`**, not by index or by a fixed DOM path, so a
  base-theme markup change does not silently break the script.

Event names, the reload contract, and the JSON navigation API: `storeconnect-components`.

## Performance checklist

- **Cache only read-only markup whose complete variation can be represented safely.** Include every
  documented value that changes the output, set an appropriate expiry, and verify the result in
  separate visitor sessions. Do not copy a cache boundary from another template without checking
  the output it contains.
- **Never cache a form, a component, or anything request-specific or payment-related.** See
  `storeconnect-liquid` for the full rule set on `{% cache %}` keys.
- **Require packs from the template that needs them**, not from the layout.
- **`{% render %}` over `{% include %}`.** `{% render %}` has isolated scope, so it does not re-scan
  the caller's variables and cannot be invalidated by them. Reserve `{% component %}` for regions
  that genuinely need to reload.
- **Emit `width`, `height`, and `loading="lazy"`** on every image below the fold. Width and height
  reserve layout space and remove the cumulative-layout-shift penalty; omit `lazy` only on the hero
  image.
- **Build a real `srcset` and `sizes`** rather than serving one large image everywhere. A reusable
  responsive-image snippet is worth writing once: take the media object plus a `sizes` string,
  derive the candidate widths, add a 2x width for each, sort and deduplicate them, and pass
  untransformable formats (SVG, an externally hosted URL) straight through unchanged.
- **Paginate, do not depaginate.** `| depaginate` on a large collection loads everything.
- **Batch client-side lookups.** One request for many records, never one request per row.

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| `Liquid error: Resource not found` in the page | `{% require %}` names a logical resource the manifest does not map, or the manifest record was deployed without its files | Deploy the manifest and every file it references as one unit; confirm the manifest regenerated |
| A request to a URL containing `unknown asset:` | `asset_url` names a key with no Theme_Asset record | Create the asset record, or move the file under `assets/` so the importer creates one, or switch to `{% require %}` |
| A large JS or CSS file loads but is corrupt or truncated | The importer truncated the content field at 131,072 characters instead of splitting it | Chunk the file into `.partN` records and push them after import |
| A chunked file serves only its first section | A part record is missing, so assembly stopped early | Confirm the parts are contiguous from `.part0` |
| An asset or component override is simply absent after a zip import | The importer does not import `templates/components/**` or `templates/helpers/**`, and skips `.partN` files | Push those records separately |
| A whole zip import fails with "Valid theme files (and directories) could not be found" | A path in the zip contains the text `git` or `__MACOSX`. The check is a plain substring test | Rename the wrapper directory and the zip |
| New CSS or template content does not appear anywhere | Synchronization is incomplete or cached storefront output has not refreshed | Wait and re-read, then use the supported operator cache-refresh procedure; never repeat the content write or guess at a field |
| Every Style Block stopped applying | A replacement layout omits `{% render "styles" %}` | Add it back |
| The visual editor is broken on a custom theme | The layout omits `{{ theme_supplement_stylesheet }}` or `{{ theme_supplement_javascript }}`, which the platform also uses to inject the editor assets | Output both, always |
