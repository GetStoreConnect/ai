# StoreConnect integration patterns

Six shapes for server-side behavior around a StoreConnect storefront, in escalation
order. Every example is generic: `<STORE_ID>`, `<THEME_ID>`, and `<prefix>` are
placeholders, and every query and write demonstrates the access-mode and authorization
rules from `SKILL.md`. Copy the shape, not the placeholders.

## Contents

- [A0. Route Mapping records (no code)](#a0-route-mapping-records-no-code)
- [A. Path-based routing through pages/not_found.liquid](#a-path-based-routing-through-pagesnot_foundliquid)
- [B. Shopper-triggered writes through Form_Answer](#b-shopper-triggered-writes-through-form_answer)
- [B2. Intercepting a platform form (not Apex)](#b2-intercepting-a-platform-form-not-apex)
- [C. Generated storefront content](#c-generated-storefront-content)
- [D. Apex deploy conventions](#d-apex-deploy-conventions)

## A0. Route Mapping records (no code)

`s_c__Route_Mapping__c` handles any fixed `path → target` rule with a record, no code and
no deploy.

| Field | Type | Notes |
|---|---|---|
| `s_c__From__c` | Text(255) | The incoming path, leading slash included |
| `s_c__To__c` | Text(255) | The destination path or URL |
| `s_c__Status_Code__c` | Picklist, required | `301`, `302`, or `rewrite` (serves the destination's content at the original URL, no redirect) |
| `s_c__Store_Id__c` | Lookup to `s_c__Store__c` | Leave blank to apply to every store on the org |
| `s_c__sObject_Type__c` | Text(255) | Optional provenance, an sObject API name |

How the platform applies it, and the two consequences that matter:

- A mapping is only consulted **after the request has already 404'd**, and only for `GET`.
  Paths under `/assets/` and `/api/` are excluded, and a mapping whose `From__c` equals its
  `To__c` is ignored.
- Because the check happens on the 404, **a matching Route Mapping wins over the
  `not_found.liquid` router in pattern A.** If you build a router and a stale mapping owns
  the same path, your router never runs.

The platform also creates a `301` mapping automatically whenever a path or slug changes,
on five object types:

| Object | Field watched | Mapping path shape |
|---|---|---|
| `s_c__Article__c` | `s_c__Path__c` | `/articles/<path>` |
| `s_c__Article_Category__c` | `s_c__Path__c` | `/articles/<path>` |
| `Product2` | `s_c__Slug__c` | `/products/<slug>` |
| `s_c__Page__c` | `s_c__Path__c` | `/<path>` |
| `s_c__Product_Category__c` | `s_c__Path__c` | `/<path>` |

**Symptom to recognize.** Saving a Page, Article, Category, or Product fails with
`A Route Mapping already exists for Path "<value>". Enter a unique value to avoid conflict.`
(or `... for Slug "<value>" ...`), sometimes naming a store. There is no conflicting page
or product: an old auto-created Route Mapping still owns that path. Find the
`s_c__Route_Mapping__c` whose `s_c__From__c` matches and delete it. The check only fires
when the path field actually changes, and only against mappings with no store or the same
store as the record.

## A. Path-based routing through pages/not_found.liquid

### When this is the right pattern

You need a URL space with no record per URL — `/account/<section>`, `/account/<section>/<id>`,
`/case/<id>`. If every URL could be a Page record, or every rule is a fixed path, use
pattern A0 or real records instead.

### How it works

The platform registers routes for known slugs (Pages, articles, categories, products,
built-ins like `/account` and `/search`). Anything matching nothing falls through to a
single catch-all that renders `pages/not_found.liquid`, with the requested path available
in `current_request.path` and the error text in `error`. That makes the 404 template a
programmable router: recognize your prefixes, dispatch to snippets, and fall through to a
real 404 for everything else. The URL bar is unchanged and no redirect happens.

```liquid
{%- comment -%} pages/not_found.liquid — dispatch, then a real 404 {%- endcomment -%}
{%- comment -%} local_path strips the store path prefix, so this also works on a
    path-mounted store where current_request.path is "/au/account/orders" {%- endcomment -%}
{%- assign req_path = current_request.local_path | default: '' -%}

{%- if req_path contains '/account/' -%}
  {% render "account/router" %}
{%- else -%}
  <div class="sc-container">
    <h1>{{ 'sc.errors.not_found' | t }}</h1>
    {% render "shared/search_form" %}
  </div>
{%- endif -%}
```

The router snippet parses the path, computes its own gates, and dispatches:

```liquid
{%- comment -%} snippets/account/router.liquid {%- endcomment -%}
{%- if current_customer == blank -%}
  {% render "account/not_authorized" %}
{%- else -%}
  {%- comment -%} Gates must be computed here. {% render %} isolates scope, so an assign
      made inside a shared "gates" snippet does not bubble back to this one. {%- endcomment -%}
  {%- assign can_admin = false -%}
  {%- if current_customer.data['Admin_Enabled__c'] == true -%}
    {%- assign can_admin = true -%}
  {%- endif -%}

  {%- assign req_path = current_request.local_path | default: '' -%}
  {%- assign section = '' -%}
  {%- assign identifier = '' -%}
  {%- if req_path contains '/account/' -%}
    {%- assign tail = req_path | split: '/account/' | last | split: '/' -%}
    {%- assign section = tail[0] | default: '' -%}
    {%- assign identifier = tail[1] | default: '' -%}
  {%- endif -%}
  {%- comment -%} Query-param fallback keeps this router usable from the real
      /account page template too. Path wins. {%- endcomment -%}
  {%- if section == '' -%}
    {%- assign section = current_request.params.section | default: 'home' -%}
  {%- endif -%}
  {%- assign section = section | downcase | replace: '_', '-' -%}

  {%- case section -%}
    {%- when 'team' -%}
      {%- comment -%} Gate in the router, never only in the sidebar. Direct URL
          entry bypasses navigation entirely. {%- endcomment -%}
      {%- if can_admin -%}
        {% render "account/team", identifier: identifier %}
      {%- else -%}
        {% render "account/not_authorized", reason: 'admin' %}
      {%- endif -%}
    {%- when 'records' -%}
      {% render "account/records", identifier: identifier %}
    {%- else -%}
      {% render "account/home" %}
  {%- endcase -%}
{%- endif -%}
```

### Hard constraints

- **GET only.** The catch-all is registered for `GET`. A `POST` to a virtual path is a
  plain 404 and your router never sees it.
- **Every action tag is a silent no-op here.** `{% update %}`, `{% redirect %}`,
  `{% respond %}`, `{% params %}`, `{% variables %}`, and `{% action %}` all check for a
  controller in the render context and return without doing anything when there isn't one.
  Only `controllers/*` templates have one. Nothing is logged. If you need a write from a
  virtual route, use pattern B.
- **A `{% form %}` still works.** Forms post to their own registered endpoints, not to the
  page's path, so a `custom-form` inside a router-served snippet submits normally and
  `redirect_back` returns the shopper to the virtual URL.
- **The response status is 404.** These pages are correct for shoppers and wrong for
  search engines. If the URL must be indexable, give it a real record or a Route Mapping
  `rewrite`, not a router entry.
- **A `404-not-found` Page record disables the router.** Check for that record first; if it
  exists, either keep the page-based behavior or migrate its content into the router with
  explicit approval.
- **A real record beats the router.** A path with a matching Page record renders
  `pages/page.liquid`. The router only sees paths that match no record at all.
- **A new section is three edits**, not one: the router `case`, the sidebar or nav, and any
  hub or landing cards. Miss the second and third and the route is unreachable except by
  typing the URL; miss the first and a visible link 404s.
- **Identifiers in the path are untrusted.** Scope every lookup by `current_customer` and
  `current_store`. An id in a URL is not evidence the visitor may see that record.

## B. Shopper-triggered writes through Form_Answer

### When this is the right pattern

The shopper action must cause DML in Salesforce that the storefront cannot perform:
creating records on objects with no Custom Data Mapping, records for other objects, or
work that must run even if the browser closes. If you only need to store a field on a
record the platform already models, use `{% update %}` in that route's Liquid controller
instead — no Apex, no deploy.

Before building this, check whether a native custom form already covers it. Forms support
three record types (`Generic` anywhere, `Checkout` once per checkout with an Order lookup,
`Product` per cart item with an OrderItem lookup), hidden questions, Liquid-computed
default values, and per-question validation. This pattern earns its complexity only when
Apex must process the result.

### Per-question validation runs before the record exists

`s_c__Form_Question__c.s_c__Validation_Rules__c` holds one rule per line as
`message: liquid condition`, with the submitted value in scope as `value`. The condition
is evaluated on submit and the message is raised when it is **false**:

```
Enter a valid reference: value matches '^[A-Z]{2}-\d{4}$'
Keep it under 500 characters: value.size < 500
```

This is the cheapest place to reject bad input, and it happens before any record reaches
Salesforce. It does not remove the Apex-side validation requirement — treat it as the
first of two layers.

### The four layers

1. A supported `{% form 'custom-form' %}` collects one answer per configured
   question.
2. StoreConnect creates the corresponding Submission and Answer records.
3. An after-save record-triggered Flow on `s_c__Form_Answer__c` routes the work by
   the Form identifier.
4. The invocable parses and validates the answer, authorizes from platform-set
   Submission relationships, and performs bulk-safe DML.

### The objects

| Object | Field | Type | Notes |
|---|---|---|---|
| `s_c__Form__c` | `s_c__Identifier__c` | Text(255) | Your routing key. **Not unique** — the platform does not enforce it, so pick a namespaced value and check for collisions yourself |
| | `s_c__Record_Type_Name__c` | Text(50) | Package-managed. Record types are `Generic`, `Checkout`, `Product` |
| `s_c__Form_Question__c` | `s_c__Form_Id__c` | Lookup to `s_c__Form__c` | |
| | `s_c__Hidden__c` | Checkbox | A hidden question still submits |
| | `s_c__Data_Type__c`, `s_c__Required__c`, `s_c__Validation_Rules__c` | | |
| `s_c__Form_Submission__c` | `s_c__Store_Id__c` | Lookup to `s_c__Store__c` | **Server-set. Your store scope.** |
| | `s_c__Contact_Id__c` | Lookup to `Contact` | **Server-set from the session. Your actor.** Null for a guest submission |
| | `s_c__Form_Id__c` | Lookup to `s_c__Form__c` | |
| | `s_c__Order_Id__c` / `s_c__Order_Item_Id__c` | Lookup | Populated for Checkout / Product forms |
| `s_c__Form_Answer__c` | `s_c__Answer__c` | LongTextArea(131072) | The submitted value. This is the payload ceiling |
| | `s_c__Form_Question_Id__c` | Lookup, delete Restrict | Resolves immediately — Questions already exist |
| | `s_c__Form_Submission_Id__c` | Lookup, delete Restrict | May not be resolved on the first pass. See below |
| | `s_c__Question_Content__c` | LongTextArea(131072) | The question HTML, denormalized onto the answer |
| | `s_c__URL__c` | Url | Set when the question accepted a file upload |
| | `s_c__Data_Type__c`, `s_c__Stale__c` | | `Stale__c` marks an answer superseded by an edit |

### Liquid side

The tag and field naming are owned by `storeconnect-forms`; the short version is
`{% form 'custom-form', identifier: <Form SFID> %}` with exactly one input per question,
named `answers[<question SFID>][answer]`. Nothing else is accepted. The platform only
accepts questions belonging to Forms on the current store, so cross-store answer injection
is not possible through this route.

One question carrying a JSON string is a legitimate variant when Apex must accept a
schema-free payload: the storefront serializes several values into one hidden long-text
answer, and new payload keys need no new Question records. It costs you the platform's
per-question validation, so validate harder in Apex, and the whole JSON string must fit
inside 131,072 characters.

### Route with a Flow, not your own trigger

Use a record-triggered Flow on `s_c__Form_Answer__c`, after save, with a Decision on
`$Record.s_c__Form_Question_Id__r.s_c__Form_Id__r.s_c__Identifier__c`, calling one
invocable per form with `$Record.Id`. One Flow serves every form.

- Prefer the supported after-save Flow entry point over adding a custom trigger to the
  StoreConnect object.
- Route on the **Answer**, not the Submission, so the automation receives each submitted
  value directly.
- Related records may become available at different times. Do not assume
  `s_c__Form_Submission_Id__c` is populated on the first pass. Handle null without error,
  run the Flow after save on create **and** update, and use an idempotency guard so the work
  completes once.

### Invocable skeleton

```apex
/**
 * Processes submissions for form identifier <prefix>-record-note.
 * Payload: the answer text of the "Note" question.
 * Authorization is derived entirely from the Submission, never from the payload.
 */
public with sharing class RecordNoteFormInvocable {
  private static final String FORM_IDENTIFIER = '<prefix>-record-note';
  private static final Integer MAX_NOTE_LENGTH = 4000;

  public class Request {
    // This parameter class declares no constructor, so Apex auto-generates the no-arg
    // constructor the invocable framework requires on API 66 and above. Adding any
    // explicit constructor stops that, and you must then declare `public Request() {}`
    // yourself or Flow fails to instantiate it at run time.
    @InvocableVariable(required=true label='Form Answer Id')
    public Id formAnswerId;
  }

  // void return: a List<Result> must contain exactly one entry per Request or Flow
  // throws FLOW_ELEMENT_ERROR about mismatched interview counts.
  @InvocableMethod(label='Process record note answer')
  public static void process(List<Request> requests) {
    if (requests == null || requests.isEmpty()) return;

    Set<Id> answerIds = new Set<Id>();
    for (Request r : requests) {
      if (r != null && r.formAnswerId != null) answerIds.add(r.formAnswerId);
    }
    if (answerIds.isEmpty()) return;

    // One query for the batch. USER_MODE enforces object and field access on read.
    List<s_c__Form_Answer__c> answers = [
      SELECT Id,
             s_c__Answer__c,
             s_c__Form_Question_Id__r.s_c__Form_Id__r.s_c__Identifier__c,
             s_c__Form_Submission_Id__c,
             s_c__Form_Submission_Id__r.s_c__Store_Id__c,
             s_c__Form_Submission_Id__r.s_c__Contact_Id__c
      FROM s_c__Form_Answer__c
      WHERE Id IN :answerIds
      WITH USER_MODE
    ];

    Map<Id, s_c__Form_Answer__c> accepted = new Map<Id, s_c__Form_Answer__c>();
    Set<Id> contactIds = new Set<Id>();

    for (s_c__Form_Answer__c a : answers) {
      // The Flow already routed by identifier. Re-check anyway: the invocable is
      // callable from any Flow, and a mis-wired Decision must not mean arbitrary DML.
      String identifier = a.s_c__Form_Question_Id__r?.s_c__Form_Id__r?.s_c__Identifier__c;
      if (identifier != FORM_IDENTIFIER) continue;

      // Submission not synced yet: skip silently, the update pass will catch it.
      if (a.s_c__Form_Submission_Id__c == null) continue;

      Id contactId = a.s_c__Form_Submission_Id__r.s_c__Contact_Id__c;
      Id storeId = a.s_c__Form_Submission_Id__r.s_c__Store_Id__c;
      // No authenticated contact or no store means no authorization can be derived.
      if (contactId == null || storeId == null) continue;

      String note = a.s_c__Answer__c == null ? null : a.s_c__Answer__c.trim();
      if (String.isBlank(note) || note.length() > MAX_NOTE_LENGTH) continue;

      accepted.put(a.Id, a);
      contactIds.add(contactId);
    }
    if (accepted.isEmpty()) return;

    // Resolve the actors in one query, still in user mode.
    Map<Id, Contact> contactsById = new Map<Id, Contact>([
      SELECT Id, AccountId FROM Contact WHERE Id IN :contactIds WITH USER_MODE
    ]);

    List<Task> toInsert = new List<Task>();
    for (s_c__Form_Answer__c a : accepted.values()) {
      Contact actor = contactsById.get(a.s_c__Form_Submission_Id__r.s_c__Contact_Id__c);
      if (actor == null || actor.AccountId == null) continue;

      // Only ever write against a parent derived from the Submission. If this class
      // needed a target record id from the payload, it would have to load that record
      // and assert its store and its account match the Submission's before writing.
      toInsert.add(new Task(
        WhoId = actor.Id,
        WhatId = actor.AccountId,
        Subject = 'Storefront note',
        Description = a.s_c__Answer__c.trim().left(MAX_NOTE_LENGTH),
        Status = 'Completed'
      ));
    }
    if (toInsert.isEmpty()) return;

    // Partial save so one rejected row cannot stop unrelated work.
    List<Database.SaveResult> results =
      Database.insert(toInsert, false, AccessLevel.USER_MODE);
    for (Database.SaveResult sr : results) {
      if (!sr.isSuccess()) {
        // Status code only. Never log the payload, the record body, or the ids.
        System.debug(LoggingLevel.WARN,
          'RecordNoteForm insert failed: ' + sr.getErrors()[0].getStatusCode());
      }
    }
  }
}
```

### Conventions this skeleton encodes

- **Skip and log per row.** One rejected record must not stop unrelated work.
- **Bulk throughout.** Collect ids, one query per related object, one DML per SObject type.
  Storefront-originated records can arrive in batches, so assume many rows.
- **Authorization from the Submission only.** `s_c__Contact_Id__c` and `s_c__Store_Id__c`
  are set server-side. Anything in the answer text is a request from a browser.
- **Length and blank caps before DML**, and `left()` on the way in.
- **`JSON.deserializeUntyped` with tolerant accessors** if the answer is a JSON payload,
  so a shape change does not throw. Reject unknown keys instead of applying the map to an
  SObject.
- **Do not call out on this synchronous save path.** Queue the work — see
  [apex-platform-rules.md](apex-platform-rules.md).

### File uploads

A question that accepts a file stores the resulting URL in `s_c__Form_Answer__c.s_c__URL__c`
and creates no `s_c__Media__c` record. **That URL is reachable by anyone who has it** — do
not route anything confidential through it, and do not put it in an email or a log. To get
the file into Salesforce, fetch it from an asynchronous, callout-enabled context and create
a `ContentVersion` with `FirstPublishLocationId` set to the target record, which links it
automatically. Validate content type and size before you accept it, and keep per-file
failures non-fatal.

### The shopper-visible delay

StoreConnect and Salesforce synchronize asynchronously; wait, re-read and never repeat a
write merely because it is not visible yet. Communicate that the result is pending until
the supported synchronization and re-read confirm it. Do not tell the shopper the work is
done before it is.

## B2. Intercepting a platform form (not Apex)

Extra `<input>` elements added inside any `{% form %}` are ignored by the platform handler
but readable through `current_request.params` in that route's
`controllers/<controller>/<action>` template, where `{% update %}` can persist them and
`{% redirect %}` can cancel the submission. No Apex, no Flow, no deploy, and the shopper
sees the result in the same response.

Full surface, including the registered controller/action list and the escaping rule for
params, is in `storeconnect-controllers`. Reach for pattern B instead only when the write
must be arbitrary DML or must happen inside Salesforce.

## C. Generated storefront content

### When this is the right pattern

Use customer-owned Salesforce automation only after measuring that the normal
supported Liquid or configuration path cannot meet the requirement. The source
data should change less often than the storefront reads it, and the storefront
must have a safe fallback while a rebuild is pending or unavailable.

### Define the supported output contract

Resolve the output object and field from the live Salesforce schema and current
StoreConnect documentation. Prefer bounded structured data over generated
executable markup. Expose only the minimum read-only fields the storefront needs
through a supported mapping.

The output contract must:

- remain scoped to the confirmed Store and authorized source records;
- exclude credentials, payment data, unnecessary personal data, and
  authorization decisions;
- have explicit size, depth, collection, and character-encoding limits;
- escape every value for the context in which the storefront renders it;
- reject or safely fall back on malformed, missing, partial, or stale output;
  and
- avoid package-managed fields, undocumented classes, and copied field maps.

Read field types, limits, relationships, and write access from the target org.
Do not publish a static object schema or infer a managed field from another
customer.

### Automation requirements

Build the result with a supported customer-owned Salesforce automation pattern.
The implementation must be:

- asynchronous when the work could delay an interactive save;
- bulk-safe, idempotent, deduplicated, and safe under overlapping requests;
- scoped by the confirmed Store and the authoritative record relationships;
- given only the minimum identifiers needed to re-query current source data;
- explicit about sharing, CRUD, field access, limits, and partial failures;
- free of hard-coded org, Store, theme, customer, or record identifiers; and
- independent of undocumented StoreConnect package classes or execution
  context.

Write the complete validated result atomically where the supported Salesforce
workflow allows it. Never publish a partial tree, index, template, or manifest.
Record only a sanitized outcome and correlation identifier; do not log the
generated content or its source records.

### Refresh, verify, and roll back

After the coherent output is ready, use the current supported operator publish
and cache-refresh workflow. If that procedure is unavailable for the direct
write path, stop and hand off; do not guess a field, construct a request, or
copy a mechanism from another environment.

StoreConnect and Salesforce synchronize asynchronously; wait, re-read and never
repeat a write merely because it is not visible yet. Verify the current
Salesforce record, the storefront fallback, the final rendered outcome, and the
unaffected Store scope. Configured fragment caches may remain until their
documented expiry.

Before enabling the automation, test:

- empty, malformed, oversized, deeply nested, and cyclic source data;
- bulk changes and overlapping rebuild requests;
- permission-limited execution and cross-Store isolation;
- failure before and after the output write;
- storefront behavior while output is missing or stale; and
- rollback to the saved baseline through the same supported refresh workflow.

## D. Apex deploy conventions

Custom Apex lives in its own Salesforce DX project and is deployed with supported
Salesforce deployment tooling. StoreConnect content tools do not deploy Apex.

### Always RunSpecifiedTests

```bash
sf project deploy start \
  --metadata "ApexClass:RecordNoteFormInvocable" "ApexClass:RecordNoteFormInvocableTest" \
  --test-level RunSpecifiedTests \
  --tests RecordNoteFormInvocableTest \
  --target-org <org-alias> \
  --dry-run
```

Drop `--dry-run` to apply it. `--dry-run` compiles and runs the specified tests without
changing the org, so run it first every time.

- `RunLocalTests` runs **every** unmanaged test in the org, and it is the default for a
  production deploy that contains Apex. On a client org that means unrelated code you did
  not touch can fail your deploy. Always pass `--test-level` explicitly.
- **Coverage with `RunSpecifiedTests` is per class, not org-wide.** The tests you list must
  reach at least 75% for **each class and trigger in the deployment**. If one of your
  classes is partly exercised by tests that live elsewhere in the org, add those test
  classes to `--tests` or the deploy fails on coverage even though the org-wide figure is
  fine.
- `NoTestRun` only applies to development environments (scratch org, sandbox, Developer
  Edition).
- Keep `--metadata` narrow. Deploying the whole project drags unrelated components and
  their coverage requirements into the transaction.

### Use supported Flow entry points

Use StoreConnect actions that are visible in the target org's Flow Builder, and inspect
their current inputs there. Do not depend on undocumented package classes or infer
callability from a class name.

### Permissions the deploy does not give you

The automation context needs least-privilege Apex class, object, and field access for
everything the path touches. A successful deploy does not grant those runtime permissions.
Verify the effective access in the target org and re-verify after an upgrade.

### Post-deploy verification

1. Confirm the deploy result and the per-class coverage figures, not just the exit code.
2. Trigger the path end to end from the storefront in a non-production store.
3. Re-query the written record, scoped by store, and check the field values.
4. Re-run the same path with a bulk batch, not a single record.
5. Confirm the available synchronization health reporting shows no error after the first
   live submission.
6. Confirm the storefront actually shows the change, for a generated template by loading
   the page that renders it.
