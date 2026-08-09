# StoreConnect Liquid API Reference (compact overview)

Quick orientation across globals, key Drops, tags, filters, and forms. Detailed references live alongside this file: [drops.md](drops.md), [tags.md](tags.md), and [filters.md](filters.md). Form types live in the `storeconnect-forms` skill. Confirm version-sensitive behavior in the current StoreConnect support documentation and target store.

## Contents

- [Global variables](#global-variables)
- [Key objects and properties](#key-objects-and-properties)
- [Commerce drops](#commerce-drops-quick-reference)
- [Complete object index](#complete-object-index)
- [Liquid tags](#liquid-tags)
- [Query tag](#query-tag)
- [Liquid filters](#liquid-filters)
- [Liquid forms](#liquid-forms--form--)
- [On-demand JSON rendering](#on-demand-json-rendering)

## Global Variables

| Variable | Type | Description |
|----------|------|-------------|
| `current_store` | Store | The current store |
| `current_cart` | Cart | The visitor's cart. **There is no `cart` alias** — a bare `cart` renders blank. |
| `current_customer` | Contact | Logged-in customer (nil if anonymous). **Typed as a Contact drop** — there is no separate "Customer" object |
| `current_account` | Account | Customer's account |
| `current_membership` | Membership | Customer's membership (nil if none) |
| `current_pricebook` | Pricebook | Active price book for this customer/store |
| `current_request` | Request | HTTP request data (`.path`, `.params`, `.canonical_url`, geolocation) |
| `current_checkout_step` | String | Current checkout step name |
| `current_order` | Order | Order on order confirmation page |
| `current_product` | Product | Product on product page |
| `current_product_category` | ProductCategory | Category on category page |
| `current_page` | Page | Page on static page |
| `current_article` | Article | Article on article page |
| `current_article_category` | ArticleCategory | Category on article-category page |
| `current_search` | Search | Search state. Populated on exactly four page types — store search, product listing, product category, location finder — and nil elsewhere. The available fields and result collections differ per page; see search-system.md before using it. |
| `current_breadcrumbs` | List[Breadcrumb] | Breadcrumb trail |
| `current_flash` | Flash | Flash messages |
| `current_privacy` | Privacy | Cookie-consent state |
| `current_events` | List[CustomerEvent] | Analytics events (`cart.add`, `purchase`) — consume with `{% process_event %}` |
| `current_delivery_options` | DeliveryOptions | Delivery windows/options in checkout |
| `current_booking_availability` | BookingAvailability | Booking slot picker data |
| `current_subscription` | Subscription | Subscription on subscription pages |
| `current_custom_form_submission` | CustomFormSubmission | On form-submission pages |
| `current_location` / `current_location_group` | Location / LocationGroup | Location pages |
| `current_outlet` | Outlet | Outlet set for this session. Not POS-only — a storefront controller can set it with the `outlet.set` action, and it then drives outlet stock and outlet price book. Nil when none is set. |
| `theme_variables` | Hash | Theme variable key-values (`theme_variables['key.name']`) |
| `store_variables` | Hash | Store variable key-values — only records with **"Available in Liquid"** checked; same-key store variable overrides a theme variable |
| `session_variables` | Hash | Session key-values (set via `{% session %}`) |
| `content_block` | ContentBlock | Available in block templates |
| `all_content_blocks` | Lookup[ContentBlock] | By `s_c__Identifier__c` (e.g. `all_content_blocks['home-videos']`) |
| `all_pages` | Lookup[Page] | **Key: path** (not slug) |
| `all_articles` | Lookup + PaginatedList[Article] | Iterable list; also keyed by **path** |
| `all_article_categories` | Lookup[ArticleCategory] | **Key: path** (e.g. `all_article_categories['help-documentation']`) |
| `all_products` | Lookup[Product] | **Key: slug** |
| `all_product_categories` | Lookup[ProductCategory] | **Key: path** |
| `all_menus` | Lookup[Menu] | **Key: identifier** |
| `all_media` | Lookup[Medium] | **Key: identifier** |
| `all_countries` | List[Country] | Country reference data |
| `all_custom_forms` | Lookup[CustomForm] | **Key: sfid** |

Every `all_*` lookup also accepts an `sfid` as a fallback key, so
`all_products['01t…']` works as well as `all_products['hiking-boots']`.

Controller `{% variables %}` values also become top-level names, alongside
`session_variables` / `store_variables` / `theme_variables`.

> **Every `all_*` collection is paginated.** `{{ all_products.size }}` returns the true total,
> but `{% for p in all_products %}` renders **nothing** until a `{% paginate %}` tag or the
> `paginate` filter fetches a page. Same for `current_search.results.*`. See
> [runtime-gotchas.md](runtime-gotchas.md).

## Key objects and properties

Use documented Drop attributes. Unknown attributes on typed Drops can fail a render; use `{{ drop | try: 'attr' }}` only for a genuinely optional value.

### Store (`current_store`)
- Identity: `.name`, `.url` (complete root URL — current platform versions), `.path`, `.timezone`
- Paths: `.home_path`, `.cart_path`, `.carts_path`, `.checkout_path`, `.account_path`, `.login_path`, `.logout_path`, `.orders_path`, `.search_path`, `.subscriptions_path`, `.fulfillments_path`, `.forgot_password_path`, `.account_credits_path`, `.account_points_path`, `.product_approvals_path`
- Chrome: `.logo` (Media → `.url`), `.favicon`, `.header_menu` / `.footer_menu` (Menu → `.render`), `.header` / `.footer` / `.head_content` / `.body_content` (ContentBlock → `.render`, nil if unset)
- Config: `.currency_code`, `.currency_symbol`, `.locale`, `.navigation_categories`, `.display_points?`, `.has_promotions?`, `.has_vouchers?`, `.pickup_enabled?`, `.shipping_enabled?`
- There is **no `.link`** property. `.url` exists on current versions — verify on the target store before relying on it; the portable storefront-link pattern is still `home_path` + guard (see the liquid SKILL).

### ContentBlock (`content_block`)
- `.title`, `.subtitle`, `.content` (rich text from Content_Markdown), `.summary_content` (not `.summary`), `.pull_text`, `.identifier`, `.template`, `.alignment`, `.layout_style`
- Media: `.image`, `.video`, `.document`, `.file`, `.medium` (not `.media`) — each → `.url`
- CTA: `.link_label`, `.link_target`
- Associations: `.children`, `.articles`, `.pages`, `.products`, `.product_categories`
- Custom fields: `.data['Field__c']`

**Surfacing a content block on a page** — write a row in the relevant junction object:

| Junction object | Connects ContentBlock to |
|---|---|
| `s_c__Content_Blocks_Pages__c` | Page |
| `s_c__Content_Blocks_Articles__c` | Article |
| `s_c__Content_Blocks_Children__c` | ContentBlock (nesting) |
| `s_c__Content_Blocks_Products__c` | Product |
| `s_c__Content_Blocks_Product_Categories__c` | ProductCategory (fields: `s_c__Cntnt_Blk_Id__c` + `s_c__Category_Id__c`) |

> **No ArticleCategory junction exists.** To surface category-scoped content, resolve the category at render time via `all_article_categories['<path>']` (custom lookup field + CDM if you need a configurable link).

### Page (`current_page`)
- `.title`, `.subtitle`, `.identifier` (not `.slug`), `.path`, `.url`, `.position`
- `.body_content` (not `.body`), `.content_blocks`
- Hierarchy: `.parent_page`, `.children`, `.navigation_children`

### Article
- `.title`, `.subtitle`, `.identifier` (the slug accessor — `.slug` does NOT exist and renders blank), `.path`, `.url`, `.canonical_url`
- Content: `.body_content`, `.plain_body_content`, `.raw_body_content`, `.introduction_content`, `.summary_content` (NOT `.body`/`.intro`/`.summary`)
- Meta: `.author`, `.publish_on`, `.published?`, `.hero_image`
- Associations: `.category`, `.canonical_category`, `.related_articles`
- Custom fields: `.data['Field__c']`

### Menu / MenuItem
- Menu: `.identifier`, `.menu_items` (not `.items`), `.style_classes`, `.render`
- MenuItem: `.link_label`, `.link_type`, `.url` (not `.path`), `.image`, `.menu_items` (children — not `.children`), `.position`, `.style_classes`, plus one lookup each of `.page`/`.product`/`.product_category`/`.article`/`.article_category`

### Customer (`current_customer` — a Contact drop)
- `.name`, `.firstname`, `.lastname` (use these; don't split `.name`), `.email`, `.mobile_phone`, `.account`
- `.orders`, `.carts`, `.subscriptions`, `.fulfillments`, `.membership`, `.payment_methods`
- `.has_login?`, `.sso_provider`, `.can_use_account_credit?`, `.can_use_account_points?`
- Custom fields: `.data['Field__c']`

### Account (`current_account`)
- `.name`, `.orders`, `.account_credits`, `.account_points`, `.pricebook`, `.membership`, `.pay_by_account?`, `.credit_hold?`, billing/shipping address parts (`.billing_street`, …), `.product_approvals`, `.data`

### Image
- `.url` (default size), `.alt_text`, `.description`, `.file_type`, `.id`, `.data`
- Sized URLs — the only way to request a specific size. Each is a bounded box; aspect ratio is preserved:
  `.pico_url` 16, `.icon_url` 32, `.tiny_url` 50, `.small_url` 100, `.thumb_url` 240,
  `.medium_url` 480, `.large_url` 640, `.huge_url` 1024, `.massive_url` 2048
- **There is no `.alt`, `.width` or `.height`.** All three render blank. Use `.alt_text`, and set intrinsic dimensions from the size you requested.

```liquid
<img src="{{ product.image.medium_url }}"
     alt="{{ product.image.alt_text | default: product.name }}"
     loading="lazy" width="480" height="480">
```

Pick the smallest size that fits the slot: `thumb_url` for a cart line, `medium_url` for a
grid card, `large_url` or `huge_url` for a product hero. Add `loading="lazy"` to everything
below the fold. Serving `massive_url` into a 200px card is the single most common storefront
performance defect.

### Medium (`all_media['identifier']`)
- `.url`, `.download_url`, `.alt_text`, `.description`, `.name`, `.file_type`, `.id`, `.data`
- Typed sub-drops, each nil unless `file_type` matches: `.image`, `.video`, `.document`, `.file`
- Predicates: `.image?`, `.video?`, `.document?`, `.file?`

`video.embed_url`, `video.thumb_url` and `video.type` are populated only for YouTube and Vimeo
links. For an uploaded video file they are nil even though `.video?` is true.

## Commerce Drops quick reference

| Drop | Most useful attributes |
|---|---|
| **Product** (`current_product`, `all_products['slug']`) | `name`, `slug`, `identifier`, `path`/`url`, `image`/`images`, `pricing` (→ ProductPricing), `variants`, `variant_options`, `variant_types`, `master`/`master?`, `categories`, `brand`, `tags`, `traits`/`trait_groups`, `can_purchase?`, `can_add_to_cart?`, `out_of_stock?`, `track_inventory?`, `total_available_to_sell`, `is_bundle?`, `bookable?`, `subscription?`, `summary_content`, `specifications_content`, `support_content`, `related_products`, `data` |
| **ProductPricing** (`product.pricing`) | `price`, `sale_price`, `on_sale?`, `has_price?`, `hide_price?`, `price_excl_tax`, `price_range`, `points`, `purchase_points`, `earn_points`, `use_points?`, `deposit_required?`, `deposit_amount`, `subscription_term`, `subscription_total_price`, `tax_inclusive?`, `variable_pricing?` |
| **Cart** (`current_cart`) | `items`, `item_count`, `sub_total` (not `subtotal`), `total`, `total_payable`, `total_discount`, `taxes`, `shipping_cost`, `shipping_rates`, `shipping_address`, `billing_address`, `applied_coupon_codes`, `applied_vouchers`, `applied_credits`, `promotions`, `pickup_options`, `require_delivery_method?`, `bookable_items`, `contact`, `data` |
| **CartItem** | `product`, `pricing` (per-unit price = `pricing.price` — **no `unit_price`/`line_total` on items**; line total payable now is `total_payable`, current platform versions), `quantity`, `min_quantity`/`max_quantity`, `name`, `delete_path`, `bundle_items`, `bookable_event`, `delivery_date`, `available_delivery_windows`, `data` |
| **Order** (`current_order`, `current_customer.orders`) | `order_number` (not `identifier`), `status`, `ordered_at`, `items`, `item_count`, `sub_total`, `total`, `total_tax`, `total_shipping`, `total_paid`, `payments`, `fulfillments`, `shipping_address`, `billing_address`, `collection_point`, `subscriptions`, `path`/`url`, `reorder_path`, `contact`, `account`, `data` |
| **Subscription** (`current_subscription`, `customer.subscriptions`) | `status`, `product`, `price`, `start_date`/`end_date`, `next_due_date`, `renewal_date`, `payment_overdue?`, `can_pay_now?`, `payment_path`, `cancellable?`, `payments`, `order`, `path`/`url` |
| **Promotion** (`cart.promotions`) | `name`, `code`, `valid?`, `usage_count`/`usage_limit`, `starts_at`/`expires_at`, `actions`, `scopes`, `campaign`; v2 promotions surface via `cart.promotions_v2` (CartPromotion2 → Promotion2; current platform versions) |
| **Voucher** | `code`, `current_balance`, `expires_at`, `requires_activation?`, `orders` |
| **Booking / BookableEvent** | booking: `status`, `starts_at`/`ends_at`, `attendees`, `max_attendees`, `bookable_event`, `order_item`; event: `name`, `location`, `start_datetime`/`end_datetime`, `single_day?` |
| **DeliveryOptions** (`current_delivery_options`) | `delivery_windows`, `delivery_window`, `selected_date`, `selected_day`, `cart_item` |
| **CollectionPoint** | `name`, `description`, `latitude`/`longitude`, `phone`, `lead_time?`, `lead_time_duration`, `stock_location`, `zone`, `active?` |
| **Membership** (`current_membership`) | `name`, `pricebook`, `products`, `product_category`, `articles`, `pages`, `accounts` |
| **Pricebook** (`current_pricebook`) | `currency`, `default_earn_rate`, `default_purchase_rate`, `tax_method`, `standard?`, `pricebook_entries` |
| **Request** (`current_request`) | `path`, `local_path`, `fullpath`, `url`, `base_url`, `canonical_url`, `canonical_path`, `params`, `host`, `protocol`, `query_string`, `page_number`, `store_path`, `content_type` |

## Complete object index

The alphabetical index and full attribute tables are in [drops.md](drops.md). Re-check current StoreConnect documentation when the platform version changes. (No `Customer`, `LineItem`, or `Collection` Drops exist — those are Shopify names.)

## Liquid Tags

### StoreConnect-specific

```liquid
{%- cache "article-card", items: [article, current_store, display_mode] -%}...{%- endcache -%}
{%- render "snippet_name", variable: value %}
{%- component "component-name", reload: "event1 event2" %}
{%- require "scripts/menu.js" %}          {# load-once; multiple: true to allow dupes #}
{%- query 'ObjectName' as var, field: 'value' -%}
{%- session key: "value" %}               {# read back via session_variables["key"] #}
{%- paginate collection by 12 -%}...{% render "shared/pagination-nav", paginate: paginate %}{%- endpaginate -%}
{%- variables key: "value" %}             {# controllers only #}
{%- context key: value %}
{%- new List foo = ['a', 'b'] -%}         {# multi-line literals unreliable — see gotchas #}
{%- struct origin = "distance", ... -%}   {# distance queries — see query-tag.md #}
{%- layout 'account' -%}                  {# swap the layout for this render #}
{%- process_event event -%}...{%- endprocess_event -%}  {# analytics events: loads data, marks handled (fires once) #}
{%- update record, field: 'X__c', value: v -%}  {# controller/form contexts only — see gotchas #}
{%- form 'form-name' %}...{% endform %}
```

Also available in supported contexts: `api`, `action`, `default`, `debug`, `timer`, and `resource_path`. Controller templates can use the documented `before`/`after`/`final` phases and `params`/`respond`/`redirect` tags; see `storeconnect-controllers`.

### Standard Liquid
`if/elsif/else`, `unless`, `for`, `case/when`, `assign`, `capture`, `comment`, `increment`, `decrement`, `raw`

## Query tag

**Authoritative reference: [query-tag.md](query-tag.md).** Critical rules:

- **No store scoping is applied.** Every query needs its own Store condition, or it returns other stores' records.
- Condition keys are **lowercase column names**, checked case-sensitively. `isactive`, not `IsActive`.
- The object name *is* case-insensitive. An object name that does not resolve is a silent nil, not an error.
- Use `sfid:` for a Salesforce record ID, `s_c__sc_id__c:` for the StoreConnect external ID.
- `order by` must be quoted (unquoted is a parse error that blanks the template); only real columns or a distance alias are orderable — not mapped custom fields.
- Custom fields: `data.<field>__c:` on standard/managed objects (exact, case-sensitive, no wildcards or operators); bare mapped names on merchant custom objects (case-insensitive, wildcards and arrays work). The two are not interchangeable.
- AND-only; union via two queries + `concat | uniq`. No `limit:`, no joins, no aggregates.
- Read fields lowercase: `record.s_c__slug__c`; `record.custom_data.<field>__c` for mapped fields; `record | cast: 'Product'` for the typed Drop.
- Prefer Drops whenever one exposes the data; query only when necessary and keep it selective and store-scoped.

## Liquid Filters

### Theme
`t` (translations, supports vars: `{{ "greeting" | t: name: x }}`), `asset_url`

### Collections / lists
`group_by`, `pluck`, `sample: N` (**count argument required** — returns an array; chain `| first` for one), `try` (**optional attribute access on Drops**), `paginate`, `depaginate`, `json`/`serialize`, `sum`, `contains`, `except`, `only`, `insert`, `shift`, `pop`, `unshift`, `push`, `intersection`, `union`, `difference`, `compact`, `concat`, `first`, `join`, `last`, `map`, `reverse`, `size`, `slice`, `sort`, `sort_natural`, `uniq`, `where`, `find`, `find_index`, `has`, `reject`

### Dates
`datetime`, `now`, `time_ago`, `time_duration`, `today`, `date`, `date_add`

### Maps
`keys`, `merge`, `set_key`, `unset_key`, `collect_keys`, `rename_keys`

### Numbers
`abs`, `at_least`, `at_most`, `ceil`, `divided_by`, `floor`, `minus`, `modulo`, `plus`, `round`, `times`, `money`, `points`, `number`

### Records
`cast: '<DropName>'` (untyped record → typed Drop; the name is case-insensitive; an unknown
name returns nil and reports an error), `recordize` (typed Drop → untyped record),
`record_fields` (a record's readable column names — **only works on a record**, returns empty
on a typed Drop; pair with `recordize`), `record_name` (the database **table** name, such as
`product2`, not the Drop name). `record_relationships` currently always returns empty.

### Text
`match`, `append`, `capitalize`, `downcase`, `escape`, `escape_once`, `lstrip`, `newline_to_br`, `prepend`, `remove`, `remove_first`, `remove_last`, `replace`, `replace_first`, `replace_last`, `rstrip`, `slice`, `split`, `strip`, `strip_html`, `strip_newlines`, `truncate`, `truncatewords`, `upcase`, `url_decode`, `url_encode`, `base64_encode`/`base64_decode` (+url-safe variants), `j`, `unescape`, `parameterize`, `deserialize`, `markdown` (sanitized HTML on supported versions). Record/page/article rich content still renders through the Drops' `*_content` accessors

### URLs / Videos / Utilities
`params`; `youtube`, `vimeo`; `default`

## Liquid Forms (`{% form '<name>' %}`)

Use only a registered form name. Check the current options, fields, and actions in the `storeconnect-forms` skill:

**Accounts:** accept-invitation, account, account-missing-details, forgot-password, register, resend-confirmation, reset-password
**Cart:** add-to-cart, add-bundle-to-cart, cart, add-preset-bundle
**Checkout:** checkout-customer-information, checkout-shipping-information, checkout-accept-terms, payment, payment-not-required, apply-promo-code, remove-promo-code, apply-voucher, apply-provider-voucher, remove-voucher, activate-voucher, apply-account-credit, remove-account-credit, checkout-set-password
**Session:** login, sso-login, single-sign-on
**Forms:** custom-form
**Payments:** update-subscription-payment-details, subscription-payment, add-payment-method, embedded-save-payment-method, update-payment-method, remove-payment-method, additional-payment-billing-address
**Geolocation:** geolocation-select, geolocation-dismiss
**Privacy:** privacy-accept-all, privacy-reject-all, privacy-settings
**Bookings:** booking-attendee-add, booking-attendee-edit

That is the complete set — 43 registered names, all of which exist. Plausible-looking names
that do **not** exist: `contact`, `newsletter`, `update-cart`, `buy-button`, `subscribe`,
`search`. The group headings above are for reading convenience and do not mirror the source
directory layout.

Inside a form block you get `form`, with exactly three attributes:

- `form.fields` — access a field as `form.fields["quantity"]`, **not** `form.quantity`
- `form.errors` — a collection; each entry has `.field`, `.messages`, `.full_messages`, and
  `.field` is `"base"` for form-level errors
- `form.path` — the action path

A field exposes `.name`, `.id`, `.value` (submitted value, falling back to the stored value),
`.original_value` (the stored value), `.required?`, and `.errors` (a **single** error object,
not a list). There is **no `.label`** — supply your own label text or a translation key.

## On-demand JSON rendering

Any store path fetched with `Accept: application/json` returns `{ "html": …, "alert": …, "notice": …, "flash": {…} }` — the documented mechanism for no-reload UX (add-to-cart, live panels) instead of scraping rendered HTML.
