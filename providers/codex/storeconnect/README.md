# StoreConnect for Codex

This package provides StoreConnect skills for Codex CLI, the ChatGPT desktop
app, and ChatGPT web Work mode. Installing it does not connect a store or
include credentials. Start a new session after installing the plugin so Codex
discovers its skills. Codex IDE integrations can use the portable root
`skills/` catalog instead.

## Install

```shell
codex plugin marketplace add GetStoreConnect/ai --ref main
codex plugin add storeconnect@storeconnect-ai
codex plugin list
```

## Connect MCP

For implementation repositories, prefer a project `.codex/config.toml` based
on the public
[`codex.config.toml`](https://github.com/GetStoreConnect/ai/blob/main/templates/mcp/codex.config.toml)
template. Codex does not expand environment variables in `config.toml`, so
replace the reserved hostname with the store's exact `/mcp` URL directly in
the target implementation configuration, then sign in and inspect it:

```shell
codex mcp login storeconnect
codex mcp list
```

For a single-store user-wide connection, the native command is:

```shell
codex mcp add storeconnect --url "https://<store-domain>/mcp"
```

Where several stores share one domain, each is served at its own path, and
that path comes before `/mcp`: `https://<store-domain>/<store-path>/mcp`.

If Codex cannot complete native sign-in, stop and follow the current
StoreConnect and Codex documentation or an administrator-approved credential
interface. Credentials must never be committed or placed in prompts.

A private client or partner implementation repository may retain required
customer domains and non-secret project identifiers; public examples must use
placeholders.

After connecting, use a read-only live operation to verify the intended store,
environment, and identity. Follow the live tool schemas, stage writes, preview
where available, obtain explicit approval, and recheck the result.

See the full [MCP installation guide](https://github.com/GetStoreConnect/ai/blob/main/docs/mcp/install-and-verify.md).
