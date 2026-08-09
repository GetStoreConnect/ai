# Project-context templates

Copy the template for the AI product used by a StoreConnect implementation
repository, then replace every angle-bracket placeholder. These files contain
project facts and safety boundaries only; reusable platform knowledge belongs
in the installed StoreConnect skills.

| Product | Template | Destination in an implementation repository |
|---|---|---|
| Claude Code | `claude/CLAUDE.md` | `CLAUDE.md` |
| Codex | `codex/AGENTS.md` | `AGENTS.md` |
| Gemini CLI | `gemini/GEMINI.md` | `GEMINI.md` |
| Antigravity CLI | `antigravity/AGENTS.md` | `AGENTS.md` |
| Antigravity 2.0 / IDE | `antigravity/storeconnect.md` | `.agents/rules/storeconnect.md`; set the workspace rule to Always On |
| GitHub Copilot | `copilot/copilot-instructions.md` | `.github/copilot-instructions.md` |
| Cursor | `cursor/storeconnect.mdc` | `.cursor/rules/storeconnect.mdc` |
| Kiro | `kiro/storeconnect.md` | `.kiro/steering/storeconnect.md` |
| Grok Build | `grok/AGENTS.md` | `AGENTS.md` |

A private client or partner implementation repository may retain required
customer domains and non-secret project identifiers in its project context.
Public examples must use placeholders. Never add credentials, customer records,
payment data, or other secrets. Complete connection authentication through the
target product's native sign-in flow or an administrator-approved credential
interface.
