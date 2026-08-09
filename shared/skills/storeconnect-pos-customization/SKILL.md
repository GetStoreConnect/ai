---
name: storeconnect-pos-customization
description: Customize StoreConnect POS through supported layouts, filters, views, actions, scripts, styles, and print templates. Use when changing what a POS screen, list, cart, button, menu, modal, receipt, docket, or label shows or does, or when reviewing a POS customization for safety, performance, offline behavior, testing, and rollout.
---

# StoreConnect POS customization

Use the supported POS configuration and extension surfaces documented for the
installed StoreConnect release. Release contracts vary, so resolve the exact
objects, fields, values, and capabilities from current StoreConnect
documentation and the live Salesforce schema rather than from copied examples
or application internals.

Use `storeconnect-pos-setup` for operational setup such as outlets, registers,
operator access, payment configuration, fulfillment, hardware, and
synchronization health. Use this skill for supported changes to POS appearance
and behavior.

## Pick the extension point first

| You want to | Use | Safeguard |
|---|---|---|
| Change which fields a supported screen shows or their order | Layout configuration | Prefer this smallest, lowest-risk option. |
| Let an operator narrow a list | Layout filter configuration | Treat it as presentation, never authorization. |
| Change initial sorting or filtering | Supported layout settings | Verify behavior and scale on the installed release. |
| Render supported custom content | A POS view | Use only the documented context and data surface. |
| Add a button, menu entry, or tile | A supported action configuration | Confirm the action, parameters, permissions, and offline behavior in current documentation. |
| Add supported cross-screen styling or scripting | Script or style configuration | Keep it minimal, reversible, and within documented extension points. |
| Produce a receipt, docket, document, or label | A supported print template | Select the documented output family before authoring and test it safely. |

Choose the first supported option that meets the outcome. Avoid broad scripting
when configuration or a view is sufficient.

## Routing — read the reference that matches the task

Open only the reference needed for the requested outcome:

- **Layouts, fields, filters, views, or supported data contexts** →
  [references/layouts-and-views.md](references/layouts-and-views.md). Resolve
  release-specific contracts from current documentation and the live schema.
- **Buttons, menus, tiles, or action sequences** →
  [references/actions-reference.md](references/actions-reference.md). Confirm
  every action and parameter against the current installed release.
- **Receipts, dockets, documents, or labels** →
  [references/print-templates.md](references/print-templates.md). Select and
  validate the supported output family before rollout.
- **Supported scripts, styles, or integrations** →
  [references/js-and-integration-patterns.md](references/js-and-integration-patterns.md).
  Do not target undocumented application structure.
- **Performance, testing, offline behavior, rollout, or rollback** →
  [references/performance-and-rollout.md](references/performance-and-rollout.md).

## Non-negotiable safety rules

**Never embed secrets in client-visible customization.** Assume POS views,
scripts, styles, and print output can be inspected on the register. Keep
credentials and privileged operations in an approved server-side integration,
and use obvious placeholders in documentation and examples.

**Treat every rendered value as untrusted.** Apply the current documented
escaping and encoding rules for its output context. Never place operator,
customer, scanned, or externally supplied content into an executable context.

**Never log, transmit, or print unnecessary customer or payment data.** Keep
diagnostics sanitized and limited to what support needs. Do not include
credentials, payment authorization values, personal data, or full transaction
content.

**Treat price changes and discounts as privileged outcomes.** Use the
documented permission-enforced workflow, require explicit business approval,
and verify that the result is auditable. Hidden controls and client-side checks
are usability aids, not authorization.

**Test away from live trading and know the rollback first.** Capture the
existing configuration, use a non-production or non-trading register where
possible, and keep a tested path back to the previous supported configuration.
Do not remove a referenced customization until its dependants have been
identified and safely redirected.

**Preserve supported offline operation.** A customization must remain usable,
or degrade clearly and safely, when connectivity is unavailable. Never make a
required sales or payment outcome depend on an optional external service.

## Workflow

1. Confirm the environment, intended register scope, business owner, and whether
   the target is in production.
2. Select the smallest supported extension point, then read its matching
   reference and current StoreConnect documentation.
3. Inspect the live Salesforce schema and current configuration. Do not infer a
   release contract from another store, old examples, or application code.
4. Record the existing configuration and define the rollback before editing.
5. Make the smallest additive change. Use a distinct custom identifier and do
   not replace a shipped surface without explicit approval and an inventory of
   the displaced behavior.
6. Verify all release-specific names, values, permissions, and supported
   contexts against current documentation and live metadata.
7. Allow synchronization to complete, then test the intended outcome, empty and
   long-content states, restricted operators, supported screen sizes, offline
   behavior, and the rollback.
8. Review sanitized supported diagnostics and confirm that core trading,
   navigation, payment, printing, and recovery outcomes still work.

## How a change reaches a register, and how to verify

StoreConnect and Salesforce synchronize asynchronously; wait, re-read and never repeat a write merely because it is not visible yet.

After the supported synchronization workflow completes, verify the change on
the intended register. If it is not visible, re-read the Salesforce
configuration, check supported synchronization health, and follow the current
StoreConnect troubleshooting procedure. Do not repeat writes or use a
potentially disruptive recovery operation without first protecting unsaved work
and obtaining the required approval.

## Failure modes that produce no error

| Symptom | Check |
|---|---|
| A control does nothing | Confirm the action, parameters, required context, and operator permissions against current documentation. |
| A control ignores configuration | Confirm that its names and values match the installed release contract. |
| A custom view is blank | Validate its syntax, supported context, and available data using current documentation and sanitized diagnostics. |
| A value is missing | Confirm the field exists in the live schema and is available to that supported view context. |
| A script or style works only on some screens | Confirm that the extension point is supported on every intended surface and release. |
| A global customization has no effect | Re-read its required activation, scope, and channel configuration in current documentation. |
| Print output is blank or malformed | Confirm the selected output family, template syntax, data context, and target printer configuration. |
| Sorting or filtering appears ignored | Re-read the live layout configuration and verify it against the current release contract. |

## Related skills

- `storeconnect-pos-setup` — operational POS setup, access, hardware, and
  synchronization health.
- `storeconnect-salesforce-data` — authorized inspection and editing of
  StoreConnect configuration in Salesforce.
- `storeconnect-liquid` — storefront Liquid syntax only. Do not assume its
  data surfaces or runtime behavior are available in POS.
