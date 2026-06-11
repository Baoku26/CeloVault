import { getMentoRate, type MentoRateQuote } from "@/lib/mento/rates";
import { getUniswapRate, type UniswapRateQuote } from "@/lib/uniswap/rates";

export interface BestRateResult {
  best: "mento" | "uniswap-v3";
  amountOut: bigint;
  rate: number;
  mento: MentoRateQuote | null;
  uniswap: UniswapRateQuote | null;
  spread: number;
}

export async function getBestRate(
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  amountIn: bigint,
  decimalsIn: number,
  decimalsOut: number
): Promise<BestRateResult> {
  const [mento, uniswap] = await Promise.allSettled([
    getMentoRate(tokenIn, tokenOut, amountIn, decimalsIn, decimalsOut),
    getUniswapRate(tokenIn, tokenOut, amountIn, decimalsIn, decimalsOut),
  ]);

  const mentoQuote = mento.status === "fulfilled" ? mento.value : null;
  const uniswapQuote = uniswap.status === "fulfilled" ? uniswap.value : null;

  const mentoRate = mentoQuote?.rate ?? 0;
  const uniswapRate = uniswapQuote?.rate ?? 0;

  const spread =
    mentoRate > 0 && uniswapRate > 0
      ? Math.abs(((mentoRate - uniswapRate) / Math.min(mentoRate, uniswapRate)) * 100)
      : 0;

  if (!mentoQuote && !uniswapQuote) {
    return { best: "mento", amountOut: BigInt(0), rate: 0, mento: null, uniswap: null, spread: 0 };
  }

  // Pick by rate, but never select a side whose quote is null — when only one
  // provider returns a quote (or a zero-rate tie at amountIn=0), use whichever exists.
  const useMento = mentoQuote != null && (uniswapQuote == null || mentoRate >= uniswapRate);
  const winner = useMento ? mentoQuote : uniswapQuote;

  return {
    best: useMento ? "mento" : "uniswap-v3",
    amountOut: winner!.amountOut,
    rate: winner!.rate,
    mento: mentoQuote,
    uniswap: uniswapQuote,
    spread: parseFloat(spread.toFixed(4)),
  };
}
