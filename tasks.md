# tasks.md — CeloVault Build Tasks

> This is the live task tracker. Update it at the end of every session.
> Format: `- [ ]` todo · `- [x]` done · `- [~]` in progress · `- [!]` blocked

---

## How to use this file

- Work top-to-bottom within each day
- Mark tasks `[x]` as you complete them
- If a task is blocked, mark `[!]` and add a note
- Add discovered sub-tasks inline under the parent task
- Update `memory.md` session log at end of each session

---

## Day 1 — June 8 · Scaffold + Celo setup

**Goal:** Working Next.js app with Celo connected. Wallet connects. Balances readable.

- [x] Init Next.js 14 project with App Router + TypeScript strict
  - Scaffolded manually (create-next-app rejected CeloVault dir name for uppercase)
- [x] Install core dependencies
  - viem, wagmi, framer-motion, lucide-react, geist, cva, clsx, tailwind-merge, sonner, recharts
  - @tanstack/react-query, @radix-ui/react-separator, @radix-ui/react-switch
  - pnpm-workspace.yaml configured with allowBuilds for native deps
- [x] Configure Celo Mainnet + Sepolia in `lib/celo/client.ts`
- [x] Create `lib/celo/contracts.ts` — all verified addresses
- [x] Create `lib/celo/tokens.ts` — token metadata (symbol, name, decimals, address, color)
- [x] Install shadcn/ui — owned copies in `components/ui/` (button, card, badge, skeleton, separator, switch, sonner)
- [x] Set up dark theme in `globals.css` — CeloVault color tokens
- [x] Configure `tailwind.config.ts` — extend with Celo green/gold + mono font
- [x] Set up font: GeistSans + GeistMono in `app/layout.tsx`
- [x] Create `lib/celo/fee-abstraction.ts` — feeCurrency helper + adapter addresses
- [x] Create `hooks/useBalances.ts` — multicall read for all stablecoins (polls /30s)
- [x] Create `hooks/useRates.ts` — polls /api/rates every 15s
- [x] Create `hooks/useAgentStatus.ts` — polls /api/agent/status every 10s
- [x] Create API stubs: /api/balances, /api/rates, /api/swap, /api/agent/status
- [x] Create layout shell: Sidebar, MobileNav, Topbar (all in root layout)
- [x] Create dashboard page with balance grid + agent status strip
- [x] Create `.env.local` from `.env.example`
- [x] TypeScript typecheck passes (0 errors)
- [x] pnpm dev starts and is ready in ~3.6s
- [ ] Verify: wallet connect works + balances return on Sepolia testnet
  - Needs agent wallet with testnet tokens. Connect wallet in browser and confirm.

## Discovered tasks

- [x] `app/(dashboard)/page.tsx` conflicts with `app/page.tsx` (both serve `/`)
  - Shell layout was moved to `app/layout.tsx` so route group is now for /swap /history /agent only
  - Fixed: `rm 'app/(dashboard)/page.tsx'` — done Day 2

---

## Day 2 — June 9 · ERC-8004 agent registration

**Goal:** Agent exists onchain. Visible on 8004scan. Reputation registry ready.

- [x] Create `lib/erc8004/registry.ts` — Identity + Reputation registry ABIs + addresses
- [x] Create agent registration JSON (`agent/registration.json`)
  - ERC-8004 v1 format with name, description, image, services array
- [x] Create `lib/erc8004/upload.ts` — IPFS upload via nft.storage + loadAgentCard helper
- [x] Create `lib/erc8004/register.ts` — registerAgent(network) function + scripts/register-agent.ts CLI
- [x] Create `lib/erc8004/feedback.ts` — giveFeedback() + getReputation()
- [x] Create `components/agent/AgentIdentityCard.tsx` — shows agent NFT info, status, 8004scan link
- [x] Create `components/agent/ReputationBadge.tsx` — color-coded score (green ≥80, gold ≥60)
- [x] feeCurrency TypeScript fix — use `celo`/`celoAlfajores` from `viem/chains` (not defineChain)
- [x] 0 TypeScript errors — tsc --noEmit passes clean
- [ ] **USER ACTION REQUIRED:** Add to `.env.local`: `AGENT_PRIVATE_KEY`, `NFTSTORAGE_API_KEY`
- [ ] Run `pnpm agent-register` → Celo Sepolia testnet registration
- [ ] Verify agent on testnet 8004scan
- [ ] Run `pnpm agent-register-mainnet` → Celo Mainnet registration
- [ ] Store returned `agentId` in `.env.local` as `AGENT_ID`
- [ ] Verify agent appears on 8004scan leaderboard (mainnet)

