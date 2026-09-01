# StoreConnect Liquid form reference

The public storefront form names intended for theme use, their supported options
and fields, and the failure behavior that affects implementation. Confirm this
reference against the current base theme and installed release before using a
name or field.

## Table of contents

- [How the tag behaves](#how-the-tag-behaves)
- [Drop API](#drop-api)
- [Registered form names](#registered-form-names)
  - [Session and single sign-on](#session-and-single-sign-on)
  - [Accounts](#accounts)
  - [Cart](#cart)
  - [Checkout steps](#checkout-steps)
  - [Discounts, vouchers, and credit](#discounts-vouchers-and-credit)
  - [Payment](#payment)
  - [Saved payment methods and subscriptions](#saved-payment-methods-and-subscriptions)
  - [Bookings](#bookings)
  - [Privacy and geolocation](#privacy-and-geolocation)
  - [Custom forms](#custom-forms)
- [Field-name conventions](#field-name-conventions)
- [Names that are not registered](#names-that-are-not-registered)
- [Failure catalog](#failure-catalog)

## How the tag behaves

```liquid
{% form "<registered-name>"[, option: value]... %} … {% endform %}
```

The tag resolves a documented form name for the current storefront and exposes
it in the block as `form`. A theme cannot add a form name. If a name is absent
from the public list below, treat it as unavailable and confirm the current base
theme rather than guessing.

An unregistered name is not a parse error. The tag fails at render time, the form is replaced in the page by `Liquid error (line N): internal`, and the error is reported to the platform Console. Nothing is submitted and nothing is saved.

What the tag generates for you, and what you must not touch:

| Generated | Notes |
|---|---|
| The `<form>` element, its destination, and its HTTP method | Use the generated values; do not repoint or reconstruct them. |
| Protected and context fields | Preserve all generated form fields and submit the generated form unchanged. Do not inspect, rename, cache, or recreate these fields. |

Options accepted by every form: `id:`, `class:`, and any `data-*` attribute, which pass through to the rendered element. `remote: true` requests a background submission — **only** `cart`, `apply-voucher`, `apply-provider-voucher`, `remove-voucher`, `privacy-accept-all`, `privacy-reject-all`, and `privacy-settings` honor it. Every other form hardcodes a normal submission and silently ignores `remote:`. `geolocation-dismiss` is always submitted in the background.

For a remote form, `data-success: "<event name>"` and `data-error: "<event name>"` dispatch a document event carrying the response, which is how the base theme refreshes the cart and voucher regions. See `storeconnect-components`.

Do not attempt to override the form destination or method. Use the generated
form element and `form.path` where the documented workflow calls for it.

Tag options do not accept filters. `class: "x" | append: "y"` and `label: "some.key" | t` both fail silently — the option parser stops at the pipe. Use a `t.`-prefixed string for a translation (`"t.some.key"`) or interpolate inside the quotes (`"{{ some.key | t }}"`). This applies to every tag, not just `{% form %}`.

## Drop API

`form` exposes exactly three attributes. Anything else is an error, not an empty string.

| Attribute | Type | Notes |
|---|---|---|
| `form.fields` | Collection of FormField | Look up by string key: `form.fields["email"]`. A name not on the form returns `nil`. |
| `form.errors` | Collection of FormError | Every field's errors plus base-level errors. `form.errors.size` is safe to test. |
| `form.path` | String | The action path. Combine with the `params` filter to change the post target within the same form, as `add-to-cart` does for add-versus-buy-now: `formaction="{{ form.path \| params: after: "cart" }}"`. |

FormField:

| Attribute | Notes |
|---|---|
| `name` | The input `name`. Always render this rather than typing the name yourself. |
| `id` | Unique per rendered form. Always render the supplied value rather than hard-coding an id. |
| `value` | Submitted value after a failed submission, otherwise the stored value. Empty for every credential-style field. |
| `original_value` | The stored value, ignoring any replayed submission. |
| `errors` | A FormError, or `nil` when clean. Always pipe through `try:`: `{{ field.errors \| try: "messages" }}`. |
| `required?` | Boolean. See the caveats per form — some forms never set it. |

There is no `label`, `type`, `placeholder`, `hint`, or `options` attribute. Label text, input type, and option lists are the theme's job.

Templates render in strict-variable mode, so dot-access to an attribute that does not exist — `form.username`, `field.label` — is an undefined drop method. It renders as an empty string in the page, with no error text, and reports `undefined method <name>` to the platform Console. Bracket lookup behaves differently and more forgivingly: `form.fields["not_a_field"]` simply returns nil, so `{% if field %}` is the right guard for a conditionally present field.

`field.value` and `field.original_value` are customer-supplied strings and are not escaped for you. Pipe them through `escape` in an HTML attribute or text node and `j` inside a script or JSON string. Never build a URL, `href`, or inline event handler from them.

FormError: `field`, `messages` (message only), `full_messages` (message prefixed with the field name).

The base theme ships `{% render "form_errors", errors: form.errors %}`. It prints a summary line and, by default, **only** the messages whose `field` is `base`. Pass `include_fields: true` to list every field's message in the summary.

## Registered form names

The **Feedback** column says where a failure surfaces. `form.errors` means the form replays errors into its fields; `flash` means it redirects with a message in `current_flash` and `form.errors` stays empty forever.

### Session and single sign-on

| Name | Method | Options | Fields | Feedback |
|---|---|---|---|---|
| `login` | POST | — | `username`, `password` — both `required?` | `form.errors`; only `username` is replayed |
| `single-sign-on` | POST | `provider:` (an entry from `current_store.authentication_providers`) | — | Requires a provider configured for the current store |
| `sso-login` | POST | Same as above | — | Alias of `single-sign-on`; identical behavior |

Login is `username`, not `email`. The stored login may happen to be an email address, but the field name is `username` and `autocomplete="username"` is the right token.

### Accounts

| Name | Method | Options | Fields | Notes |
|---|---|---|---|---|
| `register` | POST | — | `email`, `password`, `firstname`, `lastname`, `phone`, `campaign_ids`, `company_name`, `billing_address_lines`, `billing_city`, `billing_state`, `billing_postal_code`, `billing_country` | `required?` is true for everything except `phone`, `campaign_ids`, `company_name` — so registration requires a full billing address. There is **no** `password_confirmation`. Names are `firstname`/`lastname`, one word. |
| `account` | PUT | — | `username`, `current_password`, `password`, `password_confirmation`, `email`, `firstname`, `lastname`, `phone`, `campaign_ids`, `company_name`, `billing_address_lines`, `billing_city`, `billing_state`, `billing_postal_code`, `billing_country`, `shipping_address_lines`, `shipping_city`, `shipping_state`, `shipping_postal_code`, `shipping_country` | This form never sets `required?`, so it is always false. Mark required inputs yourself. Render it more than once on a page (contact, billing, shipping panels) as the base theme does. |
| `account-missing-details` | PUT | — | The subset of `account`'s fields the signed-in customer has not filled in | The field list is empty when nothing is missing, so guard with `{% if field %}` for every field you render. |
| `accept-invitation` | PUT | — | `password`, `password_confirmation`, `campaign_ids` — all flagged `required?` | Use only on the platform invitation page and preserve all generated form fields. |
| `forgot-password` | POST | — | `email` | |
| `reset-password` | PUT | — | `password`, `password_confirmation` | Use only on the platform reset page and preserve all generated form fields. |
| `resend-confirmation` | POST | — | `username` | |
| `update-payment-method` | PATCH | `method_id:` (required) | — | Sets a saved method as the default. Preserve the generated form unchanged. |
| `remove-payment-method` | DELETE | `method_id:` (required) | — | Body is just a submit button. |

Never place protected invitation, account-recovery, or single-sign-on data in a
URL you construct, a query string, a log, or client storage.

### Cart

| Name | Method | Options | Fields | Notes |
|---|---|---|---|---|
| `add-to-cart` | POST | `product:` (a Product Drop — preferred, avoids a lookup) **or** `product_id:` (SFID) | `quantity`, `price`, `product_bookable_location_id`, `booking_start`, `booking_end`, plus one `answers[<question_id>][answer]` per question attached to the product | All five base fields report `required? == true` for every product, including non-bookable ones — do not use `required?` here to decide whether to render a field. `price` is only meaningful for variable-priced products; `booking_*` and `product_bookable_location_id` only for bookable ones. There is **no** `variant_id`: a variant is a product, so pass the variant's own Drop or SFID. |
| `cart` | POST | Honors `remote: true` | — (no field Drops) | Input names are `cart_items[<cart_item_id>][quantity]` and `cart_items[<cart_item_id>][use_points]`; `line_items[...]` is accepted as a legacy alias. Submitting quantity `0` removes the line. Feedback is **flash**, not `form.errors`. |
| `add-bundle-to-cart` | POST | `product:` or `product_id:` (the bundle) | — | Component selections are plain inputs; follow the current base theme's bundle snippet. Use the documented feedback channel. |
| `add-preset-bundle` | POST | `product_id:` (required) | — | Preserve the generated form unchanged. |

Removing a single line and emptying the cart are not forms — use `cart_item.delete_path` and `current_store.cart_path` with `data-method="delete"`.

### Checkout steps

Branch on `current_checkout_step`, which is one of `customer_information`, `shipping_information`, `accept_terms`, `payment_information`. Rendering the wrong step's form for the current step posts to a route the customer is not on.

| Name | Method | Fields | Notes |
|---|---|---|---|
| `checkout-customer-information` | PATCH | Always: `email`, `phone`, `company_name`, `shipping_address_lines`, `shipping_city`, `shipping_state`, `shipping_postal_code`, `shipping_country`, `billing_same_as_shipping`, `billing_address_lines`, `billing_city`, `billing_state`, `billing_postal_code`, `billing_country`, `allowed_shipping_countries`, `allowed_billing_countries`, `assisted_by_user_id`, `customer_notes`, plus `answers[<question_id>][answer]` per cart question. Conditional: `full_name` **or** `first_name` + `last_name` (store configuration decides which); `email_confirmation`; and `recipient_email`, `recipient_full_name`, `recipient_phone`, `recipient_address_lines`, `recipient_postal_code`, `recipient_city`, `recipient_country`, `recipient_state` when the store's `show_new_recipient_form` variable is on. | `required?` is computed per country and depends on `billing_same_as_shipping`, so drive your `required` attributes from `field.required?` here. Guard every conditional field with `{% if field %}`. `billing_same_as_shipping` is a boolean — pair a hidden `0` with a checkbox `1`. Preserve any additional generated fields from the current base theme. |
| `checkout-shipping-information` | PATCH | `method`, `collection_time`, `click_and_collect_option`, plus `answers[...]`. Conditional: `notes` when the store's `use_shipping_notes` variable is on; `use_points` when a points-priced shipping rate applies; and for each delivery-schedulable cart item, `schedule[<cart_item_id>][delivery_window_id]`, `schedule[<cart_item_id>][delivery_start_date]`, `schedule[<cart_item_id>][delivery_time]`, `schedule[<cart_item_id>][delivery_day]`. | `method` is mandatory — submitting without it aborts the step with a "shipping method not selected" alert. **The `schedule[...]` entries are Drops for prefill and error lookup only. The parameter family the handler actually reads is `delivery_options[<cart_item_id>][delivery_window_id \| delivery_start_date \| delivery_time \| delivery_day]`** — name your inputs `delivery_options[...]` and use the `schedule[...]` Drop only to read `value` and `errors`. Both key families embed the cart item id, so build them with `capture`. |
| `checkout-accept-terms` | PATCH | `terms_accepted`, plus `answers[...]` | `terms_accepted` is cast to a boolean. Pair a hidden input with value `0` and a checkbox with value `1` on the same name, and mark the checkbox `required`. |
| `payment-not-required` | PATCH | `assisted_by_user_id`, `customer_notes`, `payment_method` | `type:` is required and must be exactly `points`, `store-credit`, or `no-payment`. Any other value renders **nothing at all** — no form, no error. |
| `checkout-set-password` | POST | `password` (`required?`), `campaign_ids` | `order:` is required and must be an Order Drop. Use this only on the order-confirmation page and preserve all generated form fields. |

Checkout questions do not need a nested `custom-form`. Attach the Form in Salesforce with the in-checkout display mode and the step's own `answers[...]` fields accept the answers. Nesting `{% form "custom-form" %}` inside a checkout step produces invalid nested HTML — the inner element is discarded and its inputs post to the outer step.

### Discounts, vouchers, and credit

| Name | Method | Options | Fields | Feedback |
|---|---|---|---|---|
| `apply-promo-code` | POST | — | `code` | **flash only.** `form.errors` is always empty — render `current_flash` or the customer sees nothing. |
| `remove-promo-code` | DELETE | — | `code` | **flash only.** This name **is** registered and is used by the current base theme; supply the code as a hidden input. |
| `apply-voucher` | POST | Honors `remote: true` | Preserve every generated field | `form.errors`. Treat all generated voucher values as sensitive: never inspect, replay, or log them. |
| `remove-voucher` | DELETE | `voucher:` — must be an applied-voucher Drop; anything else renders nothing. Honors `remote: true` | — | flash |
| `activate-voucher` | POST | `voucher:` (required) | — | flash |
| `apply-provider-voucher` | POST | `provider:` — must be a voucher-provider Drop with an active adapter, otherwise renders nothing. Honors `remote: true` | Defined by the configured provider. | `form.errors`. Sensitive values are never replayed; do not fill them from anywhere else. Preserve all generated form fields. |
| `apply-account-credit` | POST | — | `id`, `amount` — both `required?` | `form.errors`. `id` must come from an available-credit Drop on the page. |
| `remove-account-credit` | DELETE | `account_credit:` — must be an applied-credit Drop; anything else renders nothing | — | flash |

### Payment

Use `{% form "payment", provider: <payment provider drop> %}` with a provider
resolved by the current page. Do not build, inspect, or script the payment
fields yourself. Start from the current base theme, override the smallest
possible provider snippet, and preserve its generated form fields, scripts,
field ids, and accessible error containers unchanged. Limit styling to the
documented markup and classes around that generated experience.

If no active provider supports the requested capability, the form renders empty or omits itself. Report the missing store or provider configuration instead of substituting a different form.

### Saved payment methods and subscriptions

| Name | Method | Options | Notes |
|---|---|---|---|
| `add-payment-method` | POST | — | Use the current base-theme implementation and preserve all generated fields. The form may render nothing when the store has no compatible provider, so guard surrounding headings and buttons. |
| `update-subscription-payment-details` | PATCH | `subscription:` — must be a Subscription Drop, otherwise renders nothing | Replaces the stored payment method on a subscription. |
| `subscription-payment` | POST | `subscription:` — must be a Subscription Drop, otherwise renders nothing | Pays an outstanding subscription amount. Defaults its element id to `subscription-payment-form`. |
| `additional-payment-billing-address` | PATCH | — | Fields: `billing_address_lines`, `billing_city`, `billing_state`, `billing_postal_code`, `billing_country`, `allowed_billing_countries`. `billing_state` is `required?` only when the selected country has subdivisions. Renders in the platform's additional-payment page context, which supplies the order. |

### Bookings

| Name | Method | Options | Fields |
|---|---|---|---|
| `booking-attendee-add` | POST | `booking:` (required) | `id`, `first_name`, `last_name`, `email`, `phone`, `is_contact` |
| `booking-attendee-edit` | PUT | `attendee:` (required) | Same six fields |

Neither form sets `required?`, so mark required inputs yourself. `is_contact` is a two-value radio group (`true`/`false`) sharing one name. `id` is rendered as a hidden input. Field ids are suffixed with the attendee id (or a random value for a new attendee), so several of these forms can coexist on one page.

### Privacy and geolocation

| Name | Method | Fields | Notes |
|---|---|---|---|
| `privacy-accept-all` | POST | — | Honors `remote: true`. |
| `privacy-reject-all` | POST | — | Honors `remote: true`. |
| `privacy-settings` | POST | — | Honors `remote: true`. Input names are `privacy_settings[groups][<group_id>][enabled]` and `privacy_settings[groups][<group_id>][cookies][<cookie_id>][enabled]`, each paired with a hidden `0`. Buttons can retarget the same form with `formaction="{{ current_privacy.enable_all_path }}"` or `current_privacy.disable_all_path`. |
| `geolocation-select` | POST | — | One input named `store_id`, populated from `current_store.geolocation.sibling_stores`. |
| `geolocation-dismiss` | DELETE | — | Always submitted in the background regardless of `remote:`. |

### Custom forms

`custom-form` is the only route to a form the platform does not model — enquiry, contact, newsletter, survey, membership opt-in.

| Name | Method | Options | Fields |
|---|---|---|---|
| `custom-form` | POST | `identifier:` — the Form SFID (required) | Exactly one field per question: `answers[<question_id>][answer]`. Nothing else. |

Resolve the Form through `all_custom_forms[<sfid>]` and pass
`identifier: <form>.id` from that Drop rather than from a request parameter.
Preserve all generated form fields. The Form and its Questions are Salesforce
records — see `storeconnect-salesforce-data`.

Question Drops expose `id`, `question_content`, `data_type`, `default_value`, `picklist_options` (with `value` and `label`), `required?`, and `hidden?`. `data_type` is one of `Boolean`, `Text`, `Text Area`, `Integer`, `Decimal`, `Date`, `Datetime`, `Picklist`, `Multi-Picklist`, `File`. Multi-picklist answers are stored semicolon-joined. A File question takes the field prefix `answers[<question_id>]` rather than the `[answer]` leaf.

When a question is answered against a specific cart or order item, add `answers[<question_id>][item_id]` alongside the answer.

Never put a credential, payment detail, or unnecessary sensitive personal data in a custom form. For business processing after submission, use Salesforce automation or the patterns in `storeconnect-controllers` / `storeconnect-apex-integration`.

## Field-name conventions

**Address lines are arrays.** `billing_address_lines`, `shipping_address_lines`, and `recipient_address_lines` hold an array of lines; the array's length is how many inputs to render. Render one input per entry with `name="{{ field.name }}[]"` and give each a distinct `id`:

```liquid
{%- assign field = form.fields["billing_address_lines"] %}
{%- for line in field.value %}
  {%- assign label = "accounts.shared.address_form.address_lines.count" | t, count: forloop.index %}
  <label for="{{ field.id }}_{{ forloop.index }}">{{ label }}</label>
  <input type="text" id="{{ field.id }}_{{ forloop.index }}" name="{{ field.name }}[]" value="{{ line | escape }}"
         autocomplete="billing address-line{{ forloop.index }}"
         {% if forloop.first and field.required? %}required{% endif %}>
{%- endfor %}
```

**`allowed_billing_countries` and `allowed_shipping_countries` are option sources, not inputs.** Their `value` is an array of `[label, code]` pairs. Use them to build the country `<select>` for `billing_country` / `shipping_country`; never render an input for them. Outside checkout, the `all_countries` global provides `name` and `alpha2`.

**State and country selects are wired client-side.** The base theme's address markup relies on a container carrying `data-checkout-address-container`, `data-country-id="{{ country_field.id }}"`, and `data-state-id="{{ state_field.id }}"`, with `data-selected` on each select. If you replace that markup, either keep the wiring or supply your own subdivision list — otherwise the state select renders empty.

**Booleans need a paired hidden input.** An unchecked checkbox submits nothing. Emit a hidden input with value `0`/`false` immediately before the checkbox, on the same `name`. This applies to `terms_accepted`, `billing_same_as_shipping`, `cart_items[...][use_points]`, and boolean questions.

**Custom question fields are always `answers[<question_id>][answer]`.** Build the key with `capture`, then look it up: `{% capture key %}answers[{{ question.id }}][answer]{% endcapture %}{% assign field = form.fields[key] %}`.

## Names that are not registered

Writing any of these fails at render time: the form is replaced by `Liquid error (line N): internal` and the error is reported to the platform Console.

| Invented name | Use instead |
|---|---|
| `contact`, `contact_form`, `enquiry`, `newsletter`, `subscribe` | `custom-form` with a Salesforce Form |
| `update-cart`, `cart-update` | `cart` |
| `remove-from-cart`, `remove-cart-item`, `delete-cart-item` | `cart_item.delete_path` with `data-method="delete"`, or quantity `0` in the `cart` form |
| `clear-cart`, `empty-cart` | `current_store.cart_path` with `data-method="delete"` |
| `add_to_cart`, `product_form`, `buy-button` | `add-to-cart` |
| `checkout_form`, `checkout`, `checkout-payment` | The `current_checkout_step` form, or `payment` |
| `voucher`, `promo-code`, `coupon` | `apply-voucher`, `apply-promo-code` |
| `logout`, `sign-out` | Not a form — link to the platform's sign-out path |
| `search` | Not a form — a plain `<form method="get">` to the store's search path |

`remove-promo-code` **is** registered — do not treat it as invented.

Field names that do not exist anywhere: `variant_id`, `product_variant_id`, `sku`, `line_item_id` as a top-level name, `password_confirmation` on `register`, `terms` or `accept_terms` (the field is `terms_accepted`), `first_name`/`last_name` on `register` (they are `firstname`/`lastname`).

## Failure catalog

| Symptom | Cause | Fix |
|---|---|---|
| `Liquid error (line N): internal` where the form should be | Unregistered form name | Use a name from the enumeration above |
| A field value renders blank, and the Console logs `undefined method <name>` | `form.<field>` or `field.<something not in the Drop API>` — strict-variable mode rejects it, silently in the page | `{% assign field = form.fields["<name>"] %}` then use only `name`, `id`, `value`, `original_value`, `errors`, `required?` |
| Inputs render but nothing is saved; server reports the field as blank | The input `name` was typed by hand and does not match the form's field name | Render `name="{{ field.name }}"` from the Drop |
| Form submits but validation errors never appear | Either the form reports through flash (promo code, cart, geolocation, privacy, and the remove/activate forms) or generated fields were removed | Render `current_flash` for flash-channel forms; restore the generated form unchanged |
| Only a generic "form has errors" line shows, never the specific message | `form_errors` prints base-level messages only by default | Render `field.errors` beside each input, or pass `include_fields: true` |
| Nothing renders at all, no error | A form that returns early: `payment-not-required` with an invalid `type:`, `remove-voucher`/`remove-account-credit`/`update-subscription-payment-details`/`subscription-payment` given the wrong Drop, `apply-provider-voucher` with no active adapter, `add-payment-method` with no provider that can save a card | Check the option's type and the store's provider configuration; guard the surrounding markup so a heading and button do not appear alone |
| `remote: true` is ignored and the page reloads | Only the currently documented remote-capable forms honor it | Keep the generated form's normal navigation. Use a component reload only after a supported remote form reports success — see `storeconnect-components` |
| Intermittent rejected submissions, or a customer sees another customer's prefilled details | The form is inside `{% cache %}`, or inside a cached page region | Remove the cache around the form; cache only static neighbors |
| Address saves only the first line | One input rendered instead of one per array entry, or `name` missing the `[]` | Loop `field.value` and use `name="{{ field.name }}[]"` |
| Checkbox never submits its unchecked state | No paired hidden input | Add a hidden input with value `0` before the checkbox on the same name |
| State select is empty | The client-side wiring on the address container was dropped | Restore `data-checkout-address-container` with `data-country-id` and `data-state-id`, or supply your own subdivision options |
| Custom form posts but no answers are recorded | Field name built by hand instead of read from `form.fields["answers[<id>][answer]"]`, or `identifier:` not set to the Form SFID | Build the key with `capture` and look it up; pass `identifier: <form>.id` |
| Inputs inside a form are ignored by the handler | They are extra fields the form does not accept | Read them in that route's Liquid controller — `storeconnect-controllers` |
| Two forms on a page interfere, or one silently loses its inputs | Nested `{% form %}` blocks — nested form elements are invalid HTML | Render them as siblings |
| A label or class renders as a raw translation key | A filter was piped inside a tag option | Use `"t.some.key"` or `"{{ some.key \| t }}"` |
| Delivery window selections are ignored | Inputs named `schedule[...]` instead of `delivery_options[...]` | Read prefill and errors from the `schedule[...]` Drop, but name the input `delivery_options[...]` |
