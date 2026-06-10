# CVault — Autonomous Multi-Currency Stablecoin Agent

> A fully autonomous stablecoin wallet agent on Celo. Track balances, auto-swap at best rates, and pay in local currency — all without touching a button.

Built for the [Celo Onchain Agents Hackathon](https://celo.org/hackathon) · June 2026

---

## What it does

CVault is registered as a first-class ERC-8004 onchain agent on Celo Mainnet. Once configured, it:

1. Monitors your stablecoin balances across USDm, NGNm, KESm, GHSm, EURm, USDC, and USDT
2. Queries best FX rates from **Mento Protocol** and **Uniswap V3** in parallel every 60 seconds
3. Executes swaps autonomously when rate thresholds are met — no approval required
4. Pays gas fees entirely in USDC via Celo's native fee abstraction (`feeCurrency`)
5. Submits ERC-8004 reputation feedback after every successful swap
6. Exposes a REST A2A API so other agents can call CVault's routing without building their own
7. Ships an MCP server so developers can wire CVault into Claude, Cursor, or any MCP client

**The agent wallet never holds CELO.** It self-funds gas from USDC balance.

---

## Problem

Africans holding stablecoins constantly leave money on the table. NGN/USD rates on Mento move 2–5% intraday. Manually watching rates and executing swaps is a full-time job. CVault automates it — the agent executes the optimal swap the moment the threshold is crossed, 24/7.

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript |
| Styling | TailwindCSS v3 + shadcn/ui |
| Animations | Framer Motion |
| Wallet | RainbowKit v2 + wagmi + viem |
| Charts | Recharts |
| Onchain | viem — Mento Broker + Uniswap V3 QuoterV2 |
| Agent | Node.js + TypeScript (standalone process) |
| ERC-8004 | Identity Registry + Reputation Registry |
| A2A API | Express REST router (`agent/a2a.ts`) |
| MCP Server | `@modelcontextprotocol/sdk` v1.29 + zod (`agent/mcp.ts`) |
| IPFS | Pinata |
| Frontend deploy | Vercel |
| Agent deploy | Railway |

---

## Local setup

### Prerequisites

- Node.js 20+
- pnpm 8+

### 1. Install

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_CELO_RPC` | `https://forno.celo.org` (default) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | [cloud.reown.com](https://cloud.reown.com) → Create project |
| `AGENT_PRIVATE_KEY` | Your agent wallet private key (with `0x`) |
| `AGENT_WALLET_ADDRESS` | Derived address from above |
| `PINATA_JWT` | [app.pinata.cloud](https://app.pinata.cloud) → API Keys → Admin JWT |
| `A2A_API_KEY` | Any secret string — required to call `POST /a2a/swap`. Omit in dev to leave the endpoint open. |

### 3. Run the frontend

```bash
pnpm dev
# → http://localhost:3000
```

### 4. Run the agent (separate terminal)

```bash
pnpm agent-dev
# Polls every 60s, logs structured JSON to stdout
# Health check: http://localhost:4000/health
# A2A API:      http://localhost:4000/a2a/manifest
```

---

## Agent interoperability

CVault exposes two integration surfaces so other agents and developers can use its best-rate routing without building their own Mento/Uniswap infrastructure.

### A2A REST API

The agent process mounts a REST router at `/a2a/*`. All endpoints are open except `POST /a2a/swap`, which requires a Bearer token.

**Base URL (production):** `https://celovault-production.up.railway.app`
**Discovery:** `GET /.well-known/agent.json` — returns the full ERC-8004 agent card

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/a2a/manifest` | open | Full agent capability card — skills, supported tokens, ERC-8004 identity |
| `GET` | `/a2a/status` | open | Active state, agent config, reputation score, total swaps executed |
| `GET` | `/a2a/balances?address=0x…` | open | Multicall stablecoin balances for any wallet on Celo Mainnet |
| `POST` | `/a2a/quote` | open | Best-rate quote across Mento + Uniswap V3 — no execution |
| `POST` | `/a2a/swap` | Bearer | Execute swap at best available rate, gas paid in USDC |

**Quote example:**

```bash
curl -X POST https://celovault-production.up.railway.app/a2a/quote \
  -H "Content-Type: application/json" \
  -d '{ "tokenIn": "USDm", "tokenOut": "NGNm", "amountIn": "10" }'
```

```json
{
  "rate": 1634.20,
  "source": "mento",
  "spread": 0.12,
  "mento":   { "rate": 1634.20, "amountOut": "163420000000000000000" },
  "uniswap": { "rate": 1629.85, "amountOut": "162985000000000000000" },
  "timestamp": 1718012400
}
```

**Swap example:**

```bash
curl -X POST https://celovault-production.up.railway.app/a2a/swap \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <A2A_API_KEY>" \
  -d '{ "tokenIn": "USDm", "tokenOut": "NGNm", "amountIn": "10", "slippageBps": 100 }'
```

```json
{
  "txHash": "0xabc…",
  "amountIn": "10000000000000000000",
  "amountOut": "16342000000000000000000",
  "source": "mento",
  "timestamp": 1718012401
}
```

Source: [`agent/a2a.ts`](agent/a2a.ts)

---

### MCP Server

CVault ships an MCP (Model Context Protocol) stdio server with four tools. Add it to Claude Desktop, Cursor, or any MCP-compatible client and ask your AI to quote rates, execute swaps, and check balances directly.

**Tools:**

| Tool | Params | Auth | Description |
|---|---|---|---|
| `cvault_quote` | `tokenIn, tokenOut, amountIn` | none | Best FX rate quote across Mento + Uniswap V3 — read-only |
| `cvault_swap` | `tokenIn, tokenOut, amountIn, slippageBps?` | `A2A_API_KEY` | Execute swap at best rate, gas in USDC |
| `cvault_status` | — | none | Agent state, ERC-8004 reputation score, last swap |
| `cvault_balances` | `address?` | none | Live stablecoin balances via multicall |

**Add to Claude Desktop:**

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
// Windows: %APPDATA%\Claude\claude_desktop_config.json

{
  "mcpServers": {
    "cvault": {
      "command": "pnpm",
      "args": ["--prefix", "/absolute/path/to/CeloVault", "agent-mcp"],
      "env": {
        "NEXT_PUBLIC_AGENT_API_URL": "https://celovault-production.up.railway.app",
        "A2A_API_KEY": "<your-key>"
      }
    }
  }
}
```

Print the config with your local path pre-filled:

```bash
pnpm agent-mcp --info
```

Then in Claude:

```
Use cvault_quote to check the USDm → NGNm rate for 50 USDm,
then swap if the rate is above 1,600
```

Source: [`agent/mcp.ts`](agent/mcp.ts)

---

## ERC-8004 agent registration

The agent card is already uploaded to IPFS: `ipfs://QmVLhHjpYGQZPMk3L4DaDa29RDWXU8e7aZcfnJ3jZa91kY`

Agent registered on Celo Mainnet as **agentId #9226** — view at [8004scan.io/agents/celo/9226](https://8004scan.io/agents/celo/9226).

To update the agent URI after metadata changes:

```bash
pnpm agent-update-uri-mainnet
```

---

## Agent configuration

Configure the agent via the dashboard's Agent page or by setting env vars:

| Variable | Default | Description |
|---|---|---|
| `AGENT_TARGET_RATE` | `1600` | NGN/USD rate threshold to trigger swap |
| `AGENT_MIN_SWAP_AMOUNT` | `1` | Minimum swap size (USDm, 18 decimals) |
| `AGENT_MAX_SWAP_AMOUNT` | `100` | Maximum swap size per tick |
| `AGENT_SLIPPAGE_BPS` | `100` | Slippage tolerance in basis points (100 = 1%) |
| `AGENT_INTERVAL_MS` | `60000` | Polling interval in milliseconds |
| `AGENT_AUTO_EXECUTE` | `false` | Set `true` to enable autonomous execution |
| `A2A_API_KEY` | — | Bearer token required to call `POST /a2a/swap`. Unset = open in dev. |

---

## npm scripts

| Script | Description |
|---|---|
| `pnpm dev` | Next.js dev server on `:3000` |
| `pnpm agent-dev` | Agent process with file watcher |
| `pnpm agent-start` | Agent process (production) |
| `pnpm agent-mcp` | Start the MCP stdio server |
| `pnpm agent-mcp --info` | Print Claude Desktop config snippet |
| `pnpm agent-update-uri-mainnet` | Re-upload metadata to IPFS + call `setAgentURI` on Mainnet |
| `pnpm agent-register-mainnet` | Register a new agent on Celo Mainnet |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript type check |

---

## Deploy to production

### Agent → Railway

1. Create a new Railway project and connect this GitHub repo
2. Set all `AGENT_*` env vars + `NEXT_PUBLIC_CELO_RPC` + `A2A_API_KEY`
3. Railway auto-detects `railway.toml` and runs `pnpm agent-start`
4. Verify: `https://your-app.railway.app/health` returns `{"status":"ok"}`
5. Verify A2A: `https://your-app.railway.app/a2a/manifest` returns the agent card
6. Copy the Railway URL into `.env.local` as `NEXT_PUBLIC_AGENT_API_URL`

### Frontend → Vercel

1. Import the GitHub repo in Vercel
2. Set environment variables:
   - `NEXT_PUBLIC_CELO_RPC`
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - `NEXT_PUBLIC_AGENT_API_URL` (Railway URL from above)
3. Deploy — Vercel auto-detects Next.js

> **Do NOT set `AGENT_PRIVATE_KEY` or `A2A_API_KEY` on Vercel.** Both are Railway-only secrets.

---

## Onchain contracts used

| Contract | Address | Network |
|---|---|---|
| ERC-8004 Identity Registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | Celo Mainnet |
| ERC-8004 Reputation Registry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` | Celo Mainnet |
| USDC Fee Adapter | `0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B` | Celo Mainnet |
| Mento Broker | `0x777a8255ca72412f0d706dc03c9d1987306b4caA` | Celo Mainnet |
| Uniswap V3 QuoterV2 | `0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8` | Celo Mainnet |
| Uniswap V3 Router | `0x5615CDAb10dc425a742d643d949a7F474C01abc4` | Celo Mainnet |

---

## Hackathon tracks

- **Onchain Agents** — ERC-8004 registered agent with verifiable onchain reputation
- **DeFi / Stablecoins** — multi-venue rate oracle + autonomous swap execution
- **Africa / Local currencies** — NGN, KES, GHS stablecoin support
- **MiniPay** — mobile-first UI, auto-detects Opera MiniPay wallet
- **Agent interoperability** — A2A REST API + MCP server for cross-agent and developer use

---

## Author

Built by DML for the Celo Onchain Agents Hackathon · June 2026
