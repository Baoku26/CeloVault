"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import type { TokenBalance } from "@/types/tokens";

const TOKEN_META: Record<string, { flag: string; color: string }> = {
  USDm: { flag: "🇺🇸", color: "text-emerald-400" },
  NGNm: { flag: "🇳🇬", color: "text-green-400" },
  KESm: { flag: "🇰🇪", color: "text-green-500" },
  GHSm: { flag: "🇬🇭", color: "text-yellow-400" },
  EURm: { flag: "🇪🇺", color: "text-blue-400" },
  USDC: { flag: "🔵", color: "text-blue-500" },
  USDT: { flag: "🟢", color: "text-teal-400" },
};

interface BalanceCardProps {
  token: TokenBalance;
  className?: string;
}

export function BalanceCard({ token, className }: BalanceCardProps) {
  const meta = TOKEN_META[token.symbol] ?? { flag: "●", color: "text-muted-foreground" };
  const hasBalance = parseFloat(token.formatted.replace(/,/g, "")) > 0;

  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        "group rounded-xl border border-border bg-surface p-4",
        "hover:border-zinc-700 hover:bg-zinc-900/60 transition-all duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{meta.flag}</span>
          <span className={cn("text-xs font-mono font-semibold uppercase tracking-wider", meta.color)}>
            {token.symbol}
          </span>
        </div>
        {!hasBalance && (
          <span className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wider">
            empty
          </span>
        )}
      </div>

      <div
        className={cn(
          "text-2xl font-mono font-medium tracking-tight tabular-nums",
          hasBalance ? "text-foreground" : "text-muted-foreground/40"
        )}
        data-slot="amount"
      >
        {token.formatted}
      </div>

      <div className="mt-1 text-xs font-mono text-muted-foreground tabular-nums">
        {hasBalance ? `≈ $${token.usd}` : "—"}
      </div>
    </motion.div>
  );
}
