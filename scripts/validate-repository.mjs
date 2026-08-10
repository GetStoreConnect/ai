#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const findings = [];

const EXPECTED_SKILLS = [
  "storeconnect-apex-integration",
  "storeconnect-components",
  "storeconnect-controllers",
  "storeconnect-debug-performance",
  "storeconnect-forms",
  "storeconnect-liquid",
  "storeconnect-platform",
  "storeconnect-pos-customization",
  "storeconnect-pos-setup",
  "storeconnect-salesforce-data",
  "storeconnect-sync-deploy",
  "storeconnect-theme-development",
  "storeconnect-theme-review",
];

const EXPECTED_AGENTS = [
  "sc-pos-developer",
  "sc-salesforce-manager",
  "sc-store-designer",
  "sc-theme-developer",
  "sc-theme-reviewer",
];

// Claude, Cursor and Grok Build all auto-discover a plugin-level commands
// directory. The Codex plugin manifest spec and the documented Copilot CLI
// plugin layout do not define one, so those packages carry no commands.
const EXPECTED_COMMANDS = ["sc-auth", "sc-publish", "sc-theme-review"];
const COMMAND_PROVIDERS = new Set(["claude", "cursor", "grok"]);

const PROVIDERS = {
  antigravity: {
    packageRoot: "providers/antigravity/storeconnect",
    skillRoot: "providers/antigravity/storeconnect/skills",
    manifest: "providers/antigravity/storeconnect/plugin.json",
    entries: ["LICENSE", "README.md", "plugin.json", "skills"],
  },
  claude: {
    packageRoot: "providers/claude/storeconnect",
    skillRoot: "providers/claude/storeconnect/skills",
    manifest: "providers/claude/storeconnect/.claude-plugin/plugin.json",
    entries: [".claude-plugin", "LICENSE", "README.md", "agents", "commands", "skills"],
    agents: EXPECTED_AGENTS.map((name) => `${name}.md`),
    commands: EXPECTED_COMMANDS.map((name) => `${name}.md`),
  },
  codex: {
    packageRoot: "providers/codex/storeconnect",
    skillRoot: "providers/codex/storeconnect/skills",
    manifest: "providers/codex/storeconnect/.codex-plugin/plugin.json",
    entries: [".codex-plugin", "LICENSE", "README.md", "skills"],
  },
  copilot: {
    packageRoot: "providers/copilot/storeconnect",
    skillRoot: "providers/copilot/storeconnect/skills",
    manifest: "providers/copilot/storeconnect/plugin.json",
    entries: ["LICENSE", "README.md", "agents", "plugin.json", "skills"],
    agents: EXPECTED_AGENTS.map((name) => `${name}.agent.md`),
  },
  cursor: {
    packageRoot: "providers/cursor/storeconnect",
    skillRoot: "providers/cursor/storeconnect/skills",
    manifest: "providers/cursor/storeconnect/.cursor-plugin/plugin.json",
    entries: [".cursor-plugin", "LICENSE", "README.md", "agents", "commands", "skills"],
    agents: EXPECTED_AGENTS.map((name) => `${name}.md`),
    commands: EXPECTED_COMMANDS.map((name) => `${name}.md`),
  },
  gemini: {
    packageRoot: "providers/gemini/storeconnect",
    skillRoot: "providers/gemini/storeconnect/skills",
    manifest: "providers/gemini/storeconnect/gemini-extension.json",
    entries: ["GEMINI.md", "LICENSE", "README.md", "agents", "gemini-extension.json", "skills"],
    agents: EXPECTED_AGENTS.map((name) => `${name}.md`),
  },
  // Kiro is not a plugin host. Its unit of distribution is a Power — a top-level
  // POWER.md with frontmatter, optionally beside steering docs and an MCP config.
  // We ship the lightweight form: one POWER.md that points at the portable
  // skills tree, rather than restating 13 skills as steering documents that would
  // then drift from the canonical source.
  kiro: {
    packageRoot: "providers/kiro/storeconnect",
    skillRoot: "providers/kiro/storeconnect/.kiro/skills",
    entries: [".kiro", "LICENSE", "POWER.md", "README.md"],
    power: "providers/kiro/storeconnect/POWER.md",
  },
  // Grok Build is a real plugin host. xAI's catalog scanner reads skills/,
  // commands/ and agents/ off the plugin root and accepts the manifest at
  // .grok-plugin/plugin.json, so the package uses the plugin layout rather than
  // a bare skills tree.
  grok: {
    packageRoot: "providers/grok/storeconnect",
    skillRoot: "providers/grok/storeconnect/skills",
    manifest: "providers/grok/storeconnect/.grok-plugin/plugin.json",
    entries: [".grok-plugin", "LICENSE", "README.md", "agents", "commands", "skills"],
    agents: EXPECTED_AGENTS.map((name) => `${name}.md`),
    commands: EXPECTED_COMMANDS.map((name) => `${name}.md`),
  },
};

const SKILL_ROOTS = [
  { path: "shared/skills", generated: false },
  { path: "skills", generated: true },
  ...Object.values(PROVIDERS).map((provider) => ({
    path: provider.skillRoot,
    generated: true,
  })),
];

const SHIPPED_ROOTS = [
  "skills",
  ...Object.values(PROVIDERS).map((provider) => provider.packageRoot),
];

const GENERATED_SKILL_NOTICE = "<!-- Generated from shared/skills. Do not edit this copy. -->";
const GENERATED_AGENT_NOTICE = "<!-- Generated from shared/agents. Do not edit this copy. -->";
const GENERATED_COMMAND_NOTICE = "<!-- Generated from shared/commands. Do not edit this copy. -->";
const GENERATED_CONTEXT_NOTICE =
  "<!-- Generated from shared/provider-fragments/gemini-extension-context.md. Do not edit this copy. -->";
const CLAUDE_THEME_REVIEWER_TOOLS = "Read, Grep, Glob, WebFetch, WebSearch";
const COPILOT_THEME_REVIEWER_TOOLS = '["read", "search", "web"]';

const MCP_TEMPLATE_FILES = [
  "README.md",
  "agentforce-vibes.mcp.json",
  "antigravity.mcp-config.json",
  "claude-code.mcp.json",
  "codex.config.toml",
  "copilot.mcp-config.json",
  "cursor.mcp.json",
  "gemini.settings.json",
  "grok.config.toml",
  "kiro.mcp.json",
];

const STORECONNECT_MCP_DESCRIPTION =
  "Build and manage a StoreConnect store: content, catalogue, navigation, media, and themes.";

function relative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join("/") || ".";
}

function addFinding(filePath, message) {
  findings.push(`${relative(path.resolve(ROOT, filePath))}: ${message}`);
}

function full(filePath) {
  return path.resolve(ROOT, filePath);
}

function metadataWithoutSymbolicLinks(filePath) {
  const absolute = full(filePath);
  const boundary = path.relative(ROOT, absolute);
  if (boundary.startsWith("..") || path.isAbsolute(boundary)) {
    addFinding(filePath, "path escapes the repository");
    return null;
  }

  let current = ROOT;
  let metadata;
  try {
    for (const part of boundary.split(path.sep).filter(Boolean)) {
      current = path.join(current, part);
      metadata = fs.lstatSync(current);
      if (metadata.isSymbolicLink()) {
        addFinding(filePath, `symbolic-link component ${JSON.stringify(relative(current))} is not allowed`);
        return null;
      }
    }
    return metadata ?? fs.lstatSync(ROOT);
  } catch (error) {
    addFinding(filePath, `cannot access path (${error.message})`);
    return null;
  }
}

function exists(filePath) {
  return fs.existsSync(full(filePath));
}

function readText(filePath) {
  const metadata = metadataWithoutSymbolicLinks(filePath);
  if (!metadata) return null;
  if (!metadata.isFile()) {
    addFinding(filePath, "expected a regular file");
    return null;
  }
  return fs.readFileSync(full(filePath), "utf8");
}

function readJson(filePath) {
  const text = readText(filePath);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    addFinding(filePath, `invalid JSON (${error.message})`);
    return null;
  }
}

function sortedEntries(directory) {
  const metadata = metadataWithoutSymbolicLinks(directory);
  if (!metadata) return [];
  if (!metadata.isDirectory()) {
    addFinding(directory, "expected a real directory");
    return [];
  }
  return fs.readdirSync(full(directory)).sort();
}

function assertExactEntries(directory, expected) {
  if (!exists(directory)) {
    addFinding(directory, "required directory is missing");
    return;
  }
  const actual = sortedEntries(directory);
  const expectedSorted = [...expected].sort();
  for (const entry of expectedSorted.filter((item) => !actual.includes(item))) {
    addFinding(path.join(directory, entry), "required inventory entry is missing");
  }
  for (const entry of actual.filter((item) => !expectedSorted.includes(item))) {
    addFinding(path.join(directory, entry), "unexpected inventory entry");
  }
}

