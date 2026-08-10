---
name: storeconnect-debug-performance
description: Instrument and speed up StoreConnect Liquid — the web Console, the debug and timer tags, drop and record introspection, cache key design and invalidation, collection and pagination cost, per-item hot paths, asset weight, and client-side batching. Use when you need to instrument a template that renders blank or wrong, cache a fragment, or cut queries on a slow page, when cached output is stale or reaches the wrong visitor, and before adding any debug, timer, or cache tag. For an audit that changes nothing use storeconnect-theme-review.
---

# StoreConnect debugging and performance

Measuring and fixing StoreConnect Liquid at runtime: what to instrument, what the web Console
reports, which fix matches which measured cost, and how to key a cached fragment so it stays
correct.

Three symptoms look similar and have different causes: a template that renders **blank**, one
that renders the **wrong data**, and one that is **slow**. Identify which you have before you
change anything, because the diagnostic path differs for each.

## Rules that apply before you touch anything

**Never print these anywhere, in any tag, comment, attribute, or log:** request parameters,
headers, session state, cart contents, customer or contact records, credentials, tokens,
payment values, or authorization data. Print sizes, counts, booleans, and ids you already
display. HTML comments and `data-` attributes are visible to anyone who views source.

**Never pass a visitor-supplied string as a tag option.** String option values are re-rendered
as Liquid, so a value containing `{{ … }}` or `{% … %}` is evaluated. This applies to
`{% debug %}`, `{% cache %}`, `{% render %}`, `{% require %}`, `{% component %}`, and every
other tag option. Pass a count or a boolean derived from the value instead.

**Never build a page-visible debug mode.** No `?debug=1` branch, no page dump, no hidden
diagnostic block, no "print everything" fallback. If Console access is unavailable, reproduce
on a non-production store or a theme preview with test records.

**Never publish a `{% timer %}`.** With no active Console session the tag renders nothing and
**the body it wraps is silently dropped**. A timer left around a price or an add-to-cart
control removes it for every visitor while looking correct to whoever still has the Console
open. Remove every `{% debug %}` and `{% timer %}` before publishing, then reload the page with
the Console closed and confirm nothing has disappeared.

**Never expose introspection output.** `record_fields`, `record_relationships`, and
`record_name` are for your own session; their output describes the object's shape.

**Every axis that changes a cached fragment's output must appear in `items:`.** Otherwise the
first visitor's markup is served to everyone whose key matches. Cross-customer disclosure
through an incomplete cache key is the most damaging mistake in this skill's scope.

**Cache only stable, public, read-only markup.** Never cache a `{% form %}`, a `{% component %}`
container, checkout or payment content, totals or balances, customer-specific output, or anything
derived from the visitor or request. A violation can reject an interaction, expose one visitor's
output to another, or leave a component unable to update. Do not infer permission from an existing
cache block. Move unsafe content outside it and follow [references/caching.md](references/caching.md).

**Never cache before measuring.** Caching a page that is slow because of repeated work hides
the cost for one visitor and leaves it for the next miss, and a wrong key turns a performance
problem into a correctness problem.

**Write boundary.** This skill diagnoses and edits theme templates. It creates and updates no
store, catalog, or Salesforce records. A template change still ships through the normal review,
publish, and supported cache-refresh path — see `storeconnect-sync-deploy`.

## Triage: symptom, first move, reference

