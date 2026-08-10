# StoreConnect for Kiro

This package provides StoreConnect skills in Kiro's native `.kiro/skills/`
layout, plus a Power manifest for the Kiro powers registry. Installing skills
does not connect a store or include credentials.

## The Power

[`POWER.md`](POWER.md) is the registry-facing entry point, in the shape
[kirodotdev/powers](https://github.com/kirodotdev/powers) ships: frontmatter
carrying `name`, `displayName`, `description`, `keywords` and `author`, then a
body describing the capabilities, how to install the skills, and how to connect
to a store.

It is deliberately the lightweight form. Powers in that registry usually pair
`POWER.md` with a `steering/` directory, but restating 13 skills as steering
documents would duplicate the canonical content and then drift from it. This
Power points at the skills instead.

`POWER.md` directs each user to the public Kiro connection template. The target
store URL is supplied by the StoreConnect administrator and is configured only
in the implementation project or the user's Kiro settings.

To submit it, publish the repository and submit the link at
[kiro.dev/powers/submit](https://kiro.dev/powers/submit/).

## Install

From the target implementation repository, install the portable catalog at
project scope:

```shell
npx skills add GetStoreConnect/ai --agent kiro-cli --skill '*' --copy
```

Kiro also supports user-level skills under `~/.kiro/skills/`. Confirm the
StoreConnect skills appear in the session's skill listing before relying on
them.

Kiro's built-in agents load workspace and global skills automatically. Current
Kiro CLI custom agents also inherit those default resources unless
`chat.disableInheritingDefaultResources` is enabled. When inheritance is
disabled, or when intentionally scoping a custom agent, add only the required
skill resources, for example:

```json
{
  "resources": [
    "skill://.kiro/skills/**/SKILL.md"
  ]
}
```

For optional project guidance, copy the public
[`storeconnect.md`](https://github.com/GetStoreConnect/ai/blob/main/templates/project-context/kiro/storeconnect.md)
starter to `.kiro/steering/storeconnect.md` and add only non-secret project
facts.

## Connect MCP

Merge the `storeconnect` entry from the public
[`kiro.mcp.json`](https://github.com/GetStoreConnect/ai/blob/main/templates/mcp/kiro.mcp.json)
template into project `.kiro/settings/mcp.json` or user
`~/.kiro/settings/mcp.json`. Replace the reserved hostname only in the local
copy. A private client or partner implementation repository may retain required
customer domains and non-secret project identifiers; public examples must use
placeholders, and credentials must never be committed.

StoreConnect MCP support for Kiro is preview until it has passed live acceptance
for the target store and installed Kiro release. In Kiro IDE, save the
configuration, complete browser sign-in, and confirm the connection in the MCP
panel. Review each MCP tool request before approving it. In Kiro CLI, use
`/mcp` to inspect status; use `/mcp auth storeconnect` only to force
re-authentication. Keep `autoApprove` empty.

If the installed client cannot sign in, stop and follow the current
StoreConnect and Kiro documentation or an administrator-approved credential
interface.

After connecting, use a read-only live operation to verify the intended store,
environment, and identity. Follow the live schemas, review the proposed
outcome, use a supported preview where available, obtain explicit approval, and
verify the result. StoreConnect and Salesforce synchronize asynchronously;
wait, re-read and never repeat a write merely because it is not visible yet.

See the full [MCP installation guide](https://github.com/GetStoreConnect/ai/blob/main/docs/mcp/install-and-verify.md).
