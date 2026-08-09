# POS Store Variables

Store Variables are the established store-scoped integration for supported POS
settings. They use documented keys and text values, but the accepted keys,
types, defaults, and release behavior form a closed, versioned contract.

This reference describes the supported outcomes and safe change workflow. Resolve
the exact key and accepted value from current StoreConnect documentation or a
supported administrative surface for the installed release. Never copy a key
catalog from another store, infer one from client code, or invent a key when the
requested option is not documented.

Private partner or client configuration may retain a customer domain, store
identifier, and approved non-secret values when access is restricted. Public
examples use `store.example.com`, `<store-id>`, and descriptive placeholders.

## Contents

- [POS access URL](#pos-access-url)
- [Payment options](#payment-options)
- [Fulfillment types](#fulfillment-types)
- [Delivery fields](#delivery-fields)
- [Register lock](#register-lock)
- [Presentation and labels](#presentation-and-labels)
- [When each change takes effect](#when-each-change-takes-effect)
- [Security boundary](#security-boundary)
- [Review checklist](#review-checklist)

## POS access URL

Use the documented Store Variable integration to select one supported POS access
mode for the store. Confirm whether the chosen mode needs a path, a subdomain,
DNS work, or another administrative prerequisite in the current documentation.
Do not enable competing access modes or construct a route from remembered key
names.

Verification:

1. Confirm the intended store and environment.
2. Resolve the current supported setting and accepted value.
3. Complete any domain or DNS prerequisite through the authorized workflow.
4. Load the POS sign-in page at a placeholder-safe URL such as
   `https://store.example.com/<pos-path>`.
5. Verify the ordinary storefront still resolves correctly.

## Payment options

Store Variables may control supported tender visibility, labels, and other
documented presentation behavior. The available tender identifiers and
attributes vary by release and provider. Discover them from current
StoreConnect documentation; see
[payment method types](pos-object-reference.md#payment-method-types) for the
outcome workflow.

A Store Variable does not replace provider onboarding. When a tender is backed
by a payment provider:

1. confirm the provider is supported for the installed release and region;
2. complete credentials and terminal setup only through the provider's
   authorized onboarding;
3. confirm the provider is active for POS through the supported administration;
4. apply only the documented Store Variable setting; and
5. verify sale, refund, receipt, and failure outcomes as applicable.

Never publish a provider identifier or assumed default as a universal catalog.

## Fulfillment types

Store Variables may control supported fulfillment visibility and customer-facing
labels. Resolve the current type and attribute names from StoreConnect
documentation rather than copying an identifier list.

For each intended fulfillment outcome:

1. confirm the type is supported by the installed release;
2. confirm its operational prerequisites, such as shipping, inventory, or
   provider setup;
3. change only the documented visibility or presentation setting;
4. keep singular, plural, and action wording consistent where the current
   contract supports those distinctions; and
5. verify the picker, cart, receipt, and downstream fulfillment workflow.

See [fulfillment types](pos-object-reference.md#fulfillment-types) and
[fulfillment station routing](pos-object-reference.md#fulfillment-station-routing).

## Delivery fields

Current Store Variables may expose supported delivery-field visibility,
requiredness, or labels. Confirm the exact capabilities and accepted values for
the installed release.

Test the complete outcome: the field appears only where intended, validation is
clear, values survive the supported cart workflow, and the resulting order
shows the value in the authorized back-office view. Do not infer persistence or
field names from device storage or traffic.

## Register lock

Use only documented Store Variables for supported inactivity or device-lock
behavior. Confirm the current units, accepted range, defaults, and unlock
workflow before changing a production register.

Test with a non-production register and an authorized staff member. Do not ask
for or record their PIN, and do not weaken a lock merely to work around a sign-in
or synchronization issue.

## Presentation and labels

Store Variables may expose supported stock-display choices, notes or memo labels,
open-order presentation, and similar POS behavior. Treat these as
customer-facing configuration:

- confirm the setting exists in the installed release;
- use an accepted value from current documentation;
- review label consistency with the web storefront and receipts;
- check accessibility and translation impact; and
- verify the result on the intended register.

If the requested behavior is not documented as a Store Variable, check whether
it belongs to a POS Layout, supported action, provider setting, or StoreConnect
administrative field. Do not create a speculative key.

## When each change takes effect

Store Variable changes may require a supported device synchronization, a new POS
session, a page reload, or domain propagation. The trigger depends on the
current setting and release.

After a change:

1. confirm the record saved on the intended store;
2. follow the current documentation for its refresh or synchronization step;
3. wait for the supported status to finish;
4. re-read the configuration; and
5. verify the visible outcome on the intended register.

Do not repeat a write merely because asynchronous propagation has not completed.

## Security boundary

Treat Store Variable values as client-visible. Never place credentials, PINs,
payment or terminal secrets, authorization material, private endpoints,
personal data, or sensitive customer identifiers in a Store Variable.

Provider secrets belong in the provider's supported onboarding. Outlet
connection credentials and staff PINs belong in their authorized administrative
flows. A value being hidden in one admin screen does not make it safe for a
client-delivered setting.

## Review checklist

Before saving:

- Confirm the org, environment, store, and intended outcome.
- Read the existing value and record a rollback.
- Resolve the exact key, accepted type, and behavior from current StoreConnect
  documentation or a supported administrative surface.
- Confirm the setting is not owned by a Layout, provider, or another
  administrative record.
- Check that the value contains no secret or unnecessary customer information.
- Obtain explicit approval for production, payment, fulfillment, security, or
  access changes.

After saving:

- Wait for the documented refresh or synchronization outcome.
- Verify the intended register and a representative workflow.
- Confirm no other store or outlet changed.
- Revert through the same supported setting if verification fails.
