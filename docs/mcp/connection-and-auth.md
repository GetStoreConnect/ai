# Connect and authenticate

Each StoreConnect store exposes its own managed MCP endpoint:

```text
https://<store-domain>/mcp
```

Use the exact HTTPS URL supplied by the StoreConnect administrator. When a user
instead supplies a storefront URL, request the same origin's public
`/.well-known/mcp.json` discovery card and accept its advertised MCP URL only
when it uses the expected HTTPS host and exact `/mcp` path with no user
information, query, or fragment. If the card is unavailable, try only the
same-origin `/mcp` path. Do not probe other paths, derive a URL from another
service, reuse another customer's connection, or commit a resolved customer
hostname to a public project. A private client or partner implementation
repository may retain required customer domains and non-secret project
identifiers; public examples must use placeholders.

## Preferred connection flow

1. Add a remote MCP server named `storeconnect` with the store's `/mcp` URL.
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

## Connection failures

- If this endpoint does not respond, then the version of StoreConnect in use
  is too old and you will need to work with StoreConnect to upgrade your
  version to one that contains the MCP and API code.
- If sign-in fails, confirm the exact store URL and repeat the client's native
  authentication flow.
- If the connection succeeds but access is denied, ask the StoreConnect
  administrator to review the account's access for that store.
- If the available tools differ from an example, follow the live server.
- If the connected identity or environment is not the intended target, stop,
  remove the connection, and reconnect to the correct store.

See [install and verify](install-and-verify.md) for provider-specific commands.
