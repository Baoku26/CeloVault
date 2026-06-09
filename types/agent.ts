import type { SwapResult } from "./swap";

export interface AgentConfig {
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  targetRate: number;
  minSwapAmount: bigint;
  maxSwapAmount: bigint;
  slippageBps: number;
  intervalMs: number;
  autoExecute: boolean;
}

export const DEFAULT_AGENT_CONFIG: Omit<AgentConfig, "tokenIn" | "tokenOut"> = {
  targetRate: 1600,
  minSwapAmount: BigInt("1000000000000000000"),
  maxSwapAmount: BigInt("100000000000000000000"),
  slippageBps: 100,
  intervalMs: 60_000,
  autoExecute: false,
};

export interface AgentStatus {
  active: boolean;
  agentAddress: `0x${string}` | null;
  agentId: string | null;
  lastSwap: SwapResult | null;
  nextRun: number;
  config: Partial<AgentConfig>;
  reputationScore: number;
  totalSwaps: number;
}
