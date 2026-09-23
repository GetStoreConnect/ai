# Connect StoreConnect MCP

Use this procedure when a user asks to connect StoreConnect from a store URL and no StoreConnect tools are currently visible.

Installing these skills does not connect anything. The operator must explicitly
connect the intended store using a confirmed storefront URL.

## Contents

- [Discover the connection safely](#discover-the-connection-safely)
- [Configure and authenticate](#configure-and-authenticate)
- [The tool surface is per-connection, not fixed](#the-tool-surface-is-per-connection-not-fixed)
- [Verify before writing](#verify-before-writing)
- [Use the reviewed write workflow](#use-the-reviewed-write-workflow)
- [When to use Salesforce tooling](#when-to-use-salesforce-tooling)

## Discover the connection safely

1. Start only from an HTTPS StoreConnect storefront URL supplied or confirmed by the user.
2. Request that same origin's public discovery card at `/.well-known/mcp.json`
   and use the MCP URL it advertises. A supported administration flow may supply
   the same connection information directly.

   ```
   https://store.example.com/.well-known/mcp.json
   ```

   Where several stores share one domain, each store is served at its own path,
   and so is its card. Keep whatever path the user gave you and request the card
   under it. `https://store.example.com/au/.well-known/mcp.json` belongs to a
   different store from `https://store.example.com/.well-known/mcp.json`.

3. Accept the advertised URL only when it uses HTTPS, has the expected
   storefront host, and is exactly the address you requested the card at with
   `/mcp` appended, with no user information, query, or fragment. A store at the
   root of its domain advertises the first form; a store served at a path
   advertises the second.

   ```
   https://store.example.com/mcp
   https://store.example.com/au/mcp
   ```

4. If the discovery card is unavailable, configure that same address with
   `/mcp` appended through the AI client's native MCP setup, and nothing else.
   Do not test it with a browser GET, probe other paths, or try other hosts.
   Never drop the store path the user gave you and never add one they did not.
   On a shared domain, either one names a different customer's store.

Treat customer hostnames and store identifiers as customer information. They may be retained in
the access-restricted project configuration used by that client or partner, but must not be copied
into public examples, logs, issues, or shared instructions. Use `store.example.com` in public
material.

## Configure and authenticate

Add the discovered URL as a remote Streamable HTTP server using the AI client's native MCP setup. Prefer the client's native OAuth login, which the store supports through standard discovery:

1. Add the MCP URL without embedding credentials.
2. Start the client's login action.
3. Complete authentication only in the StoreConnect page the client opens.

Sign-in binds the session to the store at the address it was started from, so a session started at
one store's path is refused at another's. The store also accepts the browser sign-in only from
client callback addresses StoreConnect has listed. A client running on the operator's own machine
is always accepted on loopback. A client that hands the sign-in to its vendor's own hosted address
is accepted only if StoreConnect has listed that address, and is otherwise refused with `This
client's redirect address is not on this store's allow list.` That list is StoreConnect's own
configuration, so a store administrator cannot add to it: report the refusal and the client's name
to the operator, and do not retry, substitute another address, or fall back to a credential the
operator did not supply.

Do not request, repeat, copy, or store credentials in chat, URLs, commands, screenshots,
repository files, project instructions, or example configuration. Do not invent header formats or
token schemes. Resolved store domains and identifiers may be kept only in the access-restricted
project configuration used by that client or partner; sanitize them from public examples. If the
client's supported OAuth flow is unavailable, stop and direct the operator to the current
StoreConnect and client documentation.

## The tool surface is per-connection, not fixed

- After connecting, read the live tool list and each tool's current schema. That is the only authoritative statement of what this connection can do.
- The visible surface is filtered by what the connected credential is permitted to do. A shorter list than expected means narrower permissions, not a broken or older store.
- Never infer a capability from another StoreConnect store, from an earlier session, or from a static example. Never assemble a call from a remembered tool name.

## Verify before writing

1. Inspect the client's connection status and live tool list.
2. Use a read-only operation to confirm the intended store and environment, and show the result to the operator.
3. Stop after verification unless the user asked for a change.

## Use the reviewed write workflow

Nothing an agent submits should be treated as live until the supported review
workflow reports that outcome and the storefront has been verified.

1. **Prepare.** Use the connected tool's current schema to group related
   supported edits into one reviewable change.
2. **Preview.** Open the URL returned by the tool without modifying or sharing
   it, and verify the rendered outcome.
3. **Submit for review.** This requires the user's explicit, current approval
   for the exact previewed change. Never fabricate, infer, rewrite, or replay
   approval.
4. **Verify the public outcome.** Read the status returned by the supported
   workflow, allow synchronization to complete, and verify the live storefront
   after an authorized person completes any required administrative review.

If validation rejects a change, fix the reported cause rather than retrying it
unchanged. StoreConnect and Salesforce synchronize asynchronously; wait,
re-read and never repeat a write merely because it is not visible yet.

## When to use Salesforce tooling

Treat the live connected tool list as authoritative. If the supported
StoreConnect tools do not expose the required configuration or metadata
operation, route to `storeconnect-salesforce-data`,
`storeconnect-sync-deploy`, or `storeconnect-apex-integration` as appropriate.
Do not probe for hidden tools or construct a raw service request.
