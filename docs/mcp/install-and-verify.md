# Install and verify the StoreConnect MCP connection

StoreConnect MCP is a managed remote service. There is no local MCP server to
download or run. Skills and provider packages add guidance; the MCP connection
adds the live capabilities for one store.

## Before connecting

Obtain the exact MCP URL from the StoreConnect administrator:

```text
https://<store-domain>/mcp
https://<store-domain>/<store-path>/mcp
```

The second form is for a store served at a path, which is how several stores
share one domain. The commands and templates below all show the pathless form;
substitute the store's own address, path included, wherever they do. See
[connect and authenticate](connection-and-auth.md) for how the address is
resolved and which clients the browser sign-in accepts.

Treat a customer hostname as client information. Public examples must use
placeholders. A private client or partner implementation repository may retain
required customer domains and non-secret project identifiers. Do not copy a
connection from another customer.

Use the provider's native OAuth or sign-in flow. If the installed client cannot
sign in, stop and follow the current StoreConnect and client documentation or
an administrator-approved credential interface. Credentials must never be
committed or placed in prompts, chat, shell history, or project instructions.

## Render a provider configuration

From this repository, print a provider-native example without writing a file:

```bash
npm run mcp:config -- \
  --provider cursor \
  --url https://store.example.com/mcp
```

Replace the reserved hostname with the intended store URL in the target
implementation configuration. Review the connection-only output before merging
its `storeconnect` entry into an existing client configuration, then use the
client's native sign-in flow.

## Claude web, Desktop, and mobile

For an individual plan, open **Settings → Customize → Connectors → Add custom
connector**, enter the store's `/mcp` URL, and complete sign-in. For Team or
Enterprise, an Owner or Primary Owner first adds the custom web connector under
**Organization settings → Connectors**; each member then connects their own
identity under **Customize → Connectors**.

Claude's remote connectors reach MCP from Anthropic's cloud service, so the
store endpoint must be publicly reachable. Follow Anthropic's current
[custom connector guidance](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)
for plan-specific UI and network requirements.

Enable the connector only in conversations that need it. Never paste an access
secret into a conversation.

