"use client";

import { motion } from "framer-motion";
import { staggerChildren } from "@/lib/motion";
import { BalanceCard } from "./BalanceCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { BalancesResponse } from "@/types/tokens";

interface BalanceGridProps {
  data: BalancesResponse | null;
  isLoading: boolean;
}

export function BalanceGrid({ data, isLoading }: BalanceGridProps) {
  if (isLoading && !data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const tokens = Object.values(data.balances);

  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-3 gap-3"
      variants={staggerChildren}
      initial="initial"
      animate="animate"
    >
      {tokens.map((token) => (
        <BalanceCard key={token.symbol} token={token} />
      ))}
    </motion.div>
  );
}
