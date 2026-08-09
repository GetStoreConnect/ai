---
name: storeconnect-salesforce-data
description: Create, query, relate, and delete StoreConnect Salesforce records - stores, pages, content blocks, menus, articles, categories, themes, junction objects, Custom Data Mappings, and merchant custom objects. Covers exact s_c__* object and field API names, required creation order, delete and cascade semantics, store scoping, and how a Salesforce field or custom object becomes visible to Liquid. Use when a task needs a record created or changed in Salesforce rather than in a theme file, when a Liquid template needs a custom Salesforce field or object it cannot currently see, or when you need a verified s_c__* API name.
---

<!-- Generated from shared/skills. Do not edit this copy. -->

# StoreConnect Salesforce data

Salesforce is the system of record. StoreConnect and Salesforce synchronize
asynchronously; wait, re-read, and never repeat a write merely because it is not visible
yet. This skill covers writing and reading those records directly.

**Blast radius.** These operations write to a customer's production Salesforce org. A wrong field
name fails loudly; a wrong record ID or a missing store filter fails silently and corrupts a live
store. Nothing here is reversible by undo.

## Pick your tool in this order

1. **A connected StoreConnect tool.** Preferred for catalog, content, and menu records: it stages the
   change as a draft for human review before publish. Inspect the live tool schemas at runtime.
2. **`storeconnect-cli`** for theme files, assets, and CSS. It stages through the same reviewed draft
   pipeline, so it is a first-class path and not a fallback. See `storeconnect-sync-deploy`.
3. **A connected Salesforce data tool** (sObject/record MCP), for records the staged surface does not
   cover. A direct Salesforce write is an immediate live mutation, but the tool runs as the current
   user and respects sharing, CRUD, and field-level security, so a permission gap surfaces as an
   error rather than a silent partial write.
4. **Salesforce CLI (`sf`)**, only when nothing above covers the task *and* the operator approves the
   direct path. It runs with the authenticated user's full access and no staging step.

Never reconstruct an MCP tool call from a remembered catalog. Two stores do not expose the same tools.

## Rules that apply before any write

1. **Confirm the target org and environment out loud.** Name the org alias or username, whether it
   is production or a sandbox/scratch org, and the Store record you are acting on. Get confirmation.
   Never rely on the CLI's default target org for a write.
2. **Scope every query and every write.** Add the Store filter on any object that can hold records
   for more than one store, and the authenticated customer's ID on any customer-owned record. Never
   trust a record ID that arrived in a request without also filtering by store and owner.
   `s_c__Content_Block__c`, `s_c__Theme__c` and its children, `s_c__Media__c`, and
   `s_c__Custom_Data_Mapping__c` have **no** Store field at all - they are org-wide and shared, so
   editing one can change several stores at once. Check what else points at the record first.
3. **Show the diff and get approval before writing.** Resolve the record, print its current field
   values and the intended new values, and wait. For a create, print the parent IDs you resolved.
4. **Never put credentials, tokens, session IDs, PINs, real record IDs, org IDs, customer data, or
   production hostnames** in this repository, in a shared log, in a commit, or in a conversation.
   Use `store.example.com` and obvious placeholders. Never commit a CLI auth file or a data export.
5. **Do not write platform-managed fields.** Auto-number `Name` fields, formula fields, composite
   `s_c__Unique_*` keys, `s_c__Data_Type__c` and `s_c__Component_Fields__c` on a Custom Data Mapping,
   and calculated inventory/payment/tax/fulfillment/balance/lifecycle fields are all
   platform-managed. See [references/salesforce-objects.md](references/salesforce-objects.md)
   for which is which.
6. **`s_c__sC_Id__c` is a stable StoreConnect identifier.** You may set it on insert to make
   an import idempotent, but never change it on an existing record. Confirm the field is
   createable for the running user before you build an upsert around it.

## Destructive operations

| Operation | Rule |
|---|---|
| Delete any record | Explicit human approval per record set. Produce a scoped report of IDs, names, relationships, and downstream impact first. |
| Delete because a local file is absent | Never. Absence from a theme checkout is not evidence a record is unused. Report the orphan candidates instead. |
| Delete a `s_c__Theme__c` | Never scripted. Theme Templates, Assets, and Variables are master-detail children and are all destroyed with it. |
| Bulk delete (`sf data delete bulk`) | Never on production content, catalog, customer, or order data. Single-record deletes, reviewed one at a time. |
| `--pre-destructive-changes` / `--purge-on-delete` metadata deletes | Human approval, and only after `--dry-run`. |
| Change a page/article/category path | Allowed, but it auto-creates a redirect record. Do not also hand-build one. |

Deletes have real cascade behavior: some parents destroy their children, some are blocked while a
child exists, some leave a null-pointing orphan. Read
[references/salesforce-objects.md](references/salesforce-objects.md) § Delete behavior before
deleting anything with relationships.

## Required ordering

Creating a record before the thing it depends on produces confusing failures, so work in this order.

