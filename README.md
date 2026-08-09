<p align="center">
  <img src="https://res.cloudinary.com/hzkr6fi81/image/upload/v1731391867/media/StoreConnect_Logo_Gradient_REV03.svg" alt="StoreConnect" width="480">
</p>

# StoreConnect AI

This repository is how StoreConnect works with AI assistants.

It contains two things: **skills**, which teach an AI assistant how StoreConnect
actually works, and **connection details**, which let that assistant work on your
own store with your permission. Everything here is free, open, and safe to
install: it contains no store addresses, no passwords, and no customer data.

You do not need to be a developer to use it. If you administer a StoreConnect
store, this is written for you.

## The two halves, and why the difference matters

Almost every question about setup comes down to this distinction, so it is worth
30 seconds:

| | What it is | What it does |
|---|---|---|
| **Skills** | Written guidance, installed into your AI tool | Teaches the assistant how StoreConnect themes, forms, products, and POS work. Works offline. Touches nothing. |
| **MCP connection** | A live link to one specific store | Lets the assistant read and change that store's content, with your approval. |

Installing the skills connects nothing and changes nothing. It is closer to
handing someone the manual than handing them the keys. The MCP connection is the
keys, and you add it deliberately, for one store at a time.

You can use the skills on their own. Many people do.

## Install the skills

For any tool that supports the open skills format:

```bash
npx skills add GetStoreConnect/ai
```

Some products have their own package with a bit more in it (specialist agents,
ready-made commands). Pick yours:

| AI product | Install |
|---|---|
| Claude Code | `claude plugin marketplace add GetStoreConnect/ai --sparse .claude-plugin providers/claude/storeconnect` then `claude plugin install storeconnect@storeconnect-ai` |
| Claude web, desktop, mobile | Skills come with the connection. See [install and verify](docs/mcp/install-and-verify.md). |
| Codex and ChatGPT | `codex plugin marketplace add GetStoreConnect/ai --ref main` then `codex plugin add storeconnect@storeconnect-ai` |
| GitHub Copilot CLI | `copilot plugin marketplace add GetStoreConnect/ai` then `copilot plugin install storeconnect@storeconnect-ai` |
| Cursor | Uses the package at `providers/cursor/storeconnect` |
| Google Antigravity | `agy plugin install ./providers/antigravity/storeconnect`, or the skills at workspace scope |
| Gemini CLI | Install the folder at `providers/gemini/storeconnect` |
| Kiro | `npx skills add GetStoreConnect/ai --agent kiro-cli --skill '*' --copy` |
| Grok Build | Install from the xAI plugin marketplace |

Full step-by-step instructions for every product, including where each one keeps
its settings, are in
[install and verify](docs/mcp/install-and-verify.md).

## What the assistant learns

| Skill | What it helps with |
|---|---|
| `storeconnect-platform` | How StoreConnect fits together, and which skill to reach for |
| `storeconnect-liquid` | Liquid, the template language behind your storefront pages |
| `storeconnect-theme-development` | Theme structure, layouts, styling, and assets |
| `storeconnect-theme-review` | A read-only health check: accessibility, SEO, speed, content gaps |
| `storeconnect-forms` | Storefront forms, their fields, and validation |
| `storeconnect-components` | Live-updating parts of a page, such as cart drawers and filters |
| `storeconnect-controllers` | Server-side logic while a page renders: redirects, access rules, custom form handling |
| `storeconnect-debug-performance` | Working out why a page is slow or showing the wrong thing |
| `storeconnect-salesforce-data` | The StoreConnect object model in Salesforce, and data work |
| `storeconnect-sync-deploy` | Getting changes onto a store safely, in the right order |
| `storeconnect-apex-integration` | Custom Apex for StoreConnect stores |
| `storeconnect-pos-setup` | Point of sale setup: outlets, registers, staff, payments, hardware |
| `storeconnect-pos-customization` | Customizing POS screens, buttons, receipts, and labels |

