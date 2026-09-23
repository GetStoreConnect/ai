# StoreConnect MCP integration

Each compatible StoreConnect store provides a managed MCP endpoint. Installing
this repository's skills gives an agent StoreConnect guidance; connecting MCP
provides the live tools and schemas for one store.

## Safe defaults

- Connect only to the intended store's exact HTTPS MCP URL, including the
  store's path where several stores share a domain.
- Prefer the client's native OAuth flow.
- Use placeholders for customer domains and identifiers in public examples.
  A private client or partner project may retain required non-secret project
  configuration; credentials must never be committed or placed in prompts.
- Verify the connected store, environment, and identity with a read-only live
  operation before making a change.
- Treat the authenticated server's tool catalog and schemas as authoritative.
- Stage writes, inspect the returned summary, preview where available, obtain
  explicit approval, and recheck asynchronous results before reporting success.
- If an operation is not exposed by the live server, stop and ask the
  StoreConnect administrator for the supported workflow.

## Connect

1. Install the relevant skills or provider package.
2. Obtain the connection from the administrator, or from the
   `/.well-known/mcp.json` public discovery card under the storefront address
   you were given, keeping any path it carries.
3. Add a remote server named `storeconnect` at `https://<store-domain>/mcp`,
   or at `https://<store-domain>/<store-path>/mcp` where the store is one of
   several sharing a domain. See
   [connect and authenticate](connection-and-auth.md).
4. Complete the provider's native sign-in flow.
5. Verify the target with a read-only operation from the live server.

The root [`server.json`](../../server.json) provides portable Registry metadata.
Files under [`templates/mcp/`](../../templates/mcp/README.md) provide
provider-native, non-secret starting points.

## Documentation

- [Install and verify a client connection](install-and-verify.md)
- [Connect and authenticate](connection-and-auth.md)
- [Safe content-change workflow](content-change-workflow.md)
- [MCP Registry metadata](registry-metadata.md)
