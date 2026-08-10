---
name: storeconnect-sync-deploy
description: Safely deploy changes to a StoreConnect store with connected StoreConnect tools, storeconnect-cli, or an explicitly approved Salesforce workflow. Covers target confirmation, rollback baselines, validation, preview, human approval, supported cache refresh, verification, and cleanup. Load before pushing or publishing any theme file, CSS, content block, translation, or store configuration, and before taking a store live.
---

<!-- Generated from shared/skills. Do not edit this copy. -->

# StoreConnect sync and deploy

Getting a change from a local tree or an agent session onto a StoreConnect store,
in the right order, with a preview a human approved and a verified result on the
live storefront.

Ordering is the substance of this skill. Most failed deployments are the right
content applied to the wrong target, without a rollback, or reported complete
before preview, approval, synchronization, and live verification finish.

## Non-negotiable rules

Read these before any write. They apply on every path.

1. **Never deploy or publish directly to production.** Land the change on a
   non-live theme or a draft, verify it in a preview, and only then apply or
   approve it for the live store.
2. **Confirm the target before any push.** Salesforce org and alias, environment
   (development / staging / production), Store name and domain, theme name and Id.
   Resolve each with a read operation and show the operator what you resolved. If
   you cannot state which environment you are about to write to, stop.
3. **Human approval is a hard gate before publishing to a live store.** Publishing
   is a separate action from pushing, requested separately and approved
   explicitly. Never infer approval from an earlier "go ahead" that covered the
   edit, and never fabricate or reconstruct approval.
4. **Never publish without verifying the preview first.** Open the preview, look
   at the affected pages, check the browser console. A publish with no preview
   verification is the failure this skill exists to prevent.
5. **Use the current supported cache-refresh workflow.** If an authorized
   operator cannot provide a documented procedure for the chosen deployment
   path, stop and hand off rather than reproducing a mechanism from an old
   example or another store.
6. **Never push test, debug, or placeholder content to production.** Strip
   `{% debug %}` and `{% timer %}` tags, console logging, commented-out
   experiments, and lorem or placeholder copy before a production push. Never
   point a production store at a test payment gateway, a staging endpoint, or a
   development asset host.
7. **Destructive cleanup needs an explicit, itemized confirmation.** Never
   auto-delete. Produce the list of records to remove, cap it, and stop if the
   count is larger than expected — a big delete list is nearly always a
   key-mapping bug, not intentional cleanup.
8. **Scope every read and write by Store and theme.** One store, one theme. After
   the deploy, confirm no other Store or theme changed.
9. **Never put a credential in a command line, a repository file, or chat**, and
   never interpolate Liquid, HTML, CSS, JSON, or translated copy into a shell
   command or a SOQL string — serialize it to a file. Never log customer data.
10. **Do not mix deployment paths in one change.** A staged draft plus a direct
    Salesforce write on the same records race each other, and the direct write is
    invisible to the approver reviewing the draft.

## Choose the path

Work down this list and stop at the first row that fits. Lower rows have a larger
blast radius and fewer safety rails.

| # | Condition | Path |
|---|---|---|
| 1 | Connected StoreConnect tools are present and cover the records you need to change | The supported staged and review-backed workflow. **Default.** |
| 2 | Theme `.liquid` templates, working from a local checkout, no connected StoreConnect tools | The currently documented `storeconnect-cli` (`sc`) theme workflow |
| 3 | The supported staged paths do not cover the required change | A current, documented Salesforce workflow supplied by an authorized operator. Treat it as immediate-write and require a reviewed plan, dry-run where available, preview procedure, and explicit approval |
| 4 | Apex, triggers, custom objects, fields, or other Salesforce metadata | `sf project deploy` with an appropriate test level. See `storeconnect-apex-integration` |

If rows 1 and 2 both fit, take row 1 so related supported changes can stay in one
reviewed change set.

If you are reaching for row 3, say out loud why rows 1 and 2 cannot carry the
change before you start. "It is faster" is not a reason.

## Which reference to read

| Situation | Read |
|---|---|
| Pushing theme files through `sc`, or driving the staged draft → preview → publish pipeline directly. Also read this before your **first** publish on any store: "publish" does not mean live, and knowing that changes what you tell the operator | [references/cli-and-staged-pipeline.md](references/cli-and-staged-pipeline.md) |
| Considering a direct Salesforce theme write because the staged workflows do not cover the change — approval boundary, rollback, live-schema planning, safe apply/delete behavior, supported cache refresh, and partial-failure handling | [references/theme-pull-push.md](references/theme-pull-push.md) |
| A domain cutover, or the first production publish of a new or replaced storefront. Work through it **before** the publish so the redirect and metadata gaps are known in advance, then confirm each item after | [references/go-live-marketing-checklist.md](references/go-live-marketing-checklist.md) |

