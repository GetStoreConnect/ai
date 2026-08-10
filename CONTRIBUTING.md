# Contributing

Thank you for wanting to improve StoreConnect's AI packages. Please read this
first, because the way to contribute here is probably not what you expect.

## This repository is generated

Every skill, agent prompt, slash command, and provider package in this
repository is produced from a canonical source maintained by the StoreConnect
team alongside the StoreConnect documentation, so that guidance and
documentation for a platform release stay in step.

An edit made here is not durable. The next sync overwrites it, and the checks in
this repository will reject a pull request whose generated output no longer
matches its source. That is deliberate: it is what keeps nine provider packages
from quietly disagreeing with each other.

## How to contribute

**Open an issue.** Describe the problem or the improvement you want. The
StoreConnect team reviews every report, makes the change in the canonical source
where one is warranted, and the fix reaches this repository on the next release.

Please do not open a pull request that edits skills, agents, commands, or
provider packages. It cannot be merged, and an issue gets your point to the
people who can act on it faster.

### What makes a report actionable

The more of this you can give us, the faster it turns into a fix:

- **Which skill, agent, or command** — the directory or file name.
- **Which product and version** — the AI product you were using, and its
  version, since behavior differs between them.
- **What the agent did, and what it should have done instead.** A transcript
  excerpt is ideal.
- **Which StoreConnect version** the store was on, where it matters.
- **Whether it is wrong or merely missing.** Incorrect guidance is a higher
  priority than absent guidance, and we triage them differently.

If a skill told an agent something factually wrong about StoreConnect, say so
plainly and quote it. That is the most valuable report we receive.

### Do not report security issues here

A vulnerability, a leaked credential, or anything that could harm a live store
follows [SECURITY.md](SECURITY.md) instead. Do not open a public issue for it.

### Reporting installation problems

If a package fails to install or load, include the exact command you ran, the
full error, and your product version. Installation is the one area where a small
pull request against a provider README or manifest may be appropriate — ask in
the issue first.

## What we will not accept

- A static catalog of MCP tool names and schemas. Connected StoreConnect
  servers advertise their live tool surface at runtime, and a copied catalog
  goes stale silently.
- A universal or invented plugin format. Each provider package follows its own
  product's native layout.
- Credentials, production records, customer data, a real customer hostname, or
  unlicensed material, in any file.
- Guidance that routes around staging, preview, approval, or environment
  confirmation.

## For maintainers

Content changes are made in the canonical source, not here. This repository
owns provider packaging, the validation suite, and the release gates.

Use Node.js 22 or newer:

```bash
npm ci
npm run render
npm run check
```

`npm run render` rebuilds the portable catalog and every provider package from
the synced canonical content. Review the generated diff, but fix any problem in
the canonical source or the renderer — never in a generated file. `npm run check`
runs drift detection, repository linting, MCP configuration regression tests,
and structural validation in the same order as CI.

Every published change to provider content bumps the shared semantic version in
`package.json` and each versioned provider manifest. Installed clients may use
that value as their update cache key.

To inspect a provider-native MCP configuration without touching a client:

```bash
npm run mcp:config -- \
  --provider <provider> \
  --url https://store.example.com/mcp
```

Use `store.example.com` or the documented Registry placeholder in committed
examples. Resolved store endpoints and credentials stay out of this repository
entirely.

### Release gates

For a Claude package release, run Anthropic's native strict validators with the
current supported Claude Code version:

```bash
claude plugin validate . --strict
claude plugin validate providers/claude/storeconnect --strict
```

For an MCP Registry release, keep ordinary pull-request checks deterministic and
run the official network-backed validator as a separate gate. Install the
reviewed pinned `mcp-publisher` release using its published checksum, then run
from the repository root:

```bash
mcp-publisher --version
mcp-publisher validate
```

The currently reviewed publisher is `1.8.0`. Re-review the release and checksum
before changing that pin. Confirm the public `websiteUrl` is readable, the
namespace is owned, the resolved store endpoint has passed live acceptance, and
the `server.json` version has never been published with different metadata.
