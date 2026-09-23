#!/usr/bin/env node

/**
 * set-version.mjs
 *
 * Sets the package version in every file that carries it, from one command.
 *
 *   node scripts/set-version.mjs 0.10.0   # write
 *   node scripts/set-version.mjs --check  # report drift, change nothing
 *
 * Why this exists: the version is duplicated across eight files and nine
 * occurrences. `validate-repository.mjs` already makes a mismatch impossible to
 * *ship* — it reads the Claude manifest as canonical and asserts every other
 * occurrence equals it — so this is not a correctness backstop. It exists
 * because without it a release means eight hand edits, and missing one is only
 * discovered by a red CI run.
 *
 * `server.json` is deliberately excluded. Its `version` describes the hosted
 * Agent API and tracks the StoreConnect platform release (currently 21.0.0), not
 * this repository's packaging. The two advance independently, and conflating
 * them would publish a wrong version to the MCP registry.
 *
 * Two implementation notes:
 *
 *   * Values are set on the parsed object by full JSON path, then the file is
 *     re-serialised. Rewriting the raw text by key name cannot work here:
 *     `.github/plugin/marketplace.json` carries `version` twice, at
 *     `metadata.version` and `plugins[0].version`, and a key-name match cannot
 *     tell them apart. Re-serialising is byte-faithful for every file in
 *     TARGETS — all of them are already exactly `JSON.stringify(value, null, 2)`
 *     plus a trailing newline, which `npm run lint` enforces.
 *   * Nothing is written until every change has been computed. An earlier
 *     version wrote as it went and aborted part-way through, leaving the
 *     repository with seven files bumped and one not.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

/** The manifest the validator treats as canonical. */
const CANONICAL = "providers/claude/storeconnect/.claude-plugin/plugin.json";

/**
 * Every version-bearing location, as a file and the JSON paths within it.
 * Keep in step with the version assertions in validate-repository.mjs.
 */
const TARGETS = [
  { file: CANONICAL, paths: [["version"]] },
  { file: "package.json", paths: [["version"]] },
  { file: "providers/antigravity/storeconnect/plugin.json", paths: [["version"]] },
  { file: "providers/codex/storeconnect/.codex-plugin/plugin.json", paths: [["version"]] },
  { file: "providers/copilot/storeconnect/plugin.json", paths: [["version"]] },
  { file: "providers/cursor/storeconnect/.cursor-plugin/plugin.json", paths: [["version"]] },
  { file: "providers/gemini/storeconnect/gemini-extension.json", paths: [["version"]] },
  { file: "providers/grok/storeconnect/.grok-plugin/plugin.json", paths: [["version"]] },
  {
    file: ".github/plugin/marketplace.json",
    paths: [
      ["metadata", "version"],
      ["plugins", 0, "version"],
    ],
  },
];

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

const argument = process.argv[2];
const checkMode = argument === "--check";

if (!argument || (!checkMode && !SEMVER.test(argument))) {
  console.error("usage: node scripts/set-version.mjs <semver> | --check");
  process.exit(1);
}

function read(object, keys) {
  let cursor = object;
  for (const key of keys) {
    if (cursor === undefined || cursor === null) return undefined;
    cursor = cursor[key];
  }
  return cursor;
}

function write(object, keys, next) {
  let cursor = object;
  for (const key of keys.slice(0, -1)) cursor = cursor[key];
  cursor[keys[keys.length - 1]] = next;
}

const canonicalVersion = JSON.parse(
  await readFile(path.join(REPO_ROOT, CANONICAL), "utf8"),
).version;

if (checkMode && !SEMVER.test(canonicalVersion ?? "")) {
  console.error(`set-version: ${CANONICAL} has no valid semantic version`);
  process.exit(1);
}

const target = checkMode ? canonicalVersion : argument;
const occurrences = TARGETS.reduce((total, entry) => total + entry.paths.length, 0);

// Pass one: read, compare, and stage. No writes.
const drift = [];
const missing = [];
const staged = [];

for (const entry of TARGETS) {
  const absolute = path.join(REPO_ROOT, entry.file);
  const parsed = JSON.parse(await readFile(absolute, "utf8"));
  let changed = false;

  for (const keys of entry.paths) {
    const current = read(parsed, keys);
    const label = `${entry.file} → ${keys.join(".")}`;

    if (current === undefined) {
      missing.push(label);
      continue;
    }
    if (current === target) continue;

    drift.push(`${label} is ${current}, expected ${target}`);
    write(parsed, keys, target);
    changed = true;
  }

  if (changed) {
    staged.push({ file: entry.file, absolute, text: `${JSON.stringify(parsed, null, 2)}\n` });
  }
}

if (missing.length > 0) {
  console.error("set-version: expected version field(s) are absent:");
  for (const label of missing) console.error(`  ${label}`);
  console.error("\nNothing was written. Fix TARGETS or the manifest, then retry.");
  process.exit(1);
}

if (checkMode) {
  if (drift.length === 0) {
    console.log(
      `Version ${canonicalVersion} is consistent across ${TARGETS.length} files (${occurrences} occurrences).`,
    );
    process.exit(0);
  }
  console.error(`Version drift against ${CANONICAL} (${canonicalVersion}):`);
  for (const line of drift) console.error(`  ${line}`);
  console.error(`\nRun \`node scripts/set-version.mjs ${canonicalVersion}\` to fix.`);
  process.exit(1);
}

// Pass two: write. Every change is already computed, so this cannot stop half way.
for (const item of staged) await writeFile(item.absolute, item.text);

if (staged.length === 0) {
  console.log(`Version already ${target} across ${TARGETS.length} files (${occurrences} occurrences).`);
} else {
  console.log(`Set version ${target} across ${occurrences} occurrences; updated ${staged.length} file(s):`);
  for (const item of staged) console.log(`  ${item.file}`);
  console.log("\nserver.json deliberately untouched — it tracks the platform release, not this package.");
}
