# StoreConnect for Grok Build

This package is a Grok Build plugin: 13 skills, 5 specialist agents and 3 slash
commands. Installing it does not connect a store or include credentials.

## Package layout

Grok Build discovers a plugin's components by directory off the plugin root, so
this package uses the plugin layout rather than a bare skills tree:

```text
.grok-plugin/plugin.json   manifest
skills/<skill>/SKILL.md    13 skills
commands/*.md              3 slash commands
agents/*.md                5 specialist agents
```

Those three directory names are what xAI's catalog scanner reads, and the
manifest deliberately declares no component paths — placement is enough. An
earlier version of this package kept its skills under `.grok/skills/`, which the
scanner never looks at, so it would have indexed as zero components.

## Install

Once this plugin is listed in the [xAI plugin
marketplace](https://github.com/xai-org/plugin-marketplace), install it from
there — that is the supported route and it brings the commands and agents with
it.

To use the skills before then, or without the plugin, copy them into the project
you are working in. Grok discovers project skills under `./.grok/skills/`; it
does not scan a project `.agents/skills/` directory:

```shell
git clone --depth 1 https://github.com/GetStoreConnect/ai.git storeconnect-ai
mkdir -p .grok/skills
cp -R storeconnect-ai/providers/grok/storeconnect/skills/. .grok/skills/
```

Note the asymmetry: the package stores skills at `skills/` because that is the
plugin layout, while a manual project install reads them from `.grok/skills/`.
Copying between the two is expected.

User-wide alternatives are `~/.grok/skills/` and `~/.agents/skills/`. Use
`/skills` and `grok inspect` to verify discovery. A manual copy takes the skills
only — the commands and agents come with the plugin install. For persistent
project context, copy the public
[`AGENTS.md`](https://github.com/GetStoreConnect/ai/blob/main/templates/project-context/grok/AGENTS.md)
template to the implementation repository root and add only non-secret project
facts.

## Connect MCP

From the implementation repository root, first ensure `.grok/config.toml` is
covered by that repository's ignore policy. Then add the per-store connection:

```shell
grok mcp add --scope project --transport http \
  storeconnect "https://<store-domain>/mcp"
grok mcp list
grok mcp doctor storeconnect
grok inspect
```

Where several stores share one domain, each is served at its own path, and
that path comes before `/mcp`: `https://<store-domain>/<store-path>/mcp`.

StoreConnect MCP support for Grok Build is preview until it has passed live
acceptance for the target store and installed Grok release. Start `grok`, open
`/mcps`, select `storeconnect`, press `i`, and complete browser sign-in. Keep
`permission_mode = "ask"` (the default) in the user configuration and do not
enable `/always-approve` for a production or write-capable StoreConnect
connection.

The equivalent URL-only configuration is in the public
[`grok.config.toml`](https://github.com/GetStoreConnect/ai/blob/main/templates/mcp/grok.config.toml)
template. Use native sign-in. If the installed client cannot sign in, stop and
follow the current StoreConnect and Grok Build documentation or an
administrator-approved credential interface.

A private client or partner implementation repository may retain required
customer domains and non-secret project identifiers; public examples must use
placeholders, and credentials must never be committed.

After connecting, use a read-only live operation to verify the intended store,
environment, and identity. Follow the live schemas, stage writes, preview where
available, obtain explicit approval, and recheck the result. Keep normal tool
approval prompts enabled.

See the full [MCP installation guide](https://github.com/GetStoreConnect/ai/blob/main/docs/mcp/install-and-verify.md).
