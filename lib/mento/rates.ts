import { publicClient } from "@/lib/celo/client";
import { MENTO_BROKER, CELO_TOKEN } from "@/lib/celo/contracts";

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

type Exchange = { exchangeId: `0x${string}`; assets: `0x${string}`[] };
type ProviderExchanges = { provider: `0x${string}`; exchanges: Exchange[] };

async function getAllExchanges(): Promise<ProviderExchanges[]> {
  const providers = (await publicClient.readContract({
    address: MENTO_BROKER,
    abi: BROKER_ABI,
    functionName: "getExchangeProviders",
  })) as `0x${string}`[];

  const results = await Promise.allSettled(
    providers.map(async (provider) => {
      const exchanges = (await publicClient.readContract({
        address: provider,
        abi: BIPOOL_ABI,
        functionName: "getExchanges",
      })) as Exchange[];
      return { provider, exchanges };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<ProviderExchanges> => r.status === "fulfilled")
    .map((r) => r.value);
}

function findDirectPool(
  providerExchanges: ProviderExchanges[],
  tokenA: string,
  tokenB: string
): { provider: `0x${string}`; exchange: Exchange } | null {
  for (const { provider, exchanges } of providerExchanges) {
    const match = exchanges.find(
      (e) =>
        e.assets.some((a) => a.toLowerCase() === tokenA) &&
        e.assets.some((a) => a.toLowerCase() === tokenB)
    );
    if (match) return { provider, exchange: match };
  }
  return null;
}

export async function getMentoRate(
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  amountIn: bigint,
  decimalsIn: number,
  decimalsOut: number
): Promise<MentoRateQuote | null> {
  try {
    const allExchanges = await getAllExchanges();

    const tokenInLower = tokenIn.toLowerCase();
    const tokenOutLower = tokenOut.toLowerCase();
    const celoLower = CELO_TOKEN.toLowerCase();

    // 1. Try direct pool first — fall through on oracle failure ("no valid median" etc.)
    const direct = findDirectPool(allExchanges, tokenInLower, tokenOutLower);

    if (direct) {
      try {
        const amountOut = (await publicClient.readContract({
          address: MENTO_BROKER,
          abi: BROKER_ABI,
          functionName: "getAmountOut",
          args: [direct.provider, direct.exchange.exchangeId, tokenIn, tokenOut, amountIn],
        })) as bigint;

        const humanIn = Number(amountIn) / 10 ** decimalsIn;
        const humanOut = Number(amountOut) / 10 ** decimalsOut;

        return {
          amountOut,
          rate: humanOut / humanIn,
          source: "mento",
          exchangeProvider: direct.provider,
          exchangeId: direct.exchange.exchangeId,
        };
      } catch {
        // Direct pool oracle may be stale — try CELO-hop routing below
      }
    }

    // 2. Fall back: route through CELO (tokenIn → CELO → tokenOut)
    // Most Mento stablecoins are pooled against CELO as the reserve asset.
    const legA = findDirectPool(allExchanges, tokenInLower, celoLower);
    const legB = findDirectPool(allExchanges, celoLower, tokenOutLower);

    if (!legA || !legB) {
      console.log(`[mento] no direct or CELO-routed pool for ${tokenIn}/${tokenOut}`);
      return null;
    }

    const celoAmountOut = (await publicClient.readContract({
      address: MENTO_BROKER,
      abi: BROKER_ABI,
      functionName: "getAmountOut",
      args: [legA.provider, legA.exchange.exchangeId, tokenIn, CELO_TOKEN, amountIn],
    })) as bigint;

    if (celoAmountOut === BigInt(0)) return null;

    const finalAmountOut = (await publicClient.readContract({
      address: MENTO_BROKER,
      abi: BROKER_ABI,
      functionName: "getAmountOut",
      args: [legB.provider, legB.exchange.exchangeId, CELO_TOKEN, tokenOut, celoAmountOut],
    })) as bigint;

    const humanIn = Number(amountIn) / 10 ** decimalsIn;
    const humanOut = Number(finalAmountOut) / 10 ** decimalsOut;

    return {
      amountOut: finalAmountOut,
      rate: humanOut / humanIn,
      source: "mento",
      // Report the first leg's provider/exchange as the entry point
      exchangeProvider: legA.provider,
      exchangeId: legA.exchange.exchangeId,
    };
  } catch (err) {
    console.error("[mento] getMentoRate error:", (err as Error).message);
    return null;
  }
}
