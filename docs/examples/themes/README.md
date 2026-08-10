# Theme examples

Candidate starting points retained as non-production reference material. They
are not installed with any skill. Before reuse, establish
the source and license provenance of every asset/content fragment, re-test
drops, forms, fields, and routes against the target StoreConnect version, and
review the adapted result for the target store.

## minimal-theme/

A full-replacement theme skeleton: `layouts/theme.liquid` (system variables),
`pages/` (home, product, products, not_found), and `snippets/` (header,
footer). Stage and deploy reviewed files through the
connected StoreConnect tools, using each relative path without the extension
as its template key.

## patterns/

Focused recipes for the flows every store needs.

Filenames here are descriptive, not template keys — several recipes span more
than one base-theme template, and a few base-theme leaf names are ambiguous
(three different `results.liquid`, three different `menu.liquid`). The second
column is the base-theme template key to override when applying the recipe to a
real theme; deploy it under that key, not under the example's filename. Keys
carry no `.liquid` extension.

| File | Base theme template key | Shows |
|---|---|---|
| `add-to-cart.liquid` | `snippets/products/product/add_to_cart` | The add-to-cart form (`product:` option, no variant_id — variants are products), stock gating with `can_add_to_cart?`/`out_of_stock?`, variant-choice markup |
| `product-listing.liquid` | `pages/products` (cards: `snippets/products/results`) | `current_search.results.products` iteration, filters from `current_search.fields`, `{% paginate %}` + parts-based pagination nav |
| `navigation.liquid` | `snippets/menu` (header instance: `snippets/header/menu`) | Menu recursion with `menu_items`/`link_label`/`link_target`, hidden? checks, active state, a11y attributes |
| `component-cart.liquid` | `components/cart` | Reloadable cart component: the `cart` form with `cart_items[<id>][quantity]` inputs, `delete_path` removal, vouchers, correct totals accessors |
| `search.liquid` | `pages/search` | Multi-type results (`term`/`count`, per-type pagination) |
| `seo-meta-data.liquid` | `snippets/meta_data` | Full `meta_data` snippet override: title/description/canonical/OG + Organization JSON-LD |
| `llms-txt.liquid` | *(none — a content Page record with path `llms.txt`)* | AI-discoverability llms.txt served as a content page |

`components/cart` is the full cart view. Don't confuse it with
`components/cart-menu`, the header dropdown — both exist, and overriding the
wrong one is a silent no-op.

The full template key inventory (pages, snippets, blocks, layouts, components,
helpers) is in the `storeconnect-theme-development` skill's `theme-structure`
reference.

For interactive patterns (cart drawer, HTMX SPA navigation, quick view, live
filters), see the `storeconnect-components` skill's frontend-patterns
reference.
