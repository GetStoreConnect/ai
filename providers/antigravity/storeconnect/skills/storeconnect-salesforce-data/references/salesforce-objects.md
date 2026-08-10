# StoreConnect Salesforce objects for themes and content

Object and field API names for the content, theme, and navigation records a storefront is built
from. Names are given with the `s_c__` namespace as they appear in a customer org.
Confirm against the target org with `sf sobject describe` before a write - an org can be on an older
StoreConnect version, and admins can add their own validation rules.

## Contents

- [Relationship map](#relationship-map)
- [Required on create](#required-on-create)
- [Platform-managed fields](#platform-managed-fields)
- [Store](#store-s_c__store__c)
- [Page](#page-s_c__page__c)
- [Content Block](#content-block-s_c__content_block__c)
- [Menu and Menu Item](#menu-s_c__menu__c-and-menu-item-s_c__menu_item__c)
- [Theme records](#theme-records)
- [Article and Article Category](#article-s_c__article__c-and-article-category-s_c__article_category__c)
- [Taxonomy and Product Category](#taxonomy-s_c__taxonomy__c-and-product-category-s_c__product_category__c)
- [Style Block](#style-block-s_c__style_block__c)
- [Junction objects](#junction-objects)
- [Delete behavior](#delete-behavior)
- [Permissions](#permissions)

## Relationship map

```text
s_c__Store__c                          (required parent of most content objects)
├── s_c__Theme_Id__c ──> s_c__Theme__c  (a lookup, not ownership: one Theme can serve many Stores)
│                        ├── s_c__Theme_Template__c   (master-detail)
│                        ├── s_c__Theme_Asset__c      (master-detail)
│                        ├── s_c__Theme_Variable__c   (master-detail)
│                        └── s_c__Theme_Locale__c ──> s_c__Locale_Translation__c (master-detail)
├── s_c__Menu__c ──> s_c__Menu_Item__c
├── s_c__Page__c
├── s_c__Article_Category__c
├── s_c__Article__c
├── s_c__Taxonomy__c ──> s_c__Product_Category__c ──> s_c__Product_Category_Hierarchy__c
└── s_c__Style_Block__c

s_c__Content_Block__c        (no Store field - org-wide and shared)
├── s_c__Content_Blocks_Pages__c              ──> s_c__Page__c
├── s_c__Content_Blocks_Children__c           ──> s_c__Content_Block__c
├── s_c__Content_Blocks_Products__c           ──> Product2
├── s_c__Content_Blocks_Articles__c           ──> s_c__Article__c
└── s_c__Content_Blocks_Product_Categories__c ──> s_c__Product_Category__c

Product2                     (no Store field - reaches a store only through the taxonomy)
└── s_c__Products_Product_Categories__c ──> s_c__Product_Category__c ──> s_c__Taxonomy__c ──> Store
```

A product appears in a store only if it is joined to a Product Category whose Taxonomy belongs to
that Store. There is no direct product-to-store relationship.

## Required on create

Omitting one of these returns `REQUIRED_FIELD_MISSING`.

| Object | Required |
|---|---|
| `s_c__Page__c` | `s_c__Store_Id__c` |
| `s_c__Article__c` | `s_c__Store_Id__c`, `s_c__Title__c` |
| `s_c__Article_Category__c` | `s_c__Store_Id__c` |
| `s_c__Menu__c` | `s_c__Store_Id__c` |
| `s_c__Menu_Item__c` | `s_c__Menu_Id__c` |
| `s_c__Taxonomy__c` | `s_c__Store_Id__c` |
| `s_c__Product_Category__c` | `s_c__Taxonomy_Id__c` |
| `s_c__Style_Block__c` | `s_c__Store_Id__c` |
| `s_c__Content_Block__c` | `s_c__Template__c` |
| `s_c__Theme_Template__c`, `s_c__Theme_Asset__c`, `s_c__Theme_Variable__c` | `s_c__Key__c` (and the master-detail `s_c__Theme_Id__c`) |
| `s_c__Theme_Locale__c` | `s_c__Code__c` |
| `s_c__Locale_Translation__c` | `s_c__Key__c` (and `s_c__Theme_Locale_Id__c`) |
| `s_c__Custom_Data_Mapping__c` | `s_c__Object_API_Name__c`, `s_c__Field_API_Name__c` |
| `s_c__Media__c` | `s_c__File_Type__c` |
| Every `s_c__Content_Blocks_*__c` junction | the Content Block lookup and the other side's lookup |

## Platform-managed fields

Do not supply these. Supplying a value either fails or is silently overwritten.

**Auto-number `Name`** - supplying `Name` fails: `s_c__Theme_Template__c`, `s_c__Theme_Asset__c`,
`s_c__Locale_Translation__c`, `s_c__Custom_Data_Mapping__c`, and **every** junction object
(`s_c__Content_Blocks_*__c`, `s_c__Products_Product_Categories__c`,
`s_c__Articles_Article_Categories__c`, `s_c__Product_Category_Hierarchy__c`).

`Name` is a normal text field on `s_c__Store__c`, `s_c__Page__c`, `s_c__Content_Block__c`,
`s_c__Menu__c`, `s_c__Menu_Item__c`, `s_c__Article__c`, `s_c__Product_Category__c`,
`s_c__Taxonomy__c`, `s_c__Style_Block__c`, `s_c__Theme__c`, `s_c__Theme_Variable__c`,
`s_c__Theme_Locale__c`, and `s_c__Media__c`.

**Slugged from `Name` when left blank** - supply `Name` and let StoreConnect derive the rest, or set
the target field explicitly to control it:

| Object | Derived field | Source |
|---|---|---|
| `s_c__Page__c` | `s_c__Path__c`, `s_c__Slug__c` | `Name` |
| `s_c__Article__c` | `s_c__Path__c`, `s_c__Slug__c` | `Name` |
| `s_c__Product_Category__c` | `s_c__Path__c` | `s_c__Display_Name__c`, falling back to `Name` |
| `s_c__Menu__c` | `s_c__Identifier__c` | `Name` |
| `s_c__Menu_Item__c` | `s_c__Identifier__c` | `Name` |

**Composite uniqueness keys** - assigned on insert and update, and the source of every
`DUPLICATE_VALUE` you will see here:

| Field | Enforces |
|---|---|
| `s_c__Page__c.s_c__Unique_Store_Path__c` | one page per `s_c__Path__c` per store |
| `s_c__Article__c.s_c__Unique_Store_Path__c` | one article per path per store |
| `s_c__Article_Category__c.s_c__Unique_Store_Path__c` | one article category per path per store |
| `s_c__Menu__c.s_c__Unique_Store_Identifier__c` | one menu per identifier per store |
| `s_c__Menu_Item__c.s_c__Unique_Store_Identifier__c` | one menu item per identifier per store |
| `s_c__Product_Category__c.s_c__Unique_Taxonomy_Path__c` | one category per path per taxonomy |
| `s_c__Theme_Template__c` / `s_c__Theme_Asset__c`.`s_c__Unique_Theme_Key__c` | one key per theme |
| `s_c__Theme_Variable__c.s_c__Unique_Theme_Variable_Key__c` | one key per theme |
| `s_c__Theme_Locale__c.s_c__Unique_Theme_Code__c` | one locale per code per theme |
| `s_c__Store__c.s_c__Unique_Domain_Path__c` | one store per domain + path |
| `s_c__Custom_Data_Mapping__c.s_c__Unique_Custom_Data_Mapping_Key__c` | one mapping per object + field |

**`s_c__sC_Id__c`** is a stable unique external ID. It can support idempotent imports
when the field is createable for the running user. Two constraints:

- Never change it on an existing record.
- Describe the object as the running user and check the field is `createable` before
  building an upsert on it. If it is unavailable, key idempotency on a
  query-then-update against the object's supported unique field instead.

`s_c__Theme_Variable__c` and `s_c__Custom_Data_Mapping__c` have no `s_c__sC_Id__c` at all.

**Path changes create redirects.** Updating `s_c__Path__c` on a Page, Article, or Product Category
automatically creates a redirect Route Mapping from the old path. Do not hand-build one as well.
A new path is also rejected if it collides with an existing Route Mapping.

## Store (`s_c__Store__c`)

73 fields. The ones that matter for content, theme, and scope work:

| Field | Purpose |
|---|---|
| `Name` | Store name |
| `s_c__Path__c`, `s_c__Domain__c` | Store path and domain |
| `s_c__Currency__c`, `s_c__Locale__c`, `s_c__Default_Timezone__c` | Locale and currency |
| `s_c__Theme_Id__c` | Active theme (lookup to `s_c__Theme__c`) |
| `s_c__Header_Menu_Id__c`, `s_c__Footer_Menu_Id__c` | Navigation menus |
| `s_c__Home_Page_Id__c`, `s_c__Terms_Page_Id__c` | Wired pages |
| `s_c__Head_Content_Block_Id__c`, `s_c__Header_Content_Block_Id__c`, `s_c__Body_Content_Block_Id__c`, `s_c__Footer_Content_Block_Id__c` | Site-wide content block slots |
| `s_c__Disabled_Content_Block_Id__c` | Content shown while the store is disabled |
| `s_c__Logo_Id__c`, `s_c__Email_Logo_Id__c`, `s_c__Favicon_Id__c`, `s_c__Social_Image_Id__c` | Media lookups |
| `s_c__Product_Placeholder_Id__c`, `s_c__Category_Placeholder_Id__c` | Fallback images |
| `s_c__Pricebook_Id__c` | Store price book (`Pricebook2`) |
| `s_c__Default__c` | Default-store flag |
| `s_c__Disable__c` | Takes the store offline |
| `s_c__Test_Mode__c`, `s_c__Preview_Store__c` | Test-store flag; `Preview_Store__c` is a read-only formula |
| `s_c__Shipping_Enabled__c`, `s_c__Tax_Inclusive__c` | Commerce behavior |
| `s_c__Store_Group_Id__c` | Store group, for multi-store orgs |
| `s_c__Meta_Title__c`, `s_c__Meta_Description__c`, `s_c__Meta_Keywords__c` | Site SEO defaults |
| `s_c__Setup_Complete__c` | Setup state |

`s_c__Theme__c` (picklist) is **deprecated** - use `s_c__Theme_Id__c`.

Do not change Store wiring without resolving and showing both sides of every relationship. A
mis-set `s_c__Theme_Id__c` or `s_c__Home_Page_Id__c` changes the whole site immediately.

## Page (`s_c__Page__c`)

| Field | Purpose |
|---|---|
| `Name` | Administrative name; also the slug source |
| `s_c__Store_Id__c` | Owning Store (**required**) |
| `s_c__Title__c`, `s_c__Subtitle__c` | Display text |
| `s_c__Path__c` | URL path, unique per store; derived from `Name` if blank |
| `s_c__Slug__c` | Slug; derived from `Name` if blank |
| `s_c__Body_Markdown__c` | Page content (Markdown and Liquid) |
| `s_c__Visible__c` | Published/visible state |
| `s_c__Hide__c` | Hide from navigation |
| `s_c__Require_Login__c` | Authentication requirement |
| `s_c__Parent_Id__c` | Parent page |
| `s_c__Position__c` | Sort order |
| `s_c__Meta_Title__c`, `s_c__Meta_Description__c`, `s_c__Meta_Keywords__c` | SEO metadata |
| `s_c__Search_Keywords__c` | Additional search terms |
| `s_c__Social_Image_Id__c` | Social image (`s_c__Media__c`) |
| `s_c__Preview_On_Site__c` | Read-only formula link |

**`s_c__Body_Markdown__c` defaults to `{{ content_page | render_content_blocks }}` when left blank.**
So the normal way to build a page is: create the Page with `Name` and `s_c__Store_Id__c` only, leave
the body alone, then attach Content Blocks through `s_c__Content_Blocks_Pages__c`. Hand-writing a
body replaces that default and the attached blocks stop rendering.

## Content Block (`s_c__Content_Block__c`)

Content Blocks have **no Store field**. One block can be attached to pages, products, articles, and
categories across several stores. Before editing one, query every junction that could render it.

| Field | Purpose |
|---|---|
| `Name` | Administrative name |
| `s_c__Template__c` | Block template (**required**, restricted picklist) |
| `s_c__Custom_Template__c` | Theme snippet key when `s_c__Template__c` is `custom` |
| `s_c__Identifier__c` | Stable identifier for Liquid lookups |
| `s_c__Title__c`, `s_c__Subtitle__c` | Display text |
| `s_c__Content_Markdown__c` | Main rich content |
| `s_c__Summary_Markdown__c`, `s_c__Pull_Text_Markdown__c` | Supporting content |
| `s_c__Alignment__c`, `s_c__Layout_Style__c`, `s_c__Sub_Type__c` | Presentation options |
| `s_c__Link_Label__c`, `s_c__Link_Target__c` | Call to action |
| `s_c__Image_Id__c`, `s_c__Video_Id__c`, `s_c__Document_Id__c`, `s_c__File_Id__c`, `s_c__Media_Id__c` | Media relationships |

`s_c__Template__c` is a restricted picklist with 15 values: `container`, `featured_articles`,
`featured_pages`, `featured_products`, `featured_categories`, `featured_category_products`, `image`,
`media`, `video`, `image_beside_text`, `image_text_overlay`, `slideshow`, `text`, `html`, `custom`.

**A custom block template needs both fields.** Set `s_c__Template__c` to `custom` and
`s_c__Custom_Template__c` to the theme snippet key; the storefront renders `blocks/<key>`. Setting
only one of the two renders nothing.

Other restricted picklists on this object:

- `s_c__Alignment__c`: `center`, `center-text`, `top`, `bottom`, `left`, `right`
- `s_c__Sub_Type__c`: `hero_image`, `expanded`, `offset`, `image_background`, `image_wrapped`, `image_separator`
- `s_c__Layout_Style__c`: `none`, `even-distribution`, `one-third-two-thirds`, `two-thirds-one-third`, `two-column`, `three-column`, `four-column`, `one-to-two-column`, `one-to-three-column`, `one-to-four-column`

## Menu (`s_c__Menu__c`) and Menu Item (`s_c__Menu_Item__c`)

Menu: `Name`, `s_c__Store_Id__c` (**required**), `s_c__Identifier__c` (derived from `Name`),
`s_c__Style_Class_Names__c`.

| Menu Item field | Purpose |
|---|---|
| `s_c__Menu_Id__c` | Owning menu (**required**) |
| `s_c__Display_Name__c` | Link label |
| `s_c__Identifier__c` | Stable identifier, derived from `Name`, unique per store |
| `s_c__Position__c` | Sort order |
| `s_c__Parent_Id__c` | Parent item, for nesting |
| `s_c__Child_Category_Levels__c` | How many category levels to expand automatically |
| `s_c__Hide__c`, `s_c__Show_Image__c` | Presentation flags |
| `s_c__Image_Id__c` | Image (`s_c__Media__c`) |
| `s_c__Style_Class_Names__c` | CSS classes |
| `s_c__URL__c` | URL destination |
| `s_c__Page_Id__c` | Page destination |
| `s_c__Product_Id__c` | Product destination |
| `s_c__Product_Category_Id__c` | Product-category destination |
| `s_c__Article_Id__c` | Article destination |
| `s_c__Article_Category_Id__c` | Article-category destination |

Set exactly one destination field per Menu Item.

**Menu Item identifiers are auto-disambiguated.** If the derived or supplied identifier is already
taken in that store, StoreConnect appends `-2`, `-3`, and so on. Re-read the record after insert to
learn the identifier it actually got before referencing it from a template.

## Theme records

| Object | Essential fields | `Name` |
|---|---|---|
| `s_c__Theme__c` | `Name` | text |
| `s_c__Theme_Template__c` | `s_c__Theme_Id__c`, `s_c__Key__c`, `s_c__Content__c` | auto-number |
| `s_c__Theme_Asset__c` | `s_c__Theme_Id__c`, `s_c__Key__c`, `s_c__Url__c` | auto-number |
| `s_c__Theme_Variable__c` | `Name`, `s_c__Theme_Id__c`, `s_c__Key__c`, `s_c__Value__c` | text |
| `s_c__Theme_Locale__c` | `Name`, `s_c__Theme_Id__c`, `s_c__Code__c`, `s_c__Active__c`, `s_c__Default__c` | text |
| `s_c__Locale_Translation__c` | `s_c__Theme_Locale_Id__c`, `s_c__Key__c`, `s_c__Value__c` | auto-number |

`s_c__Theme_Locale__c.s_c__Code__c` is a restricted picklist drawn from the supported Locales value
set (18 values, `en` among them). Read the live picklist rather than guessing a locale code.

A Theme has **no Store field**. Stores point at a Theme through `s_c__Store__c.s_c__Theme_Id__c`, so
several stores can share one Theme and a Theme Template edit hits all of them. Query
`s_c__Store__c` by `s_c__Theme_Id__c` before editing any theme record.

## Article (`s_c__Article__c`) and Article Category (`s_c__Article_Category__c`)

| Article field | Purpose |
|---|---|
| `Name` | Administrative name; slug source |
| `s_c__Store_Id__c` | Owning Store (**required**) |
| `s_c__Title__c` | Display title (**required**) |
| `s_c__Subtitle__c` | Display subtitle |
| `s_c__Path__c`, `s_c__Slug__c` | URL path and slug; derived from `Name` if blank |
| `s_c__Author__c` | Author display name |
| `s_c__Body_Markdown__c`, `s_c__Intro_Markdown__c`, `s_c__Summary_Markdown__c` | Article content |
| `s_c__Published__c`, `s_c__Publish_On__c` | Publication state and schedule |
| `s_c__Require_Login__c` | Authentication requirement |
| `s_c__Hero_Image_Id__c`, `s_c__Social_Image_Id__c` | Media lookups |
| `s_c__Meta_Title__c`, `s_c__Meta_Description__c`, `s_c__Meta_Keywords__c` | SEO metadata |
| `s_c__Search_Keywords__c` | Additional search terms |

Article Category requires `s_c__Store_Id__c` and enforces one category per path per store. Join
articles to categories with `s_c__Articles_Article_Categories__c`.

## Taxonomy (`s_c__Taxonomy__c`) and Product Category (`s_c__Product_Category__c`)

A Taxonomy is the store-scoped root of a category tree. `s_c__Store_Id__c` on Taxonomy is a
**required lookup**. Create the Taxonomy first.

| Product Category field | Purpose |
|---|---|
| `Name` | Administrative name |
| `s_c__Taxonomy_Id__c` | Owning taxonomy (**required**) |
| `s_c__Title__c`, `s_c__Display_Name__c`, `s_c__Subtitle__c` | Display text |
| `s_c__Path__c` | URL path, unique per taxonomy; derived from `s_c__Display_Name__c` then `Name` |
| `s_c__Position__c`, `s_c__Hide__c` | Ordering and visibility |
| `s_c__Media_Id__c`, `s_c__Social_Image_Id__c` | Media lookups |
| `s_c__Introduction_Markdown__c`, `s_c__Information_Markdown__c` | Category content |
| `s_c__Meta_Title__c`, `s_c__Meta_Description__c`, `s_c__Meta_Keywords__c` | SEO metadata |
| `s_c__Child_Count__c`, `s_c__Parent_Count__c` | Maintained counters |
| `s_c__Google_Product_Category__c` | Feed mapping |

`s_c__Store_Id__c` on Product Category is a **read-only formula**, `CASESAFEID(Taxonomy_Id__r.Store_Id__c)`.
Never try to set it. It is safe and cheap to filter on. To move a category between stores you change
`s_c__Taxonomy_Id__c`.

Use `s_c__Path__c`. There is no slug field on this object.

## Style Block (`s_c__Style_Block__c`)

| Field | Purpose |
|---|---|
| `Name` | Display name |
| `s_c__Store_Id__c` | Owning Store (**required**) |
| `s_c__Active__c` | Activation |
| `s_c__Global__c` | Applies site-wide rather than per-page |
| `s_c__Channels__c` | Multi-select picklist, `;`-separated. Values: `web`, `pos`. |
| `s_c__Content__c` | Inline CSS |
| `s_c__Url__c` | External stylesheet URL |
| `s_c__Position__c` | Load order |
| `s_c__Media__c` | Media condition: `all`, `print`, `screen`. Defaults to `all` when blank. |

`s_c__Channels__c` is **not required**. Leaving it blank means the block applies to every channel.
Set it only to restrict the block to `web` or to `pos`.

## Junction objects

| Junction | Fields |
|---|---|
| `s_c__Content_Blocks_Pages__c` | `s_c__Content_Block_Id__c`, `s_c__Page_Id__c`, `s_c__Position__c`, `s_c__Usage_Type__c`, `s_c__Tag__c` |
| `s_c__Content_Blocks_Children__c` | `s_c__Parent_Id__c`, `s_c__Child_Id__c`, `s_c__Position__c`, `s_c__Usage_Type__c`, `s_c__Tag__c` |
| `s_c__Content_Blocks_Products__c` | `s_c__Content_Block_Id__c`, `s_c__Product_Id__c`, `s_c__Position__c`, `s_c__Usage_Type__c`, `s_c__Tag__c` |
| `s_c__Content_Blocks_Articles__c` | `s_c__Content_Block_Id__c`, `s_c__Article_Id__c`, `s_c__Position__c`, `s_c__Usage_Type__c`, `s_c__Tag__c` |
| `s_c__Content_Blocks_Product_Categories__c` | `s_c__Cntnt_Blk_Id__c`, `s_c__Category_Id__c`, `s_c__Position__c`, `s_c__Usage_Type__c`, `s_c__Tag__c` |
| `s_c__Products_Product_Categories__c` | `s_c__Product_Id__c`, `s_c__Category_Id__c`, `s_c__Active__c`, `s_c__Primary__c`, `s_c__Position__c` |
| `s_c__Articles_Article_Categories__c` | `s_c__Article_Id__c`, `s_c__Category_Id__c`, `s_c__Position__c` |
| `s_c__Product_Category_Hierarchy__c` | `s_c__Parent_Id__c`, `s_c__Child_Id__c`, `s_c__Position__c`, `s_c__Primary_Parent__c` |

The shortened `s_c__Cntnt_Blk_Id__c` on the product-category junction, and `s_c__Category_Id__c`
rather than a longer label-matching name, are required exactly as written.

`s_c__Products_Product_Categories__c` also carries three read-only formula fields
(`s_c__Product_Name__c`, `s_c__Category_Name__c`, `s_c__Taxonomy_Name__c`) - useful in a query,
never writable.

### `s_c__Usage_Type__c` decides where the block renders

Restricted picklist, and it differs per junction. Getting it wrong attaches the block to the record
but renders it nowhere.

| Junction | Values | Default |
|---|---|---|
| `s_c__Content_Blocks_Pages__c` | `content` (Page Content), `featured` (Featured Page) | `content` |
| `s_c__Content_Blocks_Children__c` | `content` | `content` |
| `s_c__Content_Blocks_Articles__c` | `content` (Article Content), `featured` (Featured Article) | **none - set it explicitly** |
| `s_c__Content_Blocks_Products__c` | `featured`, `features`, `downloads`, `specifications`, `support`, `warranty` | `featured` |
| `s_c__Content_Blocks_Product_Categories__c` | `featured` | `featured` |

The five non-`featured` product values correspond to the product-page tabs whose labels come from
`s_c__Store__c.s_c__Product_Label_Features__c`, `_Downloads__c`, `_Specifications__c`,
`_Support__c`, and `_Warranty__c`. There is no `content` value on the product junction.

`s_c__Tag__c` is a free-text label a theme can filter or sort on. Optional.

## Delete behavior

Relationships are a mix of master-detail (deleting the parent destroys the child), restricted lookup
(the delete is blocked while a child exists), and set-null (the child survives pointing at nothing).
Know which before you delete.

**Cascades - deleting the parent destroys these:**

| Delete this | Also destroys |
|---|---|
| `s_c__Theme__c` | every `s_c__Theme_Template__c`, `s_c__Theme_Asset__c`, `s_c__Theme_Variable__c` under it |
| `s_c__Theme_Locale__c` | its `s_c__Locale_Translation__c` rows |
| `s_c__Page__c` | its `s_c__Content_Blocks_Pages__c` rows (the Content Blocks themselves survive) |
| `s_c__Article__c` | its `s_c__Content_Blocks_Articles__c` and `s_c__Articles_Article_Categories__c` rows |
| `s_c__Article_Category__c` | its `s_c__Articles_Article_Categories__c` rows |
| `s_c__Product_Category__c` | its `s_c__Content_Blocks_Product_Categories__c` rows |
| `s_c__Content_Block__c` | `s_c__Content_Blocks_Children__c` rows where it is the **child** |

**Blocked until you clear the children first:**

| Delete this | Blocked by |
|---|---|
| `s_c__Store__c` | any Page, Menu, Article, Article Category, Taxonomy, or Style Block |
| `s_c__Menu__c` | its Menu Items |
| `s_c__Page__c` | a Menu Item pointing at it |
| `s_c__Article__c`, `s_c__Article_Category__c` | a Menu Item pointing at it |
| `s_c__Content_Block__c` | any `s_c__Content_Blocks_*__c` row referencing it, and `s_c__Content_Blocks_Children__c` rows where it is the **parent** |
| `s_c__Taxonomy__c` | its Product Categories |
| `s_c__Product_Category__c` | `s_c__Products_Product_Categories__c`, `s_c__Product_Category_Hierarchy__c`, a Menu Item |
| `s_c__Media__c` | `s_c__Article__c.s_c__Hero_Image_Id__c`, `s_c__Menu_Item__c.s_c__Image_Id__c` |

So the delete order for a content block is: junction rows first, then the block.

**Leaves an orphan pointing at nothing:**

| Delete this | Leaves behind |
|---|---|
| `Product2` | `s_c__Content_Blocks_Products__c` and `s_c__Products_Product_Categories__c` rows with a null product, and Menu Items with a null destination |
| a parent `s_c__Page__c` or `s_c__Menu_Item__c` | children promoted to root, not deleted |
| a `s_c__Media__c` used as a social image | the referencing record's `s_c__Social_Image_Id__c` set to null |

After any delete, query for orphaned junction rows with a null lookup and report them. Do not delete
them without approval.

## Permissions

A write fails if the running user lacks object CRUD or field-level access. Assign the
least-privilege capability needed for content, theme, approval, order, or administrative
work; do not use an integration-only identity for interactive work. Verify with
`sf sobject describe` and read `createable`/`updateable` on the specific field rather than
assuming a profile or permission bundle grants access.
