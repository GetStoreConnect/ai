---
name: storeconnect-pos-setup
description: Configure and troubleshoot StoreConnect POS outcomes — outlet and register readiness, staff access, product availability and pricing, payment and fulfillment setup, supported Store Variable settings, synchronization, recovery, and hardware. Use when standing up POS, adding or repairing an outlet or register, or diagnosing why a product, payment method, register, or configuration change is missing at the terminal. For POS layouts, views, actions, or print-template markup, use storeconnect-pos-customization instead.
---

<!-- Generated from shared/skills. Do not edit this copy. -->

# StoreConnect POS Setup

POS setup combines StoreConnect-managed Salesforce configuration, supported
Store Variables, payment-provider onboarding, and actions completed in the POS
interface. This skill describes the safe outcome workflow. It does not publish a
static catalog of managed objects, fields, identifiers, device storage, or
connection mechanics.

Resolve every write surface from the installed release's current StoreConnect
documentation and the live Salesforce schema. If those sources do not describe
the requested change, stop rather than reconstructing it from browser bundles,
device data, network traffic, or another customer.

**Boundary.** POS Layouts, Layout Fields, Layout Filters, POS Views, supported
actions, Script and Style Blocks, and print-template markup belong to
`storeconnect-pos-customization`. This skill may inspect a Layout Filter while
diagnosing scope, and it may confirm that a required print template exists
before hardware setup.

## Read before you change anything

**Confirm the environment and store first.** Show the operator the org,
environment, store, outlet, and register labels that are in scope. Complete a
first setup and test transaction in a non-production environment.

**Discover, do not assume.** Before a Salesforce write:

1. describe the relevant live object and fields;
2. read the existing records and supported picklist values;
3. confirm the current StoreConnect documentation for the intended outcome;
4. resolve the target by store and a stable business label; and
5. save a rollback of only the fields that will change.

Do not copy an object map, field list, relationship tree, or validation rule from
an older release into an automation.

**Verify scope after every change.** Re-read the configured outlet, register,
staff access, inventory source, provider, or routing record and confirm it
belongs to the intended store. Treat a wrong-store relationship as a
data-isolation incident, not a cosmetic error.

**Protect credentials.** Outlet connection credentials, staff PINs, payment
gateway secrets, and terminal or pairing credentials must stay in the supported
administrative or provider flow. Never read them back, echo them, place them in
Store Variables, or copy them into files, prompts, logs, issues, templates, or
repositories.

Private partner or client configuration may retain the customer domain and
record identifiers needed for that engagement when access is restricted. Public
examples and shared material use placeholders such as `store.example.com`,
`<store-id>`, `Outlet A`, and `Register 1`. Credentials are never retained.

**Approval boundary.**

| An agent may do directly | Requires explicit human approval |
|---|---|
| Read and describe existing POS configuration | Any production write |
| Prepare a field-level plan from current documentation and live schema | Creating, activating, retiring, or reassigning a live outlet or register |
| Create or edit records in a confirmed non-production environment | Enabling, disabling, or relabeling a live payment or fulfillment option |
| Read non-secret Store Variable configuration | Setting or changing a connection credential, staff PIN, or provider credential |
| Diagnose synchronization or hardware symptoms | A supported register reset, clear, disconnect, or other action that can interrupt trading or discard unsynchronized work |

Use supported Salesforce data tooling for Salesforce configuration; see
`storeconnect-salesforce-data`. Query for an existing logical match before every
create because the live schema may not expose an idempotent upsert key.

## Setup order

Follow this outcome order. Required relationships and supported administrative
flows may impose additional steps in the installed release.

1. **Confirm POS access.** Choose one currently documented POS access mode,
   complete any domain or DNS prerequisite through the supported administrative
   workflow, and verify the sign-in page at a placeholder-safe URL. Resolve the
   current Store Variable name from documentation rather than copying one from
   an example.

2. **Establish the outlet.** Use the live schema and current documentation to
   create or select the outlet for the confirmed store. Complete the supported
   prerequisites for guest sales, location, tax, and pricing as applicable.
   Re-read it and verify the store relationship.

3. **Confirm inventory coverage.** Attach at least one supported, active
   inventory source to the outlet and verify that it can contribute sellable
   stock for the intended catalog. Do not infer the relationship fields from an
   old object map.

4. **Establish the register.** Create or select an active register for the
   outlet through the supported workflow. Confirm it is available to the
   intended device. Do not manually edit platform-maintained connection state;
   use the supported disconnect or administrative reset flow when reassignment
   is required.

