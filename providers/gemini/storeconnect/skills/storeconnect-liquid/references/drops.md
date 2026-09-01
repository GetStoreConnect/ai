# Liquid Drops Reference

Drops are data objects accessible in Liquid templates. They provide a safe, structured way to access application data. All properties are accessed via dot notation: `{{ product.name }}`.

Each Drop has a fixed, declared attribute list. **An attribute that is not on that list renders as an empty string with no error text in the page** — the failure is recorded in the debug Console and nowhere else. So a blank value is never proof the data is missing; verify the name here first. Use `{{ drop | try: 'attr' }}` only for an attribute that is genuinely optional across platform versions, because `try` returns `""` for a typo too.

Treat an attribute absent from this file as nonexistent.

## Contents

- [Key concepts](#key-concepts)
- [Global context](#global-context)
- [Store and request](#store--request)
- [Products](#products)
- [Variants](#variants)
- [Traits](#traits)
- [Cart and orders](#cart--orders)
- [Accounts and customers](#accounts--customers)
- [Content](#content)
- [Search](#search)
- [Media](#media)
- [Fulfillment and delivery](#fulfillment--delivery)
- [Location](#location)
- [Promotions and discounts](#promotions--discounts)
- [Taxes](#taxes)
- [Forms](#forms)
- [Payment](#payment)
- [Booking](#booking)
- [Privacy](#privacy)
- [Utility drops](#utility-drops)
- [Custom data fields](#custom-data-fields)
- [Complete drop index](#complete-drop-index)

The long-tail Drops — promotion detail, account transactions, product components and bundles,
collection points and pickup, location groups and stock locations, outlets and registers,
price book entries, tags, style and script blocks, and the theme/session variable objects —
are in [drops-extended.md](drops-extended.md).

## Key Concepts

- **Properties**: `{{ product.title }}` - Access data fields
- **Collections**: `{% for item in cart.items %}` - Iterate over related items
- **Custom data**: `{{ product.data.custom_field }}` - Access custom fields on any drop

## Global Context

These variables are available in every template:

### Always Available

These variables resolve on every page:

| Variable | Type | Description |
|---|---|---|
| `current_store` | StoreDrop | Store configuration |
| `current_cart` | CartDrop | Shopping cart (nil if no cart created yet) |
| `current_customer` | ContactDrop | Logged-in customer (nil if not logged in) |
| `current_account` | AccountDrop | Customer's account (nil if not logged in) |
| `current_request` | RequestDrop | HTTP request info |
| `current_flash` | FlashDrop | Flash messages |
| `current_pricebook` | PricebookDrop | Active pricebook for the store |
| `current_privacy` | PrivacyDrop | Privacy/cookie consent settings |
| `current_membership` | MembershipDrop | Customer's membership (nil if none) |
| `current_events` | Collection | Customer events |
| `current_outlet` | OutletDrop | Outlet set for this session. Not POS-only: a storefront controller can set it with the `outlet.set` action, after which it drives outlet stock and outlet price book. Nil when none is set. |

### Page-Specific Context

These variables only resolve on their corresponding page type. They are **nil on all other pages** — always check before using.

| Variable | Type | Available On | Page File |
|---|---|---|---|
| `current_product` | ProductDrop | Product detail page | `pages/product.liquid` |
| `current_product_category` | ProductCategoryDrop | Category page | `pages/product_category.liquid` |
| `current_search` | SearchDrop | Store search, product listing, product category, and location finder pages — and nowhere else. Fields and result collections differ per page type. | `pages/search.liquid`, `pages/products.liquid`, `pages/product_category.liquid`, `pages/locations.liquid` |
| `current_page` | PageDrop | Content pages and home page | `pages/page.liquid`, `pages/home.liquid` |
| `current_article` | ArticleDrop | Article detail page | `pages/article.liquid` |
| `current_article_category` | ArticleCategoryDrop | Article category page | `pages/article_category.liquid` |
| `current_order` | OrderDrop | Order confirmation/detail page | `pages/order.liquid` |
| `current_location` | LocationDrop | Location detail page | `pages/location.liquid` |
| `current_location_group` | LocationGroupDrop | Location group/finder page | `pages/locations.liquid` |
| `current_checkout_step` | String | Checkout page | `pages/checkout.liquid` |
| `current_delivery_options` | DeliveryOptionsDrop | Checkout shipping step | — |
| `current_booking_availability` | BookingAvailabilityDrop | Booking availability page | — |
| `current_custom_form_submission` | CustomFormSubmissionDrop | Form submission confirmation | `pages/form_submission.liquid` |
| `current_subscription` | SubscriptionDrop | Subscription management page | `pages/subscription.liquid` |

### Global Collections

| Variable | Type | Lookup Key |
|---|---|---|
| `all_products` | Paginated collection | `slug` |
| `all_product_categories` | Paginated collection | `path` |
| `all_pages` | Paginated collection | `path` |
| `all_articles` | Paginated collection | `path` |
| `all_article_categories` | Paginated collection | `path` |
| `all_menus` | Paginated collection | `identifier` |
| `all_content_blocks` | Paginated collection | `identifier` |
| `all_media` | Paginated collection | `identifier` |
| `all_custom_forms` | Paginated collection | `sfid` |
| `all_countries` | Collection | — |
| `current_breadcrumbs` | Collection | — |

Every `all_*` lookup accepts `sfid` as a fallback key in addition to the key listed.

Lookup with **bracket access** (hyphenated keys break dot access): `{{ all_products['my-slug'].name }}`, `{{ all_menus['header'].menu_items }}`. A lookup miss returns nil silently.

> Everything marked **Paginated collection** contains no rows until `{% paginate %}` or the `paginate` filter fetches a page. `.size` still reports the true total, so a bare `{% for %}` that renders nothing while `.size` is non-zero is this, not missing data.

`current_breadcrumbs` is a collection of BreadcrumbDrop objects for the current page's breadcrumb trail. Used by the `breadcrumbs` snippet.

### Variables

| Variable | Description |
|---|---|
| `session_variables` | Session data (set with `{% session %}`) |
| `store_variables` | Store-level configuration variables (set in CMS) |
| `theme_variables` | Theme variables from `Theme_Variable__c` records in Salesforce, merged on top of built-in defaults |

**`theme_variables`** are key-value pairs stored as `Theme_Variable__c` records associated with the theme. For custom themes, these are set in Salesforce and override the built-in defaults. The built-in theme provides defaults for settings like `products.per_page`, `images.ratio.width`, `articles.per_page`, etc. Access with dot-notation keys: `{{ theme_variables["products.per_page"] }}`.

Built-in theme variable defaults (only used when no custom value is set):

| Key | Default | Description |
|---|---|---|
| `products.per_page` | `12` | Products per page in listings |
| `articles.per_page` | `12` | Articles per page |
| `pages.per_page` | `12` | Pages per page |
| `products.comparisons` | `false` | Enable product comparisons |
| `products.brands` | `true` | Show brands on product cards |
| `products.card.hide_purchase_button` | `false` | Hide add-to-cart on cards |
| `images.ratio.width` | `4` | Default image aspect ratio width |
| `images.ratio.height` | `5` | Default image aspect ratio height |
| `product.variants.selector.buttons.maximum` | `5` | Max variant options before switching to dropdown |
| `product.variants.selector.clear.load_master` | `false` | Load the master product when the variant selection is cleared |
| `product.variants.images.max_variant_images` | `8` | Max variant-specific images shown |
| `checkout.pay_by_account.require_po_number` | `true` | Require PO number for account payments |
| `checkout.delivery_windows.use_days` | `false` | Offer delivery windows by day name instead of date |
| `locations.search.default_distance` | `20` | Default search radius for location finder |
| `locations.search.allow_product_filtering` | `true` | Allow filtering the location finder by product |
| `locations.search.multiple_categories` | `false` | Allow multiple category filters in the location finder |
| `sources.available` | `"products,articles,pages"` | Search source types |
| `sources.default` | `"products,articles,pages"` | Search sources selected by default |
| `sources.user_choice` | `true` | Let the visitor choose which search sources to use |

---

## Store & Request

### StoreDrop

Store configuration and settings.

| Property | Type | Description |
|---|---|---|
| `id` | String | Store ID |
| `name` | String | Store name |
| `code` | String | Store code |
| `domain` | String | Store domain |
| `path` | String | URL path prefix (e.g., `/au`) |
| `locale` | String | Store locale |
| `timezone` | String | Store timezone |
| `currency_code` | String | Currency code (e.g., `"AUD"`) |
| `currency_symbol` | String | Currency symbol (e.g., `"$"`) |
| `logo` | ImageDrop | Store logo |
| `social_image` | ImageDrop | Social media sharing image (used by `meta_data` snippet for `og:image` fallback) |
| `meta_title` | String | SEO title |
| `meta_description` | String | SEO description |
| `meta_keywords` | String | SEO keywords |
| `global_css` | String | Custom CSS (render in `<style>` tags) |
| `global_javascript` | String | Custom JS (render in `<script>` tags) |
| `header` | ContentBlockDrop | Header content block |
| `footer` | ContentBlockDrop | Footer content block |
| `header_menu` | MenuDrop | Header navigation menu |
| `footer_menu` | MenuDrop | Footer navigation menu |
| `navigation_categories` | Collection | Top-level product categories for navigation |
| `payment_providers` | Collection | Available payment providers |
| `campaigns` | Collection | Store campaigns |
| `scripts` | Collection | Global script blocks |
| `home_path` | String | Home page path |
| `cart_path` | String | Cart page path |
| `checkout_path` | String | Checkout path |
| `search_path` | String | Search page path |
| `login_path` | String | Login page path |
| `logout_path` | String | Logout page path |
| `account_path` | String | Account page path |
| `orders_path` | String | Account orders path |
| `forgot_password_path` | String | Forgot password path |
| `shipping_enabled?` | Boolean | Store has shipping enabled |
| `pickup_enabled?` | Boolean | Click & collect enabled |
| `accept_terms_enabled?` | Boolean | Require T&C acceptance at checkout |
| `has_promotions?` | Boolean | Promo codes available |
| `has_vouchers?` | Boolean | Vouchers available |
| `local_login?` | Boolean | Uses username/password login |
| `sso_login?` | Boolean | Uses SSO login |
| `display_currency?` | Boolean | Display prices in currency |
| `display_points?` | Boolean | Display prices in points |
| `data` | Hash | Custom data fields |

Also available on supported versions: `url`, `favicon`, `zone`, `tax_inclusive?`, `max_coupon_codes_per_cart`, `geolocation`, `staff`, `styles`, `voucher_providers`, `terms_conditions_page`, and injected `head_content` / `body_content`.

### RequestDrop

HTTP request information.

| Property | Type | Description |
|---|---|---|
| `path` | String | Request path (includes store path prefix, e.g., `/au/my-path`) |
| `local_path` | String | Request path without store prefix (e.g., `/my-path`) |
| `fullpath` | String | Full path including query string (e.g., `/au/my-path?page=1`) |
| `url` | String | Full URL |
| `host` | String | Hostname |
| `protocol` | String | Request protocol (`http://` or `https://`) |
| `base_url` | String | Store base URL including path prefix (e.g., `https://store.example.com/au`) |
| `canonical_url` | String | Canonical URL for the current page (normalized, used by `meta_data` snippet) |
| `canonical_path` | String | Canonical path without domain |
| `page_number` | Number | Current pagination page number from query string |
| `params` | Hash | Query parameters |
| `query_string` | String | Query string portion of URL (everything after `?`) |
| `store_path` | String | Store path prefix (e.g., `/au`) |
| `content_type` | String | Response content type |

### FlashDrop

One-time messages displayed after actions (e.g., after form submission, redirect).

| Property | Type | Description |
|---|---|---|
| `notice` | String | Notice/success message |
| `alert` | String | Alert/error message |

Both return `""` rather than nil when there is no message, and `""` is **truthy** in Liquid. Guard with `!= blank`, not `{% if %}`:

```liquid
{% if current_flash.notice != blank %}<div class="flash">{{ current_flash.notice }}</div>{% endif %}
```

---

## Products

### ProductDrop

Product data. Available as `current_product` on product pages.

| Property | Type | Description |
|---|---|---|
| `id` | String | Product ID |
| `name` | String | Product name |
| `identifier` | String | Product identifier (alias for slug) |
| `slug` | String | URL slug |
| `path` | String | URL path |
| `url` | String | Full URL |
| `product_code` | String | Product/SKU code |
| `upc` | String | Universal Product Code (used as GTIN in structured data) |
| `condition` | String | Product condition (`"new"` or `"used"`, used in structured data) |
| `summary_content` | String | Short summary HTML |
| `search_description` | String | Search/feed description (used in structured data and merchant feeds) |
| `meta_title` | String | SEO title |
| `meta_description` | String | SEO description |
| `meta_keywords` | String | SEO keywords |
| `social_image` | ImageDrop | Social media sharing image (used by `meta_data` snippet for `og:image`) |
| `pricing` | ProductPricingDrop | Pricing info (price, sale price, tax, points, etc.) |
| `can_purchase?` | Boolean | Can be purchased (accounts for stock, discontinued, availability) |
| `can_add_to_cart?` | Boolean | Can be added to cart |
| `out_of_stock?` | Boolean | Is out of stock |
| `out_of_stock_text` | String | Out of stock message |
| `unavailable_text` | String | Unavailable message |
| `discontinued?` | Boolean | Is discontinued |
| `track_inventory?` | Boolean | Tracks stock levels |
| `total_available_to_sell` | Number | Quantity available |
| `restricted?` | Boolean | Requires approval to purchase |
| `restricted_text` | String | Restriction message |
| `is_bundle?` | Boolean | Is a bundle product |
| `bundle_lead?` | Boolean | Is CPQ bundle lead |
| `available_only_in_bundle?` | Boolean | Only purchasable in bundle |
| `image` | ImageDrop | Primary image |
| `images` | Collection | All images |
| `media` | Collection | All media (images, videos) |
| `videos` | Collection | Product videos |
| `brand` | BrandDrop | Product brand |
| `categories` | Collection | Product categories |
| `tags` | Collection | Tags |
| `variants` | Paginated | Variant products (for master products) |
| `variant_types` | Collection | Variant type definitions |
| `variant_options` | Collection | Variant options |
| `variant_choices` | Collection | Variant choices |
| `variant_images` | Collection | Variant-specific images |
| `variant?` | Boolean | Is a variant (not a master) |
| `master?` | Boolean | Is a master product |
| `master` | ProductDrop | Master product (for variants) |
| `traits` | Collection | Product traits |
| `trait_groups` | Collection | Trait groups |
| `related_products` | Collection | Related products |
| `contained_in_bundles` | Collection | Bundles containing this product |
| `custom_forms` | Collection | Associated custom forms |
| `documents` | Collection | Downloadable documents |
| `features_content` | String | Features HTML |
| `features_label` | String | Features section label |
| `specifications_content` | String | Specifications HTML |
| `specifications_label` | String | Specifications section label |
| `support_content` | String | Support HTML |
| `support_label` | String | Support section label |
| `warranty_content` | String | Warranty HTML |
| `warranty_label` | String | Warranty section label |
| `downloads_content` | String | Downloads HTML |
| `downloads_label` | String | Downloads section label |
| `add_to_cart_text` | String | Add to cart button text |
| `buy_it_now_text` | String | Buy it now button text |
| `maximum_quantity` | Number | Max quantity per order |
| `subscription?` | Boolean | Is a subscription product |
| `bookable?` | Boolean | Is bookable |
| `can_ship?` | Boolean | Can be shipped |
| `can_pickup?` | Boolean | Available for click & collect |
| `pricebook_entry` | PricebookEntryDrop | Pricebook entry for this product |
| `location_groups` | Collection | Location groups |
| `data` | Hash | Custom data fields |

Also available: `supplier_code`, `barcode`, `files`, `variant_media`/`variant_videos`/`variant_documents`/`variant_files`, `variant_title`, `fixed_term_subscription?`, `on_backorder?`, `available_for_pickup?`, `can_request_quote?`, `can_select_quantity?`, `bundle_anchor?`, `bundle_has_sufficient_stock?`, `bundle_price_strategy`, `initial_bundle_total`, `has_nested_bundles?`, `product_components`, `required_component_groups`/`optional_component_groups`, `product_features`, `approval_status`, `current_approved_quantity`, `pending_approval_date`, `shipping_weight`/`shipping_weight_unit`, `shipping_height`/`shipping_length`/`shipping_width`/`shipping_dimensions_unit`, `shipping_methods`, `pickup_locations`, `product_bookable_locations`, `memberships`, `content_blocks`, `outlet_out_of_stock?`, `outlet_total_available_to_sell` (stock at the point-of-sale outlet when an outlet session is active; current platform versions).

> **There is no `price`, no `available`, and no `default_variant` on ProductDrop.** Price lives at `product.pricing.price`; gate purchasability with `can_add_to_cart?`/`can_purchase?`; variants are separate products (pass the selected variant's sfid as the add-to-cart `product_id`).

### ProductPricingDrop

Detailed pricing information for a product. Accessed via `product.pricing`.

| Property | Type | Description |
|---|---|---|
| `price` | Number | Current price (sale price if on sale, otherwise original) |
| `original_price` | Number | Original (non-sale) price |
| `sale_price` | Number | Current sale price |
| `price_excl_tax` | Number | Price excluding tax (only if tax-exclusive pricing) |
| `sale_price_excl_tax` | Number | Sale price excluding tax |
| `price_range` | List | Price range `[min, max]` for master products with variants |
| `checkout_price` | Number | Amount required at checkout |
| `has_price?` | Boolean | Has a price set |
| `hide_price?` | Boolean | Price should be hidden |
| `hide_price_text` | String | Text to display when price is hidden |
| `on_sale?` | Boolean | Currently on sale |
| `has_sale_price?` | Boolean | Has a sale price |
| `tax_inclusive?` | Boolean | Price includes tax |
| `points` | Number | Current points price |
| `original_points` | Number | Original (non-sale) points price |
| `has_sale_points?` | Boolean | Has sale points |
| `subscription?` | Boolean | Is a subscription price |

Also available: `deposit_amount`, `deposit_points`, `deposit_required?`, `earn_points`, `bonus_earn_points`, `total_earn_points`, `checkout_earn_points`, `checkout_points`, `purchase_points`, `sale_purchase_points`, `points_sale?`, `points_bonus?`, `can_earn_points?`, `can_purchase_with_currency?`, `can_purchase_with_points?`, `use_currency?`, `use_points?`, `subscription_term`, `subscription_term_count`, `subscription_term_unit`, `subscription_total_price`, `subscription_total_points`, `fixed_term_subscription?`, `variable_pricing?`, `variable_pricing_amounts`, `variable_pricing_min_amount`, `variable_pricing_max_amount`, `variable_pricing_custom_allowed?`, `product`.

### ProductCategoryDrop

Product category/taxonomy. Available as `current_product_category` on category pages.

| Property | Type | Description |
|---|---|---|
| `id` | String | Category ID |
| `name` | String | Category name |
| `title` | String | Category title |
| `subtitle` | String | Category subtitle |
| `identifier` | String | Identifier |
| `path` | String | URL path |
| `url` | String | Full URL |
| `position` | Number | Position in category list |
| `image` | ImageDrop | Category image |
| `social_image` | ImageDrop | Social media sharing image |
| `meta_title` | String | SEO title |
| `meta_description` | String | SEO description |
| `meta_keywords` | String | SEO keywords |
| `google_product_category` | String | Google product category taxonomy ID |
| `introduction_content` | String | Introduction HTML |
| `information_content` | String | Information HTML |
| `products` | Paginated | Products in category |
| `children` | Collection | Child categories |
| `navigation_children` | Collection | Child categories visible in navigation |
| `ancestors` | Collection | Ancestor categories (parent chain) |
| `hidden?` | Boolean | Hidden from navigation |
| `data` | Hash | Custom data fields |

### BrandDrop

Product brand/manufacturer.

| Property | Type | Description |
|---|---|---|
| `id` | String | Brand ID |
| `name` | String | Brand name |
| `logo` | ImageDrop | Brand logo |
| `data` | Hash | Custom data fields |

> There is no `path` on BrandDrop — link to brand listings via a filtered search/category URL instead.

---

## Variants

StoreConnect uses an **n-ary variant system** - products can have any number of variant types (Color, Size, Material, etc.), unlike platforms limited to 2-3 options.

### VariantTypeDrop

A variant dimension (e.g., "Color", "Size"). Iterate `product.variant_types`.

| Property | Type | Description |
|---|---|---|
| `name` | String | Type name (e.g., "Color") |
| `form_value` | String | Code-safe name for form inputs |
| `variant_choices` | Collection | The selectable choices for this type (VariantChoiceDrop) |

### VariantChoiceDrop

One selectable value of a variant type (e.g., "Red").

| Property | Type | Description |
|---|---|---|
| `name` | String | Choice name |
| `label` | String | Display label |
| `value` | String | Choice value |
| `form_value` | String | Code-safe value for form inputs |

### VariantOptionDrop

One purchasable variant product with its type/choice combination. Iterate `product.variant_options`.

| Property | Type | Description |
|---|---|---|
| `variant` | ProductDrop | The variant product |
| `variant_types` | Collection | The type+choice combination that identifies this variant (VariantTypeDrop, each with a single choice) |

Variant selection UI: iterate `product.variant_types`, and for each type iterate `type.variant_choices` (each choice exposes `label`, `value`, `form_value`) — there is no `type.options`.

---

## Traits

### TraitDrop

A product attribute/characteristic.

| Property | Type | Description |
|---|---|---|
| `id` | String | Trait ID |
| `name` | String | Trait name |
| `value` | String | Trait value |
| `unit` | String | Unit (e.g., centimeters) |
| `value_type` | String | Value type (e.g., number, currency, checkbox) |
| `position` | String | Sort position — a **String**, so sort with care rather than assuming numeric ordering |
| `trait_type` | TraitTypeDrop | Trait type definition |
| `trait_category` | TraitCategoryDrop | Trait category |
| `data` | Hash | Custom data fields |

### TraitTypeDrop

A trait type definition.

| Property | Type | Description |
|---|---|---|
| `id` | String | Type ID |
| `name` | String | Type name |
| `unit` | String | Unit for this type |
| `value_type` | String | Value type |
| `display_on_product_page?` | Boolean | Show in the specifications section |
| `data` | Hash | Custom data fields |

### TraitGroupDrop

A group of related traits.

| Property | Type | Description |
|---|---|---|
| `name` | String | Group name |
| `traits` | Collection | Traits in this group (**not `trait_types`**). Filtered to trait types flagged to display on the product page, so this is not every trait in the group. |

### TraitCategoryDrop

A trait category.

| Property | Type | Description |
|---|---|---|
| `id` | String | Category ID |
| `name` | String | Category name |
| `data` | Hash | Custom data fields |

> Group traits by category from the trait side (`trait.trait_category.name`) — neither TraitTypeDrop nor TraitCategoryDrop links downward, and there is no `product.trait_category`.

Render a product's traits with the `show_traits` filter (`{{ current_product | show_traits }}` — falls back to the master's traits for variants without their own).

---

## Cart & Orders

### CartDrop

Shopping cart. Available globally as `current_cart`.

| Property | Type | Description |
|---|---|---|
| `id` | String | Cart ID |
| `items` | Collection | Cart items |
| `item_count` | Number | Total items |
| `sub_total` | Number | Subtotal excluding taxes (where tax is exclusive) |
| `total` | Number | Total including tax |
| `total_tax` | Number | Total tax |
| `shipping_cost` | Number | Shipping cost |
| `total_discount` | Number | Total distributed **point-of-sale** discount (0 for normal online carts — promotion discounts live on `promotions_v2` items, voucher amounts on `applied_vouchers`) |
| `total_paid` | Number | Amount already paid |
| `total_payable` | Number | Amount to be paid at checkout |
| `total_deposit` | Number | Total deposit amount |
| `total_points` | Number | Total points price |
| `total_payable_points` | Number | Points to be paid at checkout |
| `currency_code` | String | Cart currency |
| `contact` | ContactDrop | Cart contact |
| `billing_address` | AddressDrop | Billing address |
| `shipping_address` | AddressDrop | Shipping address |
| `shipping_rates` | Collection | Available shipping rates |
| `pickup_options` | Collection | Pickup options |
| `promotions` | Collection | Applied v1 promotions (PromotionDrop) |
| `promotions_v2` | Collection | Applied v2 promotions (CartPromotion2Drop; current platform versions) |
| `auto_applied_promotions` | Collection | v2 promotions that were auto-applied (CartPromotion2Drop) |
| `applied_coupon_codes` | Collection | v2 promotions applied via coupon code (CartPromotion2Drop) |
| `can_add_coupon?` | Boolean | Cart can accept more coupon codes |
| `discount_amount` / `discount_percentage` / `discount_mode` / `has_pos_discount?` | Mixed | Point-of-sale discount details (register sales) |
| `in_use_by_register` | RegisterDrop | POS register currently using this cart (nil online) |
| `auto_save_payment_method?` | Boolean | Checkout must save a payment method without an immediate charge |
| `applied_vouchers` | Collection | Applied vouchers |
| `applied_credits` | Collection | Applied account credits |
| `payment_provider` | PaymentProviderDrop | Selected payment provider |
| `custom_forms` | Collection | Associated custom forms |
| `taxes` | Collection | Tax lines |
| `bookable?` | Boolean | Has bookable products |
| `quotable?` | Boolean | Has quotable items |
| `test_order?` | Boolean | Is a test order |
| `require_delivery_method?` | Boolean | Requires a delivery method at checkout (shipping enabled AND physical items — prefer this over store-level `shipping_enabled?`) |
| `adjustment_items` | Collection | System adjustment items (shipping charges, surcharges) — always filter these out of `items` when rendering product lines |
| `bookable_items` / `schedulable_items` | Collection | Bookable / delivery-schedulable cart items |
| `bookable_cart_items_valid_until` | DateTime | Booking-timer expiry |
| `all_vouchers` | Collection | All vouchers incl. inactive |
| `payment_surcharge_values` | Collection | Payment surcharges |
| `sub_total_points` / `total_paid_points` / `total_deposit_points` | Number | Points equivalents |
| `currency_payment_required?` / `points_payment_required?` | Boolean | Whether currency/points are due at checkout |
| `total_non_subscriptions` / `total_subscriptions` / `total_fixed_term_subscriptions` | Number | Split totals (each also has a `_points` variant) |
| `shipping_provider_service_name` | String | Shipping service name |
| `total_shipping_weight_kg` / `total_shipping_weight_lb` | Number | Total shipping weight |
| `created_at` | DateTime | Creation timestamp |
| `select_path` | String | Path to select/switch to this cart |
| `data` | Hash | Custom data fields |

> **There is no `empty?` on CartDrop** (test `current_cart == blank or current_cart.items.size == 0`).

### CartItemDrop

A line item in the cart.

| Property | Type | Description |
|---|---|---|
| `id` | String | Cart item ID |
| `product` | ProductDrop | The product |
| `pricing` | ProductPricingDrop | Line item pricing |
| `quantity` | Number | Quantity |
| `min_quantity` | Number | Minimum quantity |
| `max_quantity` | Number | Maximum quantity |
| `name` | String | Item name (falls back to product name) |
| `reserved_product?` | Boolean | Is a reserved (non-catalog) product |
| `delete_path` | String | URL to delete this item |
| `edit_bundle_path` | String | URL to edit the bundle (if in one) |
| `bundle_items` | Collection | Items in bundle (if bundle) |
| `bundle_lead?` | Boolean | Is bundle lead item |
| `in_bundle?` | Boolean | Is part of a bundle |
| `bundle_has_bookable_components?` | Boolean | Bundle contains bookables |
| `has_nested_bundle_items?` | Boolean | Has nested bundle items |
| `bookable?` | Boolean | Is bookable product |
| `bookable_event` | BookableEventDrop | The booked event |
| `custom_forms` | Collection | Associated custom forms |
| `shipping_methods` | Collection | Valid shipping methods |
| `pickup_options` | Collection | Valid pickup locations |
| `available_delivery_dates` / `available_delivery_days` / `available_delivery_windows` | Collection | Delivery scheduling options |
| `delivery_date` | DateTime | Selected delivery date |
| `delivery_day` | String | Selected delivery day |
| `delivery_time` | String | Selected delivery timeslot |
| `shipping_weight` / `shipping_weight_unit` / `shipping_height` / `shipping_length` / `shipping_width` / `shipping_dimensions_unit` / `total_shipping_weight` | Mixed | Shipping dimensions |
| `total_payable` | Number | Total the customer pays now for this line (quantity included; current platform versions) |
| `deposit_amount` | Number | Per-unit deposit amount |
| `total_deposit` | Number | Total deposit (deposit_amount × quantity) |
| `deposit_required?` | Boolean | Line requires a deposit |
| `deposit_payment_mode` | String | `specify_amount` / `specify_percentage` / `all` / `none` |
| `amount_paid` | Number | Always 0 on cart items (parity with order items) |
| `taxes` | Collection | Per-jurisdiction tax lines (ItemTaxDrop: `name`, `rate`, `amount`) |
| `has_pos_discount?` | Boolean | Has a point-of-sale discount applied |
| `data` | Hash | Custom data fields |

> **There is still no `unit_price` or `line_total` on CartItemDrop** — the per-unit price is `item.pricing.price`; the line total the customer pays now is `item.total_payable`. `item.amount_paid` exists for parity with OrderItemDrop but is always 0 on a cart.

### OrderDrop

A completed or pending order. Available as `current_order`.

| Property | Type | Description |
|---|---|---|
| `id` | String | Order ID |
| `order_number` | String | Display order number |
| `reference` | String | Unique reference number |
| `status` | String | Order status |
| `items` | Collection | Order items |
| `item_count` | Number | Total items |
| `sub_total` | Number | Subtotal with exclusive taxes |
| `total` | Number | Total including tax |
| `total_tax` | Number | Total tax |
| `total_shipping` | Number | Shipping total |
| `total_discount` | Number | Total distributed **point-of-sale** discount (0 for normal online orders) |
| `total_paid` | Number | Amount already paid |
| `total_payable` | Number | Amount still owed |
| `total_deposit` | Number | Total deposit amount |
| `currency_code` | String | Order currency |
| `contact` | ContactDrop | Order contact |
| `account` | AccountDrop | Customer account |
| `billing_address` | AddressDrop | Billing address |
| `shipping_address` | AddressDrop | Shipping address |
| `fulfillments` | Collection | Fulfillments/shipments |
| `payments` | Collection | Payments |
| `bookings` | Collection | Bookings |
| `subscriptions` | Collection | Subscriptions |
| `custom_forms` | Collection | Associated forms |
| `taxes` | Collection | Tax line items |
| `ordered_at` | DateTime | Order placement date |
| `path` | String | URL path |
| `url` | String | Full URL |
| `reorder_path` | String | Path to reorder |
| `additional_payment_path` | String | Path for additional payment |
| `checkout_email` | String | Email used at checkout |
| `checkout_phone` | String | Phone used at checkout |
| `customer_notes` | String | Customer notes from checkout |
| `shipping_notes` | String | Shipping notes from checkout |
| `bookable?` | Boolean | Has bookable products |
| `test_order?` | Boolean | Is a test order |
| `deposit_owing?` | Boolean | Has unpaid deposits |
| `data` | Hash | Custom data fields |

Also available: `amount_due_now`, `sub_total_excl_tax`, `adjustment_items`, `surcharge_items`, `assisted_by` (StaffDrop), `bill_to_contact`, `ship_to_contact`, `outlet`, `quotable?`, the deprecated flat address fields `billing_address_lines` / `shipping_address_lines` and `billing_street`/`billing_city`/`billing_state`/`billing_postal_code`/`billing_country` plus their `shipping_*` counterparts (**prefer `billing_address` / `shipping_address`, which return AddressDrops**), `checkout_shipping_email` / `checkout_shipping_phone`, `checkout_step`, `collection_point` / `collection_time`, `original_order`, `refund_orders`, `subscription_order`, `has_deposit_items?`, `has_pos_discount?`, `assisted_by_name`, `pricebook`, `store`, `bookable_items`, `collect_booking_attendees?`, `total_earn_points_amount`, points variants of the totals, `total_remaining_subscriptions`.

### OrderItemDrop

A line item in an order.

| Property | Type | Description |
|---|---|---|
| `id` | String | Order item ID |
| `product` | ProductDrop | The product |
| `pricing` | ProductPricingDrop | Line item pricing |
| `quantity` | Number | Quantity |
| `name` | String | Product name |
| `unit_price_incl_tax` | Number | Unit price including tax |
| `unit_price_excl_tax` | Number | Unit price excluding tax |
| `amount_paid` | Number | Amount already paid |
| `total_payable` | Number | Remaining balance |
| `deposit_amount` | Number | Deposit amount (includes quantity) |
| `deposit_required?` | Boolean | Requires deposit |
| `deposit_payment_mode` | String | Deposit mode (specify_amount, specify_percentage, all, none) |
| `order` | OrderDrop | Parent order |
| `pricebook_entry` | PricebookEntryDrop | Pricebook entry |
| `subscription` | SubscriptionDrop | Subscription (if recurring) |
| `bundle_items` | Collection | Items in bundle |
| `bundle_lead?` | Boolean | Is bundle lead |
| `in_bundle?` | Boolean | Is part of a bundle |
| `bookable?` | Boolean | Is bookable product |
| `custom_forms` | Collection | Associated forms |
| `delivery_date` | DateTime | Selected delivery date |
| `delivery_day` | String | Selected delivery day |
| `delivery_time` | String | Selected delivery timeslot |
| `delivery_window` | DeliveryWindowDrop | Selected delivery window |
| `taxes` | Collection | Per-jurisdiction tax lines (ItemTaxDrop) |
| `reserved_product?` | Boolean | Is a reserved (non-catalog) product |
| `bookable_event` | BookableEventDrop | The booked event |
| `subscription_term_count` | Number | Subscription term count |
| `data` | Hash | Custom data fields |

---

## Accounts & Customers

### AccountDrop

Customer account. Available as `current_account`.

| Property | Type | Description |
|---|---|---|
| `id` | String | Account ID |
| `name` | String | Account name |
| `phone` | String | Phone number |
| `logo` | ImageDrop | Account logo |
| `active?` | Boolean | Account is active |
| `pay_by_account?` | Boolean | Can use pay-by-account |
| `credit_hold?` | Boolean | Account is on credit hold |
| `pricebook` | PricebookDrop | Account-specific pricebook |
| `membership` | MembershipDrop | Associated membership |
| `orders` | Collection | Order history |
| `account_credits` | Collection | Account credits |
| `account_points` | AccountPointsDrop | Loyalty points |
| `product_approvals` | Collection | Product approvals |
| `billing_street` | String | Billing address street |
| `billing_city` | String | Billing address city |
| `billing_state` | String | Billing address state |
| `billing_postal_code` | String | Billing address postal code |
| `billing_country` | String | Billing address country |
| `shipping_street` | String | Shipping address street |
| `shipping_city` | String | Shipping address city |
| `shipping_state` | String | Shipping address state |
| `shipping_postal_code` | String | Shipping address postal code |
| `shipping_country` | String | Shipping address country |
| `billing_address_lines` / `shipping_address_lines` | Collection | Address lines as separate items |
| `brand?` / `location?` / `supplier?` | Boolean | Account role predicates |
| `subdomain` | String | Account subdomain |
| `supplier_notes` | String | Supplier notes |
| `tax_entity_code` | String | Tax entity code |
| `data` | Hash | Custom data fields |

### ContactDrop

Customer/contact person. Available as `current_customer`.

| Property | Type | Description |
|---|---|---|
| `id` | String | Contact ID |
| `firstname` | String | First name |
| `lastname` | String | Last name |
| `name` | String | Full name |
| `email` | String | Email address |
| `username` | String | Login username |
| `phone` | String | Phone |
| `mobile_phone` | String | Mobile phone |
| `account` | AccountDrop | Associated account |
| `membership` | MembershipDrop | Associated membership |
| `has_login?` | Boolean | Has a saved password |
| `can_purchase_for_account?` | Boolean | Can use pay-by-account |
| `can_use_account_credit?` | Boolean | Can use account credit |
| `can_use_account_points?` | Boolean | Can use account points |
| `can_use_account_pricing?` | Boolean | Can use account-specific pricing |
| `orders` | Collection | Order history |
| `carts` | Collection | Resumable carts |
| `fulfillments` | Collection | Fulfillments |
| `subscriptions` | Collection | Subscriptions |
| `campaigns` | Collection | Subscribed campaigns |
| `mailing_street` | String | Mailing address street |
| `mailing_city` | String | Mailing address city |
| `mailing_state` | String | Mailing address state |
| `mailing_postal_code` | String | Mailing address postal code |
| `mailing_country` | String | Mailing address country |
| `mailing_address_lines` | Collection | Mailing address lines as separate items |
| `payment_methods` | Collection | Saved payment methods (PaymentMethodDrop; current platform versions) |
| `default_payment_method` | PaymentMethodDrop | Default saved payment method |
| `last_login_date` | DateTime | Last login timestamp |
| `terms_accepted_on` | DateTime | When terms were accepted |
| `sso_provider` | String | SSO provider name |
| `data` | Hash | Custom data fields |

### AccountCreditDrop

Account credit. Reached via `current_account.account_credits`.

| Property | Type | Description |
|---|---|---|
| `current_balance` | Number | Available credit. **There is no `balance`.** |
| `opening_balance` | Number | Balance when the credit was created |
| `usable?` | Boolean | Whether the credit can be applied now |
| `expires_at` | String | Expiry, ISO 8601 |
| `id`, `name`, `type`, `account`, `created_at`, `path`, `url`, `data` | | |
| `transactions` | Collection | Credit transactions |

### AccountPointsDrop

Loyalty points. Reached via `current_account.account_points`.

| Property | Type | Description |
|---|---|---|
| `current_balance` | Number | Available points. **There is no `balance`.** |
| `pending_balance` | Number | Points earned but not yet available |
| `transactions` | **Paginated** | Points transactions — wrap in `{% paginate %}` or it iterates zero rows |
| `path`, `url` | String | |

No `data` on AccountPointsDrop.

---

## Content

### PageDrop

Content page. Available as `current_page`.

| Property | Type | Description |
|---|---|---|
| `id` | String | Page ID |
| `name` | String | Page name |
| `title` | String | Page title |
| `subtitle` | String | Page subtitle |
| `identifier` | String | The page's path — this is the `all_pages` lookup key, and it is an alias of `path` |
| `path` | String | URL path |
| `url` | String | Full URL |
| `body_content` | String | Rendered page body (Liquid evaluated, Markdown converted). Returns HTML that is deliberately not escaped. |
| `content` | String | The page's **content blocks**, rendered and concatenated. Not the body, and unrelated to Markdown. |
| `plain_body_content` | String | Body with Liquid evaluated but no Markdown conversion |
| `raw_body_content` | String | Body source with neither Liquid nor Markdown evaluated |
| `base_path` | String | Same value as `path` |
| `content_blocks` | Collection | Content blocks belonging to this page |
| `meta_title` | String | SEO title |
| `meta_description` | String | SEO description |
| `meta_keywords` | String | SEO keywords |
| `social_image` | ImageDrop | Social media sharing image |
| `root_page` | PageDrop | Top-level parent page |
| `parent_page` | PageDrop | Direct parent page |
| `children` | Collection | Child pages |
| `navigation_children` | Collection | Child pages visible in navigation |
| `related_pages` | Collection | Related pages |
| `home_page?` | Boolean | Is the store's home page |
| `hidden?` | Boolean | Hidden from navigation |
| `visible?` | Boolean | Visible on the site |
| `requires_login?` | Boolean | Requires login to view |
| `position` | Number | Navigation position |
| `search_keywords` | String | Search keywords |
| `data` | Hash | Custom data fields |

### ArticleDrop

Blog article. Available as `current_article`.

| Property | Type | Description |
|---|---|---|
| `id` | String | Article ID |
| `title` | String | Article title |
| `subtitle` | String | Article subtitle |
| `author` | String | Author name |
| `identifier` | String | Article identifier |
| `path` | String | URL path |
| `url` | String | Full URL |
| `canonical_url` | String | Canonical URL |
| `body_content` | String | Rendered body content (with Markdown) |
| `plain_body_content` | String | Body with Liquid evaluated but no Markdown conversion |
| `introduction_content` | String | Introduction HTML |
| `summary_content` | String | Summary HTML |
| `hero_image` | ImageDrop | Featured image |
| `social_image` | ImageDrop | Social media sharing image (used by `meta_data` snippet for `og:image`) |
| `meta_title` | String | SEO title |
| `meta_description` | String | SEO description |
| `meta_keywords` | String | SEO keywords |
| `search_keywords` | String | Search keywords |
| `content_blocks` | Collection | Associated content blocks |
| `related_articles` | Collection | Related articles |
| `publish_on` | DateTime | Publication date |
| `published?` | Boolean | Whether the article is published |
| `requires_login?` | Boolean | Requires login to view |
| `data` | Hash | Custom data fields |

> There is no `category` on ArticleDrop — the article does not expose its category to Liquid. Link an article to its category listing from `current_article_category` (on article-category pages) or via `all_article_categories`.

### ContentBlockDrop

Structured content block. Available as `content_block` inside block templates; look up by identifier via `all_content_blocks['<identifier>']`.

| Property | Type | Description |
|---|---|---|
| `id` | String | Content block ID |
| `identifier` | String | Unique identifier |
| `title` | String | Block title |
| `subtitle` | String | Block subtitle |
| `content` | String | Body content as rendered rich text (**not `body`**) |
| `summary_content` | String | Summary as rich text |
| `pull_text` | String | Pull text as rich text |
| `sub_type` | String | Sub type (**not `block_type`**) |
| `layout_style` | String | Layout style |
| `alignment` | String | Content alignment |
| `template` | String | Block template name |
| `link_label` | String | Link label (**not `link_text`**) |
| `link_target` | String | Resolved link URL/path (**not `link_url`**) |
| `image` | ImageDrop | Associated image |
| `video` | VideoDrop | Video |
| `file` | FileDrop | File |
| `document` | DocumentDrop | Document |
| `medium` | MediumDrop | Generic media |
| `products` | Collection | Featured products |
| `product_categories` | Collection | Featured categories |
| `pages` | Collection | Featured pages |
| `articles` | Collection | Featured articles |
| `children` | Collection | Nested child blocks (**there is no `items`**) |
| `render` | String | Rendered HTML for the block (calls its template) |
| `data` | Hash | Custom data fields |

> There is no `css_class` and no `images` collection on ContentBlockDrop.

### MenuDrop

Navigation menu. Look up via `all_menus['<identifier>']` or `current_store.header_menu`/`footer_menu`.

| Property | Type | Description |
|---|---|---|
| `id` | String | Menu ID |
| `identifier` | String | Menu identifier |
| `menu_items` | Collection | Top-level menu items (**not `items`**) |
| `style_classes` | String | CSS classes |
| `render` | String | Rendered HTML for the whole menu |
| `data` | Hash | Custom data fields |

### MenuItemDrop

Navigation menu item.

| Property | Type | Description |
|---|---|---|
| `id` | String | Menu item ID |
| `identifier` | String | Identifier |
| `name` | String | Item name (display name) |
| `link_label` | String | Display label resolved from the link type/target (**use this, not `title`**) |
| `link_target` | String | Resolved URL/path for the link (**use this for hrefs**) |
| `link_type` | String | `article` / `article_category` / `page` / `product` / `product_category` / `link` |
| `url` | String | Raw stored URL (populated only for `link`-type items) |
| `menu_items` | Collection | Child menu items (**not `items`**) |
| `child_categories` | Collection | Child categories of the linked object |
| `child_category_levels` | Number | Category levels to show |
| `position` | Number | Sort position |
| `hidden?` | Boolean | Is hidden |
| `show_image?` | Boolean | Should show an image |
| `image` | ImageDrop | Item image |
| `style_classes` | String | CSS classes |
| `menu` | MenuDrop | Parent menu |
| `parent_menu_item` | MenuItemDrop | Parent item |
| `article` / `article_category` / `page` / `product` / `product_category` | Drop | The linked object |
| `data` | Hash | Custom data fields |

> There is no `active?` on MenuItemDrop — compare `item.link_target` to `current_request.path` for active-state styling.

---

## Search

### SearchDrop

Search results and configuration. Available as `current_search` on four page types only — see [search-system.md](search-system.md), which covers the per-page differences. Exactly nine attributes; no `id`, no `data`.

| Property | Type | Description |
|---|---|---|
| `type` | String | Search type: `"products"`, `"articles"`, `"pages"`, or `"locations"` |
| `term` | String | Search term. Always `""` on a location page (no keyword field there). |
| `count` | Number | Result count for the active scope, filters included on a product search. **Nil on a location page.** |
| `per_page` | Number | Results per page |
| `sort` | String | Current sort. Literal `"none"` where the page has no sort field. |
| `path` | String | URL path to re-run this search |
| `url` | String | Full URL to re-run this search |
| `results` | SearchResultDrop | Search results grouped by type |
| `fields` | Map | Filter/sort fields available for this search (case-insensitive) |

### SearchResultDrop

Search results grouped by content type. Exactly four, all **paginated** — wrap in `{% paginate %}` or they iterate zero rows. The drop is not itself iterable; there is no flat list.

| Property | Type | Description |
|---|---|---|
| `products` | Paginated | Product results. Available on store search, product listing and category pages. |
| `articles` | Paginated | Article results. **Store search page only** — raises elsewhere. |
| `pages` | Paginated | Page results. **Store search page only** — raises elsewhere. |
| `locations` | Paginated | Location results. **Location finder page only.** |

### SearchFieldDrop

A search filter or sort field.

| Property | Type | Description |
|---|---|---|
| `id` | String | Stable DOM id, built from the group path — for example `products-filters-brands` |
| `name` | String | The exact HTML input name, for example `filters[brands][]`. Use verbatim. |
| `label` | String | Display label. **Populated only for trait filters**; nil for every other field, so supply your own text. |
| `value` | List for multi-select fields, scalar for single-value fields | Current selection |
| `options` | Collection | Available options |

> There is no `type`, `group`, `default` or `multiple?` on SearchFieldDrop. Test a single-value field's selection with `==`, not `contains` — `contains` is a substring test and marks extra options selected.

### SearchFieldOptionDrop

An option for a search field. Exactly four attributes; no `count` and no `selected?`.

| Property | Type | Description |
|---|---|---|
| `id` | String | `<field id>-<parameterized value>`, for example `brands-acme` |
| `name` | String | The **parent field's** input name — every option in a field shares it |
| `label` | String | Display label. For sort options this is the raw key, so translate it rather than printing it. |
| `value` | String | Option value |

> There is no `count` and no `selected?` on options — test selection with `{% if field.value contains option.value %}`.

See [search-system.md](search-system.md) for the complete search and filtering reference.

---

## Media

### ImageDrop

An image. All sized URLs use `fit` crop — the image is scaled to fit within the max dimensions while preserving aspect ratio. Use `srcset` to let the browser pick the optimal size.

| Property | Type | Description |
|---|---|---|
| `id` | String | Image ID |
| `url` | String | Default image URL |
| `alt_text` | String | Alt text set in CMS |
| `description` | String | Image description |
| `file_type` | String | File type/extension |
| `pico_url` | String | 16x16 — favicons, LQIP placeholders |
| `icon_url` | String | 32x32 — tiny icons |
| `tiny_url` | String | 50x50 — cart line item thumbnails |
| `small_url` | String | 100x100 — small thumbnails |
| `thumb_url` | String | 240x240 — product cards (mobile) |
| `medium_url` | String | 480x480 — product cards (desktop) |
| `large_url` | String | 640x640 — product detail images |
| `huge_url` | String | 1024x1024 — hero images |
| `massive_url` | String | 2048x2048 — retina/HiDPI hero images |
| `data` | Hash | Custom data fields |

Use the size URLs in `srcset` (`thumb_url 240w, medium_url 480w, large_url 640w, huge_url 1024w`) with a `sizes` attribute; the alt-text accessor is `alt_text` (there is no `alt` on ImageDrop).

### VideoDrop

A video. Render with `{{ video.embed_url }}` in an iframe; there is no `title`, `provider`, or `video_id`. `embed_url`, `thumb_url` and `type` are populated only for **linked YouTube and Vimeo** videos — for an uploaded video file all three are nil even though `medium.video?` is true. Guard with `!= blank`.

| Property | Type | Description |
|---|---|---|
| `id` | String | Video ID |
| `url` | String | Original video URL |
| `embed_url` | String | Embed URL, suitable for an `<iframe src>` |
| `thumb_url` | String | Thumbnail image URL |
| `type` | String | Video type (`youtube`, `vimeo`) |
| `key_frame_seconds` | String | Key-frame start position in seconds |
| `data` | Hash | Custom data fields |

### DocumentDrop

A downloadable document/file.

| Property | Type | Description |
|---|---|---|
| `id` | String | Document ID |
| `name` | String | Document name |
| `url` | String | Download URL |
| `file_type` | String | File type |
| `alt_text` | String | Alt text |
| `description` | String | Description |
| `data` | Hash | Custom data fields |

> There is no `file_size` on DocumentDrop.

### MediumDrop

A generic media item that wraps an image, video, document, or file.

| Property | Type | Description |
|---|---|---|
| `id` | String | Medium ID |
| `name` | String | Name |
| `url` | String | Media URL |
| `download_url` | String | URL that forces a browser download |
| `alt_text` | String | Alt text (**not `alt`**) |
| `description` | String | Description |
| `file_type` | String | Underlying type: `image`, `video`, `document`, `file` (**not `media_type`**) |
| `image?` / `video?` / `document?` / `file?` | Boolean | Type predicates |
| `image` / `video` / `document` / `file` | Drop | Typed drop for the underlying media (nil unless `file_type` matches) |
| `data` | Hash | Custom data fields |

---

## Fulfillment & Delivery

### FulfillmentDrop

A shipment/fulfillment.

| Property | Type | Description |
|---|---|---|
| `id` | String | Fulfillment ID |
| `reference` | String | Public reference code |
| `status` | String | Status (e.g., `ready_to_ship`, `waiting_for_pick_up`) |
| `status_changed_at` | DateTime | When the status last changed |
| `fulfillment_type` | String | Type (e.g., `delivery`, `takeaway`) |
| `fulfillment_items` | Collection | Fulfilled items (FulfillmentItemDrop) — **not `items`** |
| `tracking?` | Boolean | Shipment tracking enabled |
| `tracking_code` | String | Tracking code — **not `tracking_number`** |
| `tracking_provider` | String | Tracking provider — **not `carrier`** |
| `tracking_public_url` | String | Public tracking URL |
| `tracking_status` | String | Tracking status |
| `tracking_updated_at` | DateTime | Last tracking update |
| `requested_delivery_date` | String | Requested delivery date (ISO 8601) |
| `shipping_charge` | Number | Order's total shipping charge |
| `shipping_recipient_name` | String | Recipient name |
| `shipping_city` / `shipping_state` / `shipping_country` / `shipping_postal_code` | String | Destination address parts |
| `shipping_notes` / `notes` | String | Notes |
| `shipping_provider_name` / `shipping_provider_service` | String | Shipping provider and service used |
| `shipping_rate` | ShippingRateDrop | Selected custom shipping rate |
| `order` | OrderDrop | Parent order |
| `path` | String | Link path for this fulfillment |
| `data` | Hash | Custom data fields |

> There is no `shipped_at` — use `status` / `status_changed_at` / `tracking_updated_at`.

### DeliveryOptionsDrop

Delivery scheduling data for a cart item on the checkout delivery step. Available as `current_delivery_options`.

| Property | Type | Description |
|---|---|---|
| `cart_item` | CartItemDrop | The cart item being scheduled |
| `delivery_windows` | Collection | Delivery windows for the selected date (DeliveryWindowDrop) |
| `selected_date` | DateTime | Currently selected delivery date |
| `selected_day` | String | Currently selected delivery day |

> There is no `delivery`/`pickup`/`collection_points` on DeliveryOptionsDrop — pickup options live on `cart.pickup_options` and `item.pickup_options` as PickupOptionDrop.

### DeliveryWindowDrop

A delivery-window **configuration** attached to a Zone, not a single bookable slot. **There is no `date`, `time_from` or `time_to`** — all three render blank.

| Property | Type | Description |
|---|---|---|
| `id` | String | Window ID |
| `timeslot_groups` | Collection | Groups of slots — each has `name` and `timeslots` |
| `timeslots` | Collection | Slot labels, plain Strings |
| `days_of_week` | String | Days the window applies to |
| `duration` / `duration_unit` | | Window length |
| `offset` / `offset_unit` | | Lead time before the first available window |
| `timezone` | String | Window timezone |
| `zone` | Drop | Owning delivery zone |
| `active?` | Boolean | Whether the window is active |

```liquid
{% for delivery_window in current_delivery_options.delivery_windows %}
  {% for timeslot_group in delivery_window.timeslot_groups %}
    <fieldset><legend>{{ timeslot_group.name }}</legend>
      {% for timeslot in timeslot_group.timeslots %}
        <label><input type="radio" name="timeslot" value="{{ timeslot }}"> {{ timeslot }}</label>
      {% endfor %}
    </fieldset>
  {% endfor %}
{% endfor %}
```

### ShippingRateDrop

A shipping rate option.

| Property | Type | Description |
|---|---|---|
| `id` | String | Rate ID |
| `name` | String | Rate name |
| `price` | Number | Shipping price |
| `form_value` | String | Form input value when selecting this rate |
| `shipping_method` | String | The shipping method name. A String, not a Drop — it has no sub-attributes. |
| `product_type` | String | Product type the rate applies to |
| `instructions_content` | String | Instructions (rich text) |
| `data` | Hash | Custom data fields |

---

## Location

### LocationDrop

A physical store location. Available as `current_location` on location pages.

| Property | Type | Description |
|---|---|---|
| `id` | String | Location ID |
| `name` | String | Display name |
| `identifier` | String | Unique identifier |
| `path` | String | URL path |
| `url` | String | Full URL |
| `street` | String | Street address |
| `city` | String | City |
| `state` | String | State/province |
| `postal_code` | String | Postal/ZIP code |
| `country` | String | Country |
| `latitude` | Number | GPS latitude |
| `longitude` | Number | GPS longitude |
| `phone` | String | Phone number |
| `email` | String | Email |
| `website` | String | Website URL |
| `logo` | ImageDrop | Location logo |
| `info_content` | String | Information HTML |
| `meta_title` | String | SEO title |
| `meta_description` | String | SEO description |
| `meta_keywords` | String | SEO keywords |
| `categories` | Collection | Product categories this location handles |
| `account` | AccountDrop | Associated account |
| `distance_in_kilometers` | String | Distance from search (when in location search results) |
| `distance_in_miles` | String | Distance from search (when in location search results) |
| `data` | Hash | Custom data fields |

### AddressDrop

A physical address (used for billing/shipping on orders and carts).

| Property | Type | Description |
|---|---|---|
| `street` | String | Street address (multiple lines separated by newlines) |
| `street_lines` | Collection | Street lines as separate items |
| `city` | String | City |
| `state` | String | State/province |
| `postal_code` | String | Postal/ZIP code |
| `country` | String | Country |

### CountryDrop

A country.

| Property | Type | Description |
|---|---|---|
| `name` | String | Country name |
| `alpha2` | String | Two-letter country code (e.g., "AU") — **not `code`** |
| `alpha3` | String | Three-letter country code (e.g., "AUS") |
| `states` | Collection | States/provinces (StateDrop) |

### CoordinateDrop

GPS coordinates.

| Property | Type | Description |
|---|---|---|
| `latitude` | Number | Latitude |
| `longitude` | Number | Longitude |

---

## Promotions & Discounts

### PromotionDrop

A v1 promotion rule. Applied v1 promotions come from `cart.promotions`; v2 promotions have their own drops (below).

| Property | Type | Description |
|---|---|---|
| `id` | String | Promotion ID |
| `name` | String | Promotion name |
| `code` | String | Promo code |
| `valid?` | Boolean | Is currently valid |
| `usage_count` / `usage_limit` | Number | Usage tracking |
| `starts_at` / `expires_at` | DateTime | Validity window |
| `actions` | Collection | PromotionActionDrop |
| `scopes` | Collection | PromotionScopeDrop (note: plural `scopes`) |
| `campaign` | CampaignDrop | Related campaign |
| `data` | Hash | Custom data fields |

> PromotionDrop (v1) has `code`, `actions`, and `scopes` but no `description`; Promotion2Drop (v2) has `coupon_code` and `description` but no `actions` — don't mix the two.

### Promotion2Drop

A v2 promotion — the promotion definition behind a CartPromotion2Drop (current platform versions).

| Property | Type | Description |
|---|---|---|
| `name` | String | Customer-facing name |
| `description` | String | Description |
| `coupon_code` | String | Coupon code (nil if auto-applied) |
| `start_date` / `end_date` | DateTime | Validity window |
| `data` | Hash | Custom data fields |

### CartPromotion2Drop

A v2 promotion applied to a cart, via `cart.promotions_v2` (current platform versions).

| Property | Type | Description |
|---|---|---|
| `discount_amount` | Number | Discount in currency |
| `discount_points` | Number | Discount in points |
| `total_discount` | Number | Total discount (amount + points) |
| `coupon_code_used` | String | Coupon code used (nil if auto-applied) |
| `auto_applied?` | Boolean | Was auto-applied |
| `coupon_applied?` | Boolean | Was applied via coupon |
| `promotion` | Promotion2Drop | The promotion |
| `data` | Hash | Custom data fields |

### DiscountDrop

A discount rule applied to an item or order.

| Property | Type | Description |
|---|---|---|
| `id` | String | Discount ID |
| `name` | String | Discount name |
| `percent_discount` | Number | Percentage discount |
| `value_discount` | Number | Value discount (currency) |
| `value_discount_points` | Number | Value discount (points) |
| `discounted_price` | Number | Discounted price |
| `discounted_points` | Number | Discounted points price |
| `rebate_amount` | Number | Rebate amount |
| `calculation_type` | String | Calculation type |
| `apply_discount_to` | String | What the discount applies to |
| `behaviour_when_applied` | String | Behavior when applied |
| `starts_at` / `expires_at` | DateTime | Validity window |
| `active?` | Boolean | Is currently active |
| `account` / `brand` / `membership` / `pricebook` / `product` / `product_category` | Drop | Scoping records |
| `data` | Hash | Custom data fields |

> There is no `description` or `amount` on DiscountDrop.

### VoucherDrop

A redeemable voucher.

| Property | Type | Description |
|---|---|---|
| `id` | String | Voucher ID |
| `code` | String | Voucher code |
| `current_balance` | Number | Current balance (**not `value`/`remaining_value`**) |
| `expires_at` | DateTime | Expiry (**not `expiry_date`**) |
| `requires_activation?` | Boolean | Needs activation before use |
| `orders` | Collection | Orders placed with this voucher |
| `data` | Hash | Custom data fields |

---

## Taxes

### TaxDrop

Tax configuration.

| Property | Type | Description |
|---|---|---|
| `name` | String | Tax name |
| `rate` | Number | Tax rate (percentage) |
| `zone` | ZoneDrop | Tax zone |
| `effective_from` / `effective_to` | DateTime | Effective window |
| `id` | String | Tax ID |
| `data` | Hash | Custom data fields |

### ItemTaxDrop

A per-jurisdiction tax line on a cart or order item, via `item.taxes` (current platform versions).

| Property | Type | Description |
|---|---|---|
| `name` | String | Tax jurisdiction name |
| `rate` | Number | Tax rate (percentage) |
| `amount` | Number | Tax amount for this item |

### SurchargeDrop

A surcharge/fee.

| Property | Type | Description |
|---|---|---|
| `identifier` | String | Surcharge identifier |
| `product` | ProductDrop | Associated product |
| `price` | Number | Surcharge amount |

---

## Forms

### FormDrop

Available inside `{% form %}` blocks. Exactly three attributes — no dynamic field access.

| Property | Type | Description |
|---|---|---|
| `fields` | Collection[FormFieldDrop] | Access a field by name: `form.fields["email"]` |
| `errors` | Collection[FormErrorDrop] | Validation errors, including form-level ones under field `"base"` |
| `path` | String | The form's action path |

> **`form.<field_name>` does not work.** `{{ form.quantity.name }}` is not on the Drop, so under strict variables it renders `Liquid error (line N): undefined method quantity` into the page. Use `{{ form.fields["quantity"].name }}`.

### FormFieldDrop

A form field. Exactly six attributes.

| Property | Type | Description |
|---|---|---|
| `name` | String | Input name attribute |
| `id` | String | HTML id |
| `value` | Any | Submitted value if the form was rejected, otherwise `original_value` |
| `original_value` | Any | The current stored value |
| `errors` | **FormErrorDrop** | A single error object, **not a list** — iterating it yields nothing. Read `field.errors.messages`. |
| `required?` | Boolean | Field flagged required by the form class (not all forms flag — see the forms reference) |

> **There is no `label` on form fields** — write labels in the theme with `| t` keys.

```liquid
{% assign email = form.fields["email"] %}
<label for="{{ email.id }}">{{ "forms.email" | t }}</label>
<input id="{{ email.id }}" name="{{ email.name }}" value="{{ email.value }}"
       {% if email.required? %}required{% endif %}>
{% if email.errors != blank %}
  {% for message in email.errors.messages %}<p class="error">{{ message }}</p>{% endfor %}
{% endif %}
```

### FormErrorDrop

A validation error on a form.

| Property | Type | Description |
|---|---|---|
| `field` | String | Field name |
| `messages` | Array | Error messages |
| `full_messages` | Array | Error messages including field name |

### CustomFormDrop

A merchant-defined form (`s_c__Form__c`). Look up via `all_custom_forms['<sfid>']`; render with `{% form "custom-form", identifier: custom_form.id %}`.

| Property | Type | Description |
|---|---|---|
| `id` | String | Form ID (sfid) |
| `identifier` | String | Form identifier |
| `name` | String | Form name |
| `type` | String | Form record type |
| `display_mode` | String | e.g. `add_to_cart` / `in_checkout` |
| `questions` | Collection | CustomFormQuestionDrop |
| `answers` | Collection | CustomFormAnswerDrop |
| `item` | CartItemDrop | Associated cart item (cart-scoped forms) |
| `success_page` | PageDrop | Success page |
| `success_content` | String | Success content HTML |
| `data` | Hash | Custom data fields |

### CustomFormQuestionDrop

| Property | Type | Description |
|---|---|---|
| `id` | String | Question ID (use in `answers[<id>][answer]` input names) |
| `data_type` | String | Expected answer data type (**not `question_type`**) |
| `question_content` | String | Question content as rich text |
| `default_value` | Any | Default answer |
| `picklist_options` | Collection | PicklistOptionDrop (**not `picklist_values`**) |
| `position` | Number | Sort position |
| `required?` | Boolean | Is required |
| `editable?` | Boolean | Is editable |
| `hidden?` | Boolean | Hidden from the user |
| `direct_upload_url` | String | Upload URL for file-attachment answers |
| `form` | CustomFormDrop | Parent form |
| `data` | Hash | Custom data fields |

> There is no `input_name` and no `answer_value` on questions — build input names as `answers[{{ question.id }}][answer]`; answered values live on CustomFormAnswerDrop.

### CustomFormAnswerDrop

| Property | Type | Description |
|---|---|---|
| `id` | String | Answer ID |
| `answer` | Any | The answer value (**the accessor is `answer`**) |
| `data_type` | String | Answer data type |
| `question` | CustomFormQuestionDrop | The question |
| `question_content` | String | Content of the answered question |
| `editable?` | Boolean | Is editable |
| `stale?` | Boolean | Is stale |
| `url` | String | Uploaded file URL (file answers) |
| `data` | Hash | Custom data fields |

### CustomFormSubmissionDrop

Available as `current_custom_form_submission` on the form-submission confirmation page (**there is no `current_form_submission`**).

| Property | Type | Description |
|---|---|---|
| `id` | String | Submission ID |
| `custom_form` | CustomFormDrop | The submitted form (answers via `.custom_form.answers`) |
| `contact` | ContactDrop | Submitting contact |
| `order` | OrderDrop | Related order |
| `order_item` | OrderItemDrop | Related order item |
| `submitted_at` | DateTime | Submission timestamp |

### PicklistOptionDrop

An option in a picklist field.

| Property | Type | Description |
|---|---|---|
| `label` | String | Display label |
| `value` | String | Option value |

---

## Payment

### PaymentDrop

A payment transaction, via `order.payments`.

| Property | Type | Description |
|---|---|---|
| `id` | String | Payment ID |
| `amount` | Number | Payment amount |
| `points_amount` | Number | Points amount |
| `surcharge_amount` | Number | Surcharge included in this payment |
| `currency_code` | String | Currency |
| `status` | String | Payment status |
| `payment_method` | String | Method used (**not `method`**) |
| `payment_provider` | PaymentProviderDrop | Provider (**not `provider`**) |
| `paid_at` | DateTime | When collected (**not `created_at`**; for pre-auth, set on first capture) |
| `description` | String | Description of the method used |
| `instructions_content` | String | Payment instructions (rich text) |
| `wallet_type` | String | e.g., "Apple Pay", "Google Pay" |
| `order` | OrderDrop | Parent order |
| `data` | Hash | Custom data fields |

### PaymentProviderDrop

A payment gateway.

| Property | Type | Description |
|---|---|---|
| `id` | String | Provider ID |
| `name` | String | Provider name |
| `code` | String | Provider code (**not `type`**) |
| `active?` | Boolean | Is active |
| `channels` | Collection | Channels this provider is available on |
| `position` | Number | Sort position |
| `description_content` | String | Description (rich text) |
| `payment_instructions_content` | String | Payment instructions (rich text) |
| `supports_express_checkout?` | Boolean | Express checkout available and enabled |
| `supports_recurring_payments?` | Boolean | Supports recurring payments |
| `valid_payment_method?` | Boolean | Whether this provider is selectable for the current order. Not about saved payment methods. |
| `enabled_features` | Collection | Provider features enabled for this store, such as express checkout |
| `validation_errors` | Collection | Errors if this provider were chosen for the current cart |
| `data` | Hash | Custom data fields |

### PaymentMethodDrop

A saved payment method, via `current_customer.payment_methods` / `current_customer.default_payment_method` (current platform versions).

| Property | Type | Description |
|---|---|---|
| `id` | String | Payment method ID |
| `type` | String | `card`, `bank_account`, or `digital_wallet` |
| `display_name` | String | Formatted display name |
| `nickname` | String | Customer-set nickname |
| `last_four` | String | Last four digits |
| `card_brand` | String | e.g., Visa, Mastercard |
| `funding_type` | String | `credit`, `debit`, or `prepaid` |
| `expires_at` | String | Expiry date |
| `bank_name` / `account_type` / `bank_identifier_type` | String | Bank account details |
| `wallet_type` | String | `apple_pay`, `google_pay`, or `paypal` |
| `is_default?` | Boolean | Is the default method |
| `payment_provider` | PaymentProviderDrop | Associated provider |

---

## Booking

### BookingDrop

A booking/appointment.

| Property | Type | Description |
|---|---|---|
| `id` | String | Booking ID |
| `starts_at` / `ends_at` | DateTime | Booking start/end (**not `date`**) |
| `status` | String | Booking status |
| `attendees` | Collection | Booking attendees (BookingAttendeeDrop) |
| `max_attendees` | Number | Maximum attendees |
| `already_started?` | Boolean | Start time is in the past |
| `bookable_event` | BookableEventDrop | The booked event (**not `event`**) |
| `event_details` | String | Event description |
| `order_item` | OrderItemDrop | Related order item |
| `account` / `contact` | Drop | Related account/contact |
| `data` | Hash | Custom data fields |

### BookingAttendeeDrop

A person attending a booking.

| Property | Type | Description |
|---|---|---|
| `id` | String | Attendee ID |
| `first_name` | String | First name |
| `last_name` | String | Last name |
| `email` | String | Email |
| `phone` | String | Phone |
| `attended?` | Boolean | Has attended |
| `is_contact?` | Boolean | Is the main contact |
| `booking` | BookingDrop | Parent booking |
| `contact` | ContactDrop | Associated contact |
| `data` | Hash | Custom data fields |

### BookingAvailabilityDrop

Available booking times.

| Property | Type | Description |
|---|---|---|
| `dates` | Collection | Dates with availability (BookingAvailabilityDateDrop) |
| `nearest_future_date` | DateTime | Next available date |
| `nearest_past_date` | DateTime | Most recent past date |
| `has_availability?` | Boolean | Has any availability |

### BookingAvailabilityDateDrop

A date with available time slots.

| Property | Type | Description |
|---|---|---|
| `id` | String | The bookable-location id, not a per-date id |
| `date` | String | The date, ISO 8601 |
| `location` | BookableLocationDrop | Booking location |
| `time_slots` | Collection | Available time slots (BookingTimeSlotDrop) |

### BookingTimeSlotDrop

An individual time slot.

| Property | Type | Description |
|---|---|---|
| `starts_at` / `ends_at` | DateTime | Slot start/end (**not `start_time`/`end_time`**) |
| `available` | Number | Open spots remaining (**a count, not a Boolean**) |
| `booked` | Number | Bookings already made |
| `total` | Number | Slot capacity |
| `full?` | Boolean | Slot is full |
| `unlimited?` | Boolean | Unlimited capacity |

---

## Privacy

### PrivacyDrop

Privacy/cookie consent settings. Available as `current_privacy`.

| Property | Type | Description |
|---|---|---|
| `in_use?` | Boolean | Store has the privacy-settings feature enabled |
| `accepted?` | Boolean | Visitor has accepted/saved privacy settings |
| `groups` | Collection | Privacy groups (PrivacyGroupDrop) |
| `banner_content` | String | Consent banner content (rich text) |
| `settings_content` | String | Settings dialog content (rich text) |
| `enable_all_path` / `disable_all_path` / `clear_settings_path` | String | Action paths for consent buttons |

> Show the banner when `current_privacy.in_use?` and not `current_privacy.accepted?` (**there is no `show_banner?`**).

### PrivacyCookieDrop

A cookie consent item.

| Property | Type | Description |
|---|---|---|
| `id` | String | Cookie ID |
| `name` | String | Cookie name |
| `enabled?` | Boolean | Cookie is enabled for this visitor (**not `accepted?`**) |
| `information_content` | String | Cookie description (rich text, **not `description`**) |

---

## Utility Drops

### BreadcrumbDrop

A breadcrumb link in the page's breadcrumb trail. Available via the `current_breadcrumbs` global collection.

| Property | Type | Description |
|---|---|---|
| `name` | String | Breadcrumb link text |
| `path` | String | Relative path (e.g., `/products/shoes`) |
| `url` | String | Full URL. Includes an explicit port, so it looks like `https://store.example.com:443/products/shoes`. Use `path` for on-site links and prefer `current_request.canonical_url` for canonical tags. |

The base theme's `breadcrumbs` snippet renders both an `<ol>` and BreadcrumbList JSON-LD structured data from this collection.

### SubscriptionDrop

A recurring subscription. Available as `current_subscription` and via `current_customer.subscriptions`.

| Property | Type | Description |
|---|---|---|
| `id` | String | Subscription ID |
| `status` | String | Subscription status |
| `type` | String | `evergreen` or `fixed` (**not `frequency`**) |
| `next_due_date` | DateTime | Next payment due date (**not `next_payment_date`**) |
| `renewal_date` | DateTime | Renewal date |
| `price` | Number | Recurring price |
| `start_date` / `end_date` | DateTime | Subscription window |
| `cancelled_date` / `suspended_date` | DateTime | Cancellation/suspension dates |
| `payments` | Collection | Payments made |
| `payment_method` | String | Payment method |
| `payment_provider` | PaymentProviderDrop | Payment provider |
| `payment_overdue?` | Boolean | Payment is overdue |
| `can_pay_now?` | Boolean | Can pay now |
| `cancellable?` | Boolean | Can be cancelled |
| `can_update_payment_source?` | Boolean | Payment source can be updated |
| `has_saved_payment_details?` | Boolean | Has saved payment details |
| `path` / `url` | String | Subscription page path/URL |
| `product` | ProductDrop | Subscribed product |
| `order` | OrderDrop | Originating order |
| `renewal_order` | OrderDrop | Renewal order |
| `renewal_order_date` | DateTime | Renewal order date |
| `contact` | ContactDrop | Subscriber |
| `total_payable_amount` | Number | Total payable |
| `data` | Hash | Custom data fields |

### PricebookDrop

A price list. Available as `current_pricebook`.

| Property | Type | Description |
|---|---|---|
| `id` | String | Pricebook ID |
| `name` | String | Pricebook name |
| `currency` | String | Currency code |
| `active?` | Boolean | Is active |
| `standard?` | Boolean | Is the standard pricebook |
| `tax_method` | String | Tax calculation method |
| `tax_zone` | ZoneDrop | Tax zone |
| `default_earn_rate` | Number | Default points earn rate |
| `default_purchase_rate` | Number | Default points purchase rate |
| `order_quantity_maximum` | Number | Max order quantity |
| `pricebook_entries` | Paginated | Price entries (**not `entries`**) |
| `add_to_cart_text` / `buy_it_now_text` / `hide_price_text` / `out_of_stock_text` / `unavailable_text` | String | Button/text overrides |
| `data` | Hash | Custom data fields |

### MembershipDrop

An account membership level.

| Property | Type | Description |
|---|---|---|
| `id` | String | Membership ID |
| `name` | String | Membership name |
| `accounts` | Collection | Member accounts |
| `pricebook` | PricebookDrop | Membership pricebook |
| `product` / `products` | Drop / Collection | Membership product(s) |
| `product_category` | ProductCategoryDrop | Membership category |
| `pages` / `articles` | Collection | Member-only pages/articles |
| `data` | Hash | Custom data fields |

> There is no `expires_at` on MembershipDrop.

### RecordDrop

An untyped record from a `{% query %}`.

| Property | Type | Description |
|---|---|---|
| (any field) | Any | Access by **lowercase query field name**: `record.name`, `record.s_c__slug__c`, `record.createddate`. An unavailable name returns nil silently. |
| `id` | String | The Salesforce primary key (sfid or the StoreConnect external ID), not a numeric row id |
| `custom_data` | Hash | Mapped custom fields. **Case-sensitive lookup with lowercase keys**: `record.custom_data.color__c`. |

`datetime` fields come back as ISO 8601 strings and `time` fields as `HH:MM:SS`, so a `| date:` filter is working on a string. Convert to a typed Drop with `| cast: '<DropName>'` for relationships and helpers.

### StructDrop

A structured object from `{% struct %}` tag.

### ApiResponseDrop

Response from `{% api %}` tag.

| Property | Type | Description |
|---|---|---|
| `status` | Number | HTTP status code |
| `body` | Any | Response body (auto-parsed JSON) |

---

## Custom Data Fields

`data` exists only on Drops backed by a Salesforce record with Custom Data Mapping support. It is listed explicitly in each Drop's table above — **not every Drop has it.** Drops without `data` include Breadcrumb, Address, Coordinate, Country, Request, Flash, Form, FormField, FormError, AccountPoints, Search, Record, RecordSet, Struct, ApiResponse, CustomerEvent, Privacy, PrivacyCookie, PrivacyGroup, State, PickupOption, AppliedCredit, AppliedVoucher, Geolocation, Variables, and Script.

**The key is the whole Salesforce field API name, lowercased — including the `__c` suffix and any namespace prefix.** Dropping `__c` is the single most common mistake here; it returns nil rather than erroring.

```liquid
{{ product.data.custom_field__c }}
{{ order.data.special_instructions__c }}
{{ current_customer.data.loyalty_tier__c }}
{{ current_account.data.ns__region__c }}
```

`data` lookups are case-insensitive and a missing key returns nil. Values are cast to their mapped type; an `address` mapping returns an AddressDrop and a `location` mapping a CoordinateDrop, so those have sub-attributes rather than being flat strings.

For untyped records from `{% query %}`, use `custom_data`. Unlike `data`, this lookup is a plain hash and is **case-sensitive with lowercase keys**:

```liquid
{{ record.custom_data.custom_field__c }}
```

An empty `data` value can mean three different things: no mapping exists, the mapping exists but the record's field is blank, or you spelled the key wrong. Confirm the mapping in Salesforce before assuming the data is missing.

---

## Complete drop index

Every Drop that exists. Names marked in [drops-extended.md](drops-extended.md) are documented
there rather than above.

AccountCredit, AccountCreditTransaction, Account, AccountPoints, AccountPointsTransaction, Address, ApiResponse, AppliedCredit, AppliedVoucher, ArticleCategory, Article, AuthenticationProvider, BookableEvent, BookableLocation, BookingAttendee, BookingAvailabilityDate, BookingAvailability, Booking, BookingTimeSlot, Brand, Breadcrumb, Campaign, Cart, CartItem, CartPromotion2, CollectionPoint, ComponentGroup, ComponentPricing, Contact, ContentBlock, Coordinate, Country, CustomFormAnswer, CustomForm, CustomFormQuestion, CustomFormSubmission, CustomerEvent, DeliveryGroup, DeliveryOptions, DeliveryTimeslotGroup, DeliveryWindow, Discount, Document, File, Flash, Form, FormError, FormField, Fulfillment, FulfillmentItem, Geolocation, Global, Header, Headers, Image, ItemTax, Location, LocationGroup, Medium, Membership, Menu, MenuItem, Order, OrderItem, Outlet, Page, Paginate, Payment, PaymentInstallment, PaymentMethod, PaymentProvider, PicklistOption, PickupOption, Pricebook, PricebookEntry, PrivacyCookie, Privacy, PrivacyGroup, ProductApproval, ProductBookableLocation, ProductCategory, ProductComponent, Product, ProductFeature, ProductOption, ProductPricing, Promotion2, PromotionAction, Promotion, PromotionScope, Record, RecordSet, Register, Request, Script, Search, SearchField, SearchFieldOption, SearchResult, ShippingRate, Staff, State, StockLocation, Store, Struct, Style, Subscription, Surcharge, Tag, Tax, TraitCategory, Trait, TraitGroup, TraitType, Variables, VariantChoice, VariantOption, VariantType, Video, Voucher, VoucherProvider, Zone

(No `Customer` or `LineItem` drop exists, and there is no Shopify-style product-grouping `collection` object. The customer is `Contact`, line items are `CartItem`/`OrderItem`, and product groupings are `ProductCategory`. `Paginate` is the drop bound to `paginate` inside a `{% paginate %}` block — see [tags.md](tags.md).)