function walk(start, options = {}) {
  const startPath = full(start);
  if (!fs.existsSync(startPath)) return [];
  const results = [];
  const stack = [startPath];
  while (stack.length > 0) {
    const current = stack.pop();
    const stat = fs.lstatSync(current);
    results.push({ path: current, stat });
    if (!stat.isDirectory() || stat.isSymbolicLink()) continue;
    const entries = fs.readdirSync(current).sort().reverse();
    for (const entry of entries) {
      if (entry === ".git" || entry === "node_modules") continue;
      if (options.skip?.has(entry)) continue;
      stack.push(path.join(current, entry));
    }
  }
  return results;
}

function parseSimpleScalar(rawValue, filePath, lineNumber) {
  if (rawValue === "") return "";
  if (rawValue !== rawValue.trim() || /[\t\u0000-\u001f\u007f]/.test(rawValue)) {
    addFinding(filePath, `frontmatter line ${lineNumber} contains invalid whitespace or control characters`);
    return null;
  }

  if (rawValue.startsWith('"')) {
    if (!rawValue.endsWith('"') || rawValue.length < 2) {
      addFinding(filePath, `frontmatter line ${lineNumber} has an unterminated double-quoted scalar`);
      return null;
    }
    try {
      const value = JSON.parse(rawValue);
      if (typeof value !== "string") throw new Error("not a string");
      return value;
    } catch {
      addFinding(filePath, `frontmatter line ${lineNumber} has an invalid double-quoted scalar`);
      return null;
    }
  }

  if (rawValue.startsWith("'")) {
    if (!rawValue.endsWith("'") || rawValue.length < 2) {
      addFinding(filePath, `frontmatter line ${lineNumber} has an unterminated single-quoted scalar`);
      return null;
    }
    const inner = rawValue.slice(1, -1);
    for (let index = 0; index < inner.length; index += 1) {
      if (inner[index] !== "'") continue;
      if (inner[index + 1] !== "'") {
        addFinding(filePath, `frontmatter line ${lineNumber} has an invalid single-quoted scalar`);
        return null;
      }
      index += 1;
    }
    return inner.replace(/''/g, "'");
  }

  // Permit exactly one non-scalar shape: a flow sequence of double-quoted
  // lowercase words, as required by Copilot's documented agent tools form.
  if (/^\[\s*"[a-z][a-z0-9_-]*"(?:\s*,\s*"[a-z][a-z0-9_-]*")*\s*\]$/.test(rawValue)) {
    return rawValue;
  }

  if (
    /^[!&*?\[\]{},#|>@`]/.test(rawValue) ||
    /:\s|:\s*$|\s#/.test(rawValue) ||
    /^(?:---|\.\.\.)$/.test(rawValue) ||
    /^(?:null|~|true|false|yes|no|on|off)$/i.test(rawValue) ||
    /^[-+]?\d(?:[\d_]*(?:\.\d[\d_]*)?(?:e[-+]?\d+)?)$/i.test(rawValue)
  ) {
    addFinding(filePath, `frontmatter line ${lineNumber} is not a permitted plain string scalar`);
    return null;
  }
  return rawValue;
}

function parseFrontmatter(
  text,
  filePath,
  documentKind,
  allowedFields = ["name", "description"],
  booleanFields = [],
) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") {
    addFinding(filePath, `${documentKind} must start with an exact --- frontmatter delimiter`);
    return null;
  }
  const end = lines.indexOf("---", 1);
  if (end === -1) {
    addFinding(filePath, "YAML frontmatter has no closing delimiter");
    return null;
  }
  const values = {};
  const seenKeys = new Set();
  const allowedKeys = new Set(allowedFields);
  const booleanKeys = new Set(booleanFields);
  for (let index = 1; index < end; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    if (/^\s/.test(line)) {
      addFinding(filePath, `frontmatter line ${index + 1} uses indentation or multiline YAML, which is not permitted`);
      continue;
    }
    const match = /^([A-Za-z][A-Za-z0-9_-]*):(?: (.*))?$/.exec(line);
    if (!match) {
      addFinding(filePath, `frontmatter line ${index + 1} is not a permitted key: scalar field`);
      continue;
    }
    if (!allowedKeys.has(match[1])) {
      addFinding(filePath, `frontmatter field ${JSON.stringify(match[1])} is not permitted for a ${documentKind}`);
      continue;
    }
    if (seenKeys.has(match[1])) {
      addFinding(filePath, `frontmatter field ${JSON.stringify(match[1])} is duplicated`);
    }
    seenKeys.add(match[1]);
    const rawValue = match[2] ?? "";
    if (booleanKeys.has(match[1])) {
      if (rawValue !== "true" && rawValue !== "false") {
        addFinding(filePath, `frontmatter line ${index + 1} must be a boolean`);
      } else {
        values[match[1]] = rawValue === "true";
      }
    } else {
      const value = parseSimpleScalar(rawValue, filePath, index + 1);
      if (value !== null) values[match[1]] = value;
    }
  }
  return { values, endLine: end + 1 };
}

