import { NextRequest, NextResponse } from "next/server";
import { getBestRate } from "@/lib/agent/router";
import { TOKENS } from "@/lib/celo/tokens";
import { serverCache } from "@/lib/server-cache";
import type { RatesResponse } from "@/types/swap";

const RATES_TTL = 12_000; // 12s — Mento + Uniswap RPC calls are expensive

export async function GET(req: NextRequest): Promise<NextResponse> {
  const tokenInSymbol = req.nextUrl.searchParams.get("tokenIn") ?? "USDm";
  const tokenOutSymbol = req.nextUrl.searchParams.get("tokenOut") ?? "NGNm";
  const amount = parseFloat(req.nextUrl.searchParams.get("amount") ?? "1");

  const tokenIn = TOKENS[tokenInSymbol];
  const tokenOut = TOKENS[tokenOutSymbol];

  if (!tokenIn || !tokenOut) {
    return NextResponse.json({ error: "Unknown token symbol" }, { status: 400 });
  }

  const amountIn = BigInt(Math.floor(amount * 10 ** tokenIn.decimals));
  const cacheKey = `rates:${tokenInSymbol}-${tokenOutSymbol}:${amount}`;

  try {
    const cached = serverCache.get<RatesResponse>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Cache": "HIT", "Cache-Control": `public, max-age=12` },
      });
    }

    const result = await getBestRate(
      tokenIn.address,
      tokenOut.address,
      amountIn,
      tokenIn.decimals,
      tokenOut.decimals
    );

    const response: RatesResponse = {
      mento: result.mento
        ? {
            rate: result.mento.rate,
            amountOut: result.mento.amountOut.toString(),
            source: "mento",
            gas: "0.0001",
          }
        : null,
      uniswap: result.uniswap
        ? {
            rate: result.uniswap.rate,
            amountOut: result.uniswap.amountOut.toString(),
            source: "uniswap-v3",
            gas: "0.0002",
          }
        : null,
      best: result.best,
      spread: result.spread,
      timestamp: Math.floor(Date.now() / 1000),
    };

    serverCache.set(cacheKey, response, RATES_TTL);
    return NextResponse.json(response, {
      headers: { "X-Cache": "MISS", "Cache-Control": "public, max-age=12" },
    });
  } catch (err) {
    console.error("[/api/rates]", err);
    return NextResponse.json({ error: "Rate query failed" }, { status: 500 });
  }
}
