"use client";

import { useQuery } from "@tanstack/react-query";
import type { AgentStatus } from "@/types/agent";

async function fetchAgentStatus(): Promise<AgentStatus> {
  const res = await fetch("/api/agent/status");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<AgentStatus>;
}

export function useAgentStatus() {
  const query = useQuery({
    queryKey: ["agent-status"],
    queryFn: fetchAgentStatus,
    staleTime: 8_000,
    refetchInterval: 12_000,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isPending,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
