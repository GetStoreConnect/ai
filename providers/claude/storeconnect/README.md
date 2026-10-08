# StoreConnect Agent Skills for Claude

This package provides StoreConnect skills, specialist agents, and slash commands
for Claude Code, Cowork, and the Claude web, desktop, and mobile apps. Installing
it does not connect a store or include credentials.

## Install

Install from one source only. Both sources provide the same plugin.

### From the Claude directory

StoreConnect Agent Skills is listed in Anthropic's plugin directory. In Claude,
open **Customize**, then **Plugins**, search for StoreConnect, and select
**Add**, or open the
[directory listing](https://claude.ai/customize/plugins/id/8467d2f4-6bd5-4b19-a9e3-a353610db5f4%40anthropic-plugin-directory)
directly. Claude Code receives the plugin through account sync when it is
signed in with the same claude.ai account.

In the Claude web, desktop, and mobile apps, the specialist agents are not used
and the slash commands load as skills.

### From this repository

Use this source for Claude Code signed in with an API key, or for a scripted
install:

```bash
claude plugin marketplace add GetStoreConnect/ai \
  --sparse .claude-plugin providers/claude/storeconnect
claude plugin install storeconnect@storeconnect-ai
```

## Connect MCP

Each store has its own endpoint. Add the exact URL supplied by the StoreConnect
administrator and use Claude Code's native sign-in flow:

```shell
claude mcp add --transport http --scope local \
  storeconnect "https://<store-domain>/mcp"
claude mcp login storeconnect
claude mcp list
```

Where several stores share one domain, each is served at its own path, and
that path comes before `/mcp`: `https://<store-domain>/<store-path>/mcp`.

If Claude Code cannot complete native sign-in, stop and follow the current
StoreConnect and Claude Code documentation or an administrator-approved
credential interface. Credentials must never be committed or placed in
prompts.

A private client or partner implementation repository may retain required
customer domains and non-secret project identifiers; public examples must use
placeholders.

After connecting, use a read-only operation from the live server to verify the
intended store, environment, and identity. The live server's tools and schemas
are authoritative. Stage writes, preview where available, obtain explicit
approval, and recheck the result.

## Commands

| Command | Purpose |
|---|---|
| `/storeconnect:sc-auth` | Resolve one store's endpoint, sign in, and verify store, environment, and identity |
| `/storeconnect:sc-publish` | Review, approve, submit, and verify a staged change |
| `/storeconnect:sc-theme-review` | Run the read-only theme and storefront audit |

Run `/storeconnect:sc-auth` before any command that reads or writes store data.

The included theme-review agent is restricted to local read and public-web
inspection tools. Use the main session with an explicitly read-only
StoreConnect identity when a review also needs live store data.

See the full [MCP installation guide](https://github.com/GetStoreConnect/ai/blob/main/docs/mcp/install-and-verify.md).
