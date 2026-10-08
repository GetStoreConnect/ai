---
name: storeconnect-components
description: StoreConnect reloadable Liquid components and storefront interactivity — the {% component %} tag and its reload events, {% context %} state that survives a reload, lazy and deferred rendering, remote {% form %} wiring, the JSON page-response API, and HTMX/Alpine integration. Use when part of a StoreConnect page must update without a full page load (live cart, cart badge, cart drawer, quick view, live filters, vouchers, shipping rates, stock), when wiring JavaScript into a theme so it survives a component reload, or when choosing a frontend architecture for a theme.
---

<!-- Generated from shared/skills. Do not edit this copy. -->

# StoreConnect components and frontend interactivity

A `{% component %}` is a Liquid template the browser can ask the server to re-render on its own,
in place, in response to a named DOM event. That is the platform's supported mechanism for
updating part of a page. Everything else on this skill is how to drive it, how to wire JavaScript
that survives it, and when to use a JSON page request instead.

## Pick the approach first

| Situation | Approach |
|---|---|
| A server-rendered region must reflect new **server** state: cart, totals, vouchers, stock, shipping rates, saved addresses | `{% component %}` with `reload:` |
| A mutation the platform already exposes as a form, followed by that refresh | `{% form … remote: true, data-type: "json", data-success: "<event>" %}` plus a component listening for `<event>` |
| You need a page's own HTML on another surface: quick view, partial navigation, live search results | JSON page request → `references/json-api.md` |
| You need only values, or must update many small spots (a badge, a counter) | Read a JSON island rendered by Liquid, or fetch a JSON page and update the DOM yourself → `references/json-api.md` |
| Purely local UI state: open/closed, active tab, focus trap | Client-side only (Alpine or a small module). No server round trip |
| Checkout, payment, or anything a payment provider initializes | Keep the base theme's composition as it ships. Do not hand-build the request or replace provider markup and scripts |

Reach for a reload when the **markup** is server-owned. Reach for a client-side fetch when you
need **data** and own the markup. A reload is a full storefront request: it re-runs
`controllers/theme` and re-resolves the cart and customer, so it is the more expensive option.

The checkout caveat cuts both ways: the base theme renders its payment-information step *as* a
component so that changing the total re-initializes the provider's JavaScript. Do not convert that
step to a static render, and do not reimplement the payment request yourself.

## Which reference to open

| Read | When |
|---|---|
| [references/component-reload.md](references/component-reload.md) | You are writing or debugging a component: the tag's options, what survives a reload, `{% context %}`, `lazy` vs `defer`, the real `sc.*` event catalog, wiring a remote form to a reload, re-initializing JavaScript that a reload destroys, focus/scroll/loading/error handling, and a symptom-to-cause failure table |
| [references/json-api.md](references/json-api.md) | You are fetching a storefront page as data, submitting a generated remote form through its supported behavior, or building SPA-style partial navigation: response shapes, **which form types honor `remote: true`**, and how to swap HTML without silently killing the page's message region |
| [references/frontend-patterns.md](references/frontend-patterns.md) | You are building a specific interaction — cart drawer, quick view, live search or filters — or integrating HTMX or Alpine so it cooperates with the reload system instead of fighting it |

## The tag

```liquid
{% component "cart", reload: "sc.cart-updated" %}
{% component "checkout/shipping_rates/page", defer: true, reload: "sc.cart-updated" %}
{% component "orders/order_summary", source: order, reload: "sc.cart-updated" %}
```

- The template is `components/<name>.liquid` in the theme. Nested names work: `"checkout/vouchers"` → `components/checkout/vouchers.liquid`.
- `reload:` is a space-separated list of DOM event names. Any other option is passed to the template as a parameter.
- `lazy: true` renders nothing until a reload event fires. `defer: true` renders a placeholder and loads itself immediately, off the critical path.
- Inside the component, `reloaded` is `true` on a reload render, and `context.<key>` reads state persisted with `{% context %}`.

Dispatch a reload on `document` after the state change has succeeded:

```js
document.dispatchEvent(new CustomEvent('sc.cart-updated'))
```

## Non-negotiable rules

**Never cache a component container.** A cached container can render normally but fail to update
when another visitor receives it. Keep the component outside the cached region. If the component
contains an expensive, stable, read-only fragment, cache only that fragment inside the component
template and include every output-changing input in `items:`. See
[references/component-reload.md](references/component-reload.md).

**Never cache a fragment containing a `{% form %}`.** Keep every generated field, submitted value,
validation message, and action control outside cached regions. This avoids broken submissions and
visitor data appearing in the wrong response.

