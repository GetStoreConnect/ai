# Custom Data Mappings

A `s_c__Custom_Data_Mapping__c` is what makes a Salesforce **custom field** visible to StoreConnect
Liquid. Without a mapping the field does not exist as far as the storefront is concerned, no matter
what the record holds. Use one when a template needs a custom field that no documented Drop exposes.

If you need a whole merchant custom object rather than an extra field, read
[custom-object-sync.md](custom-object-sync.md) instead - that path needs a sync Flow as well.

## Contents

- [Create the mapping](#create-the-mapping)
- [Validation rules](#validation-rules)
- [Read a mapped value](#read-a-mapped-value)
- [Filter on a mapped value](#filter-on-a-mapped-value)
- [Write a mapped value](#write-a-mapped-value)
- [Indexed](#indexed)
- [Type casting](#type-casting)
- [Verify](#verify)
- [Troubleshooting](#troubleshooting)

## Create the mapping

Create the record through the **Custom Data Mappings** page in the App Launcher, a connected
StoreConnect tool, or an approved data operation. Set only these three fields:

| Field | Value |
|---|---|
| `s_c__Object_API_Name__c` | Exact Salesforce object API name, with namespace. `Product2`, `Account`, `s_c__Article__c`, `my_object__c`. **Required.** |
| `s_c__Field_API_Name__c` | Exact field API name on that object, with namespace and `__c`. **Required.** |
| `s_c__Access_Level__c` | Restricted picklist: `read` (default) or `read_write`. |

Leave everything else alone:

- `s_c__Data_Type__c` is populated on insert from the Salesforce field's describe type. Do not set it.
- `s_c__Component_Fields__c` is populated automatically for address and location (compound) fields.
  Do not set it. It is blank for every other type.
- `Name` is auto-number - supplying it fails.
- `s_c__Unique_Custom_Data_Mapping_Key__c` is assigned from object + field.

`s_c__Custom_Data_Mapping__c` has **no Store field**. A mapping is org-wide and applies to every
store in the org. You cannot expose a field to one store only.

Creating a mapping requires explicit administrative access to the mapping object. Confirm
the running user's object and field permissions before writing.

Do not map credentials, tokens, payment data, authorization state, staff-only notes, internal
operational fields, or anything the public storefront does not need to render. Every mapped field
becomes readable by any template on any store in the org.

## Validation rules

- The object and field API names must exist in the target org.
- A custom field name must not collide with a StoreConnect-managed field name.
- Only one mapping may exist for an object and field pair.
- Object and field API names are immutable after creation.

If a field name collides, rename the merchant field distinctly, for example
`Client_Outlet_Id__c`, and map that instead.

The immutability rule means **you cannot repoint a mapping.** To change the target, delete the
mapping and create a new one. Only `s_c__Access_Level__c` and `s_c__Indexed__c` are editable.

**Formula fields are a poor choice.** Their values change without producing a change event, so the
storefront copy drifts. Map a stored field instead.

Adding a mapping can take time to become available across existing records. Group related
mapping changes into one reviewed operation, then wait and verify before continuing.

## Read a mapped value

On a documented Drop, use the `data` accessor with the Salesforce API name:

```liquid
{{ product.data['field_1__c'] }}
{{ current_article.data['Region__c'] }}
```

Lookups into `data` are **case-insensitive** and a missing key returns nil rather than raising, so
`data['Region__c']`, `data['region__c']`, and `data['REGION__C']` are equivalent - and a typo renders
nothing at all with no error. Keep the `__c` suffix.

Use the **Liquid object** name, not the Salesforce object name: a `Product2` mapping is read through
`product`, and a mapping on `Contact` (or `Account` for Person Accounts) through `current_customer`.

Only mapped fields appear in `data`. Guard optional values before rendering, and escape output for
its HTML, attribute, URL, JavaScript, or JSON context.

Compound fields return a drop rather than a string:

```liquid
{{ current_account.data['head_office__c'].street }}
{{ current_account.data['head_office__c'].city }}
{{ current_account.data['head_office__c'].postal_code }}
{{ current_account.data['head_office__c'].state }}
{{ current_account.data['head_office__c'].country }}

{{ outlet.data['site_geolocation__c'].latitude }}
{{ outlet.data['site_geolocation__c'].longitude }}
```

Multi-picklist fields return an array:

```liquid
{%- for option in product.data['fit_options__c'] -%}
  {{ option }}
{%- endfor -%}
```

**A `{% query %}` result is not a Drop.** Records returned by `{% query %}` are generic Record
objects, and `record.data` is nil on them. Read the raw column instead, with a lowercase field name:

```liquid
{%- query 'Product2' as records, data.color__c: 'blue' -%}
{%- for record in records -%}
  {{ record.custom_data.color__c }}
{%- endfor -%}
```

## Filter on a mapped value

For a mapped field on a standard or StoreConnect object, prefix with `data.` and use **lowercase**:

```liquid
{%- query 's_c__Article__c' as articles,
    s_c__store_id__c: current_store.sfid,
    s_c__published__c: true,
    data.region__c: 'north' -%}
```

The `data.` form compiles to a JSON containment match against stored keys that are always lowercase.
Consequences:

- Lowercase is mandatory. `data.Region__c:` matches nothing.
- **Exact match only.** No `%wildcard%`, no `>`/`>=`/`<`/`<=`, no array-of-values. Those work on real
  columns and on merchant custom-object fields, not on `data.` filters.
- A `data.` filter naming a field with no mapping does **not** raise - it silently returns zero rows.
  An empty result is the symptom of a missing mapping here.

For a merchant custom object, drop the `data.` prefix and use the mapped field name directly. See
[custom-object-sync.md](custom-object-sync.md).

Always keep the Store or owning-record condition in the query. `{% query %}` does not scope by store
for you. Full syntax is in `storeconnect-liquid/references/query-tag.md`.

## Write a mapped value

`s_c__Access_Level__c: read_write` lets a template push a value back to Salesforce. Use it only when
all of these hold:

1. A Liquid controller `before` or `after` block owns the action. **`{% update %}` does nothing
   outside a controller** - it returns immediately when there is no controller in the render context,
   with no error on the page. A page or block template cannot write.
2. The field is safe for that user and that experience to edit.
3. The running user's Salesforce object and field permissions allow the edit.
4. The template validates and normalizes the input before passing it.
5. The target record is unambiguous and belongs to the confirmed store and customer scope.

```liquid
{% liquid
  after
    assign color = current_request.params.color | strip
    update current_customer, field: 'favorite_color__c', value: color
  endafter
%}
```

Place that in the controller template for the action that owns it - for a profile field, the profile
update controller. The write commits immediately and syncs upstream to Salesforce.

**Person Accounts.** To write a field that conceptually belongs to the Contact, map it on **Account**
and use the `__pc` variant: `current_customer` with `favorite_color__pc`, not `favorite_color__c`.
Salesforce stores Person Account contact fields on the Account record through `__pc` fields, so a
write to `__c` silently misses.

Three ways a write fails silently, all invisible on the rendered page:

- No controller in context - the tag no-ops.
- The mapping is `read` rather than `read_write`, or does not exist - a warning goes to the debug
  console only.
- The value cannot be cast to the field's type - it is written as null.

Check the debug console when a write appears to do nothing. Never make a privileged administration
field, payment detail, credential, or authorization flag writable from Liquid.

## Indexed

Enable `s_c__Indexed__c` only for a field the storefront genuinely filters on. Changes are
asynchronous and can take time to become effective, especially when many mappings change.
Leave it off by default.

## Type casting

The mapping's `s_c__Data_Type__c` drives conversion in both directions.

| Salesforce type | Read into Liquid as | Written back as |
|---|---|---|
| `string`, `textarea`, `picklist`, `email`, `phone`, `url`, `id`, `reference` | string | string |
| `integer`, `long` | integer, or nil if unparseable | integer, or null if unparseable |
| `double`, `currency`, `percent` | float, or nil if unparseable | float, or null if unparseable |
| `boolean` | boolean; nil reads as `false` | boolean |
| `date` | date | `YYYY-MM-DD` |
| `datetime` | time | `YYYY-MM-DDTHH:MM:SSZ`, UTC |
| `time` | `HH:MM:SS` | `HH:MM:SS` |
| `multipicklist`, `combobox` | array, split on `;` | array joined with `;` |
| `address`, `location` | Address / Coordinate drop from the component fields | component fields, in order |

An unparseable number or date writes as **null**, not an error. Validate in the template first.

## Verify

1. Confirm the mapping saved, and that the running user can read the field in Salesforce.
2. Wait for the mapping and existing records to become available. Do not treat immediate
   invisibility as a failed write.
3. Test the read on a non-production store with a test record.
4. Test any filter you rely on.
5. If writable, exercise the real controller with a reversible value and confirm the value in
   Salesforce, not just on the page.

## Troubleshooting

| Symptom | Check |
|---|---|
| `data['field__c']` renders nothing | Mapping exists; field API name and `__c` exactly right; the mapping has had time to propagate; you are on a Drop, not a `{% query %}` record; the record actually has a value |
| Mapping refused on save | Object or field API name invalid, or it collides with an `s_c__`-prefixed field of the same name |
| Cannot repoint a mapping | Object and field API names are immutable. Delete and recreate. |
| `data.` filter returns zero rows | Lowercase after `data.`; exact match only, no operators; mapping exists |
| Filter rejected with `Invalid liquid query field` | Field is not on the object and has no mapping (custom objects), or the name is misspelled |
| `{% update %}` does nothing | Not inside a controller `before`/`after` block; mapping is `read`; value failed to cast; check the debug console |
| Value written but Salesforce unchanged | StoreConnect and Salesforce synchronize asynchronously; wait, re-read and never repeat a write merely because it is not visible yet. If it remains unhealthy, use the supported synchronization status and sanitized error reporting |
| Value drifts from Salesforce | The mapped field is a formula. Map a stored field. |
| A Person Account write has no effect | Map on `Account` and use the `__pc` field |
