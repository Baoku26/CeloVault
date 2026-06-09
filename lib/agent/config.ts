import { TOKEN_ADDRESSES } from "@/lib/celo/contracts";
import type { AgentConfig } from "@/types/agent";

export function loadAgentConfig(): AgentConfig {
  return {
    tokenIn: (process.env.AGENT_TOKEN_IN ?? TOKEN_ADDRESSES.USDm) as `0x${string}`,
    tokenOut: (process.env.AGENT_TOKEN_OUT ?? TOKEN_ADDRESSES.NGNm) as `0x${string}`,
    targetRate: parseFloat(process.env.AGENT_TARGET_RATE ?? "1600"),
    minSwapAmount: BigInt(process.env.AGENT_MIN_SWAP_AMOUNT ?? "1000000000000000000"),   // 1 USDm
    maxSwapAmount: BigInt(process.env.AGENT_MAX_SWAP_AMOUNT ?? "100000000000000000000"), // 100 USDm
    slippageBps: parseInt(process.env.AGENT_SLIPPAGE_BPS ?? "100"),  // 1%
    intervalMs: parseInt(process.env.AGENT_INTERVAL_MS ?? "60000"),  // 60s
    autoExecute: process.env.AGENT_AUTO_EXECUTE === "true",
  };
}
