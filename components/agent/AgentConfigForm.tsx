"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const INTERVALS = [
  { label: "30s",  value: 30_000 },
  { label: "1m",   value: 60_000 },
  { label: "2m",   value: 120_000 },
  { label: "5m",   value: 300_000 },
];

export function AgentConfigForm() {
  const { data, refetch } = useAgentStatus();

  const [targetRate, setTargetRate] = useState<string>(
    String(data?.config?.targetRate ?? 1600)
  );
  const [autoExecute, setAutoExecute] = useState<boolean>(
    data?.config?.autoExecute ?? false
  );
  const [slippageBps, setSlippageBps] = useState<string>(
    String(data?.config?.slippageBps ?? 100)
  );
  const [intervalMs, setIntervalMs] = useState<number>(
    data?.config?.intervalMs ?? 60_000
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/agent/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRate: parseFloat(targetRate),
          autoExecute,
          slippageBps: parseInt(slippageBps),
          intervalMs,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      await refetch();
      toast.success("Config saved");
    } catch {
      toast.error("Failed to save config");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Field id="target-rate" label="Target Rate" hint="Minimum NGNm per USDm before the agent swaps">
        <div className="flex items-center gap-2">
          <input
            id="target-rate"
            type="number"
            value={targetRate}
            onChange={(e) => setTargetRate(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-nested px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="1600"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">NGNm / USDm</span>
        </div>
      </Field>

      <Field id="slippage" label="Slippage Tolerance" hint="Basis points — 100 = 1%">
        <div className="flex items-center gap-2">
          <input
            id="slippage"
            type="number"
            value={slippageBps}
            onChange={(e) => setSlippageBps(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-nested px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="100"
          />
          <span className="text-xs text-muted-foreground font-mono">{(parseInt(slippageBps) / 100).toFixed(1)}%</span>
        </div>
      </Field>

      <Field id="interval" label="Check Interval" hint="How often the agent evaluates rates">
        <div className="flex gap-2" role="group" aria-label="Check interval">
          {INTERVALS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setIntervalMs(opt.value)}
              aria-pressed={intervalMs === opt.value}
              className={cn(
                "flex-1 rounded-lg border py-1.5 text-xs font-mono transition-colors",
                intervalMs === opt.value
                  ? "border-celo-green/50 bg-celo-green/10 text-celo-green"
                  : "border-border text-muted-foreground hover:border-border-strong"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>

      <div className="flex items-center justify-between py-1">
        <div>
          <p className="text-sm font-medium">Auto-Execute</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Agent executes swaps automatically when threshold is met
          </p>
        </div>
        <Switch
          checked={autoExecute}
          onCheckedChange={setAutoExecute}
          aria-label="Auto-execute toggle"
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-celo-green text-zinc-950 hover:bg-celo-green/90 font-medium"
      >
        {saving ? "Saving…" : "Save Configuration"}
      </Button>
    </div>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div>
        <label htmlFor={id} className="text-sm font-medium cursor-pointer">{label}</label>
        <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
      </div>
      {children}
    </div>
  );
}
