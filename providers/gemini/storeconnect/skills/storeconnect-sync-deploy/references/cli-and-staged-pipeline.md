# storeconnect-cli and the supported staged workflow

Use `storeconnect-cli` (`sc`) or connected StoreConnect tools to prepare,
preview, submit, and verify supported store changes. This reference describes
the public operator workflow. It does not reproduce approval requests, internal
record transitions, cache fields, raw endpoints, or service implementation.

## Contents

- [Confirm the current command surface](#confirm-the-current-command-surface)
- [Connect safely](#connect-safely)
- [Work on an existing theme](#work-on-an-existing-theme)
- [Create a new theme](#create-a-new-theme)
- [Use connected tools for other supported records](#use-connected-tools-for-other-supported-records)
- [Approval and publication](#approval-and-publication)
- [Failure and rollback](#failure-and-rollback)
- [Review checklist](#review-checklist)

## Confirm the current command surface

CLI capabilities can vary by installed version and StoreConnect release. Begin
with the installed help and current StoreConnect documentation:

```bash
sc version
sc --help
sc theme --help
sc status
```

Common supported theme operations include listing, pulling, validating,
creating, pushing, previewing, submitting for publication, and deleting themes.
Use the exact syntax reported by the installed CLI. Do not infer a missing
command, construct a raw request, or replay an invocation copied from another
store or release.

## Connect safely

```bash
sc connect https://store.example.com --alias staging
```

Let the CLI collect authentication interactively. Never place a credential in a
command, chat, log, repository file, or project instruction, and never repeat
one in diagnostic output.

A private project repository used by a client or partner may retain project
configuration containing its store domains and identifiers. Sanitize those
values from public examples, issues, logs, and shared material. The credential
store is never safe to commit or quote.

Use a distinct alias for each environment. Before every write, run `sc status`
and a read-only theme listing, then show the operator the resolved domain,
environment, and theme. Pass the intended alias explicitly when the installed
CLI supports it.

## Work on an existing theme

Use the installed command help for exact arguments, then follow this sequence:

1. Confirm the target environment and theme.
2. Pull the current theme before editing and preserve it as the rollback
   baseline.
3. Make the smallest local change and run the available validation.
4. Review the complete local diff and remove debug, test, and placeholder
   content.
5. Push through the supported staged workflow.
6. Open the preview URL returned by the CLI or connected tool without modifying
   it.
7. Verify the affected pages, interactions, responsive layouts, accessibility,
   and sanitized browser diagnostics.
8. Obtain explicit human approval for the exact previewed change.
9. Submit it through the supported publish command or operator workflow.
10. Re-read the returned status, allow synchronization to complete, and verify
    the live storefront independently.

Do not assume a theme push carries every local configuration or asset. Confirm
the supported scope in the current CLI documentation and command output. Use
the appropriate connected StoreConnect tool or documented operator workflow for
anything outside that scope.

## Create a new theme

Theme creation and theme content are separate outcomes. Use this order:

1. Run the currently documented `sc theme new` command to stage creation.
2. Preview and obtain approval for the creation through the supported workflow.
3. Allow StoreConnect and Salesforce synchronization to complete.
4. Run `sc theme list` and confirm the new theme now exists.
5. Pull or initialize its local tree as the installed CLI directs.
6. Build, validate, and push its content.
7. Preview the content and obtain a separate approval before publication or
   activation.

Do not push content to a theme that has not yet appeared in the supported theme
listing, and do not treat approval of the empty theme record as approval of its
later content.

## Use connected tools for other supported records

Connected StoreConnect tools may support additional staged records. Inspect
each live tool schema immediately before use and keep related supported changes
in one reviewed change set where possible.

- Resolve the target with a read before staging an update.
- Use only fields exposed by the live schema.
- Preserve all generated or tool-managed fields.
- Keep customer data and credentials out of plans and diagnostics.
- Do not hard-code request shapes, approval data, authentication construction,
  or raw service URLs.
- Route unsupported records to the current documented Salesforce workflow
  rather than probing for hidden operations.

## Approval and publication

A successful push or submission is not proof that a change is live. Read the
status returned by the supported workflow and report whether it is staged,
awaiting review, approved, rejected, or live using only the public outcome it
provides.

Human approval is a hard boundary:

- preview the exact change first;
- explain the target, impact, validation, and rollback;
- obtain explicit approval in the current conversation or operator workflow;
- never fabricate, construct, or replay an approval request; and
- verify live behavior after the supported publication and cache-refresh steps.

If the installed CLI cannot complete the current supported approval workflow,
hand the verified preview to an authorized operator. Do not bypass the gate with
a direct request.

## Failure and rollback

StoreConnect and Salesforce synchronize asynchronously; wait, re-read and never
repeat a write merely because it is not visible yet.

On a validation, push, approval, synchronization, or publication failure:

1. Stop before dependent changes, cleanup, or another submission.
2. Re-read the current supported status and affected records.
3. Record sanitized completed and incomplete outcomes.
4. Fix the reported issue rather than probing alternative commands or request
   shapes.
5. Present the reviewed rollback or complete-forward options to the operator.
6. Obtain a new explicit decision before continuing.

Rollback means restoring the baseline through the same supported workflow,
running the current supported cache refresh, and verifying both the records and
the storefront. Never delete an active or referenced theme as an improvised
rollback.

## Review checklist

- Installed CLI version, store, environment, and theme confirmed.
- Current theme pulled and rollback baseline preserved before editing.
- Local validation and diff review complete.
- No credentials, customer data, raw endpoints, approval data, or placeholder
  content in the change or diagnostics.
- Preview URL came from the supported tool and was not reconstructed.
- Preview verified before explicit human approval.
- Publication used the supported workflow; no raw request or inferred command.
- StoreConnect and Salesforce synchronization completed before diagnosis or
  retry.
- Live storefront and unaffected theme/store scope verified.
