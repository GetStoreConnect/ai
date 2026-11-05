# StoreConnect commerce object map

An orientation map for finding which Salesforce object holds a piece of commerce data. It is not a
schema: describe the object in the target org before reading or writing, because installed package
versions, optional packages (CPQ), and admin-added validation rules all differ.

StoreConnect custom objects use the `s_c__` namespace. Where StoreConnect extends a standard
Salesforce object it uses the standard object - there is no namespaced replacement for `Product2`,
`Pricebook2`, `PricebookEntry`, `Order`, `OrderItem`, `Account`, or `Contact`.

## Contents

- [Where to look](#where-to-look)
- [Rules that apply across all of these](#rules-that-apply-across-all-of-these)
- [Why a product does not show on the storefront](#why-a-product-does-not-show-on-the-storefront)
- [Media import](#media-import)
- [Stock](#stock)
- [Tax exemption](#tax-exemption)
- [Orders created by storefront and POS](#orders-created-by-storefront-and-pos)
- [Contacts who sign in](#contacts-who-sign-in)
- [Promotions](#promotions)

## Where to look

| Area | Principal records |
|---|---|
| Stores and sites | `s_c__Store__c`, `s_c__Store_Group__c`, `s_c__Web_Domain__c`, `s_c__Store_Variable__c`, `s_c__Route_Mapping__c`, `s_c__Script_Block__c` |
| Content and themes | Pages, articles, content blocks, menus, themes, media, style blocks, locales, translations - see [salesforce-objects.md](salesforce-objects.md) |
| Staged content review | `s_c__Content_Change__c`, `s_c__Content_Change_Record__c`, `s_c__Content_Change_Field__c` |
| Products | `Product2`, `s_c__Product_Variant__c`, `s_c__Product_Media__c`, `s_c__Product_Purchasable_Media__c`, `s_c__Related_Product__c`, `s_c__Product_Tag__c`, `s_c__Tag__c` |
| Traits (variant options) | `s_c__Trait_Category__c`, `s_c__Trait_Type__c`, `s_c__Trait__c`, `s_c__Trait_Value__c`, `s_c__Product_Trait_Template__c`, `s_c__Product_Trait_Template_Item__c` |
| Pricing | `Pricebook2`, `PricebookEntry`, `s_c__Component_Pricing__c` |
| Bundles and CPQ | `s_c__Component_Group__c`, `s_c__Product_Component__c` (optional package) |
| Categories | `s_c__Taxonomy__c`, `s_c__Product_Category__c`, `s_c__Product_Category_Hierarchy__c`, `s_c__Products_Product_Categories__c`, `s_c__Account_Product_Category__c` |
| Inventory | `s_c__Stock_Location__c`, `s_c__Stock_Level__c`, `s_c__Stock_Adjustment__c`, `s_c__Manual_Stock_Adjustment__c`, `s_c__Manual_Stock_Adjustment_Item__c`, `s_c__Stock_Transfer__c`, `s_c__Stock_Transfer_Item__c`, `s_c__Store_Stock_Location__c`, `s_c__Outlet_Stock_Location__c` |
| Carts | `s_c__Cart__c`, `s_c__Cart_Item__c`, `s_c__Cart_Fulfillment__c`, `s_c__Cart_Fulfillment_Item__c`, `s_c__Cart_Promotion2__c`, `s_c__Cart_Campaign__c` |
| Orders and fulfillment | `Order`, `OrderItem`, `s_c__Fulfillment_Item__c`, `s_c__Fulfillment_Category__c`, `s_c__Fulfillment_Station__c`, `s_c__Shipment__c` |
| Subscriptions | `s_c__Subscription__c`, `s_c__Subscription_Change__c` |
| Bookings | `s_c__Bookable_Location__c`, `s_c__Product_Bookable_Location__c`, `s_c__Availability__c`, `s_c__Opening_Time__c`, `s_c__Bookable_Event__c`, `s_c__Booking__c`, `s_c__Attendee__c` |
| Promotions (current) | `s_c__Promotion2__c`, `s_c__Promotion2_Condition__c`, `s_c__Promotion2_Product_Scope__c`, `s_c__Promotion2_Usage__c`, `s_c__Reward__c`, `s_c__Reward_Usage__c` |
| Promotions (legacy) | `s_c__Promotion__c`, `s_c__Promotion_Action__c`, `s_c__Promotion_Scope__c`, `s_c__Promotion_Credit__c`. Read-only unless the org still configures them. |
| Discounts | `s_c__Discount__c`, `s_c__Discount_Credit__c` |
| Vouchers and credit | `s_c__Voucher__c`, `s_c__Voucher_Log__c`, `s_c__Voucher_Payment__c`, `s_c__Account_Credit__c`, `s_c__Account_Credit_Ledger__c`, `s_c__Account_Points_Ledger__c` |
| Shipping and delivery | `s_c__Zone__c` (with `s_c__Zone_Country__c`, `s_c__Zone_State__c`, `s_c__Zone_City__c`, `s_c__Zone_Postcode__c`), `s_c__Shipping_Provider__c`, `s_c__Shipping_Rate__c`, `s_c__Shipping_Provider_Product__c`, `s_c__Shipping_Carrier_Product__c`, `s_c__Delivery_Window__c`, `s_c__Product_Delivery_Window__c`, `s_c__Collection_Point__c` |
| Tax | `s_c__Tax__c`, `s_c__Tax_Group__c`, `s_c__Tax_Tax_Group__c`, `s_c__Product_Tax__c`, `s_c__Product_Tax_Group__c`, `s_c__Tax_Provider__c`, `s_c__Tax_Provider_Log__c` |
| Payments | `s_c__Payment__c`, `s_c__Payment_Item__c`, `s_c__Payment_Installment__c`, `s_c__Payment_Method__c`, `s_c__Payment_Provider__c` |
| Customers and access | `Account`, `Contact`, `s_c__Membership__c`, `s_c__Membership_Page__c`, `s_c__Membership_Article__c`, `s_c__Store_Role__c`, `s_c__Store_User_Role__c`, `s_c__Store_Role_Permission__c`, `s_c__Authentication_Provider__c` |
| Storefront forms | `s_c__Form__c`, `s_c__Form_Question__c`, `s_c__Form_Answer__c`, `s_c__Form_Submission__c`, `s_c__Store_Form__c`, `s_c__Product_Form__c` |
| POS | `s_c__Outlet__c`, `s_c__Outlet_User__c`, `s_c__Outlet_User_Type__c`, `s_c__Register__c`, `s_c__Register_Shift__c`, `s_c__Register_Shift_User__c`, `s_c__Register_Shift_Total__c`, `s_c__Pos_Layout__c`, `s_c__Pos_Layout_Field__c`, `s_c__Pos_Layout_Filter__c`, `s_c__Pos_View__c`, `s_c__Pos_Action_Group__c`, `s_c__Pos_Action_Item__c`, `s_c__Pos_Print_Template__c`, `s_c__Printable_Label__c` |
| Product feeds | `s_c__Data_Feed__c`, `s_c__Data_Feed_Field__c` |
| Sync plumbing | `s_c__Change_Event__c`. Read-only diagnostics. Never write or delete. |

For POS configuration and customization use `storeconnect-pos-setup` and
`storeconnect-pos-customization`. For a product-level capability overview use `storeconnect-platform`.

## Rules that apply across all of these

- **Scope by an owning relationship, never by object alone.** Store, taxonomy, price book, outlet,
  account, or contact. A query without a scope filter is a multi-tenancy bug in a multi-store org.
- **Products reach a store only through the taxonomy.** `Product2` has no Store field. A product is
  in a store when `s_c__Products_Product_Categories__c` joins it to a Product Category whose Taxonomy
  belongs to that Store.
- **Customer-owned records need the authenticated customer as well as the store.** Carts, orders,
  payments, bookings, subscriptions, credit, and points ledgers all hold data for many customers.
  Filter by Account or Contact, and never by a request-supplied ID alone.
- **Do not write calculated or lifecycle fields.** Inventory levels, order and payment totals, tax
  amounts, fulfillment state, checkout progress, and credit and points balances are maintained by
  the platform. Writing them directly puts the record out of step with the storefront rather than
  changing behavior. Use the supported StoreConnect workflow for the business action. Order
  **Status** is not one of these: the merchant owns it (see
  [Orders](#orders-created-by-storefront-and-pos)).
- **Payment, credit, and voucher records are financial records.** Read them if you must; never write,
  adjust, or delete one from an agent workflow.
- **Never expose payment credentials, stored payment data, staff PINs, authentication data, or full
  customer records** in theme code, tool output, a report, or a conversation.
- Get exact fields and allowed values from `sf sobject describe` against the target org, not from
  memory. `Product2` has 79 fields and `s_c__Cart__c` 51; the field you want is probably not named
  what you would guess.

## Why a product does not show on the storefront

A product appears on a store's storefront only when every one of these holds. Check them in order
before suspecting sync, and treat a working preview link as proof of sync, not of setup.

1. **Active** is checked and the product is not deleted.
2. **Available On** (`s_c__Available_On__c`) is set and in the past. A blank date never matches, so
   a product with no date is never for sale. Products created in the StoreConnect Console or through
   the connected StoreConnect tools get the date set for them; products created with Data Loader,
   the API, a Flow, or Apex leave it blank, so set it in the same load.
3. **Discontinue On** (`s_c__Discontinue_On__c`) is blank or in the future.
4. **Is Master** (`s_c__Is_Master__c`) is checked for a product sold on its own. A variant sells
   through the master product.
5. **Placeholder For** (`s_c__Placeholder_For_Id__c`) is blank. A placeholder product stands in for
   another product and is never sold itself.
6. **Excluded Channels** (`s_c__Excluded_Channels__c`) does not list Web.
7. An active `PricebookEntry` exists in the store's price book (in the store's currency on a
   multi-currency org).
8. An active category assignment places it in the store's taxonomy.
9. When **Track Inventory** is checked, sellable stock exists at a location that fulfills the store's
   online orders, or the stock is backorderable.

A master with variants is buyable only while at least one variant passes. For the merchant-facing
steps, see
[minimum requirements for product visibility](https://support.storeconnect.com/article/product-listing-minimum-requirements).

## Media import

StoreConnect imports a Media record (`s_c__Media__c`) only while **URL** (`s_c__Url__c`) is blank and
**Import URL** (`s_c__Import_Url__c`) is set. A record created with **URL** already filled is never
imported, so create it with the public source address in **Import URL** and **URL** blank. A failed
import is retried a limited number of times and then stops. To recover one, clear **URL**, set a
working public **Import URL**, and reset **Retry Count** (`s_c__Retry_Count__c`) to 0. Do not copy a
**URL** value from another org's record; give the new record an **Import URL** instead.

## Stock

- Change stock through **Set Quantity** or **Change Quantity** on the Stock Level
  (`s_c__Stock_Level__c`). Never type **Available to Sell**; the platform calculates it.
- **Count on Hand** defaults to 0 on a new Stock Level.
- The order of stock locations for a store comes from **Priority** on Store Stock Location
  (`s_c__Store_Stock_Location__c`): the lowest number first, blank last. The Priority checkbox on
  Stock Level is deprecated and has no effect on that order.

## Tax exemption

An Account is tax exempt when **Tax Entity Code** (`s_c__Tax_Entity_Code__c`) holds any value other
than **Non-Exempt Taxable Customer** (`taxable`). A blank code is taxable. Setting any other value,
even one that reads like a taxable category, exempts every order for that account.

## Orders created by storefront and POS

- StoreConnect creates each Order with **Status** `Draft` and never changes it afterward. The
  merchant's own process moves **Status** on, and loyalty points activate when it reaches the
  store's configured activation status.
- Checkout progress is in **Checkout Step** (`s_c__Checkout_Step__c`). An automation that should run
  when an order completes keys off the final **Checkout Step** value, which differs by source: `complete` for a web
  order, `pos-complete` for a POS order, and `quotation_requested` for a quote. Do not key it off
  **Status**, which StoreConnect never changes, or off record creation, which happens before the
  order is complete.
- For an Order created in Salesforce, **Send Confirmation Emails** (`s_c__Send_Confirmation__c`)
  defaults to checked, so the customer receives the store's order emails unless you clear it. Set
  **Store** (`s_c__Store_Id__c`); with it blank, StoreConnect does not fill a missing price book
  entry on the order items, and store-scoped features such as points do not apply.

## Contacts who sign in

Storefront sign-in and password reset look up the Contact by **Username** (`s_c__Username__c`), not
by **Email**. A Contact created in Salesforce, for example in a bulk import, needs **Username** set,
usually to the email address, before that customer can sign in or reset a password. The reset page
reports success whether or not a matching Contact exists, so a success message does not prove an
email was sent.

## Promotions

Configure current promotions (`s_c__Promotion2__c`) from the
[Promotions v2 configuration](https://support.storeconnect.com/article/configure-advanced-promotions)
and [about Promotions v2](https://support.storeconnect.com/article/advanced-promotions) articles.
They cover conditions, rewards, product scope, coupon codes, and evaluation order, which comes from
the **Priority** field rather than from the order records were created in. When writing the records
directly, leave **Reward Strategy** at the Tiered default or set Stacked: a promotion saved with the
field explicitly blank never gives a reward.
