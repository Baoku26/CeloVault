# planning.md — CeloVault Architecture & Design

> This document captures permanent architectural decisions.
> Read before modifying anything in `lib/`, `agent/`, or `app/api/`.

---

## System overview

CeloVault has two distinct runtime processes:

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Vercel)                                              │
│  Next.js 14 · App Router · TailwindCSS · shadcn/ui             │
│  viem (read-only) · wagmi · RainbowKit/MiniPay                 │
│                                                                  │
│  User connects wallet → views balances → configures agent       │
│  → sees live FX rates → reviews swap history                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ API routes (REST)
                         │ /api/balances
                         │ /api/rates
                         │ /api/agent/status
                         │
┌────────────────────────▼────────────────────────────────────────┐
│  AGENT BACKEND (Railway)                                        │
│  Node.js · TypeScript · viem (read + write)                    │
│  @chaoschain/sdk · Mento SDK                                   │
│                                                                  │
│  Autonomous loop:                                               │
│  read balances → get rates → check threshold                   │
│  → execute swap → feeCurrency=USDC → ERC-8004 feedback         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend architecture

### Route structure (App Router)

```
app/
├── layout.tsx                  # Root: fonts, ThemeProvider, WalletProvider, Toaster
├── (dashboard)/
│   ├── layout.tsx              # Dashboard shell: Sidebar + Topbar
│   ├── page.tsx                # /  →  Overview: balances + agent status + recent swaps
│   ├── swap/
│   │   └── page.tsx            # /swap  →  Manual swap interface
│   ├── history/
│   │   └── page.tsx            # /history  →  Full transaction history + FX chart
│   └── agent/
│       └── page.tsx            # /agent  →  Agent config + ERC-8004 identity card
└── api/
    ├── balances/route.ts
    ├── rates/route.ts
    ├── swap/route.ts
    └── agent/
        └── status/route.ts
```

### Component module boundaries

Components are organized by **domain**, not by type. Never put a wallet-specific component in `components/ui/`. Never put a layout component in `components/wallet/`.

```
components/
├── ui/                         # OWNED shadcn/ui primitives
│   ├── button.tsx              # Extended: custom variants for agent actions
│   ├── card.tsx                # Extended: FinCard variant for balance display
│   ├── badge.tsx               # Extended: token color variants
│   ├── table.tsx
│   ├── dialog.tsx
│   ├── drawer.tsx              # Mobile swap flow
│   ├── sonner.tsx              # Toast notifications
│   ├── skeleton.tsx
│   ├── separator.tsx
│   ├── tabs.tsx
│   ├── tooltip.tsx
│   └── switch.tsx              # Agent active/paused toggle
│
├── layout/
│   ├── Sidebar.tsx             # Desktop nav: Dashboard · Swap · History · Agent
│   ├── MobileNav.tsx           # Bottom tab bar for mobile / MiniPay
│   └── Topbar.tsx              # Wallet address + network badge + settings
│
├── wallet/
│   ├── BalanceCard.tsx         # Individual token balance display
│   ├── BalanceGrid.tsx         # 2×3 grid of BalanceCards
│   ├── WalletConnect.tsx       # Unified connect button (MiniPay aware)
│   └── NetworkBadge.tsx        # "Celo Mainnet" / "Testnet" indicator
│
├── agent/
│   ├── AgentStatusCard.tsx     # Active / Paused + last action + next run
│   ├── AgentConfigForm.tsx     # Threshold, interval, token pair settings
│   ├── AgentIdentityCard.tsx   # ERC-8004 NFT identity display
│   └── ReputationBadge.tsx     # 8004scan score + feedback count
│
├── swap/
│   ├── SwapCard.tsx            # Token pair selector + amount input
│   ├── RateDisplay.tsx         # Best rate + source (Mento/Uniswap)
│   ├── SwapConfirmDialog.tsx   # Confirm before executing
│   └── SwapSuccessAnimation.tsx # Framer Motion success state
│
└── charts/
    ├── FXRateChart.tsx         # Recharts line chart — rate over time
    └── VolumeBar.tsx           # Daily swap volume bars
```

### Data flow

