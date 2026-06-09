import { publicClient } from "@/lib/celo/client";
import { MENTO_BROKER } from "@/lib/celo/contracts";

const BROKER_ABI = [
  {
    name: "getExchangeProviders",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    name: "getAmountOut",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "exchangeProvider", type: "address" },
      { name: "exchangeId", type: "bytes32" },
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "amountIn", type: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

const BIPOOL_ABI = [
  {
    name: "getExchanges",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "exchanges",
        type: "tuple[]",
        components: [
          { name: "exchangeId", type: "bytes32" },
          { name: "assets", type: "address[]" },
        ],
      },
    ],
  },
] as const;

export interface MentoRateQuote {
  amountOut: bigint;
  rate: number;
  source: "mento";
  exchangeProvider: `0x${string}`;
  exchangeId: `0x${string}`;
}

export async function getMentoRate(
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  amountIn: bigint,
  decimalsIn: number,
  decimalsOut: number
): Promise<MentoRateQuote | null> {
  try {
    const providers = (await publicClient.readContract({
      address: MENTO_BROKER,
      abi: BROKER_ABI,
      functionName: "getExchangeProviders",
    })) as `0x${string}`[];

    const tokenInLower = tokenIn.toLowerCase();
    const tokenOutLower = tokenOut.toLowerCase();

    for (const provider of providers) {
      try {
        const exchanges = (await publicClient.readContract({
          address: provider,
          abi: BIPOOL_ABI,
          functionName: "getExchanges",
        })) as { exchangeId: `0x${string}`; assets: `0x${string}`[] }[];

        const match = exchanges.find(
          (e) =>
            e.assets.some((a) => a.toLowerCase() === tokenInLower) &&
            e.assets.some((a) => a.toLowerCase() === tokenOutLower)
        );

        if (!match) {
          console.log(`[mento] provider ${provider}: no pool for ${tokenIn}/${tokenOut} (${exchanges.length} pools scanned)`);
          continue;
        }

        const amountOut = (await publicClient.readContract({
          address: MENTO_BROKER,
          abi: BROKER_ABI,
          functionName: "getAmountOut",
          args: [provider, match.exchangeId, tokenIn, tokenOut, amountIn],
        })) as bigint;

        const humanIn = Number(amountIn) / 10 ** decimalsIn;
        const humanOut = Number(amountOut) / 10 ** decimalsOut;
        const rate = humanOut / humanIn;

        return {
          amountOut,
          rate,
          source: "mento",
          exchangeProvider: provider,
          exchangeId: match.exchangeId,
        };
      } catch (err) {
        // This provider uses a different interface — skip it
        console.log(`[mento] provider ${provider}: getExchanges failed — ${(err as Error).message}`);
        continue;
      }
    }

    return null;
  } catch {
    return null;
  }
}
