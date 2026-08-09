# StoreConnect for GitHub Copilot CLI

This package provides StoreConnect skills and specialist agents for GitHub
Copilot CLI. Installing it does not connect a store or include credentials.

## Install

```shell
copilot plugin marketplace add GetStoreConnect/ai
copilot plugin install storeconnect@storeconnect-ai
copilot plugin list
```

For a local checkout:

```shell
copilot plugin install ./providers/copilot/storeconnect
```

Reinstall a local-path plugin after changing its checkout. In an interactive
session, use `/agent` and `/skills list` to verify that both component types
loaded.

## Connect MCP

For implementation repositories, prefer a project `.mcp.json` based on the
public
[`copilot.mcp-config.json`](https://github.com/GetStoreConnect/ai/blob/main/templates/mcp/copilot.mcp-config.json)
template. Trust the intended workspace, then inspect the source and resolved
server before its first operation:

```shell
copilot mcp list --json
copilot mcp get storeconnect --json
```

If authentication is required, open an interactive session and run
`/mcp auth storeconnect`. The template lists `"tools": ["*"]` explicitly —
the default full live tool selection — so the choice stays visible in review;
this selects tools and does not auto-approve calls. Keep the normal per-call
approvals enabled and use a concrete allowlist when the required live tool
names are known.

If Copilot cannot complete native sign-in, stop and follow the current
StoreConnect and Copilot documentation or an administrator-approved credential
interface.

For a deliberately user-global, single-store connection, use:

```shell
copilot mcp add storeconnect --type http \
  --url "https://<store-domain>/mcp" --tools "*"
```

For one session, pass an otherwise untracked config with
`copilot --additional-mcp-config @/absolute/path/storeconnect.mcp.json`.

After connecting, use a read-only live operation to verify the intended store,
environment, and identity. Follow the live schemas, stage writes, preview where
available, obtain explicit approval, and recheck the result.

See the full [MCP installation guide](https://github.com/GetStoreConnect/ai/blob/main/docs/mcp/install-and-verify.md).
A private client or partner implementation repository may retain required
customer domains and non-secret project identifiers; public examples must use
placeholders, and credentials must never be committed. Use
`copilot plugin update storeconnect` for marketplace updates and
`copilot plugin uninstall storeconnect` when removing the optional package.