Three of the packages also ship ready-made commands for the procedures that
should never be improvised:

| Command | What it does |
|---|---|
| `sc-auth` | Connects to one store and confirms which store, which environment, and who you are signed in as |
| `sc-publish` | Walks a change through review, your explicit approval, submission, and a live check afterwards |
| `sc-theme-review` | Runs the read-only theme audit and reports ranked findings |

Products without a commands feature carry the same procedures inside the skills,
so nothing is lost.

## Connecting an assistant to your store

### What MCP is, in plain terms

MCP (Model Context Protocol) is an industry standard for letting an AI tool work
with a system it does not own. StoreConnect uses it so an assistant can do the
things a person would do in your store: look up a product, draft a page, adjust
a theme, and then put the change in front of you for approval.

Three things make this simpler than it sounds:

- **There is nothing to install or run.** Your store hosts the connection
  itself, at `https://your-store.example.com/mcp`. No server to download, no
  extra service to pay for, no separate app in Salesforce.
- **The address belongs to your store alone.** Every store has its own. That is
  why installing skills cannot pick a store for you, and why nobody else's
  connection will work for yours.
- **You sign in as yourself.** The assistant inherits your access and nothing
  more. If you cannot do something in StoreConnect, neither can it.

### Check whether your store is ready

Open this address in any browser, with your own store's domain in place of the
example:

```text
https://your-store.example.com/.well-known/mcp.json
```

- **A short block of technical text (JSON)?** Your store supports MCP. That page
  is a public signpost, nothing more; it holds no private information and asks
  you to sign in to nothing.
- **Your store's "page not found" page?** Your store is running a version from
  before MCP existed. Read the next section.

This check is the answer, and a more reliable one than a version number: it tells
you what your store is serving right now. If it comes back as a not-found page,
your administrator or implementation partner can tell you where the upgrade sits
for your store.

### If your store has not been upgraded yet

This is the most common situation right now, and it is entirely normal. Here is
what it looks like, so you do not spend an afternoon assuming you configured
something wrong.

**What you will see.** Adding the connection appears to work, then fails the
moment your AI tool tries to use it. The exact wording depends on the product,
but it is some version of "could not connect", "not a valid MCP server", or a
404. Sign-in never opens, because there is nothing there to sign in to. Your
StoreConnect skills load fine, but no StoreConnect tools appear in the tool list.

**Nothing is broken.** Those attempts arrive at your store as ordinary web
traffic and get an ordinary "page not found" back. Your storefront, your orders,
and your data are untouched. Retrying will not change the outcome, and neither
will a different address: your store's own domain is the only one that could ever
work, so please do not go looking for another way in.

**What still works, and it is a genuine amount.** The skills are knowledge, and
knowledge does not need a connection. An assistant with them installed still
knows how StoreConnect Liquid, themes, forms, POS, and the Salesforce object
model work. It can help you write and review theme templates, plan a store
build, debug a page, or draft POS configuration. You then apply that work the way
you do today, through Salesforce or the StoreConnect CLI. What it cannot do is
read or change anything in the store by itself.

**What to do about it.** Email
[support@storeconnect.com](mailto:support@storeconnect.com) or ask your
implementation partner about upgrading. Once the store is on an MCP-enabled
version, the connection works with no change to anything you installed here.

### Connecting, once your store is ready

1. Get the exact address from your StoreConnect administrator. It is your store
   domain with `/mcp` on the end, over HTTPS, and nothing else.
2. In your AI tool, add a remote MCP server named `storeconnect` at that
   address.
3. Use the tool's own **Sign in** or **Log in** action and complete it in the
   StoreConnect page it opens.
4. Ask the assistant to confirm which store and environment it is connected to,
   and check that answer, before asking it to change anything.

Never paste a password, token, or key into a chat message, a settings file, or a
prompt. Every supported product has a proper sign-in flow. If yours does not
appear to, stop and ask your administrator rather than working around it.

