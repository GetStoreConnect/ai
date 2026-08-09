# Apex platform rules for StoreConnect orgs

The Salesforce platform rules that decide whether custom Apex around a StoreConnect
storefront is correct, safe, and survivable in production. Read this while writing or
reviewing the code; read [integration-patterns.md](integration-patterns.md) to choose the
shape first.

## Contents

- [Sharing keywords](#sharing-keywords)
- [Access modes: user mode and system mode](#access-modes-user-mode-and-system-mode)
- [Enforcing CRUD and FLS beyond the access mode](#enforcing-crud-and-fls-beyond-the-access-mode)
- [SOQL injection](#soql-injection)
- [Governor limits](#governor-limits)
- [Bulkification](#bulkification)
- [Callouts](#callouts)
- [Asynchronous boundaries](#asynchronous-boundaries)
- [SOQL selectivity](#soql-selectivity)
- [Automation on StoreConnect records](#automation-on-storeconnect-records)
- [Tests](#tests)

## Sharing keywords

Declare one on **every** class. Never rely on the default.

| Keyword | Behavior | Use for |
|---|---|---|
| `with sharing` | Enforces the running user's sharing rules on records | Entry points: invocables, Apex REST, `@AuraEnabled` controllers |
| `inherited sharing` | Takes the caller's context; behaves as `with sharing` when it is itself the entry point | Services, builders, helpers called from more than one place |
| `without sharing` | System context, ignores sharing | Only with a written reason in a comment. Expect it to be questioned in review |

Two things this does **not** do, both of which cause real bugs:

- **Sharing is not CRUD or field-level security.** `with sharing` filters rows. It does not
  stop a query from returning a field the user cannot read, or a DML from writing one they
  cannot write. That is the access mode's job, below.
- **The automation context is not proof of shopper authorization.** Authorization for a
  shopper-triggered write must come from platform-set relationships in the record graph —
  the Submission's store and contact — not from the running user's permissions.

On API version 67 and above, a class with no sharing declaration defaults to `with sharing`;
on 66 and below it defaulted to `without sharing`. A class written against an older API
version that relied on the old default silently becomes data-enforcing when its API version
is bumped. Declare explicitly and this never matters.

## Access modes: user mode and system mode

Every SOQL, SOSL, and DML operation runs in one mode or the other. **State it at the call
site, always.** On API 66 and below the default is system mode; on 67 and above it is user
mode. An undeclared statement therefore changes behavior when the API version is bumped,
which is exactly the kind of change nobody notices until data leaks or a save starts
failing.

| Operation | User mode | System mode |
|---|---|---|
| Inline SOQL / SOSL | `[SELECT ... WITH USER_MODE]` | `[SELECT ... WITH SYSTEM_MODE]` |
| Dynamic query | `Database.query(q, AccessLevel.USER_MODE)` | `Database.query(q, AccessLevel.SYSTEM_MODE)` |
| Dynamic query with binds | `Database.queryWithBinds(q, binds, AccessLevel.USER_MODE)` | same with `SYSTEM_MODE` |
| Query locator | `Database.getQueryLocator(q, AccessLevel.USER_MODE)` | same with `SYSTEM_MODE` |
| DML statement | `insert as user records;` / `update as user records;` | `insert as system records;` |
| Database method | `Database.insert(records, false, AccessLevel.USER_MODE)` | same with `SYSTEM_MODE` |

- User mode enforces object permissions, field-level security, **and** sharing rules. An
  object or field the running user cannot read makes the query fail rather than quietly
  return partial data; rows they cannot see are filtered out by sharing.
- **`WITH SECURITY_ENFORCED` is removed on API 67 and above** and must not be written.
  `WITH USER_MODE` replaces it and additionally enforces sharing, which
  `WITH SECURITY_ENFORCED` never did.
- Use system mode only when the code is genuinely reached by users who lack the permission
  and would otherwise hit `INSUFFICIENT_ACCESS_OR_READONLY` — a trigger on a standard object
  that ordinary users save, for example. Every system-mode call needs a comment naming the
  permission set or upstream gate that already restricts the path. "It was easier" is not a
  reason.
- Picking the mode requires walking the call chain both ways. Who invokes this class, and
  can a user without your permission set reach it through an ordinary record save? And
  downstream, if a user-mode query strips a field whose value you then write back, you
  silently corrupt the record.

## Enforcing CRUD and FLS beyond the access mode

User mode covers the common case. Two situations need more:

**You accept a field set you did not construct** (a payload, a Flow input, a generic
importer). Strip what the user may not write before DML:

```apex
SObjectAccessDecision decision = Security.stripInaccessible(
  AccessType.CREATABLE,
  incomingRecords
);
insert as user decision.getRecords();
// decision.getRemovedFields() names what was dropped — log the field names, never values.
```

On an update, put **only** the fields you intend to change on the SObject. `stripInaccessible`
removes fields the user cannot edit, so a record loaded with a wide field set and passed
straight through can silently drop changes you did mean to make.

**You need to branch rather than fail.** Check explicitly:

```apex
Schema.DescribeFieldResult f = Contact.Email.getDescribe();
if (f.isAccessible() && f.isUpdateable()) {
  // ...
}
```

Use this when a missing permission is an expected configuration state, not an error. Do not
use it as a substitute for the access mode — it describes permissions, it does not enforce
them.

## SOQL injection

**Bind. Do not concatenate.** A bound variable cannot change the query's structure:

```apex
// Safe: the value is bound, and the field and object names are literals in source.
List<Contact> found = [
  SELECT Id, AccountId FROM Contact WHERE Email = :submittedEmail WITH USER_MODE
];
```

When the shape must be dynamic, bind through the map and pass an access level:

```apex
// Allowlist anything you interpolate. A field or object name cannot be bound, so it
// must come from a fixed set, never from request input.
private static final Set<String> SORTABLE = new Set<String>{ 'Name', 'CreatedDate' };

String sortField = SORTABLE.contains(requestedSort) ? requestedSort : 'Name';
Map<String, Object> binds = new Map<String, Object>{
  'storeId' => storeId,
  'contactId' => contactId
};
List<SObject> rows = Database.queryWithBinds(
  'SELECT Id, Name FROM s_c__Form_Submission__c' +
  ' WHERE s_c__Store_Id__c = :storeId AND s_c__Contact_Id__c = :contactId' +
  ' ORDER BY ' + sortField + ' LIMIT 200',
  binds,
  AccessLevel.USER_MODE
);
```

`String.escapeSingleQuotes` is the last resort for a value that genuinely cannot be bound.
It does nothing for an injected field name, object name, operator, or `ORDER BY` clause, and
it is not a substitute for binding. If your only defense is `escapeSingleQuotes`, redesign
the query.

Also validate the **type** of anything used as an id. Casting malformed request text to
`Id` throws. Check with `String.isBlank`, length, and a `try`/`catch` around the cast, then
verify the record it points at is in scope before using it.

## Governor limits

Per transaction. The asynchronous column applies inside `@future`, Queueable, Batch, and
Scheduled Apex.

| Limit | Synchronous | Asynchronous |
|---|---|---|
| SOQL queries | 100 | 200 |
| Records returned by SOQL | 50,000 | 50,000 |
| Records returned by `Database.getQueryLocator` | 10,000 | 10,000 |
| SOSL queries | 20 | 20 |
| DML statements | 150 | 150 |
| Records processed by DML | 10,000 | 10,000 |
| CPU time | 10,000 ms | 60,000 ms |
| Heap | 6 MB | 12 MB |
| Callouts | 100 | 100 |
| Cumulative callout timeout | 120 s | 120 s |
| Callout request or response size | 6 MB | 12 MB |
| `@future` methods invoked | 50 | not callable |
| Jobs added with `System.enqueueJob` | 50 | 1 from an executing Queueable |
| Total transaction wall time | 10 minutes | 10 minutes |

Also relevant here:

- Concurrent queued or active Batch Apex jobs: 5.
- Chained Queueable stack depth is limited to 5 in Developer Edition and Trial orgs, and
  effectively unlimited elsewhere. Do not design a chain that only works in a client's
  production org.
- Storefront-originated changes can arrive in bulk, so a per-record cost measured on one
  record can multiply across a production batch. Test at the Salesforce bulk boundary and
  keep large strings and JSON bounded.

## Bulkification

The failure mode is not a slow class; it is a class that works in single-record testing
and throws `Too many SOQL queries: 101` on a production batch.

- **No SOQL inside a loop.** Collect ids first, query once, put the results in a `Map`, then
  loop over the map.
- **No DML inside a loop.** Accumulate a `List<SObject>` and perform one DML per SObject type
  after the loop.
- **No callout inside a loop**, and no callout on the synchronous path at all — see below.
- Every entry point takes a collection. An `@InvocableMethod` always receives a `List`, and
  a trigger always receives `Trigger.new`. Code that reads `requests[0]` is broken.
- Query only the fields you use. A wide `SELECT` on a bulk batch is the fastest way to
  exhaust heap.
- If a method could ever process more rows than the limits allow, do not "handle" it with a
  `LIMIT`. Move the work to Batch Apex and process in chunks.

## Callouts

**Do not call out synchronously from a storefront-triggered save path.** Move the callout
to `@future(callout=true)` or a Queueable that implements `Database.AllowsCallouts`, and
give the storefront a status it can read later.

The same rule bites in reverse in a trigger: if you call out first and then perform DML in
the same transaction, that works, but it makes an external system's latency part of a
Salesforce save. Never do it on a path a shopper's request depends on.

Credentials and destinations:

- Use a Named Credential and address it through the endpoint:
  `req.setEndpoint('callout:Your_Named_Credential/path');`. The platform supplies the
  authentication; your code never sees it.
- If a Named Credential cannot express the auth, use protected custom metadata populated in
  the org and commit an obvious placeholder such as `your_api_key_placeholder`. Never a real
  value, in any file.
- **Never call a URL that came from a browser.** Allowlist the hosts you will contact,
  require HTTPS, and reject anything resolving to a private or link-local address.
- Apex follows redirects on `GET` and `HEAD`. If the destination is not entirely under your
  control, treat a 3xx as a failure and inspect `Location` yourself rather than letting a
  redirect reach an internal address.
- `req.setTimeout(ms)` defaults to 10,000 and caps at 120,000. Set it low and deliberately;
  the 120-second cumulative budget is shared by every callout in the transaction.
- Validate the response before trusting it: status code, content type, size, and shape. For
  a file, check the signature bytes, not the extension.
- Log a correlation id and the status code. Never the request body, the response body, a
  token, or an authorization header.

## Asynchronous boundaries

| Mechanism | Use when | Watch for |
|---|---|---|
| `@future(callout=true)` | One fire-and-forget callout, primitive arguments only | No return value, no chaining, cannot be called from another `@future` or from Batch Apex |
| Queueable | Most async work; accepts object state; add `Database.AllowsCallouts` for callouts | One child job per executing job; depth capped at 5 in Developer Edition and Trial orgs |
| Batch Apex | More rows than a single transaction's limits allow | 5 concurrent jobs per org; `start`, `execute`, `finish` each get their own limits |
| Scheduled Apex | Time-based rebuilds and reconciliation | Not a substitute for event-driven work; frequent rebuilds can invalidate the benefit of caching and overload the org |

Rules that matter on this platform:

- **Pass identifiers, not payloads.** A Queueable constructor holding a large object graph
  is serialized with the job. Pass a `Set<Id>` and re-query.
- **Re-query and re-authorize in the async context.** The record may have changed, and the
  authorization you checked synchronously is not carried across the boundary.
- **Make the work idempotent.** Use a business key or processed-state field so repeated
  delivery is a no-op rather than a duplicate.
- **Use Salesforce-supported enqueue guards and deduplication in customer-owned code.**
  Do not depend on an undocumented StoreConnect execution context.
- **Expose a status, not a debug log.** Async failures are invisible. Write a status field or
  a purpose-built log record with sanitized content so support can see what happened.

## SOQL selectivity

A query in a trigger context against an object with more than roughly 200,000 rows fails
with `QueryException: Non-selective query against large object type` unless its filter can
use an index.

Indexed by default: `Id`, `Name`, `OwnerId`, `CreatedDate`, `SystemModstamp`, `RecordTypeId`,
every master-detail and lookup foreign key, and any field marked External Id or Unique.
StoreConnect's stable external ids and relationship fields are appropriate first filters;
always include store and owning-record scope as well.

- Selectivity thresholds: a standard index qualifies under 30% of the first million rows and
  15% beyond, capped at 1,000,000 rows; a custom index under 10% and 5%, capped at 333,333.
- `!=`, `NOT`, `LIKE '%value'` with a leading wildcard, and `!= null` cannot use an index.
  Do not put them in the driving filter.
- Filter on the indexed field first and narrow with the rest, rather than scanning and
  filtering in Apex.
- Never rely on `LIMIT` to make a query selective. It bounds the result, not the scan.

## Automation on StoreConnect records

- **Prefer a record-triggered Flow calling an invocable** over a custom trigger on a
  StoreConnect record. This reduces automation-order coupling and makes the entry point
  visible to administrators. Verify every required field is populated before using it.
- If you do write a trigger: one trigger per object, no logic in the trigger body, all work
  in a handler class, bulk-safe, and a static recursion guard.
- **Do not use `addError` for storefront-originated records.** The shopper may have no
  direct way to correct a Salesforce error. Skip the row, record a sanitized reason, and
  expose a recoverable status instead.
- Expect other org automation to fight you. Assignment rules and existing Flows can re-route
  `OwnerId` after your DML, and validation rules can reject a status transition you thought
  was valid. In production code, tolerate re-routing rather than asserting on it. In test
  fixtures, use `Database.DMLOptions` with
  `assignmentRuleHeader.useDefaultRule = false` and then assert.

## Tests

Coverage is the gate that lets you deploy at all: with `RunSpecifiedTests`, the tests you
list must cover **each class and trigger in the deployment** to at least 75%, computed per
class. Coverage is the floor, not the goal.

Cover these cases, because each one is a bug an agent otherwise ships:

- Authorized success, and the expected business failures.
- **Cross-store rejection**: a payload naming a record in another store must be dropped.
- **Cross-account and cross-contact rejection**: a payload naming another customer's record
  must be dropped. A test suite that never attempts this proves nothing about the
  authorization you wrote.
- Missing object, field, and sharing access, exercised with `System.runAs` against a user
  holding only the least-privilege access the automation requires.
- Malformed, blank, oversized, and unexpectedly typed input.
- A replayed or duplicated submission, asserting the second run is a no-op.
- A missing parent lookup, because related records may become available at different times.
- A bulk batch of at least 200 records, asserting no limit exception and one query per
  related object.
- Callout success, timeout, non-2xx, unexpected content type, and rejected host, using
  `Test.setMock(HttpCalloutMock.class, ...)`. Real callouts are not permitted in tests.

Conventions:

- Never `@IsTest(SeeAllData=true)`. Build data with factories.
- No production records, real credentials, real SFIDs, or copied customer payloads in test
  code or test data.
- Wrap the exercise in `Test.startTest()` / `Test.stopTest()`. Async jobs enqueued inside
  run at `stopTest()`, and a Queueable enqueued by another Queueable does not chain in a
  test — assert the first job's effect and test the chain's second stage directly.
- Assert on values, not on the absence of an exception. A test whose only assertion is that
  nothing threw will pass after you break the authorization.
