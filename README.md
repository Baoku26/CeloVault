# CeloVault — Autonomous Multi-Currency Stablecoin Agent

> A fully autonomous stablecoin wallet agent on Celo. Track balances, auto-swap at best rates, and pay in local currency — all without touching a button.

Built for the [Celo Onchain Agents Hackathon](https://celo.org/hackathon) · June 2026

---

## What it does

CeloVault is registered as a first-class ERC-8004 onchain agent on Celo Mainnet. Once configured, it:

1. Monitors your stablecoin balances across USDm, NGNm, KESm, GHSm, EURm, USDC, and USDT
2. Queries best FX rates from **Mento Protocol** and **Uniswap V3** in parallel every 60 seconds
3. Executes swaps autonomously when rate thresholds are met — no approval required
4. Pays gas fees entirely in USDC via Celo's native fee abstraction (`feeCurrency`)
5. Submits ERC-8004 reputation feedback after every successful swap
6. Exposes a `/health` endpoint for production monitoring

**The agent wallet never holds CELO.** It self-funds gas from USDC balance.

---

## Problem

Africans holding stablecoins constantly leave money on the table. NGN/USD rates on Mento move 2–5% intraday. Manually watching rates and executing swaps is a full-time job. CeloVault automates it — the agent executes the optimal swap the moment the threshold is crossed, 24/7.

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
```

---

## ERC-8004 agent registration

The agent card is already uploaded to IPFS: `ipfs://QmdjbPzzAJFCdQ6TcnzNkiWycoP17EBdU9jNDVxc1tqgBj`

To register on Celo Mainnet (requires CELO in agent wallet for gas):

```bash
CACHED_AGENT_URI=ipfs://QmdjbPzzAJFCdQ6TcnzNkiWycoP17EBdU9jNDVxc1tqgBj \
  pnpm agent-register-mainnet
```

Copy the returned `agentId` into `.env.local` as `AGENT_ID=`.

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

---

## Deploy to production

### Agent → Railway

1. Create a new Railway project
2. Connect this GitHub repo
3. Set environment variables (all `AGENT_*` variables + `NEXT_PUBLIC_CELO_RPC`)
4. Railway auto-detects `railway.toml` and runs `pnpm agent-start`
5. Verify: `https://your-app.railway.app/health` returns `{"status":"ok"}`
6. Copy the Railway URL into `.env.local` as `NEXT_PUBLIC_AGENT_API_URL`

### Frontend → Vercel

1. Import the GitHub repo in Vercel
2. Set environment variables:
   - `NEXT_PUBLIC_CELO_RPC`
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - `NEXT_PUBLIC_AGENT_API_URL` (Railway URL from above)
3. Deploy — Vercel auto-detects Next.js via `vercel.json`

> **Do NOT set `AGENT_PRIVATE_KEY` on Vercel.** It's a Railway-only secret.

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

- **Onchain Agents** — ERC-8004 registered agent with reputation
- **DeFi / Stablecoins** — multi-venue rate oracle + autonomous swap execution
- **Africa / Local currencies** — NGN, KES, GHS stablecoin support
- **MiniPay** — mobile-first UI, auto-detects Opera MiniPay wallet

---

## Author

Built by DML for the Celo Onchain Agents Hackathon · June 2026
