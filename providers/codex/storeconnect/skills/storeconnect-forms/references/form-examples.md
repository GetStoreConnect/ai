# Working StoreConnect form examples

Complete, generic forms you can lift as a starting point. Every example reads its field names through `form.fields[...]`, renders both summary and field-level errors, labels every input, sets a real `autocomplete` token, and marks invalid fields for assistive technology.

Translation keys used here are the current base theme's, so they resolve on a real store. Where a key does not exist yet, add one to your theme's translations rather than hard-coding English.

## Table of contents

- [A reusable field snippet](#a-reusable-field-snippet)
- [Login](#login)
- [Register, with a multi-line address](#register-with-a-multi-line-address)
- [Add to cart](#add-to-cart)
- [Cart update](#cart-update)
- [Checkout: customer information](#checkout-customer-information)
- [Checkout: accept terms](#checkout-accept-terms)
- [Promo code, where feedback arrives through flash](#promo-code-where-feedback-arrives-through-flash)
- [Custom form](#custom-form)
- [Saved payment methods](#saved-payment-methods)
- [Booking attendees](#booking-attendees)

## A reusable field snippet

Create this once and every form below shrinks to a list of calls. `{% render %}` gives it an isolated scope, so pass everything in.

```liquid
{%- comment -%} key: snippets/shared/forms/text_field {%- endcomment -%}
{%- default field: nil %}
{%- default label: nil %}
{%- default type: "text" %}
{%- default autocomplete: nil %}
{%- default hint: nil %}
{%- default autofocus: false %}

{%- if field %}
  <div class="SC-Field SC-Field-expand{% if field.errors != blank %} has-error{% endif %}{% if field.required? %} required{% endif %}">
    <label for="{{ field.id }}" class="SC-Field_label">{{ label }}</label>
    {%- if hint %}<p class="SC-Field_hint" id="{{ field.id }}-hint">{{ hint }}</p>{% endif %}
    <input type="{{ type }}"
           id="{{ field.id }}"
           name="{{ field.name }}"
           {% unless type == "password" %}value="{{ field.value | escape }}"{% endunless %}
           class="SC-Field_input"
           {% if autocomplete %}autocomplete="{{ autocomplete }}"{% endif %}
           {% if autofocus %}autofocus{% endif %}
           {% if field.required? %}required{% endif %}
           {% if field.errors != blank %}aria-invalid="true"{% endif %}
           aria-describedby="{{ field.id }}-error{% if hint %} {{ field.id }}-hint{% endif %}">
    <span class="SC-Field_error" id="{{ field.id }}-error" role="alert">{{ field.errors | try: "messages" }}</span>
  </div>
{%- endif %}
```

Three deliberate choices worth keeping: the `{% if field %}` wrapper makes the snippet safe for conditionally present fields; `value` is omitted for password inputs so a replayed submission can never echo a credential; and `field.value` is escaped, because it is whatever the customer last typed and nothing escapes it for you. Apply `| escape` to every `field.value` you place in an attribute or text node, and `| j` to any you place inside a script or JSON string. The examples below use the snippet wherever possible so this stays in one place.

**Tag options cannot take a filter.** `label: "some.key" | t` does not translate — the option parser stops at the pipe and the raw key reaches the snippet. Pass a translation as a `t.`-prefixed string (`label: "t.some.key"`), which the parser translates for you, or interpolate inside quotes (`label: "{{ some.key | t }}"`). The same restriction applies to every tag option, including `{% form %}`, `{% component %}`, and `{% cache %}`.

**A string passed as a tag option is re-rendered as Liquid.** That is what makes the interpolated form above work, and it is why you should not hand already-rendered markup (a custom-form `question_content`, a content-block body) to a snippet through an option. Output it directly in the markup instead.

## Login

```liquid
{%- form "login", id: "login-form" %}
  {% render "form_errors", errors: form.errors %}

  {% render "shared/forms/text_field",
       field: form.fields["username"],
       label: "t.auth.login.form.username",
       autocomplete: "username",
       autofocus: true %}

  {% render "shared/forms/text_field",
       field: form.fields["password"],
       label: "t.auth.login.form.password",
       type: "password",
       autocomplete: "current-password" %}

  <input type="submit"
         value="{{ "auth.login.form.submit" | t }}"
         class="SC-Button SC-Button-primary"
         data-disable-with="{{ "auth.login.form.submit" | t }}">
{%- endform %}
```

The field is `username`, not `email`. Only `username` is replayed after a failed attempt; the password input comes back empty by design. Gate the whole block on `current_store.local_login?` and render `current_store.authentication_providers` through `single-sign-on` when the store also offers SSO.

## Register, with a multi-line address

Registration requires `firstname`, `lastname`, `email`, `password`, and a complete billing address. `phone`, `company_name`, and `campaign_ids` are optional.

```liquid
{%- form "register", id: "registration-form" %}
  {% render "form_errors", errors: form.errors %}

  <fieldset>
    <legend>{{ "accounts.register.form.headings.credentials" | t }}</legend>
    {% render "shared/forms/text_field",
         field: form.fields["email"],
         label: "t.accounts.register.form.labels.email",
         type: "email",
         autocomplete: "email" %}
    {% render "shared/forms/text_field",
         field: form.fields["password"],
         label: "t.accounts.register.form.labels.password",
         type: "password",
         autocomplete: "new-password" %}
  </fieldset>

  <fieldset>
    <legend>{{ "accounts.register.form.headings.contact" | t }}</legend>
    {% render "shared/forms/text_field",
         field: form.fields["firstname"],
         label: "t.accounts.register.form.labels.firstname",
         autocomplete: "given-name" %}
    {% render "shared/forms/text_field",
         field: form.fields["lastname"],
         label: "t.accounts.register.form.labels.lastname",
         autocomplete: "family-name" %}
    {% render "shared/forms/text_field",
         field: form.fields["phone"],
         label: "t.accounts.register.form.labels.phone",
         type: "tel",
         autocomplete: "tel" %}
    {% if store_variables["enable_company_name"] %}
      {% render "shared/forms/text_field",
           field: form.fields["company_name"],
           label: "t.accounts.register.form.labels.company_name",
           autocomplete: "organization" %}
    {% endif %}
  </fieldset>

  <fieldset>
    <legend>{{ "accounts.register.form.headings.address" | t }}</legend>

    {%- comment -%} Address lines are an array: one input per entry, name ends in [] {%- endcomment -%}
    {%- assign lines = form.fields["billing_address_lines"] %}
    {%- for line in lines.value %}
      {%- assign line_label = "accounts.shared.address_form.address_lines.count" | t, count: forloop.index %}
      <div class="SC-Field SC-Field-expand{% if forloop.first and lines.errors != blank %} has-error{% endif %}">
        <label for="{{ lines.id }}_{{ forloop.index }}" class="SC-Field_label">{{ line_label }}</label>
        <input type="text"
               id="{{ lines.id }}_{{ forloop.index }}"
               name="{{ lines.name }}[]"
               value="{{ line | escape }}"
               maxlength="255"
               autocomplete="billing address-line{{ forloop.index }}"
               {% if forloop.first %}required{% endif %}
               {% if forloop.first and lines.errors != blank %}aria-invalid="true" aria-describedby="{{ lines.id }}-error"{% endif %}>
        {%- if forloop.first %}
          <span class="SC-Field_error" id="{{ lines.id }}-error" role="alert">{{ lines.errors | try: "messages" }}</span>
        {%- endif %}
      </div>
    {%- endfor %}

    {% render "shared/forms/text_field",
         field: form.fields["billing_city"],
         label: "t.accounts.shared.address_form.city",
         autocomplete: "billing address-level2" %}
    {% render "shared/forms/text_field",
         field: form.fields["billing_postal_code"],
         label: "t.accounts.shared.address_form.zip_code",
         autocomplete: "billing postal-code" %}

    {%- assign country = form.fields["billing_country"] %}
    <div class="SC-Field{% if country.errors != blank %} has-error{% endif %} required">
      <label for="{{ country.id }}" class="SC-Field_label">{{ "accounts.shared.address_form.country" | t }}</label>
      <select id="{{ country.id }}" name="{{ country.name }}"
              class="SC-Field_select" autocomplete="billing country" required
              {% if country.errors != blank %}aria-invalid="true"{% endif %}
              aria-describedby="{{ country.id }}-error">
        <option value=""></option>
        {%- for c in all_countries %}
          <option value="{{ c.alpha2 }}"{% if country.value == c.alpha2 %} selected{% endif %}>{{ c.name }}</option>
        {%- endfor %}
      </select>
      <span class="SC-Field_error" id="{{ country.id }}-error" role="alert">{{ country.errors | try: "messages" }}</span>
    </div>

    {%- comment -%}
      The subdivision list is filled in by the platform's address script, which reads
      the container attributes below. Keep them, or supply your own <option> list.
    {%- endcomment -%}
    {%- assign state = form.fields["billing_state"] %}
    <div data-checkout-address-container
         data-country-id="{{ country.id }}"
         data-state-id="{{ state.id }}">
      <div class="SC-Field{% if state.errors != blank %} has-error{% endif %}">
        <label for="{{ state.id }}" class="SC-Field_label">{{ "accounts.shared.address_form.state" | t }}</label>
        <select id="{{ state.id }}" name="{{ state.name }}" class="SC-Field_select"
                autocomplete="billing address-level1" data-selected="{{ state.value }}"
                aria-describedby="{{ state.id }}-error">
          <option value=""></option>
        </select>
        <span class="SC-Field_error" id="{{ state.id }}-error" role="alert">{{ state.errors | try: "messages" }}</span>
      </div>
    </div>
  </fieldset>

  <input type="submit" value="{{ "accounts.register.form.submit" | t }}" class="SC-Button SC-Button-primary">
{%- endform %}
```

## Add to cart

`product:` passes the Product Drop and avoids a second lookup; `product_id:` takes an SFID. A variant is a product, so pass the selected variant's own Drop. There is no `variant_id`.

```liquid
{%- form "add-to-cart", product: product, data-cart-form: true %}
  {% render "form_errors", errors: form.errors %}

  {%- comment -%} Questions attached to this product {%- endcomment -%}
  {%- if product.custom_forms.size > 0 %}
    {% render "custom_forms/forms", custom_forms: product.custom_forms, form: form, display_mode: "add_to_cart" %}
  {%- endif %}

  {%- if product.can_select_quantity? %}
    {%- assign qty = form.fields["quantity"] %}
    <div class="SC-Field">
      <label for="{{ qty.id }}" class="SC-Field_label">{{ "shared.quantity_picker.label" | t }}</label>
      <input type="number" id="{{ qty.id }}" name="{{ qty.name }}"
             value="{{ qty.value | default: 1 }}" min="1"
             {% if product.maximum_quantity %}max="{{ product.maximum_quantity }}"{% endif %}
             inputmode="numeric" required
             aria-describedby="{{ qty.id }}-error">
      <span class="SC-Field_error" id="{{ qty.id }}-error" role="alert">{{ qty.errors | try: "messages" }}</span>
    </div>
  {%- else %}
    <input type="hidden" name="{{ form.fields["quantity"].name }}" value="1">
  {%- endif %}

  {%- comment -%} Only variable-priced products use the price field {%- endcomment -%}
  {%- if product.pricing.variable_pricing? %}
    {%- assign price = form.fields["price"] %}
    <div class="SC-Field">
      <label for="{{ price.id }}" class="SC-Field_label">{{ "shared.variable_pricing_picker.label" | t }}</label>
      <input type="number" step="0.01" id="{{ price.id }}" name="{{ price.name }}"
             value="{{ price.value | escape }}" inputmode="decimal" required
             aria-describedby="{{ price.id }}-error">
      <span class="SC-Field_error" id="{{ price.id }}-error" role="alert">{{ price.errors | try: "messages" }}</span>
    </div>
  {%- endif %}

  {%- comment -%}
    Same form, two destinations: stay on the product page, or go straight to the cart.
    Both are the form's own action with a query parameter, not a hand-written URL.
  {%- endcomment -%}
  <input type="submit"
         formaction="{{ form.path | params: after: "product" }}"
         value="{{ product.add_to_cart_text }}"
         class="SC-Button SC-Button-add"
         data-disable-with="{{ product.add_to_cart_text }}">
  {%- if product.can_purchase? %}
    <input type="submit"
           formaction="{{ form.path | params: after: "cart" }}"
           value="{{ product.buy_it_now_text }}"
           class="SC-Button SC-Button-buy"
           data-disable-with="{{ product.buy_it_now_text }}">
  {%- endif %}
{%- endform %}
```

Do not drive the quantity or price inputs off `field.required?` on this form — it reports `true` for all five base fields on every product, including the booking fields on a product that cannot be booked.

## Cart update

The `cart` form has no field Drops. Input names embed the cart item id, and quantity `0` removes a line. Feedback arrives through flash, so the layout must render the flash region. Put the form inside a component so a background submission can re-render it.

```liquid
{%- comment -%} key: pages/cart {%- endcomment -%}
{%- component "cart", reload: "sc.cart-updated" %}
```

```liquid
{%- comment -%} key: components/cart {%- endcomment -%}
{%- if current_cart != blank and current_cart.items.size > 0 %}
  {%- form "cart", remote: true, data-submit-on-change: true, data-success: "sc.cart-updated", data-type: "json" %}
    {%- for item in current_cart.items %}
      {%- if item.in_bundle? and item.bundle_lead? == false %}{% continue %}{% endif %}
      {%- capture qty_name %}cart_items[{{ item.id }}][quantity]{% endcapture %}
      {%- capture qty_id %}cart_items_{{ item.id }}_quantity{% endcapture %}

      <div class="SC-CartItem">
        <a href="{{ item.product.path }}">{{ item.product.name }}</a>

        {%- if item.product.can_select_quantity? %}
          <label for="{{ qty_id | strip }}">{{ "shared.quantity_picker.label" | t }}</label>
          <input type="number"
                 id="{{ qty_id | strip }}"
                 name="{{ qty_name | strip }}"
                 value="{{ item.quantity }}"
                 min="{{ item.min_quantity }}"
                 max="{{ item.max_quantity }}"
                 inputmode="numeric">
        {%- endif %}

        {%- comment -%} Points toggle needs a paired hidden input for the unchecked state {%- endcomment -%}
        {%- if item.pricing.can_purchase_with_points? and item.pricing.can_purchase_with_currency? %}
          {%- capture points_name %}cart_items[{{ item.id }}][use_points]{% endcapture %}
          {%- capture points_id %}cart_items_{{ item.id }}_use_points{% endcapture %}
          <input type="hidden" name="{{ points_name | strip }}" value="false">
          <input type="checkbox" id="{{ points_id | strip }}" name="{{ points_name | strip }}"
                 value="true"{% if item.pricing.use_points? %} checked{% endif %}>
          <label for="{{ points_id | strip }}">{{ "pricing.use_points" | t }}</label>
        {%- endif %}

        {%- comment -%} Removing one line is a link, not a form {%- endcomment -%}
        <a href="{{ item.delete_path }}" data-method="delete" rel="nofollow">
          {{ "cart_items.links.remove_item" | t }}
        </a>
      </div>
    {%- endfor %}

    <input type="submit" value="{{ "shared.quantity_picker.update_label" | t }}" class="SC-Button">
  {%- endform %}

  {%- comment -%} Emptying the cart is also a link, not a form {%- endcomment -%}
  <a href="{{ current_store.cart_path }}" data-method="delete" rel="nofollow">
    {{ "cart.links.clear_cart" | t }}
  </a>
{%- else %}
  <p>{{ "cart.empty_msg" | t }}</p>
{%- endif %}
```

## Checkout: customer information

Branch on `current_checkout_step` and render only the current step's form. This step's field list changes with store configuration, so guard every conditional field and drive `required` from `field.required?`.

```liquid
{%- comment -%} key: pages/checkout {%- endcomment -%}
{%- case current_checkout_step %}
{%- when "customer_information" %}
  {%- form "checkout-customer-information", id: "checkout-customer-information", class: "SC-Panel" %}
    {% render "form_errors", errors: form.errors %}

    {% render "shared/forms/text_field",
         field: form.fields["email"],
         label: "t.checkout.customer_information.form.email_address",
         type: "email",
         autocomplete: "email" %}

    {%- comment -%} Present only when the store asks for email confirmation {%- endcomment -%}
    {% render "shared/forms/text_field",
         field: form.fields["email_confirmation"],
         label: "t.checkout.customer_information.form.email_address_confirmation",
         type: "email",
         autocomplete: "email" %}

    {%- comment -%} One combined name field, or two — never both {%- endcomment -%}
    {%- if form.fields["full_name"] %}
      {% render "shared/forms/text_field",
           field: form.fields["full_name"],
           label: "t.checkout.customer_information.form.full_name",
           autocomplete: "name" %}
    {%- else %}
      {% render "shared/forms/text_field",
           field: form.fields["first_name"],
           label: "t.checkout.customer_information.form.first_name",
           autocomplete: "given-name" %}
      {% render "shared/forms/text_field",
           field: form.fields["last_name"],
           label: "t.checkout.customer_information.form.last_name",
           autocomplete: "family-name" %}
    {%- endif %}

    {% render "shared/forms/text_field",
         field: form.fields["phone"],
         label: "t.checkout.customer_information.form.phone_number",
         type: "tel",
         autocomplete: "tel" %}

    {%- comment -%} Shipping country options come from the form, not from all_countries {%- endcomment -%}
    {%- assign country = form.fields["shipping_country"] %}
    {%- assign allowed = form.fields["allowed_shipping_countries"] %}
    <div class="SC-Field{% if country.errors != blank %} has-error{% endif %}{% if country.required? %} required{% endif %}">
      <label for="{{ country.id }}" class="SC-Field_label">{{ "accounts.shared.address_form.country" | t }}</label>
      <select id="{{ country.id }}" name="{{ country.name }}" class="SC-Field_select"
              autocomplete="shipping country" data-selected="{{ country.value }}"
              {% if country.required? %}required{% endif %}
              aria-describedby="{{ country.id }}-error">
        <option value=""></option>
        {%- for entry in allowed.value %}
          <option value="{{ entry[1] }}"{% if country.value == entry[1] %} selected{% endif %}>{{ entry[0] }}</option>
        {%- endfor %}
      </select>
      <span class="SC-Field_error" id="{{ country.id }}-error" role="alert">{{ country.errors | try: "messages" }}</span>
    </div>

    {%- comment -%} Boolean: hidden 0 plus checkbox 1 on the same name {%- endcomment -%}
    {%- assign same = form.fields["billing_same_as_shipping"] %}
    <div class="SC-Checkbox">
      <input type="hidden" name="{{ same.name }}" value="0">
      <input type="checkbox" id="{{ same.id }}" name="{{ same.name }}" value="1"{% if same.value %} checked{% endif %}>
      <label for="{{ same.id }}">
        {{ "checkout.customer_information.billing_address.billing_address_same_as_shipping_address" | t }}
      </label>
    </div>

    {%- comment -%} Questions the store attached to the cart for this step {%- endcomment -%}
    {%- if current_cart.custom_forms.size > 0 %}
      {% render "custom_forms/forms", custom_forms: current_cart.custom_forms, form: form, display_mode: "in_checkout" %}
    {%- endif %}

    <input type="submit"
           value="{{ "checkout.customer_information.buttons.next" | t }}"
           class="SC-Button SC-Button-primary"
           data-disable-with="{{ "checkout.customer_information.buttons.continuing" | t }}">
  {%- endform %}
{%- when "shipping_information" %}
  {%- form "checkout-shipping-information", class: "SC-Panel" %}
    {% render "form_errors", errors: form.errors %}
    {% render "checkout/shipping_information/form", form: form %}
  {%- endform %}
{%- when "accept_terms" %}
  {%- form "checkout-accept-terms", class: "SC-Panel" %}
    {% render "form_errors", errors: form.errors %}
    {% render "checkout/accept_terms/form", form: form %}
  {%- endform %}
{%- when "payment_information" %}
  {% component "checkout/payment_information/page", reload: "sc.voucher-applied sc.voucher-removed" %}
{%- endcase %}
```

Per-item delivery windows on the shipping step are the one place where the Drop key and the submitted input name differ. Read the prefill and errors from the `schedule[...]` Drop, but name the input `delivery_options[...]` — that is the family the handler reads.

```liquid
{%- for item in current_cart.items %}
  {%- capture drop_key %}schedule[{{ item.id }}][delivery_start_date]{% endcapture %}
  {%- assign field = form.fields[drop_key] %}
  {%- if field %}
    {%- capture input_name %}delivery_options[{{ item.id }}][delivery_start_date]{% endcapture %}
    <label for="{{ field.id }}">{{ "checkout.delivery_options.delivery_date" | t }}</label>
    <input type="date" id="{{ field.id }}" name="{{ input_name | strip }}" value="{{ field.value | escape }}" required
           aria-describedby="{{ field.id }}-error">
    <span class="SC-Field_error" id="{{ field.id }}-error" role="alert">{{ field.errors | try: "messages" }}</span>
  {%- endif %}
{%- endfor %}
```

The other three keys behave the same way: `delivery_window_id`, `delivery_time`, `delivery_day`.

## Checkout: accept terms

```liquid
{%- assign field = form.fields["terms_accepted"] %}
<div class="SC-Checkbox">
  {%- comment -%} An unchecked checkbox submits nothing, so pair it with a hidden 0 {%- endcomment -%}
  <input type="hidden" name="{{ field.name }}" value="0">
  <input type="checkbox" id="{{ field.id }}" name="{{ field.name }}" value="1" required
         {% if field.errors != blank %}aria-invalid="true"{% endif %}
         aria-describedby="{{ field.id }}-error">
  <label for="{{ field.id }}" class="SC-Checkbox_label">
    {{ "checkout.accept_terms.accept_terms_and_conditions" | t }}
  </label>
  <span class="SC-Field_error" id="{{ field.id }}-error" role="alert">{{ field.errors | try: "messages" }}</span>
</div>
<input type="submit" value="{{ "checkout.accept_terms.next" | t }}" class="SC-Button SC-Button-primary">
```

The field is `terms_accepted`. `terms` and `accept_terms` do not exist.

## Promo code, where feedback arrives through flash

`apply-promo-code` and `remove-promo-code` never populate `form.errors`. They redirect with a message, so the layout must render `current_flash` or a failed code produces silence.

```liquid
{%- comment -%} Applied codes, each removable {%- endcomment -%}
{%- for applied in current_cart.applied_coupon_codes %}
  <div class="sc-flex-row">
    <span>{{ applied.coupon_code_used }}</span>
    {% form "remove-promo-code" %}
      <input type="hidden" name="code" value="{{ applied.coupon_code_used }}">
      <button type="submit" class="SC-Button SC-Button-link">
        {{ "checkout.promo_codes.remove" | t }}
      </button>
    {% endform %}
  </div>
{%- endfor %}

{%- if current_cart.can_add_coupon? %}
  {% form "apply-promo-code" %}
    {%- assign field = form.fields["code"] %}
    <div class="SC-Field{% if field.required? %} required{% endif %}">
      <label for="{{ field.id }}" class="SC-Field_label">{{ "checkout.promo_codes.heading" | t }}</label>
      <input type="text" id="{{ field.id }}" name="{{ field.name }}" value="{{ field.value | escape }}"
             placeholder="{{ "checkout.promo_codes.enter_code" | t }}" autocomplete="off">
    </div>
    <input type="submit" value="{{ "checkout.promo_codes.apply" | t }}" class="SC-Button">
  {% endform %}
{%- else %}
  <p>{{ "checkout.promo_codes.max_reached" | t }}</p>
{%- endif %}
```

Make sure the layout renders the flash region, for example `{% render "flash" %}` or your own markup around `current_flash.notice` and `current_flash.alert`.

## Custom form

The only route to an enquiry, contact, newsletter, or survey form. Create the Form and its Questions in Salesforce, then render it by SFID. Resolve the Form from `all_custom_forms`, never from a request parameter.

The simplest correct version delegates question rendering to the base theme, which already handles every question type:

```liquid
{%- assign enquiry_form_id = store_variables["enquiry_form_id"] %}
{%- assign enquiry_form = all_custom_forms[enquiry_form_id] %}

{%- if enquiry_form %}
  {% form "custom-form", identifier: enquiry_form.id, class: "SC-Panel" %}
    {% render "form_errors", errors: form.errors, include_fields: true %}
    {% render "custom_forms/questions", questions: enquiry_form.questions, form: form %}
    {%- comment -%} No platform key covers a generic submit; add one to your theme translations {%- endcomment -%}
    <input type="submit" value="{{ "enquiry.form.submit" | t }}" class="SC-Button SC-Button-primary">
  {% endform %}
{%- endif %}
```

If you need your own markup, build the field key from the question id and look it up — never type the name:

```liquid
{% form "custom-form", identifier: enquiry_form.id %}
  {% render "form_errors", errors: form.errors, include_fields: true %}

  {%- for question in enquiry_form.questions %}
    {%- capture key %}answers[{{ question.id }}][answer]{% endcapture %}
    {%- assign field = form.fields[key] %}

    {%- if question.hidden? %}
      <input type="hidden" name="{{ field.name }}" value="{{ field.value | escape }}">
    {%- elsif question.data_type == "Picklist" %}
      <div class="SC-Field{% if field.errors != blank %} has-error{% endif %}">
        <label for="{{ field.id }}" class="SC-Field_label">{{ question.question_content }}</label>
        <select id="{{ field.id }}" name="{{ field.name }}" class="SC-Field_select"
                {% if field.required? %}required{% endif %}
                aria-describedby="{{ field.id }}-error">
          {%- for option in question.picklist_options %}
            <option value="{{ option.value }}"{% if option.value == field.value %} selected{% endif %}>{{ option.label }}</option>
          {%- endfor %}
        </select>
        <span class="SC-Field_error" id="{{ field.id }}-error" role="alert">{{ field.errors | try: "messages" }}</span>
      </div>
    {%- elsif question.data_type == "Text Area" %}
      <div class="SC-Field{% if field.errors != blank %} has-error{% endif %}">
        <label for="{{ field.id }}" class="SC-Field_label">{{ question.question_content }}</label>
        <textarea id="{{ field.id }}" name="{{ field.name }}" class="SC-Field_input"
                  {% if field.required? %}required{% endif %}
                  aria-describedby="{{ field.id }}-error">{{ field.value | escape }}</textarea>
        <span class="SC-Field_error" id="{{ field.id }}-error" role="alert">{{ field.errors | try: "messages" }}</span>
      </div>
    {%- elsif question.data_type == "Boolean" %}
      <div class="SC-Checkbox">
        <input type="hidden" name="{{ field.name }}" value="false">
        <input type="checkbox" id="{{ field.id }}" name="{{ field.name }}" value="true"
               {% if field.value == "true" %}checked{% endif %}
               {% if field.required? %}required{% endif %}>
        <label for="{{ field.id }}">{{ question.question_content }}</label>
      </div>
    {%- else %}
      {%- comment -%}
        Inlined rather than passed to the shared snippet: a string given as a tag
        option is re-rendered as Liquid, and question_content is already-rendered
        markup that must not go through the renderer a second time.
      {%- endcomment -%}
      <div class="SC-Field{% if field.errors != blank %} has-error{% endif %}">
        <label for="{{ field.id }}" class="SC-Field_label">{{ question.question_content }}</label>
        <input type="text" id="{{ field.id }}" name="{{ field.name }}" value="{{ field.value | escape }}"
               class="SC-Field_input"
               {% if field.required? %}required{% endif %}
               {% if field.errors != blank %}aria-invalid="true"{% endif %}
               aria-describedby="{{ field.id }}-error">
        <span class="SC-Field_error" id="{{ field.id }}-error" role="alert">{{ field.errors | try: "messages" }}</span>
      </div>
    {%- endif %}
  {%- endfor %}

  <input type="submit" value="{{ "enquiry.form.submit" | t }}" class="SC-Button SC-Button-primary">
{% endform %}
```

`question_content` is already rendered markup — output it as-is; do not escape it again. Data types are `Boolean`, `Text`, `Text Area`, `Integer`, `Decimal`, `Date`, `Datetime`, `Picklist`, `Multi-Picklist`, `File`. A File question takes the prefix `answers[<question_id>]` instead of the `[answer]` leaf. When the answer belongs to a specific cart or order item, add `answers[<question_id>][item_id]`.

Never collect a password, card detail, or unnecessary sensitive personal data through a custom form. To act on the submission, use Salesforce automation or the controller patterns in `storeconnect-controllers`.

## Saved payment methods

`method_id:` must come from a payment-method Drop the page already resolved for the signed-in customer. Never pass a request parameter into it.

```liquid
{%- for method in current_customer.payment_methods %}
  <div class="SC-PaymentMethod">
    <span>
      {%- case method.type %}
        {%- when "card" %}{{ method.card_brand }}
        {%- when "bank_account" %}{{ method.bank_name }} {{ method.account_type | capitalize }}
        {%- when "digital_wallet" %}{{ method.wallet_type | replace: "_", " " | capitalize }}
      {%- endcase %}
      &bull;&bull;&bull;&bull; {{ method.last_four }}
      {%- if method.is_default? %}
        <span class="SC-Badge">{{ "accounts.profile.sections.payment_methods.default_badge" | t }}</span>
      {%- endif %}
    </span>

    {%- unless method.is_default? %}
      {%- form "update-payment-method", method_id: method.id %}
        <button type="submit" class="SC-Button SC-Button-small">
          {{ "accounts.profile.sections.payment_methods.set_default" | t }}
        </button>
      {%- endform %}
    {%- endunless %}

    {%- form "remove-payment-method", method_id: method.id %}
      <button type="submit" class="SC-Button SC-Button-small"
              data-confirm="{{ "accounts.profile.sections.payment_methods.remove_confirm" | t }}">
        {{ "accounts.profile.sections.payment_methods.remove" | t }}
      </button>
    {%- endform %}
  </div>
{%- endfor %}

{%- comment -%}
  Adding a card renders nothing when no active provider can save one,
  so guard the heading and the form together.
{%- endcomment -%}
{%- form "add-payment-method" %}
  {% render "checkout/payment_information/select_and_payment", only_recurring_payments: true %}
{%- endform %}
```

Both management forms are a submit button and nothing else. Do not add card inputs to them; the provider snippet inside `add-payment-method` owns tokenization.

## Booking attendees

Several of these forms coexist on one page. Field ids are suffixed with the attendee id, which is why `field.id` must be rendered rather than a literal.

```liquid
{%- for attendee in booking.attendees %}
  {%- form "booking-attendee-edit", attendee: attendee %}
    {% render "form_errors", errors: form.errors, include_fields: true %}
    <input type="hidden" name="{{ form.fields["id"].name }}" value="{{ form.fields["id"].value }}">

    {%- assign is_contact = form.fields["is_contact"] %}
    <fieldset>
      <legend>{{ "accounts.orders.bookings.attendees.attendee_question" | t }}</legend>
      <input type="radio" id="{{ is_contact.id }}_true" name="{{ is_contact.name }}" value="true"
             {% unless is_contact.value == "false" %}checked{% endunless %}>
      <label for="{{ is_contact.id }}_true">{{ "accounts.orders.bookings.attendees.for_me" | t }}</label>
      <input type="radio" id="{{ is_contact.id }}_false" name="{{ is_contact.name }}" value="false"
             {% if is_contact.value == "false" %}checked{% endif %}>
      <label for="{{ is_contact.id }}_false">{{ "accounts.orders.bookings.attendees.for_another" | t }}</label>
    </fieldset>

    {% render "shared/forms/text_field",
         field: form.fields["first_name"],
         label: "t.accounts.orders.bookings.attendees.placeholders.first_name",
         autocomplete: "given-name" %}
    {% render "shared/forms/text_field",
         field: form.fields["last_name"],
         label: "t.accounts.orders.bookings.attendees.placeholders.last_name",
         autocomplete: "family-name" %}
    {% render "shared/forms/text_field",
         field: form.fields["email"],
         label: "t.accounts.orders.bookings.attendees.placeholders.email",
         type: "email",
         autocomplete: "email" %}
    {% render "shared/forms/text_field",
         field: form.fields["phone"],
         label: "t.accounts.orders.bookings.attendees.placeholders.phone",
         type: "tel",
         autocomplete: "tel" %}

    <input type="submit" value="{{ "accounts.orders.bookings.attendees.save" | t }}" class="SC-Button">
  {%- endform %}
{%- endfor %}

{%- if booking.attendees.size < booking.max_attendees %}
  {%- form "booking-attendee-add", booking: booking %}
    {%- comment -%} Same six fields; this form uses POST rather than PUT {%- endcomment -%}
  {%- endform %}
{%- endif %}
```

This form never sets `required?`, so add `required` to the inputs your store needs.