---

## Day 3 — June 10 · Balance reader + rate oracle

**Goal:** Live balances polling. Best FX rate returned from Mento + Uniswap V3.

- [x] Create `lib/mento/rates.ts` — getMentoRate() via Broker + BiPoolManager dynamic lookup
- [x] Create `lib/uniswap/rates.ts` — getUniswapRate() via QuoterV2 simulateContract, tries 3 fee tiers
- [x] Create `lib/agent/router.ts` — parallel query, returns best rate + spread
- [x] Create API route `app/api/rates/route.ts` — live Mento + Uniswap V3 queries
- [x] `app/api/balances/route.ts` — already done (BigInt fix applied Day 2)
- [x] `hooks/useRates.ts` — already done (polls /api/rates every 15s)
- [x] Create `components/swap/RateDisplay.tsx` — rate + source badge + both protocol rates
- [x] Create `components/charts/FXRateChart.tsx` — Recharts line, 50-point localStorage history
- [x] Add Uniswap V3 addresses to contracts.ts (QuoterV2, Factory, Router)
- [ ] Test: USDm/NGNm rate reads correctly on Mainnet (verify in browser)

---

## Day 4 — June 11 · Swap engine

**Goal:** Agent executes autonomous swaps on Celo Mainnet. Gas paid in USDC.

- [x] Create `lib/mento/swap.ts` — executeMentoSwap() with approval flow + feeCurrency
- [x] Create `lib/uniswap/swap.ts` — executeUniswapSwap() with approval flow + feeCurrency
- [x] Create `lib/agent/engine.ts` — AgentEngine class: start/stop/tick/getStatus/updateConfig
- [x] Create `lib/agent/config.ts` — loadAgentConfig() from env vars with defaults
- [x] Create `agent/index.ts` — entry point with dotenv, SIGTERM/SIGINT graceful shutdown
- [x] Create `agent/wallet.ts` — createAgentWallet() from AGENT_PRIVATE_KEY
- [x] Create `agent/health.ts` — Express /health + /status + PATCH /config endpoints
- [x] Create `app/api/swap/route.ts` — POST handler triggering agent wallet swap
- [x] `app/api/agent/status/route.ts` — already done + server cache added
- [x] `hooks/useAgentStatus.ts` — already done (React Query)
- [x] 0 TypeScript errors
- [ ] **Test:** Fund agent wallet with USDC on Mainnet → run `pnpm agent-start` → verify swap
- [ ] **Test:** ERC-8004 reputation feedback submitted after swap (check 8004scan)
- [ ] **Test:** Transaction visible on celoscan.io

---

## Day 5 — June 12 · Frontend dashboard

**Goal:** Full UI built. Dashboard, swap interface, history, agent config all working.

### Layout shell (already done Days 1–2)
- [x] Sidebar, MobileNav, Topbar, WalletConnect (RainbowKit), NetworkBadge
- [ ] Create `components/layout/MobileNav.tsx` — bottom tab bar
- [x] `components/wallet/BalanceCard.tsx` — flag + symbol + mono balance + USD equiv + fadeUp
- [x] `components/wallet/BalanceGrid.tsx` — 2×3 responsive, staggerChildren entrance
- [x] `components/swap/SwapCard.tsx` — pair tabs, amount input, inline confirm + success animation
- [x] `hooks/useSwapHistory.ts` — watches agent status, accumulates to localStorage (100 items)
- [x] `app/(dashboard)/history/page.tsx` — rate chart + full swap table with celoscan links
- [x] `components/agent/AgentStatusCard.tsx` — active pulse, live countdown, stats, toggle
- [x] `components/agent/AgentConfigForm.tsx` — targetRate, slippage, interval tabs, autoExecute
- [x] `app/page.tsx` — BalanceGrid + AgentStatusCard + live rate + mini chart
- [x] `app/(dashboard)/swap/page.tsx` — SwapCard
- [x] `app/(dashboard)/agent/page.tsx` — StatusCard + ConfigForm + Identity + Reputation
- [x] 0 TypeScript errors

