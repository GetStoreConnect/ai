# StoreConnect for Google Antigravity

This package provides StoreConnect skills for Antigravity CLI (as a native
plugin) and for Antigravity 2.0 and Antigravity IDE (as workspace skills).
Installing it does not connect a store or include credentials.

## Install

For Antigravity CLI, install the native plugin from a checkout of the
repository; Antigravity stages installed plugins under
`~/.gemini/antigravity-cli/plugins/`:

```shell
agy plugin install ./providers/antigravity/storeconnect
agy plugin list
```

For Antigravity 2.0 or IDE, install the skills at workspace scope so they land
in `.agents/skills/`:

```shell
npx skills add GetStoreConnect/ai -a antigravity
# Or for Antigravity CLI without the plugin:
npx skills add GetStoreConnect/ai -a antigravity-cli
```

For Antigravity CLI, copy the supplied
[`AGENTS.md`](https://github.com/GetStoreConnect/ai/blob/main/templates/project-context/antigravity/AGENTS.md)
to the implementation repository root. For Antigravity 2.0 or IDE, copy the
supplied
[`storeconnect.md`](https://github.com/GetStoreConnect/ai/blob/main/templates/project-context/antigravity/storeconnect.md)
to `.agents/rules/storeconnect.md`.

## Connect MCP

Merge this entry into the workspace's local `.agents/mcp_config.json` and
replace the reserved hostname:

```json
{
  "mcpServers": {
    "storeconnect": {
      "serverUrl": "https://store.example.com/mcp"
    }
  }
}
```

Where several stores share one domain, each is served at its own path, and
that path comes before `/mcp`: `https://<store-domain>/<store-path>/mcp`.

Keep the required `serverUrl` key. StoreConnect remote OAuth support for
Antigravity is preview until it has passed live acceptance for the target store
and installed Antigravity release.

In Antigravity 2.0 or IDE, use **Customizations → Installed MCP Servers** and
complete sign-in when prompted. In Antigravity CLI, use `/mcp` to inspect and
manage the connection; follow a native sign-in prompt only when the installed
client offers one. If authentication is unavailable, stop and ask the
StoreConnect administrator rather than adding an undocumented credential.
Use `/skills` in Antigravity CLI to verify the plugin.

Keep MCP permissions in **Ask** mode and approve write operations individually.
After connecting, use a read-only live operation to verify the intended store,
environment, and identity. Follow the live schemas, stage writes, preview where
available, obtain explicit approval, and recheck the result.

A private client or partner implementation repository may retain required
customer domains and non-secret project identifiers; public examples must use
placeholders, and credentials must never be committed.

See Google's current documentation for
[plugins](https://antigravity.google/docs/plugins),
[Agent Skills](https://antigravity.google/docs/skills), and
[MCP](https://antigravity.google/docs/mcp), plus the StoreConnect
[MCP installation guide](https://github.com/GetStoreConnect/ai/blob/main/docs/mcp/install-and-verify.md).
