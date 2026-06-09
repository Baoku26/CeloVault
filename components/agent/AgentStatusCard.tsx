"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { cn } from "@/lib/utils";
import { Bot, Zap, Clock, TrendingUp } from "lucide-react";
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
    const agentApiUrl = process.env.NEXT_PUBLIC_AGENT_API_URL;
    if (!agentApiUrl) {
      toast.error("Agent not deployed", { description: "Set NEXT_PUBLIC_AGENT_API_URL to control the agent." });
      return;
    }
    setToggling(true);
    try {
      await fetch(`${agentApiUrl}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoExecute: next }),
      });
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
      className="rounded-xl border border-border bg-surface p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-2 h-2 rounded-full",
            active ? "bg-celo-green shadow-[0_0_6px_#35D07F]" : "bg-zinc-600"
          )} />
          <span className="text-sm font-medium">Agent</span>
          <Badge variant={active ? "success" : "outline"} className="text-[10px] px-1.5 h-4">
            {active ? "Active" : "Paused"}
          </Badge>
        </div>
        <Switch
          checked={active}
          onCheckedChange={handleToggle}
          disabled={toggling}
          aria-label="Toggle agent"
        />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat
          icon={<Zap className="h-3.5 w-3.5" />}
          label="Swaps"
          value={data?.totalSwaps?.toString() ?? "0"}
        />
        <Stat
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Score"
          value={data?.reputationScore ? `${data.reputationScore}/100` : "—"}
        />
        <Stat
          icon={<Clock className="h-3.5 w-3.5" />}
          label="Next run"
          value={data?.nextRun ? <Countdown nextRun={data.nextRun} /> : "—"}
        />
      </div>

      {data?.lastSwap && (
        <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Bot className="h-3 w-3" />
            Last swap
          </span>
          <a
            href={`https://celoscan.io/tx/${data.lastSwap.txHash}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono hover:text-foreground transition-colors"
          >
            {data.lastSwap.txHash.slice(0, 10)}…
          </a>
        </div>
      )}
    </motion.div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-lg bg-zinc-900/50 p-2">
      <div className="flex justify-center text-muted-foreground mb-1">{icon}</div>
      <div className="text-sm font-medium">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
