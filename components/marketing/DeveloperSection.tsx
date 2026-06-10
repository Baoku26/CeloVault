"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";

type Tab = "rest" | "mcp";

const BASE = "celovault-production.up.railway.app";

const REST_ENDPOINTS = [
  {
    method: "GET",
    path: "/a2a/manifest",
    auth: false,
    desc: "Agent capability card — all skills, supported tokens, ERC-8004 identity, and auth requirements",
  },
  {
    method: "GET",
    path: "/a2a/status",
    auth: false,
    desc: "Active state, agent config, ERC-8004 reputation score, total swaps executed",
  },
  {
    method: "GET",
    path: "/a2a/balances",
    auth: false,
    desc: "Multicall stablecoin balances for any wallet on Celo Mainnet. Query: ?address=0x…",
  },
  {
    method: "POST",
    path: "/a2a/quote",
    auth: false,
    desc: "Best-rate quote across Mento Protocol + Uniswap V3 in parallel. No execution, no auth.",
  },
  {
    method: "POST",
    path: "/a2a/swap",
    auth: true,
    desc: "Execute swap at best available rate. Gas paid in USDC via fee abstraction. Requires Bearer token.",
  },
];

const MCP_TOOLS = [
  {
    name: "cvault_quote",
    params: "tokenIn, tokenOut, amountIn",
    auth: false,
    desc: "Get the best FX rate across Mento + Uniswap V3 for any stablecoin pair. Read-only, no auth needed.",
  },
  {
    name: "cvault_swap",
    params: "tokenIn, tokenOut, amountIn, slippageBps?",
    auth: true,
    desc: "Execute a stablecoin swap at the best available rate. Gas paid in USDC. Requires A2A_API_KEY.",
  },
  {
    name: "cvault_status",
    params: "—",
    auth: false,
    desc: "Agent active state, configuration, ERC-8004 reputation score, and last swap details.",
  },
  {
    name: "cvault_balances",
    params: "address?",
    auth: false,
    desc: "Live stablecoin balances via multicall. Defaults to the CVault agent wallet if no address provided.",
  },
];

const QUOTE_SNIPPET = `// POST /a2a/quote — no auth required
const res = await fetch("https://${BASE}/a2a/quote", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tokenIn:  "USDm",
    tokenOut: "NGNm",
    amountIn: "10"
  })
});

// Response
{
  "rate":    1634.20,
  "source":  "mento",
  "spread":  0.12,
  "mento":   { "rate": 1634.20, "amountOut": "163420..." },
  "uniswap": { "rate": 1629.85, "amountOut": "162985..." },
  "timestamp": 1718012400
}

// POST /a2a/swap — requires Authorization header
const swap = await fetch("https://${BASE}/a2a/swap", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <A2A_API_KEY>"
  },
  body: JSON.stringify({
    tokenIn:    "USDm",
    tokenOut:   "NGNm",
    amountIn:   "10",
    slippageBps: 100  // 1% — optional, default 100
  })
});
// { txHash, amountIn, amountOut, source, timestamp }`;

const MCP_SNIPPET = `// 1. Add to Claude Desktop config:
// ~/Library/Application Support/Claude/claude_desktop_config.json

{
  "mcpServers": {
    "cvault": {
      "command": "pnpm",
      "args": [
        "--prefix", "/absolute/path/to/CeloVault",
        "agent-mcp"
      ],
      "env": {
        "NEXT_PUBLIC_AGENT_API_URL":
          "https://${BASE}",
        "A2A_API_KEY": "<your-key>"
      }
    }
  }
}

// 2. Print your exact config with local path pre-filled:
pnpm agent-mcp --info

// 3. Then ask Claude:
// "Use cvault_quote to check the USDm → NGNm
//  rate for 50 USDm, then swap if rate > 1,600"`;

function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface-nested">
        <Terminal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-[11px] font-mono text-muted-foreground">{label}</span>
      </div>
      <pre className="p-5 text-[11.5px] font-mono text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre bg-black">
        {code}
      </pre>
    </div>
  );
}

