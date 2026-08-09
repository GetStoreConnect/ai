# Component reload reference

Everything needed to write, wire, and debug a `{% component %}`. Read `SKILL.md` first for the
rules that must not be broken.

## Contents

- [The tag](#the-tag)
- [What a reload re-renders](#what-a-reload-re-renders)
- [Carrying state across a reload](#carrying-state-across-a-reload)
- [lazy and defer](#lazy-and-defer)
- [Triggering a reload](#triggering-a-reload)
- [The shipped event names](#the-shipped-event-names)
- [Remote forms: the loop with no JavaScript](#remote-forms-the-loop-with-no-javascript)
- [JavaScript that survives a reload](#javascript-that-survives-a-reload)
- [Loading, error, focus and scroll](#loading-error-focus-and-scroll)
- [Caching a component](#caching-a-component)
  - [Forms inside a cached fragment](#forms-inside-a-cached-fragment)
- [Keeping reloads cheap](#keeping-reloads-cheap)
- [Failure catalog](#failure-catalog)

## The tag

```liquid
{% component "name", reload: "event-one event-two", lazy: true, defer: true, param: value %}
```

Arguments may span lines, as production themes do for long option lists:

```liquid
{% component "example/stock",
   reload: "example-location-changed sc.cart-updated",
   product_id: product.id %}
```

| Option | Effect |
|---|---|
| *(first argument)* | Template `components/<name>.liquid`. Slashes select nested templates: `"checkout/vouchers"` → `components/checkout/vouchers.liquid` |
| `reload:` | Space-separated DOM event names. When one reaches `document`, the server re-renders this component and the container is replaced |
| `lazy: true` | Nothing is rendered on the initial page. Requires `reload:` — without it the component can never load |
| `defer: true` | Renders a placeholder and loads itself as soon as the page registers it. Combine with `reload:` for a region that is both slow and live |
| anything else | Passed to the template as a parameter for the **initial render only** |

Inside the component template:

| Available | Meaning |
|---|---|
| `reloaded` | `true` on a reload render, `false` (or absent) on the initial render |
| `context.<key>` | State persisted by `{% context %}` on an earlier render |
| tag parameters | Initial render only — absent on every reload |

The container the platform wraps around your markup is a bare wrapper with no styling hooks you
can add to, and it is laid out as `display: contents`, so it is not a positioning context, a flex
item, or a grid item. If you need an element to target or position, render one yourself as the
component's own root.

## What a reload re-renders

A reload is a **full storefront request**, not a template-only re-evaluation. Consequences that
matter:

- The theme-wide Liquid controller (`controllers/theme`) runs its before/after/final phases again. Anything expensive there is paid on every reload. See `storeconnect-controllers`.
- `current_cart`, `current_customer`, `current_store`, and the rest of the global Drops are re-resolved for the current request, which is why a reload sees new server state.
- Only the component template is rendered. The page, the layout, and the site shell are not.
- The response replaces the whole container element. Everything inside it is destroyed and rebuilt: DOM nodes, event listeners bound to those nodes, inline scripts, focus, and the scroll position of any scrollable element inside it.
- The replacement is inserted as a parsed HTML fragment, so **no `<script>` in it ever executes** — not inline, not `src`. A `{% require %}` that only appears inside the component emits a script tag that never loads.

## Carrying state across a reload

Tag parameters are gone on a reload. `{% context %}` is how a component remembers. It merges into
whatever was persisted before, and it is only valid inside a component template — used anywhere
else it raises a Liquid syntax error.

Persist identifiers, re-resolve the record. This is the pattern the base theme uses for its order
summary:

```liquid
{% comment %} components/example/summary.liquid {% endcomment %}
{% liquid
  default source: nil

  if source == nil
    # Reload render: parameters are gone, rebuild from the persisted identifier.
    query "order" as results, s_c__sc_id__c: context.source_id
    if results.size > 0
      assign source = results.first | cast: "Order"
    endif
  else
    # First render: persist only what is needed to find it again.
    context source_id: source.id
  endif
%}

{% unless source == nil %}
  <section data-example-summary>
    <h2>{{ "example.summary.heading" | t }}</h2>
    {% render "shared/order_total", source: source %}
  </section>
{% endunless %}
```

Rules that make this safe and correct:

- Store IDs and non-secret flags. Never customer PII, prices you intend to trust, entitlements, or credentials — persisted context leaves the server and comes back.
- Re-scope every re-query by store, and for customer-owned records by the authenticated customer. Treat the identifier as untrusted input, because a value that has been to the browser and back is exactly that.
- Guard the empty case. A record can be deleted, unpublished, or fall out of the customer's visibility between the first render and the reload; render nothing or a neutral message, not a broken block.

Use `reloaded` for work that must happen only once. The base theme's cart menu decides on the first
render whether express-payment wallets belong on this page, records that decision in context, and
on later reloads reads the decision instead of recomputing it:

```liquid
{% unless reloaded == true %}
  {% if current_request.path == current_store.cart_path %}
    {% context show_extras: false %}
  {% else %}
    {% context show_extras: true %}
  {% endif %}
{% endunless %}

{% if context.show_extras == true %}
  {% render "example/extras" %}
{% endif %}
```

## lazy and defer

|  | Initial HTML | Loads itself | Needs `reload:` | Use for |
|---|---|---|---|---|
| neither | Full render | — | no | Anything above the fold that must be in the first paint (and in the HTML crawlers see) |
| `defer: true` | Placeholder | Yes, immediately after registration | no | A region that is slow to render or below the fold: shipping rates, recommendations, stock lookups |
| `lazy: true` | Empty | No | **yes** | Content only revealed on demand: a drawer body, a wishlist panel, a modal's contents |

`lazy: true` with no `reload:` is dead markup — it renders nothing and has no way to ever load.
Once a lazy or deferred component has loaded, it behaves like a normal component: later events in
its `reload:` list refresh it.

Deferred content is not in the server-rendered HTML, so never `defer:` or `lazy:` a region that
carries the page's primary content, headings, prices, or links you need indexed.

## Triggering a reload

The listener is on `document` and matches components by event name, so:

```js
// Simplest and always correct.
document.dispatchEvent(new CustomEvent('sc.cart-updated'))

// From inside a component, only with bubbles: true.
el.dispatchEvent(new CustomEvent('sc.cart-updated', { bubbles: true }))
```

- The name in `reload:` and the name you dispatch must match exactly.
- Every component listing that event reloads, wherever it is on the page.
- Dispatch only after the mutation has actually succeeded. A reload on the failure path shows the customer unchanged content and no explanation.
- Repeated dispatches for the same container within a short window are coalesced by the client, and a dispatch that arrives while that container's request is already in flight can be dropped. Do not use rapid-fire events as a queue: debounce at the source and dispatch once when the interaction settles.
- Custom names are fine and are what production themes use. Namespace them so they cannot collide with the platform's (`example-wishlist-updated`). Prefer hyphens over dots: a dotted name works with `reload:` but cannot be bound declaratively in Alpine, which reads dots as modifiers. Keep event details free of customer or secret data — anything on the page can read them.

If an event's `detail.data` carries `alert`, `notice`, or `flash` (the shape a JSON form response
returns), the platform forwards it to the theme's message events for you. That is why a remote form
plus a reload event surfaces server messages with no extra code.

## The shipped event names

There is no platform-level event registry. These are the names the shipped base theme actually
dispatches or consumes — verify against the installed theme, because a name that nothing dispatches
silently never fires.

| Event | Dispatched by | Consumed by |
|---|---|---|
| `sc.cart-updated` | The base theme's cart form (remote, on success) and the payment form when it refreshes after an error | `reload:` lists on cart, cart menu, order summary, delivery and payment components |
| `sc.voucher-applied` | The base theme's voucher apply forms (remote, on success) | `reload:` lists on vouchers, totals, and the payment step |
| `sc.voucher-removed` | The base theme's voucher remove form (remote, on success) | as above |
| `sc.notice` | The reload machinery, from a form response's notice/flash | The theme's flash script, which writes `event.detail.message` into its notice region |
| `sc.alert` | The reload machinery, from a form response's alert/flash | The theme's flash script, which writes `event.detail.message` into its alert region |
| `store-connect.payment-processing-start` / `-end` | The payment form around a payment attempt | The payments script, to disable and re-enable the payment tabs. Note the different prefix |

Do not confuse these DOM events with `current_events` and `{% process_event %}`, which are the
server-side analytics event stream rendered into the page head.

## Remote forms: the loop with no JavaScript

The cleanest way to mutate state and refresh a region is to let the rendered form do it. This is the
whole loop, and it is how the base theme's live cart works:

```liquid
{% comment %} components/example/cart.liquid {% endcomment %}
{% form "cart", remote: true, data-type: "json", data-submit-on-change: true,
   data-success: "sc.cart-updated", data-error: "example-cart-failed" %}
  {% render "shared/cart/items", source: current_cart, extended: true %}
  {% render "shared/cart/checkout_button" %}
{% endform %}
```

```liquid
{% comment %} elsewhere on the page {% endcomment %}
{% component "example/cart", reload: "sc.cart-updated" %}
{% component "example/cart-badge", reload: "sc.cart-updated" %}
```

| Attribute | Effect |
|---|---|
| `remote: true` | Submits in the background instead of navigating |
| `data-type: "json"` | Asks for the JSON response, so messages come back as data |
| `data-success:` | On success, this event name is dispatched on `document` with `detail: { data, status, xhr, form }` |
| `data-error:` | Same on failure — always set it, or failures are silent |
| `data-submit-on-change: true` | The base theme's quantity stepper submits the form when a quantity changes |

Keep the form's generated hidden fields intact. The JSON response for a form usually contains a
`redirect` path that this flow deliberately ignores: the component reload is what updates the page.

**`remote: true` only works on some form types.** Most registered forms — including `add-to-cart`,
`login`, `register`, `apply-promo-code`, the checkout steps, and `custom-form` — ignore it and
navigate anyway. `references/json-api.md` has the verified list and the manual `fetch` you need for
the others.

## JavaScript that survives a reload

Two techniques, in order of preference.

**1. Delegate from an ancestor outside the component.** Nothing to re-bind, because the listener is
never destroyed. Use this for clicks, changes, and submits.

```js
// Loaded once as a theme asset from the layout or page.
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-example-action]')
  if (!trigger) return
  event.preventDefault()
  handle(trigger)
})
```

**2. Re-initialize on DOM change**, for things that need per-element setup — sliders, maps,
third-party widgets. The base theme runs a single mutation observer and calls every registered
callback with each newly added node. Register at the top level of a head-loaded asset so you also
receive the initial-load pass:

```js
window.StoreConnect = window.StoreConnect || {}
window.StoreConnect.ObserverCallbacks = window.StoreConnect.ObserverCallbacks || []
window.StoreConnect.ObserverCallbacks.push(initExampleWidgets)

function initExampleWidgets(node) {
  if (!node.querySelectorAll) return
  node.querySelectorAll('[data-example-widget]').forEach((el) => {
    if (el.dataset.exampleWidgetReady === 'true') return // idempotency guard
    el.dataset.exampleWidgetReady = 'true'
    buildWidget(el)
  })
}

// Cover the case where this asset loads after the initial pass has run.
initExampleWidgets(document)
```

Four traps, each observed in production theme code:

- **`DOMContentLoaded` only.** A `DOMContentLoaded` initializer runs once and never sees a reloaded component, so the widget is dead after the first update. This is the single most common cause of "it worked, then it stopped".
- **No idempotency guard.** A node can be visited more than once. Without the `data-*` flag above you get duplicate listeners and doubled actions.
- **Registering a `document` listener inside the re-init callback.** That adds another document listener on every reload and they accumulate forever. Register document-level listeners once at module scope.
- **Re-initializing by resetting state.** An initializer that "activates the first tab" on every mutation will yank the customer back to tab one whenever any component anywhere reloads. Scope the re-init to the node you were handed and preserve user-set state.

To carry client state across a reload, render it into the component as data and read it back after
each replacement — an attribute is the safe carrier, because `dataset` decodes HTML entities and a
`<script>` block does not:

```liquid
<div data-example-lines="{{ line_summary | json | escape }}"></div>
```

```js
const el = node.querySelector('[data-example-lines]')
if (el) applyLines(JSON.parse(el.dataset.exampleLines))
```

## Loading, error, focus and scroll

The platform gives you a placeholder for `defer:` only. Reloads have no built-in loading state, no
error state, and no focus management. All four are yours:

- **Loading.** Show the indicator when the event is dispatched, not when the response arrives — the customer needs feedback during the round trip. Put the indicator *inside* the component and the replacement clears it for you; put it outside and you must clear it yourself.
- **Error.** A failed reload leaves the old content in place with no visible signal, which reads as "nothing happened". For a mutation, use the form's `data-error:` event to show a message.
- **Focus.** If the focused element was inside the container, focus is lost to the document body. If a control inside the component starts the update, put focus somewhere stable outside it first, or restore focus by a stable selector after the replacement.
- **Announcement.** Put the live region *outside* the component so it is not destroyed by the replacement, and give it `aria-live="polite"`. The base theme's own flash region has no `aria-live`; add it in your theme.
- **Scroll.** The container is replaced, so the scroll offset of a scrollable element inside it resets. Keep the scroll container outside the component, or restore the offset after the swap.

```html
<!-- Outside every reloadable component, so the replacement never destroys it. -->
<p aria-live="polite" data-example-status></p>
<div data-example-cart-region aria-busy="false">
  {% component "example/cart", reload: "sc.cart-updated" %}
</div>
```

```js
const region = () => document.querySelector('[data-example-cart-region]')
const status = () => document.querySelector('[data-example-status]')

// Busy as soon as the reload is requested.
document.addEventListener('sc.cart-updated', () => {
  region()?.setAttribute('aria-busy', 'true')
})

// Announce once the replacement has actually landed.
window.StoreConnect = window.StoreConnect || {}
window.StoreConnect.ObserverCallbacks = window.StoreConnect.ObserverCallbacks || []
window.StoreConnect.ObserverCallbacks.push((node) => {
  if (!node.closest?.('[data-example-cart-region]')) return
  region().setAttribute('aria-busy', 'false')
  status().textContent = 'Cart updated'
})
```

## Caching a component

Never wrap a `{% component %}` container in `{% cache %}`. A cached container may render but stop
updating for another visitor, and customer-specific content can be served in the wrong response.

Use one of these safe shapes:

1. Keep the component outside the cached fragment and cache only stable public markup around it.
2. Put an expensive, stable, read-only fragment inside the component template and cache only that
   fragment.
3. Leave the region uncached when it contains live, customer-specific, price, cart, checkout, or
   payment output.

For any inner fragment, include every output-changing record and render parameter in `items:`.
Do not use a cache key as permission to cache customer-specific output.

### Forms inside a cached fragment

Never cache a fragment containing a `{% form %}`. Preserve every platform-generated field and keep
the complete form, its validation output, and its submitted values outside the cached region.
Cache only adjacent stable, public, read-only presentation.

Do not treat an existing theme pattern as permission. Verify the result in two separate clean
browser sessions, including an anonymous session and a signed-in session when authentication can
change the surrounding page.

## Keeping reloads cheap

- **One component per region, not per element.** Five components listening to `sc.cart-updated` are five requests, each re-running the theme controller. One component covering the region is one request.
- **List events, do not chain them.** `reload: "a b c"` on each component costs one round trip. Listening for `a` in order to dispatch `b` to reload a second component costs two, in series.
- **Keep the payload small.** The response is the component's entire rendered HTML. A component that exists to update a total should not contain the line-item list.
- **Cache inside, never outside.** `{% cache %}` around the component is forbidden; `{% cache %}` around an expensive fragment *inside* the component template is the right optimization. Include every varying entity in `items:` and never cache customer-specific or price-specific output. See `storeconnect-debug-performance`.
- **`defer: true`** keeps a slow region off the first paint. **`lazy: true`** avoids rendering content nobody opened.
- **Debounce at the source.** 200–300 ms on text input; dispatch once after the interaction settles rather than once per keystroke.
- **Paginate inside a component** exactly as you would on a page. A reload does not make an unbounded collection cheap.

## Failure catalog

| Symptom | Cause | Fix |
|---|---|---|
| Renders correctly but never updates; console logs a component reload error | The component container was cached | Move the component outside the `{% cache %}`, or cache a stable read-only fragment inside the component template instead — see [Caching a component](#caching-a-component) |
| One shopper sees another's cart, price, or account content | Customer-specific output was cached | Remove that output from the cached region. This is a data leak, not staleness |
| A form shows a value or validation error the visitor never submitted, or a submission fails unexpectedly | A fragment containing a `{% form %}` was cached | Move the complete form outside the cached fragment — see [Forms inside a cached fragment](#forms-inside-a-cached-fragment) |
| Nothing renders and nothing ever loads | `lazy: true` with no `reload:` | Add `reload:` and dispatch the event, or use `defer: true` |
| Works on first paint, dead after the first update | Inline `<script>` inside the component, or a `{% require %}` that only appears there | Load the asset from the layout or page and re-initialize on DOM change, or delegate from an ancestor |
| Reloads but shows blanks, zeros, or defaults | Tag parameters are not passed on a reload | Persist identifiers with `{% context %}` and re-resolve, guarding the empty case |
| `{% context %}` raises a Liquid syntax error | Used outside a component template | Only use it in `components/*.liquid` |
| Event fires, no component reloads | Name mismatch, or dispatched on an element without `bubbles: true` | Dispatch on `document`; compare the string to the `reload:` list character by character |
| One handler fires two, three, four times | Listeners re-bound on every re-initialization | Add an idempotency flag, or delegate from a stable ancestor |
| Document listeners grow without bound | A `document.addEventListener` inside a re-init callback | Move it to module scope |
| Focus jumps to the top of the page after an update | The focused element was inside the replaced container | Move or restore focus explicitly |
| A scrollable list inside the component jumps to the top | The scroll container was replaced | Move the scroll container outside the component |
| Rapid interactions lose an update | A dispatch arriving during an in-flight reload for the same container can be dropped | Debounce at the source and dispatch once when the interaction settles |
| Component shows one customer's data to another | Context identifier trusted without re-authorization | Re-scope every query by store and authenticated customer |
| Update succeeds but the customer sees nothing | No loading state, no live region | Add both — see [Loading, error, focus and scroll](#loading-error-focus-and-scroll) |
