#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(new URL("./render-mcp-config.mjs", import.meta.url));
const ENDPOINT = "https://store.example.com/mcp";
const SENSITIVE_SENTINEL = "SC_TEST_SENSITIVE_INPUT_MUST_NOT_APPEAR";
const WARNING =
  "Warning: this output contains a literal client MCP URL; keep the rendered configuration local and untracked.\n";
const PROVIDERS = [
  "antigravity",
  "claude",
  "codex",
  "gemini",
  "copilot",
  "cursor",
  "grok",
  "kiro",
];

try {
  testHelp();
  testProviderMatrix();
  testRejections();
  console.log(
    "MCP config regression passed (8 provider outputs and 43 rejection cases).",
  );
} catch (error) {
  console.error(`test-mcp-config: ${error.message}`);
  process.exitCode = 1;
}

function testHelp() {
  const longHelp = run(["--help"]);
  assertStarted(longHelp, "--help");
  assert.equal(longHelp.status, 0, "--help must exit successfully");
  assert.equal(longHelp.stderr, "", "--help must not emit a warning");
  assert.match(longHelp.stdout, /^Usage:\n/u, "--help must print usage");
  assert.match(
    longHelp.stdout,
    /never reads or modifies client configuration files\./u,
    "--help must state the no-mutation contract",
  );
  assert.match(
    longHelp.stdout,
    /use the client's native sign-in flow\. If the\ninstalled client cannot sign in, stop and follow the current StoreConnect and\nclient documentation or an administrator-approved credential interface\./u,
    "--help must direct users to native sign-in without publishing credential construction",
  );
  assert.ok(longHelp.stdout.endsWith("\n"), "--help must end with a newline");

  const shortHelp = run(["-h"]);
  assertStarted(shortHelp, "-h");
  assert.equal(shortHelp.status, 0, "-h must exit successfully");
  assert.equal(shortHelp.stderr, "", "-h must not emit a warning");
  assert.equal(shortHelp.stdout, longHelp.stdout, "-h must match --help");
}

function testProviderMatrix() {
  for (const provider of PROVIDERS) {
    const result = run([
      "--provider",
      provider,
      "--url",
      ENDPOINT,
    ]);
    assertSuccessfulRender(result, provider);

    const expected = expectedOutput(provider);
    assert.equal(result.stdout, expected, `${provider} output shape changed`);
    assert.ok(
      result.stdout.endsWith("\n"),
      `${provider} output must end with a newline`,
    );
    assert.ok(
      !result.stdout.includes("Warning:"),
      `${provider} warning leaked into stdout`,
    );

    if (provider === "codex" || provider === "grok") {
      assertTomlShape(result.stdout, provider);
    } else {
      assertJsonShape(result.stdout, provider);
    }
  }
}

