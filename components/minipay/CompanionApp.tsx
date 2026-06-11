"use client";

import { useEffect, useMemo, useState } from "react";
import { useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TOKENS } from "@/lib/celo/tokens";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { useBalances } from "@/hooks/useBalances";
import { useRates } from "@/hooks/useRates";
import type { TokenBalance } from "@/types/tokens";

// Dollar-pegged holdings are already "dollars" — everything else is local money
// the agent can convert. MiniPay copy rule: never say "crypto"; say dollars / stablecoin.
const DOLLAR_SYMBOLS = ["USDm", "USDC", "USDT"];

function isMiniPay(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.ethereum &&
    (window.ethereum as { isMiniPay?: boolean }).isMiniPay === true
  );
}

type Stage = "home" | "confirm" | "success";

export function CompanionApp() {
  const { connect } = useConnect();
  const { data: status } = useAgentStatus();

  // The vault the agent manages. MiniPay auto-connects the user's wallet for a
  // native feel and to make user-signed conversions a one-step upgrade later.
  const vaultAddress = status?.agentAddress ?? undefined;
  const { data: balances, isLoading: balancesLoading } = useBalances(vaultAddress);

  const [selected, setSelected] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("home");
  const [converting, setConverting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (isMiniPay()) connect({ connector: injected({ target: "metaMask" }) });
  }, [connect]);

  // Split holdings into dollars vs local money.
  const { dollarsUsd, local } = useMemo(() => {
    const entries = balances ? Object.values(balances.balances) : [];
    const dollars = entries.filter((b) => DOLLAR_SYMBOLS.includes(b.symbol));
    const locals = entries
      .filter((b) => !DOLLAR_SYMBOLS.includes(b.symbol) && parseFloat(b.formatted) > 0)
      .sort((a, b) => parseFloat(b.usd) - parseFloat(a.usd));
    const dollarsTotal = dollars.reduce((sum, b) => sum + parseFloat(b.usd || "0"), 0);
    return { dollarsUsd: dollarsTotal, local: locals };
  }, [balances]);

  // Default the conversion target to the largest local balance.
  useEffect(() => {
    if (!selected && local.length > 0) setSelected(local[0].symbol);
  }, [local, selected]);

  const selectedBalance: TokenBalance | undefined = useMemo(
    () => local.find((b) => b.symbol === selected),
    [local, selected]
  );

  const amount = selectedBalance ? parseFloat(selectedBalance.formatted) : 0;
  const { data: rates } = useRates(selected ?? "NGNm", "USDm", amount);
  const bestRate = rates?.best === "mento" ? rates?.mento : rates?.uniswap;
  const route = rates?.best === "mento" ? "Mento" : "Uniswap";
  const dollarsOut = bestRate
    ? (amount * bestRate.rate).toLocaleString("en", { maximumFractionDigits: 2 })
    : "—";

  async function handleConvert() {
    if (!selectedBalance || amount <= 0) return;
    setConverting(true);
    try {
      const res = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenIn: selectedBalance.symbol,
          tokenOut: "USDm",
          amountIn: selectedBalance.formatted,
          slippageBps: 100,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Conversion failed");
      }
      const result = (await res.json()) as { txHash: string };
      setTxHash(result.txHash);
      setStage("success");
    } catch (err) {
      toast.error("Couldn't convert", {
        description: err instanceof Error ? err.message : undefined,
      });
      setStage("home");
    } finally {
      setConverting(false);
    }
  }

  function reset() {
    setStage("home");
    setTxHash(null);
  }

  const active = status?.active ?? false;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[400px] flex-col bg-background px-5 pb-8 pt-5">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-tight">CVault</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            agent
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              active ? "bg-celo-green" : "bg-muted-foreground"
            )}
          >
            {active && (
              <motion.span
                className="block h-1.5 w-1.5 rounded-full bg-celo-green"
                animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              />
            )}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {active ? "Watching rates" : "Paused"}
          </span>
        </div>
      </header>

      {/* Dollar balance hero */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8"
      >
        <p className="text-xs text-muted-foreground">Your dollars</p>
        <div className="mt-1 flex items-end gap-1">
          <span className="text-4xl font-mono font-semibold tabular-nums tracking-tight">
            {balancesLoading ? (
              <span className="inline-block h-9 w-32 animate-pulse rounded bg-surface-nested align-middle" />
            ) : (
              `$${dollarsUsd.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </span>
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-celo-green" />
          Held in USDm · Network fee paid for you
        </p>
      </motion.section>

      <AnimatePresence mode="wait">
        {stage === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-8 flex flex-1 flex-col"
          >
            {/* Local money list */}
            <p className="text-xs text-muted-foreground">Local money</p>

            {local.length === 0 && !balancesLoading && (
              <div className="mt-3 rounded-xl border border-border bg-surface px-4 py-8 text-center">
                <Sparkles className="mx-auto h-5 w-5 text-celo-green" />
                <p className="mt-2 text-sm font-medium">All in dollars</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nothing to convert right now. Your agent keeps it dollar-safe.
                </p>
              </div>
            )}

            <div className="mt-3 space-y-2">
              {(balancesLoading ? Array.from({ length: 2 }) : local).map((b, i) => {
                if (balancesLoading || !b) {
                  return (
                    <div
                      key={i}
                      className="h-[58px] animate-pulse rounded-xl border border-border bg-surface"
                    />
                  );
                }
                const bal = b as TokenBalance;
                const meta = TOKENS[bal.symbol];
                const isSel = selected === bal.symbol;
                return (
                  <button
                    key={bal.symbol}
                    onClick={() => setSelected(bal.symbol)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                      isSel
                        ? "border-celo-green/40 bg-celo-green/5"
                        : "border-border bg-surface active:bg-surface-hover"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg leading-none">{meta?.flag ?? "🏳️"}</span>
                      <div>
                        <p className="text-sm font-medium">{meta?.name ?? bal.symbol}</p>
                        <p className="font-mono text-xs tabular-nums text-muted-foreground">
                          {parseFloat(bal.formatted).toLocaleString("en", {
                            maximumFractionDigits: 2,
                          })}{" "}
                          {bal.symbol}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-sm tabular-nums text-muted-foreground">
                      ${parseFloat(bal.usd || "0").toLocaleString("en", { minimumFractionDigits: 2 })}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Convert CTA */}
            {selectedBalance && (
              <div className="mt-auto pt-8">
                <div className="mb-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono tabular-nums">
                    {amount.toLocaleString("en", { maximumFractionDigits: 2 })} {selectedBalance.symbol}
                  </span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-mono tabular-nums text-foreground">~${dollarsOut}</span>
                  <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {route}
                  </span>
                </div>
                <button
                  onClick={() => setStage("confirm")}
                  className="w-full rounded-xl bg-celo-green py-4 text-base font-semibold text-zinc-950 transition-transform active:scale-[0.98]"
                >
                  Convert to dollars
                </button>
              </div>
            )}
          </motion.div>
        )}

        {stage === "confirm" && selectedBalance && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 flex flex-1 flex-col"
          >
            <p className="text-sm font-medium">Confirm</p>
            <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface text-sm">
              {[
                {
                  label: "Convert",
                  value: `${amount.toLocaleString("en", { maximumFractionDigits: 2 })} ${selectedBalance.symbol}`,
                },
                { label: "You get", value: `~$${dollarsOut} USDm` },
                { label: "Best rate via", value: route },
                { label: "Network fee", value: "Paid for you" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between px-4 py-3">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-mono tabular-nums">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto flex gap-3 pt-8">
              <button
                onClick={() => setStage("home")}
                className="flex-1 rounded-xl border border-border py-4 text-base font-medium text-foreground active:bg-surface-hover"
              >
                Back
              </button>
              <button
                onClick={handleConvert}
                disabled={converting}
                className="flex-[2] rounded-xl bg-celo-green py-4 text-base font-semibold text-zinc-950 transition-transform active:scale-[0.98] disabled:opacity-70"
              >
                {converting ? (
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                ) : (
                  "Convert now"
                )}
              </button>
            </div>
          </motion.div>
        )}

        {stage === "success" && selectedBalance && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mt-8 flex flex-1 flex-col items-center justify-center text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
            >
              <CheckCircle2 className="h-14 w-14 text-celo-green" />
            </motion.div>
            <p className="mt-4 text-lg font-semibold">Converted to dollars</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {amount.toLocaleString("en", { maximumFractionDigits: 2 })} {selectedBalance.symbol} → ~$
              {dollarsOut}
            </p>
            {txHash && (
              <a
                href={`https://celoscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 font-mono text-xs text-celo-green hover:underline"
              >
                {txHash.slice(0, 12)}…{txHash.slice(-6)} ↗
              </a>
            )}
            <button
              onClick={reset}
              className="mt-8 w-full rounded-xl border border-border py-4 text-base font-medium active:bg-surface-hover"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-6 text-center text-[10px] text-muted-foreground">
        Best rate across Mento &amp; Uniswap · Autonomous CVault agent
      </footer>
    </div>
  );
}