function validateSkill(filePath, folderName, generated) {
  const text = readText(filePath);
  if (text === null) return;
  const frontmatter = parseFrontmatter(text, filePath, "skill");
  const lineCount = text.split(/\r?\n/).length - (text.endsWith("\n") ? 1 : 0);
  if (lineCount > 500) {
    addFinding(filePath, `SKILL.md has ${lineCount} lines; the maximum is 500`);
  }
  if (!frontmatter) return;

  const { name, description } = frontmatter.values;
  if (!name) {
    addFinding(filePath, "frontmatter requires a non-empty name");
  } else {
    if (name !== folderName) {
      addFinding(filePath, `frontmatter name ${JSON.stringify(name)} must equal folder ${JSON.stringify(folderName)}`);
    }
    if (name.length > 64) {
      addFinding(filePath, `frontmatter name has ${name.length} characters; the maximum is 64`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
      addFinding(filePath, "frontmatter name must use lowercase kebab-case");
    }
  }
  if (!description) {
    addFinding(filePath, "frontmatter requires a non-empty description");
  } else {
    if (description.length > 1024) {
      addFinding(filePath, `frontmatter description has ${description.length} characters; the maximum is 1024`);
    }
    if (/^[>|]/.test(description)) {
      addFinding(filePath, "frontmatter description must be a plain single-line string");
    }
    if (/[<>]/.test(description)) {
      addFinding(filePath, "frontmatter description must not contain angle brackets");
    }
  }

  if (generated) {
    const lines = text.split(/\r?\n/);
    const closingDelimiter = lines.indexOf("---", 1);
    if (lines[closingDelimiter + 1] !== "" || lines[closingDelimiter + 2] !== GENERATED_SKILL_NOTICE) {
      addFinding(filePath, "generated SKILL.md must place the canonical generated notice immediately after frontmatter");
    }
  }
  if (!generated && text.includes("Generated from shared/skills")) {
    addFinding(filePath, "canonical SKILL.md must not identify itself as generated");
  }
}

function validateAgent(
  filePath,
  expectedName,
  generated,
  expectedTools = null,
  expectedReadonly = null,
) {
  const text = readText(filePath);
  if (text === null) return;
  const allowedFields =
    [
      "name",
      "description",
      ...(expectedTools === null ? [] : ["tools"]),
      ...(expectedReadonly === null ? [] : ["readonly"]),
    ];
  const frontmatter = parseFrontmatter(
    text,
    filePath,
    "agent prompt",
    allowedFields,
    expectedReadonly === null ? [] : ["readonly"],
  );
  if (!frontmatter) return;

  const { name, description } = frontmatter.values;
  if (!name) {
    addFinding(filePath, "frontmatter requires a non-empty name");
  } else {
    if (name !== expectedName) {
      addFinding(filePath, `frontmatter name ${JSON.stringify(name)} must equal agent ${JSON.stringify(expectedName)}`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
      addFinding(filePath, "frontmatter name must use lowercase kebab-case");
    }
  }
  if (!description) {
    addFinding(filePath, "frontmatter requires a non-empty description");
  } else if (description.length > 1024) {
    addFinding(filePath, `frontmatter description has ${description.length} characters; the maximum is 1024`);
  }
  if (expectedTools !== null && frontmatter.values.tools !== expectedTools) {
    addFinding(
      filePath,
      `tools must be ${JSON.stringify(expectedTools)} for the read-only reviewer`,
    );
  }
  if (
    expectedReadonly !== null &&
    frontmatter.values.readonly !== expectedReadonly
  ) {
    addFinding(
      filePath,
      `readonly must be ${expectedReadonly} for the read-only reviewer`,
    );
  }

  if (generated) {
    const lines = text.split(/\r?\n/);
    const closingDelimiter = lines.indexOf("---", 1);
    if (lines[closingDelimiter + 1] !== "" || lines[closingDelimiter + 2] !== GENERATED_AGENT_NOTICE) {
      addFinding(filePath, "generated agent must place the canonical generated notice immediately after frontmatter");
    }
  } else if (text.includes("Generated from shared/agents")) {
    addFinding(filePath, "canonical agent prompt must not identify itself as generated");
  }
}

function validateCommand(filePath, expectedName, generated) {
  const text = readText(filePath);
  if (text === null) return;
  // A command carries no name field; the file name is the invoked name.
  const frontmatter = parseFrontmatter(text, filePath, "command", [
    "description",
    "argument-hint",
  ]);
  if (!frontmatter) return;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(expectedName)) {
    addFinding(filePath, "command file name must use lowercase kebab-case");
  }

  const description = frontmatter.values.description;
  if (!description) {
    addFinding(filePath, "frontmatter requires a non-empty description");
  } else if (description.length > 1024) {
    addFinding(filePath, `frontmatter description has ${description.length} characters; the maximum is 1024`);
  }
  if (!frontmatter.values["argument-hint"]) {
    addFinding(filePath, "frontmatter requires a non-empty argument-hint");
  }

  if (generated) {
    const lines = text.split(/\r?\n/);
    const closingDelimiter = lines.indexOf("---", 1);
    if (lines[closingDelimiter + 1] !== "" || lines[closingDelimiter + 2] !== GENERATED_COMMAND_NOTICE) {
      addFinding(filePath, "generated command must place the canonical generated notice immediately after frontmatter");
    }
  } else if (text.includes("Generated from shared/commands")) {
    addFinding(filePath, "canonical command must not identify itself as generated");
  }
}

function requireString(object, key, filePath) {
  if (!object || typeof object[key] !== "string" || object[key].trim() === "") {
    addFinding(filePath, `required string field ${JSON.stringify(key)} is missing or empty`);
    return null;
  }
  return object[key];
}

function requireObject(object, key, filePath) {
  if (!object || !object[key] || typeof object[key] !== "object" || Array.isArray(object[key])) {
    addFinding(filePath, `required object field ${JSON.stringify(key)} is missing`);
    return null;
  }
  return object[key];
}

function requireArray(object, key, filePath, allowEmpty = false) {
  if (!object || !Array.isArray(object[key]) || (!allowEmpty && object[key].length === 0)) {
    addFinding(filePath, `required array field ${JSON.stringify(key)} is missing${allowEmpty ? "" : " or empty"}`);
    return null;
  }
  return object[key];
}

function assertExactKeys(object, expectedKeys, filePath, label) {
  if (!object || typeof object !== "object" || Array.isArray(object)) {
    addFinding(filePath, `${label} must be a JSON object`);
    return false;
  }
  const expected = new Set(expectedKeys);
  for (const key of expectedKeys) {
    if (!Object.hasOwn(object, key)) addFinding(filePath, `${label} is missing field ${JSON.stringify(key)}`);
  }
  for (const key of Object.keys(object)) {
    if (!expected.has(key)) addFinding(filePath, `${label} contains unsupported field ${JSON.stringify(key)}`);
  }
  return true;
}

function requireStringArray(object, key, filePath) {
  const values = requireArray(object, key, filePath, true);
  if (!values) return null;
  for (let index = 0; index < values.length; index += 1) {
    if (typeof values[index] !== "string" || values[index].trim() === "") {
      addFinding(filePath, `${key}[${index}] must be a non-empty string`);
    }
  }
  return values;
}

function requireExactString(object, key, expected, filePath) {
  const value = requireString(object, key, filePath);
  if (value !== null && value !== expected) {
    addFinding(filePath, `${key} must be ${JSON.stringify(expected)}, found ${JSON.stringify(value)}`);
  }
  return value;
}

function validateAuthorShape(author, filePath, includeUrl) {
  if (!author || typeof author !== "object" || Array.isArray(author)) return;
  assertExactKeys(author, includeUrl ? ["name", "email", "url"] : ["name", "email"], filePath, "author");
  requireString(author, "name", filePath);
  requireString(author, "email", filePath);
  if (includeUrl) requireString(author, "url", filePath);
}

function validateProviderManifestShape(providerName, manifest, filePath) {
  if (!manifest) return;
  const common = ["name", "version", "description", "author", "homepage", "repository", "license", "keywords"];
  if (providerName === "claude") {
    assertExactKeys(manifest, ["$schema", ...common.slice(0, 1), "displayName", ...common.slice(1)], filePath, "Claude manifest");
    requireExactString(manifest, "$schema", "https://json.schemastore.org/claude-code-plugin-manifest.json", filePath);
    requireString(manifest, "displayName", filePath);
    validateAuthorShape(manifest.author, filePath, true);
  } else if (providerName === "codex") {
    assertExactKeys(manifest, [...common, "skills", "interface"], filePath, "Codex manifest");
    validateAuthorShape(manifest.author, filePath, true);
    requireExactString(manifest, "skills", "./skills/", filePath);
    const interfaceFields = requireObject(manifest, "interface", filePath);
    if (interfaceFields) {
      assertExactKeys(interfaceFields, ["displayName", "shortDescription", "longDescription", "developerName", "category", "capabilities", "websiteURL", "defaultPrompt"], filePath, "Codex interface");
      for (const field of ["displayName", "shortDescription", "longDescription", "developerName", "category", "websiteURL"]) {
        requireString(interfaceFields, field, filePath);
      }
      const capabilities = requireArray(interfaceFields, "capabilities", filePath, true);
      if (capabilities && capabilities.length !== 0) {
        addFinding(filePath, "Codex interface capabilities must remain empty until supported capabilities are defined");
      }
      requireStringArray(interfaceFields, "defaultPrompt", filePath);
    }
  } else if (providerName === "copilot") {
    assertExactKeys(manifest, [...common, "category", "agents", "skills"], filePath, "Copilot manifest");
    validateAuthorShape(manifest.author, filePath, true);
    requireString(manifest, "category", filePath);
    requireExactString(manifest, "agents", "./agents/", filePath);
    requireExactString(manifest, "skills", "./skills/", filePath);
  } else if (providerName === "cursor") {
    // `displayName` is what a user reads in the marketplace listing, and the
    // official cursor/plugin-template manifest carries it. An earlier comment
    // here claimed the schema had no such field; that was wrong.
    // `publisher` is still absent, and category/tags belong on the
    // marketplace.json plugin entry rather than here.
    assertExactKeys(manifest, ["name", "displayName", "description", "version", "author", "homepage", "repository", "license", "keywords", "agents", "skills"], filePath, "Cursor manifest");
    requireString(manifest, "displayName", filePath);
    validateAuthorShape(manifest.author, filePath, false);
    requireExactString(manifest, "agents", "./agents/", filePath);
    requireExactString(manifest, "skills", "./skills/", filePath);
  } else if (providerName === "gemini") {
    assertExactKeys(
      manifest,
      ["name", "version", "description", "contextFileName"],
      filePath,
      "Gemini manifest",
    );
    requireExactString(manifest, "contextFileName", "GEMINI.md", filePath);
  } else if (providerName === "grok") {
    // No component paths are declared. xAI's scanner discovers skills/,
    // commands/ and agents/ off the plugin root
    // (xai-org/plugin-marketplace scripts/plugin_catalog.py), and the shipped
    // third-party example in that repo declares none either. Adding them would
    // be redundant and would drift from the directories the renderer writes.
    assertExactKeys(manifest, common, filePath, "Grok manifest");
    validateAuthorShape(manifest.author, filePath, true);
  } else if (providerName === "antigravity") {
    assertExactKeys(
      manifest,
      ["name", "version", "description"],
      filePath,
      "Antigravity manifest",
    );
    requireExactString(manifest, "name", "storeconnect", filePath);
    requireString(manifest, "description", filePath);
  }
  if (!["antigravity", "gemini"].includes(providerName)) {
    requireStringArray(manifest, "keywords", filePath);
  }
}

function validateRegistryServer() {
  const filePath = "server.json";
  const server = readJson(filePath);
  if (!server) return;
  const expected = {
    $schema: "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
    name: "com.storeconnect/agent-api",
    title: "StoreConnect — Store & Website Builder",
    description: STORECONNECT_MCP_DESCRIPTION,
    // Registry server versions describe the hosted Agent API and advance
    // independently from skills/plugin package releases.
    version: "21.0.0",
    websiteUrl: "https://github.com/GetStoreConnect/ai/blob/main/docs/mcp/README.md",
    remotes: [
      {
        type: "streamable-http",
        url: "https://{store_domain}/mcp",
        variables: {
          store_domain: {
            description: "StoreConnect store hostname, without a scheme or path.",
            placeholder: "store.example.com",
            format: "string",
            isRequired: true,
          },
        },
      },
    ],
  };

  if (!isDeepStrictEqual(server, expected)) {
    addFinding(
      filePath,
      "Registry metadata must exactly match the approved managed streamable-HTTP server shape; packages, repository, headers, and unknown fields are not allowed",
    );
  }
}

function assertExactMcpJson(filePath, expected, label) {
  const document = readJson(filePath);
  if (document && !isDeepStrictEqual(document, expected)) {
    addFinding(filePath, `${label} must exactly match the approved OAuth-safe provider-native shape`);
  }
}

function validateCodexMcpTemplate() {
  const filePath = "templates/mcp/codex.config.toml";
  const text = readText(filePath);
  if (text === null) return;
  const activeLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  const expectedActiveLines = [
    "[mcp_servers.storeconnect]",
    'url = "https://store.example.com/mcp"',
  ];
  if (!isDeepStrictEqual(activeLines, expectedActiveLines)) {
    addFinding(
      filePath,
      "Codex template must contain only the StoreConnect MCP block and reserved example URL as active TOML",
    );
  }
}

function validateGrokMcpTemplate() {
  const filePath = "templates/mcp/grok.config.toml";
  const text = readText(filePath);
  if (text === null) return;
  const activeLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  const expectedActiveLines = [
    "[mcp_servers.storeconnect]",
    'url = "https://store.example.com/mcp"',
  ];
  if (!isDeepStrictEqual(activeLines, expectedActiveLines)) {
    addFinding(
      filePath,
      "Grok template must contain only the StoreConnect MCP block and reserved example URL as active TOML",
    );
  }
}

function validateMcpTemplates() {
  const root = "templates/mcp";
  assertExactEntries(root, MCP_TEMPLATE_FILES);

  assertExactMcpJson(
    `${root}/antigravity.mcp-config.json`,
    {
      mcpServers: {
        storeconnect: {
          serverUrl: "https://store.example.com/mcp",
        },
      },
    },
    "Antigravity MCP template",
  );
  assertExactMcpJson(
    `${root}/claude-code.mcp.json`,
    {
      mcpServers: {
        storeconnect: {
          type: "http",
          url: "${STORECONNECT_MCP_URL}",
        },
      },
    },
    "Claude Code MCP template",
  );
  assertExactMcpJson(
    `${root}/cursor.mcp.json`,
    {
      mcpServers: {
        storeconnect: {
          url: "${env:STORECONNECT_MCP_URL}",
        },
      },
    },
    "Cursor MCP template",
  );
  assertExactMcpJson(
    `${root}/gemini.settings.json`,
    {
      mcpServers: {
        storeconnect: {
          httpUrl: "${STORECONNECT_MCP_URL}",
        },
      },
    },
    "Gemini CLI MCP template",
  );
  assertExactMcpJson(
    `${root}/copilot.mcp-config.json`,
    {
      mcpServers: {
        storeconnect: {
          type: "http",
          url: "https://store.example.com/mcp",
          tools: ["*"],
        },
      },
    },
    "GitHub Copilot CLI MCP template",
  );
  assertExactMcpJson(
    `${root}/kiro.mcp.json`,
    {
      mcpServers: {
        storeconnect: {
          url: "https://store.example.com/mcp",
          disabled: false,
          autoApprove: [],
        },
      },
    },
    "Kiro MCP template",
  );
  assertExactMcpJson(
    `${root}/agentforce-vibes.mcp.json`,
    {
      mcpServers: {
        storeconnect: {
          description: "StoreConnect — Store & Website Builder tools for the explicitly selected client store",
          type: "streamable-http",
          url: "${STORECONNECT_MCP_URL}",
          autoApprove: [],
        },
      },
    },
    "Agentforce Vibes MCP template",
  );
  validateCodexMcpTemplate();
  validateGrokMcpTemplate();

  const readmePath = `${root}/README.md`;
  const readme = readText(readmePath);
  if (readme === null) return;
  for (const fileName of MCP_TEMPLATE_FILES.filter((name) => name !== "README.md")) {
    if (!readme.includes(`(${fileName})`)) {
      addFinding(readmePath, `MCP template README must link to ${fileName}`);
    }
  }
  for (const requiredText of [
    "These files are non-secret starting points",
    "Antigravity requires the `serverUrl` key",
    "STORECONNECT_MCP_URL",
    "store.example.com",
    "Every template contains connection details only",
    "administrator-approved credential interface",
    "private client or partner implementation repository",
    "Public examples must use",
    "Credentials must never be committed",
    "`autoApprove` empty",
  ]) {
    if (!readme.includes(requiredText)) {
      addFinding(readmePath, `MCP template README is missing required guidance: ${JSON.stringify(requiredText)}`);
    }
  }
}

function requirePluginIdentity(manifest, filePath, expectedVersion) {
  if (!manifest) return;
  const name = requireString(manifest, "name", filePath);
  const description = requireString(manifest, "description", filePath);
  const version = requireString(manifest, "version", filePath);
  if (name && name !== "storeconnect") addFinding(filePath, `plugin name must be "storeconnect", found ${JSON.stringify(name)}`);
  if (description && description.length > 1024) addFinding(filePath, "plugin description exceeds 1024 characters");
  if (version && expectedVersion && version !== expectedVersion) {
    addFinding(filePath, `version ${version} does not match package version ${expectedVersion}`);
  }
  if (manifest.license !== "MIT") addFinding(filePath, "license must be MIT");
  if (manifest.repository !== "https://github.com/GetStoreConnect/ai") {
    addFinding(filePath, "repository must be https://github.com/GetStoreConnect/ai");
  }
  requireString(manifest, "homepage", filePath);
  const keywords = requireArray(manifest, "keywords", filePath);
  if (keywords && keywords.some((keyword) => typeof keyword !== "string" || keyword.trim() === "")) {
    addFinding(filePath, "keywords must contain only non-empty strings");
  }
  if (!manifest.author || typeof manifest.author !== "object") {
    addFinding(filePath, "required author object is missing");
  } else {
    requireString(manifest.author, "name", filePath);
    requireString(manifest.author, "email", filePath);
  }
}

function assertReferencedPath(packageRoot, referencedPath, filePath, field) {
  if (typeof referencedPath !== "string" || referencedPath.trim() === "") {
    addFinding(filePath, `referenced path field ${JSON.stringify(field)} is missing or empty`);
    return;
  }
  const packageAbsolute = full(packageRoot);
  const resolved = path.resolve(packageAbsolute, referencedPath);
  const boundary = path.relative(packageAbsolute, resolved);
  if (boundary.startsWith("..") || path.isAbsolute(boundary) || boundary === "") {
    addFinding(filePath, `${field} must resolve inside its provider package: ${referencedPath}`);
  } else if (!fs.existsSync(resolved)) {
    addFinding(filePath, `${field} references a missing path: ${referencedPath}`);
  } else {
    const relativePath = relative(resolved);
    const metadata = metadataWithoutSymbolicLinks(relativePath);
    if (!metadata) return;
    const expectsFile = field === "contextFileName";
    if (expectsFile ? !metadata.isFile() : !metadata.isDirectory()) {
      addFinding(filePath, `${field} references the wrong path type: ${referencedPath}`);
    }
  }
}

function validateMarketplace(filePath, expectedSource, expectedVersion, sourceObject = false) {
  const marketplace = readJson(filePath);
  if (!marketplace) return;
  const name = requireString(marketplace, "name", filePath);
  if (name && name !== "storeconnect-ai") addFinding(filePath, "marketplace name must be storeconnect-ai");
  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length !== 1) {
    addFinding(filePath, "marketplace must contain exactly one plugin entry");
    return;
  }
  const entry = marketplace.plugins[0];
  if (entry?.name !== "storeconnect") addFinding(filePath, "marketplace plugin name must be storeconnect");
  const source = sourceObject ? entry?.source?.path : entry?.source;
  if (source !== expectedSource) {
    addFinding(filePath, `marketplace source must be ${JSON.stringify(expectedSource)}`);
  }
  if (typeof source === "string") {
    const resolved = path.resolve(ROOT, source);
    if (!resolved.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(resolved)) {
      addFinding(filePath, `marketplace source does not resolve inside the repository: ${source}`);
    }
  }
  if (expectedVersion && entry?.version !== expectedVersion) {
    addFinding(filePath, `marketplace plugin version must be ${expectedVersion}`);
  }
  if (!sourceObject) requireString(entry, "description", filePath);
}

