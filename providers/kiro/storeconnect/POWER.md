---
name: "storeconnect"
displayName: "StoreConnect Store Builder"
description: "Build and operate a StoreConnect store - Liquid themes, storefront content, catalog, POS, and Salesforce-native data workflows"
keywords: ["storeconnect", "storeconnect theme", "storeconnect liquid", "storeconnect pos", "storeconnect store"]
author: "StoreConnect"
---

# StoreConnect Store Builder Power

## Overview

StoreConnect is a Salesforce-native commerce platform. This Power equips Kiro
to work through supported StoreConnect and Salesforce interfaces: writing and
reviewing Liquid templates, managing storefront content and catalog,
configuring point of sale, and completing authorized data workflows.

**Key capabilities:**

- **Liquid storefront**: supported templates, Drops, forms, components, and
  runtime-safe implementation patterns
- **Themes**: accessible theme development, review, preview, and verification
- **Storefront content and catalog**: pages, content blocks, menus, articles,
  products, and categories
- **Point of sale**: outlets, registers, payment methods, fulfillment routing,
  and supported customization outcomes
- **Salesforce-native data**: authorized workflows that treat current live
  schemas and StoreConnect documentation as authoritative
- **Safe changes**: review the proposed outcome, use supported previews where
  available, obtain explicit approval, and verify the resulting state

## Installing the skills

This Power is the lightweight entry point. The substance lives in 13 portable
Agent Skills, published in the same repository. Copy them into the project you
are working in:

```bash
# from a checkout of github.com/GetStoreConnect/ai
cp -R providers/kiro/storeconnect/.kiro/skills/. .kiro/skills/
```

Each skill is a `SKILL.md` plus reference documents, and Kiro loads them by
description when a task matches. Nothing else is required — no build step and no
credentials.

## Connecting to a store

Obtain the intended store's exact `https://<store-domain>/mcp` URL from the
StoreConnect administrator. Merge the connection-only entry from
`templates/mcp/kiro.mcp.json` into the target project's Kiro MCP settings,
replace the placeholder there, and complete Kiro's native browser sign-in.

If the installed client cannot sign in, stop and follow the current
StoreConnect and Kiro documentation or an administrator-approved credential
interface. Confirm the connected store, environment, and identity with a
read-only operation before any write.

## Safety boundaries

These are the rules the skills themselves enforce, repeated here because they
matter before the first command:

- **Confirm the target store and environment before writing anything.** Stores
  look alike and a production storefront is customer-facing.
- **Inspect the live tools and schemas at runtime.** Do not assume an operation
  exists because a reference mentions it.
- **Review outcomes before writes.** Use a supported preview where available,
  obtain explicit human approval, then verify the resulting state.
- **Respect asynchronous visibility.** StoreConnect and Salesforce synchronize
  asynchronously; wait, re-read and never repeat a write merely because it is
  not visible yet.
- **Keep configuration appropriately scoped.** A private client or partner
  implementation repository may retain required customer domains and
  non-secret project identifiers. Public examples must use placeholders.
- **Never commit credentials.** If native sign-in is unavailable, stop and use
  only the current approved interface.

## Learn more

- Platform documentation: <https://support.storeconnect.com/>
- Product: <https://storeconnect.com/>
- Repository, including the skills, specialist agents and MCP documentation:
  <https://github.com/GetStoreConnect/ai>
