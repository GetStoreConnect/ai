# Connect and authenticate

Each StoreConnect store exposes its own managed MCP endpoint:

```text
https://<store-domain>/mcp
https://<store-domain>/<store-path>/mcp
```

The second form is for a store served at a path. Several stores can share one
domain, and each is then served at its own path, with its endpoint and its
discovery card under that path. A store's path is the **Path** field on its
**Store** record; a store with nothing in that field is the one served at the
root of the domain. Sign-in binds the session to the store at the address it
was started from, so a session started at one store's path is refused at
another's.

Use the exact HTTPS URL supplied by the StoreConnect administrator. When a user
instead supplies a storefront URL, request the `/.well-known/mcp.json` discovery
card under that same address, keeping any path it carries, and accept its
advertised MCP URL only when it uses the expected HTTPS host and is the address
the card was requested at with `/mcp` appended, with no user information, query,
or fragment. If the card is unavailable, try only that same address with `/mcp`
appended. Do not probe other paths, drop or add a store path, derive a URL from
another service, reuse another customer's connection, or commit a resolved
customer hostname to a public project. A private client or partner
implementation repository may retain required customer domains and non-secret
project identifiers; public examples must use placeholders.

## Preferred connection flow

1. Add a remote MCP server named `storeconnect` with the store's MCP URL,
   including the store's path if it is served at one.
2. Use the client's native OAuth or **Sign in** action.
3. Complete the StoreConnect flow in the browser.
4. Return to the client and confirm that the connection is active.
5. Before any write, use a read-only operation from the live server to verify
   the intended store, environment, and signed-in identity.

The live server supplies the current tools and input schemas after
authentication. Treat that runtime catalog as authoritative; do not infer
tool names, arguments, or access from examples in this repository.

## Credentials and access

Use the client's native sign-in flow. Do not paste credentials into prompts,
chat messages, shell history, documentation, source control, or tracked MCP
configuration. When authentication expires, re-run the client's native sign-in
action.

If the installed client cannot sign in, stop and follow the current
StoreConnect and client documentation or an administrator-approved credential
interface. This repository does not publish credential names, formats, or
manual authentication construction.

Access is granted and revoked by the StoreConnect administrator. Request only
the minimum access needed for the task. If authentication succeeds but an
operation is unavailable, do not work around that boundary with a different
endpoint, authentication route, or direct data write.

## Clients the browser sign-in accepts

The store completes a browser sign-in only for client callback addresses
StoreConnect has listed. Any client running on the operator's own machine is
accepted on an `http` address at `localhost`, `127.0.0.1` or `::1`, on any
port, which covers every locally installed client. A client that hands the
sign-in to its vendor's own hosted address is accepted only where StoreConnect
has listed that address. At the time of writing that covers Claude, ChatGPT,
Google Antigravity, and Agentforce Vibes.

Anything else is refused with:

```text
This client's redirect address is not on this store's allow list.
```

That list is StoreConnect's own configuration, not the store's, so a store
administrator cannot add to it. Ask StoreConnect support to list the client,
giving the product name and the address shown with the refusal. A live store's
refusal, not this page, is the current statement of what is accepted.

## Connection failures

- If this endpoint does not respond, then the version of StoreConnect in use
  is too old and you will need to work with StoreConnect to upgrade your
  version to one that contains the MCP and API code.
- If the address is refused because no store is configured at it, the store
  path is wrong or the store at it is not live. Check the **Path** field on the
  **Store** record.
- If the address is refused because several stores share the domain and none is
  marked as the default, the address carries no store path. Use the store's own
  path, or ask the administrator to mark one store as the default.
- If sign-in fails, confirm the exact store URL, including the store's path if
  it is served at one, and repeat the client's native authentication flow.
- If sign-in is refused because the client's redirect address is not on the
  store's allow list, stop and ask StoreConnect support to list the client. The
  client can connect in the meantime only through a credential the StoreConnect
  administrator supplies.
- If sign-in is refused because the client asked to connect to a different
  endpoint than the store's, the message names the address the store expects.
  Correct the address in the client and sign in again.
- If the connection succeeds but access is denied, ask the StoreConnect
  administrator to review the account's access for that store.
- If the available tools differ from an example, follow the live server.
- If the connected identity or environment is not the intended target, stop,
  remove the connection, and reconnect to the correct store.

See [install and verify](install-and-verify.md) for provider-specific commands.
