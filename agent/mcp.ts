#!/usr/bin/env tsx
/**
 * CVault MCP Server — exposes CVault's swap tools to any MCP-compatible client.
 *
 * Run:   pnpm agent-mcp
 * Info:  pnpm agent-mcp --info
 *
 * Add to Claude Desktop (~/Library/Application Support/Claude/claude_desktop_config.json):
 * {
 *   "mcpServers": {
 *     "cvault": {
 *       "command": "pnpm",
 *       "args": ["--prefix", "/absolute/path/to/CeloVault", "agent-mcp"],
 *       "env": {
 *         "NEXT_PUBLIC_AGENT_API_URL": "https://celovault-production.up.railway.app",
 *         "A2A_API_KEY": "<your-key>"
 *       }
 *     }
 *   }
 * }
 */
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

if (process.argv.includes("--info")) {
  const configPath =
    process.platform === "darwin"
      ? "~/Library/Application Support/Claude/claude_desktop_config.json"
      : "%APPDATA%\\Claude\\claude_desktop_config.json";

  console.log(`
CVault MCP Server — Claude Desktop config snippet:

{
  "mcpServers": {
    "cvault": {
      "command": "pnpm",
      "args": ["--prefix", "${process.cwd()}", "agent-mcp"],
      "env": {
        "NEXT_PUBLIC_AGENT_API_URL": "${process.env.NEXT_PUBLIC_AGENT_API_URL ?? "https://celovault-production.up.railway.app"}",
        "A2A_API_KEY": "<your A2A_API_KEY value>"
      }
    }
  }
}

Config file location: ${configPath}
`);
  process.exit(0);
}

const BASE_URL = process.env.NEXT_PUBLIC_AGENT_API_URL ?? "https://celovault-production.up.railway.app";
const API_KEY = process.env.A2A_API_KEY ?? "";

async function callA2A(path: string, method: "GET" | "POST", body?: unknown) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`A2A ${method} ${path} → ${res.status}: ${text}`);
  }

  return res.json();
}

const server = new McpServer({
  name: "cvault",
  version: "1.0.0",
});

server.tool(
  "cvault_quote",
  "Get the best FX rate quote for swapping Celo stablecoins (Mento vs Uniswap V3). Does not execute — read-only.",
  {
    tokenIn: z.string().describe("Input token symbol, e.g. USDm, USDC"),
    tokenOut: z.string().describe("Output token symbol, e.g. NGNm, KESm, EURm"),
    amountIn: z.string().describe("Amount to swap as a decimal string, e.g. '10.5'"),
  },
  async ({ tokenIn, tokenOut, amountIn }) => {
    const data = await callA2A("/a2a/quote", "POST", { tokenIn, tokenOut, amountIn });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "cvault_swap",
  "Execute a stablecoin swap via CVault at the best available rate. Gas is paid in USDC via fee abstraction. Requires A2A_API_KEY.",
  {
    tokenIn: z.string().describe("Input token symbol, e.g. USDm"),
    tokenOut: z.string().describe("Output token symbol, e.g. NGNm"),
    amountIn: z.string().describe("Amount to swap as a decimal string, e.g. '5.0'"),
    slippageBps: z.number().optional().describe("Slippage tolerance in basis points (default: 100 = 1%)"),
  },
  async ({ tokenIn, tokenOut, amountIn, slippageBps }) => {
    const data = await callA2A("/a2a/swap", "POST", { tokenIn, tokenOut, amountIn, slippageBps });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "cvault_status",
  "Get CVault agent status including active state, config, ERC-8004 reputation score, total swaps, and last swap.",
  {},
  async () => {
    const data = await callA2A("/a2a/status", "GET");
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "cvault_balances",
  "Get live stablecoin balances for a wallet address on Celo Mainnet via multicall.",
  {
    address: z.string().optional().describe("Wallet address (0x...). Defaults to the CVault agent wallet."),
  },
  async ({ address }) => {
    const query = address ? `?address=${address}` : "";
    const data = await callA2A(`/a2a/balances${query}`, "GET");
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  console.error("CVault MCP server error:", err);
  process.exit(1);
});