```
User wallet (wagmi/viem)
    ↓
useBalances() hook           [polls /api/balances every 30s]
useRates() hook              [polls /api/rates every 15s]
useAgentStatus() hook        [polls /api/agent/status every 10s]
useSwapHistory() hook        [reads onchain events, cached]
    ↓
Components receive typed props
    ↓
User actions → wagmi writeContract (manual swap)
            → fetch /api/swap (trigger agent swap)
```

---

## Agent backend architecture

### Core loop (`agent/index.ts`)

```
setInterval(async () => {
  1. readBalances()          — viem multicall, all tokens
  2. getRates()              — parallel: Mento + Uniswap V3
  3. selectBestRate()        — compare, pick winner
  4. checkThreshold()        — rate > config.targetRate?
  5. checkMinBalance()       — balance >= config.minSwapAmount?
  6. executeSwap()           — viem writeContract, feeCurrency=USDC_ADAPTER
  7. submitFeedback()        — ERC-8004 reputation registry
  8. logActivity()           — structured JSON to stdout
}, config.intervalMs)
```

### Agent config schema

```typescript
interface AgentConfig {
  tokenIn: `0x${string}`;         // e.g. USDm
  tokenOut: `0x${string}`;        // e.g. NGNm
  targetRate: number;              // Swap when rate >= this
  minSwapAmount: bigint;           // Minimum amount to swap (in tokenIn decimals)
  maxSwapAmount: bigint;           // Cap per single swap
  slippageBps: number;             // e.g. 100 = 1%
  intervalMs: number;              // Poll interval (default: 60000)
  autoExecute: boolean;            // If false, alert only
}
```

### Swap routing logic

```typescript
// lib/agent/router.ts

async function getBestRoute(tokenIn, tokenOut, amountIn): Promise<SwapRoute> {
  const [mentoRate, uniswapRate] = await Promise.all([
    getMentoRate(tokenIn, tokenOut, amountIn),
    getUniswapV3Rate(tokenIn, tokenOut, amountIn),
  ]);

  return mentoRate.amountOut >= uniswapRate.amountOut
    ? { ...mentoRate, source: "mento" }
    : { ...uniswapRate, source: "uniswap-v3" };
}
```

### ERC-8004 integration

**Registration** (one-time, run manually):
```typescript
// lib/erc8004/register.ts
// 1. Upload agent JSON to IPFS → get agentURI
// 2. Call identityRegistry.register(agentURI) → get agentId (NFT token ID)
// 3. Store agentId in .env / config
```

**Post-swap feedback** (every successful swap):
```typescript
// lib/erc8004/feedback.ts
await reputationRegistry.giveFeedback(
  agentId,
  90,                          // score (0–100)
  0,                           // decimals
  "successRate",               // tag
  "",
  agentEndpointUrl,
  ipfsFeedbackUri,
  feedbackHash
);
```

---

## Design system

### Visual identity

CeloVault is a **premium fintech dashboard**. Dark, precise, editorial.
Not another generic dApp. Not purple gradients. Not glowing orbs.

**Mood:** Professional crypto trader tool meets African fintech product.
**Reference feel:** Vercel dashboard × Stripe × something you'd actually use in Lagos.

### Color tokens

```css
/* globals.css — extend shadcn/ui CSS variables */

:root {
  /* Backgrounds */
  --background:       0 0% 4%;       /* #0A0A0A — near black */
  --surface:          0 0% 7%;       /* #121212 — card surface */
  --surface-hover:    0 0% 9%;       /* hover state */
  --border:           0 0% 13%;      /* subtle borders */
  --border-strong:    0 0% 20%;      /* emphasized borders */

  /* Celo brand */
  --celo-green:       152 63% 52%;   /* #35D07F */
  --celo-gold:        43 95% 67%;    /* #FBCC5C */

  /* Text */
  --text-primary:     0 0% 98%;      /* near white */
  --text-secondary:   0 0% 60%;      /* muted labels */
  --text-tertiary:    0 0% 38%;      /* hints, disabled */

  /* Semantic */
  --success:          152 63% 52%;   /* same as celo-green */
  --warning:          43 95% 67%;    /* same as celo-gold */
  --destructive:      0 72% 51%;     /* red for errors */
  --info:             199 89% 48%;   /* blue for info states */
}
```

