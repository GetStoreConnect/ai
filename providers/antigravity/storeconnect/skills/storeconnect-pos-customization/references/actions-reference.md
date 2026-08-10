# POS actions and Action Items

Use Action Groups and Action Items to add supported buttons, menus, and tiles to
StoreConnect POS. Action availability and parameters vary by StoreConnect
release, so this reference deliberately does not reproduce a static action
inventory.

## Contents

- [Use the current supported action contract](#use-the-current-supported-action-contract)
- [Configure an Action Group](#configure-an-action-group)
- [Configure an Action Item](#configure-an-action-item)
- [Custom JavaScript](#custom-javascript)
- [Chaining actions](#chaining-actions)
- [Failure handling](#failure-handling)
- [Discounts, price overrides, and destructive actions](#discounts-price-overrides-and-destructive-actions)
- [Review checklist](#review-checklist)

## Use the current supported action contract

Before creating or changing an Action Item:

1. Confirm the target Store, environment, Outlet, register, and installed
   StoreConnect release.
2. Read the current StoreConnect documentation and the live Salesforce field
   descriptions or picklists available for that release.
3. Choose only a documented action and copy only its documented parameters.
   Never infer a name or payload from a browser bundle, network trace, console
   output, another customer's configuration, or an older release.
4. Confirm whether the action changes a transaction, price, order, device,
   session, or synchronized data. Apply the approval gate below before saving.
5. Test the action on a non-production register with realistic permissions and
   an explicit rollback.

If the supported documentation does not identify the action and parameters
needed for the requirement, treat the action as unavailable and contact
StoreConnect support. Do not probe or enumerate undocumented actions.

## Configure an Action Group

An `s_c__Pos_Action_Group__c` controls where a collection of actions appears and
whether it is presented as a list or grid. Prefer a new, clearly prefixed
identifier for custom work.

Reusing a shipped identifier can replace the corresponding shipped surface.
Before doing that:

- inventory the operator workflows currently available there;
- show the intended replacement and rollback;
- obtain explicit approval; and
- verify that navigation, session, recovery, and accessibility controls remain
  available after the change.

## Configure an Action Item

An `s_c__Pos_Action_Item__c` belongs to an Action Group and supplies the
documented action, display label, placement, presentation, and parameters for
that release.

Work from the live Salesforce schema rather than a copied field map:

1. Resolve the parent group.
2. Select a documented action.
3. Enter only the parameters documented for that action and release.
4. Use record identifiers or fixed configuration values rather than free-form
   operator input wherever possible.
5. Escape any Liquid-derived value for its output context.
6. Never pass credentials, PINs, payment data, arbitrary field names, or
   unvalidated customer input.
7. Save one item, allow synchronization to complete, and test it before adding
   another.

Do not use UI visibility as authorization. Hiding an Action Item from a layout
does not prevent a determined browser user from attempting the underlying
operation. Enforce permissions through StoreConnect and Salesforce.

## Custom JavaScript

Prefer Action Items over JavaScript. Use the documented POS client action bridge
only when the current StoreConnect documentation explicitly supports it for the
installed release.

- Copy the supported call shape and parameter contract from current
  documentation; do not derive undocumented names or parameters.
- Handle both success and failure in the user interface.
- Prevent double activation while an action is pending.
- Never log parameters containing customer, order, payment, credential, or PIN
  data.
- Do not patch platform globals or dispatch undocumented actions.
- Re-test after every StoreConnect upgrade.

If a supported JavaScript example is not available for the installed release,
use an Action Item or request a supported extension point.

## Chaining actions

Action Items can be linked through their documented next-action relationship.
Keep a chain short, test each item independently, and make partial completion
understandable to the operator.

Never:

- put a financial, destructive, approval, or recovery action after a step that
  can fail silently;
- depend on undocumented values passed between actions;
- use a chain to bypass a confirmation or permission check; or
- leave a relationship pointing to a deleted Action Item.

## Failure handling

When a button appears but does not complete its task:

1. Re-read the Action Item and parent group from Salesforce.
2. Compare the configured action and parameters with current supported
   documentation for the installed release.
3. Confirm the operator's permissions and the current record context.
4. Allow StoreConnect and Salesforce synchronization to complete, then re-read.
5. Check the POS supported status and sanitized diagnostics.
6. Test the action by itself on a non-production register.

Never repeat the Salesforce write merely because the change is not visible yet,
and do not probe alternate action names until one happens to work.

## Discounts, price overrides, and destructive actions

Treat any action that changes price, discount, order state, payment flow,
register/session state, synchronized data, or unsaved device work as privileged.

Before adding one:

- obtain explicit written approval for the specific operator workflow;
- enforce authorization through StoreConnect or Salesforce, not JavaScript or
  hidden UI;
- confirm the resulting transaction is attributable and auditable;
- state any offline or unsaved-data impact;
- provide a non-production test and rollback; and
- keep recovery and reset operations in the supported in-app administration
  flow rather than on a routine custom button.

Prefer built-in, permission-enforced discount and order workflows over custom
price manipulation. Never expose a generic record-write or device-reset
capability through a custom Action Item or script.

## Review checklist

- Target Store, environment, Outlet, register, and release are confirmed.
- Every action and parameter is supported by current documentation.
- Every configured action and parameter came from current supported
  documentation and live release metadata.
- The custom group does not silently replace required shipped controls.
- Financial, destructive, recovery, and approval-sensitive behavior has explicit
  approval and platform-enforced authorization.
- The action handles failure, prevents double activation, and logs no sensitive
  values.
- Each item works on a non-production register for the intended permission
  levels, offline state, and rollback.
- StoreConnect and Salesforce synchronization was allowed to complete before
  diagnosing or retrying.
