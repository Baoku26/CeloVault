"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RateDisplay } from "./RateDisplay";
import { useRates } from "@/hooks/useRates";
import { cn } from "@/lib/utils";
import { ArrowDown, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const PAIRS = [
  { tokenIn: "USDm", tokenOut: "NGNm", label: "NGN" },
  { tokenIn: "USDm", tokenOut: "KESm", label: "KES" },
  { tokenIn: "USDm", tokenOut: "GHSm", label: "GHS" },
  { tokenIn: "USDm", tokenOut: "EURm", label: "EUR" },
] as const;

type Stage = "input" | "confirm" | "success";

export function SwapCard() {
  const [pairIdx, setPairIdx] = useState(0);
  const [amount, setAmount] = useState("1");
  const [stage, setStage] = useState<Stage>("input");
  const [swapping, setSwapping] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const pair = PAIRS[pairIdx];
  const amountNum = parseFloat(amount) || 0;
  const { data: rates } = useRates(pair.tokenIn, pair.tokenOut, amountNum);

  const bestRate = rates?.best === "mento" ? rates?.mento : rates?.uniswap;
  const amountOut = bestRate
    ? (amountNum * bestRate.rate).toLocaleString("en", { maximumFractionDigits: 2 })
    : "—";

  async function handleSwap() {
    if (amountNum <= 0) {
      toast.error("Enter an amount");
      return;
    }
    setSwapping(true);
    try {
      const res = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenIn: pair.tokenIn,
          tokenOut: pair.tokenOut,
          amountIn: amount,
          slippageBps: 100,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error: string };
        throw new Error(err.error ?? "Swap failed");
      }

      const result = (await res.json()) as { txHash: string };
      setTxHash(result.txHash);
      setStage("success");
    } catch (err) {
      toast.error("Swap failed", { description: err instanceof Error ? err.message : undefined });
      setStage("input");
    } finally {
      setSwapping(false);
    }
  }

  function reset() {
    setStage("input");
    setAmount("1");
    setTxHash(null);
  }

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Pair selector */}
      <div className="flex border-b border-border">
        {PAIRS.map((p, i) => (
          <button
            key={p.tokenOut}
            onClick={() => { setPairIdx(i); setStage("input"); }}
            className={cn(
              "flex-1 py-2.5 text-xs font-mono font-semibold uppercase tracking-wider transition-colors",
              pairIdx === i
                ? "bg-celo-green/10 text-celo-green border-b-2 border-celo-green"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        <AnimatePresence mode="wait">
          {stage === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* You send */}
              <div className="rounded-lg border border-border bg-zinc-900/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">You send</span>
                  <Badge variant="USDm">USDm</Badge>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent text-2xl font-mono font-medium tabular-nums text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0.00"
                  min="0"
                />
              </div>

              <div className="flex justify-center">
                <div className="rounded-full border border-border bg-background p-1.5">
                  <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              {/* You receive */}
              <div className="rounded-lg border border-border bg-zinc-900/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">You receive</span>
                  <Badge variant={pair.tokenOut as keyof object}>{pair.tokenOut}</Badge>
                </div>
                <div className="text-2xl font-mono font-medium tabular-nums text-foreground">
                  {amountOut}
                </div>
              </div>

              <RateDisplay
                tokenIn={pair.tokenIn}
                tokenOut={pair.tokenOut}
                amount={amountNum}
                className="pt-1"
              />

              <Button
                onClick={() => amountNum > 0 && setStage("confirm")}
                disabled={amountNum <= 0}
                className="w-full bg-celo-green text-zinc-950 hover:bg-celo-green/90 font-semibold h-11"
              >
                Review Swap
              </Button>
            </motion.div>
          )}

          {stage === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Confirm swap</p>

              <div className="rounded-lg border border-border divide-y divide-border text-sm">
                {[
                  { label: "You send",    value: `${amount} ${pair.tokenIn}` },
                  { label: "You receive", value: `~${amountOut} ${pair.tokenOut}` },
                  { label: "Rate",        value: bestRate ? `1 ${pair.tokenIn} = ${bestRate.rate.toLocaleString("en", { maximumFractionDigits: 2 })} ${pair.tokenOut}` : "—" },
                  { label: "Route",       value: rates?.best === "mento" ? "Mento Protocol" : "Uniswap V3" },
                  { label: "Slippage",    value: "1%" },
                  { label: "Gas",         value: "Paid in USDC" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between px-4 py-2.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono text-right">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStage("input")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSwap}
                  disabled={swapping}
                  className="flex-1 bg-celo-green text-zinc-950 hover:bg-celo-green/90 font-semibold"
                >
                  {swapping ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Swap"}
                </Button>
              </div>
            </motion.div>
          )}

          {stage === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="space-y-4 text-center py-2"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                className="flex justify-center"
              >
                <CheckCircle2 className="h-12 w-12 text-celo-green" />
              </motion.div>

              <div>
                <p className="text-base font-semibold">Swap executed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {amount} {pair.tokenIn} → ~{amountOut} {pair.tokenOut}
                </p>
              </div>

              {txHash && (
                <a
                  href={`https://celoscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-xs font-mono text-celo-green hover:underline"
                >
                  {txHash.slice(0, 16)}…{txHash.slice(-8)} ↗
                </a>
              )}

              <Button variant="outline" onClick={reset} className="w-full">
                New Swap
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