### Typography

```typescript
// app/layout.tsx
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

// GeistSans → UI labels, copy, headings
// GeistMono → numbers, addresses, amounts, hashes
```

Numbers and financial amounts always use:
```css
font-family: var(--font-mono);
font-variant-numeric: tabular-nums;
```

### Spacing scale

Stick to Tailwind defaults. Custom additions in `tailwind.config.ts`:
```
spacing.18 = 4.5rem   (72px — card gap)
spacing.22 = 5.5rem   (88px — sidebar width collapsed)
```

### Motion principles

Using Framer Motion. Three presets defined in `lib/motion.ts`:

```typescript
export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
};

export const staggerChildren = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.2 },
};
```

Use `fadeUp` + `staggerChildren` for balance grid loads.
Use `scaleIn` for modal/dialog entrances.
Keep animations under 300ms. No lingering effects.

### shadcn/ui theming

CeloVault uses the **"new-york"** shadcn/ui style (sharper corners, tighter padding).
After init, immediately extend base variants in:
- `components/ui/button.tsx` → add `ghost-celo` variant (green text, no bg)
- `components/ui/card.tsx` → add `fin` variant (1px border, tighter padding)
- `components/ui/badge.tsx` → add per-token color variants

### Impeccable integration

Impeccable is used in Claude Code sessions to iterate on UI quality.

**DESIGN.md** is the authoritative design record. Run `/impeccable document`
after establishing the core design system to generate it.

Key commands for this project:
- `/impeccable shape` before building any new screen
- `/impeccable typeset` — our typography choices need enforcement
- `/impeccable bolder` — default AI output is too timid for this design
- `/impeccable delight` — add micro-interactions to swap success, agent status
- `/impeccable harden` — error states, empty states, loading skeletons
- `/impeccable adapt` — ensure MiniPay mobile layout works

---

## API design

### GET /api/balances

```typescript
// Query: ?address=0x...&network=mainnet
// Response:
{
  balances: {
    USDm: { raw: "1000000000000000000", formatted: "1.00", usd: "1.00" },
    NGNm: { raw: "1650000000000000000000", formatted: "1650.00", usd: "1.00" },
    KESm: { ... },
    // ...
  },
  totalUsd: "4.21",
  timestamp: 1749380000
}
```

### GET /api/rates

```typescript
// Query: ?tokenIn=USDm&tokenOut=NGNm&amount=1
// Response:
{
  mento:    { rate: 1651.2, amountOut: "1651200000...", gas: "0.0001" },
  uniswap:  { rate: 1648.7, amountOut: "1648700000...", gas: "0.0001" },
  best:     "mento",
  spread:   0.15,  // % difference
  timestamp: 1749380000
}
```

### GET /api/agent/status

```typescript
{
  active: true,
  agentAddress: "0x...",
  agentId: "42",               // ERC-8004 NFT token ID
  lastSwap: { ... } | null,
  nextRun: 1749380060,
  config: { ... },
  reputationScore: 87,
  totalSwaps: 14
}
```

---

## Testing strategy

Given the 7-day timeline, testing is minimal but deliberate:

1. **Testnet first** — all swap logic developed against Celo Sepolia
2. **Manual integration test** — live swap USDm → NGNm on Sepolia before mainnet
3. **Type safety** — TypeScript strict mode catches most runtime errors
4. **Error boundaries** — React error boundaries on all dashboard sections
5. **Agent health check** — `/health` endpoint returns agent status JSON

No unit tests in scope for the hackathon. Add post-submission.

---

## Post-hackathon roadmap (stretch goals)

1. x402 HTTP-native payment endpoint on the agent
2. Superfluid streaming for continuous NGNm streams
3. ODIS phone-number → wallet lookup (send to phone number)
4. Agent Visa application (Tourist → Work Visa)
5. Multi-wallet support (manage multiple addresses)
6. Mobile app wrapper (Expo + existing Solana wallet patterns from CINO)