function validateMarketplaceShape(kind, marketplace, filePath, packageVersion) {
  if (!marketplace) return;
  let entry;
  if (Array.isArray(marketplace.plugins) && marketplace.plugins.length === 1) {
    entry = marketplace.plugins[0];
  }

  if (kind === "claude") {
    // No official Anthropic-hosted marketplace schema URL is documented, so
    // the manifest carries no $schema reference.
    assertExactKeys(marketplace, ["name", "description", "owner", "plugins"], filePath, "Claude marketplace");
    requireString(marketplace, "description", filePath);
    const owner = requireObject(marketplace, "owner", filePath);
    if (owner) {
      assertExactKeys(owner, ["name", "email"], filePath, "Claude marketplace owner");
      requireString(owner, "name", filePath);
      requireString(owner, "email", filePath);
    }
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      // `version` is deliberately absent from the entry. Claude Code resolves a
      // plugin's version from plugin.json first and the marketplace entry
      // second, and setting both is documented as a hazard: the plugin.json
      // value always wins without warning, so a stale manifest silently masks
      // the entry. `claude plugin validate` also warns when the two disagree.
      // The version therefore lives only in
      // providers/claude/storeconnect/.claude-plugin/plugin.json. Do not add it
      // here.
      assertExactKeys(entry, ["name", "source", "description", "author", "category"], filePath, "Claude marketplace plugin");
      requireString(entry, "category", filePath);
      const author = requireObject(entry, "author", filePath);
      if (author) {
        assertExactKeys(author, ["name", "email"], filePath, "Claude marketplace plugin author");
        requireString(author, "name", filePath);
        requireString(author, "email", filePath);
      }
    }
  } else if (kind === "codex") {
    assertExactKeys(marketplace, ["name", "interface", "plugins"], filePath, "Codex marketplace");
    const interfaceFields = requireObject(marketplace, "interface", filePath);
    if (interfaceFields) {
      assertExactKeys(interfaceFields, ["displayName"], filePath, "Codex marketplace interface");
      requireString(interfaceFields, "displayName", filePath);
    }
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      assertExactKeys(entry, ["name", "source", "policy", "category"], filePath, "Codex marketplace plugin");
      requireString(entry, "category", filePath);
      const source = requireObject(entry, "source", filePath);
      if (source) {
        assertExactKeys(source, ["source", "path"], filePath, "Codex marketplace source");
        requireExactString(source, "source", "local", filePath);
        requireExactString(source, "path", "./providers/codex/storeconnect", filePath);
      }
      const policy = requireObject(entry, "policy", filePath);
      if (policy) {
        assertExactKeys(policy, ["installation", "authentication"], filePath, "Codex marketplace policy");
        requireExactString(policy, "installation", "AVAILABLE", filePath);
        requireExactString(policy, "authentication", "ON_INSTALL", filePath);
      }
    }
  } else if (kind === "copilot") {
    assertExactKeys(marketplace, ["name", "owner", "metadata", "plugins"], filePath, "Copilot marketplace");
    const owner = requireObject(marketplace, "owner", filePath);
    if (owner) {
      assertExactKeys(owner, ["name", "email"], filePath, "Copilot marketplace owner");
      requireString(owner, "name", filePath);
      requireString(owner, "email", filePath);
    }
    const metadata = requireObject(marketplace, "metadata", filePath);
    if (metadata) {
      assertExactKeys(metadata, ["description", "version"], filePath, "Copilot marketplace metadata");
      requireString(metadata, "description", filePath);
      requireExactString(metadata, "version", packageVersion, filePath);
    }
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      assertExactKeys(entry, ["name", "description", "version", "source"], filePath, "Copilot marketplace plugin");
      requireExactString(entry, "version", packageVersion, filePath);
    }
  } else if (kind === "cursor") {
    assertExactKeys(marketplace, ["name", "owner", "metadata", "plugins"], filePath, "Cursor marketplace");
    const owner = requireObject(marketplace, "owner", filePath);
    if (owner) {
      assertExactKeys(owner, ["name", "email"], filePath, "Cursor marketplace owner");
      requireString(owner, "name", filePath);
      requireString(owner, "email", filePath);
    }
    const metadata = requireObject(marketplace, "metadata", filePath);
    if (metadata) {
      assertExactKeys(metadata, ["description"], filePath, "Cursor marketplace metadata");
      requireString(metadata, "description", filePath);
    }
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      assertExactKeys(entry, ["name", "source", "description", "category", "tags"], filePath, "Cursor marketplace plugin");
      requireString(entry, "category", filePath);
      requireStringArray(entry, "tags", filePath);
    }
  }
}

