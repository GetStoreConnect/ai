---
name: storeconnect-forms
description: StoreConnect storefront forms — the Liquid form tag, registered form names and usable fields (login, register, account, add-to-cart, cart, the four checkout steps, vouchers, promo codes, account credit, saved payment methods, subscriptions, bookings, privacy, geolocation, custom forms), the form and field Drop API, validation and error handling, safe generated-field handling, and form accessibility. Load before writing any form name or field name into a StoreConnect template, whenever a template must accept customer input, and when a form will not submit, validate, or show its errors.
---

# StoreConnect storefront forms

Every write a storefront makes on behalf of a customer goes through `{% form "<name>" %}`. The tag renders the form element, its supported destination and method, and the protected fields needed for submission. Use only documented form names, preserve all generated form fields, and do not point a StoreConnect form at a custom endpoint.

## Non-negotiable rules

Read these before writing any form. Each one causes a broken storefront, a silent no-op, or a data leak if ignored.

1. **Only a registered name.** An unregistered name fails at render time: the form is replaced in the page by `Liquid error (line N): internal`, and nothing can be submitted. Do not infer a name from a URL, a controller, or another platform's vocabulary. Confirm the name in [references/forms-reference.md](references/forms-reference.md) before you write it.
2. **Read fields through `form.fields["<name>"]`.** The form Drop exposes exactly three attributes: `errors`, `fields`, `path`. `form.username` is an undefined drop method: templates render in strict-variable mode, so it emits `Liquid error (line N): undefined method username` into the page where the value should be and reports the error to the platform Console. Bracket lookup is the safe form — `form.fields["not_a_field"]` returns nil, which `{% if field %}` handles cleanly.
3. **Never wrap a form in `{% cache %}`,** and never cache a page region that contains one. Form markup is visitor-specific and may contain prefilled `field.value` data — caching it can cause rejected submissions or expose one customer's name, address, or email to another.
4. **Preserve all generated form fields.** Never remove, rename, replace, inspect, or reconstruct protected fields emitted by the tag. Submit the generated form unchanged so validation and error replay continue to work across releases.
5. **Never repopulate a secret.** Do not echo `field.value` back into a credential, voucher PIN, payment, or other sensitive input. The platform already refuses to retain those values; do not reintroduce them from your own state.
6. **Never build a payment form by hand,** and never add script that reads a card or bank input. Use `{% form "payment", provider: <provider drop> %}` and override the smallest possible provider snippet from the current base theme, keeping its generated fields, scripts, and validation. If no active provider supports what is being asked, report the missing configuration — do not substitute another form.
7. **Never trust a request-supplied identifier.** Options such as `method_id:`, `voucher:`, `account_credit:`, `subscription:`, `order:`, and `identifier:` must come from a Drop the current page already resolved for the authenticated customer, never from `current_request.params`. Feeding a raw param into a form option turns it into an object reference the storefront never authorized.
8. **Never hard-code a platform route.** Do not write an auth, cart, checkout, payment, component, or form URL into a template or into JavaScript. Use `form.path` (optionally with the `params` filter) and the store's own path attributes. A hard-coded route breaks the moment the store's configuration or locale changes.
9. **Every input needs a label and a real `autocomplete` token.** Field Drops carry no label text — `.label` does not exist and reaching for it produces a visible Liquid error, not an empty string. Supply translated theme text and connect it with `for`/`id`.

## Workflow for adding or fixing a form

1. Name the goal, then map it to a mechanism using the table below. If the goal has no form, stop — do not substitute a form that looks close.
2. Confirm the form name and its field names in [references/forms-reference.md](references/forms-reference.md). Do this **before** writing any markup.
3. Check the form's options column. Options that take a Drop (`product:`, `voucher:`, `subscription:`, `order:`, `provider:`, `account_credit:`, `identifier:`) must be satisfied from a Drop the page already resolved. Several forms render nothing at all when given the wrong type.
4. Lift the closest example from [references/form-examples.md](references/form-examples.md) and replace its field lookups with the ones your form actually has.
5. Wire the feedback channel — `form.errors` or `current_flash` — as the reference specifies for that form.
6. Run the verification list at the end of this file.

## Pick the mechanism before you pick the form

| Goal | Mechanism |
|---|---|
| Sign in, register, recover a password, edit a profile | `login`, `register`, `forgot-password`, `reset-password`, `account` |
| Add a product (including a variant) to the cart | `add-to-cart` with `product:` or `product_id:` — there is **no** `variant_id`; a variant is a product |
| Change cart quantities | `cart`, with inputs named `cart_items[<cart_item_id>][quantity]` |
| Remove one cart line | **Not a form.** Link to `cart_item.delete_path` with `data-method="delete"`, or submit quantity `0` in the `cart` form |
| Empty the cart | **Not a form.** Link to `current_store.cart_path` with `data-method="delete"` |
| Advance a checkout step | Branch on `current_checkout_step` (`customer_information`, `shipping_information`, `accept_terms`, `payment_information`) and render that step's form |
| Take payment | `payment` with a provider Drop, or `payment-not-required` with `type:` |
| A contact, enquiry, newsletter, or survey form | **There is no `contact` form.** Configure a Form and its Questions in Salesforce, then render `custom-form` with `identifier:` set to the Form SFID |
| Capture an extra field the platform does not model | Add the input inside the existing `{% form %}` and read it in that route's Liquid controller — see `storeconnect-controllers` |

