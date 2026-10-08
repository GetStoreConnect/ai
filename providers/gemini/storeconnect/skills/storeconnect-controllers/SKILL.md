---
name: storeconnect-controllers
description: Run server-side logic around a StoreConnect page request using Liquid controller templates — the before/after/final phases, the registered controller/action key rule, action tags (params, variables, redirect, respond, update, action, api), form-submission interception, and the safety rules for controller-driven writes. Use when storefront behavior must run on the server without Apex — access gating and redirects, capturing extra form fields, cart automation, injecting data for the render, or calling an external service during a render.
---

<!-- Generated from shared/skills. Do not edit this copy. -->

# StoreConnect Liquid Controllers

A Liquid controller is a theme template whose key matches a **registered
controller/action pair**. It runs around the platform's own handling of that
request: `{% before %}` before the action, `{% after %}` when the response is
about to be sent, `{% final %}` as the last hook of the request. Controllers are
the storefront-side alternative to Apex for request-time logic, and they can
write to store data, so treat every one as a security-relevant change.

Controllers are entirely opt-in. The base theme ships **no** controller
templates, so nothing you see on a default store comes from one, and there is no
built-in fallback to inherit behavior from.

## Is a controller the right tool?

Work down this list and stop at the first row that fits.

| Need | Use this instead of a controller |
|---|---|
| Display or compute something for one template | Plain Liquid in the page, block, or snippet |
| Collect user input and validate it | `{% form %}` — see `storeconnect-forms` |
| Update part of a page without a reload | `{% component %}` — see `storeconnect-components` |
| A brand-new URL path | `pages/not_found` routing, or a Salesforce-side route; see `storeconnect-apex-integration` |
| Privileged administration, bulk data work, credential handling, payment capture, anything needing sharing/FLS enforcement or retries | Apex or Flow — see `storeconnect-apex-integration` |
| Reading or writing records for a *different* customer or store than the current request | Apex or Flow. A controller must never do this. |

A controller is right when **all** of these hold: the work must happen on the
server, it must happen during an existing registered request, it only touches the
current store and the current session's own data, and it is cheap enough to run
on every matching request.

## Will it run at all?

- Template key is **`controllers/<controller>/<action>`**, for example
  `controllers/carts/update`, `controllers/pages/show`,
  `controllers/checkout/steps/terms/update`.
- The pair must already be registered. An unregistered key is **never invoked**
  and fails silently — no error, no log entry you will notice.
- **Do not derive a key from a URL.** The Liquid controller name often differs
  from the URL: `/checkout/accept_terms` is `checkout/steps/terms`, a content page
  at any slug is `pages/show`, and the home page is `pages/home` (a separate key).
- Confirm the exact pair against the `controllers.csv` exported with the target
  theme, or the published Liquid Controllers reference on
  `https://support.storeconnect.com/`. Neither guessing nor pattern-matching is
  acceptable here.
- `controllers/theme` is the global controller and runs on **every** request to
  the store, including component reloads and asset-adjacent routes. Keep it
  minimal.

Adding or changing a controller template is a theme change. Use the current
supported publish and cache-refresh workflow described in
`storeconnect-sync-deploy`, then verify the resolved storefront behavior.

## Phases

Two controller templates can run per request: the global `controllers/theme` and
the route's own controller.

| Phase | Runs | Order | Use it for |
|---|---|---|---|
| `{% before %}` | After platform setup (store, customer, cart resolved), before the platform action | theme controller first, then page controller | Gating and redirects, validating input, injecting params/variables the page will read, reading state the action is about to destroy |
| `{% after %}` | When the platform action is about to send its response | page controller first, then theme controller | Persisting extras once the action has succeeded, wrapping or replacing the rendered body |
| `{% final %}` | Last hook of the request | page controller first, then theme controller | Fire-and-forget outbound calls, work that must happen on every branch |

Ordering and short-circuit rules, all verified:

- The **first** `{% respond %}` or `{% redirect %}` wins; later ones anywhere in
  the request are ignored.
- `{% redirect %}` skips everything from that point on: the rest of the same
  phase, the platform action, `after`, and `final`.
- `{% respond %}` skips all **later** phases. In `before` it also cancels the
  platform action.
- Both are **inert in `final`** — there is no responder in that phase, so the tag
  silently does nothing.
- `{% variables %}` set in `before` reach the page. Set in `after`, the page has
  already rendered and only the layout sees them.
- `{% after %}` does **not** tell you whether the platform action succeeded.
  `original_response` is populated only on the render path, so after a redirect
  there is nothing to inspect, and the phase fires on both the success and the
  failure branch. Some actions bypass `after` entirely and only reach `final`.
  If a write must happen exactly once regardless of branch, do it in `final` and
  make it idempotent.

**Keep every side-effecting tag inside a phase block.** The controller template
is evaluated once per phase, so a `{% params %}`, `{% action %}`, `{% update %}`,
`{% session %}`, or `{% api %}` left at the top level of the file fires on every
pass — up to three times per request. This is the single most common controller
bug in real themes. Top-level `{% assign %}` and `{% capture %}` are harmless.

## Security rules — non-negotiable

This skill authorizes server-side writes. Every rule below applies before you
write a single tag.

- **Validate and normalize every request value before any write.** Values read
  from `current_request.params` are HTML-escaped, which is not validation. Check
  type, length, and allowed range, and reject anything unexpected instead of
  coercing it.
- **Never pass a raw request value into a tag option.** Match it against an
  expected set, or rebuild it from trusted data, first.
- **Require an unambiguous single-match target.** Resolve the record you are
  about to write by iterating trusted server-side state and confirming exactly
  one match. If zero or more than one match, do nothing and surface a message.
