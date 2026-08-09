#!/usr/bin/env node

import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const CHECK_MODE = parseArguments(process.argv.slice(2));

const SKILL_SOURCE_ROOT = "shared/skills";
const SKILL_OUTPUT_ROOTS = [
  "skills",
  "providers/antigravity/storeconnect/skills",
  "providers/claude/storeconnect/skills",
  "providers/codex/storeconnect/skills",
  "providers/gemini/storeconnect/skills",
  "providers/copilot/storeconnect/skills",
  "providers/cursor/storeconnect/skills",
  "providers/kiro/storeconnect/.kiro/skills",
  // Grok Build is a real plugin package, so its skills live at the plugin root.
  // xAI's catalog scanner reads `skills/`, `commands/` and `agents/` off the
  // plugin root (scripts/plugin_catalog.py) and knows nothing about `.grok/`,
  // so a tree under `.grok/skills/` indexes as zero components.
  "providers/grok/storeconnect/skills",
];

// Claude, Cursor and Grok Build all discover a plugin-level commands directory.
// The Codex plugin manifest spec and the Copilot CLI plugin layout do not define
// one, so those packages deliberately receive no command copies.
const COMMAND_SOURCE_ROOT = "shared/commands";
const COMMAND_OUTPUT_ROOTS = [
  "providers/claude/storeconnect/commands",
  "providers/cursor/storeconnect/commands",
  "providers/grok/storeconnect/commands",
];

const AGENT_SOURCE_ROOT = "shared/agents";
const AGENT_OUTPUTS = [
  { root: "providers/claude/storeconnect/agents", suffix: ".md" },
  { root: "providers/gemini/storeconnect/agents", suffix: ".md" },
  { root: "providers/copilot/storeconnect/agents", suffix: ".agent.md" },
  { root: "providers/cursor/storeconnect/agents", suffix: ".md" },
  { root: "providers/grok/storeconnect/agents", suffix: ".md" },
];

const CONTEXT_SOURCE = "shared/project-context/PROJECT_CONTEXT.md";
const CONTEXT_OUTPUTS = [
  "templates/project-context/antigravity/AGENTS.md",
  "templates/project-context/antigravity/storeconnect.md",
  "templates/project-context/claude/CLAUDE.md",
  "templates/project-context/codex/AGENTS.md",
  "templates/project-context/gemini/GEMINI.md",
  "templates/project-context/copilot/copilot-instructions.md",
  "templates/project-context/kiro/storeconnect.md",
  "templates/project-context/grok/AGENTS.md",
];
const CURSOR_CONTEXT_OUTPUT = "templates/project-context/cursor/storeconnect.mdc";
const CURSOR_CONTEXT_FRONTMATTER = [
  "---",
  "description: StoreConnect project facts and safety boundaries",
  "alwaysApply: true",
  "---",
  "",
  "",
].join("\n");

const GEMINI_CONTEXT_SOURCE =
  "shared/provider-fragments/gemini-extension-context.md";
const GEMINI_CONTEXT_OUTPUT = "providers/gemini/storeconnect/GEMINI.md";

const PROVIDER_ROOTS = [
  "providers/antigravity/storeconnect",
  "providers/claude/storeconnect",
  "providers/codex/storeconnect",
  "providers/gemini/storeconnect",
  "providers/copilot/storeconnect",
  "providers/cursor/storeconnect",
  "providers/kiro/storeconnect",
  "providers/grok/storeconnect",
];

const MANAGED_TREE_ROOTS = [
  ...SKILL_OUTPUT_ROOTS,
  ...COMMAND_OUTPUT_ROOTS,
  ...AGENT_OUTPUTS.map(({ root }) => root),
  ...CONTEXT_OUTPUTS.map((output) => path.posix.dirname(output)),
  path.posix.dirname(CURSOR_CONTEXT_OUTPUT),
];
const MANAGED_EXACT_FILES = new Set([
  GEMINI_CONTEXT_OUTPUT,
  ...PROVIDER_ROOTS.map((root) => `${root}/LICENSE`),
]);

const SKILL_NOTICE =
  "<!-- Generated from shared/skills. Do not edit this copy. -->";
const AGENT_NOTICE =
  "<!-- Generated from shared/agents. Do not edit this copy. -->";
const COMMAND_NOTICE =
  "<!-- Generated from shared/commands. Do not edit this copy. -->";
const CLAUDE_THEME_REVIEWER_TOOLS =
  "tools: Read, Grep, Glob, WebFetch, WebSearch";