## Which reference to read, and when

- **About to write a form name or a field name into a template** → read [references/forms-reference.md](references/forms-reference.md) and confirm both against the enumeration there. An invented form name is a fatal render error; an invented field name submits nothing and fails silently, and neither is detectable from the template.
- **Building a form from scratch, or fixing one that submits nothing, shows no errors, or has no labels** → read [references/form-examples.md](references/form-examples.md) and lift the matching example (login, register with a multi-line address, add-to-cart, cart update, a checkout step, promo code, custom form, saved payment methods). Each is complete: label, error rendering, `autocomplete`, `aria-invalid`, `role="alert"`.
- **A form renders nothing at all, ignores `remote: true`, or its errors never appear** → read the "Failure catalog" section of [references/forms-reference.md](references/forms-reference.md); these are per-form behaviors, not general bugs.
- **Deciding what a field's input type, option list, or array shape should be** → read the "Field-name conventions" section of [references/forms-reference.md](references/forms-reference.md). Address lines are arrays and need `name="{{ field.name }}[]"`; `allowed_*_countries` are option sources, not inputs.

## The shape every field follows

```liquid
{%- form "login", id: "login-form" %}
  {% render "form_errors", errors: form.errors %}

  {%- assign field = form.fields["username"] %}
  <div class="SC-Field{% if field.errors != blank %} has-error{% endif %}">
    <label for="{{ field.id }}" class="SC-Field_label">{{ "auth.login.form.username" | t }}</label>
    <input type="text" id="{{ field.id }}" name="{{ field.name }}" value="{{ field.value }}"
           autocomplete="username"
           {% if field.required? %}required{% endif %}
           {% if field.errors != blank %}aria-invalid="true" aria-describedby="{{ field.id }}-error"{% endif %}>
    <span class="SC-Field_error" id="{{ field.id }}-error" role="alert">{{ field.errors | try: "messages" }}</span>
  </div>

  <input type="submit" value="{{ "auth.login.form.submit" | t }}">
{%- endform %}
```

Field Drop attributes: `name`, `id`, `value`, `original_value`, `errors`, `required?` — and nothing else. `field.errors` is `nil` when clean, so always pipe it through `try:`. A field that is not on the form returns `nil` — guard conditionally present fields with `{% if field %}` rather than assuming they exist.

`field.value` is whatever the customer last submitted. Escape it for its target context: `| escape` inside an HTML attribute or text node, `| j` inside a script or a JSON string. Never interpolate it into a URL, a `href`, or an event handler.

## Know where the feedback arrives

A form reports failure through one of two channels, and rendering the wrong one leaves the customer with no feedback:

- **`form.errors`** — forms that provide field-level validation feedback. Render `{% render "form_errors", errors: form.errors %}` at the top of the block plus `field.errors` beside each input. Note that `form_errors` prints only base-level messages unless you pass `include_fields: true`.
- **`current_flash`** — the promo-code, cart, geolocation, and privacy forms. Their `form.errors` is **always empty**; if the layout does not render the flash region, failures are invisible. The forms-reference table names the channel for every form.

## Verify before you finish

1. Every form name in the diff appears in the reference enumeration.
2. Every field name in the diff appears under that form in the reference.
3. Grep the diff for `form.` followed by anything other than `fields`, `errors`, or `path` — every hit is bug 2 above.
4. No `{% form %}` sits inside a `{% cache %}` block, and no `{% form %}` is nested inside another `{% form %}` (nested form elements are invalid HTML; the inner one is dropped and its inputs post to the outer action).
5. Every input has a label bound by `for`/`id`, and the error container has `role="alert"`.
6. Submit each form once with valid input and once with invalid input, and confirm the error path renders.
7. After pushing template changes, use the current supported publish and
   cache-refresh workflow — see `storeconnect-sync-deploy`.

## Related skills

`storeconnect-liquid` for the tag and Drop surface around forms. `storeconnect-controllers` for capturing extra inputs, gating a submission, and post-submit redirects. `storeconnect-components` for submitting a form remotely and re-rendering a region. `storeconnect-theme-development` for the base-theme override system that supplies the provider and question snippets. `storeconnect-salesforce-data` for creating the Form and Question records a `custom-form` renders.
