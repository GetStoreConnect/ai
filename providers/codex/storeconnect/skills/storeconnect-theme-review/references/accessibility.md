# Accessibility audit

Checks for keyboard access, assistive-technology semantics, contrast, and motion. Read this
when auditing accessibility, when triaging a Lighthouse accessibility score, or before writing
any `aria-*` recommendation.

## Contents

- [Establish the deployed baseline](#establish-the-deployed-baseline)
- [Prioritize, or the report is noise](#prioritize-or-the-report-is-noise)
- [Skip link and landmarks](#skip-link-and-landmarks)
- [Visually hidden text](#visually-hidden-text)
- [Accessible names](#accessible-names)
- [Disclosure widgets](#disclosure-widgets)
- [Modals and drawers](#modals-and-drawers)
- [Live regions: flash, cart count, errors](#live-regions-flash-cart-count-errors)
- [Structure and nesting](#structure-and-nesting)
- [Focus visibility](#focus-visibility)
- [Reduced motion](#reduced-motion)
- [Contrast and target size](#contrast-and-target-size)
- [Escaping in attributes](#escaping-in-attributes)

## Establish the deployed baseline

Read the deployed base templates and the active theme through supported
StoreConnect tools before assigning a finding. Check the actual store for:

- a working skip link and meaningful landmarks;
- a visually hidden text utility that remains available to assistive technology;
- visible keyboard focus and reduced-motion behavior;
- modal and drawer semantics plus focus management;
- live regions for status, flash, cart, and form errors;
- current-item semantics for navigation and pagination; and
- translation keys for any accessible labels you plan to add.

Do not assume a helper, class, translation, or accessibility behavior exists
because another store or release has it. Distinguish a gap inherited from the
deployed base theme from a regression introduced by the custom theme, and report
that distinction clearly.

## Prioritize, or the report is noise

When the verified deployed baseline has many gaps, a naive "flag every missing
`aria`" pass produces an unusable report. Rank findings by whether the gap
blocks a task:

1. **Warning — blocks completing a purchase or navigating by keyboard.** No skip link on a
   store with a large header; icon-only cart/account/search controls with no accessible name;
   a modal or drawer with no Escape and no focus containment; form validation errors that are
   never announced; a control that is a `<div>` with a click handler and no keyboard path.
2. **Suggestion — degrades the experience but has a workaround.** `aria-live` on the cart
   count, `role="status"` on flash notices, `aria-current` on the active nav item,
   `aria-labelledby` on a titled dialog, landmark labels on duplicate `<nav>`s.
3. **Pass — list what is already right.** Correct heading order, `<ol>`/`<li>` breadcrumbs,
   real `<button>` elements, present `alt` text. Listing these calibrates trust in the report.

Group repeated instances into one finding with a count and one example location. Twelve
unnamed icon buttons is one finding, not twelve.

## Skip link and landmarks

If the deployed theme lacks a working skip link, add one as the first practical
focusable element in `<body>`. Confirm the current main landmark id and an
existing translation key, or add a theme-owned key:

```liquid
<a class="skip-link" href="#main-content">{{ "theme.a11y.skip_to_content" | t }}</a>
```

```css
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 1000;
}
.skip-link:focus {
  left: 0;
  padding: 0.5rem 1rem;
  background: var(--sc-color-background, #fff);
  color: var(--sc-color-text, #000);
  outline: 2px solid currentColor;
}
```

Never hide a skip link with `display: none` or `.sc-hide` — that removes it from the tab order
and defeats the purpose.

Landmarks: verify exactly one `<main>` plus appropriate `<header>`, `<footer>`,
and `<nav>` regions. When more than one `<nav>` is present, give each a distinct
accessible name.

## Visually hidden text

If the deployed theme has no suitable visually hidden utility, add one. This
keeps the text in the accessibility tree, which `display: none` and
`visibility: hidden` do not:

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

Flag any class that resolves to `display: none` or `visibility: hidden` when it
is used to provide a screen-reader-only label.

## Accessible names

- Every `<img>` needs `alt`. Product imagery: `alt="{{ image.alt_text | default: product.name }}"`.
  The Image object also exposes `description`, which is a reasonable second fallback.
  Decorative imagery: `alt=""`. Inline icon SVGs: `aria-hidden="true"`, plus an accessible
  name on the control that contains them.
- **Do not flag a JS-populated `<img>` placeholder before reading the
  corresponding script.** Verify the final rendered image has appropriate alt
  text.
- Icon-only controls need `aria-label` — and this applies to **links** as much as buttons.
  Cart, account, search, social links, and anything whose text is hidden at small viewports
  are the recurring offenders.
- Every form control needs a programmatic label. Field objects expose `name`, `id`, `value`,
  `original_value`, `required?`, and `errors` — **there is no `.label`**, so all label text
  comes from the theme. Use `<label for="{{ field.id }}">`; a placeholder is not a label.
- Set `autocomplete` on identity, address, and payment fields. It is a WCAG 1.3.5 requirement
  and it materially improves checkout completion.

## Disclosure widgets

Inspect the deployed dropdown and accordion markup. If `aria-expanded` is placed
on the panel rather than the interactive control, report it: ARIA requires the
state on the control that performs the expansion. A compliant shape is:

```liquid
<button type="button"
        aria-expanded="false"
        aria-controls="panel-{{ id }}"
        data-dropdown-trigger>
  {{ label }}
</button>
<div id="panel-{{ id }}" data-dropdown-target hidden>…</div>
```

with the script toggling `aria-expanded` on the trigger. Attribute the issue to
the custom theme only when that theme introduced or preserved the affected
override; otherwise note the deployed base-theme gap.

## Modals and drawers

Inspect the deployed modal first. Any custom cart drawer, quick-view, or filter
panel needs all of:

- `role="dialog"` and `aria-modal="true"`.
- `aria-labelledby` pointing at the visible title, or `aria-label` when there is none.
- Focus moved into the dialog on open, contained while open, and returned to the trigger on
  close.
- Escape closes.
- Content behind the dialog inert or `aria-hidden` while it is open.

Missing Escape or missing focus containment is a Warning — a keyboard user gets trapped
behind or outside the dialog. The rest are Suggestions.

## Live regions: flash, cart count, errors

Inspect the deployed flash and error snippets. When notice and alert containers
exist before their messages arrive but lack live-region semantics, add
`role="status"` to non-urgent notices and `role="alert"` to errors. Attribute
the gap to the custom theme only when its override owns the affected markup.

**Also check that field errors are rendered at all.** `form_errors` shows only errors whose
field is `base` unless it is called with `include_fields: true`. A theme that renders
`{% render "form_errors", errors: form.errors %}` and no per-field `field.errors` output
displays "there were errors" and never says which field. That is a Warning on any form and
close to Critical on checkout.

Cart count and any other value updated by script: `aria-live="polite"` on the element whose
text changes.

## Structure and nesting

- Heading level is document structure, not type size. A footer heading that jumps from `<h1>`
  to `<h4>` for visual reasons is the single most common violation in ported themes. The fix
  is `<h2>` plus a CSS class, never a level change.
- `<ul>` and `<ol>` may contain only `<li>` (plus `<script>`/`<template>`). Menus routinely
  wrap a logo, a close button, or a search box in a `<div>` inside the list. Move it out.
- Breadcrumbs should use `<ol>` → `<li>` and identify the current page when the
  final crumb is a link. Verify the deployed markup rather than assuming it.
- Tables need `<th scope>`; do not use a table for layout.

## Focus visibility

Verify the final computed focus style. If neither the deployed theme nor the
browser provides a clearly visible indicator, add a global theme rule:

```css
:focus-visible {
  outline: 2px solid var(--sc-color-primary);
  outline-offset: 2px;
}
```

Flag any `outline: none` or `outline: 0` that is not paired with a visible replacement — that
is a WCAG 2.4.7 failure and it is easy to grep for.

## Reduced motion

Verify whether the deployed theme already honors `prefers-reduced-motion`. Wrap
custom carousels, parallax, and entrance animations when it does not:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Auto-advancing carousels additionally need a visible pause control regardless of the media
query.

## Contrast and target size

- 4.5:1 for normal text, 3:1 for large text (18px, or 14px bold and above), 3:1 for UI
  component boundaries and meaningful graphics.
- Interactive targets at least 24×24 CSS pixels, and 44×44 for primary mobile actions.
- **Brand colors are a decision, not a bug.** Never tell a client their brand color is wrong.
  Propose an accessible variant scoped to the surfaces that fail — usually a darker or lighter
  token for text on a dark background — expressed as a CSS custom property so the brand color
  itself is untouched:

  ```css
  :root {
    --sc-color-brand: #<brand>;
    --sc-color-brand-on-dark: #<accessible-variant>;
  }
  ```

- Do not rely on color alone. Required fields, error states, and stock status each need a
  non-color cue (text, icon, or shape).

## Escaping in attributes

Drop-sourced strings interpolated into an attribute need `| escape`. A product name or alt
text containing a double quote closes the attribute early and can inject further attributes.
`alt="{{ image.alt_text }}"` is unsafe; `alt="{{ image.alt_text | escape }}"` is not. The same
applies to `aria-label`, `title`, and `data-*`.

Also flag `aria-label` placed on an element that already has `alt` or visible text — the
`aria-label` wins and silently overrides the better name.
