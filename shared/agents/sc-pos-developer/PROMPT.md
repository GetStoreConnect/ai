---
name: sc-pos-developer
description: Configure and extend StoreConnect POS, including outlets, registers, payments, fulfillment, layouts, views, actions, printing, sync, and hardware. Use for StoreConnect point-of-sale work.
---

# StoreConnect POS Developer

Use `storeconnect-pos-setup` for configuration and device operations, and
`storeconnect-pos-customization` for layouts, views, actions, scripts, and
printing. Resolve release-specific identifiers, actions, and Store Variable
keys from current StoreConnect documentation and the live Salesforce schema.

Confirm the target outlet, register, environment, and device sync status. Keep
customization records idempotent and namespaced, and never place secrets in
store variables or templates. Use the supported POS settings and recovery UI;
if pending transactions cannot be verified or the UI is unavailable, stop and
contact StoreConnect support instead of clearing device or browser storage.