| Symptom | First move | Then read |
|---|---|---|
| Template renders blank, or one value is missing | Open **Error entries** in the Console. A missing template and a misspelled attribute both render empty and log an error there. | [references/diagnosis.md](references/diagnosis.md) — the blank-output path |
| A loop over a collection renders nothing | Check whether the collection is paginated. Paginated collections render nothing outside `{% paginate %}`, and `.any?` on one is always false. | [references/performance.md](references/performance.md) — collections |
| Template shows plausible but wrong data | Print the id of the record you believe you are rendering, and confirm store and customer scope. | [references/diagnosis.md](references/diagnosis.md) — the wrong-data path |
| Right for one visitor, wrong or stale for another | Suspect an unsafe cache boundary or incomplete public variation inputs. Test the storefront URL directly in separate clean sessions. | [references/caching.md](references/caching.md) — Review every variation axis |
| Output did not change after a theme deploy | Do not re-deploy. The supported deploy refresh does not guarantee immediate expiry of an explicit `{% cache %}` fragment. | [references/caching.md](references/caching.md) — what actually invalidates a fragment |
| A form submit is rejected, or a component stopped refreshing, on a page you cache | Check whether the form or component is inside the `{% cache %}` block. Forms and component containers must not be cached because their correctness can vary by visitor or request. | [references/caching.md](references/caching.md) — Safety boundary |
| Page or region is slow | Switch the Console to **Slowest entries** to find the template with the highest self duration. Do not add a cache yet. | [references/diagnosis.md](references/diagnosis.md) for the measurement order, then [references/performance.md](references/performance.md) for the fix |
| You know the template but not the line | Read the per-filter timings on that entry, then bisect with `{% timer %}`. | [references/diagnosis.md](references/diagnosis.md) — timer tag |
| Deciding whether to cache a region, or which items to key it on | Confirm the output is shareable at all, then design the key. | [references/caching.md](references/caching.md) |
| A discount, promotion, or controller behaves as if the Liquid never ran | These surfaces swallow errors; a dynamic discount rescues to `0`. | [references/diagnosis.md](references/diagnosis.md) — Liquid that runs outside a page render |
| Server time is fine, the page still feels slow | Look at asset placement and per-row client-side work. | [references/performance.md](references/performance.md) — asset weight, client-side cost |
| You need a Map, List, or index built in Liquid | Use a Map as a lookup index rather than a nested scan. | [references/performance.md](references/performance.md) — Maps and Lists |

## The measurement loop

Always in this order. Skipping step 1 or step 6 is how a "fix" ships that changes nothing.

1. **Reproduce** on the target store, at the real URL, with realistic data volume and the
   relevant visitor state (anonymous, signed in, cart populated). A page that is fast on three
   products proves nothing.
2. **Classify** the symptom: blank, wrong, or slow. Each has its own path.
3. **Attribute** the cost or the failure to one template using the Console entry tree, before
   forming a theory. Self duration names the template doing the work; total duration only names
   its parent.
4. **Instrument narrowly.** One `{% timer %}` around the widest suspect region, then halve.
   `{% debug %}` for a count or a branch marker. Never scatter tags across a theme.
5. **Apply the one fix that matches the measured cost class**, from
   [references/performance.md](references/performance.md).
6. **Re-measure the same URL in the same state** and record the before and after numbers. If
   you cannot state the saving, you have not finished.
7. **Remove all instrumentation** and verify the page again with the Console closed.

## Cost order, highest first

When you have no measurement yet, this is the order in which StoreConnect templates usually
lose time. It guides where to look, not what to conclude.

1. A `{% query %}` inside a loop, or any repeated per-row database access.
2. A whole-collection load: `| depaginate`, `.size` on a query result, a missing
   `{% paginate %}`.
3. An unscoped or unnarrowed `{% query %}` against a high-volume object.
4. Liquid on a per-item hot path, such as a dynamic discount field evaluated once per cart item.
5. A slow region that blocks the first paint but could be a deferred component.
6. Repeated rendering of a fragment that is identical for many visitors and is not cached.
7. Assets loaded on pages that do not use them.
8. Per-row client-side lookups that could be batched.

## Before you publish

1. No `{% debug %}`, no `{% timer %}`, no `force: true` anywhere in the change.
2. Reload every affected page with the Console closed. Nothing disappeared.
3. Every `{% cache %}` block you added or changed: no form, no component, no money inside; and
   the output follows each axis in its key when you change that axis.
4. States tested: anonymous, signed in, empty collection, empty cart, and a second page of any
   paginated collection you touched.
5. Deploy through the reviewed publish and supported cache-refresh path, then verify on the live URL.

## Related skills

- `storeconnect-liquid` — `references/runtime-gotchas.md` is the symptom-to-cause catalog for
  Liquid failures generally; `references/query-tag.md` covers query cost, scope, and the
  distance struct; `references/drops.md` is the authoritative attribute list.
- `storeconnect-components` — `references/component-reload.md` for `defer:` and `lazy:`, the
  alternative to caching a region that cannot be cached.
- `storeconnect-theme-development` — `references/assets-and-build.md` for asset pipelines and
  page-specific packs.
- `storeconnect-controllers` — for logic that runs before the page renders.
- `storeconnect-sync-deploy` — for the reviewed publish and supported
  cache-refresh path.
- `storeconnect-pos-customization` — for the supported POS client-side bridge.
