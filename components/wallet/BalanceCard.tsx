"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import type { TokenBalance } from "@/types/tokens";

const TOKEN_META: Record<string, { flag: string }> = {
  USDm: { flag: "🇺🇸" },
  NGNm: { flag: "🇳🇬" },
  KESm: { flag: "🇰🇪" },
  GHSm: { flag: "🇬🇭" },
  EURm: { flag: "🇪🇺" },
  USDC: { flag: "🔵" },
  USDT: { flag: "🟢" },
};

interface BalanceCardProps {
  token: TokenBalance;
  className?: string;
}

export function BalanceCard({ token, className }: BalanceCardProps) {
  const meta = TOKEN_META[token.symbol] ?? { flag: "●" };
  const hasBalance = parseFloat(token.formatted.replace(/,/g, "")) > 0;

  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        "group rounded-xl border border-border bg-surface p-4",
        "hover:border-border-strong transition-colors duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{meta.flag}</span>
          <span className="text-xs font-mono font-medium tracking-[0.04em] text-muted-foreground uppercase">
            {token.symbol}
          </span>
        </div>
        {!hasBalance && (
          <span className="text-xs font-mono text-muted-foreground">empty</span>
        )}
      </div>

      <div
        className={cn(
          "text-2xl font-mono font-medium tracking-tight tabular-nums",
          hasBalance ? "text-foreground" : "text-muted-foreground"
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
