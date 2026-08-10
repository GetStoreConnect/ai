# StoreConnect JSON page responses

Storefront routes are content-negotiated: the same URL that serves a page returns that page as data
when asked for JSON. Use this for quick views, live search, partial navigation, and supported remote
form flows. Read `SKILL.md` first for the rules that must not be broken.

## Contents

- [Two response shapes, not one](#two-response-shapes-not-one)
- [Requesting a page](#requesting-a-page)
- [Mutations: submit the rendered form](#mutations-submit-the-rendered-form)
- [Which forms can submit remotely](#which-forms-can-submit-remotely)
- [Superseding an in-flight request](#superseding-an-in-flight-request)
- [Swapping HTML without breaking the page](#swapping-html-without-breaking-the-page)
- [HTMX](#htmx)
- [Security boundary](#security-boundary)

## Two response shapes, not one

This is the trap that breaks naive clients. `Accept: application/json` does **not** produce a single
uniform envelope across the storefront.

| Route | Body |
|---|---|
| Product, category, search, cart, account, order, location, home | A JSON object: `{ "html": …, "flash": …, "alert": …, "notice": … }` |
| A CMS content page or an article (the catch-all page routes) | The **rendered HTML itself**, served with an `application/json` content type. `JSON.parse` throws on it |
| Any route that redirects (most mutations) | A JSON object: `{ "redirect": …, "flash": …, "alert": …, "notice": …, "data": … }` |

`flash`, `alert`, and `notice` exist in the envelope but are normally `null` on a plain page GET;
they carry content on mutations. `flash` is an object or an array of pairs keyed by `notice` and
`alert`. `data` is form-specific and version-dependent — treat any key beyond `html`, `redirect`,
`flash`, `alert`, and `notice` as unstable.

So parse defensively. Read the body as text, try to parse it, and fall back to treating it as
markup:

```js
async function fetchPageFragment(url, { signal } = {}) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
    signal,
  })

  if (!response.ok) return { ok: false, status: response.status }

  const body = await response.text()
  let payload
  try {
    payload = JSON.parse(body)
  } catch {
    return { ok: true, html: body } // content page or article: raw HTML
  }

  if (typeof payload === 'string') return { ok: true, html: payload }
  return { ok: true, ...payload }
}
```

Always keep full navigation as the fallback. If the request fails, or returns a `redirect`, hand the
browser the URL rather than inventing a recovery:

```js
const result = await fetchPageFragment(url)
if (!result.ok) return window.location.assign(url)
if (result.redirect) return window.location.assign(result.redirect)
```

## Requesting a page

- `Accept: application/json` on a normal GET. No custom header, no query parameter, no `.json` suffix on a page path — a page whose *path* ends in `.json` is a different thing (a content page serving its own body as JSON).
- `credentials: 'same-origin'` so the cart and session apply.
- `html` is the page body without the site shell: no `<html>`, no header, no footer, and no `<script>` you can rely on running. It does include whatever inner layout the page selected with `{% layout %}`.

## Mutations: submit the rendered form

Do not construct routes or manual non-GET requests. Render the platform's form
and submit that generated form unchanged, using normal browser submission or the
documented `remote: true` behavior when the form supports it. The generated
destination, method, and protected fields stay correct across releases.

Rules:

- **Preserve all generated form fields.** Never remove, rename, inspect, or
  reconstruct protected fields.
- **Never construct authentication headers or copy protected values out of the
  page.** If a form does not support remote submission, use its normal
  navigation flow or a currently documented StoreConnect mechanism.
- **Dispatch a documented reload event only after the supported form flow
  reports success.** On failure, show the platform message and leave the page
  alone.
- **Never `eval` a response body**, and never inject a response's `<script>` into the page to make it run.

## Which forms can submit remotely

`{% form … remote: true %}` is the supported background-submission mechanism,
because the theme dispatches the configured `data-success:` / `data-error:`
events for you. It only works on form types that document support for it:

| Honors `remote: true` | Always full navigation |
|---|---|
| `cart`, `apply-voucher`, `apply-provider-voucher`, `remove-voucher`, `privacy-accept-all`, `privacy-reject-all`, `privacy-settings` (and `geolocation-dismiss`, which is always remote) | Every other registered form, including `add-to-cart`, `add-bundle-to-cart`, `login`, `register`, `apply-promo-code`, the checkout steps, and `custom-form` |

On any form in the right-hand column, `remote: true` is silently ignored and the
submit navigates. Keep that normal navigation behavior unless the current base
theme or documentation provides another supported mechanism. Re-check the
installed release before relying on this split.

## Superseding an in-flight request

For type-ahead search, live filters, and anything a customer can retrigger quickly, cancel the
previous request instead of racing it. Out-of-order responses are how a filter ends up showing the
results for a query the customer already changed.

```js
let controller = null

async function search(term) {
  controller?.abort()
  controller = new AbortController()
  try {
    return await fetchPageFragment(buildUrl(term), { signal: controller.signal })
  } catch (error) {
    if (error.name === 'AbortError') return null
    throw error
  }
}
```

Pair it with a debounce at the input (200–300 ms) so you are not opening a request per keystroke.

## Swapping HTML without breaking the page

The base theme's `<main id="SC-Main">` contains the flash region and the privacy region **as well as**
the page body, and the JSON `html` is the page body only. Replacing that element's `innerHTML`
deletes the flash containers, after which every server message silently stops appearing.

Give yourself a swap target that holds nothing but the page body. In a theme layout:

```liquid
<main id="SC-Main">
  {% render "flash" %}
  {% render "privacy" %}
  <div data-example-page tabindex="-1">{{ body_content }}</div>
</main>
```

```js
const target = document.querySelector('[data-example-page]')
if (result.html && target) {
  target.innerHTML = result.html
  history.pushState({}, '', url)
  target.focus() // needs tabindex="-1"; a bare <h1> is not focusable
}
```

- Keep the header, footer, flash region, and live regions outside the swap target.
- Scripts in the returned HTML never execute. Re-initialize theme-owned modules against the new subtree instead — see `references/component-reload.md`.
- Move focus into the new content. Only focusable elements accept focus, so give the region `tabindex="-1"` and focus the region itself rather than a heading.
- Announce the change in an `aria-live="polite"` region that lives outside the swap target.
- Handle `popstate` or the back button leaves the customer on a stale fragment.
- Opt out of partial navigation for checkout, payment, downloads, external links, and anything with provider-initialized JavaScript. Those need a real page load.

## HTMX

HTMX works with this API, and it does not conflict with the component reload system: components
listen on `document` for their own events and replace themselves, while HTMX swaps whatever you
target. Keep the two from targeting the same subtree.

The JSON envelope is an object, not markup, so HTMX cannot swap it directly. The simplest correct
setup is to let HTMX request the ordinary HTML response and select the fragment out of it:

```html
<a href="{{ page.path }}"
   hx-get="{{ page.path }}"
   hx-target="[data-example-page]"
   hx-select="[data-example-page]"
   hx-swap="outerHTML"
   hx-push-url="true"
   hx-indicator="[data-example-loading]">{{ page.name | escape }}</a>
```

- If you do want the JSON envelope (to read `flash` / `alert` / `notice` alongside the markup), add `hx-headers='{"Accept":"application/json"}'` and unwrap it in an `htmx:beforeSwap` handler, replacing `event.detail.serverResponse` with the `html` value. Do not mix that with `hx-select`.
- Set `hx-boost="false"` on links that must be full navigations: checkout, payment, downloads, external hosts.
- Always set `hx-indicator` — otherwise the customer gets no feedback.
- Never re-target a `{% component %}` container with HTMX. The component owns its own replacement; two owners means one of them loses.

## Security boundary

- Same-store URLs only. Do not fetch another origin from theme code without the store owner's explicit decision.
- Everything in the returned HTML was rendered by your own templates, so the escaping obligation is upstream: escape in Liquid at render time (`| escape`, `| url_encode`, `| json`), not in JavaScript afterward.
- Do not render into the fragment anything the shopper is not entitled to see. A JSON page response is a normal page request and is authorized like one — but a template that renders data the page never showed (internal fields, cost prices, other customers' records, unpublished content) now exposes it to anyone who can request the URL. Scope every query by store, and customer-owned data by the authenticated customer.
- Never put credentials, session material, payment values, or provider tokens in a fetched fragment, a query string, a log line, or an event detail.
- Do not enumerate or probe undocumented interfaces. Use only the documented component and page behavior.
- Use `store.example.com` and placeholder identifiers in anything you write down.