function testRejections() {
  const cases = [
    ["no arguments", [], "--provider is required"],
    ["missing URL", ["--provider", "claude"], "--url is required"],
    ["missing provider", ["--url", ENDPOINT], "--provider is required"],
    [
      "unknown provider",
      ["--provider", "other", "--url", ENDPOINT],
      "--provider must be one of antigravity, claude, codex, gemini, copilot, cursor, grok, or kiro",
    ],
    [
      "authentication flag",
      ["--provider", "claude", "--url", ENDPOINT, "--auth", "native"],
      "unknown argument; run with --help for usage",
    ],
    [
      "credential flag",
      [
        "--provider", "claude", "--url", ENDPOINT, "--credential",
        SENSITIVE_SENTINEL,
      ],
      "unknown argument; run with --help for usage",
    ],
    [
      "unknown flag",
      ["--provider", "claude", "--url", ENDPOINT, "--unknown", "value"],
      "unknown argument; run with --help for usage",
    ],
    [
      "duplicate provider",
      [
        "--provider",
        "claude",
        "--provider",
        "codex",
        "--url",
        ENDPOINT,
      ],
      "duplicate --provider argument",
    ],
    [
      "duplicate URL",
      [
        "--provider",
        "claude",
        "--url",
        ENDPOINT,
        "--url",
        "https://other.example.com/mcp",
      ],
      "duplicate --url argument",
    ],
    [
      "inline authentication flag",
      [
        "--provider",
        "claude",
        "--url",
        ENDPOINT,
        "--auth=native",
      ],
      "unknown argument; run with --help for usage",
    ],
    [
      "combined help",
      ["--help", "--provider", "claude"],
      "--help cannot be combined with other arguments",
    ],
    [
      "inline credential flag",
      [
        "--provider",
        "claude",
        "--url",
        ENDPOINT,
        `--credential=${SENSITIVE_SENTINEL}`,
      ],
      "unknown argument; run with --help for usage",
    ],
    [
      "unexpected sensitive value",
      [
        "--provider",
        "claude",
        "--url",
        ENDPOINT,
        SENSITIVE_SENTINEL,
      ],
      "unknown argument; run with --help for usage",
    ],
    [
      "extra positional value",
      ["--provider", "claude", "--url", ENDPOINT, "unexpected"],
      "unknown argument; run with --help for usage",
    ],
    [
      "missing provider value",
      ["--provider", "--url", ENDPOINT],
      "--provider requires one value",
    ],
    [
      "missing URL value",
      ["--provider", "claude", "--url"],
      "--url requires one value",
    ],
    [
      "unsupported authentication flag without value",
      ["--provider", "claude", "--url", ENDPOINT, "--auth"],
      "unknown argument; run with --help for usage",
    ],
    [
      "HTTP endpoint",
      baseArgs("http://client.storeconnect.com/mcp"),
      "--url must have the exact form https://HOST/mcp",
    ],
    [
      "empty userinfo",
      baseArgs("https://@client.storeconnect.com/mcp"),
      "--url must not contain a username or password",
    ],
    [
      "username",
      baseArgs("https://user@client.storeconnect.com/mcp"),
      "--url must not contain a username or password",
    ],
    [
      "username and password",
      baseArgs("https://user:pass@client.storeconnect.com/mcp"),
      "--url must not contain a username or password",
    ],
    [
      "empty query",
      baseArgs("https://client.storeconnect.com/mcp?"),
      "--url must not contain a query or fragment",
    ],
    [
      "query",
      baseArgs(`https://client.storeconnect.com/mcp?value=${SENSITIVE_SENTINEL}`),
      "--url must not contain a query or fragment",
    ],
    [
      "empty fragment",
      baseArgs("https://client.storeconnect.com/mcp#"),
      "--url must not contain a query or fragment",
    ],
    [
      "fragment",
      baseArgs("https://client.storeconnect.com/mcp#tools"),
      "--url must not contain a query or fragment",
    ],
    [
      "trailing path slash",
      baseArgs("https://client.storeconnect.com/mcp/"),
      "--url path must be exactly /mcp",
    ],
    [
      "different path",
      baseArgs("https://client.storeconnect.com/api/mcp"),
      "--url path must be exactly /mcp",
    ],
    [
      "dot segments",
      baseArgs("https://client.storeconnect.com/a/../mcp"),
      "--url path must be exactly /mcp",
    ],
    [
      "leading whitespace",
      baseArgs(" https://client.storeconnect.com/mcp"),
      "--url must not contain whitespace",
    ],
    [
      "hostname whitespace",
      baseArgs("https://client storeconnect.com/mcp"),
      "--url must not contain whitespace",
    ],
    [
      "angle placeholder",
      baseArgs("https://<HOST>/mcp"),
      "--url must be a resolved client endpoint, not a placeholder",
    ],
    [
      "environment placeholder",
      baseArgs("https://${STORECONNECT_MCP_URL}/mcp"),
      "--url must be a resolved client endpoint, not a placeholder",
    ],
    [
      "single-label placeholder",
      baseArgs("https://HOST/mcp"),
      "--url host must be a valid non-local DNS name",
    ],
    [
      "reserved example TLD",
      baseArgs("https://client.example/mcp"),
      "--url host must be a resolved, non-reserved client host",
    ],
    [
      "placeholder on real domain",
      baseArgs("https://example.storeconnect.com/mcp"),
      "--url host must be a resolved, non-reserved client host",
    ],
    [
      "local hostname",
      baseArgs("https://localhost/mcp"),
      "--url host must be a valid non-local DNS name",
    ],
    [
      "local suffix",
      baseArgs("https://client.local/mcp"),
      "--url host must be a resolved, non-reserved client host",
    ],
    [
      "private IPv4",
      baseArgs("https://127.0.0.1/mcp"),
      "--url host must not be an IP address",
    ],
    [
      "private IPv6",
      baseArgs("https://[::1]/mcp"),
      "--url must be a resolved client endpoint, not a placeholder",
    ],
    [
      "custom port",
      baseArgs("https://client.storeconnect.com:8443/mcp"),
      "--url must not use a custom port",
    ],
    [
      "trailing hostname dot",
      baseArgs("https://client.storeconnect.com./mcp"),
      "--url host must not have a trailing dot",
    ],
    [
      "invalid hostname character",
      baseArgs("https://client_storeconnect.com/mcp"),
      "--url host must be a valid non-local DNS name",
    ],
    [
      "empty hostname label",
      baseArgs("https://client..storeconnect.com/mcp"),
      "--url host must be a valid non-local DNS name",
    ],
  ];

  assert.equal(cases.length, 43, "update the reported rejection count");
  for (const [name, args, message] of cases) {
    const result = run(args);
    assertStarted(result, name);
    assert.equal(result.status, 2, `${name} must exit with status 2`);
    assert.equal(result.stdout, "", `${name} must keep stdout clean`);
    assert.equal(
      result.stderr,
      `render-mcp-config: ${message}\n`,
      `${name} emitted an unexpected diagnostic`,
    );
    assertNoSensitiveInput(result, name);
    assert.ok(
      !result.stderr.includes("Warning:"),
      `${name} must not emit a success warning`,
    );
  }
}

