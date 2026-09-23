# StoreConnect for Claude Code

This package provides StoreConnect skills, specialist agents, and slash commands
for Claude Code. Installing it does not connect a store or include credentials.

## Install

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
