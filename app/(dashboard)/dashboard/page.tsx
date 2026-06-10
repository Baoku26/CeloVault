"use client";

import { useAccount } from "wagmi";
import { useBalances } from "@/hooks/useBalances";
import { useRates } from "@/hooks/useRates";
import { BalanceGrid } from "@/components/wallet/BalanceGrid";
import { AgentStatusCard } from "@/components/agent/AgentStatusCard";
import { RateDisplay } from "@/components/swap/RateDisplay";
import { FXRateChart } from "@/components/charts/FXRateChart";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { address } = useAccount();
  const { data: balances, isLoading: balancesLoading } = useBalances(address);
  const { data: rates } = useRates("USDm", "NGNm", 1);

  return (
    <div className="space-y-8 max-w-4xl">
      <motion.div variants={fadeUp} initial="initial" animate="animate">
        <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {address ? "Live balances · Celo Mainnet" : "Connect wallet to see balances."}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AgentStatusCard />

        <motion.div
          variants={fadeUp} initial="initial" animate="animate"
          className="rounded-xl border border-border bg-surface p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            <span><span className="font-mono">USDm / NGNm</span> live rate</span>
          </div>
          <RateDisplay tokenIn="USDm" tokenOut="NGNm" amount={1} />
          <FXRateChart tokenIn="USDm" tokenOut="NGNm" />
        </motion.div>
      </div>

      <section className="space-y-3">
        {!address && (
          <div className="rounded-xl border border-border bg-surface py-12 text-center text-sm text-muted-foreground">
            Connect your wallet to view balances.
          </div>
        )}
        {address && <BalanceGrid data={balances} isLoading={balancesLoading} />}
        {balances && (
          <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground pt-1">
            <span>Total portfolio</span>
            <span className="font-mono text-foreground font-medium tabular-nums" data-slot="amount">
              ${balances.totalUsd}
            </span>
            {rates?.mento && (
              <span className="text-xs font-mono text-muted-foreground tabular-nums">
                · <span className="font-mono">1 USDm = {rates.mento.rate.toLocaleString("en", { maximumFractionDigits: 0 })} NGNm</span>
              </span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
