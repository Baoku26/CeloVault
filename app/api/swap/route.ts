import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http } from "viem";
import { celo } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { getBestRate } from "@/lib/agent/router";
import { executeMentoSwap } from "@/lib/mento/swap";
import { executeUniswapSwap } from "@/lib/uniswap/swap";
import { TOKENS } from "@/lib/celo/tokens";
import type { SwapResult } from "@/types/swap";

interface SwapRequestBody {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;       // decimal string, e.g. "1.5"
  slippageBps?: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawKey = process.env.AGENT_PRIVATE_KEY;
  if (!rawKey) {
    return NextResponse.json({ error: "Agent wallet not configured" }, { status: 503 });
  }

  let body: SwapRequestBody;
  try {
    body = (await req.json()) as SwapRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { tokenIn: tokenInSymbol, tokenOut: tokenOutSymbol, amountIn: amountInStr, slippageBps = 100 } = body;

  const tokenIn = TOKENS[tokenInSymbol];
  const tokenOut = TOKENS[tokenOutSymbol];
  if (!tokenIn || !tokenOut) {
    return NextResponse.json({ error: "Unknown token symbol" }, { status: 400 });
  }

  const amountIn = BigInt(Math.floor(parseFloat(amountInStr) * 10 ** tokenIn.decimals));
  if (amountIn <= BigInt(0)) {
    return NextResponse.json({ error: "amountIn must be > 0" }, { status: 400 });
  }

  try {
    // Build agent wallet
    const privateKey = (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`;
    const account = privateKeyToAccount(privateKey);
    const walletClient = createWalletClient({
      account,
      chain: celo,
      transport: http(process.env.NEXT_PUBLIC_CELO_RPC ?? "https://forno.celo.org"),
    });

    // Get best route
    const rateResult = await getBestRate(
      tokenIn.address,
      tokenOut.address,
      amountIn,
      tokenIn.decimals,
      tokenOut.decimals
    );

    if (rateResult.rate === 0) {
      return NextResponse.json({ error: "No valid route found" }, { status: 503 });
    }

    const amountOutMin = rateResult.amountOut * BigInt(10000 - slippageBps) / BigInt(10000);

    let receipt;
    if (rateResult.best === "mento" && rateResult.mento) {
      receipt = await executeMentoSwap(walletClient, {
        exchangeProvider: rateResult.mento.exchangeProvider,
        exchangeId: rateResult.mento.exchangeId,
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amountIn,
        amountOutMin,
      });
    } else if (rateResult.uniswap) {
      receipt = await executeUniswapSwap(walletClient, {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        fee: rateResult.uniswap.fee,
        amountIn,
        amountOutMin,
      });
    } else {
      return NextResponse.json({ error: "No valid route found" }, { status: 503 });
    }

    const result: SwapResult = {
      txHash: receipt.txHash,
      amountIn: receipt.amountIn.toString(),
      amountOut: receipt.amountOut.toString(),
      source: rateResult.best,
      timestamp: Math.floor(Date.now() / 1000),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/swap]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Swap failed" },
      { status: 500 }
    );
  }
}