function withoutCodeFences(text) {
  let fence = null;
  return text
    .split(/\r?\n/)
    .map((line) => {
      const match = /^\s*(`{3,}|~{3,})/.exec(line);
      if (match) {
        if (!fence) fence = match[1][0];
        else if (fence === match[1][0]) fence = null;
        return "";
      }
      return fence ? "" : line;
    })
    .join("\n");
}

function githubSlug(text) {
  return text
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*~]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    // GitHub replaces each whitespace character rather than collapsing runs;
    // punctuation removed between two spaces therefore produces `--`.
    .replace(/\s/g, "-");
}

const anchorCache = new Map();
function anchorsFor(filePath) {
  const absolute = path.resolve(filePath);
  if (anchorCache.has(absolute)) return anchorCache.get(absolute);
  let text;
  try {
    text = withoutCodeFences(fs.readFileSync(absolute, "utf8"));
  } catch {
    return new Set();
  }
  const anchors = new Set();
  const counts = new Map();
  for (const line of text.split("\n")) {
    const heading = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      const base = githubSlug(heading[1]);
      if (base) {
        const count = counts.get(base) || 0;
        anchors.add(count === 0 ? base : `${base}-${count}`);
        counts.set(base, count + 1);
      }
    }
    for (const match of line.matchAll(/<(?:a\s+[^>]*(?:name|id)|[^>]+\s+id)=["']([^"']+)["'][^>]*>/gi)) {
      anchors.add(match[1]);
    }
  }
  anchorCache.set(absolute, anchors);
  return anchors;
}

function extractLinkTarget(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("<")) {
    const close = trimmed.indexOf(">");
    return close === -1 ? trimmed : trimmed.slice(1, close);
  }
  const titled = /^(\S+?)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?$/.exec(trimmed);
  return titled ? titled[1] : trimmed;
}

function validateMarkdownLinks(filePath) {
  const text = readText(filePath);
  if (text === null) return;
  const source = withoutCodeFences(text);
  const targets = [];
  for (const match of source.matchAll(/!?\[[^\]\n]*\]\(([^)\n]+)\)/g)) targets.push(extractLinkTarget(match[1]));
  for (const match of source.matchAll(/^\s*\[[^\]\n]+\]:\s*(\S+)/gm)) targets.push(extractLinkTarget(match[1]));

  for (const rawTarget of targets) {
    if (!rawTarget || /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(rawTarget)) continue;
    let target = rawTarget;
    let fragment = "";
    const hash = target.indexOf("#");
    if (hash !== -1) {
      fragment = target.slice(hash + 1);
      target = target.slice(0, hash);
    }
    target = target.split("?")[0];
    try {
      target = decodeURIComponent(target);
      fragment = decodeURIComponent(fragment);
    } catch {
      addFinding(filePath, `Markdown link is not valid percent-encoding: ${rawTarget}`);
      continue;
    }
    const destination = target ? path.resolve(path.dirname(full(filePath)), target) : full(filePath);
    if (!fs.existsSync(destination)) {
      addFinding(filePath, `relative Markdown link target does not exist: ${rawTarget}`);
      continue;
    }
    if (fragment && fs.statSync(destination).isFile() && /\.mdc?$/i.test(destination)) {
      if (!anchorsFor(destination).has(fragment.toLowerCase())) {
        addFinding(filePath, `Markdown link anchor does not exist: ${rawTarget}`);
      }
    }
  }
}

function validateShellPlaceholderQuoting(filePath) {
  const text = readText(filePath);
  if (text === null) return;
  let fence = null;

  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!fence) {
      const opening = /^\s*(`{3,}|~{3,})\s*([^\s]*)/.exec(line);
      if (opening) {
        fence = {
          character: opening[1][0],
          length: opening[1].length,
          shell: /^(?:bash|shell|sh|zsh)$/i.test(opening[2]),
        };
      }
      continue;
    }

    const trimmed = line.trim();
    if (
      trimmed.length >= fence.length &&
      [...trimmed].every((character) => character === fence.character)
    ) {
      fence = null;
      continue;
    }

    if (
      fence.shell &&
      /(?:^|[\s=])https:\/\/<[^>\s]+>(?=$|[\s\\])/u.test(line)
    ) {
      addFinding(
        filePath,
        `line ${index + 1} has an unquoted URL placeholder in a shell fence`,
      );
    }
  }
}

function validateReferenceToc(filePath) {
  const text = readText(filePath);
  if (text === null) return;
  const lines = text.split(/\r?\n/);
  if (lines.length - (text.endsWith("\n") ? 1 : 0) <= 100) return;
  const visible = withoutCodeFences(text);
  if (!/^\s{0,3}#{1,3}\s+(?:table of contents|contents|toc)\s*#*\s*$/im.test(visible)) {
    addFinding(filePath, "reference longer than 100 lines requires a table of contents heading");
  }
}

function looksText(buffer) {
  return !buffer.subarray(0, 8192).includes(0);
}

