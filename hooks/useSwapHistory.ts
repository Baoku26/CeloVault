"use client";

import { useState, useEffect } from "react";
import { useAgentStatus } from "./useAgentStatus";
import type { SwapHistoryItem } from "@/types/swap";

const HISTORY_KEY = "celovault:swap-history";
const MAX_ITEMS = 100;

function loadHistory(): SwapHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as SwapHistoryItem[];
  } catch {
    return [];
  }
}

function saveHistory(items: SwapHistoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

export function useSwapHistory() {
  const { data: agentStatus } = useAgentStatus();
  const [history, setHistory] = useState<SwapHistoryItem[]>(loadHistory);

  useEffect(() => {
    const lastSwap = agentStatus?.lastSwap;
    if (!lastSwap) return;

    setHistory((prev) => {
      if (prev.some((h) => h.txHash === lastSwap.txHash)) return prev;

      // Normalise: both USDm and NGNm are 18 decimals
      const amountInHuman = parseFloat(lastSwap.amountIn) / 1e18;
      const amountOutHuman = parseFloat(lastSwap.amountOut) / 1e18;
      const rate = amountInHuman > 0 ? amountOutHuman / amountInHuman : 0;

      const item: SwapHistoryItem = {
        ...lastSwap,
        tokenIn: "USDm",
        tokenOut: "NGNm",
        rate: parseFloat(rate.toFixed(2)),
      };

      const updated = [item, ...prev].slice(0, MAX_ITEMS);
      saveHistory(updated);
      return updated;
    });
  }, [agentStatus?.lastSwap?.txHash]);

  return { history };
}
