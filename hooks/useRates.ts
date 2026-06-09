"use client";

import { useQuery } from "@tanstack/react-query";
import type { RatesResponse } from "@/types/swap";

async function fetchRates(tokenIn: string, tokenOut: string, amount: number): Promise<RatesResponse> {
  const res = await fetch(`/api/rates?tokenIn=${tokenIn}&tokenOut=${tokenOut}&amount=${amount}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<RatesResponse>;
}

export function useRates(
  tokenIn: string = "USDm",
  tokenOut: string = "NGNm",
  amount: number = 1
) {
  const query = useQuery({
    queryKey: ["rates", tokenIn, tokenOut, amount],
    queryFn: () => fetchRates(tokenIn, tokenOut, amount),
    staleTime: 12_000,
    refetchInterval: 15_000,
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
