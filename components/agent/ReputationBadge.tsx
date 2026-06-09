"use client";

import { cn } from "@/lib/utils";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { Star } from "lucide-react";

interface ReputationBadgeProps {
  className?: string;
}

export function ReputationBadge({ className }: ReputationBadgeProps) {
  const { data: status } = useAgentStatus();

  const score = status?.reputationScore ?? 0;
  const totalSwaps = status?.totalSwaps ?? 0;

  function scoreColor(s: number): string {
    if (s >= 80) return "text-celo-green";
    if (s >= 60) return "text-celo-gold";
    return "text-muted-foreground";
  }

  if (!status?.agentId) return null;

  return (
    <div className={cn("flex items-center gap-1.5 text-xs", className)}>
      <Star className={cn("h-3 w-3 fill-current", scoreColor(score))} />
      <span className={cn("font-mono font-medium tabular-nums", scoreColor(score))}>
        {score > 0 ? score.toFixed(1) : "—"}
      </span>
      <span className="text-muted-foreground">
        {totalSwaps > 0 ? `(${totalSwaps} swaps)` : "no swaps yet"}
      </span>
    </div>
  );
}