// Copilot documents only the YAML array form for agent tool lists; a scalar
// value risks being ignored, which would silently unrestrict this agent.
const COPILOT_THEME_REVIEWER_TOOLS = 'tools: ["read", "search", "web"]';
const CURSOR_THEME_REVIEWER_READONLY = "readonly: true";
const GEMINI_CONTEXT_NOTICE =
  "<!-- Generated from shared/provider-fragments/gemini-extension-context.md. Do not edit this copy. -->";

try {
  const desiredFiles = await buildDesiredFiles();
  const differences = await findDifferences(desiredFiles);

  if (differences.length === 0) {
    console.log(
      `Generated packages are up to date (${desiredFiles.size} files checked).`,
    );
  } else if (CHECK_MODE) {
    printDifferences(differences);
    process.exitCode = 1;
  } else {
    await applyDifferences(differences, desiredFiles);
    console.log(
      `Rendered ${desiredFiles.size} generated files (${summarize(differences)}).`,
    );
  }
} catch (error) {
  console.error(`render-packages: ${error.message}`);
  process.exitCode = 1;
}

function parseArguments(args) {
  if (args.length === 0) return false;
  if (args.length === 1 && args[0] === "--check") return true;

  throw new Error("usage: node scripts/render-packages.mjs [--check]");
}

async function buildDesiredFiles() {
  const desired = new Map();

  for (const sourceRelative of await listFiles(SKILL_SOURCE_ROOT, true, true)) {
    const source = await readCanonicalFile(sourceRelative);
    const treeRelative = relativeWithin(SKILL_SOURCE_ROOT, sourceRelative);
    const output =
      path.posix.basename(sourceRelative) === "SKILL.md"
        ? Buffer.from(injectFrontmatterNotice(source.toString("utf8"), SKILL_NOTICE))
        : source;

    for (const outputRoot of SKILL_OUTPUT_ROOTS) {
      addDesired(desired, `${outputRoot}/${treeRelative}`, output);
    }
  }

  for (const sourceRelative of await listFiles(COMMAND_SOURCE_ROOT, true, true)) {
    const treeRelative = relativeWithin(COMMAND_SOURCE_ROOT, sourceRelative);
    if (treeRelative.includes("/") || !treeRelative.endsWith(".md")) {
      throw new Error(
        `unexpected command source ${sourceRelative}; expected shared/commands/<name>.md`,
      );
    }

    const source = await readCanonicalFile(sourceRelative, "utf8");
    const output = Buffer.from(injectFrontmatterNotice(source, COMMAND_NOTICE));
    for (const outputRoot of COMMAND_OUTPUT_ROOTS) {
      addDesired(desired, `${outputRoot}/${treeRelative}`, output);
    }
  }

  const agentSourceFiles = await listFiles(AGENT_SOURCE_ROOT, true, true);
  for (const sourceRelative of agentSourceFiles) {
    const treeRelative = relativeWithin(AGENT_SOURCE_ROOT, sourceRelative);
    const parts = treeRelative.split("/");
    if (parts.length !== 2 || parts[1] !== "PROMPT.md") {
      throw new Error(
        `unexpected agent source ${sourceRelative}; expected shared/agents/<name>/PROMPT.md`,
      );
    }

    const agentName = parts[0];
    const source = await readCanonicalFile(sourceRelative, "utf8");
    for (const { root, suffix } of AGENT_OUTPUTS) {
      let providerSource = source;
      if (agentName === "sc-theme-reviewer") {
        if (root === "providers/claude/storeconnect/agents") {
          providerSource = injectFrontmatterLine(
            providerSource,
            CLAUDE_THEME_REVIEWER_TOOLS,
          );
        } else if (root === "providers/copilot/storeconnect/agents") {
          providerSource = injectFrontmatterLine(
            providerSource,
            COPILOT_THEME_REVIEWER_TOOLS,
          );
        } else if (root === "providers/cursor/storeconnect/agents") {
          providerSource = injectFrontmatterLine(
            providerSource,
            CURSOR_THEME_REVIEWER_READONLY,
          );
        }
      }
      const output = Buffer.from(
        injectFrontmatterNotice(providerSource, AGENT_NOTICE),
      );
      addDesired(desired, `${root}/${agentName}${suffix}`, output);
    }
  }

  const context = await readCanonicalFile(CONTEXT_SOURCE);
  for (const output of CONTEXT_OUTPUTS) {
    addDesired(desired, output, context);
  }
  addDesired(
    desired,
    CURSOR_CONTEXT_OUTPUT,
    Buffer.concat([Buffer.from(CURSOR_CONTEXT_FRONTMATTER), context]),
  );

  const geminiContext = await readCanonicalFile(GEMINI_CONTEXT_SOURCE);
  addDesired(
    desired,
    GEMINI_CONTEXT_OUTPUT,
    Buffer.concat([
      Buffer.from(`${GEMINI_CONTEXT_NOTICE}\n\n`),
      geminiContext,
    ]),
  );

  const license = await readCanonicalFile("LICENSE");
  for (const providerRoot of PROVIDER_ROOTS) {
    addDesired(desired, `${providerRoot}/LICENSE`, license);
  }

  return new Map([...desired].sort(([left], [right]) => left.localeCompare(right)));
}

