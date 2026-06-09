import { AgentStatusCard } from "@/components/agent/AgentStatusCard";
import { AgentConfigForm } from "@/components/agent/AgentConfigForm";
import { AgentIdentityCard } from "@/components/agent/AgentIdentityCard";
import { ReputationBadge } from "@/components/agent/ReputationBadge";

export default function AgentPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Agent</h1>
        <p className="text-sm text-muted-foreground mt-1">
          ERC-8004 onchain identity · autonomous swap configuration.
        </p>
      </div>

      {/* Status */}
      <AgentStatusCard />

      {/* Identity + Reputation */}
      <div className="grid gap-4 sm:grid-cols-2">
        <AgentIdentityCard />
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-medium mb-3">Reputation</p>
          <ReputationBadge />
          <p className="text-xs text-muted-foreground mt-3">
            Score updates after each swap. Feedback submitted to ERC-8004 Reputation Registry.
          </p>
        </div>
      </div>

      {/* Config */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-sm font-medium mb-5">Configuration</p>
        <AgentConfigForm />
      </div>
    </div>
  );
}
