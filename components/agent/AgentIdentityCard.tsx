"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { shortenAddress } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import { Bot, ExternalLink, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function AgentIdentityCard() {
  const { data: status, isLoading } = useAgentStatus();

  if (isLoading) {
    return <Skeleton className="h-36 rounded-lg" />;
  }

  const agentId = status?.agentId;
  const agentAddress = status?.agentAddress;
  const isRegistered = Boolean(agentId);

  const scanUrl = agentId
    ? `https://8004scan.io/agents/${agentId}`
    : "https://8004scan.io";

  return (
    <motion.div {...fadeUp}>
      <Card variant="fin" className={cn("relative overflow-hidden", isRegistered && "border-celo-green/30")}>
        {isRegistered && (
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-celo-green/50 to-transparent" />
        )}
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center border border-border">
                <Bot className="h-4 w-4 text-celo-green" />
              </div>
              <div>
                <div className="text-sm font-medium">CeloVault Agent</div>
                <div className="text-xs text-muted-foreground">ERC-8004 Identity</div>
              </div>
            </div>
            <Badge variant={isRegistered ? "success" : "outline"}>
              {isRegistered ? "Registered" : "Unregistered"}
            </Badge>
          </div>

          <div className="space-y-2 text-xs">
            {agentId && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Agent ID</span>
                <span className="font-mono text-foreground" data-slot="address">
                  #{agentId}
                </span>
              </div>
            )}
            {agentAddress && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Wallet</span>
                <span className="font-mono text-foreground" data-slot="address">
                  {shortenAddress(agentAddress)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Standard</span>
              <span className="text-foreground">ERC-8004 v1</span>
            </div>
          </div>

          {isRegistered && (
            <a
              href={scanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-1.5 text-xs text-celo-green hover:text-celo-green/80 transition-colors"
            >
              <Shield className="h-3 w-3" />
              View on 8004scan
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {!isRegistered && (
            <p className="mt-3 text-xs text-muted-foreground">
              Run{" "}
              <code className="font-mono bg-surface px-1 py-0.5 rounded text-foreground">
                pnpm agent:register
              </code>{" "}
              to register on Celo Sepolia.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