1. **A merchant custom object needs its sync path before it needs anything else.** Create the
   Salesforce object, create a Custom Data Mapping for every field the storefront reads, then build
   the record-triggered Flow that pushes changes to StoreConnect. Only then create records. With no
   mapping the object is not queryable at all and the query variable is nil. With a mapping but no
   Flow, later changes do not appear. Neither state necessarily raises an error. See
   [references/custom-object-sync.md](references/custom-object-sync.md).
2. **A Custom Data Mapping must exist before Liquid can see a custom field.** No mapping means the
   field is invisible to the storefront regardless of what the record contains.
3. **Parent before child.** Store, then Theme, then Theme Template/Asset/Variable. Store, then
   Taxonomy, then Product Category. Store, then Menu, then Menu Item. Store, then Page.
4. **Both sides before the junction.** Resolve and verify the two record IDs, confirm they belong to
   the intended store, then create the junction row.
5. **A Menu Item's destination record must already exist** and must be exactly one of page, product,
   product category, article, article category, or URL.
6. **Media before anything that references it** (`s_c__*_Image_Id__c`, `s_c__Logo_Id__c`).

## Propagation: do not verify too early

StoreConnect and Salesforce synchronize asynchronously; wait, re-read and never repeat a
write merely because it is not visible yet. Timing varies by record type, data volume, org
automation, and mapping changes.

Verification sequence: re-query Salesforce first, allow synchronization to complete, then
check the storefront. Related records may become visible at different times. If the expected
result still does not appear, use the supported synchronization health and error reporting
instead of rewriting the record.

**Cached storefront output.** After theme or content writes land, use only the
current cache-refresh procedure available to the authorized operator. If none is
documented for the direct-write path, stop and hand off; do not guess at a field
or construct a replacement request. Refresh once after the complete batch.

## Which reference to read

| Read this | When |
|---|---|
| [references/salesforce-objects.md](references/salesforce-objects.md) | You are creating, editing, or deleting a page, content block, menu, article, category, theme record, style block, or junction row, and need the exact field API names, which fields are required on create, which are auto-assigned, and what a delete does. Start here for any content or theme record work. |
| [references/custom-data-mappings.md](references/custom-data-mappings.md) | A Liquid template needs a Salesforce **custom field** that no Drop exposes, or a storefront form must write one back. Without an approved mapping the field is invisible to the storefront no matter what the record holds. Also read it before enabling Read/Write or Indexed - both have consequences you must know first. |
| [references/custom-object-sync.md](references/custom-object-sync.md) | A **whole merchant custom object** must appear on the storefront. The record-triggered sync Flow is the real gate; skipping it is a dead end that looks like an empty query. Read this before creating any records in that object. |
| [references/commerce-objects.md](references/commerce-objects.md) | You need to locate commerce data - products, pricing, inventory, carts, orders, promotions, vouchers, shipping, tax, payments, bookings, subscriptions, POS - and do not yet know which object holds it. Orientation map, then describe the object in the org. |
| [references/sf-cli-recipes.md](references/sf-cli-recipes.md) | You have exhausted tool options 1-3 and are running `sf` directly with the operator's approval. Verified command syntax, safe query and write patterns, SOQL selectivity, bulk thresholds, and the delete checklist. |

For `{% query %}` syntax, Drop attributes, and reading mapped fields inside a template, use
`storeconnect-liquid`. For pushing theme files and the publish workflow, use `storeconnect-sync-deploy`.
For deploying Apex or metadata, use `storeconnect-apex-integration`.

## Failure modes to recognize

| Symptom | Most likely cause |
|---|---|
| `INVALID_FIELD` on write | Field API name wrong, or missing namespace/`__c`. Describe the object; do not guess. |
| `REQUIRED_FIELD_MISSING` on create | A required lookup or picklist. `s_c__Content_Block__c` requires `s_c__Template__c`; `s_c__Page__c`/`s_c__Article__c` require `s_c__Store_Id__c`. |
| `DUPLICATE_VALUE` on create | A composite `s_c__Unique_*` key collided - the path, identifier, or key already exists in that store or theme. |
| `DELETE_FAILED` / restricted delete | A child record still points at it. Delete the children first. |
| Write succeeded, storefront unchanged | Allow synchronization, re-read, then use the supported operator cache-refresh procedure. Do not repeat the write or guess at an internal field. |
| Liquid renders nothing for a custom field | No Custom Data Mapping, the mapping change has not propagated yet, or `data[...]` was used on a `{% query %}` record instead of a Drop. `data[...]` on a Drop is case-insensitive, so case is not the cause there. |
| `{% update %}` silently does nothing | It only runs inside a Liquid controller `before`/`after` block, and only against a Read/Write mapping. Both failures are silent on the page. |
| Custom object query is empty, or frozen at old data | No mapping (empty) or no sync Flow (frozen). The records exist in Salesforce and have never reached the storefront. |
| Records from another store appear | Missing Store filter. Stop and fix the query before doing anything else. |
