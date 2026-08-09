# Direct Salesforce theme changes

Use the staged `storeconnect-cli` workflow whenever it covers the change. A
direct Salesforce theme write is an exceptional fallback: it has no StoreConnect
draft or automatic approval gate and can affect the live storefront as soon as
synchronization completes.

This reference contains the operational safeguards for the exceptional fallback.

## Contents

- [Decision boundary](#decision-boundary)
- [Resolve and confirm the target](#resolve-and-confirm-the-target)
- [Create a rollback baseline](#create-a-rollback-baseline)
- [Build the change plan from live metadata](#build-the-change-plan-from-live-metadata)
- [Apply safely](#apply-safely)
- [Delete safely](#delete-safely)
- [Refresh, preview, and verify](#refresh-preview-and-verify)
- [Handle partial failure](#handle-partial-failure)

## Decision boundary

Use a direct Salesforce write only when all of these are true:

- the connected StoreConnect tools and `storeconnect-cli` do not support the
  required change;
- the user explicitly approves the immediate-write path after seeing its risk;
- the exact Store, environment, theme, records, and fields are resolved from the
  live org;
- the current object descriptions and StoreConnect documentation confirm the
  write surface;
- the authorized operator provides the current documented cache-refresh and
  direct-write preview procedure for that environment; and
- a tested rollback exists.

If current documentation does not describe the required record or cache-refresh
procedure, stop and hand off to an authorized StoreConnect operator. Do not
reconstruct it from old examples, another store, browser traffic, or observed
implementation behavior.

## Resolve and confirm the target

Resolve the org, Store, theme, and environment at run time and show them to the
operator before any write. Stop on zero or multiple matches.

A private client or partner project may retain its org alias, Store identifier,
theme identifier, and customer domain in access-restricted project
configuration. Sanitize those values from public examples, logs, issues, and
shared material. Credentials never belong in project files.

Confirm whether the theme is active. Work against a non-active theme until the
operator approves the reviewed live change.

## Create a rollback baseline

Read and save only the records and fields the change will touch. The baseline
must:

- identify the confirmed Store, environment, and theme;
- preserve the current content needed to reverse each planned update;
- remain access-restricted and outside public repositories;
- contain no credentials or unnecessary customer data; and
- be verified as readable before the first write.

Explain the rollback to the operator before applying the change. A baseline that
cannot be replayed safely is not a rollback.

## Build the change plan from live metadata

Describe the live objects and fields instead of relying on a copied field list.
For every planned change, record:

- the target record resolved by a stable, documented logical key;
- whether the operation updates an existing record or creates a new one;
- the intended field-level diff;
- current field sizes and validation constraints from the live schema;
- dependencies that must exist first;
- any superseded record that may become an orphan; and
- the expected storefront outcome.

Validate the complete plan before writing. Never truncate content to fit a field,
invent a split/chunk format, guess at a managed field, or reproduce a payload
from an old release. Use only a currently documented StoreConnect procedure.

## Apply safely

1. Re-read the target immediately before the write and compare it with the
   baseline.
2. Dry-run or validate locally where the supported tooling allows it.
3. Apply the smallest coherent batch.
4. Update by the confirmed logical key; create only when no current record
   exists.
5. Apply dependencies before anything that references them.
6. Stop on the first failure and preserve the exact completed/not-completed
   boundary.
7. Re-read every changed record and compare its actual content with the plan.

Do not continue to a publish, cleanup, or cache refresh after a partial write.
Do not repeat the same write because its storefront effect is not visible yet.

## Delete safely

Treat every delete as a separate, approval-gated cleanup:

1. Compute the exact orphan list from the reviewed source and current target.
2. Print the record labels and count without exposing customer content.
3. Obtain explicit approval for that list.
4. Enforce a conservative delete cap and stop when it is exceeded.
5. Delete only after the replacement content is present and verified.
6. Stop on the first failure and report what remains.

Never delete by a broad pattern, inferred prefix, or unmatched record count.

## Refresh, preview, and verify

After all writes have landed, use the supported cache-refresh step available to
the authorized operator. If it is unavailable or fails, report the deployment as
failed and stop; do not guess at internal fields or construct a replacement
request.

Do not use `sc theme preview` for a direct Salesforce write; that command
previews a draft created by the staged CLI workflow. Use only the current
direct-write preview procedure supplied by the authorized StoreConnect operator.
If no supported preview is available, stop rather than activating an unpreviewed
theme.

Then:

1. StoreConnect and Salesforce synchronize asynchronously; wait, re-read and
   never repeat a write merely because it is not visible yet.
2. Compare actual record content with the reviewed plan, not just record counts.
3. Exercise every changed storefront path and interaction.
4. Check sanitized browser diagnostics for missing resources and errors.
5. Confirm no other Store or theme changed.
6. Obtain explicit human approval before any live activation or publication.
7. Verify the live storefront independently after approval.

## Handle partial failure

On any failure:

- stop immediately;
- identify exactly which operations completed;
- re-read the current records;
- preserve the failed plan and sanitized diagnostics;
- present the operator with the reviewed rollback or complete-forward choices;
- obtain a new explicit decision; and
- resume from the confirmed current state, never from the original assumption.

Never silently roll forward, silently roll back, or replay the entire batch.
