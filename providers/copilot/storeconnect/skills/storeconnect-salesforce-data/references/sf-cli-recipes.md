# Salesforce CLI recipes

Use `sf` only when a connected StoreConnect tool, `storeconnect-cli`, and a connected Salesforce data
tool all fail to cover the task, and the operator has approved the direct path. `sf` runs with the
authenticated user's full access and has no staging or review step.

Every command below takes `--target-org` (`-o`) explicitly. **Never rely on the default target org
for a write** - a configured default is how a change lands in the wrong org. Replace every
`<PLACEHOLDER>` with a value you resolved from the confirmed org. Do not paste real org aliases,
usernames, record IDs, or tokens into shared files or logs.

## Contents

- [Command names changed](#command-names-changed)
- [Confirm the org](#confirm-the-org)
- [Inspect the schema before you trust a field](#inspect-the-schema-before-you-trust-a-field)
- [Resolve the Store, then scope everything to it](#resolve-the-store-then-scope-everything-to-it)
- [Query performance and limits](#query-performance-and-limits)
- [Single-record writes](#single-record-writes)
- [Bulk operations](#bulk-operations)
- [What must not go through a shell command](#what-must-not-go-through-a-shell-command)
- [Metadata deploys](#metadata-deploys)
- [Deletes](#deletes)
- [Output hygiene](#output-hygiene)

## Command names changed

The `sf` CLI reordered its data subcommands. The current form is verb-then-noun:

| Current | Legacy alias still accepted |
|---|---|
| `sf data create record` | `sf data record create` |
| `sf data update record` | `sf data record update` |
| `sf data delete record` | `sf data record delete` |
| `sf data get record` | `sf data record get` |

Older cheatsheets and generated snippets commonly have the old order. Prefer the current form. When
any command errors on a flag, run `sf <topic> --help` and read the live flag list rather than
guessing - flags have been renamed across versions.

`--values` pairs are separated by **spaces**, not commas.

## Confirm the org

```bash
sf org list
sf org display -o <ORG_ALIAS>
```

Read `sf org display` output aloud to the operator - the username, instance URL, and whether it is a
production org or a sandbox/scratch org - and get confirmation before any write. Stop on any
authentication error rather than retrying against a different org.

## Inspect the schema before you trust a field

```bash
sf sobject describe -s s_c__Page__c -o <ORG_ALIAS> --json
```

Read the JSON rather than assuming. For each field you intend to write, check:

- `createable` and `updateable` - false means the running user cannot write it, whatever the object
  metadata says. This is how you find out that `s_c__sC_Id__c` is not available to you before you
  build an upsert around it.
- `nillable` - false means it is required.
- `calculated` - true means it is a formula and never writable.
- `autoNumber` - true on `Name` means supplying it fails.
- `picklistValues` with `restrictedPicklist` - an unlisted value is rejected.

If a field is absent from the describe output, the org is on a package version that does not have it,
or the running user cannot see it. Do not proceed on the assumption it exists.

## Resolve the Store, then scope everything to it

```bash
sf data query -o <ORG_ALIAS> --json \
  -q "SELECT Id, Name, s_c__Path__c, s_c__Domain__c, s_c__Test_Mode__c FROM s_c__Store__c ORDER BY Name"
```

Confirm which Store you are targeting, and note `s_c__Test_Mode__c` - it tells you whether this is a
live storefront. Then scope every subsequent query:

```bash
sf data query -o <ORG_ALIAS> --json \
  -q "SELECT Id, Name, s_c__Title__c, s_c__Path__c, s_c__Visible__c
      FROM s_c__Page__c
      WHERE s_c__Store_Id__c = '<STORE_ID>'
      ORDER BY Name"
```

For an object with no Store field, scope through the relationship instead:

```bash
# Content Blocks are org-wide. Reach the store's blocks through the page junction.
sf data query -o <ORG_ALIAS> --json \
  -q "SELECT Id, s_c__Content_Block_Id__c, s_c__Page_Id__c, s_c__Usage_Type__c, s_c__Position__c
      FROM s_c__Content_Blocks_Pages__c
      WHERE s_c__Page_Id__r.s_c__Store_Id__c = '<STORE_ID>'"

# Product Category Store_Id__c is a formula off the taxonomy, so it is filterable.
sf data query -o <ORG_ALIAS> --json \
  -q "SELECT Id, Name, s_c__Path__c FROM s_c__Product_Category__c
      WHERE s_c__Store_Id__c = '<STORE_ID>' AND s_c__Hide__c = false"
```

Before a single-record write, require exactly one match. Zero matches means your filter is wrong; two
or more means you are about to write to the wrong record.

## Query performance and limits

- **Filter on an indexed field.** Salesforce indexes `Id`, `Name`, `CreatedDate`, `SystemModstamp`,
  `OwnerId`, `RecordTypeId`, every lookup and master-detail foreign key, and any field marked
  External ID or Unique. In practice that means `s_c__Store_Id__c`, `s_c__Menu_Id__c`,
  `s_c__Taxonomy_Id__c`, `s_c__Theme_Id__c`, `s_c__sC_Id__c`, and the `s_c__Unique_*` keys are
  selective. Filtering a large object on an unindexed text or checkbox field alone scans it.
- Never `SELECT` a field you are not going to use. On wide objects (`Product2` has 79 fields,
  `s_c__Store__c` 73) that is the difference between a fast query and a slow one.
- Always name columns. `SELECT FIELDS(ALL)` is capped at 200 rows and pulls everything.
- Add `LIMIT` while exploring. Remove it only once the filter is proven selective.
- Never filter with a leading wildcard (`LIKE '%term'`) - it cannot use an index.
- Results page at 2,000 records. Above roughly 10,000 records, use `sf data export bulk` instead: it
  runs on Bulk API 2.0 with higher limits.

```bash
sf data export bulk -o <ORG_ALIAS> -r csv --output-file <LOCAL_PATH>.csv -w 10 \
  -q "SELECT Id, Name FROM s_c__Page__c WHERE s_c__Store_Id__c = '<STORE_ID>'"
```

- Every command consumes the org's daily API request allocation. Batch reads into one scoped query
  rather than looping one query per record.
- Long-running queries time out at the platform limit. If a query times out, make the filter more
  selective; do not retry it unchanged.

## Single-record writes

Read the current value, show the operator the before and after, get approval, then write.

```bash
# 1. Read
sf data get record -o <ORG_ALIAS> -s s_c__Page__c -i <RECORD_ID> --json

# 2. Write one field, after approval
sf data update record -o <ORG_ALIAS> -s s_c__Page__c -i <RECORD_ID> \
  -v "s_c__Visible__c=true" --json

# 3. Re-read to confirm the write landed in Salesforce
sf data get record -o <ORG_ALIAS> -s s_c__Page__c -i <RECORD_ID> --json
```

Create with the parent IDs you resolved, never with an ID you assumed:

```bash
sf data create record -o <ORG_ALIAS> -s s_c__Page__c \
  -v "Name=Shipping Information s_c__Store_Id__c=<STORE_ID>" --json
```

Then attach content by junction, after both sides exist:

```bash
sf data create record -o <ORG_ALIAS> -s s_c__Content_Blocks_Pages__c \
  -v "s_c__Content_Block_Id__c=<BLOCK_ID> s_c__Page_Id__c=<PAGE_ID> s_c__Usage_Type__c=content s_c__Position__c=1" --json
```

Always check the structured `--json` result. A non-zero `status` or a populated `message` means the
write did not happen; do not move on assuming it did.

After the write: re-query Salesforce, wait for propagation (see the SKILL.md propagation table), then
check the storefront. Salesforce showing the value while the storefront does not is propagation or
caching, not failure. Do not write again.

## Bulk operations

`sf data upsert bulk` is the right tool for a reviewed, idempotent import against an external ID:

```bash
sf data upsert bulk -o <ORG_ALIAS> -s <SOBJECT> -i <EXTERNAL_ID_FIELD> \
  -f <LOCAL_CSV_PATH> --line-ending LF -w 10
```

Before using `s_c__sC_Id__c` as `-i`, confirm from the describe output that it is
`createable` and `updateable` for the running user. If it is unavailable, do a
query-then-update keyed on the object's supported unique field instead.

`sf data import bulk` inserts without an external ID and is therefore **not** idempotent - a rerun
duplicates every row. Prefer upsert.

For either, dry-run against a scratch org or sandbox first, and keep the CSV out of version control.

## What must not go through a shell command

Do not pass Liquid, HTML, CSS, Markdown, JSON, translations, credentials, or any user-controlled
value as an inline CLI argument. Quoting, `$`, backticks, and newlines break in ways that silently
corrupt the stored value or execute in your shell.

For long content and multi-field updates use tooling that serializes a structured request:

- Theme templates, assets, and CSS: a connected StoreConnect tool, or `storeconnect-cli`. See
  `storeconnect-sync-deploy`.
- Body Markdown, translations, and content blocks: a connected StoreConnect tool with staged review.
- Anything else structured: a file-based path (`sf data upsert bulk -f`, `sf apex run --file`), never
  an inline string.

If none of those is available, stop and say so rather than interpolating content into a shell command.

## Metadata deploys

```bash
sf project deploy start -o <ORG_ALIAS> --source-dir force-app --dry-run --wait 10
sf project deploy start -o <ORG_ALIAS> --source-dir force-app \
  --test-level RunSpecifiedTests --tests <TEST_CLASS> --wait 30
```

Always `--dry-run` (or `--check-only`) first and show the operator the plan. Use
`sf project deploy preview` to see what would change. Metadata deploy detail belongs to
`storeconnect-apex-integration`.

## Deletes

Deleting is the highest-risk thing in this skill. Work through this in order.

1. **Never infer a delete from a local file being absent.** A record missing from a theme checkout is
   not evidence it is unused.
2. Produce a scoped report first: record IDs, names, owning Store, every relationship pointing at
   them, and what breaks on the storefront. Show it to the operator.
3. Check the relationship type before you run anything. Read
   [salesforce-objects.md](salesforce-objects.md) § Delete behavior. Some parents destroy their
   children (deleting a `s_c__Theme__c` destroys every template, asset, and variable under it), some
   deletes are blocked while a child exists, some leave a null-pointing orphan.
4. Query for dependents and delete children before parents:

```bash
sf data query -o <ORG_ALIAS> --json \
  -q "SELECT Id FROM s_c__Content_Blocks_Pages__c WHERE s_c__Content_Block_Id__c = '<BLOCK_ID>'"
sf data query -o <ORG_ALIAS> --json \
  -q "SELECT Id, Name FROM s_c__Menu_Item__c WHERE s_c__Page_Id__c = '<PAGE_ID>'"
```

5. Get explicit approval for the exact record set. Then delete one record at a time:

```bash
sf data delete record -o <ORG_ALIAS> -s <SOBJECT> -i <RECORD_ID> --json
```

6. **Do not use `sf data delete bulk`** on production content, catalog, customer, or order data, and
   never use `--hard-delete` (it bypasses the recycle bin, so there is no recovery).
7. Re-query afterwards for orphaned junction rows with a null lookup, and verify the affected
   storefront pages still render.

## Output hygiene

- Never commit a Salesforce data export, a `--json` dump, or a CLI auth file.
- Redact customer data, org IDs, Store IDs, domains, and record IDs from anything shared, unless the
  recipient is an access-restricted operational handoff that needs them.
- Never echo access tokens, session IDs, refresh tokens, payment details, PINs, or credentials -
  including from `sf org display --verbose`, which prints an auth URL.
- Keep exported CSVs outside the repository and delete them when the operation is done.
