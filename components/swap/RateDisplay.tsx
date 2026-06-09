"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRates } from "@/hooks/useRates";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp } from "lucide-react";

interface RateDisplayProps {
  tokenIn?: string;
  tokenOut?: string;
  amount?: number;
  className?: string;
}

export function RateDisplay({
  tokenIn = "USDm",
  tokenOut = "NGNm",
  amount = 1,
  className,
}: RateDisplayProps) {
  const { data, isLoading, error, refetch } = useRates(tokenIn, tokenOut, amount);

  if (isLoading && !data) {
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        Rate unavailable
      </div>
    );
  }

  const best = data?.best === "mento" ? data?.mento : data?.uniswap;
  const rate = best?.rate ?? 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-end gap-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={rate.toFixed(2)}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="text-3xl font-mono font-semibold tabular-nums text-foreground"
          >
            {rate > 0 ? rate.toLocaleString("en", { maximumFractionDigits: 2 }) : "—"}
          </motion.span>
        </AnimatePresence>
        <span className="text-sm text-muted-foreground mb-1">
          {tokenOut} per {tokenIn}
        </span>
        <button
          onClick={() => void refetch()}
          className="mb-1 ml-auto text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Refresh rate"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <SourceBadge source={data?.best ?? null} />
        {data?.spread != null && data.spread > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {data.spread.toFixed(2)}% spread
          </span>
        )}
      </div>

      {data?.mento && data?.uniswap && (
        <div className="flex gap-3 pt-0.5">
          <RatePill label="Mento" rate={data.mento.rate} active={data.best === "mento"} />
          <RatePill label="Uniswap V3" rate={data.uniswap.rate} active={data.best === "uniswap-v3"} />
        </div>
      )}
    </div>
  );
}

function SourceBadge({ source }: { source: "mento" | "uniswap-v3" | null }) {
  if (!source) return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] px-1.5 py-0 h-4 font-mono uppercase tracking-wider border",
        source === "mento"
          ? "border-celo-green/40 text-celo-green"
          : "border-blue-500/40 text-blue-400"
      )}
    >
      {source === "mento" ? "Mento" : "Uniswap V3"} ✓ best
    </Badge>
  );
}

function RatePill({
  label,
  rate,
  active,
}: {
  label: string;
  rate: number;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "text-xs font-mono px-2 py-0.5 rounded border",
        active
          ? "border-celo-green/30 bg-celo-green/5 text-celo-green"
          : "border-border text-muted-foreground"
      )}
    >
      {label}: {rate.toLocaleString("en", { maximumFractionDigits: 2 })}
    </div>
  );
}
