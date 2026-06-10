import { NextResponse } from "next/server";
import { TOKENS } from "@/lib/celo/tokens";

export async function GET(): Promise<NextResponse> {
  const agentUrl = process.env.NEXT_PUBLIC_AGENT_API_URL ?? "";
  const agentId = process.env.NEXT_PUBLIC_AGENT_ID ?? process.env.AGENT_ID ?? null;

  const card = {
    name: "CVault",
    description:
      "Autonomous multi-currency stablecoin swap agent on Celo. Finds best rates across Mento Protocol and Uniswap V3, executes swaps, and pays gas in USDC via fee abstraction. Registered ERC-8004 onchain agent.",
    url: agentUrl,
    version: "1.0.0",
    erc8004: {
      agentId,
      registry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
      chain: "celo-mainnet",
      scanUrl: agentId ? `https://8004scan.io/agents/celo/${agentId}` : null,
    },
    capabilities: {
      streaming: false,
      pushNotifications: false,
    },
    auth: {
      swapEndpoint: "Bearer token (set A2A_API_KEY on the agent server)",
      otherEndpoints: "open",
    },
    supportedTokens: Object.keys(TOKENS),
    skills: [
      {
        id: "quote",
        name: "Get FX Rate Quote",
        description: "Get the best swap rate for a Celo stablecoin pair",
        endpoint: `${agentUrl}/a2a/quote`,
        method: "POST",
        auth: false,
      },
      {
        id: "swap",
        name: "Execute Stablecoin Swap",
        description: "Execute a swap at the best available rate (gas paid in USDC)",
        endpoint: `${agentUrl}/a2a/swap`,
        method: "POST",
        auth: true,
      },
      {
        id: "status",
        name: "Get Agent Status",
        description: "Get CVault agent status, config, and ERC-8004 reputation",
        endpoint: `${agentUrl}/a2a/status`,
        method: "GET",
        auth: false,
      },
      {
        id: "balances",
        name: "Get Stablecoin Balances",
        description: "Get live balances for a wallet address via Celo multicall",
        endpoint: `${agentUrl}/a2a/balances`,
        method: "GET",
        auth: false,
      },
    ],
  };

  return NextResponse.json(card, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
