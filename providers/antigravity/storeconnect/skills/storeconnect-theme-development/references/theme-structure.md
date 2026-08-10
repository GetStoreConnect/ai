# StoreConnect theme structure reference

Theme structure is version-sensitive. Verify every key, field, and behavior
against the deployed base theme through supported StoreConnect tooling before
relying on this reference.

## Contents

- [Architecture and override resolution](#architecture-and-override-resolution)
- [Theme records in Salesforce](#theme-records-in-salesforce)
- [Template key conventions](#template-key-conventions)
- [Page templates](#page-templates)
- [Layout templates](#layout-templates)
- [Snippet templates](#snippet-templates)
- [Component templates](#component-templates)
- [Helper templates](#helper-templates)
- [Controller templates](#controller-templates)
- [Content block templates](#content-block-templates)
- [Special asset keys](#special-asset-keys)
- [Theme variables](#theme-variables)
- [Store variables are a separate namespace](#store-variables-are-a-separate-namespace)
- [Translations](#translations)
- [Theme file structure for local development](#theme-file-structure-for-local-development)
- [Theme zip import](#theme-zip-import)
- [Asset and script load order](#asset-and-script-load-order)
- [Theme preview](#theme-preview)

## Architecture and override resolution

Resolution for a single template key, in order:

1. **The store's custom theme.** If a `s_c__Theme_Template__c` record exists on the theme with
   exactly this key, its content is used.
2. **The built-in base theme.** Otherwise the platform reads the file from its own theme directory.

That is the whole model. Consequences you must design around:

- **A key that does not match is a silent no-op.** The lookup is an exact string match against the
  theme's own key list. A misspelled, wrongly nested, or extension-bearing key creates a record
  that is never read: no error, no log line, no warning. The page renders the base version and
  looks untouched. This is the single most common theme bug, and the only defense is confirming
  the key against the list below before creating the record.
- **Nothing merges.** Same key replaces the whole file. There is no partial or block-level merge.
- **Anything you do not override keeps updating** with the platform. That is the reason to override
  as little as possible.

### Full replacement and fallback

Use the currently documented StoreConnect workflow to choose between an
override theme and a full-replacement theme. Full replacement is appropriate
only when the theme supplies every required template, asset, variable, form,
navigation, recovery, and accessibility outcome. Verify missing-key behavior on
the target release before activation.

### Theme inheritance metadata

Use the supported clone and activation workflows and treat inheritance,
version, provenance, and content-comparison metadata as platform-managed. Do
not write those fields, infer a parent-chain algorithm, or reproduce clone and
diff behavior from observed requests. Confirm the effective fallback outcome in
preview on the installed release.

### Deprecated keys are re-routed with a warning

A small set of renamed keys is routed automatically and logs a deprecation warning to the console
session. Use the new key in new work:

| Deprecated key | Current key |
|---|---|
| `snippets/shared/line_items/booking_details` | `snippets/shared/cart_items/booking_details` |
| `snippets/shared/line_items/item` | `snippets/shared/cart_items/item` |
| `snippets/shared/line_items/pricing` | `snippets/shared/cart_items/pricing` |
| `controllers/line_items/destroy` | `controllers/cart_items/destroy` |

Translation keys have the same treatment: `line_items.links.edit_bundle`,
`line_items.links.remove_item` and `line_items.quantity` route to their `cart_items.*` equivalents.

## Theme records in Salesforce

| Object | Purpose | Identifying field | Content field |
|---|---|---|---|
| `s_c__Theme__c` | Parent record | `Name` | — |
| `s_c__Theme_Template__c` | Liquid templates and compiled resources | `s_c__Key__c` (up to 236 chars) | `s_c__Content__c` (Long Text, **131,072-char cap**) |
| `s_c__Theme_Asset__c` | CSS, JS, images, fonts | `s_c__Key__c` | `s_c__Url__c` only - **there is no content field** |
| `s_c__Theme_Variable__c` | Key/value config | `s_c__Key__c` | `s_c__Value__c` |
| `s_c__Theme_Locale__c` | A language on the theme | `s_c__Code__c` (`en`), plus `Active__c`, `Default__c` | — |
| `s_c__Locale_Translation__c` | Individual translation strings | key + value, parented to a Theme Locale | — |

Two consequences worth internalizing:

- **A Theme Asset is a URL, not a file.** The record points at a hosted file. `theme-supplement.css`
  works because the layout emits a `<link>` to that URL. You cannot paste CSS into a Theme Asset.
- **A template's content is capped at 131,072 characters.** Anything larger must be chunked. See
  [assets-and-build.md](assets-and-build.md) → "Oversized resources".

Activate a theme through the currently documented StoreConnect workflow. Treat
preview, inheritance, import state, and other platform-managed theme metadata as
read-only unless the current documentation explicitly identifies an editable
field and the operator has approved the change.

## Template key conventions

The key is the file's path under the theme's `templates/` root with the `.liquid` extension
removed. No leading slash, no `templates/` prefix, no extension.

```
templates/snippets/products/card.liquid   ->  key: snippets/products/card
templates/blocks/my_grid.liquid           ->  key: blocks/my_grid
templates/layouts/theme.liquid            ->  key: layouts/theme
```

Format variants keep the format segment: `pages/article.json`, `layouts/theme.xml`.

**Ambiguous leaf filenames.** Several base files share a leaf name. Overriding the wrong one is a
silent no-op that looks like a caching problem. Resolve these by full key, never by filename:

| Leaf name | The keys that use it |
|---|---|
| `menu.liquid` | `snippets/menu` (recursive renderer behind `{{ menu.render }}`), `snippets/header/menu` (header instance), `snippets/account/menu` (account nav) |
| `results.liquid` | `snippets/products/results`, `snippets/articles/results`, `snippets/pages/results` |
| `add_to_cart.liquid` | `snippets/products/product/add_to_cart`, `snippets/products/product/bundle/add_to_cart` (bundle variant, not a fallback) |
| `form.liquid` | `snippets/account/login/form`, `snippets/account/register/form`, `snippets/checkout/customer_information/form`, `snippets/checkout/shipping_information/form`, `snippets/checkout/accept_terms/form`, `snippets/payment_providers/form` |
| `card.liquid` | `snippets/products/card`, `snippets/articles/card`, `snippets/pages/card` |
| `page.liquid` | `snippets/checkout/payment_information/page`, `components/checkout/payment_information/page`, `components/checkout/shipping_rates/page` |

## Page templates

Keys shipped by the base theme:

```
pages/home                pages/product             pages/products
pages/product_category    pages/page                pages/article
pages/article_category    pages/cart                pages/checkout
pages/account             pages/order               pages/search
pages/location            pages/locations           pages/maintenance
pages/voucher             pages/not_found           pages/form_submission
pages/additional_payment  pages/subscription        pages/subscription_payment_new
pages/auth/login          pages/auth/register       pages/auth/missing_details
pages/auth/password/forgot            pages/auth/password/reset
pages/auth/confirmation/pending       pages/auth/confirmation/resend
pages/auth/invitation/accept          pages/auth/invitation/pending
pages/article.{csv,json,md,text,xml}  pages/page.{csv,json,md,text,xml}
```

Format variants are generated from the request format, so `pages/<name>.<format>` is a valid
override key for any page even where the base theme ships no such file. The base theme ships format
variants only for `article` and `page`.

### Template and primary context

Use the current documented path helpers on Drops (`product.path`,
`current_store.*_path`) and the destinations generated by supported forms. Do
not copy, construct, or publish a raw route map.

| Template key | Supported navigation | Primary context |
|---|---|---|
| `pages/home` | `current_store.home_path` | `current_page` |
| `pages/product` | the product Drop's documented path | `current_product` |
| `pages/products` | the Store Drop's documented catalog path | `current_search` |
| `pages/product_category` | the category Drop's documented path | `current_product_category`, `current_search` |
| `pages/page` | the page Drop's documented path | `current_page` |
| `pages/article` | the article Drop's documented path | `current_article` |
| `pages/article_category` | the article-category Drop's documented path | `current_article_category` |
| `pages/cart` | `current_store.cart_path` | `current_cart` |
| `pages/checkout` | the Store Drop and generated checkout form paths | `current_cart`, `current_checkout_step` |
| `pages/order` | the order Drop's documented path | `current_order` |
| `pages/account` | the Store or account Drop's documented path | `current_customer`, `current_account` |
| `pages/location` / `pages/locations` | the location Drops' documented paths | `current_location` / `current_location_group` |
| `pages/search` | `current_store.search_path` | `current_search` |
| `pages/voucher` | the supported voucher form or page path | `voucher` |
| `pages/form_submission` | the generated custom-form destination | `current_custom_form_submission` |
| `pages/subscription` | the subscription Drop's documented path | `current_subscription` |
| `pages/not_found` | platform-routed unmatched requests | `error` |
| `pages/maintenance` | platform-routed maintenance outcome | — |
| `pages/auth/login` | the Store Drop's documented login path | — |
| `pages/auth/register` | the Store Drop's documented registration path | — |
| `pages/auth/password/forgot` | the Store Drop's documented recovery path | — |
| `pages/auth/confirmation/pending` | the supported confirmation workflow | — |
| `pages/auth/invitation/pending` | the supported invitation workflow | — |
| `pages/auth/missing_details` | the supported account workflow | — |

### Checkout steps

`pages/checkout` serves all four steps; the base template branches on `current_checkout_step`:

```liquid
{%- case current_checkout_step %}
{%- when "customer_information" %}  {%- form "checkout-customer-information" %} … {%- endform %}
{%- when "shipping_information" %}  {%- form "checkout-shipping-information" %} … {%- endform %}
{%- when "accept_terms" %}          {%- form "checkout-accept-terms" %} … {%- endform %}
{%- when "payment_information" %}
  {% component "checkout/payment_information/page", reload: "sc.voucher-applied sc.voucher-removed" %}
{%- endcase %}
```

Step order: `customer_information` → `shipping_information` → `accept_terms` →
`payment_information`. **The payment step must stay a `{% component %}`**: the reload cycle
re-initializes the payment provider's JavaScript when a voucher changes the total. Converting it to
`{% render %}` produces a checkout that takes payment against a stale amount.

### Account sections

`pages/account` routes sections as **path segments** (`/account/orders/123`, not `?section=`), read
via `current_request.params.section` / `.identifier`. Sections: `orders`, `carts`, `fulfillments`,
`subscriptions`, `account_credits` (gated by `current_customer.can_use_account_credit?`),
`account_points` (gated), `product_approvals`, `credentials`, `contact`, `shipping`, `billing`,
`payment_methods`, `payment_methods_new`; no section means the profile.

### Global variables available in every template

`current_store`, `current_cart`, `current_customer`, `current_account`, `current_membership`,
`current_request`, `current_flash`, `current_page`, `current_product`, `current_product_category`,
`current_article`, `current_article_category`, `current_search`, `current_order`,
`current_subscription`, `current_location`, `current_location_group`, `current_privacy`,
`current_checkout_step`, `current_events`, `current_breadcrumbs`, `current_pricebook`,
`current_delivery_options`, `current_booking_availability`, `current_custom_form_submission`,
`all_products`, `all_pages`, `all_articles`, `all_product_categories`, `all_article_categories`,
`all_content_blocks`, `all_custom_forms`, `all_media`, `all_menus`, `all_countries`,
`session_variables`, `store_variables`, `theme_variables`.

## Layout templates

Base keys: `layouts/theme`, `layouts/account`, `layouts/theme.xml`.

**Pages render before the layout.** The page template renders to a string first and arrives in
`layouts/theme` as `body_content`. Do not confuse it with `current_page.body_content` (the CMS page
record's own body): different variables, different content.

### Layout system variables

The server passes these into `layouts/theme`. Declare each with `{% default … : nil %}` at the top
of a replacement layout so none is ever undefined.

| Variable | Required | Purpose and failure mode if omitted |
|---|---|---|
| `body_content` | **yes** | The rendered page output. Omit it and every page is blank |
| `csrf_meta_tags` | **yes** | CSRF meta tags. Omit and every form and AJAX write fails |
| `csp_meta_tag` | yes | Content-Security-Policy meta tag |
| `sc_support` | yes | Platform configuration script block (also carries the captcha include on the customer-information step) |
| `theme_bar` | yes | Preview/editor bar. Populated only in preview or draft-preview mode, but always output it or preview is unusable |
| `theme_supplement_stylesheet` | yes | The `<link>` for the `theme-supplement.css` Theme Asset. In visual-editor mode the platform **appends the editor stylesheet to this same variable**, so omitting it breaks the editor, not just your CSS |
| `theme_supplement_javascript` | yes | Same, for `theme-supplement.js` and the editor script |
| `title`, `meta_keywords`, `meta_description` | no | SEO values. Pass them into `{% render "meta_data" %}` |
| `controller`, `action` | no | Platform controller/action names, emitted as `data-sc-controller` / `data-sc-action` |
| `id` | no | `SC-{controller}-{action}`. Put it on `<body id="">`: it is the hook for page-scoped CSS with no extra template (see [css-system.md](css-system.md) → "Page-scoped CSS") |
| `data` | no | Extra body attributes (for example customer metadata). Output unquoted: `{{ data }}` |
| `format` | no | Request format param |

### Head plumbing a replacement layout must reproduce

The base `layouts/theme` head contains more than the required outputs. Losing any of it degrades
the site silently:

- `<html lang="{{ current_store.locale }}">` and `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- `{% render "content_security_policy_header" %}`
- `{% render "meta_data", title: title, meta_keywords: meta_keywords, meta_description: meta_description %}` - all SEO and social markup
- `{% render "organization_data" %}` - Organization structured data
- Favicon links from `current_store.favicon` (`.pico_url` at 16x16, `.icon_url` at 32x32)
- `{% render "styles" %}` and `{% render "scripts" %}` - the Style Block and Script Block renderers. Omit them and every Style Block on the store stops applying
- `{% render "store/head" %}` - the store's Head content block

The base layout also short-circuits the entire body for the hosted-payment-page controller
(`{% if controller == "salesforce_payments" %}{% render "salesforce_payments", content: body_content %}`).
Reproduce that branch or hosted payment pages render inside your site chrome and break.

**Secondary layouts.** A page opts in with `{% layout "account" %}` at its top. The secondary layout
emits the page output at `{{ yield }}`, and its own output then becomes `body_content` in
`layouts/theme`.

## Snippet templates

Snippets have isolated scope: nothing from the caller is visible unless passed. Declare every input
at the top with `{% default %}` so the file documents its own API and nothing is ever undefined.

```liquid
{%- comment -%} snippets/products/card.liquid {%- endcomment -%}
{% default product: nil, show_price: true, show_brand: false %}
```

`nil` defaults mark required parameters; value defaults mark optional ones. Globals
(`current_store`, `all_*`, …) remain available. For a larger snippet, split the declarations into a
public and a private group with a comment on each - this is how production themes keep a
30-parameter snippet legible:

```liquid
{%- liquid
  # PUBLIC
  default object: blank
  default sizes: blank        # e.g. "(max-width: 768px) 100vw, 50vw"
  default loading: "lazy"
  # PRIVATE (derived below)
  default src: blank
  default source_list: blank
-%}
```

Snippets can also act as functions: output only `{{ result | json }}`, and have the caller
`{% capture %}` the render then `| strip | deserialize` it.

### High-traffic override points

- `snippets/header` - site header. It commonly contains cart, account, forms, or components; keep
  those surfaces outside every cache block.
- `snippets/footer` - site footer. Keep consent controls, forms, components, and other
  visitor-specific output uncached.
- `snippets/meta_data` - title, canonical, Open Graph. The override point for SEO
- `snippets/organization_data` - Organization structured data
- `snippets/breadcrumbs`, `snippets/flash`, `snippets/form_errors`
- `snippets/store/head` (emits `current_store.head_content.content`) and `snippets/store/body`
  (emits `current_store.body_content.render`) - the injection points for fonts, analytics, and
  third-party tags. **There is no fonts snippet in the current base theme**; older versions had
  `snippets/shared/fonts`
- `snippets/store/selector` - multi-store zone dropdown (`current_store.geolocation.sibling_stores`)
- `snippets/styles` / `snippets/scripts` - the Style Block / Script Block renderers
- `snippets/events` plus `snippets/events/cart.add` and `snippets/events/purchase` - server-driven
  analytics hooks via `{% process_event %}` over `current_events`. Override the leaf snippets to
  wire an analytics pixel
- `snippets/privacy` and `snippets/shared/privacy/settings` - cookie consent banner and modal
- `snippets/captcha` - captcha injection, keyed off `store_variables["captcha_site_key"]`
- `snippets/content_security_policy_header` - CSP from `store_variables["content_security_policy"]`
  (plus `_type` for enforce vs report-only)
- `snippets/header/search`, `snippets/header/submenu`, `snippets/header/geolocation`,
  `snippets/header/dropdown/account`
- `snippets/icons/{chevron,close,info}` and `snippets/shared/icons/*` (cart, search, hamburger,
  chevron, close, wallet and payment marks) - two separate icon families
- `snippets/shared/placeholder_image`, `snippets/shared/pagination-nav`, `snippets/shared/modal`,
  `snippets/shared/accordion`, `snippets/shared/dropdown`, `snippets/shared/quantity_picker`

Larger families worth reading before you build: `custom_forms/*` (a renderer per question and answer
type), `checkout/*` (including a `payment_providers/*_form` snippet per gateway), `orders/*`,
`account/*`, `products/product/*` (including `json-ld` and `rich_data_json`), `search/filters/*`,
`locations/*`, `bundles/*`.

### The real base header structure

Read the base file before overriding it; the shape is not what the class names suggest. The base
`snippets/header`, when the store has no Header content block set, renders:

```
header.SC-Header#SC-Header
  render "header/geolocation"
  div.SC-Header_inner
    div.SC-Header_inner_left     hamburger button[data-menu-init] (mobile) + logo (desktop)
    div.SC-Header_inner_center   logo (mobile) + render "header/search" (desktop)
    div.SC-Header_inner_right    ul.SC-Menu.tier1.end#SC-HeaderMenuSecondary
                                   render "header/dropdown/account"
                                   component "cart-menu", reload: "sc.cart-updated sc.voucher-applied sc.voucher-removed"
  div.SC-Navbar
    div.SC-Navbar_inner          render "header/search" (mobile)
                                 current_store.header_menu.render, else ul.SC-Menu.dropdown.tier1#SC-HeaderMenuPrimary
```

Notes that matter when overriding:

- **The primary menu is in `SC-Navbar`, not in `SC-Header_inner`.** `SC-Header_inner_right` holds
  the account dropdown and the cart component.
- **There is no CTA and no top utility bar in the base header.** `SC-Header_top` is a common custom
  addition, not a base class.
- The whole snippet is short-circuited when `current_store.header` is set: setting
  `s_c__Store__c.s_c__Header_Content_Block_Id__c` replaces the header with a content block and your
  template override never runs.
- The base footer is equally minimal: `footer.SC-Footer#SC-Footer` containing
  `current_store.footer_menu.render` and a copyright line. `SC-Footer_menus`, `SC-Footer_social`
  and `SC-Footer_bottom` do not exist.

### Replacing header, footer, head, or body with a content block

Four store fields bypass the corresponding template entirely, which is often the cheaper change:

| Store field | Replaces |
|---|---|
| `s_c__Header_Content_Block_Id__c` | the whole header (`current_store.header.render`) |
| `s_c__Footer_Content_Block_Id__c` | the whole footer (`current_store.footer.render`) |
| `s_c__Head_Content_Block_Id__c` | injected into `<head>` via `snippets/store/head` |
| `s_c__Body_Content_Block_Id__c` | injected at the end of `<body>` via `snippets/store/body` |

Use an `html`-template content block for these so the content passes through unstyled.

## Component templates

Base component templates - **six**:

```
components/cart
components/cart-menu
components/checkout/payment_information/page
components/checkout/shipping_rates/page
components/checkout/vouchers
components/orders/order_summary
```

Thin snippet wrappers (`snippets/checkout/payment_information/page`,
`snippets/orders/order_summary`) forward to the component so older `{% render %}` call sites keep
working. `components/orders/order_summary` is the reference pattern for passing a record into a
component: pass `source:` on first render, persist it with
`{% context source_object: …, source_id: … %}`, and re-query from `context` on reload. Custom themes
can add their own `components/*` templates freely. Full mechanics: `storeconnect-components`.

## Helper templates

Platform-rendered fragments. **Exactly five** in the current base theme:

```
helpers/availabilities            helpers/component
helpers/delivery_options          helpers/product_comparisons
helpers/salesforce_payments
```

Treat them as presentation overrides. Do not invent helper keys; only these are rendered.
Note that the zip importer **does not import `templates/helpers/**` or `templates/components/**`**
(see [Theme zip import](#theme-zip-import)).

## Controller templates

- `controllers/theme` - the global controller. It runs on every request, in all three phases, and
  is where you set variables that must be available everywhere. `before` runs the global controller
  first then the page controller; `after` and `final` run page-first then global.
- `controllers/<controller>/<action>` hooks one exact registered controller/action pair. Made-up
  keys never run, and keys derived from a URL almost never match. `controllers.csv` in an exported
  theme is the registry of valid pairs.

Phase semantics and the full action-tag set: `storeconnect-controllers`.

## Content block templates

A content block renders `blocks/<template>`, so a Theme Template with key `blocks/<name>` defines a
block type a content editor can place on any page.

### Built-in templates

Fourteen, each with a matching value on the restricted `s_c__Content_Block__c.s_c__Template__c`
picklist:

| Key | Picklist value | What it renders |
|---|---|---|
| `blocks/container` | `container` (default) | Groups child blocks under an optional heading and CTA, arranged by `layout_style` |
| `blocks/text` | `text` | Heading, subtitle, rich-text copy. The general-purpose block |
| `blocks/html` | `html` | Raw HTML/markdown passthrough, no styling |
| `blocks/image` | `image` | One image, optionally linked |
| `blocks/media` | `media` | Link to a downloadable file, plus copy |
| `blocks/video` | `video` | Embeds a self-hosted video |
| `blocks/image_beside_text` | `image_beside_text` | Image beside heading, copy, CTA |
| `blocks/image_text_overlay` | `image_text_overlay` | Full-width background image with text overlaid |
| `blocks/slideshow` | `slideshow` | Rotating carousel of child blocks |
| `blocks/featured_products` | `featured_products` | Carousel of hand-picked products |
| `blocks/featured_categories` | `featured_categories` | Carousel of product categories |
| `blocks/featured_category_products` | `featured_category_products` | Paginated product grid pulled from categories |
| `blocks/featured_articles` | `featured_articles` | Grid of articles |
| `blocks/featured_pages` | `featured_pages` | Linked list of pages |

Nest a block by setting the parent block as its parent, not by referencing it from the template.

### Registering a custom block template

Use the currently documented theme and content workflow:

1. Create a custom block template with a distinct project-prefixed key.
2. Validate the key with the current StoreConnect documentation or connected
   tool schema.
3. Stage and verify the template before content that references it.
4. Select the custom template through the supported Content Block interface,
   preserving all generated and platform-managed fields.
5. Preview the block with empty, populated, nested, and long content before
   publication.

Do not add managed picklist values, reproduce normalization rules, write raw
record fields from an old example, or construct the content operation yourself.
If the current supported tool or live schema does not expose the needed custom
template selection, stop and hand off.

### Reading the block in the template

Verified `content_block` accessors:

| Accessor | Notes |
|---|---|
| `id`, `identifier`, `template` | `identifier` is the editor-facing handle |
| `title`, `subtitle` | plain strings |
| `content` | the main body as rich text. **Not `body`** |
| `summary_content`, `pull_text` | secondary rich-text fields |
| `image`, `video`, `document`, `file`, `medium` | media drops. `medium` is the Media reference |
| `link_label`, `link_target` | **Not `link_text` / `link_url`.** `link_target` is already made store-relative for a non-`http` value, so never prefix it yourself |
| `children` | nested content blocks. Render each with `{{ child.render }}` |
| `articles`, `pages`, `products`, `product_categories` | featured collections |
| `sub_type`, `layout_style`, `alignment` | style variants, see below |
| `data` | custom-data map for fields exposed via a Custom Data Mapping |
| `render` | renders this block through its own template |

Guard every optional field with `!= blank`. Render a specific block from anywhere with
`{{ all_content_blocks['hero-banner'].render }}` (the key is the block's identifier).

### The closed style vocabularies

`sub_type` and `layout_style` render as extra CSS classes (`sc-<sub_type>`, `sc-<layout_style>`), and
all three fields are Salesforce restricted picklists. These exact values only:

| Field | Values | Rendered as |
|---|---|---|
| `sub_type` | `hero_image`, `expanded`, `offset`, `image_background`, `image_wrapped`, `image_separator` | `sc-<value>` class |
| `layout_style` | `none`, `even-distribution`, `one-third-two-thirds`, `two-thirds-one-third`, `two-column`, `three-column`, `four-column`, `one-to-two-column`, `one-to-three-column`, `one-to-four-column` | `sc-<value>` class on the container body. Only affects `blocks/container` |
| `alignment` | `center`, `center-text`, `top`, `bottom`, `left`, `right` | meaning depends on the template |

The theme CSS also ships `sc-two-to-four-column` and `sc-two-to-five-column` grid utilities, but
Salesforce rejects them as `layout_style` values. Use a custom `blocks/<key>` template if you need
those grids.

**Extending a vocabulary.** Each list is unioned with any extra values declared in a theme variable
on the store's active theme: `additional_sub_types`, `additional_layout_styles`,
`additional_alignments`. The value is a comma- or space-separated string, or a JSON array. Add the
value there **and** style it in your CSS; the platform only widens what it accepts.

For a block that needs a record association the platform does not provide (block to article
category, for example), add a custom lookup field on `s_c__Content_Block__c` plus a Custom Data
Mapping, and resolve it at render time through `content_block.data`.

## Special asset keys

| Key | Behavior |
|---|---|
| `theme-supplement.css` | Emitted as a `<link>` through the layout's `{{ theme_supplement_stylesheet }}`, **after** the base pack |
| `theme-supplement.js` | Emitted as a `<script>` through `{{ theme_supplement_javascript }}`, after the base packs |
| anything else (`images/*`, fonts, vendor files) | Resolved only by the `asset_url` filter |

These two are the **only** asset keys with special runtime handling. A `theme.css` or `theme.js`
Theme Asset has no effect at all: `{% require "styles/theme.css" %}` resolves through the resources
manifest, which never consults Theme Assets. To actually replace the base packs, see
[assets-and-build.md](assets-and-build.md).

`asset_url` on a missing key returns the literal string `unknown asset: <key>`, which lands in your
HTML as a URL and produces a failed request in the console rather than an error you can catch.

## Theme variables

Base defaults live in the platform's `variables.json` and are **deep-merged with the theme's
`s_c__Theme_Variable__c` records**, same key winning for the theme. Nineteen base keys:

| Key | Base default |
|---|---|
| `articles.per_page` | `12` |
| `pages.per_page` | `12` |
| `products.per_page` | `12` |
| `products.brands` | `true` |
| `products.comparisons` | `false` |
| `products.card.hide_purchase_button` | `false` |
| `images.ratio.width` | `4` |
| `images.ratio.height` | `5` |
| `product.variants.selector.buttons.maximum` | `5` |
| `product.variants.selector.clear.load_master` | `false` |
| `product.variants.images.max_variant_images` | `8` |
| `locations.search.default_distance` | `20` |
| `locations.search.allow_product_filtering` | `true` |
| `locations.search.multiple_categories` | `false` |
| `checkout.delivery_windows.use_days` | `false` |
| `checkout.pay_by_account.require_po_number` | `true` |
| `sources.available` | `"products,articles,pages"` |
| `sources.default` | `"products,articles,pages"` |
| `sources.user_choice` | `true` |

Read them with `{{ theme_variables['key.name'] }}`.

**Arbitrary custom keys are supported and are the right home for theme configuration** an editor
should be able to change without touching Liquid. Namespace them under your project prefix and keep
them behavioral, not visual. A value can be JSON, which lets one variable carry structured config:

```
acme.banner.messages    ["First message", "Second message"]
acme.plp.interstitial_slot   8
acme.low_stock_threshold     5
```

```liquid
{% assign messages = theme_variables['acme.banner.messages'] | deserialize %}
{% for message in messages %}<div class="ACME-Banner">{{ message | escape }}</div>{% endfor %}
```

Colors and fonts do **not** belong in theme variables. They render as CSS; use the store's custom
styles and fonts inputs instead.

## Store variables are a separate namespace

`store_variables` and `theme_variables` are two independent globals reading two unrelated record
sets. **Neither overrides the other.**

| Global | Source | Gate |
|---|---|---|
| `theme_variables['k']` | base `variables.json` deep-merged with `s_c__Theme_Variable__c` records on the active theme | none |
| `store_variables['k']` | `s_c__Store_Variable__c` records on this store | only those with `s_c__Available_in_Liquid__c = true` are exposed |

Setting a Store Variable with the same key as a Theme Variable changes nothing that reads
`theme_variables`. Choose deliberately: theme variable for a value that belongs to the theme, store
variable for a per-store value the theme reads through `store_variables` (`captcha_site_key`,
`content_security_policy` are base examples).

## Translations

Translations are records, not a file in the theme: `s_c__Theme_Locale__c` (one per language, with
`Code__c`, `Active__c`, `Default__c`) parenting `s_c__Locale_Translation__c` key/value rows. At
render time the active locale's rows are loaded over the platform's own base translations, so you
only supply the strings you are changing.

Read a translation with `{{ "key.name" | t }}`. An unknown key renders
`missing translation: ... for locale: ...` into the page, so a typo is visible rather than blank.

Interpolation uses `%{name}` placeholders:

```
greeting    Welcome to %{store_name}
```

```liquid
{{ "greeting" | t: store_name: current_store.name }}
```

An expected variable you do not supply leaves the placeholder text in place; an unexpected variable
is ignored.

### Pluralized keys

Dotted keys nest into a tree, so plural groups need no special syntax. Add one row per form and
call the **parent** key:

```
cart.items.count.zero     Your cart is empty
cart.items.count.one      1 item
cart.items.count.other    %{count} items
```

```liquid
{{ "cart.items.count" | t, count: current_cart.items.size }}
```

Sub-keys are `zero`, `one`, `#N` (exact count), `N_M` (inclusive range), `infinity`, `other`. First
match wins and `other` must always be present. There is **no `pluralize` filter** to reach for
instead. Full resolution order: `storeconnect-liquid` → `references/filters.md` → `t`.

**Import trap:** a purely numeric final segment becomes an array index and corrupts the group.
An exact-count key needs the hash prefix: `cart.items.count.#2`, never `cart.items.count.2`.

**Format note:** theme *source* directories use nested JSON (`translations/<locale>.default.json`);
the zip-import channel uses a flat `Key,Value` CSV (`translations/<locale>.default.csv`), imported
into `Locale_Translation` records. Confirm which format your tooling expects before converting.

## Theme file structure for local development

```
my-theme/
├── variables.csv              # Key,Value - theme variable overrides
├── translations/
│   └── en.default.csv         # Key,Value - translation overrides
├── templates/
│   ├── layouts/
│   ├── pages/
│   ├── blocks/
│   ├── snippets/
│   ├── controllers/
│   ├── components/            # NOT imported by the zip importer
│   ├── helpers/               # NOT imported by the zip importer
│   └── resources/
│       ├── src/               # source - do not ship
│       └── dist/              # compiled output + manifest.json
└── assets/
    └── theme-supplement.css   # and .js, images, fonts
```

Ship override files only. Never commit or ship `node_modules/`, `src/` output, empty directories, or
copies of base-theme files you have not changed.

`controllers.csv` in an exported theme root is the **export** artifact listing valid
controller/action pairs. The zip importer ignores it entirely; it is not required in an import
bundle.

## Theme zip import

The theme importer accepts four component types and silently ignores everything else. Its limits
are load-bearing, and each one produces a broken theme rather than an error.

| Accepted | Rule |
|---|---|
| Assets | anything under `assets/` **except `.scss`**. Uploaded to the asset CDN; the record stores the resulting URL |
| Templates | `templates/**/*.liquid`, plus under `templates/resources/dist/`: `manifest.json` by name, and files in `dist/files/`, `dist/scripts/`, `dist/styles/` whose extension is one of `css js json liquid scss svg` |
| Translations | `translations/*.csv` |
| Variables | exactly one root-level CSV whose filename contains `variables` |

### What it silently drops

1. **`templates/components/**` and `templates/helpers/**` are not imported.** They are not in the
   importer's directory allowlist, so component and helper overrides are skipped without a warning.
   Push them separately after import, or the pages that use them error.
2. **Chunked resource parts are not imported.** A part file's extension is `part0`, `part1`, … which
   is not in the allowed extension list. Push the parts separately. See
   [assets-and-build.md](assets-and-build.md) → "Oversized resources".
3. **A file over 131,072 characters is truncated, not split.** The Apex handler cuts the content
   field at the limit. The resulting record looks present and serves a broken file.
4. **Any path containing the text `git` or `__MACOSX` is rejected.** The check is a plain substring
   test with no path-segment boundary, so a wrapper directory or zip named `legit`, `digital`, or
   anything else containing `git` makes **every** file fail with "Valid theme files (and
   directories) could not be found". Name the wrapper without that substring.
5. **An `asset_url` file must live under `assets/`.** A file that ends up in `dist/` but is loaded
   with `asset_url` gets no asset record, so `asset_url` returns `unknown asset: <key>` and the
   browser requests that literal string. Either move the file under `assets/` or load it with
   `{% require %}` instead.

Payloads are chunked at 2.5 MB per request during upload; that is a transport detail, not a size
limit on the theme.

## Asset and script load order

From the base `layouts/theme`, in emitted order:

```
<head>
  csrf meta -> csp meta -> render "content_security_policy_header"
  -> render "meta_data" -> render "organization_data" -> favicon links
  -> require "styles/theme.css"          (base CSS pack)
  -> {{ theme_supplement_stylesheet }}   (theme-supplement.css)
  -> store custom styles                 (global_css_url as a <link>, ELSE global_css inline)
  -> render "styles"                     (Style Blocks, ordered by Position)
  -> require "scripts/configure.js", "scripts/metadata.js", "scripts/theme.js"
  -> {{ theme_supplement_javascript }}   (theme-supplement.js)
  -> store custom JavaScript inline
  -> render "scripts"                    (Script Blocks)
  -> {{ sc_support }}
  -> render "store/head"                 (Store Head content block)
  -> render "events"                     (analytics hooks)
<body id="{{ id }}" data-sc-controller data-sc-action {{ data }}>
  {{ theme_bar }}
  render "header" -> main#SC-Main[ render "flash", render "privacy", {{ body_content }} ]
  -> render "store/selector" -> render "footer" -> render "store/body"
```

This order answers most "why is my override losing" questions: the supplement always loads after
the base pack, store custom styles after the supplement, Style Blocks after those, and the Store
Head content block last in `<head>`.

One trap: **store custom styles are emitted as a `<link>` when a cacheable URL is available and
inline only otherwise.** They are never emitted twice, so do not assume you can rely on the inline
`<style>` block being present.

## Theme preview

Use `sc theme preview` only for a draft created by `sc theme push`, or use the
connected StoreConnect preview tool for its own staged change. Open the URL it
returns without modifying it. A direct Salesforce-record fallback needs the
current preview procedure supplied by the authorized operator; stop if none is
available. Do not construct preview parameters or infer session behavior from an
old URL. Treat preview URLs as sensitive and temporary, and request a fresh one
when needed.

Supported preview tooling may add its own controls to the rendered page. Account
for that tool-added interface when running Lighthouse or an accessibility audit,
and verify the approved live theme separately.
