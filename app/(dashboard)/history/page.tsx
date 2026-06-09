"use client";

import Link from "next/link";
import { useSwapHistory } from "@/hooks/useSwapHistory";
import { FXRateChart } from "@/components/charts/FXRateChart";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleString("en", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatAmount(raw: string, decimals = 18) {
  const human = parseFloat(raw) / 10 ** decimals;
  return human.toLocaleString("en", { maximumFractionDigits: 4 });
}

export default function HistoryPage() {
  const { history } = useSwapHistory();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Autonomous swaps executed by the agent.
        </p>
      </div>

      {/* Rate chart */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-muted-foreground mb-3">
          <span className="font-mono">USDm / NGNm</span> rate — last 50 readings
        </p>
        <FXRateChart tokenIn="USDm" tokenOut="NGNm" />
      </div>

      {/* Table */}
      {history.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface py-16 text-center">
          <p className="text-sm text-muted-foreground">No swaps recorded yet.</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto px-6">
            The agent executes swaps autonomously when the rate crosses your configured threshold.
            Each completed swap appears here with a Celo transaction receipt.
          </p>
          <Link
            href="/agent"
            className="inline-block mt-4 text-xs text-celo-green hover:underline"
          >
            Configure threshold
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-nested">
                  {["Date", "Pair", "Sent", "Received", "Rate", "Source", "Tx"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((item) => (
                  <tr key={item.txHash} className="hover:bg-surface-nested transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap font-mono">
                      {formatDate(item.timestamp)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs">
                        {item.tokenIn} → {item.tokenOut}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums whitespace-nowrap">
                      {formatAmount(item.amountIn)} {item.tokenIn}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums whitespace-nowrap">
                      {formatAmount(item.amountOut)} {item.tokenOut}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums whitespace-nowrap">
                      {item.rate.toLocaleString("en", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={item.source as "mento" | "uniswap-v3"}
                        className="text-[10px] px-1.5 h-4"
                      >
                        {item.source === "mento" ? "Mento" : "Uniswap"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://celoscan.io/tx/${item.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-celo-green transition-colors"
                      >
                        {item.txHash.slice(0, 8)}…
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