5. **Configure staff access.** Create the supported role or capability profile,
   grant the staff member access to the intended outlet, and have a Salesforce
   administrator set any required PIN through the supported interface. The staff
   member enters their own PIN during verification; an agent never asks for it.

6. **Verify product readiness.** Work through the
   [product-readiness checklist](references/pos-object-reference.md#product-readiness-checklist)
   before troubleshooting the device. Confirm the product appears, can be added
   to a cart, and resolves the expected price.

7. **Configure payments.** Discover the tender types supported by the installed
   release, complete provider onboarding where required, and use the documented
   Store Variable integration only for supported visibility or label settings.
   See [payment method types](references/pos-object-reference.md#payment-method-types).
   Verify both the sale and refund outcomes relevant to the store.

8. **Configure fulfillment.** Discover the supported fulfillment types and use
   documented Store Variables for supported presentation settings. If the store
   routes work to preparation areas, follow
   [fulfillment station routing](references/pos-object-reference.md#fulfillment-station-routing)
   and verify the result at the intended outlet.

9. **Connect the device.** Use the current in-POS connection flow, select the
   confirmed outlet and register, and verify the register is assigned through
   the supported status. Do not reproduce or bypass its connection protocol.

10. **Configure hardware.** Use the in-POS hardware workflow and the current
    StoreConnect compatibility documentation. Confirm the required print
    template already exists, then run a non-sensitive test.

11. **Run an end-to-end test.** Sign in, find a representative product, add it
    to a cart, exercise each approved payment and fulfillment outcome, print if
    used, confirm the transaction reaches the supported back-office view, and
    complete the shift workflow.

## Which reference to read, and when

| Situation | Read |
|---|---|
| Creating or repairing outlet, register, staff, inventory, pricing, payment, or routing configuration | [references/pos-object-reference.md](references/pos-object-reference.md) for outcome checks and live-schema discovery |
| Product missing or not sellable | [product-readiness checklist](references/pos-object-reference.md#product-readiness-checklist) |
| Price differs at one register or customer | [pricebook resolution](references/pos-object-reference.md#pricebook-resolution) |
| Selecting or enabling a tender | [payment method types](references/pos-object-reference.md#payment-method-types) |
| Selecting a fulfillment outcome | [fulfillment types](references/pos-object-reference.md#fulfillment-types) |
| Routing items to a preparation area | [fulfillment station routing](references/pos-object-reference.md#fulfillment-station-routing) |
| Changing a supported POS access, payment, fulfillment, lock, display, or delivery setting | [references/store-variables.md](references/store-variables.md), then the current StoreConnect documentation for the exact supported key |
| Data not reaching a device, a register unavailable, or a device slow to become ready | [references/sync-storage-hardware.md](references/sync-storage-hardware.md) |
| A reset or reconnect may be needed | [recovery ladder](references/sync-storage-hardware.md#recovery-ladder) |
| Configuring supported hardware | [printers, cash drawers, and scanners](references/sync-storage-hardware.md#printers-cash-drawers-and-scanners) |
| Planning a large-catalog rollout | [performance and catalog size](references/sync-storage-hardware.md#performance-and-catalog-size) |
| Any other terminal symptom | [troubleshooting](references/sync-storage-hardware.md#troubleshooting) |

## Failure modes worth pre-empting

- **Wrong store or outlet.** Re-read every relationship after a change.
- **Register still assigned elsewhere.** Use the supported disconnect or reset
  workflow with approval; do not edit local data or platform-maintained state.
- **Product outside supported catalog scope.** Work the readiness checklist
  before resetting a device.
- **No effective price.** Establish the applicable pricing context before
  changing a pricebook.
- **Provider-backed tender incomplete.** Finish provider onboarding and confirm
  the POS channel before changing a Store Variable.
- **A customization narrows scope.** Review active POS Layout Filters with
  `storeconnect-pos-customization`.
- **Invented Store Variable.** An undocumented key may silently do nothing.
  Resolve the exact key from current StoreConnect documentation.
- **Repeated write during asynchronous propagation.** Wait, re-read, and use the
  supported status before deciding a change failed.

## Related skills

- `storeconnect-pos-customization` — POS layouts, fields, filters, views,
  actions, print-template markup, JavaScript, and CSS.
- `storeconnect-salesforce-data` — supported Salesforce reads and writes.
- `storeconnect-platform` — platform orientation and tool-preference order.