For the StoreConnect skills, add **StoreConnect Agent Skills** from the
[Claude directory](https://claude.ai/customize/plugins/id/8467d2f4-6bd5-4b19-a9e3-a353610db5f4%40anthropic-plugin-directory).
The plugin adds guidance only and does not connect a store.

## Claude Code

The optional StoreConnect plugin is listed in the Claude directory as
**StoreConnect Agent Skills**. Added on claude.ai, it reaches Claude Code
through account sync when Claude Code is signed in with the same account. With
an API key, or for a scripted install, install it from the public marketplace
instead:

```bash
claude plugin marketplace add GetStoreConnect/ai \
  --sparse .claude-plugin providers/claude/storeconnect
claude plugin install storeconnect@storeconnect-ai
```

Connect and sign in:

```bash
claude mcp add --transport http --scope local \
  storeconnect "https://<store-domain>/mcp"
claude mcp login storeconnect
claude mcp list
```

Local scope is private to the current project and avoids exposing one store's
connection in unrelated workspaces. For a shareable project-scope declaration,
copy
[`claude-code.mcp.json`](../../templates/mcp/claude-code.mcp.json) to an
untracked `.mcp.json`, set `STORECONNECT_MCP_URL` in the environment inherited
by Claude Code, and approve the project server.

## Codex

Install the optional StoreConnect plugin, then start a new session so Codex
discovers its skills. The plugin is supported by Codex CLI, the ChatGPT
desktop app, and ChatGPT web Work mode; IDE integrations can use the portable
root `skills/` catalog.

```bash
codex plugin marketplace add GetStoreConnect/ai --ref main
codex plugin add storeconnect@storeconnect-ai
codex plugin list
```

For an implementation repository, prefer a project `.codex/config.toml` based
on [`codex.config.toml`](../../templates/mcp/codex.config.toml). Codex does
not expand environment variables in `config.toml`, so replace the reserved
hostname with the store's exact `/mcp` URL in the target implementation
configuration, then sign in and inspect it:

```bash
codex mcp login storeconnect
codex mcp list
```

For a single-store user-wide connection, use:

```bash
codex mcp add storeconnect --url "https://<store-domain>/mcp"
```

If Codex cannot complete native sign-in, stop and follow the current
StoreConnect and Codex documentation or an administrator-approved credential
interface.

## Gemini CLI

Google routes personal free, Google AI Pro, and Google AI Ultra users to
Antigravity CLI. Use Gemini CLI for supported Gemini Code Assist Standard or
Enterprise, Google Cloud, and paid-key workflows; see Google's
[transition announcement](https://github.com/google-gemini/gemini-cli/discussions/27274)
for the current audience split.

Install the extension from the latest release, then add a project connection
and sign in. Each release attaches the provider directory as an archive with
`gemini-extension.json` at its root, so the repository URL works even though
the manifest is nested in this monorepo; to run unreleased changes, install
`providers/gemini/storeconnect` from a checkout instead.

```bash
gemini extensions install https://github.com/GetStoreConnect/ai
gemini extensions list
gemini mcp add --transport http --scope project \
  storeconnect "https://<store-domain>/mcp"
gemini
```

```text
/mcp auth storeconnect
/mcp list
/mcp schema
```

To keep the hostname out of tracked settings, use
[`gemini.settings.json`](../../templates/mcp/gemini.settings.json) in a local
project `.gemini/settings.json` and set `STORECONNECT_MCP_URL` before starting
Gemini; the `httpUrl` key selects the streamable HTTP transport. Use
`/agents list` to inspect the specialist agents loaded from the extension.

## Google Antigravity

For Antigravity CLI, install the native plugin from a checkout; Antigravity
stages installed plugins under `~/.gemini/antigravity-cli/plugins/`:

```bash
agy plugin install ./providers/antigravity/storeconnect
agy plugin list
```

For Antigravity 2.0 or IDE, install the skills at workspace scope with
`npx skills add GetStoreConnect/ai -a antigravity` so they land in
`.agents/skills/`. For Antigravity CLI, copy
[`AGENTS.md`](../../templates/project-context/antigravity/AGENTS.md) to the
implementation repository root. For Antigravity 2.0 or IDE, copy
[`storeconnect.md`](../../templates/project-context/antigravity/storeconnect.md)
to `.agents/rules/storeconnect.md`.

Merge the `storeconnect` entry from
[`antigravity.mcp-config.json`](../../templates/mcp/antigravity.mcp-config.json)
into the workspace `.agents/mcp_config.json`, replace the reserved hostname in
the local copy, and retain the required `serverUrl` key.

StoreConnect remote OAuth support for Antigravity is preview until it has
passed live acceptance for the target store and installed Antigravity release.
In Antigravity 2.0 or IDE, use **Customizations → Installed MCP Servers** and
complete sign-in when prompted. In Antigravity CLI, use `/mcp` to inspect and
manage the connection; follow a native sign-in prompt only when the installed
client offers one. If authentication is unavailable, stop and ask the
StoreConnect administrator rather than adding an undocumented credential.
Keep MCP permissions in **Ask** mode and approve write operations individually.

## GitHub Copilot CLI

Install the optional plugin and verify that its components loaded:

```bash
copilot plugin marketplace add GetStoreConnect/ai
copilot plugin install storeconnect@storeconnect-ai
copilot plugin list
```

In an interactive session, use `/agent` and `/skills list` to verify the
specialist agents and skills. For implementation repositories, prefer an
untracked project `.mcp.json` based on
[`copilot.mcp-config.json`](../../templates/mcp/copilot.mcp-config.json). Trust
the intended workspace, then inspect the configuration source and server:

```bash
copilot mcp list --json
copilot mcp get storeconnect --json
```

If the server reports that authentication is needed, use
`/mcp auth storeconnect`. The template lists `"tools": ["*"]` explicitly —
the default full live tool selection — so the choice stays visible in review;
this selects tools and does not auto-approve calls. Keep normal per-call
approvals enabled and substitute a concrete allowlist when the required live
tool names are known.

For a deliberately user-global, single-store connection, use:

```bash
copilot mcp add storeconnect --type http \
  --url "https://<store-domain>/mcp" --tools "*"
```

For one session, pass an otherwise untracked configuration with
`copilot --additional-mcp-config @/absolute/path/storeconnect.mcp.json`.

## Cursor

Copy [`cursor.mcp.json`](../../templates/mcp/cursor.mcp.json) to project
`.cursor/mcp.json`, set `STORECONNECT_MCP_URL` in Cursor's environment, and
complete sign-in when prompted. Prefer project scope when working with more
than one store.

Cursor IDE and Agent CLI share this configuration. Verify it with:

```bash
agent mcp list
agent mcp enable storeconnect
agent mcp login storeconnect
agent mcp list-tools storeconnect
agent mcp list
```

Inspect the configured project URL before enabling the server. Keep normal
per-tool approvals enabled; do not use global `--approve-mcps` during initial
setup. To load the optional package in one checkout-based CLI session, run from
the monorepo root:

```bash
agent --plugin-dir ./providers/cursor/storeconnect
```

## Kiro

From the target implementation repository, install the portable skills:

```bash
npx skills add GetStoreConnect/ai --agent kiro-cli --skill '*' --copy
```

Kiro's built-in agents and current CLI custom agents load workspace skills by
default. If `chat.disableInheritingDefaultResources` is enabled, add an explicit
`skill://.kiro/skills/**/SKILL.md` resource to each custom agent that needs the
catalog.

Merge the `storeconnect` entry from
[`kiro.mcp.json`](../../templates/mcp/kiro.mcp.json) into project
`.kiro/settings/mcp.json` or user `~/.kiro/settings/mcp.json`. Replace the
reserved hostname only in the local copy.

StoreConnect MCP support for Kiro is preview until it has passed live acceptance
for the target store and installed Kiro release. In Kiro IDE, save the
configuration, complete browser sign-in, and confirm the connection in the MCP
panel. Review each MCP tool request before approving it. In Kiro CLI, use
`/mcp` to inspect status; use `/mcp auth storeconnect` only to force
re-authentication. Keep `autoApprove` empty.

## Grok Build

The Grok package is a plugin: its manifest is at `.grok-plugin/plugin.json` and
its components sit at `skills/`, `commands/` and `agents/`, which is where xAI's
catalog scanner reads them. Once the plugin is listed in the [xAI plugin
marketplace](https://github.com/xai-org/plugin-marketplace), install it from
there and the commands and agents come with it.

For a manual project install of the skills alone, note the asymmetry: the package
stores them at `skills/` because that is the plugin layout, while Grok discovers
*project* skills under `./.grok/skills/` and does not scan a project
`.agents/skills/` directory. Copy between the two:

```bash
git clone --depth 1 https://github.com/GetStoreConnect/ai.git storeconnect-ai
mkdir -p .grok/skills
cp -R storeconnect-ai/providers/grok/storeconnect/skills/. .grok/skills/
```

User-wide alternatives are `~/.grok/skills/` and `~/.agents/skills/`. Before
adding a customer URL, ensure `.grok/config.toml` is covered by the
implementation repository's ignore policy. Then, from that repository root,
add the connection and inspect it:

```bash
grok mcp add --scope project --transport http \
  storeconnect "https://<store-domain>/mcp"
grok mcp list
grok mcp doctor storeconnect
grok inspect
```

StoreConnect MCP support for Grok Build is preview until it has passed live
acceptance for the target store and installed Grok release. Start `grok`, open
`/mcps`, select `storeconnect`, press `i`, and complete browser sign-in. Keep
`permission_mode = "ask"` (the default) in the user configuration and do not
enable `/always-approve` for a production or write-capable StoreConnect
connection.

The URL-only form is in
[`grok.config.toml`](../../templates/mcp/grok.config.toml). Public examples
must use placeholders. A private client or partner implementation repository
may retain the required customer domain and non-secret project identifiers;
credentials must never be committed.

## Agentforce Vibes

Agentforce Vibes support is experimental and currently targets the current
stable desktop extension for VS Code. Open the actual StoreConnect
implementation's Salesforce DX project root—not this supplemental repository
by itself—and complete Salesforce's
[setup checklist](https://developer.salesforce.com/docs/platform/agentforcevibes/guide/afv-user-setup.html).
Confirm the project has `sfdx-project.json`, current Salesforce CLI and
Extension Pack versions, the intended authorized org, and an active Vibes
entitlement. Agentforce Vibes IDE (formerly Code Builder) is not covered by
this recipe.

Open **Toolkit → MCP Servers → + Add Server → Switch to JSON** and merge the
`storeconnect` entry from
[`agentforce-vibes.mcp.json`](../../templates/mcp/agentforce-vibes.mcp.json)
into the workspace `.mcp.json`.

Set `STORECONNECT_MCP_URL` in the environment inherited by VS Code, keep
`autoApprove` empty, and complete the client's native sign-in flow. If sign-in
is unavailable, stop and follow the current StoreConnect and Agentforce Vibes
documentation or an administrator-approved credential interface. Use **Ask
every time** for initial acceptance; **Run safe defaults** is appropriate only
after read-only verification. Review and approve each StoreConnect write tool
request individually and never use **Bypass (trust all)**. The empty
`autoApprove` list does not override the session mode.

Disable unrelated MCP servers for the StoreConnect session so Vibes can use its
limited simultaneous tool budget on the task. Use Vibes only in a sandbox or
test store until connection, environment-variable resolution, the exact
workspace `.mcp.json` location and accepted server fields, read-only identity
verification, staged changes, access management, and approval behavior have
passed live acceptance for the installed version.

Keep Vibes debug logging off during normal use. If diagnostics are required,
enable **Redact sensitive data** before reproducing the issue, then review logs
and full traces before sharing them. Never add traces to this repository. Ask
the StoreConnect administrator to reset access if an unredacted trace may have
captured sensitive data.

## Other MCP clients

Configure a remote Streamable HTTP server named `storeconnect` with the store's
`https://<store-domain>/mcp` URL, or `https://<store-domain>/<store-path>/mcp`
where several stores share the domain, and use the client's native OAuth or
sign-in flow. A client that completes sign-in through its vendor's own hosted
callback address can do so only where StoreConnect has listed that address; see
[connect and authenticate](connection-and-auth.md). If the client cannot sign
in, stop and follow the current StoreConnect and client documentation or an
administrator-approved credential interface.

Registry-aware clients can use the root [`server.json`](../../server.json) and
supply only the requested store address.

## Verify without making a change

1. Confirm `storeconnect` is connected in the provider's MCP status view.
2. Inspect the tools and schemas advertised by the authenticated live server.
3. Use a read-only live operation to confirm the intended store, environment,
   and identity.
4. Stop after verification. A successful connection is not approval to write.

For writes, follow the [safe content-change workflow](content-change-workflow.md):
stage, review, preview where available, obtain explicit approval, submit, and
recheck the result.

## Troubleshooting

| Symptom | Safe next step |
|---|---|
| StoreConnect sign-in does not open or complete | Confirm the exact HTTPS MCP URL, including the store's path if it is served at one, and retry the provider's native sign-in action. |
| Sign-in reports that the client's redirect address is not on the store's allow list | Stop. Ask StoreConnect support to list the client, giving the product name and the address shown with the refusal. |
| Sign-in reports that the client asked for a different endpoint than the store's | The message names the address the store expects. Correct the address in the client and sign in again. |
| The address is refused because no store is configured at it, or because several stores share the domain | Use the store's own path in the address. Confirm it with the StoreConnect administrator. |
| Connection worked earlier but now returns an authentication error | Re-run the client's native sign-in action. |
| Gemini OAuth does not open or return | Retry from a local browser-capable session; browserless SSH and container sessions cannot complete its loopback flow. |
| Gemini ignores project MCP settings | Review the intended workspace with `/permissions`; untrusted workspaces do not load project MCP servers. |
| Connection succeeds but an operation is unavailable | Ask the StoreConnect administrator to review access; do not try another route or credential. |
| Client reports an unresolved variable | Set it in the environment inherited by that client, or use a local untracked configuration. |
| Two StoreConnect entries appear | Remove the older user, workspace, or plugin entry so only the intended configuration remains. |
| Tools differ from an example | Follow the authenticated live server; do not recreate or rename tools from memory. |
| Identity or environment is wrong | Stop, remove the entry, and reconnect using the correct store URL and account. |

## Remove or replace a connection

Use the client's native removal command or delete only the `storeconnect` entry
from local configuration. Removing a client entry does not revoke server-side
access; ask the StoreConnect administrator to revoke access when required.

```bash
claude mcp remove storeconnect
codex mcp remove storeconnect
copilot mcp remove storeconnect
gemini mcp remove storeconnect --scope project
grok mcp remove storeconnect
```

`copilot mcp remove` removes only a user-level entry. Remove `storeconnect`
from the project `.mcp.json` and reload Copilot to remove a workspace entry.
The optional package has its own lifecycle:

```bash
copilot plugin update storeconnect
copilot plugin uninstall storeconnect
```

For Antigravity, remove only the `storeconnect` MCP entry, then uninstall the
separate plugin if it is no longer needed:

```bash
agy plugin uninstall storeconnect
```

Removing Gemini's project MCP entry does not remove the store-neutral extension.
To remove that package as well, run:

```bash
gemini extensions uninstall storeconnect
```
