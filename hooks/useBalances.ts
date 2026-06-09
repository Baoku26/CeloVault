"use client";

import { useQuery } from "@tanstack/react-query";
import type { BalancesResponse } from "@/types/tokens";

async function fetchBalances(address: string): Promise<BalancesResponse> {
  const res = await fetch(`/api/balances?address=${address}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<BalancesResponse>;
}

export function useBalances(address: `0x${string}` | undefined) {
  const query = useQuery({
    queryKey: ["balances", address],
    queryFn: () => fetchBalances(address!),
    enabled: !!address,
    staleTime: 20_000,
    refetchInterval: 30_000,
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
