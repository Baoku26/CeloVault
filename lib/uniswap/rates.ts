import { publicClient } from "@/lib/celo/client";
import { UNISWAP_QUOTER_V2 } from "@/lib/celo/contracts";

// QuoterV2 quoteExactInputSingle is nonpayable (uses transient state) — must use simulateContract
const QUOTER_V2_ABI = [
  {
    name: "quoteExactInputSingle",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "fee", type: "uint24" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "sqrtPriceX96After", type: "uint160" },
      { name: "initializedTicksCrossed", type: "uint32" },
      { name: "gasEstimate", type: "uint256" },
    ],
  },
] as const;

// Try in order of likelihood for Mento stablecoin pairs on Celo
const FEE_TIERS = [500, 3000, 10000] as const;

export interface UniswapRateQuote {
  amountOut: bigint;
  rate: number;
  source: "uniswap-v3";
  fee: number;
}

export async function getUniswapRate(
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  amountIn: bigint,
  decimalsIn: number,
  decimalsOut: number
): Promise<UniswapRateQuote | null> {
  for (const fee of FEE_TIERS) {
    try {
      const { result } = await publicClient.simulateContract({
        address: UNISWAP_QUOTER_V2,
        abi: QUOTER_V2_ABI,
        functionName: "quoteExactInputSingle",
        args: [
          {
            tokenIn,
            tokenOut,
            amountIn,
            fee,
            sqrtPriceLimitX96: BigInt(0),
          },
        ],
      });

      const [amountOut] = result as [bigint, bigint, number, bigint];

      if (amountOut === BigInt(0)) continue;

      const humanIn = Number(amountIn) / 10 ** decimalsIn;
      const humanOut = Number(amountOut) / 10 ** decimalsOut;
      const rate = humanOut / humanIn;

      return { amountOut, rate, source: "uniswap-v3", fee };
    } catch {
      continue;
    }
  }

  return null;
}
