"use client";

import { useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useRates } from "@/hooks/useRates";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const HISTORY_KEY = "celovault:rate-history";
const MAX_POINTS = 50;

interface RatePoint {
  t: number;       // unix timestamp
  rate: number;
  source: "mento" | "uniswap-v3";
}

function loadHistory(key: string): RatePoint[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as RatePoint[];
  } catch {
    return [];
  }
}

function saveHistory(key: string, points: RatePoint[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(points.slice(-MAX_POINTS)));
}

interface FXRateChartProps {
  tokenIn?: string;
  tokenOut?: string;
  className?: string;
}

export function FXRateChart({
  tokenIn = "USDm",
  tokenOut = "NGNm",
  className,
}: FXRateChartProps) {
  const historyKey = `${HISTORY_KEY}:${tokenIn}-${tokenOut}`;
  const { data } = useRates(tokenIn, tokenOut, 1);
  const historyRef = useRef<RatePoint[]>(loadHistory(historyKey));

  useEffect(() => {
    if (!data) return;
    const best = data.best === "mento" ? data.mento : data.uniswap;
    if (!best || best.rate <= 0) return;

    const point: RatePoint = {
      t: data.timestamp,
      rate: parseFloat(best.rate.toFixed(2)),
      source: data.best,
    };

    const last = historyRef.current[historyRef.current.length - 1];
    if (last?.t === point.t) return;

    historyRef.current = [...historyRef.current, point].slice(-MAX_POINTS);
    saveHistory(historyKey, historyRef.current);
  }, [data, historyKey]);

  const points = historyRef.current;

  if (points.length < 2) {
    return (
      <div className={cn("flex items-center justify-center h-32", className)}>
        {points.length === 0 ? (
          <Skeleton className="w-full h-32 rounded-lg" />
        ) : (
          <p className="text-xs text-muted-foreground">Collecting rate history…</p>
        )}
      </div>
    );
  }

  const rates = points.map((p) => p.rate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
  const padding = (maxRate - minRate) * 0.1 || avgRate * 0.005;

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <XAxis dataKey="t" hide />
          <YAxis
            domain={[minRate - padding, maxRate + padding]}
            tick={{ fontSize: 10, fill: "#71717a" }}
            width={52}
            tickFormatter={(v: number) => v.toLocaleString("en", { maximumFractionDigits: 0 })}
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 6,
              fontSize: 11,
            }}
            labelFormatter={(t: number) =>
              new Date(t * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            }
            formatter={(v: number) => [v.toLocaleString("en", { maximumFractionDigits: 2 }), `${tokenOut}/${tokenIn}`]}
          />
          <ReferenceLine
            y={avgRate}
            stroke="#3f3f46"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="#35D07F"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: "#35D07F" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