function validateSecretMarkers() {
  const patterns = [
    ["private key", /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/],
    ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
    ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
    ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
    ["Stripe live key", /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/],
  ];
  const assignment = /\b(api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|private[_-]?key|password)\b\s*[:=]\s*["']?([A-Za-z0-9+/_=-]{16,})/gi;
  const placeholder = /^(?:example|placeholder|changeme|replace|redacted|dummy|sample|test|your[_-]|x{8,}|\*{8,})/i;

  for (const entry of walk(".")) {
    if (!entry.stat.isFile()) continue;
    let buffer;
    try {
      buffer = fs.readFileSync(entry.path);
    } catch {
      continue;
    }
    if (!looksText(buffer)) continue;
    const text = buffer.toString("utf8");
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      for (const [label, pattern] of patterns) {
        if (pattern.test(line)) addFinding(entry.path, `line ${index + 1} contains a possible ${label}`);
      }
      assignment.lastIndex = 0;
      for (const match of line.matchAll(assignment)) {
        if (!placeholder.test(match[2])) {
          addFinding(entry.path, `line ${index + 1} contains a possible assigned secret (${match[1]})`);
        }
      }
    }
  }
}

function validateRepositoryIgnorePolicy() {
  const filePath = ".gitignore";
  const text = readText(filePath);
  if (text === null) return;
  const rules = new Set(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#")),
  );
  for (const requiredRule of [
    ".codex/agent/review*",
    ".env",
    "*.env",
    "*.pem",
    "*credentials*.json",
    "*oauth*token*.json",
    ".mcp.json",
    "**/.claude/settings.local.json",
    "**/.codex/config.toml",
    "**/.gemini/settings.json",
    "**/.grok/config.toml",
    "**/.github/mcp.json",
    "**/.copilot/mcp-config.json",
    "**/.vscode/mcp.json",
    "**/.cursor/mcp.json",
    "**/.kiro/settings/mcp.json",
    "**/.agents/mcp_config.json",
  ]) {
    if (!rules.has(requiredRule)) {
      addFinding(filePath, `missing required local-only rule ${JSON.stringify(requiredRule)}`);
    }
  }
  if (rules.has("!templates/**")) {
    addFinding(filePath, "must not unignore every file under templates; secret-shaped files must remain ignored");
  }
}

function isApprovedMcpHostname(hostname) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  if (normalized === "store.example.com" || normalized.endsWith(".example.com")) return true;
  return new Set([
    "antigravity.google",
    "claude.ai",
    "developer.salesforce.com",
    "support.claude.com",
    "github.com",
    // Kiro's own product domain, where a Power is submitted. Same class as the
    // other vendor domains here, not a customer store.
    "kiro.dev",
    "modelcontextprotocol.io",
    "static.modelcontextprotocol.io",
    "storeconnect.com",
    "support.storeconnect.com",
    "www.storeconnect.com",
    "www.cursor.com",
    "x.ai",
  ]).has(normalized);
}

function validateMcpMaterialSafety() {
  const scopedFiles = new Set(["server.json"]);
  for (const root of ["docs/mcp", "templates/mcp"]) {
    for (const entry of walk(root)) {
      if (entry.stat.isFile()) scopedFiles.add(relative(entry.path));
    }
  }
  for (const provider of Object.values(PROVIDERS)) {
    scopedFiles.add(`${provider.packageRoot}/README.md`);
    if (provider.power) scopedFiles.add(provider.power);
  }

  const urlPattern = /https?:\/\/([^\s`"'()/]+)/gi;
  const domainPattern = /\b(?:[a-z0-9](?:[a-z0-9-]{0,62})\.)+(?:com|io|ai|net|org|dev|app|shop|store|cloud|au|nz|uk|ca|us|de|fr)\b/gi;
  const placeholderValue = /(?:[<>{}$]|…|\.\.\.|placeholder|redacted|example)/i;
  const resolvedTokenPatterns = [
    ["JWT", /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g],
  ];
  const tokenAssignment = /\b(?:api[_-]?token|bearer[_-]?token)\b\s*[:=]\s*["']?([^"'\s`]+)/gi;

  for (const filePath of [...scopedFiles].sort()) {
    const text = readText(filePath);
    if (text === null) continue;
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      let unsafeHostname = false;
      urlPattern.lastIndex = 0;
      for (const match of line.matchAll(urlPattern)) {
        let authority = match[1].replace(/[.,;:!?]+$/, "");
        if (/^(?:<store-domain>|\{store_domain\})$/i.test(authority)) continue;
        if (authority.includes("@")) authority = authority.slice(authority.lastIndexOf("@") + 1);
        const hostname = authority.replace(/^\[/, "").replace(/\]$/, "").replace(/:\d+$/, "");
        if (!isApprovedMcpHostname(hostname)) unsafeHostname = true;
      }
      domainPattern.lastIndex = 0;
      for (const match of line.matchAll(domainPattern)) {
        if (!isApprovedMcpHostname(match[0])) unsafeHostname = true;
      }
      if (unsafeHostname) {
        addFinding(filePath, `line ${index + 1} contains a likely resolved customer hostname`);
      }

      for (const [label, pattern] of resolvedTokenPatterns) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          addFinding(filePath, `line ${index + 1} contains a likely resolved ${label}`);
        }
      }

      tokenAssignment.lastIndex = 0;
      for (const match of line.matchAll(tokenAssignment)) {
        if (!placeholderValue.test(match[1])) {
          addFinding(filePath, `line ${index + 1} contains a likely resolved MCP token assignment`);
        }
      }
    }
  }
}

/**
 * Validates a Kiro Power.
 *
 * Kiro documents no schema — kirodotdev/powers only checks that a pull request
 * adds a top-level POWER.md — so the shape here is taken from the Powers that
 * repository actually ships. Every one of them carries the same five quoted
 * frontmatter fields, and the registry listing reads them, so a missing field is
 * a broken submission rather than a cosmetic omission.
 *
 * Deliberately does not use parseFrontmatter(): Power frontmatter quotes its
 * scalars and uses a JSON-style array for keywords, neither of which the skill
 * and agent frontmatter rules permit.
 */
function validateKiroPower(filePath) {
  const text = readText(filePath);
  if (text === null) {
    addFinding(filePath, "Kiro Power is missing");
    return;
  }

  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") {
    addFinding(filePath, "Power must start with an exact --- frontmatter delimiter");
    return;
  }
  const end = lines.indexOf("---", 1);
  if (end === -1) {
    addFinding(filePath, "Power frontmatter has no closing delimiter");
    return;
  }

  const fields = new Map();
  for (const line of lines.slice(1, end)) {
    if (!line.trim()) continue;
    const match = /^([A-Za-z][A-Za-z0-9]*):\s*(.+)$/.exec(line);
    if (!match) {
      addFinding(filePath, `Power frontmatter line is not a single-line key: ${JSON.stringify(line)}`);
      continue;
    }
    if (fields.has(match[1])) addFinding(filePath, `duplicate Power frontmatter key ${match[1]}`);
    fields.set(match[1], match[2].trim());
  }

  for (const key of ["name", "displayName", "description", "keywords", "author"]) {
    if (!fields.has(key)) addFinding(filePath, `Power frontmatter is missing required field ${key}`);
  }
  for (const key of [...fields.keys()]) {
    if (!["name", "displayName", "description", "keywords", "author"].includes(key)) {
      addFinding(filePath, `unexpected Power frontmatter field ${key}`);
    }
  }

  const name = fields.get("name");
  if (name !== undefined && name !== '"storeconnect"') {
    addFinding(filePath, `Power name must be "storeconnect", found ${name}`);
  }

  const keywords = fields.get("keywords");
  if (keywords !== undefined && !/^\[.*\]$/.test(keywords)) {
    addFinding(filePath, "Power keywords must be a single-line JSON-style array");
  }

  if (text.slice(text.indexOf("---", 4)).trim() === "---") {
    addFinding(filePath, "Power has frontmatter but no body");
  }
}

function validateNoResolvedMcpConfigs() {
  const forbiddenSuffixes = [
    "/.agents/mcp_config.json",
    "/.cursor/mcp.json",
    "/.kiro/settings/mcp.json",
    "/.gemini/settings.json",
    "/.codex/config.toml",
    "/.copilot/mcp-config.json",
    "/.github/mcp.json",
    "/.grok/config.toml",
  ];

  for (const entry of walk(".")) {
    if (!entry.stat.isFile() && !entry.stat.isSymbolicLink()) continue;
    const repoPath = relative(entry.path).toLowerCase();
    const rootedPath = `/${repoPath}`;
    if (path.posix.basename(repoPath) === ".mcp.json" || forbiddenSuffixes.some((suffix) => rootedPath.endsWith(suffix))) {
      addFinding(
        entry.path,
        "resolved local MCP client configuration is not allowed; keep only the non-secret renamed files under templates/mcp",
      );
    }
  }
}

