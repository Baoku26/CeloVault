"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type TickState = "idle" | "scanning" | "found" | "executing" | "done";

const SEQUENCE: { state: TickState; duration: number; log: string }[] = [
  { state: "idle",      duration: 800,  log: "> agent:tick  interval=60s" },
  { state: "scanning",  duration: 1200, log: "> querying Mento + Uniswap V3..." },
  { state: "found",     duration: 1000, log: "> best_rate=1,634.20  source=mento  spread=0.12%" },
  { state: "executing", duration: 1400, log: "> threshold=1,600 ✓  executing swap..." },
  { state: "done",      duration: 2000, log: "> swap:executed  10 USDm → 16,342 NGNm  gas=$0.0004" },
];

function StatusDot({ state }: { state: TickState }) {
  const active = state === "executing" || state === "done";
  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full shrink-0 transition-colors",
        active
          ? "bg-celo-green shadow-[0_0_6px_#35D07F]"
          : state === "scanning" || state === "found"
          ? "bg-celo-gold"
          : "bg-border"
      )}
    />
  );
}

export function AgentTickDemo() {
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([SEQUENCE[0].log]);

  useEffect(() => {
    let cancelled = false;

    async function runLoop() {
      while (!cancelled) {
        for (let i = 0; i < SEQUENCE.length; i++) {
          if (cancelled) return;
          setStep(i);
          setLogs((prev) => {
            const next = [...prev, SEQUENCE[i].log];
            return next.slice(-5);
          });
          await new Promise((r) => setTimeout(r, SEQUENCE[i].duration));
        }
        // pause before restarting
        await new Promise((r) => setTimeout(r, 1200));
        setLogs([]);
      }
    }

    void runLoop();
    return () => { cancelled = true; };
  }, []);

  const current = SEQUENCE[step];

  return (
    <div className="rounded-xl border border-border bg-surface font-mono text-xs overflow-hidden w-full max-w-md">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface-nested">
        <StatusDot state={current.state} />
        <span className="text-muted-foreground text-[11px]">cvault · agent process</span>
        <span className="ml-auto text-[11px] text-muted-foreground">Celo Mainnet</span>
      </div>

      {/* Log lines */}
      <div className="p-4 space-y-2 min-h-[120px]">
        <AnimatePresence mode="popLayout">
          {logs.map((line, i) => (
            <motion.div
              key={line + i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: i === logs.length - 1 ? 1 : 0.4, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "leading-relaxed",
                i === logs.length - 1 ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {line}
            </motion.div>
          ))}
        </AnimatePresence>

        {current.state === "executing" && (
          <motion.span
            className="inline-block w-1.5 h-3.5 bg-celo-green align-middle"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </div>

      {/* Status footer */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
        <span>agentId #9226</span>
        <span className="tabular-nums">
          {current.state === "done"
            ? <span className="text-celo-green">✓ swap complete</span>
            : current.state === "executing"
            ? <span className="text-celo-gold">executing…</span>
            : "monitoring…"}
        </span>
      </div>
    </div>
  );
}
