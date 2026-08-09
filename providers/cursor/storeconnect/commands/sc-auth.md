---
description: Connect to one store URL now and confirm the store, environment, and signed-in identity. For platform and tool-selection rules, load `storeconnect-platform`.
argument-hint: "[store URL]"
---

<!-- Generated from shared/commands. Do not edit this copy. -->

# Connect and verify a StoreConnect store

Establish a verified connection to exactly one StoreConnect store. Connection
information is specific to the target store. Follow `storeconnect-platform` for
platform context.

## Resolve the endpoint

1. Take the store URL from the argument. If none was supplied, ask for the
   storefront or connection URL and stop until it is provided. Never guess a
   hostname, reuse a hostname from an earlier session, or derive one from a
   project file.
2. If the user supplied a connection URL directly, use it exactly as given.
3. If the user supplied a storefront URL, request that same origin's public
   discovery document at `/.well-known/mcp.json` and read its advertised
   connection URL.
4. Accept the advertised connection URL only when every check passes:
   - the scheme is HTTPS
   - the host is the same host that was supplied, with no cross-host redirect
   - the path is exactly `/mcp`
   - there is no user information, port override, query, or fragment
5. If the discovery document is unavailable, try only the same-origin `/mcp`
   path. Do not probe other paths or other services.
6. If any check fails, stop and report which check failed. Do not fall back to
   a corrected or guessed URL.

## Register and sign in

1. Register the resolved connection as `storeconnect`
   using this product's own configuration mechanism and the narrowest scope
   that fits the work, preferring project scope over user or global scope.
2. Use the product's native sign-in action. Prefer the browser-based flow.
3. Complete authentication only in the StoreConnect page opened by the native
   client flow.
4. If native sign-in is unavailable, stop and follow the current StoreConnect
   and client documentation or ask the StoreConnect administrator. Do not
   construct headers, name or request token material, or switch to an
   undocumented credential mechanism.

## Verify before trusting the connection

1. Call one read-only operation from the live server.
2. Report back the store name, the environment, and the signed-in identity, and
   ask the user to confirm all three are the intended target.
3. List the tool names the live server advertises. Treat that runtime catalog
   as authoritative and do not assume a tool exists because a reference
   mentions it.
4. Do not propose or perform any write until the user has confirmed the target.

## Boundaries

- Connect one store per session. To change store, disconnect first and rerun
  this command; never hold two store connections at once.
- A private client or partner project may retain the customer hostname and
  identifiers it needs in access-restricted project configuration. Sanitize
  them from public examples, logs, issues, and shared instructions.
- Never commit or repeat credentials or manually constructed authorization
  values.
- On an authentication error, rerun the product's native sign-in action rather
  than switching credential mechanisms.
- If sign-in succeeds but a needed operation is unavailable, report the gap and
  ask the StoreConnect administrator for access. Do not work around the
  boundary with another endpoint, another credential, or a direct data write.