function addDesired(desired, relative, content) {
  const normalized = normalizeRelative(relative);
  assertManagedOutput(normalized);
  if (desired.has(normalized)) {
    throw new Error(`duplicate generated output: ${normalized}`);
  }
  desired.set(normalized, content);
}

function injectFrontmatterNotice(source, notice) {
  const frontmatter = source.match(/^---\r?\n[\s\S]*?\r?\n---(?=\r?\n)/);
  if (!frontmatter) {
    throw new Error("generated skill or agent source is missing YAML frontmatter");
  }
  if (source.includes(notice)) {
    throw new Error("generated notice must not be present in a shared source");
  }

  const newline = source.startsWith("---\r\n") ? "\r\n" : "\n";
  const insertAt = frontmatter[0].length;
  return `${source.slice(0, insertAt)}${newline}${newline}${notice}${source.slice(insertAt)}`;
}

function injectFrontmatterLine(source, line) {
  const frontmatter = source.match(/^---\r?\n[\s\S]*?\r?\n---(?=\r?\n)/);
  if (!frontmatter) {
    throw new Error("generated agent source is missing YAML frontmatter");
  }
  const key = line.slice(0, line.indexOf(":"));
  if (new RegExp(`^${key}:`, "m").test(frontmatter[0])) {
    throw new Error(`generated agent source already contains ${key} frontmatter`);
  }

  const newline = source.startsWith("---\r\n") ? "\r\n" : "\n";
  const insertAt = frontmatter[0].lastIndexOf(`${newline}---`);
  return `${source.slice(0, insertAt)}${newline}${line}${source.slice(insertAt)}`;
}

async function findDifferences(desired) {
  const actualManagedFiles = new Set();
  for (const root of MANAGED_TREE_ROOTS) {
    for (const relative of await listFiles(root, false)) {
      actualManagedFiles.add(relative);
    }
  }

  const differences = [];
  for (const [relative, expected] of desired) {
    const absolute = repoPath(relative);
    let metadata;
    try {
      metadata = await lstat(absolute);
    } catch (error) {
      if (error.code === "ENOENT") {
        differences.push({ type: "missing", relative });
        continue;
      }
      throw error;
    }

    if (!metadata.isFile() || metadata.isSymbolicLink()) {
      differences.push({ type: "changed", relative });
      continue;
    }

    const actual = await readFile(absolute);
    if (!actual.equals(expected)) {
      differences.push({ type: "changed", relative });
    }
  }

  for (const relative of actualManagedFiles) {
    if (!desired.has(relative)) {
      differences.push({ type: "orphan", relative });
    }
  }

  return differences.sort(
    (left, right) =>
      left.type.localeCompare(right.type) ||
      left.relative.localeCompare(right.relative),
  );
}

async function applyDifferences(differences, desired) {
  const orphans = differences
    .filter(({ type }) => type === "orphan")
    .sort((left, right) => right.relative.length - left.relative.length);

  for (const { relative } of orphans) {
    assertManagedOutput(relative);
    await rm(repoPath(relative), { force: true });
  }

  for (const { type, relative } of differences) {
    if (type === "orphan") continue;

    assertManagedOutput(relative);
    const absolute = repoPath(relative);
    await ensureSafeParent(path.posix.dirname(relative));

    let metadata;
    try {
      metadata = await lstat(absolute);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (metadata && (!metadata.isFile() || metadata.isSymbolicLink())) {
      await rm(absolute, { force: true });
    }

    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, desired.get(relative));
  }
}

