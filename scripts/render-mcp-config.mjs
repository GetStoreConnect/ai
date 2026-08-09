#!/usr/bin/env node

import { isIP } from "node:net";

const PROVIDERS = new Set([
  "antigravity",
  "claude",
  "codex",
  "gemini",
  "copilot",
  "cursor",
  "grok",
  "kiro",
]);

const HELP = `Usage:
  node scripts/render-mcp-config.mjs \\
    --provider antigravity|claude|codex|gemini|copilot|cursor|grok|kiro \\
    --url https://HOST/mcp

Print a provider-native StoreConnect MCP configuration to stdout. The default
output contains connection details only. This command never accepts
authentication data and never reads or modifies client configuration files.
After adding the connection, use the client's native sign-in flow. If the
installed client cannot sign in, stop and follow the current StoreConnect and
client documentation or an administrator-approved credential interface.

Options:
  --provider  Target AI product (required)
  --url       Literal HTTPS StoreConnect endpoint ending exactly in /mcp
  --help      Show this help text
`;

try {
  const parsed = parseArguments(process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(HELP);
  } else {
    const endpoint = validateEndpoint(parsed.url);
    const output = renderConfig(parsed.provider, endpoint);

    console.error(
      "Warning: this output contains a literal client MCP URL; keep the rendered configuration local and untracked.",
    );
    process.stdout.write(output);
  }
} catch (error) {
  console.error(`render-mcp-config: ${error.message}`);
  process.exitCode = 2;
}

function parseArguments(args) {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    return { help: true };
  }
  if (args.includes("--help") || args.includes("-h")) {
    throw new Error("--help cannot be combined with other arguments");
  }

  const values = new Map();
  const allowedFlags = new Set(["--provider", "--url"]);
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (!allowedFlags.has(flag)) {
      throw new Error("unknown argument; run with --help for usage");
    }
    if (values.has(flag)) {
      throw new Error(`duplicate ${flag} argument`);
    }

    const value = args[index + 1];
    if (value === undefined || value.startsWith("-")) {
      throw new Error(`${flag} requires one value`);
    }
    values.set(flag, value);
    index += 1;
  }

  const provider = values.get("--provider");
  const url = values.get("--url");

  if (provider === undefined) throw new Error("--provider is required");
  if (url === undefined) throw new Error("--url is required");
  if (!PROVIDERS.has(provider)) {
    throw new Error(
      "--provider must be one of antigravity, claude, codex, gemini, copilot, cursor, grok, or kiro",
    );
  }

  return { help: false, provider, url };
}

function validateEndpoint(raw) {
  if (/\s/u.test(raw)) {
    throw new Error("--url must not contain whitespace");
  }
  if (/[<>{}\[\]$]/u.test(raw)) {
    throw new Error("--url must be a resolved client endpoint, not a placeholder");
  }
  if (raw.includes("?") || raw.includes("#")) {
    throw new Error("--url must not contain a query or fragment");
  }

  const exactForm = raw.match(/^https:\/\/([^/]+)(\/[^?#]*)$/u);
  if (!exactForm) {
    throw new Error("--url must have the exact form https://HOST/mcp");
  }
  const [, authority, rawPath] = exactForm;
  if (authority.includes("@")) {
    throw new Error("--url must not contain a username or password");
  }
  if (rawPath !== "/mcp") {
    throw new Error("--url path must be exactly /mcp");
  }

  let endpoint;
  try {
    endpoint = new URL(raw);
  } catch {
    throw new Error("--url is not a valid URL");
  }
  if (endpoint.protocol !== "https:") {
    throw new Error("--url must use HTTPS");
  }
  if (endpoint.username !== "" || endpoint.password !== "") {
    throw new Error("--url must not contain a username or password");
  }
  if (endpoint.search !== "" || endpoint.hash !== "") {
    throw new Error("--url must not contain a query or fragment");
  }
  if (endpoint.pathname !== "/mcp") {
    throw new Error("--url path must be exactly /mcp");
  }
  if (endpoint.port !== "") {
    throw new Error("--url must not use a custom port");
  }

  validateClientHostname(endpoint.hostname);
  return endpoint.href;
}

function validateClientHostname(hostname) {
  const lower = hostname.toLowerCase();
  if (isIP(lower) !== 0) {
    throw new Error("--url host must not be an IP address");
  }
  if (lower.endsWith(".")) {
    throw new Error("--url host must not have a trailing dot");
  }

  const labels = lower.split(".");
  if (
    labels.length < 2 ||
    labels.some(
      (label) =>
        label.length === 0 ||
        label.length > 63 ||
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u.test(label),
    )
  ) {
    throw new Error("--url host must be a valid non-local DNS name");
  }

  const reservedSuffixes = [
    ".example",
    ".invalid",
    ".localhost",
    ".local",
    ".internal",
    ".test",
    ".home.arpa",
    ".onion",
  ];
  const reservedDocumentationHosts = [
    "example.com",
    "example.net",
    "example.org",
  ];
  const placeholderLabels = new Set([
    "domain",
    "example",
    "host",
    "hostname",
    "placeholder",
    "store-domain",
    "your-domain",
    "yourdomain",
  ]);
  const isDocumentationHost = reservedDocumentationHosts.some(
    (reserved) => lower === reserved || lower.endsWith(`.${reserved}`),
  );

  if (
    lower === "localhost" ||
    reservedSuffixes.some(
      (suffix) => lower === suffix.slice(1) || lower.endsWith(suffix),
    ) ||
    (!isDocumentationHost &&
      labels.some((label) => placeholderLabels.has(label)))
  ) {
    throw new Error("--url host must be a resolved, non-reserved client host");
  }
}

function renderConfig(provider, endpoint) {
  if (provider === "codex") return renderToml(endpoint);
  if (provider === "grok") return renderToml(endpoint);

  const server = buildJsonServer(provider, endpoint);
  return `${JSON.stringify({ mcpServers: { storeconnect: server } }, null, 2)}\n`;
}

function renderToml(endpoint) {
  return `[mcp_servers.storeconnect]\nurl = ${tomlString(endpoint)}\n`;
}

function buildJsonServer(provider, endpoint) {
  switch (provider) {
    case "antigravity":
      return { serverUrl: endpoint };
    case "claude":
      return { type: "http", url: endpoint };
    case "gemini": {
      // Gemini CLI infers the transport from the key: httpUrl is streamable
      // HTTP; a bare url would select the legacy SSE transport.
      return { httpUrl: endpoint };
    }
    case "copilot":
      return { type: "http", url: endpoint, tools: ["*"] };
    case "cursor":
      return { url: endpoint };
    case "kiro":
      return { url: endpoint, disabled: false, autoApprove: [] };
    default:
      throw new Error("unsupported provider");
  }
}

function tomlString(value) {
  return JSON.stringify(value);
}
