# POS layouts, fields, filters, and views

Use POS Layouts, Layout Fields, Layout Filters, and POS Views to change supported
register screens without modifying the POS application itself.

This reference describes the public workflow. It does not reproduce shipped
identifiers, internal device data structures, parser behavior, or release-specific
registries. Read the live Salesforce schema and current StoreConnect
documentation before configuring a store.

## Contents

- [Choose the smallest extension point](#choose-the-smallest-extension-point)
- [Read the live schema](#read-the-live-schema)
- [Layout identifiers](#layout-identifiers)
- [Layout Fields](#layout-fields)
- [Layout Filters](#layout-filters)
- [POS Views](#pos-views)
- [POS Liquid](#pos-liquid)
- [Queries and record fields](#queries-and-record-fields)
- [Reusable Views](#reusable-views)
- [Interactive rows](#interactive-rows)
- [Verification checklist](#verification-checklist)

## Choose the smallest extension point

Use:

- `s_c__Pos_Layout__c` to configure a supported list, grid, form, or record
  surface;
- `s_c__Pos_Layout_Field__c` to select, order, label, or custom-render one field;
- `s_c__Pos_Layout_Filter__c` to provide a supported operator filter; and
- `s_c__Pos_View__c` only when the standard field or layout rendering cannot
  express the requirement.

Prefer a field or filter configuration over custom Liquid, and prefer a POS View
over global JavaScript or CSS. The smaller extension point has a smaller
upgrade and register-outage risk.

## Read the live schema

POS fields and picklists can vary by StoreConnect release. Before writing:

1. Confirm the Store, environment, Outlet, register, and installed release.
2. Describe the relevant Salesforce objects and read the existing records.
3. Confirm every field, picklist value, relationship, and identifier from the
   live org or current StoreConnect documentation.
4. Save the current values as the rollback.
5. Make one additive change in a non-production environment.

Do not derive accepted values from browser bundles, device storage, network
traffic, another customer, or a copied field map.

## Layout identifiers

An identifier determines where StoreConnect exposes a layout or view. Use a new,
clearly prefixed identifier for custom work unless current documentation
explicitly requires a shipped identifier.

Reusing a shipped identifier can replace a built-in surface. Do that only after:

- inventorying the workflows and controls it currently provides;
- showing the intended replacement and rollback;
- obtaining explicit approval; and
- verifying navigation, session, recovery, permission, and accessibility
  behavior on the target register.

Identifiers must match exactly wherever they are referenced. Confirm them from
the live records rather than copying a static inventory.

## Layout Fields

A Layout Field points to a field on the Layout's configured object and controls
its label, order, display behavior, and optional POS View.

- Confirm the field exists and is readable for the intended operators.
- Render a real test record with both populated and empty values.
- Use the standard field renderer unless custom markup is required.
- Escape every value a POS View places into HTML, attributes, URLs, or
  JavaScript.
- Keep row rendering cheap; do not query or initialize a script once per row.

## Layout Filters

A Layout Filter helps an operator narrow a supported surface. It is not an
authorization control.

- Confirm its field, type, and options against the live schema.
- Keep the default broad enough that required records remain reachable.
- Test each option and the empty state with realistic data.
- Review all active filters on the Layout before diagnosing missing records.
- Enforce record access through StoreConnect and Salesforce permissions, not a
  hidden or fixed client-side filter.

Where a filter also affects which records are available to the register, confirm
the intended scope in current StoreConnect documentation and verify it through
the supported Manage data screen.

## POS Views

A POS View contains client-side Liquid used at a supported attachment point.
The attachment point determines the context available to the View.

Before authoring a View:

1. Confirm that the target Layout, Layout Field, Action Item, modal, page, or
   print flow supports a View in the installed release.
2. Read the context documented for that exact surface.
3. Use only the records and variables supplied by that context.
4. Keep the View presentational. Use supported Action Items for business
   operations.
5. Test the same View independently at every attachment point; do not assume
   contexts are interchangeable.

Avoid sharing an identifier across unrelated stores unless the View is
deliberately common and has been tested in each one.

## POS Liquid

POS Liquid is a smaller, client-side surface than StoreConnect storefront
Liquid. Do not assume a storefront tag, filter, Drop, or global is available.

- Use only syntax and values documented for the current POS release and View
  context.
- Validate the template with a minimal non-production View before adding
  complexity.
- Escape all untrusted output explicitly.
- Treat a blank custom surface as a render failure: validate syntax, then verify
  each referenced value against current documentation and sanitized supported
  diagnostics.
- Do not use storefront forms, components, controllers, cache tags, debug tags,
  or server-side query assumptions in a POS View.

## Queries and record fields

Use POS `{% query %}` only where the current documentation lists the object and
conditions as supported.

- Scope to the smallest required record set.
- Never query inside a repeated row template.
- Bound the rendered result.
- Configure sorting and filtering through supported Layout settings unless the
  current POS documentation says the View query supports them.
- Do not infer storage names, relationship keys, indexes, or query behavior
  through browser tools.

Use documented named attributes and mapped fields from the record context.
Confirm every field through the live object description and Custom Data Mapping.
Do not inspect internal record members when a value is absent.

## Reusable Views

Where supported, `{% render %}` can reuse another POS View by its confirmed
identifier. Pass only the minimum documented variables, keep identifiers
prefixed and stable, and verify the referenced View exists on the register.

A missing or mismatched reference can remove a whole section from the output.
Test reusable Views directly as well as through every caller.

## Interactive rows

Treat list-row Views as presentation-first. Script execution and action context
can differ from record, page, or modal Views.

- Prefer a documented Action Item for interaction.
- Use custom JavaScript only when current StoreConnect documentation explicitly
  supports it for that row surface and release.
- Style only markup and prefixed classes that the View owns.
- Do not target or hide platform DOM classes.
- Do not rely on an inline handler, global function, or action payload copied
  from another release.

## Verification checklist

- Store, environment, Outlet, register, and release are confirmed.
- Live objects and current records were read before editing.
- Custom identifiers are prefixed; replacing any shipped identifier is explicit,
  approved, and reversible.
- Every field, option, context value, action, and query is supported by the
  current release.
- All output is escaped for its destination.
- No query, script initialization, or network call runs once per row.
- No filter, hidden control, or client-side condition is treated as
  authorization.
- The View handles empty values, empty collections, long text, narrow screens,
  permission-limited operators, and connection interruption.
- The change was tested on a non-production register and re-verified after
  StoreConnect and Salesforce synchronization completed.
