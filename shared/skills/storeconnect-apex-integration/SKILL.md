---
name: storeconnect-apex-integration
description: Customer-owned Apex and other Salesforce-side patterns around a StoreConnect storefront — deciding whether a requirement needs Apex, using supported records and automation, safely generating storefront content ahead of render, and applying Apex deployment conventions. Load before writing, reviewing, or deploying any Apex, trigger, Flow-invoked class, or approved Salesforce callout for a store, and to choose between Apex, a Liquid controller, and a form.
---

# StoreConnect Apex integration

Custom server-side behavior around a StoreConnect storefront: when Apex is the right
tool, which shape to build, and the platform rules that make that Apex safe in a
customer's org. Apex here means customer-owned Apex deployed in Salesforce, not a
change to StoreConnect itself.

## Read this first: there is no synchronous path from a page render to Apex

Storefront Liquid and Salesforce Apex run at different points in the request and data
lifecycle.

- A Liquid template cannot call an Apex method. No tag, filter, or drop reaches Apex.
- `{% api %}` in a Liquid controller can reach any HTTPS endpoint, but authenticating it
  to Apex REST would mean putting a credential in a theme file or store variable. That is
  prohibited, so treat Apex REST as unreachable from Liquid.
- Apex therefore runs **after** a record reaches Salesforce, and its effects are not
  immediately visible to the shopper. StoreConnect and Salesforce synchronize
  asynchronously; wait, re-read and never repeat a write merely because it is not
  visible yet.

Consequence: anything the shopper must see in the same HTTP response has to be produced
in Liquid. Apex is for work that must happen inside Salesforce, or for content generated
ahead of the render.

## Escalation ladder — stop at the first row that fits

| Requirement | Build it as | Where |
|---|---|---|
| Fixed path redirect, alias, or rewrite | An `s_c__Route_Mapping__c` record. **No code.** | Pattern A0 |
| A dynamic URL space with no record per URL (`/account/<section>/<id>`) | A router in `pages/not_found.liquid`. **Liquid only, GET only.** | Pattern A |
| Request-time logic on a route the platform already serves — redirect, gate, capture an extra input, outbound call | A Liquid controller | `storeconnect-controllers` |
| Collect input from a shopper | `{% form %}` | `storeconnect-forms` |
| Persist an extra value onto a record the platform already models | `{% update %}` in that route's controller, plus a read-write Custom Data Mapping | `storeconnect-controllers`, `storeconnect-salesforce-data` |
| A shopper action must cause arbitrary DML in Salesforce | Custom form → `s_c__Form_Answer__c` → record-triggered Flow → invocable Apex | Pattern B |
| Automation after any StoreConnect record changes in Salesforce | Record-triggered Flow first; invocable Apex or a bulk-safe trigger only if Flow cannot express it | Pattern C, plus platform rules |
| Structure too expensive or impossible to build per render | Customer-owned Salesforce automation generates a bounded result, followed by the current supported storefront refresh workflow | Pattern C |
| Call an approved external service from Salesforce | Named Credential callout in Apex | Platform rules, callouts |

Pattern letters A0 through D are sections of
[references/integration-patterns.md](references/integration-patterns.md); "platform rules"
is [references/apex-platform-rules.md](references/apex-platform-rules.md). The routing table
below states which to open and when.

Three questions settle almost every case:

1. **Must the shopper see the result in this response?** Then it cannot be Apex. Use a
   Liquid controller.
2. **Is the write a field on a record the platform already models?** Then `{% update %}`
   with a Custom Data Mapping is less code, less risk, and no deploy.
3. **Does the logic have to run inside Salesforce** — because it touches objects the
   storefront cannot write, must survive a browser closing, or must apply to records
   created by Salesforce users too? Then it is Apex.

If the answer to all three is no, you do not need Apex. Say so and stop.

## Mandatory rules for every line of Apex you write here

These are not style preferences. Each one prevents a data-exposure or data-loss bug.

**The running user is not proof of the shopper's identity or authority.**
Authorization must be derived from platform-set relationships in the record graph,
never inferred from the automation context.

**Never trust a value that came from a browser.** A record id, store id, contact id,
price, quantity, role, or ownership claim inside a submitted payload is a request, not
proof. Resolve the actor from `s_c__Form_Submission__c.s_c__Contact_Id__c` and the store
from `s_c__Form_Submission__c.s_c__Store_Id__c` — the platform sets both server-side —
then confirm the target record belongs to that contact or its account **and** to that
store before any DML. A payload-supplied id that fails that check is dropped, not
processed.

**Scope every query and every write by store, and by authenticated contact or account
for anything customer-owned.** Most StoreConnect objects hold records for many stores in
one org. An unscoped `SELECT` is a cross-tenant leak.

**Declare an access level on every SOQL, SOSL, and DML statement.** Use
`WITH USER_MODE` on inline SOQL and `AccessLevel.USER_MODE` on `Database.*` calls.
Never rely on the API-version default: on API 66 and below database operations default
to system mode, on 67 and above to user mode, so an undeclared statement silently
changes behavior when the API version is bumped. `WITH SECURITY_ENFORCED` is removed on
API 67 and above — do not write it. Where user mode is genuinely wrong (the code is
reached by ordinary users who lack the permission and would hit
`INSUFFICIENT_ACCESS_OR_READONLY`), use system mode with a comment stating which
permission set already gates the path.

