#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const findings = [];
const TAB_SENSITIVE_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsonc",
  ".jsx",
  ".liquid",
  ".md",
  ".mdc",
  ".mjs",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);
const TEMPLATE_ROOTS = ["shared/project-context/", "templates/project-context/"];

function relative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join("/") || ".";
}

function addFinding(filePath, message) {
  findings.push(`${relative(path.resolve(ROOT, filePath))}: ${message}`);
}

function walk(start) {
  const results = [];
  const stack = [start];
  while (stack.length > 0) {
    const current = stack.pop();
    const stat = fs.lstatSync(current);
    if (stat.isFile()) {
      results.push(current);
      continue;
    }
    if (!stat.isDirectory() || stat.isSymbolicLink()) continue;
    for (const entry of fs.readdirSync(current).sort().reverse()) {
      if (entry === ".codex" || entry === ".git" || entry === "node_modules") {
        continue;
      }
      stack.push(path.join(current, entry));
    }
  }
  return results;
}

function looksText(buffer) {
  return !buffer.subarray(0, 8192).includes(0);
}

function visibleMarkdownLines(text) {
  const output = [];
  let fence = null;
  const lines = text.split(/\r?\n/);
  let frontmatter = lines[0] === "---";
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (frontmatter) {
      if (index > 0 && line === "---") frontmatter = false;
      continue;
    }
    const match = /^\s*(`{3,}|~{3,})/.exec(line);
    if (match) {
      if (!fence) fence = match[1][0];
      else if (fence === match[1][0]) fence = null;
      continue;
    }
    if (!fence) output.push({ line, number: index + 1 });
  }
  return output;
}

function validateHeadings(filePath, text) {
  const lines = visibleMarkdownLines(text);
  const headings = [];
  for (let index = 0; index < lines.length; index += 1) {
    const { line, number } = lines[index];
    const atx = /^\s{0,3}(#{1,6})(?:\s+|$)(.*?)\s*#*\s*$/.exec(line);
    if (atx) {
      const title = atx[2].trim();
      if (!title) addFinding(filePath, `line ${number} has an empty Markdown heading`);
      headings.push({ level: atx[1].length, number, title });
      continue;
    }
    if (/^\s{0,3}#{1,6}\S/.test(line)) {
      addFinding(filePath, `line ${number} has an ATX heading without a separating space`);
      continue;
    }
    if (/^\s{0,3}#{7,}/.test(line)) {
      addFinding(filePath, `line ${number} uses more than six Markdown heading markers`);
      continue;
    }
    const next = lines[index + 1];
    if (line.trim() && next && next.number === number + 1 && /^\s*(=+|-+)\s*$/.test(next.line)) {
      headings.push({ level: next.line.trim().startsWith("=") ? 1 : 2, number, title: line.trim() });
      index += 1;
    }
  }

  if (headings.length === 0) {
    addFinding(filePath, "Markdown document has no heading");
    return;
  }
  if (headings[0].level !== 1) {
    addFinding(filePath, `first Markdown heading is level ${headings[0].level}; expected level 1`);
  }
  const h1Count = headings.filter((heading) => heading.level === 1).length;
  if (h1Count !== 1) {
    addFinding(filePath, `Markdown document has ${h1Count} level-1 headings; expected exactly one`);
  }
  for (let index = 1; index < headings.length; index += 1) {
    const previous = headings[index - 1];
    const current = headings[index];
    if (current.level > previous.level + 1) {
      addFinding(
        filePath,
        `line ${current.number} jumps from heading level ${previous.level} to ${current.level}`,
      );
    }
  }
}

let approvedTemplateMarkers = new Set();
const contextSource = path.join(ROOT, "shared/project-context/PROJECT_CONTEXT.md");
if (fs.existsSync(contextSource)) {
  const contextText = fs.readFileSync(contextSource, "utf8");
  approvedTemplateMarkers = new Set(
    [...contextText.matchAll(/<[A-Za-z][^>\n]*>/g)].map((match) => match[0]),
  );
}

function validateTemplateMarkers(filePath, text) {
  const repoPath = relative(filePath);
  if (TEMPLATE_ROOTS.some((root) => repoPath.startsWith(root))) return;
  const lines = text.split(/\r?\n/);
  const contextMarkersFound = new Set();
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const marker of approvedTemplateMarkers) {
      if (line.includes(marker)) contextMarkersFound.add(marker);
    }
    if (
      /(?:\{\{\s*(?:REPLACE_ME|PLACEHOLDER|YOUR_[A-Z0-9_]+)\s*\}\}|@@[A-Z][A-Z0-9_-]+@@|__(?:REPLACE_ME|PLACEHOLDER|YOUR_[A-Z0-9_]+)__|<REPLACE(?:_ME)?>)/.test(
        line,
      )
    ) {
      addFinding(filePath, `line ${index + 1} contains an unresolved template marker`);
    }
  }
  // Command and code references legitimately use isolated angle-bracket
  // parameters. A leaked project-context template carries several distinct
  // markers, so require a cluster before treating them as unresolved output.
  if (contextMarkersFound.size >= 3) {
    addFinding(
      filePath,
      `contains unresolved project-context markers: ${[...contextMarkersFound].sort().join(", ")}`,
    );
  }
}

for (const filePath of walk(ROOT)) {
  const buffer = fs.readFileSync(filePath);
  if (!looksText(buffer)) continue;
  const text = buffer.toString("utf8");
  const repoPath = relative(filePath);
  const lines = text.split(/\r?\n/);

  if (text.length > 0 && !text.endsWith("\n")) {
    addFinding(filePath, "file does not end with a newline");
  }
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/[ \t]+$/.test(line)) addFinding(filePath, `line ${index + 1} has trailing whitespace`);
    if (/^(?:<{7}(?:\s|$)|={7}\s*$|>{7}(?:\s|$)|\|{7}(?:\s|$))/.test(line)) {
      addFinding(filePath, `line ${index + 1} contains a merge-conflict marker`);
    }
    if (TAB_SENSITIVE_EXTENSIONS.has(path.extname(repoPath).toLowerCase()) && line.includes("\t")) {
      addFinding(filePath, `line ${index + 1} contains a tab; use spaces in this file type`);
    }
  }

  validateTemplateMarkers(filePath, text);
  if (/\.mdc?$/i.test(repoPath)) validateHeadings(filePath, text);
}

const uniqueFindings = [...new Set(findings)].sort();
if (uniqueFindings.length > 0) {
  console.error(`Repository lint failed with ${uniqueFindings.length} finding${uniqueFindings.length === 1 ? "" : "s"}:`);
  for (const finding of uniqueFindings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log("Repository lint passed.");
}
