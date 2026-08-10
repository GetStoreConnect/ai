# StoreConnect platform map

Use this map to choose an existing StoreConnect capability before proposing custom work. Confirm version-sensitive behavior in the current [StoreConnect support documentation](https://support.storeconnect.com/) and on the target store.

## Commerce

- **Catalog:** products, variants, categories, traits, media, bundles, related products, digital products, rentals, and restricted products.
- **Pricing:** Salesforce price books, customer or membership pricing, multi-currency, deposits, quotes, and tax-inclusive or tax-exclusive pricing.
- **Checkout:** carts, customer and address capture, shipping, terms, payments, promo codes, vouchers, account credit, loyalty points, saved carts, and assisted orders.
- **Orders:** Salesforce orders and order items, fulfillment, shipments, tracking, refunds, and configurable order statuses.
- **Subscriptions and bookings:** recurring products, renewals, bookable sessions, availability, locations, bookings, and attendees.
- **Promotions:** coupon and automatic promotions, eligibility rules, rewards, scheduling, channel scope, stacking, and usage limits.

Use `storeconnect-salesforce-data` for required object names and relationships. Use current StoreConnect tools or object descriptions rather than relying on a static full schema.

## Inventory, shipping, tax, and payments

- Inventory is managed per product and stock location, with stock adjustments, transfers, stocktakes, backorders, and availability rules.
- Zones support shipping and tax configuration. Shipping can include delivery, collection points, providers, rates, and delivery windows.
- Payment-provider capabilities vary. Confirm that the selected provider supports the store's checkout, subscription, pre-authorization, wallet, and POS requirements before building the flow.
- Treat payment credentials and customer payment data as secrets. Configure providers through their supported administration flow, never through theme code or AI instructions.

## Customers and access

- StoreConnect supports Salesforce Accounts and Contacts, Person Accounts, memberships, invitations, password recovery, content gating, account credit, and loyalty.
- Store Roles control administrative access to individual stores or store groups.
- Respect Salesforce sharing, CRUD, field-level security, and the connected user's authorized store scope.

## CMS, websites, and themes

- Content includes pages, articles, content blocks, menus, media, redirects, SEO metadata, localization, style blocks, theme templates, and theme variables.
- Themes use StoreConnect Liquid and can override supported layouts, pages, snippets, blocks, components, and resources.
- Use StoreConnect forms for customer writes and StoreConnect components for reloadable UI.
- Use store-relative links so themes work for both domain-root and path-mounted stores.

Read `storeconnect-theme-development`, `storeconnect-liquid`, `storeconnect-forms`, and `storeconnect-components` for the public theme interfaces.

## Search and SEO

- Store search can return products, pages, articles, and supported location results.
- Use `current_search`, its advertised fields/options, and the store's search path rather than recreating search behavior.
- Search Keywords can add customer terminology, alternate names, and common misspellings to supported records.
- StoreConnect provides standard SEO surfaces such as titles, descriptions, canonical URLs, sitemaps, robots controls, and structured product data.

Read `storeconnect-liquid/references/search-system.md` for the theme-facing search contract.

## POS

StoreConnect POS supports outlets, registers, shifts, staff, inventory, payments, fulfillment, customer and product lookup, layouts, actions, and print templates. Use `storeconnect-pos-setup` for configuration and `storeconnect-pos-customization` for supported UI extension points.

## Forms, privacy, and communications

- Registered storefront forms cover accounts, carts, checkout, vouchers, subscriptions, bookings, payment methods, privacy, and merchant-defined custom forms.
- Custom forms are configured in Salesforce and rendered through the StoreConnect `{% form %}` tag.
- Consent-managed scripts and privacy forms support customer cookie choices.
- Transactional email configuration belongs in Salesforce and should use confirmed sender settings and approved templates.

## Multi-store and localization

- A Salesforce org can contain multiple stores with distinct paths/domains, themes, menus, taxonomies, pricing, locales, and operational settings.
- Some records can be shared. Always identify the owning Store and relationship path before mutating data.
- Theme locales and translations provide store-specific UI text. Verify both the active locale and fallback behavior.

## Before you build anything custom

Search this map first. Reproducing a shipped capability in Liquid or Apex is the most common wasted effort on this platform, and it drifts out of step with the product on every release.

For the operating rules that apply to any change — establishing store and
environment, choosing tools at runtime, using the supported review workflow,
and verifying after synchronization — read [../SKILL.md](../SKILL.md).
