# Liquid Drops Reference — extended

The long-tail Drops: those reached through a relationship on a primary Drop, plus operations
and configuration Drops. The everyday Drops (`current_store`, `current_product`,
`current_cart`, `current_customer`, content, search, media, forms) are in
[drops.md](drops.md).

Same rule applies here: each Drop has a fixed attribute list, and **an attribute that is not
on it renders as an empty string with no error text in the page**. Treat an attribute absent
from these two files as nonexistent.

## Contents

- [Promotions and discounts (extended)](#promotions--discounts-extended)
- [Account (extended)](#account-extended)
- [Product (extended)](#product-extended)
- [Delivery (extended)](#delivery-extended)
- [Location (extended)](#location-extended)
- [Store (extended)](#store-extended)
- [Small utility drops](#small-utility-drops)

## Promotions & Discounts (Extended)

### AppliedVoucherDrop

A voucher applied to the cart/order.

| Property | Type | Description |
|---|---|---|
| `id` | String | Applied voucher ID |
| `code` | String | Voucher code |
| `identifier` | String | Customer-facing identifier (code, or masked card number for gift cards) |
| `label` | String | Provider display label (e.g., "Gift card") |
| `provider` | String | Voucher provider name |
| `balance` | Number | Remaining balance |
| `amount` | Number | Amount applied |
| `state` | String | Voucher state |

### AppliedCreditDrop

Account credit applied to the cart/order.

| Property | Type | Description |
|---|---|---|
| `id` | String | Applied credit ID |
| `name` | String | Credit name |
| `amount` | Number | Amount applied |
| `maximum` | Number | Maximum available |

### PromotionActionDrop

An action/reward defined for a promotion.

| Property | Type | Description |
|---|---|---|
| `id` | String | Action ID |
| `action` | String | Action type |
| `calculation` | String | Calculation method |
| `discount_percent` | Number | Discount percentage |
| `discount_value` | Number | Discount value |
| `discount_value_points` | Number | Discount in points |
| `qualifying_quantity` | Number | Required quantity |
| `promotion` | PromotionDrop | Parent promotion |

### PromotionScopeDrop

Scope/conditions for a promotion.

| Property | Type | Description |
|---|---|---|
| `id` | String | Scope ID |
| `account` | AccountDrop | Scoped account |
| `brand` | BrandDrop | Scoped brand |
| `category` | ProductCategoryDrop | Scoped category |
| `contact` | ContactDrop | Scoped contact |
| `membership` | MembershipDrop | Scoped membership |
| `pricebook` | PricebookDrop | Scoped pricebook |
| `product` | ProductDrop | Scoped product |
| `promotion` | PromotionDrop | Parent promotion |

---

---

## Account (Extended)

### AccountCreditTransactionDrop

A transaction on an account credit.

| Property | Type | Description |
|---|---|---|
| `id` | String | Transaction ID |
| `amount` | Number | Transaction amount |
| `type` | String | Entry type (credit/debit) |
| `account_credit` | AccountCreditDrop | Parent credit |
| `contact` | ContactDrop | Associated contact |
| `order` | OrderDrop | Associated order |
| `payment` | PaymentDrop | Associated payment |
| `created_at` | DateTime | Transaction date |
| `data` | Hash | Custom data fields |

### AccountPointsTransactionDrop

A transaction on account loyalty points.

| Property | Type | Description |
|---|---|---|
| `id` | String | Transaction ID |
| `amount` | Number | Points value |
| `type` | String | Entry type |
| `activated?` | Boolean | Is activated |
| `pending?` | Boolean | Is pending |
| `default_rate_used` | Number | Default rate |
| `reason_code` | String | Reason code |
| `transaction_currency` | String | Currency code |
| `transaction_currency_value` | Number | Currency value |
| `usage` | String | Usage type |
| `account` | AccountDrop | Parent account |
| `contact` | ContactDrop | Associated contact |
| `order_item` | OrderItemDrop | Associated order item |
| `payment` | PaymentDrop | Associated payment |
| `store` | StoreDrop | Associated store |
| `expires_at` | DateTime | Expiration date |
| `created_at` | DateTime | Transaction date |
| `data` | Hash | Custom data fields |

### ProductApprovalDrop

A restricted product approval for an account.

| Property | Type | Description |
|---|---|---|
| `id` | String | Approval ID |
| `approval_status` | String | Approval status |
| `approved_quantity` | Number | Approved quantity |
| `pending_quantity` | Number | Pending quantity |
| `purchased_quantity` | Number | Purchased so far |
| `remaining_quantity` | Number | Remaining allowed |
| `unlimited?` | Boolean | Is unlimited |
| `approved_from` | DateTime | Approval start date |
| `approved_until` | DateTime | Approval end date |
| `account` | AccountDrop | Parent account |
| `product` | ProductDrop | The product |
| `product_category` | ProductCategoryDrop | The category |
| `order_items` | Collection | Related order items |
| `path` | String | URL path |
| `data` | Hash | Custom data fields |

---

---

## Product (Extended)

### ProductComponentDrop

A component in a product bundle.

| Property | Type | Description |
|---|---|---|
| `id` | String | Component ID |
| `min_quantity` | Number | Minimum quantity |
| `max_quantity` | Number | Maximum quantity |
| `free_quantity` | Number | Free quantity included |
| `default_quantity` | Number | Default quantity |
| `position` | Number | Sort order |
| `component_unit_price` | Number | Unit price |
| `required?` | Boolean | Is required |
| `optional?` | Boolean | Is optional |
| `in_group?` | Boolean | Belongs to a group |
| `has_free_quantity?` | Boolean | Has free units |
| `included_by_default?` | Boolean | Included by default |
| `has_component_pricing?` | Boolean | Has specific pricing |
| `component_pricing` | ComponentPricingDrop | Pricing details |
| `anchor_product` | ProductDrop | The bundle product |
| `component_product` | ProductDrop | The component product |
| `group` | ComponentGroupDrop | Parent group |
| `data` | Hash | Custom data fields |

### ComponentGroupDrop

A group of components in a bundle.

| Property | Type | Description |
|---|---|---|
| `id` | String | Group ID |
| `name` | String | Group name |
| `display_name` | String | Display name |
| `position` | Number | Sort order |
| `min_components` | Number | Min components to select |
| `max_components` | Number | Max components to select |
| `min_group_quantity` | Number | Min total quantity |
| `max_group_quantity` | Number | Max total quantity |
| `required?` | Boolean | Is required |
| `optional?` | Boolean | Is optional |
| `single_choice?` | Boolean | Only one choice allowed |
| `components` | Collection | Components in group (ProductComponentDrop) |

### ComponentPricingDrop

Pricing for a bundle component.

| Property | Type | Description |
|---|---|---|
| `id` | String | Pricing ID |
| `unit_price` | Number | Unit price |
| `sale_price` | Number | Sale price |
| `enable_variable_pricing?` | Boolean | Has variable pricing |
| `on_sale?` | Boolean | Is on sale |
| `variable_pricing_options` | Any | Variable pricing options |
| `earn_points` | Number | Points earned |
| `deposit_amount` | Number | Deposit required |
| `component_product` | ProductDrop | Component product |
| `anchor_product` | ProductDrop | Bundle product |

### ProductFeatureDrop

A CPQ product feature (group of options).

| Property | Type | Description |
|---|---|---|
| `id` | String | Feature ID |
| `name` | String | Feature name |
| `require_single_choice?` | Boolean | Single choice required |
| `product_options` | Collection | Options (ProductOptionDrop) |

### ProductOptionDrop

A CPQ product option.

| Property | Type | Description |
|---|---|---|
| `id` | String | Option ID |
| `product_name` | String | Product name |
| `product_code` | String | Product code |
| `default_quantity` | Number | Default quantity |
| `bundled_product` | ProductDrop | The product |

### ProductBookableLocationDrop

Links a product to a bookable location.

| Property | Type | Description |
|---|---|---|
| `id` | String | ID |
| `min_bookings` | Number | Minimum bookings |
| `max_bookings` | Number | Maximum bookings |
| `bookable_location` | BookableLocationDrop | The location |
| `product` | ProductDrop | The product |

---

---

## Delivery (Extended)

### DeliveryTimeslotGroupDrop

A group of delivery time slots.

| Property | Type | Description |
|---|---|---|
| `name` | String | Group name |
| `timeslots` | Collection | Available timeslots |

### CollectionPointDrop

A click & collect pickup point.

| Property | Type | Description |
|---|---|---|
| `id` | String | Collection point ID |
| `name` | String | Display name |
| `description` | String | Description |
| `phone` | String | Phone number |
| `active?` | Boolean | Is active |
| `lead_time?` | Boolean | Has lead time |
| `lead_time_duration` | Number | Lead time amount |
| `lead_time_units` | String | Lead time units |
| `latitude` | Number | Latitude |
| `longitude` | Number | Longitude |
| `zone` | ZoneDrop | Geographic zone |
| `stock_location` | StockLocationDrop | Stock location |
| `data` | Hash | Custom data fields |

### PickupOptionDrop

A pickup/click-and-collect option for a cart item.

| Property | Type | Description |
|---|---|---|
| `form_id` | String | Form input ID |
| `form_value` | String | Form input value |
| `days_until_available` | Number | Days until pickup ready |
| `disabled?` | Boolean | Is disabled |
| `immediately_available?` | Boolean | Available now |
| `in_stock?` | Boolean | In stock at location |
| `require_stock_for_pickup?` | Boolean | Requires stock |
| `stock_location` | StockLocationDrop | The stock location |
| `collection_points` | Collection | Available collection points |

### FulfillmentItemDrop

An item within a fulfillment/shipment.

| Property | Type | Description |
|---|---|---|
| `quantity` | Number | Quantity fulfilled |
| `order_item` | OrderItemDrop | The order item |
| `fulfillment` | FulfillmentDrop | Parent fulfillment |
| `data` | Hash | Custom data fields |

---

---

## Location (Extended)

### LocationGroupDrop

A group of store locations.

| Property | Type | Description |
|---|---|---|
| `id` | String | Group ID |
| `name` | String | Group name |
| `identifier` | String | URL identifier |
| `active?` | Boolean | Is active |
| `meta_title` | String | SEO title |
| `meta_description` | String | SEO description |
| `meta_keywords` | String | SEO keywords |
| `social_image` | ImageDrop | Social media image |
| `locations` | Collection | Locations in group |
| `categories` | Collection | Associated categories |
| `path` | String | URL path |
| `url` | String | Full URL |
| `data` | Hash | Custom data fields |

### StockLocationDrop

A stock/inventory location.

| Property | Type | Description |
|---|---|---|
| `id` | String | Stock location ID |
| `name` | String | Display name |
| `address1` | String | Address line 1 |
| `address2` | String | Address line 2 |
| `city` | String | City |
| `state` | String | State |
| `country` | String | Country |
| `zip_code` | String | ZIP/postal code |
| `phone` | String | Phone |
| `website` | String | Website URL |
| `latitude` | Number | Latitude |
| `longitude` | Number | Longitude |
| `active?` | Boolean | Is active |
| `require_stock_for_pickup?` | Boolean | Requires stock |
| `days_to_restock` | Number | Restock lead time |
| `online_fulfillment_options` | Any | Fulfillment options |
| `logo` | MediumDrop | Location logo |
| `data` | Hash | Custom data fields |

---

---

## Store (Extended)

### GeolocationDrop

Geolocation store suggestion.

| Property | Type | Description |
|---|---|---|
| `enabled?` | Boolean | Is geolocation enabled |
| `suggested_store` | StoreDrop | Suggested store |
| `sibling_stores` | Collection | Other available stores |

### CampaignDrop

A marketing campaign.

| Property | Type | Description |
|---|---|---|
| `id` | String | Campaign ID |
| `name` | String | Campaign name |
| `status` | String | Campaign status |
| `information_content` | String | Campaign info (rendered markdown) |
| `opt_in_text` | String | Opt-in text |
| `preselect_opt_in?` | Boolean | Pre-select opt-in checkbox |
| `data` | Hash | Custom data fields |

### StaffDrop

A staff member.

| Property | Type | Description |
|---|---|---|
| `id` | String | Staff ID |
| `name` | String | Staff name |

### StyleDrop

A custom stylesheet.

| Property | Type | Description |
|---|---|---|
| `id` | String | Style ID |
| `url` | String | CSS URL |
| `media` | String | Media query |
| `active?` | Boolean | Is active |
| `position` | Number | Load order |
| `global?` | Boolean | Is global |
| `channels` | Array | Applicable channels |
| `content` | String | CSS content |

### OutletDrop

A point-of-sale outlet (current platform versions). Available as `current_outlet` when an outlet has been set for the session (nil in normal storefront sessions).

| Property | Type | Description |
|---|---|---|
| `id` | String | Outlet ID |
| `name` | String | Outlet name |
| `address1` / `address2` / `city` / `state` / `zip_code` | String | Address |
| `country` | CountryDrop | Country |
| `phone` | String | Phone |
| `tax_number` | String | Tax number |
| `register_code` | String | Register code |
| `registers` | Collection | Registers at this outlet (RegisterDrop) |
| `store` | StoreDrop | Parent store |
| `data` | Hash | Custom data fields |

### RegisterDrop

A point-of-sale register (current platform versions).

| Property | Type | Description |
|---|---|---|
| `id` | String | Register ID |
| `name` | String | Register name |
| `active?` | Boolean | Is active |
| `connected?` | Boolean | Is currently connected |
| `outlet` | OutletDrop | Parent outlet |
| `data` | Hash | Custom data fields |

### PricebookEntryDrop

A price entry in a pricebook.

| Property | Type | Description |
|---|---|---|
| `id` | String | Entry ID |
| `name` | String | Entry name |
| `productcode` | String | Product code |
| `unitprice` | Number | Unit price |
| `sale_price` | Number | Sale price |
| `minimum_sell_price` | Number | Minimum price |
| `percentage` | Number | Percentage discount |
| `currency` | String | Currency code |
| `active?` | Boolean | Is active |
| `hide_price?` | Boolean | Hide price |
| `hide_price_text` | String | Text when price hidden |
| `restricted?` | Boolean | Is restricted |
| `restricted_text` | String | Restriction message |
| `out_of_stock_text` | String | Out of stock message |
| `add_to_cart_text` | String | Add to cart button text |
| `buy_it_now_text` | String | Buy now button text |
| `deposit_amount` | Number | Deposit required |
| `deposit_points` | Number | Deposit in points |
| `earn_points` | Number | Points earned |
| `earn_points_bonus` | Number | Bonus points |
| `purchase_points` | Number | Points price |
| `purchase_points_sale` | Number | Sale points price |
| `order_quantity_maximum` | Number | Max order quantity |
| `tax_method` | String | Tax calculation method |
| `variable_pricing_options` | Any | Variable pricing config |
| `can_earn_points?` | Boolean | Earns points |
| `can_purchase_with_currency?` | Boolean | Currency purchase allowed |
| `can_purchase_with_points?` | Boolean | Points purchase allowed |
| `disable_quantity_selection?` | Boolean | Fixed quantity |
| `display_if_restricted?` | Boolean | Show when restricted |
| `enable_variable_pricing?` | Boolean | Variable pricing enabled |
| `use_standard_price?` | Boolean | Uses standard price |
| `pricebook` | PricebookDrop | Parent pricebook |
| `product` | ProductDrop | The product |
| `tax_zone` | ZoneDrop | Tax zone |

### PrivacyGroupDrop

A group of privacy/cookie consent settings.

| Property | Type | Description |
|---|---|---|
| `id` | String | Group ID |
| `title` | String | Group title |
| `enabled?` | Boolean | Is enabled |
| `required?` | Boolean | Is required (cannot opt out) |
| `information_content` | String | Description (rendered markdown) |
| `cookies` | Collection | Cookies in group (PrivacyCookieDrop) |

### CustomerEventDrop

A customer event, reached via the `current_events` global collection.

| Property | Type | Description |
|---|---|---|
| `type` | String | Event type |
| `event_data` | Hash | Event data (key-value map) |

**Both return nil unless the event is inside a `{% process_event %}` block.** That is a deliberate gate, not a fault — the tag marks each event handled so it fires once. See [tags.md](tags.md).

---

---

## Small utility drops

### StateDrop
| Property | Description |
|---|---|
| `code` | State code |
| `name` | State name |

### TagDrop (`product.tags`)
| Property | Description |
|---|---|
| `id` | Tag ID |
| `type` | Tag type |
| `value` | Tag value |
| `data` | Custom data fields |

### FileDrop
| Property | Description |
|---|---|
| `id` | File ID |
| `name` | File name |
| `url` | Full URL |
| `file_type` | File type/extension |
| `alt_text` | Alt text |
| `description` | Description |
| `data` | Custom data fields |

### ScriptDrop (`current_store.scripts` — Script Blocks)
| Property | Description |
|---|---|
| `id` | Script ID |
| `url` | External script URL |
| `content` | Inline script content |
| `position` | Load order |
| `active?` | Is active |
| `global?` | Is global |

### VariablesDrop
Backs `session_variables`, `store_variables`, and `theme_variables` — no named attributes; it is a case-insensitive key-lookup object: `{{ theme_variables["products.per_page"] }}`.
