import { NextRequest, NextResponse } from "next/server";
import { publicClient } from "@/lib/celo/client";
import { TOKENS } from "@/lib/celo/tokens";
import { formatAmount } from "@/lib/utils";
import { serverCache } from "@/lib/server-cache";
import type { BalancesResponse, TokenBalance } from "@/types/tokens";

const BALANCES_TTL = 20_000; // 20s — multicall is cheap, but no need to hammer the RPC

const ERC20_BALANCE_OF_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const address = req.nextUrl.searchParams.get("address");
  if (!address || !address.startsWith("0x")) {
    return NextResponse.json({ error: "Missing or invalid address" }, { status: 400 });
  }

  const walletAddress = address as `0x${string}`;
  const cacheKey = `balances:${walletAddress.toLowerCase()}`;

  try {
    const cached = serverCache.get<BalancesResponse>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Cache": "HIT", "Cache-Control": "public, max-age=20" },
      });
    }

    const tokenList = Object.values(TOKENS).filter((t) => t.priority !== "gas" || t.symbol === "USDC");

    const calls = tokenList.map((token) => ({
      address: token.address,
      abi: ERC20_BALANCE_OF_ABI,
      functionName: "balanceOf" as const,
      args: [walletAddress] as [`0x${string}`],
    }));

    const results = await publicClient.multicall({ contracts: calls });

    const balances: Record<string, TokenBalance> = {};
    let totalUsdCents = 0;

    tokenList.forEach((token, i) => {
      const result = results[i];
      const raw = result.status === "success" ? (result.result as bigint) : BigInt(0);
      const formatted = formatAmount(raw, token.decimals);
      // Simplified USD: USDm ≈ $1, NGNm ≈ $0.00062, KESm ≈ $0.0077, GHSm ≈ $0.066, EURm ≈ $1.08
      const usdRates: Record<string, number> = {
        USDm: 1, EURm: 1.08, NGNm: 0.00062, KESm: 0.0077, GHSm: 0.066, USDC: 1, USDT: 1,
      };
      const usdRate = usdRates[token.symbol] ?? 1;
      const formattedNum = parseFloat(formatted.replace(",", ""));
      const usdValue = (formattedNum * usdRate).toFixed(2);
      totalUsdCents += parseFloat(usdValue) * 100;

      balances[token.symbol] = {
        symbol: token.symbol,
        address: token.address,
        raw: raw.toString(),
        formatted,
        usd: usdValue,
        decimals: token.decimals,
      };
    });

    const response: BalancesResponse = {
      balances,
      totalUsd: (totalUsdCents / 100).toFixed(2),
      timestamp: Math.floor(Date.now() / 1000),
    };

    serverCache.set(cacheKey, response, BALANCES_TTL);
    return NextResponse.json(response, {
      headers: { "X-Cache": "MISS", "Cache-Control": "public, max-age=20" },
    });
  } catch (err) {
    console.error("[/api/balances]", err);
    return NextResponse.json({ error: "Failed to fetch balances" }, { status: 500 });
  }
}
