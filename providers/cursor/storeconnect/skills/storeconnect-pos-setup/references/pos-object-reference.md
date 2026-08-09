# POS Configuration Outcome Reference

Use this reference to plan and verify StoreConnect POS configuration without
relying on a static managed-package object map. Exact object names, fields,
relationships, validation rules, picklist values, and identifiers can vary with
the installed release.

Before writing, read current StoreConnect documentation, describe the relevant
live Salesforce objects, and inspect existing records through supported tooling.
Do not derive a schema or relationship topology from browser code, device
storage, network traffic, another customer, or an old export.

## Contents

- [Discover the live configuration surface](#discover-the-live-configuration-surface)
- [Outlet outcome](#outlet-outcome)
- [Register outcome](#register-outcome)
- [Inventory coverage](#inventory-coverage)
- [Staff access](#staff-access)
- [Staff PIN](#staff-pin)
- [Shifts and totals](#shifts-and-totals)
- [Product readiness checklist](#product-readiness-checklist)
- [Pricebook resolution](#pricebook-resolution)
- [Payment method types](#payment-method-types)
- [Fulfillment types](#fulfillment-types)
- [Fulfillment station routing](#fulfillment-station-routing)
- [Store-level POS settings](#store-level-pos-settings)
- [Verification plan](#verification-plan)

## Discover the live configuration surface

Start with outcomes, then resolve the current schema:

| Outcome | Configuration to discover |
|---|---|
| A trading location is available | Store-scoped outlet configuration and its current prerequisites |
| A device can be assigned | Register configuration for the intended outlet and supported assignment state |
| Stock is sellable | Active inventory sources connected to the outlet |
| Staff can sign in | Active staff access, capability or role configuration, and the administrative PIN workflow |
| Products are visible and sellable | Catalog eligibility, classification, pricing, availability, and inventory |
| Tenders are available | Supported payment types, provider onboarding, POS availability, and documented Store Variables |
| Fulfillment reaches the right team | Supported fulfillment types, product routing categories, and outlet stations |

For each outcome:

1. Confirm the org, environment, store, and business labels.
2. Read current StoreConnect documentation.
3. Describe the live object and accepted fields or values.
4. Query existing records scoped to the intended store.
5. Resolve a stable logical match before creating anything.
6. Save a minimal rollback.
7. Apply the smallest change in non-production first.
8. Re-read and verify through the POS outcome.

Do not assume a managed record exposes an external ID or safe upsert key. Never
blind-create a second record with the same business purpose.

## Outlet outcome

An outlet represents the intended trading location and must be scoped to the
correct store. Use the live schema and current documentation to confirm every
required location, guest-sale, tax, pricing, and connection prerequisite.

Verification:

- The outlet resolves to exactly one intended store.
- Its non-secret label and operational settings match the reviewed plan.
- Required guest-sale and location prerequisites are complete.
- At least one supported active inventory source is available.
- No credential value is selected or returned in review output.

Treat an outlet attached to the wrong store as a data-isolation issue. Stop and
correct scope before configuring registers, staff, or stock.

## Register outcome

A register is an assignable trading position for one intended outlet. Resolve
the current register object and supported status values from the live schema.

Create or change it only through the supported administrative workflow. Confirm
that it is active, belongs to the intended outlet, and is available to the
intended device. Connection or assignment state maintained by StoreConnect must
not be edited directly to force a register into the picker.

For a stuck or replaced device, use the supported disconnect or administrative
reset flow with approval after confirming no one is trading and no
unsynchronized work is at risk.

## Inventory coverage

Use current documentation and live records to confirm the outlet has at least
one supported active inventory source and that the source can contribute stock
for the store's intended fulfillment outcomes.

Do not copy field names or allowed status values from another release. Verify
coverage with a representative tracked product at the register, and verify an
untracked product separately when the store uses both models.

## Staff access

Staff access combines an active Salesforce user, an active grant to the intended
outlet, and a supported capability or role profile. Resolve the live objects,
required relationships, discount or permission limits, and accepted values from
the current schema.

Verification:

- The person is active and resolves to the intended user without exposing
  personal data unnecessarily.
- Access applies to the intended outlet only.
- The capability profile matches the approved responsibilities.
- Revocation can be performed without rewriting historical transaction records.
- The staff member appears in the supported POS sign-in flow after
  synchronization.

## Staff PIN

PIN creation and reset are Salesforce administrator tasks performed through the
supported interface. An agent may confirm that the documented prerequisite is
complete without reading the PIN value.

Never invent, request, display, transcribe, log, or persist a PIN. Use
`<staff-pin>` only when a placeholder is unavoidable. The staff member enters
their own PIN during verification.

Do not describe PIN storage, comparison, synchronization, or transport.

## Shifts and totals

Shifts, tender totals, and reconciliation history are operational records
created by supported POS workflows. Do not pre-create or edit them as setup data,
and do not rewrite them to make a reconciliation match.

Use the current StoreConnect reporting and reconciliation surfaces to:

- identify an open or incomplete shift;
- confirm the intended register and staff member;
- review counted, expected, and variance outcomes without exposing payment
  payloads; and
- follow the supported close, correction, or support process.

If a shift blocks a register reset or reassignment, stop and let the authorized
operator resolve it through the supported workflow.

## Product readiness checklist

When a product is missing, check supported business outcomes in this order. Use
current documentation and live records for the exact fields and accepted values.

1. **Catalog eligibility.** Confirm the product is an eligible sellable product
   for POS in the installed release and is not a placeholder, future-only, or
   otherwise excluded type.
2. **Store discoverability.** Confirm it belongs to the store's active catalog
   or taxonomy through a supported active relationship.
3. **Customization scope.** Review active POS Layout Filters that could narrow
   the product set for this outlet or register.
4. **Synchronization.** Wait for the supported device status to complete and
   verify the product is in scope before resetting anything.
5. **Effective price.** Confirm an active price exists in the pricing context
   that applies to this sale. See [pricebook resolution](#pricebook-resolution).
6. **Availability.** Confirm the product is active and currently available.
7. **Inventory.** If inventory is tracked, confirm sellable stock through an
   active outlet inventory source and the intended fulfillment outcome.
8. **Lookup method.** If barcode or another identifier is used, verify it is
   unique and supported by the current layout without publishing its field
   mapping as a universal contract.

Verify with a representative sale: search, open the product, add it to the cart,
confirm the expected price and stock outcome, then remove it without completing
payment unless the operator approved a test transaction.

## Pricebook resolution

Pricing can vary with the attached customer, outlet, store, and installed
configuration. Do not assume a fixed precedence from an old reference.

To diagnose a price:

1. Reproduce the sale with the same customer or anonymous context.
2. Read the current StoreConnect documentation for pricing resolution.
3. Inspect the live store, outlet, customer, and active pricebook relationships.
4. Identify the effective pricebook through supported tooling.
5. Confirm an active entry exists for the product and relevant date or quantity.
6. Compare a second register or customer only after controlling those inputs.

Change the narrowest configuration that owns the intended outcome, then verify
both the target scenario and an unaffected scenario.

## Payment method types

The available payment types, identifiers, defaults, provider requirements, and
refund behavior vary by StoreConnect release, region, and provider. Discover the
current set from StoreConnect documentation and the supported administration;
do not publish or reuse a copied identifier catalog.

Classify the intended tender as:

- built-in and ready for supported presentation configuration;
- provider-backed and requiring authorized provider onboarding; or
- unavailable for this release, store, or region.

Use the documented Store Variable integration only for supported visibility,
label, or presentation outcomes; see [store-variables.md](store-variables.md).
A Store Variable never replaces provider credentials, terminal setup, or channel
enablement.

Verify the approved sale, decline or cancellation, refund, receipt, and
reconciliation outcomes. Never place provider or terminal secrets in a Store
Variable, template, file, log, issue, or prompt.

## Fulfillment types

Supported fulfillment types and their identifiers can vary by release and store
capability. Discover the current set from StoreConnect documentation and live
administration.

For each intended type:

- confirm its operational prerequisites;
- use documented Store Variables only for supported visibility and labels;
- verify it appears in the intended POS and cart context;
- confirm the resulting order reaches the correct operational workflow; and
- verify disabling or relabeling it does not break the web storefront or
  existing orders.

Do not publish a closed identifier or default-label table as a universal
contract.

## Fulfillment station routing

Fulfillment station routing directs eligible products to supported preparation
areas. Build and verify it from current documentation and the live schema rather
than a copied relationship graph.

Outcome workflow:

1. Confirm the store, outlet, registers, and intended preparation areas.
2. Resolve the current product-routing category, product assignment, station,
   outlet mapping, and any supported register override surfaces.
3. Read the accepted statuses, fallback behavior, and required relationships
   from current documentation and live describe output.
4. Create the smallest non-production route for one representative product.
5. Verify the product reaches exactly one intended preparation outcome.
6. Test the documented unavailable-station behavior without guessing at
   internal health checks or fallback limits.
7. Add remaining products or stations only after the first route passes.

Keep every station and override within the intended outlet. Stop on a
cross-outlet relationship or ambiguous route.

## Store-level POS settings

Some POS outcomes, such as cash rounding or permitted order behavior, may be
owned by supported store-level configuration rather than Store Variables.
Resolve these fields and accepted values from current documentation and the live
schema.

Test financial configuration with approved example amounts in non-production,
review the expected accounting impact, and obtain explicit approval before a
production change.

## Verification plan

Use supported tooling and placeholders; never paste live customer records into a
public example.

For every configuration change:

1. Re-read the target by its confirmed store and business label.
2. Confirm the field-level result against the reviewed plan.
3. Verify all relationships remain within the intended store and outlet.
4. Wait for supported synchronization or session refresh.
5. Exercise the user-visible outcome on the intended register.
6. Confirm an unaffected control scenario still works.
7. Check the authorized back-office result.
8. Record only sanitized labels, counts, and outcomes.

Do not select, display, or log connection credentials, PINs, payment payloads,
provider secrets, terminal identifiers, personal data, or unnecessary
Salesforce identifiers. Private engagement configuration may retain approved
customer domains and record identifiers under access control; public artifacts
use placeholders.
