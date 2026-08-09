# StoreConnect frontend interaction patterns

Working starting points for the interactions themes are asked for most. Each one keeps the server
authoritative and uses the component reload system rather than fighting it. Read `SKILL.md` for the
rules, `references/component-reload.md` for the reload mechanics, `references/json-api.md` for
fetching pages as data.

## Contents

- [Framework choice](#framework-choice)
- [Cart drawer](#cart-drawer)
- [Quick view](#quick-view)
- [Live search and filters](#live-search-and-filters)
- [Progressive page navigation](#progressive-page-navigation)
- [Alpine with components](#alpine-with-components)
- [Header, media, and motion](#header-media-and-motion)

## Framework choice

| Need | Use |
|---|---|
| A standard commerce theme | Liquid, components, and small delegated-event modules. This is the default and it is enough for most stores |
| Local UI state: drawers, dialogs, tabs, disclosure | Alpine, or ~20 lines of vanilla JS. No server round trip |
| Declarative partial navigation across many links | HTMX — see `references/json-api.md` |
| One genuinely stateful feature: a configurator, a seating map, a booking calendar | A framework island scoped to that feature only |

Keep catalog, cart, pricing, customer permissions, checkout, and payment on the server-rendered
path in every case. A framework island renders UI; it does not become the source of truth for
commerce state.

## Cart drawer

Split the concerns: the client owns open/closed, a component owns the cart body. The body then stays
correct after an add, a quantity change, or a voucher without the drawer knowing anything about
carts.

```liquid
<div data-example-drawer>
  <button type="button"
          data-example-drawer-open
          aria-expanded="false"
          aria-controls="example-drawer-panel">
    {{ "example.cart.open" | t }}
    {% component "example/cart-badge", reload: "sc.cart-updated" %}
  </button>

  <div id="example-drawer-panel"
       role="dialog"
       aria-modal="true"
       aria-label="{{ 'example.cart.label' | t }}"
       hidden
       tabindex="-1">
    <button type="button" data-example-drawer-close>{{ "example.cart.close" | t }}</button>
    {% component "example/cart",
       reload: "example-cart-open sc.cart-updated sc.voucher-applied sc.voucher-removed",
       lazy: true %}
    <a href="{{ current_store.checkout_path }}">{{ "example.cart.checkout" | t }}</a>
  </div>
</div>
```

```js
// One delegated listener for the whole page. Survives every component reload.
let lastTrigger = null

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-example-drawer-open]')) return openDrawer(event)
  if (event.target.closest('[data-example-drawer-close]')) return closeDrawer()
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeDrawer()
})

function openDrawer(event) {
  lastTrigger = event.target.closest('[data-example-drawer-open]')
  const panel = document.getElementById('example-drawer-panel')
  panel.hidden = false
  lastTrigger.setAttribute('aria-expanded', 'true')
  panel.focus()
  // The body is lazy. Its own dedicated event renders it without also
  // reloading every other component that listens for sc.cart-updated.
  document.dispatchEvent(new CustomEvent('example-cart-open'))
}

function closeDrawer() {
  const panel = document.getElementById('example-drawer-panel')
  if (panel.hidden) return
  panel.hidden = true
  lastTrigger?.setAttribute('aria-expanded', 'false')
  lastTrigger?.focus() // restore focus, or the keyboard user is stranded
}
```

Notes that decide whether this works:

- `lazy: true` means the drawer body costs nothing until it is opened. It **requires** the `reload:` list; without it the panel stays empty forever. Give it a dedicated open event so opening the drawer does not trigger every `sc.cart-updated` listener on the page.
- To open the drawer after a successful add-to-cart, dispatch `sc.cart-updated` (so all cart-dependent regions refresh) and then your own open event. Never put cart contents or customer data in an event detail.
- If the generated form does not support `remote: true`, keep its normal
  navigation flow. Do not replace it with a hand-built request merely to open
  the drawer. Dispatch reload/open events only after a currently documented
  supported form flow reports success.
- Keep the trigger button, the badge, and the focus-restore target **outside** the reloadable body. Anything inside it is destroyed on every reload, which is also why focus must be restored to the trigger and not to something in the panel.
- Trap Tab inside the panel while it is open, and set `inert` or `aria-hidden` on the rest of the page. A `role="dialog"` with `aria-modal` that does not actually contain focus is worse than no dialog at all.

## Quick view

Fetch the product page as data, take a known region out of it, and put that in a dialog. Keep
add-to-cart as the rendered form so pricing, options, and validation stay server-owned.

```js
async function openQuickView(url) {
  const dialog = document.getElementById('example-quickview')
  const body = dialog.querySelector('[data-example-quickview-body]')
  body.setAttribute('aria-busy', 'true')
  dialog.showModal()

  const result = await fetchPageFragment(url) // references/json-api.md
  if (!result.ok || !result.html) {
    dialog.close()
    return window.location.assign(url) // full page is always the fallback
  }

  // Parse into a detached document; nothing in it executes.
  const doc = new DOMParser().parseFromString(result.html, 'text/html')
  const region = doc.querySelector('[data-example-product]')
  body.replaceChildren(...(region ? region.childNodes : doc.body.childNodes))
  body.removeAttribute('aria-busy')
}
```

- Select a **stable region** the theme renders (`[data-example-product]`), not the whole body. Whole-body insertion drags in duplicate IDs, duplicate landmarks, and a second `<h1>`.
- Scripts in the fragment do not run, so anything interactive inside the quick view must be handled by delegated listeners already on the page. That rules out third-party widgets that self-initialize on script load.
- Always render a link to the full product page. A dialog is not a substitute for a canonical, indexable, shareable URL.
- `<dialog>` gives you Escape-to-close, the backdrop, initial focus, and focus containment for free. If you hand-build the dialog you owe all four.
- Dispatch `sc.cart-updated` only after the add succeeds, and only then close or update the dialog.

## Live search and filters

Render the inputs from the platform's own search description so the field names, options, and
selected values match the store, and submit to the search's own path. Then the no-JavaScript case is
a working GET form and the JavaScript is pure enhancement.

```liquid
{% comment %} current_search exists only on search and listing pages. {% endcomment %}
{% if current_search %}
  {%- comment %}
    A GET form discards the action's query string, and current_search.path carries one.
    Strip it and render anything you must preserve as a form control instead.
  {% endcomment %}
  {%- assign search_action = current_search.path | split: "?" | first %}
  <form action="{{ search_action }}" method="get" data-example-filters>
    {%- assign sort_field = current_search.fields.sort %}
    <input type="hidden" name="{{ sort_field.name }}" value="{{ sort_field.value }}">

    {%- assign term_field = current_search.fields.q %}
    <label for="{{ term_field.id }}">{{ "example.search.term" | t }}</label>
    <input id="{{ term_field.id }}"
           type="search"
           name="{{ term_field.name }}"
           value="{{ current_search.term | escape }}"
           data-example-filter-input>

    {%- comment %} Field names already carry their group and [] — never append either. {% endcomment %}
    {%- assign brands = current_search.fields.filters.brands %}
    {%- unless brands == blank or brands.options.size == 0 %}
      <fieldset>
        <legend>{{ "example.search.brands" | t }}</legend>
        {%- for option in brands.options %}
          <label for="{{ option.id }}">
            <input id="{{ option.id }}"
                   type="checkbox"
                   name="{{ brands.name }}"
                   value="{{ option.value | escape }}"
                   {% if brands.value contains option.value %}checked{% endif %}
                   data-example-filter-input>
            {{ option.label | escape }}
          </label>
        {%- endfor %}
      </fieldset>
    {%- endunless %}

    <noscript><button type="submit">{{ "example.search.apply" | t }}</button></noscript>
  </form>

  <div data-example-results tabindex="-1">
    {% render "example/search_results", search: current_search %}
  </div>
  <p aria-live="polite" data-example-results-status></p>
{% endif %}
```

```js
const DEBOUNCE_MS = 250
let timer = null
let controller = null

document.addEventListener('input', (event) => {
  if (!event.target.closest('[data-example-filter-input]')) return
  showBusy()                                  // feedback now, not when the response lands
  clearTimeout(timer)
  timer = setTimeout(runSearch, DEBOUNCE_MS)  // one request per pause, not per keystroke
})

async function runSearch() {
  const form = document.querySelector('[data-example-filters]')
  const url = `${form.action}?${new URLSearchParams(new FormData(form))}`

  controller?.abort()                         // discard the superseded request
  controller = new AbortController()

  let result
  try {
    result = await fetchPageFragment(url, { signal: controller.signal })
  } catch (error) {
    if (error.name === 'AbortError') return
    return window.location.assign(url)
  }
  if (!result.ok || !result.html) return window.location.assign(url)

  const doc = new DOMParser().parseFromString(result.html, 'text/html')
  const fresh = doc.querySelector('[data-example-results]')
  const target = document.querySelector('[data-example-results]')
  if (!fresh) return window.location.assign(url)

  target.innerHTML = fresh.innerHTML
  history.replaceState({}, '', url)           // replace, not push: filtering is not navigation
  clearBusy()
  announce(target.querySelector('[data-example-result-count]')?.textContent || 'Results updated')
}

function showBusy() {
  document.querySelector('[data-example-results]').setAttribute('aria-busy', 'true')
}

function clearBusy() {
  document.querySelector('[data-example-results]').removeAttribute('aria-busy')
}

function announce(message) {
  document.querySelector('[data-example-results-status]').textContent = message
}
```

Verified surface for the Liquid side:

| Available on a search or listing page | Meaning |
|---|---|
| `current_search.fields` | **Nested** map of search fields. Top level holds `q`, `sort`, `per_page`, and (on a global search) `source` / `sources`; product filters sit under `filters` — `filters.brands`, `filters.tags`, `filters.on_sale`, `filters.in_stock`, `filters.price.min` / `.max`. The set varies by search type and store configuration, so select the keys you need and guard each with `== blank` |
| `current_search.path` / `.url` | Path and URL that re-run this search — submit here |
| `current_search.term`, `.sort`, `.count`, `.per_page`, `.type` | The active query (the `q` field's value), ordering, total, page size, and result type (`products`, `articles`, `pages`, `locations`) |
| `current_search.results.products` / `.articles` / `.pages` / `.locations` | Paginated result collections |
| `field.name` | The complete `<input name>`, including the group path and a trailing `[]` for multi-value fields. Never append either yourself |
| `field.id`, `field.label`, `field.value`, `field.options` | Element id, label, current value list (test with `field.value contains option.value`), and the option collection |
| `option.id`, `option.label`, `option.value` | Per-option element id, display label, and submitted value |

- A GET form ignores the query string on its `action`, so strip it and render whatever must survive (sort, source, page size) as hidden inputs. Otherwise the first filter change silently resets the search's own parameters.
- Debounce, and cancel. Without `AbortController` an earlier response can land after a later one and show results for a query the customer has already changed.
- `replaceState`, not `pushState`, for filter changes — otherwise Back becomes a walk through every intermediate filter state.
- Announce the new result count in a live region. A silently swapped grid is invisible to a screen reader.
- Paginate the results template. A filter that renders an unbounded collection turns every keystroke into an expensive query. See `storeconnect-debug-performance`.
- A filter region is a good candidate for a `{% component %}` instead, if the filters are submitted as a form the platform renders. Choose the fetch approach when you need the URL to stay shareable and the markup is yours.

## Progressive page navigation

Full detail and the swap-target trap are in `references/json-api.md`. The shape of it:

- Intercept clicks on same-store links only; let modified clicks (Ctrl, Cmd, Shift, middle button) through.
- Fetch with `Accept: application/json`, swap into a region that contains **only** the page body, and `pushState`.
- Restore on `popstate`, move focus into the new region, announce the change.
- Opt out for checkout, payment, downloads, external hosts, and anything with provider-initialized JavaScript.
- Re-initialize theme modules against the new subtree; scripts in the response never run.

## Alpine with components

Alpine and the reload system coexist as long as each owns different DOM. The division that works:
**Alpine owns state outside the component, the component owns markup inside itself.**

```liquid
<div x-data="{ open: false }" @example-drawer-open.window="open = true">
  <button type="button" @click="open = true" :aria-expanded="open.toString()">
    {{ "example.cart.open" | t }}
  </button>

  <div x-show="open" x-cloak role="dialog" aria-modal="true">
    <button type="button" @click="open = false">{{ "example.cart.close" | t }}</button>
    {% component "example/cart", reload: "sc.cart-updated", lazy: true %}
  </div>
</div>
```

- Alpine initializes on its own mutation observer, so `x-data` **inside** a component is re-initialized after each reload — and its state resets to the initial expression every time. Never keep state the customer set (an open accordion, a chosen tab) in an `x-data` inside a reloadable component. Hoist it to a wrapper outside.
- Do not put `x-data` on the component call itself; you cannot add attributes to the container the platform renders.
- **Alpine cannot listen for the dotted `sc.*` names declaratively.** Alpine splits an `x-on:` / `@` attribute on `.` to find its modifiers, so `@sc.cart-updated.window` binds the event `sc` with two modifiers it does not recognize, and nothing ever fires. Use hyphenated names for anything Alpine listens to (`@example-cart-open.window`), and bridge from the dotted platform names with a plain listener: `x-init="document.addEventListener('sc.cart-updated', () => refresh())"`.
- Load Alpine deferred from the theme's asset pipeline, once, from the layout. Alpine in an inline script inside a component will not run after a reload.

## Header, media, and motion

- Render the cart count from a reloadable component and put `aria-live="polite"` on a wrapper **outside** it, so the announcement region is not replaced along with the number.
- Navigation and drawer triggers are `<button type="button">` with `aria-expanded` and `aria-controls`, not links or divs.
- Give every image explicit dimensions or an aspect ratio. A component that reloads into a different image height reflows the page under the customer's cursor.
- Use the image URLs and `alt_text` the Drops expose. Do not construct media URLs by string manipulation.
- Eager-load only above-the-fold media; lazy-load everything else. Deferred and lazy components are not indexed and not in the first paint, so never hide primary content, headings, prices, or links in one.
- Respect `prefers-reduced-motion` for any transition you add, and `forced-colors` for anything that conveys state by color alone.
