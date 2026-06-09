"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";
import { toast } from "sonner";

function Countdown({ nextRun }: { nextRun: number }) {
  const [secs, setSecs] = useState(Math.max(0, nextRun - Math.floor(Date.now() / 1000)));

  useEffect(() => {
    const id = setInterval(() => {
      setSecs(Math.max(0, nextRun - Math.floor(Date.now() / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [nextRun]);

  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return <span className="font-mono tabular-nums">{m}:{s}</span>;
}

export function AgentStatusCard() {
  const { data, isLoading, refetch } = useAgentStatus();
  const [toggling, setToggling] = useState(false);

  async function handleToggle(next: boolean) {
    setToggling(true);
    try {
      const res = await fetch("/api/agent/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next, autoExecute: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      await refetch();
      toast.success(next ? "Agent activated" : "Agent paused");
    } catch {
      toast.error("Failed to update agent");
    } finally {
      setToggling(false);
    }
  }

  if (isLoading && !data) {
    return <Skeleton className="h-[120px] rounded-xl" />;
  }

  const active = data?.active ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-border bg-surface p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-2 h-2 rounded-full shrink-0",
            active ? "bg-celo-green shadow-[0_0_6px_#35D07F]" : "bg-zinc-600"
          )} />
          <span className="text-sm font-medium">Agent</span>
          <Badge variant={active ? "success" : "outline"}>
            {active ? "ACTIVE" : "PAUSED"}
          </Badge>
        </div>
        <Switch
          checked={active}
          onCheckedChange={handleToggle}
          disabled={toggling}
          aria-label="Toggle agent"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="SWAPS" value={data?.totalSwaps?.toString() ?? "0"} />
        <StatTile
          label="SCORE"
          value={data?.reputationScore ? `${data.reputationScore}/100` : "—"}
        />
        <StatTile
          label="NEXT RUN"
          value={data?.nextRun ? <Countdown nextRun={data.nextRun} /> : "—"}
        />
      </div>

      {data?.lastSwap && (
        <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Bot className="h-3 w-3" />
            Last swap
          </span>
          <a
            href={`https://celoscan.io/tx/${data.lastSwap.txHash}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono hover:text-foreground transition-colors"
            data-slot="address"
          >
            {data.lastSwap.txHash.slice(0, 10)}…
          </a>
        </div>
      )}
    </motion.div>
  );
}

function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-surface-nested p-2.5 text-center">
      <div className="text-sm font-mono font-medium tabular-nums text-foreground">{value}</div>
      <div className="text-xs font-mono text-muted-foreground tracking-[0.04em] mt-1 uppercase">{label}</div>
    </div>
  );
}