The exact commands and settings locations for each product are in
[install and verify](docs/mcp/install-and-verify.md), and the reasoning behind
the connection rules is in
[connect and authenticate](docs/mcp/connection-and-auth.md).

## How changes reach your live store

A connected assistant cannot quietly edit your storefront. Changes go through
the same staged path a person's would:

1. It reads the current state and confirms it has the right store.
2. It stages one coherent change, rather than a scattering of edits.
3. It shows you a summary and, where the store offers one, a preview link.
4. **You approve it explicitly.** An assistant is not allowed to assume, infer,
   or reuse your approval.
5. It submits the change, and a person completes any required review in
   Salesforce.
6. It checks the live result afterwards, and reports warnings and rejections
   rather than declaring success early.

Deletions, bulk edits, price changes, theme activation, and anything touching
navigation or checkout are treated as high-impact and must be spelled out to you
before you approve them. The full workflow is documented in
[safe content-change workflow](docs/mcp/content-change-workflow.md).

## Working on a specific store's project

If your team keeps a repository for a store's theme or configuration, copy the
matching starter from
[`templates/project-context/`](templates/project-context/README.md) into it and
fill in the non-secret facts about that project: which store, which environment,
which theme. That is how an assistant knows where it is without you repeating
yourself every session.

Keep passwords and API tokens out of those files, always.

## Notes and limitations

- Google Antigravity, Kiro, and Grok Build are supported as **preview** routes
  until each has passed live acceptance against a target store.
- Agentforce Vibes is an **experimental** recipe rather than a supported
  package. Use it against a sandbox or test store only, keep approvals set to
  ask every time, and never choose an option that trusts all tools.
- Example themes under [`docs/examples/`](docs/examples/themes/README.md) are
  starting points for learning, not production code. Review anything you take
  from them.

## For developers and contributors

Content in this repository is generated from a canonical source maintained
alongside the StoreConnect documentation, which is what stops nine provider
packages from drifting apart. Editing a file here will not stick.

If you have found something wrong, **open an issue**: it reaches the people who
can fix it properly and the fix arrives in the next release. Read
[`CONTRIBUTING.md`](CONTRIBUTING.md) first, which also covers the build and
validation commands for maintainers. Security issues follow
[`SECURITY.md`](SECURITY.md) instead and must never go in a public issue.

<details>
<summary>Repository layout</summary>

```text
shared/
  skills/                  Canonical, portable Agent Skills
  agents/                  Canonical specialist-agent prompts
  commands/                Canonical slash-command procedures
  project-context/         Provider-neutral project context
  provider-fragments/      Canonical provider-specific render fragments
skills/                    Generated root catalog for generic skill installers
providers/
  antigravity/storeconnect/ Google Antigravity plugin
  claude/storeconnect/     Claude Code plugin
  codex/storeconnect/      Codex plugin
  gemini/storeconnect/     Gemini CLI extension
  copilot/storeconnect/    GitHub Copilot CLI plugin
  cursor/storeconnect/     Cursor plugin
  kiro/storeconnect/       Kiro skills package
  grok/storeconnect/       Grok Build skills package
templates/project-context/ Ready-to-copy context files for each provider
templates/mcp/             Non-secret MCP client configuration templates
docs/                      Architecture, MCP, and non-production examples
server.json                Variable-based official MCP Registry metadata
```

Registry-aware clients can consume [`server.json`](server.json), whose
`store_domain` variable lets an installer ask for a hostname without committing
one. Native starting points for each product live in
[`templates/mcp/`](templates/mcp/README.md). These describe the connection only;
the live server advertises its current tools after you connect.

</details>

## Support

Maintained by StoreConnect Client Success. For product help, email
[support@storeconnect.com](mailto:support@storeconnect.com) or read the
documentation at
[support.storeconnect.com](https://support.storeconnect.com).

Licensed under the [MIT License](LICENSE).