- **Scope by store, and for customer data by the authenticated customer.** Only
  act on records reachable from `current_store`, `current_customer`,
  `current_cart`, or the current session. Never widen that scope.
- **Never trust a request-supplied SFID or record ID.** Treat it as an untrusted
  hint to be matched against a trusted current-store or current-customer
  collection, never as authorization. Resolve exactly one permitted record
  before calling any record-selecting action.
- **`{% update %}` requires a read-write Custom Data Mapping** for that object and
  field, plus the required field access. A field with no mapping, or a read-only
  mapping, is silently ignored — no error, no warning. See
  `storeconnect-salesforce-data` for mapping setup and
  `storeconnect-liquid` for cast rules.
- **Do not use a controller for privileged administration or payment data.** Never
  place a literal credential in a template, browser asset, repository file, or
  manually constructed authorization value. For an authenticated call, use only
  the documented Store Variable integration pattern or another supported
  server-managed integration, and never render or log the configured value. Card
  data, bank details, and payment mutation belong in Salesforce with proper
  enforcement (`storeconnect-apex-integration`).
- **Outbound calls go only to an approved endpoint.** Never build the URL for
  `{% api %}` from a request value, and never forward request headers, cookies,
  raw paths, customer identifiers, record IDs, or payment details to an external
  service. Send the minimum an approved integration needs, with consent where
  required.
- **Never cache output a controller varied per customer, session, or request.**
  Keep it outside every `{% cache %}` block.

## Failure modes to design around

Controllers fail quietly. Assume nothing worked until you have verified it.

| Symptom | Cause |
|---|---|
| Nothing happens at all | The key does not match the current supported route pair, synchronization is incomplete, or the supported refresh has not completed |
| Params, variables, and a redirect all vanish together | **Any** Liquid error anywhere in the controller template discards that controller's params, variables, and responder for that phase. Side effects that already ran (`action`, `update`, `session`, `api`) are **not** rolled back, so you get a half-applied controller. A single typo'd variable name is enough. |
| A cart action does nothing | A wrong option name (for example `product_id` instead of `product_identifier`), a missing prerequisite (no logged-in customer, no cart), or an unavailable product. Failed actions log and no-op; they never raise. |
| `{% update %}` writes nothing | No read-write Custom Data Mapping, or missing field access |
| `{% redirect %}` goes nowhere | The URL option is `to:`. `path:` is silently ignored. |
| Action tags inside `{% cache %}` stop firing | On a cache hit the block body is never rendered, so the side effects never run. Never wrap action tags in `{% cache %}`. |
| A variable set on the page request is missing when a component reloads | A component reload is a separate request. Set it again from `controllers/theme` or `controllers/async/components/load`. |

## Performance

A controller runs inside the request, so its cost is page latency.

- `controllers/theme` runs on every request. Guard all work behind a narrow
  condition before doing anything expensive.
- The template body is evaluated once per phase. A `{% query %}` outside a phase
  block runs up to three times per request.
- **`{% api %}` blocks the render.** Synchronous calls in `before` or `after`
  hold the response open for as long as the HTTP client allows, and the tag sets
  no timeout of its own, so an unreachable endpoint can stall a page for tens of
  seconds. Never make a synchronous call to an endpoint you do not control the
  latency of on a page-render path.
- `{% final %}` is still inside the request cycle, not after the response is
  delivered. Only `{% api %}` is forced async there; a `{% query %}` or
  `{% update %}` in `final` still delays the response.
- Cache the *result* of an external lookup in the page or snippet that consumes
  it, never the controller block that fetches it.

## Verification after any controller change

1. Use the current supported publish and cache-refresh workflow
   (`storeconnect-sync-deploy`).
2. Load the exact URL the registered pair serves and confirm the intended
   behavior, including the case where the input is missing or invalid.
3. Confirm the phase actually ran with a temporary `{% debug key: value %}` probe
   using non-sensitive values, and check the platform Console. If nothing appears,
   the key does not match a registered pair. Remove the probe afterwards.
4. Check the Console for Liquid errors on that template. Any error means the
   controller's params, variables, and responder were discarded.
5. For a write, read the record back through the storefront and confirm the value
   persisted and is correctly escaped where it is displayed.
6. Confirm an unauthenticated visitor and a second customer cannot reach or
   influence the write.
7. Re-check any cached fragment on the affected pages for cross-customer
   leakage.

## Which reference to read

- **Writing any action tag, or unsure of an option name** → read
  [references/action-tags.md](references/action-tags.md). It has the exact
  signature and options for `params`, `variables`, `redirect`, `respond`,
  `update`, `action` (with every registered action name), `api`, `session`,
  `header`, and `debug`, plus the tag-option parsing rules that silently break
  inline filters.
- **Calling an external service from a controller** → read the `api` section of
  [references/action-tags.md](references/action-tags.md) *before* writing it. It
  runs inside the page render, sets no timeout, and needs explicit status
  handling.
- **Building one of the common controller shapes** (capture an extra form field,
  gate a page, inject render data, call an API with failure handling, return
  JSON, add a virtual route) → read
  [references/controller-patterns.md](references/controller-patterns.md) for a
  working generic example to start from.
- **Choosing between `before`, `after`, and `final` for a specific job** → the
  phase-selection rules and the registry excerpt are in
  [references/controller-patterns.md](references/controller-patterns.md).

## Related skills

`storeconnect-liquid` for tags, filters, drops, and `{% update %}` cast rules.
`storeconnect-forms` for form names and field inventory.
`storeconnect-components` for async reload and the built-in JSON response.
`storeconnect-apex-integration` for anything that needs Salesforce-side
enforcement. `storeconnect-debug-performance` for the Console, `{% timer %}`, and
`{% cache %}` strategy. `storeconnect-sync-deploy` for pushing the template
through the reviewed publish and supported cache-refresh workflow.
