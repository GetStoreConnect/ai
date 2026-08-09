# StoreConnect CSS system reference

Token and class names are version-sensitive. **A `--sc-*` name the deployed
theme does not declare has no effect**, and a class the theme does not use styles
nothing. Confirm each name through the current base-theme read or supported
StoreConnect tooling before writing the selector.

All values are base-theme defaults.

## Contents

- [Which channel to write into](#which-channel-to-write-into)
- [Color variables](#color-variables)
- [Shade variables](#shade-variables)
- [Spacing variables](#spacing-variables)
- [Typography variables](#typography-variables)
- [Border variables](#border-variables)
- [Shadow variables](#shadow-variables)
- [Depth variables](#depth-z-index-variables)
- [Layout and component variables](#layout-and-component-variables)
- [Breakpoints](#breakpoints)
- [Class naming](#component-class-naming-convention)
- [Core component classes](#core-component-classes)
- [Utility classes](#utility-classes-lowercase-sc--prefix)
- [Container and grid classes](#container-classes)
- [Wider component-class inventory](#wider-component-class-inventory)
- [Page-scoped CSS](#page-scoped-css)
- [Naming your own tokens and classes](#naming-your-own-tokens-and-classes)
- [Pre-publish CSS lint](#pre-publish-css-lint)

## Which channel to write into

| Channel | HSL triplets derived from hex? | Linted before publish? | Scope |
|---|---|---|---|
| Store custom styles (`s_c__Store__c.s_c__Custom_Styles__c`) | **yes** | **yes** | one store |
| `theme-supplement.css` (Theme Asset) | no | no | every store on the theme |
| Style Block (`s_c__Style_Block__c`) | no | no | one store |

**Store custom styles is the right channel for brand tokens.** Set the composite hex only and the
platform derives the `-h`/`-s`/`-l` channels the base CSS actually reads:

```css
/* store custom styles - this is sufficient */
:root {
  --sc-color-primary: #2D4A2D;
  --sc-color-secondary: #C4622D;
}
```

Derivation covers `primary`, `secondary`, `error`, `sale`, `bonus`, applies only to a hex value in a
`:root` block, and is skipped for a color where **any** of the three channels is already declared
anywhere in the sheet. Declaring one channel by hand means you own all three.

**In `theme-supplement.css` nothing is derived.** Write all four, or components that build colors
from the channels stay blue:

```css
/* theme-supplement.css - all four are required */
:root {
  --sc-color-primary: hsl(120, 24%, 23%);
  --sc-color-primary-h: 120deg;
  --sc-color-primary-s: 24%;
  --sc-color-primary-l: 23%;
}
```

## Color variables

Defined as HSL with separate H/S/L channels so components can build tints and shades at runtime
without a build step.

| Variable | Default | Notes |
|---|---|---|
| `--sc-color-primary` | `hsl(212, 100%, 50%)` | **Blue. Always override** |
| `--sc-color-primary-h` / `-s` / `-l` | `212deg` / `100%` / `50%` | The channels components actually read |
| `--sc-color-secondary` | `hsl(0, 0%, 15%)` | Near-black |
| `--sc-color-secondary-h` / `-s` / `-l` | `0deg` / `0%` / `15%` | |
| `--sc-color-error` | `hsl(0, 100%, 45%)` | Red |
| `--sc-color-error-h` / `-s` / `-l` | `0deg` / `100%` / `45%` | |
| `--sc-color-sale` | `hsl(0, 100%, 45%)` | Red, same as error |
| `--sc-color-sale-h` / `-s` / `-l` | `0deg` / `100%` / `45%` | |
| `--sc-color-bonus` | `hsl(212, 100%, 50%)` | **Blue. Always override** |
| `--sc-color-bonus-h` / `-s` / `-l` | `212deg` / `100%` / `50%` | |

Those five are the whole color set. There is no `--sc-color-success`, `-warning`, `-info`, or
`-accent`; inventing one has no effect.

**Deriving a brand tint** is the reason the channels exist. Build a light background from the brand
hue instead of hardcoding a second hex, and it tracks a later rebrand automatically:

```css
:root {
  --acme-section-tint: hsl(var(--sc-color-primary-h), var(--sc-color-primary-s), 95%);
  --acme-section-edge: hsla(var(--sc-color-primary-h), var(--sc-color-primary-s), 40%, 0.25);
}
.ACME-Section { background: var(--acme-section-tint); border-block: 1px solid var(--acme-section-edge); }
```

## Shade variables

Neutral grays for text, borders, and backgrounds. Adjust these values for a theme rather than
introducing gray shades outside this set.

| Variable | Default | Usage |
|---|---|---|
| `--sc-shade-darkest` | `hsl(0, 0%, 10%)` | Body text, headings |
| `--sc-shade-dark` | `hsl(0, 0%, 30%)` | Secondary text |
| `--sc-shade-neutral` | `hsl(0, 0%, 45%)` | Subtle text, labels |
| `--sc-shade-light` | `hsl(0, 0%, 70%)` | Light text |
| `--sc-shade-lighter` | `hsl(0, 0%, 87%)` | Subtle borders |
| `--sc-shade-lightest` | `hsl(0, 0%, 95%)` | Offset backgrounds |

## Spacing variables

| Variable | Default |
|---|---|
| `--sc-spacing-micro` | `3px` |
| `--sc-spacing-tiny` | `5px` |
| `--sc-spacing-small` | `10px` |
| `--sc-spacing-medium` | `15px` |
| `--sc-spacing-base` | `20px` |
| `--sc-spacing-large` | `30px` |
| `--sc-spacing-xlarge` | `40px` |
| `--sc-spacing-xxlarge` | `60px` |
| `--sc-spacing-huge` | `80px` |

## Typography variables

The size names use `--sc-font-*`, **not** `--sc-font-size-*`. `--sc-font-size-large` is a no-op.

| Variable | Default | Notes |
|---|---|---|
| `--sc-font-family` | `-apple-system, BlinkMacSystemFont, sans-serif` | Body and UI |
| `--sc-font-family-heading` | `var(--sc-font-family)` | Headings. Set it for a distinct heading typeface |
| `--sc-font-tiny` | `14px` | |
| `--sc-font-small` | `15px` | |
| `--sc-font-base` | `16px` | |
| `--sc-font-medium` | `18px` | |
| `--sc-font-large` | `20px` | |
| `--sc-font-xlarge` | `24px` | |
| `--sc-font-xxlarge` | `30px` | |
| `--sc-font-huge` | `35px` | |
| `--sc-font-gigantic` | `45px` | |
| `--sc-font-normal` | `400` | Weight |
| `--sc-font-bold` | `600` | Weight |
| `--sc-line-height-tight` | `1.2` | Consumed by headings |
| `--sc-line-height-base` | `1.5` | Consumed by body copy |
| `--sc-line-height-loose` | `1.75` | Available, not used by default. Opt in for long-form prose |
| `--sc-letter-spacing-heading` | `normal` | |

**Setting a font family alone does not load the typeface.** A `font-family` declaration with no
`@import`, `@font-face`, or `<link>` changes the variable and nothing visible happens. Use the
store's dedicated fonts input, which writes a managed section into custom styles containing both the
loader and the family assignment, and is replaced in place each time it is set. It targets
`--sc-font-family` and `--sc-font-family-heading`.

## Border variables

| Variable | Default |
|---|---|
| `--sc-border-width` | `1px` |
| `--sc-border-color` | `hsl(0, 0%, 85%)` |
| `--sc-border-radius` | `4px` |
| `--sc-border-rounded` | `15px` |

## Shadow variables

| Variable | Default |
|---|---|
| `--sc-shadow` | `0 1px 2px hsla(0, 0%, 0%, 0.1)` |
| `--sc-shadow-2` | `0 4px 12px hsla(0,0%,0%,0.12), 0 1px 1px hsla(0,0%,0%,0.05)` |
| `--sc-shadow-3` | `0 4px 12px hsla(0,0%,0%,0.15), 0 1px 2px hsla(0,0%,0%,0.2)` |

## Depth (z-index) variables

| Variable | Default |
|---|---|
| `--sc-depth-background` | `-1` |
| `--sc-depth-neutral` | `1` |
| `--sc-depth-foreground` | `2` |
| `--sc-depth-floating` | `3` |
| `--sc-depth-overlay` | `4` |

## Layout and component variables

| Variable | Default | Usage |
|---|---|---|
| `--sc-container-max-width` | `1700px` | Max width of the `sc-container` family. Tune this rather than overriding every container rule |
| `--sc-grid-gap` | `var(--sc-spacing-base)` | Gutter for every `sc-*-column` grid |
| `--sc-header-bg` | `white` | |
| `--sc-header-color` | `var(--sc-shade-darkest)` | |
| `--sc-footer-bg` | derived from `primary` at 40% lightness | **Blue by default.** Tracks `--sc-color-primary` automatically |
| `--sc-footer-color` | `white` | |
| `--sc-menu-link-color-resting` | `currentColor` | |
| `--sc-menu-link-color-hover` | `hsla(212, 100%, 50%, 1)` | **Hardcoded blue, not derived from primary. Always override** |
| `--sc-menu-shadow` | `0 8px 10px hsla(0, 0%, 0%, 0.1)` | |
| `--sc-menu-max-height` | `300px` | |
| `--sc-menu-image-max-height` | `200px` | |
| `--sc-menu-column-max-width` | `300px` | |
| `--sc-menu-column-min-width` | `100px` | |
| `--sc-menu-dropdown-width` | `400px` | |
| `--sc-input-height` | `44px` | |
| `--sc-input-border-radius` | `8px` | |
| `--sc-spinner-size` | `30px` / `40px` by context | Loader |
| `--sc-spinner-color` | `var(--sc-shade-light)` | Loader |
| `--sc-product-info-max-width` | `400px` | Product page info column |

**Minimum viable rebrand.** Override the two blues and the two derived-from-blue values, or the
storefront still reads as default StoreConnect:

```css
:root {
  --sc-color-primary: #2D4A2D;          /* footer background derives from this */
  --sc-color-bonus: #C4622D;
  --sc-menu-link-color-hover: #2D4A2D;  /* hardcoded blue in the base, does not derive */
}
```

## Breakpoints

| Name | Width | SCSS mixin |
|---|---|---|
| small | `576px` | `@include small-and-up` / `up-to-small` |
| medium | `768px` | `@include medium-and-up` / `up-to-medium` |
| large | `992px` | `@include large-and-up` / `up-to-large` |
| xlarge | `1400px` | `@include xlarge-and-up` |
| huge | `1700px` | `@include huge-and-up` |

Alias mixins also exist: `mobile/tablet/laptop/desktop/monitor-and-up`, `mobile-only`,
`tablet-only`. In plain supplement or custom CSS use media queries directly:

```css
@media (max-width: 767px)  { /* mobile: below the medium breakpoint */ }
@media (min-width: 768px)  { /* medium and up */ }
@media (min-width: 992px)  { /* large and up */ }
```

Base CSS also styles `[data-breakpoint='0'..'4']` sentinel elements, each hidden above its
breakpoint, which base JavaScript reads to detect the active CSS breakpoint. Those are the empty
divs in the DOM. Do not remove them.

## Component class naming convention

PascalCase with an `SC-` prefix, BEM-inspired:

```
SC-Component              block
SC-Component_element      element (single underscore)
SC-Component-modifier     modifier (single hyphen)
```

Elements can nest one level (`SC-Header_inner_left`, `SC-Accordion_header_icon`). Never re-prefix,
lowercase, or camelCase these.

## Core component classes

| Class | Description |
|---|---|
| `SC-Header`, `SC-Header_inner`, `SC-Header_inner_left` / `_center` / `_right` | Site header. See the real structure in [theme-structure.md](theme-structure.md) before overriding |
| `SC-Navbar`, `SC-Navbar_inner` | The bar holding the primary menu, below `SC-Header_inner` |
| `SC-Logo`, `SC-Logo_image` | Logo link and image |
| `SC-Menu`, `SC-Menu_item`, `SC-Menu_link`, `SC-Menu_button`, `SC-Menu_image` | Menu list, item, link, mobile close/back button, item image |
| `SC-MenuItem`, `SC-MenuItem-account` / `-login` / `-logout` | Account dropdown items (distinct from `SC-Menu_item`) |
| `SC-Footer` | Site footer. This is the only footer class the base declares |
| `SC-Banner`, `SC-Banner_container`, `SC-Banner_content`, `SC-Banner_heading`, `SC-Banner_subheading`, `SC-Banner_cta`, `SC-Banner_overlay` | Hero/banner |
| `SC-BannerOverlay`, `SC-BannerOverlay_container`, `_section`, `_count` | The image-text-overlay block's banner |
| `SC-Button` plus `-primary`, `-secondary`, `-subtle`, `-link`, `-add`, `-buy`, `-large`, `-small`, `-block`, `-expanded`, `-expanded-up-to-small`, `-expanded-up-to-large` | Buttons. **There is no `SC-Button-cta`** |
| `SC-Accordion`, `SC-Accordion_header`, `_header_heading`, `_header_label`, `_header_icon`, `SC-Accordion_body` | Accordion |
| `SC-Icon`, `SC-Icon-button`, `SC-Icon-large`, `SC-Icon-close` | Icon wrapper and variants |
| `SC-Select`, `SC-Select_icon`, `SC-Select-subtle` | Select control |
| `SC-Cart`, `SC-CartProducts`, `SC-CartItem`, `SC-CartItems`, `SC-CartTimer` | Cart |
| `SC-Count` | Badge counter (cart count) |
| `SC-ProductCard`, `SC-ProductDisplay`, `SC-ProductImages`, `SC-ProductPrice` | Product surfaces |
| `SC-Placeholder` | Placeholder SVG shown when a logo or image is missing |
| `SC-ContentBlock`, `SC-ContentBlockContainer` | Content block wrappers |
| `SC-ImageTextOverlay`, `SC-ImageBesideText`, `SC-Html`, `SC-Text` | Block templates |
| `SC-Main` | The `<main>` element id in the base layout |
| `SC-HeaderMenuPrimary`, `SC-HeaderMenuSecondary` | Element **ids**, not classes |

Menu modifiers: `.tier1`, `.tier2`, `.tier3` (nesting level), `.dropdown`, `.mega`, `.end`,
`.center`, `.stacked`, `.wrap`, `.is-active`.

## Utility classes (lowercase `sc-` prefix)

| Class | Purpose |
|---|---|
| `sc-flex`, `sc-grid`, `sc-grow` | Layout primitives |
| `sc-display-block`, `sc-display-inline`, `sc-display-inline-block` | Display |
| `sc-align-items-center`, `sc-justify-space-between`, `sc-justify-end` | Flex alignment |
| `sc-hide-up-to-small` / `-medium` / `-large` | Hidden below that breakpoint |
| `sc-hide-medium-and-up`, `sc-hide-large-and-up` | Hidden at that breakpoint and above |
| `sc-font-tiny`, `sc-font-bold` | Typography |
| `sc-mt`, `sc-mb`, `sc-ml`, `sc-mr` plus sized variants (`sc-mt-tiny`, `sc-mb-small`, …) | Margins |
| `sc-ps` | Padding on both sides |
| `sc-pointer-events-none` | Disable pointer events |
| `sc-rich-text` | Rich-text content wrapper. Put author-supplied HTML inside it |

## Container classes

| Class | Behavior |
|---|---|
| `sc-container` | Centered, responsive side padding, max-width `var(--sc-container-max-width)` |
| `sc-container-skinny` | Max-width 1400px; 80% width at large and up |
| `sc-container-spacious` | Adds vertical padding, growing at medium and up |
| `sc-container-capsule` | Max-width 500px |
| `sc-container-expanded` | No max-width |

Modifiers combine with the base class:
`class="sc-container sc-container-skinny sc-container-spacious"` (the base checkout page does
exactly this).

### Responsive grid classes

All set `display: grid` with `gap: var(--sc-grid-gap)`:

| Class | Columns |
|---|---|
| `sc-grid` | `display: grid` only. Define your own columns |
| `sc-one-to-two-column` | 1, then 2 at medium (768px) |
| `sc-one-to-three-column` | 1, then 3 at medium |
| `sc-one-to-four-column` | 1, then 4 at medium |
| `sc-two-to-four-column` | 2, then 4 at medium |
| `sc-two-to-five-column` | 2, 3 at medium, 4 at large, 5 at huge |

The first four map to content-block `layout_style` values; the last two do not and cannot be
selected on a block. See [theme-structure.md](theme-structure.md) → "The closed style vocabularies".

## Wider component-class inventory

The base theme declares roughly 160 component roots. Re-derive the current list from the deployed
base theme rather than trusting a copied list; the ones you are most likely to restyle:

- **Forms and UI:** `SC-Field`, `SC-Fieldset`, `SC-Label`, `SC-Radio`, `SC-RadioInput`,
  `SC-Checkbox`, `SC-Switch`, `SC-Modal`, `SC-Dropdown`, `SC-DropdownPicker`, `SC-Alert`,
  `SC-Notice`, `SC-Callout`, `SC-Loader`, `SC-Overlay`, `SC-OverlayButton`, `SC-Tag`, `SC-Badge`,
  `SC-StatusBadge`, `SC-Hamburger`, `SC-Progress`, `SC-Panel`, `SC-OptionCard`
- **Layout and navigation:** `SC-Grid`, `SC-Section`, `SC-PageHeader`, `SC-PageNav`,
  `SC-Breadcrumb`, `SC-Nav`, `SC-NavList`, `SC-NavLink`, `SC-AccountNav`, `SC-LinkList`, `SC-Tab`,
  `SC-Table`, `SC-Card`, `SC-CardGrid`, `SC-CardCarousel`, `SC-Slider`, `SC-Slideshow`,
  `SC-Search`, `SC-GlobalSearch`, `SC-Filters`, `SC-FilterByKeyword`, `SC-PreFooter`,
  `SC-StoreSelector`, `SC-Screen`, `SC-Fallback`
- **Commerce:** `SC-ProductGallery`, `SC-ProductImage`, `SC-ProductImages`, `SC-ProductThumbnail`,
  `SC-ProductThumbnails`, `SC-ProductItem`, `SC-ProductListCard`, `SC-ProductsGrid`,
  `SC-ProductDisplayDetails`, `SC-ProductDisplayImages`, `SC-ProductSpecifications`,
  `SC-ProductFeatures`, `SC-ProductInventory`, `SC-RelatedProducts`, `SC-QuantityPicker`,
  `SC-PricePicker`, `SC-PointsToggle`, `SC-Variant`, `SC-VariantSelector`, `SC-Traits`,
  `SC-AddToCart`, `SC-BundleProduct`, `SC-BundleProducts`, `SC-Voucher`, `SC-PromoCode`,
  `SC-OrderTotal`, `SC-OrderSummary`, `SC-Order`, `SC-DiscountItem`, `SC-AdjustmentItem`,
  `SC-DeliveryGroup`, `SC-DeliverySchedule`, `SC-ClickCollect`, `SC-CollectionTime`,
  `SC-Booking`, `SC-BookingDate`, `SC-BookingTimeSlot`, `SC-PaymentMethodBox`, `SC-DepositAmount`,
  `SC-ExcludesTax`, `SC-Percentage`
- **Checkout:** `SC-Checkout`, `SC-CheckoutTerms`, `SC-CheckoutShippingForm`,
  `SC-CheckoutDeliveryOptions`, `SC-OrderPaymentConfirmation`, `SC-OrderShippingConfirmation`,
  `SC-ExpressCheckoutForProduct`
- **Content:** `SC-Article`, `SC-ArticleCard`, `SC-ArticleCategory`, `SC-PageCard`,
  `SC-CategoryCard`, `SC-CategoryBanner`, `SC-CategorySubcategories`, `SC-FeaturedArticles`,
  `SC-FeaturedPages`, `SC-FeaturedProducts`, `SC-FeaturedCategories`,
  `SC-FeaturedCategoryProducts`, `SC-PrivacyBanner`, `SC-PrivacySettingsForm`, `SC-Cookie`,
  `SC-Image`, `SC-ImageLink`, `SC-HeadingLink`

Legacy dual selectors exist for some (`.SC-Menu, .Menu`) plus old `.u-*` utility aliases, and a few
all-lowercase roots (`SC-article`, `SC-page`, `SC-product`, `SC-category`, `SC-fulfillment`). Target
the modern `SC-PascalCase` form in new CSS.

## Page-scoped CSS

The base layout puts `SC-{controller}-{action}` on `<body id="">`. That id is the cheapest way to
scope a rule to one page type with no template override at all:

```css
#SC-pages-home  .SC-Notice     { margin-bottom: var(--sc-spacing-small); }
#SC-products-show h1           { text-transform: uppercase; line-height: var(--sc-line-height-tight); }
#SC-categories-show .SC-Grid   { max-width: var(--acme-store-max-width); margin-inline: auto; }
```

Read the actual id off the rendered page rather than guessing the controller and action names. This
is the technique to reach for before you consider a page-specific CSS pack or a template override.

## Naming your own tokens and classes

Everything you add takes your project prefix. Two reasons, both real:

1. **`--sc-*` names you invent are flagged as unknown theme tokens** by the pre-publish lint, with a
   "did you mean" suggestion, because the platform cannot tell an invented token from a typo.
2. **A future base-theme release can claim the name.** A project token called `--sc-store-max-width`
   silently changes meaning the day the base theme declares one.

```css
/* correct */
:root { --acme-store-max-width: 1980px; --acme-top-bar-bg: var(--sc-color-secondary); }
.ACME-TopBar { background: var(--acme-top-bar-bg); }
.acme-prose-invert { color: white; }

/* wrong */
:root { --sc-store-max-width: 1980px; }   /* reads as a theme token, is not one */
.sc-top-bar { }                            /* squats the platform utility namespace */
.SC-TopBar { }                             /* squats the platform component namespace */
```

Referencing a real `--sc-*` token from your own token is correct and encouraged; that is how a
project stays rebrandable.

## Pre-publish CSS lint

Custom styles staged in a content change are linted before publish. Each warning names a concrete
defect. Treat all of them as failures:

| Warning | Meaning | Fix |
|---|---|---|
| unknown theme token | a `--sc-*` name that is not a real token. "It will have no effect" | Use the suggested name, or rename it to your own prefix |
| dead class selector | a class selector matching nothing in any staged page, article, content block, or theme template, and not a base-theme class | Remove the rule, or add the class to the markup |
| unused custom property | a property declared but never read via `var()`, and not a theme token | Delete it |
| font not loaded | a `font-family` with no `@import`, `@font-face`, or link hint | Use the store's fonts input |
| style incoherence | more than 3 distinct font families, or more than 8 distinct hex colors | Consolidate toward the token palette |
| unsafe html | `<script>`, `<iframe>`, an inline event handler, or a `javascript:` URL in a staged field | Move the script to a Script Block, which is also what the cookie-consent system gates |

Treat the current lint result as the authoritative pre-publish check for the
surface it covers. Separately verify compiled or supplemental styles that the
lint does not inspect.

## Quality rules worth enforcing on yourself

Conventions that hold up in production themes:

- **No `!important`.** The load order already puts your CSS after the base pack. Reaching for
  `!important` means the selector is wrong, or you are fighting a rule you should be overriding
  at its own specificity.
- **Cap nesting.** Deeply nested SCSS produces selectors nobody can override later, including you.
- **No hardcoded Salesforce ids in CSS or Liquid.** They differ per org and per environment.
- **Never hand-edit a generated bundle.** A compiled `theme-supplement.css` or anything under
  `dist/` is build output; edit the source and rebuild. Treat the compiled file as gitignored.
- **No debug leftovers.** Commented-out blocks, scratch assets, and placeholder files ship and stay.