**Never cache checkout, payment, cart, price, entitlement, account, or other customer-specific
output.** Separate stable public presentation from personalized and interactive markup, and cache
only the stable public part. An omitted variation axis is a correctness and potential
data-disclosure defect, not a performance nit.

**An inline `<script>` inside a reloadable component never executes after a reload.** The
replacement HTML is inserted as a parsed fragment, and script elements created that way are inert —
inline and `src` alike, so `{% require %}` inside a component also loads nothing on a reload. The
symptom is behavior that works on first paint and is dead after the first update. Fix it by loading
the JavaScript as a theme asset from the layout or page, re-initializing on DOM change, or
delegating from an ancestor outside the component. See `references/component-reload.md`.

**Never put anything sensitive in component parameters or `{% context %}`.** Persisted context
leaves your server, sits in the page, and comes back on the next reload. Store record identifiers
and non-secret flags only; re-query and re-authorize server-side on every render, scoped by store
and by the authenticated customer. Never place customer PII, payment values, prices you intend to
trust, entitlement decisions, credentials, or tokens there. Do not construct, parse, log, or reuse
the container's own attributes; use only the documented component behavior.

**Escape for the context you are writing into.** Liquid does not escape `{{ }}` output.

- HTML text and attributes: `{{ value | escape }}`.
- URLs: `{{ value | url_encode }}`.
- Data for JavaScript: render it as an escaped attribute and parse it, never as interpolated code.

```liquid
<div data-example-state="{{ state | json | escape }}"></div>
```

```js
const state = JSON.parse(el.dataset.exampleState)
```

Never interpolate a Liquid value into an inline `<script>` body: script content is raw text, so
`| escape` corrupts it and an unescaped `</script>` in any string value breaks out of the block.
Never treat a fetched response body as code.

**Only reload what changed, and never on the happy path alone.** Dispatch a reload event only
after the mutation succeeded; handle the failure branch with a message, not a silent reload.

## Fast failure triage

| Symptom | Cause |
|---|---|
| Renders correctly but never updates; console shows a reload error | The component container was cached |
| Nothing renders and nothing ever loads | `lazy: true` with no `reload:` — it is dead markup |
| Works on first paint, dead after an update | Inline `<script>` or `{% require %}` inside the component |
| Reloads but shows blanks or defaults | Tag parameters are not preserved across a reload; persist IDs with `{% context %}` |
| Reload event fires, nothing happens | Dispatched on an element without `bubbles: true`, or the name does not match the `reload:` list exactly |
| Handlers fire twice, or more each time | Listeners re-bound on every re-initialization |
| Focus jumps to the top of the page after an update | The focused element was inside the replaced container |

Full table with fixes: `references/component-reload.md`.

## Performance

- One component covering a region beats several components listening to the same event: each is its own request, and each re-runs the theme controller.
- List every relevant event on one component's `reload:` rather than chaining event A to event B to reload a second component — chains serialize round trips.
- The reload payload is the component's whole rendered HTML. Keep components narrow; do not put a 50-row list in a component that exists to update one total.
- Debounce at the source for text input (200–300 ms) and show a loading state immediately, before the request.
- `defer: true` for slow or below-the-fold regions; `lazy: true` for content only revealed on demand.
- Cache only stable, read-only fragments *inside* the component template with `{% cache %}` and include every documented variation axis. Never cache the container, a form, payment content, or customer-specific output.

## Verify after any change

1. Load the page: the component renders server-side on first paint (or shows its deferred placeholder).
2. Trigger the mutation: the region updates without a full page load and the browser console is clean.
3. Trigger it twice in quick succession: no duplicated handlers, no doubled actions.
4. Trigger the failure path: an error message appears and no stale content is shown as success.
5. Keyboard and screen reader: focus lands somewhere sensible and the change is announced.
6. Disable JavaScript: the underlying form or link still works as a full page request.
7. Repeat the interaction in a separate clean browser session and confirm no content or state is shared.
8. If you changed theme templates or assets, use the current supported publish
   and cache-refresh workflow — see `storeconnect-sync-deploy`.

## Related skills

`storeconnect-liquid` for tags, filters, and Drops. `storeconnect-forms` for the form catalog and
field drops feeding a component. `storeconnect-controllers` for server-side request logic —
redirects, gating, capturing extra inputs — which is where logic belongs instead of a hand-built
client mutation. `storeconnect-theme-development` for the base-theme override system and asset
pipeline. `storeconnect-debug-performance` for `{% cache %}` key design and profiling a slow render.