## The deploy sequence

Every step is ordered. Do not reorder, and do not skip a step because the change
is small.

1. **Confirm the target and the environment** with the operator (rule 2).
2. **Pull the current state first.** `sc theme pull`, or query the records you are
   about to change. This is your rollback baseline and your evidence that you are
   not overwriting someone else's edit. Pulling after you push is worthless.
3. **Build and validate locally.** Compile assets, run the local checks, and read
   the diff against the baseline. Remove debug and placeholder content here
   (rule 6).
4. **Check the plan before writing.** Every content item under its live-schema limit; every
   key resolving to exactly one existing record or to none; the orphan list
   itemized and approved (rule 7). On the Salesforce CLI path, do a dry run and
   read it.
5. **Upsert by stable key.** Update the existing record for a key, create only
   when there is none. A duplicate logical key gives the storefront two competing
   definitions.
6. **Apply dependencies in the currently documented order.** Do not publish a
   manifest, template, or configuration that references content which has not
   been staged and verified.
7. **Run the supported cache refresh** after the complete change has landed. See
   [Supported cache refresh](#supported-cache-refresh).
8. **Wait for propagation.** StoreConnect and Salesforce synchronize
   asynchronously; wait, re-read and never repeat a write merely because it is
   not visible yet. See `storeconnect-platform` for the propagation rules.
9. **Preview and verify** (see [Verification](#verification)).
10. **Get explicit human approval, then publish** (rules 3 and 4) through the
    current supported workflow. Never construct or replay an approval request.
11. **Verify the live storefront** after the publish, not just the preview.
12. **Clean up orphans last**, with confirmation, once everything above succeeded.

## Supported cache refresh

After the complete reviewed change has landed, use the cache-refresh step
provided by the current supported deployment workflow or by the authorized
operator for that environment. Do not name, guess, or write an internal field,
construct a request, or copy a procedure from another store.

A refresh does not replace verification. Explicit fragment caches may follow
their configured expiry, preview and live behavior can differ, and changed
assets still need supported cache-safe naming. If the required refresh is
unavailable or fails, report the deployment as incomplete and stop.

## Verification

Never report a deploy complete on the strength of a success message.

1. Re-read the changed records, or pull the theme back, and compare **content**
   with what you intended. Record counts match while content is truncated.
2. Fetch the affected storefront paths on the target environment and confirm a
   specific, unique marker from the change is present — a class name, a string, a
   new element. Not "the page loads".
3. Check the browser console for missing-resource errors and 404s. A missing
   chunked part or a stale manifest entry shows up there and nowhere else.
4. If the page is unchanged, allow synchronization to complete, confirm the
   supported cache refresh, re-check the resolved template or asset, and verify
   that the write landed. Do not re-run the write merely because the result is
   not visible yet.
5. Exercise what the change touches: affected navigation, forms, add-to-cart,
   checkout, and asset loading.
6. Confirm no other Store or theme changed.
7. Report partial success, outstanding approvals, and anything you could not
   verify — explicitly, without customer data.

## When a push partially fails

1. **Stop.** Do not continue to dependent content, cache refresh, publish, or
   cleanup.
2. Report exactly which keys or records succeeded and which failed, with the error
   text. A batch write that continues past a bad record makes its per-record
   result flags the only record of what landed — read every one.
3. Leave the store in the last consistent state you can reach: previous manifest,
   no deletes.
4. Offer the operator a choice — retry the failed subset, or restore the reviewed
   baseline and use the supported refresh workflow. Do not decide silently.
5. On the staged path, a push that returned success can still fail asynchronously
   inside Salesforce seconds later. Re-read the content change after a pause
   before reporting completion.

Rollback on every path restores the baseline pulled in step 2 and then follows
the supported refresh and verification workflow. If you did not pull a baseline,
you have no rollback — which is why step 2 is not optional.

## Deploy-time cost

- **Batch supported writes.** Keep coherent changes together without widening
  the target or bypassing the reviewed workflow.
- **Do not re-push unchanged files.** Fingerprint each source file locally and
  push only what moved. A one-line snippet edit should be one record write, not a
  full theme sync.
- **Refresh once after the coherent change.** Do not run refresh steps after
  every individual record write.
- **Prefer one draft over several.** A theme change and the content that depends on
  it belong in one draft, one preview, and one approval.

## Related skills

- `storeconnect-platform` — connecting to a store, confirming scope, and choosing
  which skill to load. Read it first if the store is not yet connected.
- `storeconnect-theme-development` — what you are deploying: the override model,
  template keys, `theme-supplement.css`, style blocks, and block templates.
- `storeconnect-salesforce-data` — records not covered by the supported staged
  tooling.
- `storeconnect-apex-integration` — Apex and Salesforce metadata deployments.
- `storeconnect-theme-review` — read-only audit to run before a go-live publish.