function baseArgs(url) {
  return ["--provider", "claude", "--url", url];
}

function run(args) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
  });
}

function assertStarted(result, label) {
  assert.equal(result.error, undefined, `${label} process failed to start`);
  assert.equal(result.signal, null, `${label} process received a signal`);
}

function assertSuccessfulRender(result, label) {
  assertStarted(result, label);
  assert.equal(result.status, 0, `${label} must exit successfully`);
  assert.equal(result.stderr, WARNING, `${label} warning changed`);
  assertNoSensitiveInput(result, label);
}

function assertNoSensitiveInput(result, label) {
  assert.ok(
    !result.stdout.includes(SENSITIVE_SENTINEL),
    `${label} leaked sensitive input to stdout`,
  );
  assert.ok(
    !result.stderr.includes(SENSITIVE_SENTINEL),
    `${label} leaked sensitive input to stderr`,
  );
}

function expectedOutput(provider) {
  if (provider === "codex" || provider === "grok") {
    return `[mcp_servers.storeconnect]\nurl = "${ENDPOINT}"\n`;
  }

  const server = expectedJsonServer(provider);
  return `${JSON.stringify({ mcpServers: { storeconnect: server } }, null, 2)}\n`;
}

function expectedJsonServer(provider) {
  switch (provider) {
    case "antigravity":
      return {
        serverUrl: ENDPOINT,
      };
    case "claude":
      return {
        type: "http",
        url: ENDPOINT,
      };
    case "gemini":
      return {
        httpUrl: ENDPOINT,
      };
    case "copilot":
      return {
        type: "http",
        url: ENDPOINT,
        tools: ["*"],
      };
    case "cursor":
      return {
        url: ENDPOINT,
      };
    case "kiro":
      return {
        url: ENDPOINT,
        disabled: false,
        autoApprove: [],
      };
    default:
      throw new Error(`missing JSON expectation for ${provider}`);
  }
}

function assertJsonShape(stdout, provider) {
  const parsed = JSON.parse(stdout);
  assert.deepEqual(
    Object.keys(parsed),
    ["mcpServers"],
    `${provider} must have only mcpServers at the root`,
  );
  assert.deepEqual(
    Object.keys(parsed.mcpServers),
    ["storeconnect"],
    `${provider} must define only storeconnect`,
  );
  assert.deepEqual(
    parsed.mcpServers.storeconnect,
    expectedJsonServer(provider),
    `${provider} server keys changed`,
  );
}

function assertTomlShape(stdout, provider) {
  const lines = stdout.trimEnd().split("\n");
  const expectedKeys = ["[mcp_servers.storeconnect]", "url"];
  const actualKeys = lines.map((line, index) =>
    index === 0 ? line : line.slice(0, line.indexOf("=")).trim(),
  );
  assert.deepEqual(actualKeys, expectedKeys, `${provider} TOML keys changed`);
}
