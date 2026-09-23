# MCP Registry metadata

The root [`server.json`](../../server.json) is portable metadata for clients
that understand the official MCP Registry format. It describes how to connect
to StoreConnect's managed remote MCP service; it is not a local server package
or a client configuration file.

The official Registry is currently a preview. Treat this file as prepared
metadata until the entry is actually published; successful schema validation
does not prove that its website or variable-resolved store endpoints are live.

## Store-specific URL

The remote URL uses a required variable:

```text
https://{store_domain}/mcp
```

An installer asks the user for the address supplied by their StoreConnect
administrator and resolves the URL locally. Where several stores share one
domain, each is served at its own path, so that address is the hostname
followed by the store's path, such as `store.example.com/au`. A real customer
hostname or credential must never be added to `server.json`.

Provider configuration files such as `.mcp.json`, `config.toml`, and provider
settings remain local to the client. The examples under
[`templates/mcp/`](../../templates/mcp/README.md) contain only reserved
hostnames or environment-variable references.

## Maintenance rules

- Keep the Registry schema URL pinned to a reviewed revision.
- Keep the human-facing title stable as
  `StoreConnect — Store & Website Builder`. The live server presents its own
  per-store runtime title after connection; the Registry title does not need
  to match it.
- Never replace `{store_domain}` with a real customer domain.
- Do not add credentials, authorization headers, or a static tool catalog.
- Clients must discover the available tools and schemas from the authenticated
  live server.
- Keep the entry remote-only unless StoreConnect publishes a supported local
  server artifact.
- Treat changes to the namespace, transport, URL template, authentication
  expectation, or service version as compatibility changes requiring review.
- Confirm the deployed MCP implementation version immediately before
  publication. Every published metadata revision must use a new, unique
  Registry version; a published version cannot be edited in place.
- Do not publish until the public `websiteUrl`, namespace ownership, and at
  least one resolved store endpoint have passed their release checks.

See the official MCP documentation for
[remote server metadata](https://modelcontextprotocol.io/registry/remote-servers)
and the
[Registry publishing flow](https://modelcontextprotocol.io/registry/quickstart).
