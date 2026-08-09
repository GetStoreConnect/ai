# POS Synchronization, Recovery, and Hardware

Use the supported POS status, recovery, upgrade, and hardware workflows. This
reference intentionally does not describe device storage, transport protocols,
browser internals, drivers, local table structures, or application
implementation.

Read current StoreConnect documentation for the installed release and supported
device before acting. If a required status or control is unavailable, stop and
contact the authorized operator or StoreConnect support rather than using
developer tools, clearing browser data, or reproducing an internal request.

## Contents

- [How sync works](#how-sync-works)
- [What is scoped to what](#what-is-scoped-to-what)
- [Layout filters narrow the sync](#layout-filters-narrow-the-sync)
- [The Manage data screen](#the-manage-data-screen)
- [Device recovery boundary](#device-recovery-boundary)
- [Performance and catalog size](#performance-and-catalog-size)
- [Recovery ladder](#recovery-ladder)
- [Upgrades](#upgrades)
- [Printers, cash drawers, and scanners](#printers-cash-drawers-and-scanners)
- [Troubleshooting](#troubleshooting)

## How sync works

StoreConnect POS synchronizes approved store configuration and trading data
through supported platform workflows. Initial setup, an upgrade, or an approved
reset may take longer than an ordinary update. Records can appear progressively.

Use only the status presented by the current POS interface or another supported
StoreConnect tool. Wait for the operation to finish before diagnosing an
individual record, and never repeat an administrative write merely because its
effect is not visible yet.

Do not inspect or document how the device stores, chunks, indexes, transports,
or retries synchronized data.

## What is scoped to what

The data available to a register can legitimately vary by store, store group,
outlet, register, channel, staff access, provider setup, and active
customization. The exact datasets and rules are release-specific.

When a count or record differs:

1. Confirm the org, environment, store, outlet, and register.
2. Read the current StoreConnect documentation for that data category.
3. Check the supported POS status for the intended scope.
4. Review the live Salesforce configuration and active POS Layout Filters.
5. Compare another register only after controlling its scope.

Do not use a remembered dataset inventory or local record count as proof that
the synchronization service failed.

## Layout filters narrow the sync

A supported POS Layout Filter can intentionally narrow which records are
available for a screen or workflow. When an object appears incomplete:

- inventory the active filters for the intended store and register;
- compare them with the current documented layout behavior;
- confirm whether outlet, register, or store context changes the result;
- test one reversible filter change in non-production; and
- restore the original value if the outcome is not as expected.

Authoring filters belongs to `storeconnect-pos-customization`. Do not derive
filter syntax, parser behavior, or client-side context from device internals.

## The Manage data screen

Use the current in-POS data-management surface to review synchronization health
and perform supported recovery. Labels and available controls may vary by
release, so follow the interface and current StoreConnect documentation rather
than this page as a button catalog.

Before any disruptive action:

1. Confirm the intended store, outlet, register, and device.
2. Let an active synchronization finish where possible.
3. Check the supported status for unsynchronized transactions or other work at
   risk.
4. Record sanitized status and time, not customer records or payloads.
5. Prefer the narrowest supported resynchronization for the affected data
   category.

An inability to confirm that work is safely synchronized is a stop condition.

## Device recovery boundary

POS owns its device state and connection lifecycle. Never inspect, edit, export,
or clear internal browser or application storage as a recovery procedure. Never
use developer tools, local database utilities, hidden URLs, raw requests, or
platform-maintained Salesforce fields to force a result.

Use supported controls only. Any reset, clear, disconnect, or reassignment that
can interrupt trading or discard work requires explicit approval after the risk
is stated.

## Performance and catalog size

Diagnose the outcome rather than tuning undocumented internals:

| Symptom | Supported first response |
|---|---|
| First setup is still becoming ready | Keep the supported POS session available, wait for the current status, and do not reset it |
| Large catalog takes too long | Compare the device and browser with current supported requirements; complete setup outside trading hours |
| Only one data category is slow or incomplete | Confirm scope and active Layout Filters, then use the narrowest supported resynchronization |
| Several registers differ | Compare their store, outlet, register, provider, and customization scope before changing data |
| Device reports limited capacity | Follow current StoreConnect and device-vendor capacity guidance; do not clear application data |
| Browser customization interferes | Reproduce in a clean, supported profile and follow the current compatibility guidance |

For a large-catalog rollout, stage one representative supported device in
non-production, measure time to a healthy supported status, test a complete sale,
then schedule remaining devices with adequate setup time and rollback coverage.

## Recovery ladder

Work in order and stop as soon as the supported outcome is restored.

1. **Confirm target and current status.** Verify the store, outlet, register,
   device, connectivity, and whether an operation is still running.
2. **Refresh through the ordinary supported POS flow.** Re-read the status and
   avoid repeated refreshes while initialization is active.
3. **Use the narrowest supported resynchronization.** Target the affected data
   category when the current interface permits it.
4. **Use the supported reconnect flow.** Confirm no transaction or shift work is
   unsynchronized before reconnecting.
5. **Disconnect normally when reassignment is required.** Obtain approval,
   verify the register is not trading, and use the in-POS control.
6. **Use the supported administrative register reset only when necessary.**
   Confirm no active device or trading workflow still owns the register.
7. **Use a full in-POS reset only as the last resort.** State the possible loss
   of unsynchronized orders, payments, or shifts; obtain explicit approval; and
   follow the current documented flow.

Never substitute a browser-data wipe or a direct edit of connection state.

Escalate to StoreConnect support when work at risk cannot be verified, the
supported controls cannot be reached, or the same sanitized error returns after
the narrowest documented recovery. Provide the environment, store/outlet/register
labels, supported device and browser versions, time, steps, and sanitized error
text. Do not provide customer data, payment payloads, credentials, PINs, or
unnecessary identifiers.

## Upgrades

Treat a POS upgrade as a scheduled operational change:

1. Read the release's current StoreConnect upgrade documentation.
2. Test the representative workflows in non-production.
3. Confirm supported device and browser requirements.
4. Schedule outside trading hours and communicate the interruption.
5. Upgrade a small representative set first.
6. Wait for the supported initialization status to complete.
7. Run sign-in, catalog, payment, fulfillment, printing, and shift smoke tests.
8. Continue the rollout only after the sample passes.

Do not describe or manipulate the application's update transport or device-side
storage. If initialization repeats or fails, capture sanitized supported status
and contact StoreConnect support.

## Printers, cash drawers, and scanners

Configure hardware through the current in-POS settings and the official
StoreConnect and hardware-vendor compatibility documentation. Do not publish a
transport, browser API, driver, cable, command, or pairing recipe as universal;
support varies by device, operating system, POS application, and release.

Outcome workflow:

1. Confirm the register is connected through the supported flow.
2. Confirm the approved receipt, document, or label template already exists.
3. Verify the hardware model and connection method are supported for the current
   device and release.
4. Complete vendor prerequisites through the authorized setup.
5. Select the existing template and connect the hardware through the in-POS
   interface.
6. Run a test with non-sensitive content.
7. Verify a representative payment or fulfillment outcome only after the basic
   test succeeds.

For a cash drawer, follow the current printer and drawer compatibility guidance
and verify only the approved payment outcomes trigger it. For a scanner, verify
a representative product resolves through the current supported layout. Do not
infer keyboard, terminator, driver, or field-mapping behavior from observed
device internals.

Payment terminals are configured only through the payment provider's authorized
onboarding. Never place terminal, merchant, or pairing credentials in Store
Variables, templates, files, prompts, logs, or issues.

## Troubleshooting

| Symptom | Supported diagnosis order |
|---|---|
| Register is unavailable | Confirm store and outlet, active configuration, current assignment, and supported connection status; then use the approved disconnect or reset flow |
| Product is absent | Work the [product-readiness checklist](pos-object-reference.md#product-readiness-checklist), review active Layout Filters, then wait for supported synchronization |
| Product is visible but not sellable | Confirm the [effective price](pos-object-reference.md#pricebook-resolution), current availability, and supported inventory outcome |
| Payment method is missing | Confirm the current [payment type](pos-object-reference.md#payment-method-types), provider onboarding and POS availability, documented Store Variable setting, and required session refresh |
| Fulfillment does not route | Confirm the current [fulfillment type](pos-object-reference.md#fulfillment-types), product category assignment, outlet station configuration, and supported route status |
| Configuration change is not visible | Re-read the intended store setting, follow its documented refresh or synchronization step, wait for completion, and do not repeat the write |
| Synchronization appears incomplete | Confirm intended scope and Layout Filters, read the supported status, then use the narrowest documented resynchronization |
| Hardware is unavailable | Confirm current compatibility, authorized vendor prerequisites, the selected template, and the in-POS connection status |
| Staff cannot sign in | Confirm active user and outlet access plus completion of the supported PIN prerequisite without reading the PIN; then wait for the documented refresh |
| Upgrade or initialization does not finish | Keep the supported session available, capture sanitized status and time, and contact StoreConnect support rather than clearing local state |

Test recovery and hardware changes in non-production first. Schedule production
work outside trading hours and obtain explicit approval for any action that can
interrupt trading or discard unsynchronized work.