---

## Day 6 — June 13 · Deploy + Mainnet testing

**Goal:** Everything live. Agent running on Mainnet. Real swaps happening.

- [ ] Deploy agent to Railway
  - Set all env vars (AGENT_PRIVATE_KEY, NEXT_PUBLIC_CELO_RPC, AGENT_ID, etc.)
  - Verify `/health` endpoint returns 200
  - Verify agent logs are streaming
- [ ] Deploy frontend to Vercel
  - Set NEXT_PUBLIC_CELO_RPC and NEXT_PUBLIC_AGENT_API_URL env vars
  - Verify builds cleanly
  - Verify wallet connect works on deployed URL
- [ ] Run first live autonomous swap on Celo Mainnet
  - USDm → NGNm
  - Verify: tx on celoscan.io
  - Verify: feeCurrency = USDC adapter (no CELO used)
  - Verify: ERC-8004 feedback submitted
  - Verify: 8004scan rank updated
- [x] [Jun 11] MiniPay companion route `/m` — mobile-first vault view + one-tap "Convert to dollars" (local→USDm) at best rate. `components/minipay/CompanionApp.tsx` + `app/m/page.tsx`. Reuses `/api/balances`, `/api/rates`, `/api/swap`. MiniPay copy-compliant (no gas/crypto/CELO). Execution routes via agent-backed `/api/swap` for v1 — user-signed custody is the documented upgrade.
- [ ] Test MiniPay: open deployed URL in Opera Mini → auto-connect (now: `/m` route)
- [ ] Stress test: run agent for 2 hours, verify continuous activity
- [ ] Fix any bugs found during testing
- [ ] Screenshot: 8004scan leaderboard showing CeloVault rank

---

## Day 7 — June 14 · Polish + submit

**Goal:** Submission-ready. Demo video. README. Done.

- [ ] Write `README.md`
  - Project description (1 paragraph)
  - Problem + solution
  - Tech stack list
  - How to run locally (setup instructions)
  - How to run the agent
  - Environment variables table
  - Screenshots
  - Live demo link
  - Hackathon tracks targeted
- [ ] Record demo video (3–5 minutes)
  - Screen record: dashboard overview → live balances
  - Show: FX rate chart + best rate comparison
  - Show: autonomous swap executing
  - Show: ERC-8004 agent identity card
  - Show: MiniPay on mobile
  - Narrate the Nigeria/Africa use case
- [ ] Final `/impeccable polish` pass on all screens
- [ ] Submit to hackathon via official submission form
- [ ] Post on Twitter/X: tag @CeloDevs + @CeloOrg
  - Include demo video
  - Tag the hackathon
  - Brief description of what was built
- [ ] Update `memory.md` with final session log

---

## Stretch goals (only if core is done early)

- [ ] x402 HTTP payment endpoint on agent (`agent/x402.ts`)
- [ ] Superfluid streaming integration (`lib/superfluid/stream.ts`)
- [ ] ODIS phone-to-wallet lookup in swap UI
- [ ] Multi-wallet support (manage multiple addresses)
- [ ] Agent Visa application form embedded in agent config page

---

## Discovered tasks (from Day 1)

- [!] [Discovered Jun 8] `app/(dashboard)/page.tsx` conflicts with root `app/page.tsx` — both resolve to `/`. Root page takes precedence. Fix before Day 2 by running: `! rm app/\(dashboard\)/page.tsx`
- [ ] [Discovered Jun 8] `@chaoschain/sdk` not yet installed — needed for Day 2 ERC-8004 registration. Add when ERC-8004 contract ABIs are confirmed (the package may not exist on npm under this name — research actual SDK on Day 2).
- [ ] [Discovered Jun 8] Mento broker address in `contracts.ts` needs verification — `0x777a8255ca72412f0d706dc03c9d1987306b4caA` is approximate. Confirm on Celopedia before Day 3 swap work.