function validatePublicReleaseBoundary() {
  const publicRoots = [
    "README.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "docs",
    "templates",
    "shared",
    "providers",
  ];
  const patterns = [
    [
      "private implementation provenance",
      /\b(?:source[- ]audited|source[- ]code audit|verified against (?:the )?source|sourced from (?:the )?StoreConnect|production-derived|from production builds?)\b/i,
    ],
    [
      "private-repository wording",
      /\bprivate (?:GitHub )?repositor(?:y|ies)\b/i,
    ],
    [
      "internal review-artifact path",
      /(?:docs\/audits(?:\/|\b)|quarantine\/|\.codex\/agent\/review)/i,
    ],
    ["private-preview wording", /\bprivate preview\b/i],
  ];
  const wildcardMcpToolPattern =
    /["']tools["']\s*:\s*\[\s*["']\*["']\s*\]|--tools(?:=|\s+)["']?\*["']?/i;
  const copilotWildcardAllowlist = new Set([
    "docs/mcp/install-and-verify.md",
    "providers/copilot/storeconnect/README.md",
    "templates/mcp/copilot.mcp-config.json",
  ]);

  for (const root of publicRoots) {
    for (const entry of walk(root)) {
      if (!entry.stat.isFile()) continue;
      const buffer = fs.readFileSync(entry.path);
      if (!looksText(buffer)) continue;
      const text = buffer.toString("utf8");
      if (
        wildcardMcpToolPattern.test(text) &&
        !copilotWildcardAllowlist.has(relative(entry.path))
      ) {
        addFinding(entry.path, "contains wildcard MCP tool selection outside the required Copilot template");
      }
      for (const [label, pattern] of patterns) {
        if (pattern.test(text)) addFinding(entry.path, `contains ${label}`);
      }
    }
  }
}

// Canonical inputs must be self-contained regular files and directories. Do
// this preflight before any canonical content is parsed or copied.
for (const entry of walk("shared")) {
  if (entry.stat.isSymbolicLink()) {
    addFinding(entry.path, "symbolic links are not allowed in canonical shared inputs");
  }
}

// Canonical and generated skill inventories.
assertExactEntries("providers", Object.keys(PROVIDERS));
for (const provider of Object.keys(PROVIDERS)) {
  assertExactEntries(`providers/${provider}`, ["storeconnect"]);
}
for (const skillRoot of SKILL_ROOTS) {
  assertExactEntries(skillRoot.path, EXPECTED_SKILLS);
  for (const skill of EXPECTED_SKILLS) {
    validateSkill(path.join(skillRoot.path, skill, "SKILL.md"), skill, skillRoot.generated);
  }
}

// Shared and provider-specific package inventories.
assertExactEntries(".agents/plugins", ["marketplace.json"]);
assertExactEntries(".claude-plugin", ["marketplace.json"]);
assertExactEntries(".cursor-plugin", ["marketplace.json"]);
assertExactEntries(".github/plugin", ["marketplace.json"]);
if (exists("examples")) {
  addFinding("examples", "reference examples belong under docs/examples, not at the repository root");
}
assertExactEntries("docs/examples", ["themes"]);
validateMcpTemplates();
assertExactEntries("shared/agents", EXPECTED_AGENTS);
for (const agent of EXPECTED_AGENTS) {
  assertExactEntries(`shared/agents/${agent}`, ["PROMPT.md"]);
  validateAgent(`shared/agents/${agent}/PROMPT.md`, agent, false);
}
assertExactEntries("shared/commands", EXPECTED_COMMANDS.map((name) => `${name}.md`));
for (const command of EXPECTED_COMMANDS) {
  validateCommand(`shared/commands/${command}.md`, command, false);
}
for (const [providerName, provider] of Object.entries(PROVIDERS)) {
  if (COMMAND_PROVIDERS.has(providerName) !== Boolean(provider.commands)) {
    addFinding(
      provider.packageRoot,
      "command-capable providers and packages that ship commands must be the same set",
    );
  }
}
for (const [providerName, provider] of Object.entries(PROVIDERS)) {
  assertExactEntries(provider.packageRoot, provider.entries);
  if (provider.manifest?.includes("/.claude-plugin/")) {
    assertExactEntries(path.dirname(provider.manifest), ["plugin.json"]);
  }
  if (provider.manifest?.includes("/.codex-plugin/")) {
    assertExactEntries(path.dirname(provider.manifest), ["plugin.json"]);
  }
  if (provider.manifest?.includes("/.cursor-plugin/")) {
    assertExactEntries(path.dirname(provider.manifest), ["plugin.json"]);
  }
  if (provider.manifest?.includes("/.grok-plugin/")) {
    assertExactEntries(path.dirname(provider.manifest), ["plugin.json"]);
  }
  if (providerName === "kiro") assertExactEntries(`${provider.packageRoot}/.kiro`, ["skills"]);
  if (provider.power) validateKiroPower(provider.power);
  if (provider.commands) {
    assertExactEntries(`${provider.packageRoot}/commands`, provider.commands);
    for (const commandFile of provider.commands) {
      validateCommand(
        `${provider.packageRoot}/commands/${commandFile}`,
        commandFile.replace(/\.md$/, ""),
        true,
      );
    }
  }
  if (provider.agents) {
    assertExactEntries(`${provider.packageRoot}/agents`, provider.agents);
    for (const agentFile of provider.agents) {
      const agentPath = `${provider.packageRoot}/agents/${agentFile}`;
      const agentName = agentFile.replace(/(?:\.agent)?\.md$/, "");
      const expectedTools =
        providerName === "claude" && agentName === "sc-theme-reviewer"
          ? CLAUDE_THEME_REVIEWER_TOOLS
          : providerName === "copilot" && agentName === "sc-theme-reviewer"
            ? COPILOT_THEME_REVIEWER_TOOLS
          : null;
      const expectedReadonly =
        providerName === "cursor" && agentName === "sc-theme-reviewer"
          ? true
          : null;
      validateAgent(
        agentPath,
        agentName,
        true,
        expectedTools,
        expectedReadonly,
      );
    }
  }
}

const geminiContext = readText("providers/gemini/storeconnect/GEMINI.md");
if (geminiContext !== null && !geminiContext.startsWith(`${GENERATED_CONTEXT_NOTICE}\n\n`)) {
  addFinding("providers/gemini/storeconnect/GEMINI.md", "generated Gemini context must start with the canonical generated notice");
}

// Manifests, versions, marketplaces, and their referenced paths.
const claudeManifest = readJson(PROVIDERS.claude.manifest);
const packageVersion = claudeManifest ? requireString(claudeManifest, "version", PROVIDERS.claude.manifest) : null;
if (packageVersion && !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageVersion)) {
  addFinding(PROVIDERS.claude.manifest, `version is not valid semantic versioning: ${packageVersion}`);
}
validateProviderManifestShape("claude", claudeManifest, PROVIDERS.claude.manifest);
requirePluginIdentity(claudeManifest, PROVIDERS.claude.manifest, packageVersion);
if (claudeManifest) requireString(claudeManifest, "displayName", PROVIDERS.claude.manifest);

for (const providerName of ["codex", "copilot", "cursor"]) {
  const provider = PROVIDERS[providerName];
  const manifest = readJson(provider.manifest);
  validateProviderManifestShape(providerName, manifest, provider.manifest);
  requirePluginIdentity(manifest, provider.manifest, packageVersion);
  if (manifest) {
    assertReferencedPath(provider.packageRoot, manifest.skills, provider.manifest, "skills");
    if (provider.agents) assertReferencedPath(provider.packageRoot, manifest.agents, provider.manifest, "agents");
    if (providerName === "codex") {
      const interfaceFields = requireObject(manifest, "interface", provider.manifest);
      if (interfaceFields) {
        for (const field of ["displayName", "shortDescription", "longDescription", "developerName", "category", "websiteURL"]) {
          requireString(interfaceFields, field, provider.manifest);
        }
        requireArray(interfaceFields, "capabilities", provider.manifest, true);
        requireArray(interfaceFields, "defaultPrompt", provider.manifest);
      }
    }
    if (providerName === "copilot") requireString(manifest, "category", provider.manifest);
  }
}

const grokManifest = readJson(PROVIDERS.grok.manifest);
validateProviderManifestShape("grok", grokManifest, PROVIDERS.grok.manifest);
requirePluginIdentity(grokManifest, PROVIDERS.grok.manifest, packageVersion);

const antigravityManifest = readJson(PROVIDERS.antigravity.manifest);
validateProviderManifestShape(
  "antigravity",
  antigravityManifest,
  PROVIDERS.antigravity.manifest,
);
if (antigravityManifest && antigravityManifest.version !== packageVersion) {
  addFinding(PROVIDERS.antigravity.manifest, `version must match package version ${packageVersion}`);
}

