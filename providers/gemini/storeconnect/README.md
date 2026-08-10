# StoreConnect for Gemini CLI

This package provides StoreConnect skills, project context, and Gemini CLI
specialist agents. Installing it does not connect a store or include
credentials.

Google routes personal free, Google AI Pro, and Google AI Ultra users to
Antigravity CLI. Use this Gemini CLI package for supported Gemini Code Assist
Standard or Enterprise, Google Cloud, and paid-key workflows; use the separate
StoreConnect Antigravity package for the personal tiers.

## Install

The extension manifest is nested in this monorepo, so install its provider
directory from a checkout rather than passing the repository root URL:

```shell
git clone --depth 1 https://github.com/GetStoreConnect/ai.git storeconnect-ai
gemini extensions install ./storeconnect-ai/providers/gemini/storeconnect
gemini extensions list
```

Use `/agents list` to inspect the specialist agents loaded from the
extension.

## Connect MCP

Add the intended store at project scope, then sign in from Gemini:

```shell
gemini mcp add --transport http --scope project \
  storeconnect "https://<store-domain>/mcp"
gemini
```

```text
/mcp auth storeconnect
/mcp list
/mcp schema
```

To use an environment-backed project setting, start from the public
[`gemini.settings.json`](https://github.com/GetStoreConnect/ai/blob/main/templates/mcp/gemini.settings.json)
template in the project's `.gemini/settings.json` and set `STORECONNECT_MCP_URL` in
Gemini's environment; the template's `httpUrl` key selects the streamable
HTTP transport.

If Gemini cannot complete native sign-in, stop and follow the current
StoreConnect and Gemini documentation or an administrator-approved credential
interface. A private client or partner implementation repository may retain
required customer domains and non-secret project identifiers; public examples
must use placeholders, and credentials must never be committed.

After connecting, use a read-only live operation to verify the intended store,
environment, and identity. Follow the live schemas, stage writes, preview where
available, obtain explicit approval, and recheck the result.

See the full [MCP installation guide](https://github.com/GetStoreConnect/ai/blob/main/docs/mcp/install-and-verify.md).