export function DeveloperSection() {
  const [tab, setTab] = useState<Tab>("rest");

  return (
    <motion.section
      variants={fadeUp}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-80px" }}
      className="max-w-6xl mx-auto px-4 lg:px-8 py-24 space-y-10"
    >
      {/* Header */}
      <div className="space-y-3 max-w-2xl">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Agent interoperability
        </p>
        <h2 className="text-3xl font-semibold tracking-tight">
          Open to the ecosystem.
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          CVault exposes a REST A2A API and an MCP server — so other agents can
          quote rates and execute swaps without building their own Mento/Uniswap
          routing, and developers can wire CVault directly into Claude, Cursor,
          or any MCP-compatible client.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-lg border border-border bg-surface w-fit">
        {(["rest", "mcp"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-mono transition-colors",
              tab === t
                ? "bg-surface-nested text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "rest" ? "A2A REST API" : "MCP Server"}
          </button>
        ))}
      </div>

      {/* Content panels */}
      <AnimatePresence mode="wait">
        {tab === "rest" ? (
          <motion.div
            key="rest"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid lg:grid-cols-2 gap-8 items-start"
          >
            {/* Endpoint list */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-mono text-muted-foreground mb-5 space-y-0.5">
                <span className="block">Base: https://{BASE}</span>
                <span className="block">Discovery: /.well-known/agent.json</span>
              </p>

              {REST_ENDPOINTS.map(({ method, path, auth, desc }) => (
                <div
                  key={path}
                  className="rounded-lg border border-border bg-surface p-4 space-y-1.5"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "font-mono text-[11px] px-1.5 py-0.5 rounded font-semibold shrink-0",
                        method === "GET"
                          ? "bg-celo-green/10 text-celo-green"
                          : "bg-celo-gold/10 text-celo-gold"
                      )}
                    >
                      {method}
                    </span>
                    <span className="font-mono text-xs text-foreground">{path}</span>
                    {auth && (
                      <span className="ml-auto text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">
                        Bearer
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}

              <a
                href="https://github.com/Baoku26/CeloVault/blob/main/agent/a2a.ts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors pt-1"
              >
                View source → agent/a2a.ts <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Code snippet */}
            <div className="space-y-4">
              <CodeBlock code={QUOTE_SNIPPET} label="fetch · quote + swap" />
              <div className="rounded-lg border border-border bg-surface p-4 space-y-1">
                <p className="text-xs font-medium">ERC-8004 discovery</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The{" "}
                  <span className="font-mono text-foreground">/a2a/manifest</span>{" "}
                  and{" "}
                  <span className="font-mono text-foreground">/.well-known/agent.json</span>{" "}
                  endpoints return the full agent card including all skill
                  definitions and ERC-8004 identity — compatible with the{" "}
                  <a
                    href="https://eips.ethereum.org/EIPS/eip-8004"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:text-celo-green transition-colors underline underline-offset-2"
                  >
                    ERC-8004 agent trust spec
                  </a>.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="mcp"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid lg:grid-cols-2 gap-8 items-start"
          >
            {/* Tool list */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-mono text-muted-foreground mb-5 space-y-0.5">
                <span className="block">Protocol: Model Context Protocol (stdio)</span>
                <span className="block">SDK: @modelcontextprotocol/sdk v1.29</span>
              </p>

              {MCP_TOOLS.map(({ name, params, auth, desc }) => (
                <div
                  key={name}
                  className="rounded-lg border border-border bg-surface p-4 space-y-1.5"
                >
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="font-mono text-xs text-celo-green font-medium shrink-0">
                      {name}
                    </span>
                    {params !== "—" && (
                      <span className="font-mono text-[11px] text-muted-foreground mt-0.5">
                        ({params})
                      </span>
                    )}
                    {auth && (
                      <span className="ml-auto text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">
                        A2A_API_KEY
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}

              <a
                href="https://github.com/Baoku26/CeloVault/blob/main/agent/mcp.ts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors pt-1"
              >
                View source → agent/mcp.ts <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Config snippet */}
            <div className="space-y-4">
              <CodeBlock code={MCP_SNIPPET} label="claude_desktop_config.json" />
              <div className="rounded-lg border border-border bg-surface p-4 space-y-1">
                <p className="text-xs font-medium">Print your config</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Run{" "}
                  <span className="font-mono text-foreground bg-surface-nested px-1.5 py-0.5 rounded">
                    pnpm agent-mcp --info
                  </span>{" "}
                  to output the exact Claude Desktop JSON with your local repo
                  path and Railway URL pre-filled.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