const geminiManifest = readJson(PROVIDERS.gemini.manifest);
if (geminiManifest) {
  validateProviderManifestShape("gemini", geminiManifest, PROVIDERS.gemini.manifest);
  if (geminiManifest.name !== "storeconnect") addFinding(PROVIDERS.gemini.manifest, "extension name must be storeconnect");
  requireString(geminiManifest, "description", PROVIDERS.gemini.manifest);
  if (geminiManifest.version !== packageVersion) {
    addFinding(PROVIDERS.gemini.manifest, `version must match package version ${packageVersion}`);
  }
  assertReferencedPath(PROVIDERS.gemini.packageRoot, geminiManifest.contextFileName, PROVIDERS.gemini.manifest, "contextFileName");
}

validateRegistryServer();

// Claude resolves the release version from plugin.json. Duplicating it in the
// marketplace entry can pin updates to stale cached content.
validateMarketplace(".claude-plugin/marketplace.json", "./providers/claude/storeconnect", null);
validateMarketplace(".agents/plugins/marketplace.json", "./providers/codex/storeconnect", null, true);
validateMarketplace(".github/plugin/marketplace.json", "providers/copilot/storeconnect", packageVersion);
validateMarketplace(".cursor-plugin/marketplace.json", "providers/cursor/storeconnect", null);

const claudeMarketplace = readJson(".claude-plugin/marketplace.json");
const cursorMarketplace = readJson(".cursor-plugin/marketplace.json");
validateMarketplaceShape("claude", claudeMarketplace, ".claude-plugin/marketplace.json", packageVersion);
validateMarketplaceShape("cursor", cursorMarketplace, ".cursor-plugin/marketplace.json", packageVersion);
for (const [filePath, marketplace] of [
  [".claude-plugin/marketplace.json", claudeMarketplace],
  [".cursor-plugin/marketplace.json", cursorMarketplace],
]) {
  if (!marketplace) continue;
  const owner = requireObject(marketplace, "owner", filePath);
  if (owner) {
    requireString(owner, "name", filePath);
    requireString(owner, "email", filePath);
  }
}

const codexMarketplace = readJson(".agents/plugins/marketplace.json");
validateMarketplaceShape("codex", codexMarketplace, ".agents/plugins/marketplace.json", packageVersion);
if (codexMarketplace?.plugins?.[0]?.source?.source !== "local") {
  addFinding(".agents/plugins/marketplace.json", "Codex marketplace source type must be local");
}
if (codexMarketplace) {
  const interfaceFields = requireObject(codexMarketplace, "interface", ".agents/plugins/marketplace.json");
  if (interfaceFields) requireString(interfaceFields, "displayName", ".agents/plugins/marketplace.json");
  const entry = codexMarketplace.plugins?.[0];
  if (!entry?.policy || typeof entry.policy !== "object") {
    addFinding(".agents/plugins/marketplace.json", "Codex marketplace plugin requires a policy object");
  } else {
    requireString(entry.policy, "installation", ".agents/plugins/marketplace.json");
    requireString(entry.policy, "authentication", ".agents/plugins/marketplace.json");
  }
  if (entry) requireString(entry, "category", ".agents/plugins/marketplace.json");
}
const copilotMarketplace = readJson(".github/plugin/marketplace.json");
validateMarketplaceShape("copilot", copilotMarketplace, ".github/plugin/marketplace.json", packageVersion);
if (copilotMarketplace?.metadata?.version !== packageVersion) {
  addFinding(".github/plugin/marketplace.json", `metadata.version must match package version ${packageVersion}`);
}
if (copilotMarketplace) {
  const owner = requireObject(copilotMarketplace, "owner", ".github/plugin/marketplace.json");
  if (owner) {
    requireString(owner, "name", ".github/plugin/marketplace.json");
    requireString(owner, "email", ".github/plugin/marketplace.json");
  }
  const metadata = requireObject(copilotMarketplace, "metadata", ".github/plugin/marketplace.json");
  if (metadata) requireString(metadata, "description", ".github/plugin/marketplace.json");
}

const packageJson = readJson("package.json");
if (packageJson) {
  if (packageJson.name !== "@getstoreconnect/ai") addFinding("package.json", "package name must be @getstoreconnect/ai");
  if (packageJson.version !== packageVersion) addFinding("package.json", `version must match package version ${packageVersion}`);
  if (packageJson.private !== true) addFinding("package.json", "repository tooling package must remain private");
  if (packageJson.license !== "MIT") addFinding("package.json", "license must be MIT");
}

// Every provider package carries the repository's exact license.
validateRepositoryIgnorePolicy();

const rootLicense = exists("LICENSE") ? fs.readFileSync(full("LICENSE")) : null;
if (!rootLicense) addFinding("LICENSE", "root license is missing");
for (const provider of Object.values(PROVIDERS)) {
  const licensePath = `${provider.packageRoot}/LICENSE`;
  if (!exists(licensePath)) {
    addFinding(licensePath, "provider license is missing");
  } else if (rootLicense && !fs.readFileSync(full(licensePath)).equals(rootLicense)) {
    addFinding(licensePath, "provider license does not exactly match the root LICENSE");
  }
}

// JSON syntax, Markdown links/anchors, and long-reference navigation.
for (const entry of walk(".")) {
  if (!entry.stat.isFile()) continue;
  const repoPath = relative(entry.path);
  if (repoPath.endsWith(".json")) readJson(repoPath);
  if (/\.mdc?$/i.test(repoPath)) {
    validateMarkdownLinks(repoPath);
    validateShellPlaceholderQuoting(repoPath);
    if (repoPath.split("/").includes("references")) validateReferenceToc(repoPath);
  }
}

// Installable outputs must remain portable, safe to copy, and free of retired material.
const bannedPathParts = new Set([
  "lwc-embed",
  "storeconnect-lwc-embed",
  "store-seeding",
  "storeconnect-store-seeding",
  "mcp-server",
  "mcp",
  "mcp-tools.md",
  "mcp-tool-reference.md",
  "mcp-tools-reference.md",
  "mcp-tool-catalog.md",
  "mcp-tool-catalogue.md",
  "tools-reference.md",
  "tool-catalog.md",
  "tool-catalogue.md",
]);
const leakagePatterns = [
  ["legacy namespaced skill reference", /\bstoreconnect:[a-z0-9-]+\b/],
  ["legacy MCP skill reference", /`mcp-server`|\bmcp-server skill\b/i],
  ["provider-specific project file", /\b(?:CLAUDE\.md|AGENTS\.md|GEMINI\.md)\b/],
  ["provider-specific package path", /(?:\.claude-plugin|\.codex-plugin|gemini-extension\.json|\.cursor-plugin|\.kiro\/skills)/],
  ["provider-specific product name", /\b(?:Antigravity|Claude Code|Codex|Gemini CLI|GitHub Copilot|Kiro)\b/],
  ["provider-specific product name", /\bCursor\b/],
  ["legacy repository name", /\bstoreconnect-claude-plugin\b/],
  ["legacy skill name", /`(?:apex-integration|debug-perf|pos-customization|pos-setup|salesforce-data|sync-deploy|theme-development|theme-review)`/],
];

for (const shippedRoot of SHIPPED_ROOTS) {
  for (const entry of walk(shippedRoot)) {
    const repoPath = relative(entry.path);
    const parts = repoPath.toLowerCase().split("/");
    for (const part of parts) {
      if (bannedPathParts.has(part)) addFinding(entry.path, `retired or static-catalog path ${JSON.stringify(part)} is not allowed in installable output`);
    }
    if (entry.stat.isSymbolicLink()) addFinding(entry.path, "symlinks are not allowed in installable output");
    if (entry.stat.isFile() && (entry.stat.mode & 0o111) !== 0) {
      addFinding(entry.path, "executable files are not allowed in installable output");
    }
  }
}

const portableTextRoots = [
  "shared/skills",
  "skills",
  "shared/agents",
  "shared/commands",
  "shared/project-context",
  ...Object.values(PROVIDERS).flatMap((provider) => [
    provider.skillRoot,
    ...(provider.agents ? [`${provider.packageRoot}/agents`] : []),
    ...(provider.commands ? [`${provider.packageRoot}/commands`] : []),
  ]),
];
for (const portableRoot of portableTextRoots) {
  for (const entry of walk(portableRoot)) {
    if (!entry.stat.isFile()) continue;
    const buffer = fs.readFileSync(entry.path);
    if (!looksText(buffer)) continue;
    const text = buffer.toString("utf8");
    for (const [label, pattern] of leakagePatterns) {
      if (pattern.test(text)) addFinding(entry.path, `contains ${label}`);
    }
  }
}

validateSecretMarkers();
validateMcpMaterialSafety();
validateNoResolvedMcpConfigs();
validatePublicReleaseBoundary();

const uniqueFindings = [...new Set(findings)].sort();
if (uniqueFindings.length > 0) {
  console.error(`Repository validation failed with ${uniqueFindings.length} finding${uniqueFindings.length === 1 ? "" : "s"}:`);
  for (const finding of uniqueFindings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(`Repository validation passed: ${EXPECTED_SKILLS.length} canonical skills across ${SKILL_ROOTS.length} skill trees and ${Object.keys(PROVIDERS).length} provider packages.`);
}
