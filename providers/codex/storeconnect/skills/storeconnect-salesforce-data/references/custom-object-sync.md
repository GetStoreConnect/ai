# Merchant custom objects in StoreConnect

Use this when a merchant-owned Salesforce custom object - not just an extra field on a StoreConnect
object - must be readable by the storefront. For an extra field on an object StoreConnect already
syncs, use [custom-data-mappings.md](custom-data-mappings.md) instead; that path needs no Flow.

StoreConnect syncs its own objects automatically. **It does not track your custom objects.** Two
things must exist before a record reaches the storefront: a Custom Data Mapping per field, and a
record-triggered Flow that pushes each change. Build both before you create records, because the
failure mode is silence - an empty collection or stale data, never an error.

## Contents

- [The four steps, in order](#the-four-steps-in-order)
- [1. Design the object](#1-design-the-object)
- [2. Map the fields](#2-map-the-fields)
- [3. Build the sync Flow](#3-build-the-sync-flow)
- [4. Query in Liquid](#4-query-in-liquid)
- [Ordering is not supported](#ordering-is-not-supported)
- [Write from Liquid](#write-from-liquid)
- [Worked example: featured brands](#worked-example-featured-brands)
- [POS](#pos)
- [Troubleshooting](#troubleshooting)

## The four steps, in order

1. Create and secure the Salesforce custom object with a usable scoping relationship.
2. Create one `s_c__Custom_Data_Mapping__c` per field the storefront reads. This is what makes the
   object queryable.
3. Build the record-triggered Flow that calls **StoreConnect: Sync Record Changes** on create,
   update, and delete. Without it, changes after step 2 never arrive.
4. Only then create or edit records, and query them in Liquid.

Doing 4 before 3 leaves records that exist in Salesforce and have never reached the storefront.
Doing 4 before 2 leaves a query whose variable is nil - `{% for %}` over it renders nothing, with no
error to tell you why.

## 1. Design the object

- Give the object and its fields stable API names. A mapping cannot be repointed later; a rename
  means deleting and recreating every mapping.
- Field API names must not collide with an `s_c__`-prefixed field of the same name on that object -
  the mapping is refused. Prefix your own fields distinctively.
- Decide the scoping relationship first: which Store, Account, Contact, or Outlet owns each record.
  Store it as a lookup or a text ID field and map it. A custom object with no usable scope field is
  not safe for a multi-store storefront, because every query would return every store's rows.
- Expose the smallest field set the experience needs. Keep credentials, authorization state, payment
  data, staff-only notes, and personal data unmapped. Every mapped field is readable by any template
  in the org.
- Enforce business rules with Salesforce validation rules, not template logic.
- Assign least-privilege object and field permissions. Do not treat Salesforce sharing
  alone as the storefront exposure boundary: control exposure with the smallest reviewed
  mapping set and explicit store or owner scoping.
- Avoid formula fields: they change without producing a change event, so the storefront copy drifts.

## 2. Map the fields

One `s_c__Custom_Data_Mapping__c` per field. Field-level rules, validation messages, and access
levels are in [custom-data-mappings.md](custom-data-mappings.md). For a custom object specifically:

| Setting | Guidance |
|---|---|
| `s_c__Object_API_Name__c` | Full custom-object API name, including namespace and `__c` |
| `s_c__Field_API_Name__c` | Exact field API name |
| `s_c__Access_Level__c` | `read` unless a reviewed storefront write needs `read_write` |
| `s_c__Indexed__c` | Only for a field a page genuinely filters by. Allow time for the change to become effective. |

Map every field you intend to render, including the scoping field and any title. Only
mapped fields are exposed; `sfid` is always available, but do not rely on anything else
being present unless you mapped it.

Create the mappings in one reviewed batch, then wait and verify existing and new records.

Requires explicit administrative access to the mapping object.

## 3. Build the sync Flow

Two flows: one for create and update, one for delete.

**Create and update**

1. In Setup, create a **Record-Triggered Flow** on your custom object.
2. Trigger: **A record is created or updated**.
3. **Optimize the flow for**: **Actions and Related Records**.
4. Run it **After the record is saved**.
5. Add a **Decision**. Outcome `Create` with the formula condition `ISNEW()` = `True`; leave the
   default outcome as `Update`.
6. On each outcome add an **Action** and select **StoreConnect: Sync Record Changes**:
   - **Change Type**: `Create` or `Update` to match the outcome
   - **Current Record**: `{!$Record}` as **Entire Resource**
   - **Prior Record**: `{!$Record__Prior}` as **Entire Resource**
7. Save and activate.

**Delete** - a separate flow, because it must run before the row is gone:

1. New **Record-Triggered Flow** on the same object.
2. Trigger: **A record is deleted** (Salesforce sets *Before the record is deleted* itself).
3. **Action**: **StoreConnect: Sync Record Changes** with **Change Type** `Delete`, **Current
   Record** `{!$Record}` as Entire Resource, and **Prior Record** left blank.
4. Save and activate.

| Action input | Required | Value |
|---|---|---|
| Change Type | Yes | `Create`, `Update`, or `Delete` (case-insensitive) |
| Current Record | Yes | `{!$Record}`, Entire Resource |
| Prior Record | No | `{!$Record__Prior}`, Entire Resource. Needed for updates; blank for delete. |

Outputs are `Success` (boolean) and `Error Message` (text).

Constraints worth knowing before you build it:

- StoreConnect Sync must be enabled on the org. If it is disabled the action returns an error and no
  change event is generated.
- Pass `$Record` as **Entire Resource**, not a field reference. On a standard object with per-record
  sync opt-in enabled, the opt-in field must be present for the action to evaluate it.
- For high-volume or bulk changes, use supported asynchronous Flow execution and verify
  outcomes in batches.
- After activation, verify both existing and newly changed records. If older records are
  absent, use the supported reconciliation path rather than rewriting them blindly.

## 4. Query in Liquid

Use the object's Salesforce API name and only mapped field names, **lowercase**, with no `data.`
prefix:

```liquid
{%- query 'featured_brand__c' as brands,
    store__c: current_store.sfid,
    active__c: true -%}

{%- for brand in brands -%}
  <h2>{{ brand.brand_name__c | escape }}</h2>
  <p>{{ brand.tagline__c | escape }}</p>
{%- endfor -%}
```

Rules:

- **Field names in both the conditions and the output must be lowercase.** `brand.Tagline__c` returns
  nil silently.
- **`brand.data['...']` does not work here.** `{% query %}` returns generic Record objects, not
  Drops, so mapped fields are read as top-level attributes. `data` is nil on them.
- Only mapped fields plus `sfid` are valid condition names. Anything else raises
  `Invalid liquid query field: <field>`, which is also what a missing mapping looks like.
- Include the Store or owning-record condition in **every** query. `{% query %}` applies no scoping.
- Conditions are AND-only. Comparisons follow the mapped Salesforce type, so text supports `%wildcard%`
  and arrays, and numeric and date fields support `>`, `>=`, `<`, `<=` inside a string.
- Run the query once, outside any loop, and reuse the result.
- Treat every returned value as untrusted content. Escape for its output context.
- Add selective conditions. Do not fetch a whole high-volume object and filter it in Liquid.
- **Every mapped value arrives as a string** on a `{% query %}` record, whatever the Salesforce field
  type. Filtering is typed and behaves correctly; rendering and Liquid-side comparison are not. Cast
  with `| plus: 0` or `| times: 1` before arithmetic.

## Ordering is not supported

`order by` is not supported for mapped fields on a merchant custom object. Sorting by one
raises:

```text
Invalid order clause: unknown field "position__c"
```

Marking the field Indexed does not change this. Options, in preference order:

1. Order by a real column. `createddate` works, and so does `name`.
2. Sort in Liquid after the query with `sort` or `sort_natural` and a property argument. Fine for a
   bounded result set; never as a way to page through a large object. Because mapped values are
   strings here, a numeric sort key sorts lexicographically - `10` lands before `2`. Store the sort
   key zero-padded (`010`, `020`) if you need it to sort correctly this way.
3. If a page genuinely needs a large, consistently ordered custom collection, model it as
   StoreConnect records (articles, pages, categories) rather than a custom object.

## Write from Liquid

Only with a `read_write` mapping, and only from a Liquid controller `before`/`after` block -
`{% update %}` no-ops silently anywhere else. Validate the user, the record's ownership, the value,
and the allowed transition first.

```liquid
{% liquid
  after
    assign opt_in = current_request.params.opt_in | default: 'false'

    query 'customer_preference__c' as preferences,
      contact__c: current_customer.sfid,
      store__c: current_store.sfid

    for preference in preferences limit: 1
      update preference, field: 'opt_in__c', value: opt_in
    endfor
  endafter
%}
```

Note what the filter does **not** include: a record ID from the request. If you must accept one,
filter by it *and* by the authenticated customer *and* by the store, and confirm exactly one match.
Never make an administration field, price, entitlement, or authorization flag writable from Liquid.

## Worked example: featured brands

A storefront-managed list of brands, per store.

1. Create `featured_brand__c` with `brand_name__c`, `tagline__c`, `url_slug__c`, `position__c`,
   `active__c`, and a store field `store__c` holding the Store record ID.
2. Create six Custom Data Mappings in one batch, all `read`. Mark only `store__c` and `active__c`
   Indexed - those are the query conditions. `position__c` does **not** need Indexed, because
   ordering happens in Liquid. Store its values zero-padded (`010`, `020`) so the Liquid sort is
   correct: mapped values arrive as strings, so `10` would otherwise sort before `2`.
3. Build the create/update flow and the delete flow calling **StoreConnect: Sync Record Changes**.
4. Assign least-privilege Salesforce permissions to the admins who will maintain the records.
5. Create test records against a non-production store. Wait for the sync delay before looking.
6. Query with `store__c: current_store.sfid` and `active__c: true`, then sort in Liquid:

```liquid
{%- query 'featured_brand__c' as brands,
    store__c: current_store.sfid,
    active__c: true -%}
{%- assign ordered = brands | sort: 'position__c' -%}
{%- for brand in ordered -%}
  <a href="{{ brand.url_slug__c | url_encode }}">{{ brand.brand_name__c | escape }}</a>
{%- endfor -%}
```

7. Verify a second store's records cannot appear: create one against another store and confirm it is
   absent. This is the test that catches a missing scope condition.

## POS

A custom object referenced in a POS Layout can become available to the intended registers
after synchronization. A Custom Data Mapping must exist; `read` is enough — set
`read_write` only if POS must write the field back. POS layout work belongs to
`storeconnect-pos-customization`.

## Troubleshooting

| Symptom | Check |
|---|---|
| Query variable is nil, `for` renders nothing | No mapping exists for the object. At least one is required for it to be queryable at all. |
| `Invalid liquid query field: <field>` | The field has no mapping, or the name is misspelled or not lowercase |
| Object returns rows, but nothing created recently | The sync Flow may be missing or inactive. Confirm it, wait, and re-read. |
| A field is blank on every record | Field API name, mapping exists, the running admin can read it in Salesforce, and the record has a value |
| `Invalid order clause: unknown field` | `order by` on a mapped field is not supported. Sort in Liquid. |
| Update from Liquid has no effect | `read_write` on the mapping, a controller `before`/`after` block, Salesforce edit permission, value casts to the field type, record in scope. Check the debug console. |
| Another store's records appear | A missing or wrong scope condition. Fix the query before anything else. |
| Deletes in Salesforce still show on the storefront | No before-delete flow, or it is inactive |
| Records stop synchronizing after a Salesforce error | Use the supported synchronization health and error reporting; resolve the error rather than rewriting the record. |
