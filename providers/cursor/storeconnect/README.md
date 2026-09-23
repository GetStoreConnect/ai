# StoreConnect for Cursor

This package provides StoreConnect skills, specialist agents, and slash commands
for Cursor. Installing it does not connect a store or include credentials.

## Install

Teams and Enterprise administrators can import the Git repository through
**Cursor Dashboard → Plugins → Team Marketplaces → Add Marketplace → Import
from Repo**. Members then install `storeconnect` from **Customize**.

For a local package test, place this directory at
`~/.cursor/plugins/local/storeconnect` and reload Cursor.

For a checkout-based Agent CLI session, run this from the monorepo root:

```shell
agent --plugin-dir ./providers/cursor/storeconnect
```

Marketplace-installed components are managed through **Customize**; Cursor
does not document a separate Agent CLI plugin-install command.

## Commands

| Command | Purpose |
|---|---|
| `/sc-auth` | Resolve one store's endpoint, sign in, and verify store, environment, and identity |
| `/sc-publish` | Review, approve, submit, and verify a staged change |
| `/sc-theme-review` | Run the read-only theme and storefront audit |

Run `/sc-auth` before any command that reads or writes store data. Some Cursor
releases have not surfaced plugin commands in the slash menu; when that happens,
ask for the same procedure by name instead, because the skills carry it too.

## Connect MCP

Copy the public
[`cursor.mcp.json`](https://github.com/GetStoreConnect/ai/blob/main/templates/mcp/cursor.mcp.json)
template to project `.cursor/mcp.json`, set `STORECONNECT_MCP_URL` to the exact
store `/mcp` URL in Cursor's environment, and complete native sign-in when
prompted. Prefer project scope when working with more than one store. Where
several stores share one domain, each is served at its own path, and that path
comes before `/mcp`: `https://<store-domain>/<store-path>/mcp`.

```shell
agent mcp list
agent mcp enable storeconnect
agent mcp login storeconnect
agent mcp list-tools storeconnect
agent mcp list
```

If Cursor cannot complete native sign-in, stop and follow the current
StoreConnect and Cursor documentation or an administrator-approved credential
interface.

Inspect the configured project URL before enabling the server. Keep normal
per-tool approvals enabled; do not use global `--approve-mcps` during initial
setup.

After connecting, use a read-only live operation to verify the intended store,
environment, and identity. The live tools and schemas are authoritative. Stage
writes, preview where available, obtain explicit approval, and recheck the
result.

See the full [MCP installation guide](https://github.com/GetStoreConnect/ai/blob/main/docs/mcp/install-and-verify.md).
A private client or partner implementation repository may retain required
customer domains and non-secret project identifiers; public examples must use
placeholders, and credentials must never be committed.