async function ensureSafeParent(relativeDirectory) {
  const parts = normalizeRelative(relativeDirectory).split("/");
  let current = REPO_ROOT;
  for (const part of parts) {
    current = path.join(current, part);
    try {
      const metadata = await lstat(current);
      if (metadata.isSymbolicLink()) {
        throw new Error(`refusing to write through symbolic link: ${relativeDirectory}`);
      }
      if (!metadata.isDirectory()) {
        throw new Error(`generated output parent is not a directory: ${relativeDirectory}`);
      }
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
  }
}

async function readCanonicalFile(relative, encoding) {
  const absolute = repoPath(relative);
  await assertNoSymbolicLinkComponents(relative);
  const metadata = await lstat(absolute);
  if (!metadata.isFile() || metadata.isSymbolicLink()) {
    throw new Error(`expected a real canonical file: ${relative}`);
  }
  return readFile(absolute, encoding);
}

async function assertNoSymbolicLinkComponents(relative) {
  const normalized = normalizeRelative(relative);
  let current = REPO_ROOT;
  for (const part of normalized.split("/")) {
    current = path.join(current, part);
    const metadata = await lstat(current);
    if (metadata.isSymbolicLink()) {
      throw new Error(`canonical input must not use a symbolic link: ${relative}`);
    }
  }
}

async function listFiles(rootRelative, required, rejectSymbolicLinks = false) {
  const root = repoPath(rootRelative);
  let rootMetadata;
  try {
    rootMetadata = await lstat(root);
  } catch (error) {
    if (!required && error.code === "ENOENT") return [];
    throw error;
  }

  if (!rootMetadata.isDirectory() || rootMetadata.isSymbolicLink()) {
    throw new Error(`expected a real directory: ${rootRelative}`);
  }

  const files = [];
  async function visit(absoluteDirectory) {
    const entries = await readdir(absoluteDirectory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const absolute = path.join(absoluteDirectory, entry.name);
      const relative = toRepoRelative(absolute);
      if (entry.isSymbolicLink()) {
        if (rejectSymbolicLinks) {
          throw new Error(`canonical input must not use a symbolic link: ${relative}`);
        }
        files.push(relative);
      } else if (entry.isDirectory()) {
        await visit(absolute);
      } else {
        files.push(relative);
      }
    }
  }

  await visit(root);
  return files;
}

function relativeWithin(root, child) {
  const prefix = `${normalizeRelative(root)}/`;
  if (!child.startsWith(prefix)) {
    throw new Error(`${child} is outside ${root}`);
  }
  return child.slice(prefix.length);
}

function repoPath(relative) {
  const normalized = normalizeRelative(relative);
  const absolute = path.resolve(REPO_ROOT, ...normalized.split("/"));
  const boundary = path.relative(REPO_ROOT, absolute);
  if (boundary.startsWith("..") || path.isAbsolute(boundary)) {
    throw new Error(`path escapes repository root: ${relative}`);
  }
  return absolute;
}

function toRepoRelative(absolute) {
  return normalizeRelative(path.relative(REPO_ROOT, absolute).split(path.sep).join("/"));
}

function normalizeRelative(relative) {
  if (typeof relative !== "string" || relative.length === 0) {
    throw new Error("generated path must be a non-empty relative path");
  }
  if (relative.includes("\\") || relative.includes("\0")) {
    throw new Error(`invalid generated path: ${relative}`);
  }

  const normalized = path.posix.normalize(relative);
  if (
    normalized !== relative ||
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    path.posix.isAbsolute(normalized)
  ) {
    throw new Error(`invalid generated path: ${relative}`);
  }
  return normalized;
}

function assertManagedOutput(relative) {
  const normalized = normalizeRelative(relative);
  const inManagedTree = MANAGED_TREE_ROOTS.some(
    (root) => normalized.startsWith(`${root}/`) && normalized !== root,
  );
  if (!inManagedTree && !MANAGED_EXACT_FILES.has(normalized)) {
    throw new Error(`refusing to manage non-generated path: ${relative}`);
  }
}

function printDifferences(differences) {
  console.error("Generated packages are out of date:");
  for (const { type, relative } of differences) {
    console.error(`  ${type.padEnd(7)} ${relative}`);
  }
  console.error("Run `node scripts/render-packages.mjs` to update generated files.");
}

function summarize(differences) {
  const counts = { missing: 0, changed: 0, orphan: 0 };
  for (const { type } of differences) counts[type] += 1;
  return `${counts.missing} added, ${counts.changed} updated, ${counts.orphan} removed`;
}
