import { NextResponse } from "next/server";
import type { AgentStatus } from "@/types/agent";
import { TOKEN_ADDRESSES } from "@/lib/celo/contracts";
import { serverCache } from "@/lib/server-cache";

const STATUS_TTL = 8_000; // 8s — Railway agent status is semi-static

const CACHE_KEY = "agent:status";

export async function GET(): Promise<NextResponse> {
  const cached = serverCache.get<AgentStatus>(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT", "Cache-Control": "public, max-age=8" },
    });
  }

  const agentId = process.env.AGENT_ID ?? null;
  const agentAddress = (process.env.AGENT_WALLET_ADDRESS as `0x${string}` | undefined) ?? null;

  // If a Railway agent URL is configured, proxy its status
  const agentApiUrl = process.env.NEXT_PUBLIC_AGENT_API_URL;
  if (agentApiUrl) {
    try {
      const res = await fetch(`${agentApiUrl}/status`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as AgentStatus;
        serverCache.set(CACHE_KEY, data, STATUS_TTL);
        return NextResponse.json(data, {
          headers: { "X-Cache": "MISS", "Cache-Control": "public, max-age=8" },
        });
      }
    } catch {
      // fall through to stub
    }
  }

  const status: AgentStatus = {
    active: false,
    agentAddress,
    agentId,
    lastSwap: null,
    nextRun: Math.floor(Date.now() / 1000) + 60,
    config: {
      tokenIn: TOKEN_ADDRESSES.USDm,
      tokenOut: TOKEN_ADDRESSES.NGNm,
      targetRate: 1600,
      intervalMs: 60_000,
      autoExecute: false,
    },
    reputationScore: 0,
    totalSwaps: 0,
  };

  serverCache.set(CACHE_KEY, status, STATUS_TTL);
  return NextResponse.json(status, {
    headers: { "X-Cache": "MISS", "Cache-Control": "public, max-age=8" },
  });
}