**Declare a sharing modifier on every class.** `with sharing` on entry points,
`inherited sharing` on services and helpers, `without sharing` only with a written
reason. Sharing is not a substitute for CRUD and field-level checks, and neither is a
substitute for the record-graph authorization above.

**Never build SOQL by concatenating request input.** Use bind variables. If the query
shape must be dynamic, use `Database.queryWithBinds(query, binds, AccessLevel.USER_MODE)`
and allowlist every object and field name you interpolate against a fixed set.
`String.escapeSingleQuotes` is a last resort for a value that cannot be bound, never a
substitute for binding, and it does nothing for an injected field or object name.

**Validate and normalize before DML.** Reject a payload whose type, length, or shape is
unexpected. Cap string length, collection size, and nesting depth. Reject unknown keys
instead of applying a whole input map onto an SObject.

**Never let one bad record stop unrelated work.** Use bulk-safe partial operations,
skip the offending row, record a sanitized reason, and continue.

**No credentials, anywhere.** No token, key, secret, signature, or Named Credential
content in Apex source, a custom label, custom metadata you commit, a store variable, a
Liquid template, a browser asset, or a repository file. Use a Named Credential, or
protected custom metadata populated in the org, and commit an obvious placeholder such
as `your_api_key_placeholder`.

**Never log a payload.** No raw request body, token, authorization header, customer
record content, or payment data in `System.debug`, a custom log object, an error message,
or a callout to an external service. Log a correlation id and a sanitized outcome. Debug
logs are readable by anyone with the right permission and are captured in support cases.

**No real identifiers in anything you write.** No production SFIDs, org ids, endpoints,
customer names, or record content in code, tests, comments, or examples. Use placeholders
and factory-created test data. Never `SeeAllData=true`.

## Which reference to open, and when

Both files live in `references/`. Open the one that matches the branch you are on; do not
read both by default.

| You are about to | Open |
|---|---|
| Add a redirect, alias, rewrite, or a dynamic URL space the storefront must serve | [references/integration-patterns.md](references/integration-patterns.md) — patterns A0 and A |
| Make a shopper action write arbitrary records in Salesforce, and you need the exact object and field API names, the Flow routing expression, and the invocable skeleton | [references/integration-patterns.md](references/integration-patterns.md) — pattern B |
| Intercept a form the platform already models, or capture an extra input | `storeconnect-controllers`. Pattern B2 in [references/integration-patterns.md](references/integration-patterns.md) is only there to confirm this needs no Apex |
| Generate content ahead of the render, or pre-bake a tree, index, or menu | [references/integration-patterns.md](references/integration-patterns.md) — pattern C. The deployment must finish with the current supported operator cache refresh |
| Deploy Apex, choose a test level, or diagnose a failed deploy | [references/integration-patterns.md](references/integration-patterns.md) — pattern D |
| Write or review the Apex itself: sharing semantics, FLS mechanics, governor limits, bulkification, callout ordering and timeouts, Queueable and chaining behavior, SOQL selectivity, test conventions | [references/apex-platform-rules.md](references/apex-platform-rules.md) |

## Deploy gate

1. Confirm the target org alias out loud and confirm it is not production. Start in a
   scratch org or sandbox.
2. Validate first: add `--dry-run` to the deploy, which compiles and runs the tests
   without changing the org.
3. **A production deploy requires explicit human approval in the current conversation.**
   Confirming an org alias is not approval. Never weaken a test, widen a permission set,
   or drop a test from the list to make a deploy pass.
4. Deploy the narrowest metadata set with `--test-level RunSpecifiedTests` and every test
   that covers it. Details and the coverage rule are in pattern D.
5. Keep a rollback plan for both metadata and any data the deploy touches.

## What the shopper sees when Apex fails

Design for this before you write the class, because the default is silence.

| Failure | Shopper sees | Do this instead |
|---|---|---|
| Invocable throws on a malformed payload | The form submitted successfully, but the requested work does not complete | Skip and log per row; write a status the storefront can read |
| Synchronization is slower than the shopper's next page view | Their submission appears to have vanished | Optimistic display in the page, or a status field the next render reads |
| Pre-baked template written without a supported cache refresh | Old content remains visible | Stop and use the current authorized operator procedure; do not reproduce it with a guessed field write |
| Callout timeout inside a synchronous trigger path | A save error in Salesforce and delayed downstream visibility | Never call out on the synchronous path; queue it |
| `{% update %}` or another action tag placed in a page or snippet instead of a controller template | Nothing at all, silently | Action tags only run inside `controllers/*` templates |

## Verify after any change

- Re-read the record you expected to be written, scoped by store, and confirm the field
  values — do not infer success from a deploy result or an absent error.
- For a generated template, load the storefront path that renders it and confirm the new
  content is served, not just that the record changed.
- Confirm the automation ran as intended in bulk, not only for a single record.
- Check the available synchronization health and error reporting after the first live
  submission.
- Remove any temporary debug statement you added.

## Related skills

`storeconnect-controllers` for request-time server-side logic without Apex, and for
intercepting a platform form. `storeconnect-forms` for the Liquid side of the custom form
that pattern B depends on, including the exact `answers[...]` field name. `storeconnect-salesforce-data`
for object API names, store scoping, and Custom Data Mappings that expose a field to
Liquid. `storeconnect-sync-deploy` for pushing theme and content changes and for the
current supported storefront refresh workflow. `storeconnect-debug-performance` for `{% cache %}` key
design and for measuring a slow template before deciding to pre-bake it.
