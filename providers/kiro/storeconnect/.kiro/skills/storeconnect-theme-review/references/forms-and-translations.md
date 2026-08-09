# Forms and translations audit

Checks for `{% form %}` usage, field names, error surfacing, and every user-facing string. Read
this when auditing a form, before flagging any form name or field name, and when auditing
translations or pluralization.

## Contents

- [Verify a form name before flagging it](#verify-a-form-name-before-flagging-it)
- [Names that are genuinely invented](#names-that-are-genuinely-invented)
- [Field names that are commonly wrong](#field-names-that-are-commonly-wrong)
- [Field objects have no label](#field-objects-have-no-label)
- [Error surfacing is the most common real defect](#error-surfacing-is-the-most-common-real-defect)
- [Form checks in order of severity](#form-checks-in-order-of-severity)
- [Never repopulate these](#never-repopulate-these)
- [Translations are records, not a theme file](#translations-are-records-not-a-theme-file)
- [A missing key renders visible garbage](#a-missing-key-renders-visible-garbage)
- [Two more non-blank failure modes](#two-more-non-blank-failure-modes)
- [Pluralization](#pluralization)
- [Translation checks in order of severity](#translation-checks-in-order-of-severity)

## Verify a form name before flagging it

There are 43 registered form names. Flagging a real one as invented is worse than missing an
invented one, because it sends a client to break working code.

The procedure, in order:

1. Open `storeconnect-forms` → `references/forms-reference.md` and look the name up there.
2. If it is not in that table, check the base theme for it: a name used by a base-theme snippet
   is real regardless of what any reference says.
3. Only then report it, and say which of the two you checked.

Verified-real names that get mistaken for invented ones:

- `remove-promo-code` — real, takes a `code` field, and the base theme's own promo-code snippet
  uses it. `apply-promo-code` likewise.
- `payment-not-required` — real, for zero-total orders.
- `add-preset-bundle`, `add-bundle-to-cart` — both real and distinct.
- `geolocation-select`, `geolocation-dismiss` — real.
- `embedded-save-payment-method` — registered, but it depends on a request context a normal page
  does not have. A theme that placed it in a storefront template is a genuine Critical finding;
  the name being real does not make the usage right.

## Names that are genuinely invented

These are not registered. A `{% form %}` using one raises and the page renders an error, so
each is Critical.

| Invented | Use instead |
|---|---|
| `contact` | Configure a Salesforce custom form and render `custom-form` with its identifier. |
| `newsletter` | Same — `custom-form`. |
| `update-cart` | `cart`. |
| `remove-from-cart` | `cart` — removal is a quantity change within the same form. |
| `voucher` | `apply-voucher` / `remove-voucher` / `activate-voucher`. |
| `promo-code` | `apply-promo-code` / `remove-promo-code`. |
| `checkout-payment` | `payment`. |
| `buy-button` | `add-to-cart`. |

## Field names that are commonly wrong

| Form | Correct fields | The mistake |
|---|---|---|
| `login` | `username`, `password` | Using `email`. The field is `username` even when the store authenticates on an email address. |
| `register` | required: `email`, `password`, `firstname`, `lastname`, `billing_address_lines`, `billing_city`, `billing_state`, `billing_postal_code`, `billing_country`; optional: `phone`, `company_name`, `campaign_ids` | Omitting the billing address fields. They are required, so registration fails validation with errors the theme may not be displaying. Also `first_name`/`last_name` instead of `firstname`/`lastname`. |
| `checkout-accept-terms` | `terms_accepted` (boolean) plus any custom questions | Renaming it, or not marking the checkbox required. |
| `add-to-cart` | `quantity`, `price`, `product_bookable_location_id`, `booking_start`, `booking_end`, plus custom-question fields | Adding a `variant_id` field. **There is no such field.** A variant is its own product: pass the selected variant to the form as `product:` (the drop, cheaper) or `product_id:` (the SFID). |
| `apply-promo-code`, `remove-promo-code` | `code` | — |
| `custom-form` | `identifier:` option set to the Form SFID; question fields as `answers[<question_id>][answer]` | Hand-naming answer inputs. |

Prefer `{{ field.name }}` and `{{ field.id }}` from the form object over hardcoding either.
A hardcoded `name` that drifts from the form class produces a submission that validates against
nothing and silently discards the value — hard to spot, worth flagging as Warning wherever the
theme hardcodes rather than reads.

## Field objects have no label

A field object exposes exactly: `name`, `id`, `value`, `original_value`, `required?`, `errors`.
There is **no `label`**. All label text is the theme's responsibility, from a translation key.

```liquid
{%- assign field = form.fields["username"] %}
<div class="SC-Field{% if field.errors != blank %} has-error{% endif %}">
  <label for="{{ field.id }}">{{ "theme.login.username" | t }}</label>
  <input type="text"
         name="{{ field.name }}"
         id="{{ field.id }}"
         value="{{ field.value | escape }}"
         autocomplete="username"
         {% if field.required? %}required{% endif %}>
  <span class="SC-Field_error">{{ field.errors | try: "messages" }}</span>
</div>
```

`{{ field.label }}` renders empty. Any theme using it has unlabeled inputs — Warning, and
Critical on checkout.

## Error surfacing is the most common real defect

Two distinct gaps, both easy to verify and both frequently present:

**1. Field errors are never shown.** The base `form_errors` snippet renders only errors whose
field is `base`, unless it is called with `include_fields: true`. A form that renders
`{% render "form_errors", errors: form.errors %}` and nothing per-field displays a generic
"there were errors" banner and never tells the visitor which field. Grep every `{% form %}` for
a `field.errors` output. Warning on any form; treat it as Critical on registration and checkout,
because the visitor cannot complete the task.

**2. Errors are not announced.** The base `form_errors` snippet has no `role="alert"`, so a
screen-reader user gets no notification at all. Adding `role="alert"` to the error container is
a small, safe fix and should be proposed on any overridden error snippet. Where the theme has
not overridden it, report it as a base-theme gap.

## Form checks in order of severity

| Severity | Check |
|---|---|
| Critical | Unregistered form name (verified against the reference and the base theme). |
| Critical | A mutation done with a hand-written `<form action=…>` instead of `{% form %}` — it has no authenticity token and no route. |
| Critical | A hidden field emitted by the tag removed or renamed. |
| Critical | `variant_id` on add-to-cart, or a missing `product:`/`product_id:`. |
| Critical | A form or component container is inside `{% cache %}`. These surfaces must remain uncached because their correctness can vary by visitor or request. |
| Warning | No field-level error output. |
| Warning | No label, or a placeholder used as the label. |
| Warning | Field name hardcoded rather than read from the form object. |
| Warning | Missing or wrong `autocomplete` on identity, address, or payment fields. |
| Warning | Required checkbox (terms) not marked `required`. |
| Suggestion | No `role="alert"` on the error container. |
| Suggestion | No `aria-describedby` linking an input to its error text. |
| Suggestion | `remote: true` used without a working non-JS fallback. |

## Never repopulate these

On a failed submission, a form may safely repopulate names, emails, addresses, quantities.
It must never repopulate a password, a password confirmation, a voucher PIN, card details, or
any provider token. Flag repopulation of any of these as Critical, and flag any of them written
into a URL, a `data-` attribute, or client storage the same way.

Do not hand-build payment inputs or payment transport. If a theme has replaced a provider
snippet's generated form, that is a Critical finding on its own: override the smallest possible
provider snippet and keep its generated form, fields, scripts, and validation.

## Translations are records, not a theme file

Theme translations live as translation records on the store (or the CSV being synced into them),
not as a JSON file in the theme templates. So "the theme is missing a translations file" is not
a finding. The correct fix for any missing key is: add the key as a translation record.

The base fallback set contains roughly 1,660 keys. Two facts that matter for the audit:

- There is **no `accessibility` key group.** Do not recommend `"accessibility.skip_to_content"`
  or `"accessibility.close"`. Real close labels live at `shared.screen.close`,
  `header.menu.close`, `header.dropdowns.cart.close`, and `search.filters.close`. A skip-link
  label has to be a new key the theme adds.
- Some keys have deprecated aliases that still resolve and emit a console deprecation warning
  (for example the older `line_items.*` names for what is now `cart_items.*`). A theme using one
  is a Suggestion to update, not a defect.

Both `| t: count: n` and `| t, count: n` are valid call syntax; the base theme uses both.

## A missing key renders visible garbage

An unknown key does not return blank. It returns a non-blank diagnostic string of the form
``missing translation: `sc.locale.<key>` for locale: `en` `` and that string is rendered into
the page.

The consequence agents get wrong: **`{{ "some.key" | t | default: "Fallback" }}` can never fall
back**, because `default` only fires on a blank value and the `t` output is never blank. Every
`| t | default:` chain in a theme is dead code that will ship the diagnostic string to
customers. Flag it as Warning, and give the real fix: add the key as a translation record.

## Two more non-blank failure modes

Both follow the same shape and both are worth grepping for:

- **Missing interpolation variable.** A key containing `%{name}` called without that variable
  leaves the literal placeholder in the output. `Order a %{product} Now!` reaches the customer.
  Check every `| t` call against the placeholders its key actually uses.
- **Missing asset.** `{{ "images/hero" | asset_url }}` on an asset that does not exist returns
  `unknown asset: images/hero` — again a visible string rather than a broken-image URL. A theme
  referencing a renamed or deleted asset shows text where the image should be. Warning.

## Pluralization

There is **no `pluralize` filter.** The Shopify-style `{{ n | pluralize: "item", "items" }}`
does not exist and renders nothing useful. Pluralization happens inside `t`: pass `count:` and
point the key at a *group* of sub-keys.

Two smells to flag, both common in themes ported from Shopify:

```liquid
{{ n }} item{% if n != 1 %}s{% endif %}        <!-- inline English grammar -->
{% if n == 1 %}{{ "cart.item" | t }}{% else %}{{ "cart.items" | t }}{% endif %}
```

Both fix to one grouped key:

```liquid
{{ "cart.items.count" | t, count: n }}
```

```json
{ "cart": { "items": { "count": { "zero": "Your cart is empty",
                                 "one": "1 item",
                                 "other": "%{count} items" } } } }
```

Convention: name the group `count`, so call sites read as `"…items.count" | t, count: n`. Every
pluralized group in the base theme follows it.

Sub-key selection order, highest precedence first:

| Sub-key | Selected when |
|---|---|
| `zero` | `count` is 0 **and** `zero` is present |
| `one` | `count` is 1 **and** `one` is present |
| `#N` | an exact-match key for that number exists, e.g. `#2` |
| `N_M` | a range key whose bounds contain `count`, inclusive, e.g. `3_5` |
| `infinity` | `count` is infinity |
| `other` | nothing above matched |

`zero` and `one` outrank `#0` and `#1`, so `#1` is never reached when `one` exists.

**If nothing matches, it raises** rather than degrading. So a group that accepts `count:` but
has no `other` sub-key is a latent error on any count it did not enumerate. Flag a missing
`other` as Warning.

The exact-match and range keys are genuinely useful and underused: `#2` for "fortnight" against
a weeks group, or `#1`…`#4` for address-line labels. Propose them where a theme is doing the
same thing with `{% if %}`.

## Translation checks in order of severity

| Severity | Check |
|---|---|
| Warning | A hardcoded user-facing string that should be a key. |
| Warning | `| t | default:` — dead fallback, will ship the diagnostic string. |
| Warning | A `| t` call whose key exists but whose placeholders are not all supplied. |
| Warning | A pluralized group with `count:` and no `other`. |
| Warning | `| pluralize`, or inline `{% if n != 1 %}s{% endif %}` grammar. |
| Warning | `| asset_url` on an asset the theme does not contain. |
| Suggestion | Paired singular/plural keys selected by `{% if %}` rather than one group. |
| Suggestion | A deprecated key alias still in use. |
| Suggestion | A key that could use `#N` or `N_M` instead of branching. |

For keys you cannot resolve without the store, say so rather than guessing: list the keys the
theme references and note that existence was not verified against the store's translation
records.
