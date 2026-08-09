# StoreConnect commerce object map

An orientation map for finding which Salesforce object holds a piece of commerce data. It is not a
schema: describe the object in the target org before reading or writing, because installed package
versions, optional packages (CPQ), and admin-added validation rules all differ.

StoreConnect custom objects use the `s_c__` namespace. Where StoreConnect extends a standard
Salesforce object it uses the standard object - there is no namespaced replacement for `Product2`,
`Pricebook2`, `PricebookEntry`, `Order`, `OrderItem`, `Account`, or `Contact`.

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
  amounts, fulfillment state, credit and points balances, and status transitions are maintained by
  the platform. Writing them directly puts the record out of step with the storefront rather than
  changing behavior. Use the supported StoreConnect workflow for the business action.
- **Payment, credit, and voucher records are financial records.** Read them if you must; never write,
  adjust, or delete one from an agent workflow.
- **Never expose payment credentials, stored payment data, staff PINs, authentication data, or full
  customer records** in theme code, tool output, a report, or a conversation.
- Get exact fields and allowed values from `sf sobject describe` against the target org, not from
  memory. `Product2` has 79 fields and `s_c__Cart__c` 51; the field you want is probably not named
  what you would guess.
