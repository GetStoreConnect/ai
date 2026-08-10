# StoreConnect MCP client templates

These files are non-secret starting points for connecting supported AI clients
to one StoreConnect store. They are client configurations, not MCP server
implementations.

| Product | Template | Destination |
|---|---|---|
| Claude Code | [`claude-code.mcp.json`](claude-code.mcp.json) | Project `.mcp.json` |
| Codex | [`codex.config.toml`](codex.config.toml) | Merge into user or trusted-project `config.toml` |
| Gemini CLI | [`gemini.settings.json`](gemini.settings.json) | Merge into user or project `.gemini/settings.json` |
| Google Antigravity | [`antigravity.mcp-config.json`](antigravity.mcp-config.json) | Merge into workspace `.agents/mcp_config.json` |
| GitHub Copilot CLI | [`copilot.mcp-config.json`](copilot.mcp-config.json) | Project `.mcp.json` (preferred) or deliberate user/session scope |
| Cursor | [`cursor.mcp.json`](cursor.mcp.json) | Project `.cursor/mcp.json` |
| Kiro | [`kiro.mcp.json`](kiro.mcp.json) | Project or user Kiro MCP settings |
| Grok Build | [`grok.config.toml`](grok.config.toml) | Merge into user or project `.grok/config.toml` |
| Agentforce Vibes (experimental) | [`agentforce-vibes.mcp.json`](agentforce-vibes.mcp.json) | Merge into a Salesforce DX workspace `.mcp.json` |

## Use safely

1. Copy or merge only the `storeconnect` entry; do not overwrite other servers.
2. Set the full `https://<store-domain>/mcp` URL in the target implementation
   configuration or the environment inherited by the client.
3. Prefer the client's native OAuth flow.
4. Keep credentials out of tracked files.
5. After sign-in, verify the intended store, environment, and identity with a
   read-only operation from the live server.

Some clients support environment substitution for the URL; others use the
reserved `store.example.com` hostname as a value to replace in a local copy.
Variable-backed templates use `STORECONNECT_MCP_URL` without resolving it.
Antigravity requires the `serverUrl` key. Do not substitute another provider's
configuration shape. Every template contains connection details only; complete
authentication through the client's native sign-in flow. If the installed
client cannot sign in, stop and follow the current StoreConnect and client
documentation or an administrator-approved credential interface.

Keep `autoApprove` empty for Agentforce Vibes. Use **Ask every time** for
initial acceptance, review each write tool request individually, and never use
**Bypass (trust all)**. This recipe currently targets the stable desktop
extension, not Agentforce Vibes IDE (formerly Code Builder).

A private client or partner implementation repository may retain required
customer domains and non-secret project identifiers. Public examples must use
placeholders. Credentials must never be committed. See
[install and verify](../../docs/mcp/install-and-verify.md).
