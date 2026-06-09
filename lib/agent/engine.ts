import { type WalletClient, type Transport, type Account } from "viem";
import { celo } from "viem/chains";
import { publicClient } from "@/lib/celo/client";
import { getBestRate } from "@/lib/agent/router";
import { executeMentoSwap } from "@/lib/mento/swap";
import { executeUniswapSwap } from "@/lib/uniswap/swap";
import { giveFeedback } from "@/lib/erc8004/feedback";
import { TOKENS } from "@/lib/celo/tokens";
import type { AgentConfig, AgentStatus } from "@/types/agent";
import type { SwapResult } from "@/types/swap";

const ERC20_BALANCE_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function log(data: Record<string, unknown>) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...data }));
}

function findToken(address: `0x${string}`) {
  return Object.values(TOKENS).find(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
}

type CeloWalletClient = WalletClient<Transport, typeof celo, Account>;

export class AgentEngine {
  private walletClient: CeloWalletClient;
  private config: AgentConfig;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private active = false;
  private totalSwaps = 0;
  private reputationScore = 0;
  private lastSwap: SwapResult | null = null;
  private nextRun = 0;

  constructor(walletClient: CeloWalletClient, config: AgentConfig) {
    this.walletClient = walletClient;
    this.config = config;
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.scheduleNextRun();
    void this.tick();
    this.intervalHandle = setInterval(() => void this.tick(), this.config.intervalMs);
    log({ event: "engine:started", intervalMs: this.config.intervalMs, autoExecute: this.config.autoExecute });
  }

  pause() {
    if (this.intervalHandle) clearInterval(this.intervalHandle);
    this.intervalHandle = null;
    this.active = false;
    log({ event: "engine:paused", totalSwaps: this.totalSwaps });
  }

  resume() {
    if (this.active) return;
    this.active = true;
    this.scheduleNextRun();
    void this.tick();
    this.intervalHandle = setInterval(() => void this.tick(), this.config.intervalMs);
    log({ event: "engine:resumed", intervalMs: this.config.intervalMs });
  }

  stop() {
    this.pause();
    log({ event: "engine:shutdown" });
    process.exit(0);
  }

  getStatus(): AgentStatus {
    return {
      active: this.active,
      agentAddress: (this.walletClient.account?.address ?? null) as `0x${string}` | null,
      agentId: process.env.AGENT_ID ?? null,
      lastSwap: this.lastSwap,
      nextRun: this.nextRun,
      config: this.config,
      reputationScore: this.reputationScore,
      totalSwaps: this.totalSwaps,
    };
  }

  updateConfig(patch: Partial<AgentConfig>) {
    this.config = { ...this.config, ...patch };
    log({ event: "config:updated", config: { ...this.config, minSwapAmount: this.config.minSwapAmount.toString(), maxSwapAmount: this.config.maxSwapAmount.toString() } });
  }

  private scheduleNextRun() {
    this.nextRun = Math.floor(Date.now() / 1000) + this.config.intervalMs / 1000;
  }

  private async tick() {
    this.scheduleNextRun();

    try {
      const agentAddress = this.walletClient.account?.address;
      if (!agentAddress) throw new Error("No agent wallet address");

      const tokenIn = findToken(this.config.tokenIn);
      const tokenOut = findToken(this.config.tokenOut);
      if (!tokenIn || !tokenOut) throw new Error("Unknown token in config");

      // 1. Read tokenIn balance
      const balance = (await publicClient.readContract({
        address: this.config.tokenIn,
        abi: ERC20_BALANCE_ABI,
        functionName: "balanceOf",
        args: [agentAddress],
      })) as bigint;

      const humanBalance = Number(balance) / 10 ** tokenIn.decimals;
      log({ event: "tick:balance", token: tokenIn.symbol, balance: humanBalance });

      if (balance < this.config.minSwapAmount) {
        log({ event: "tick:skip", reason: "insufficient_balance", balance: humanBalance, min: Number(this.config.minSwapAmount) / 10 ** tokenIn.decimals });
        return;
      }

      // 2. Determine swap amount and get best rate for it
      const swapAmountIn = balance > this.config.maxSwapAmount ? this.config.maxSwapAmount : balance;

      const rateResult = await getBestRate(
        this.config.tokenIn,
        this.config.tokenOut,
        swapAmountIn,
        tokenIn.decimals,
        tokenOut.decimals
      );

      log({ event: "tick:rate", rate: rateResult.rate, best: rateResult.best, threshold: this.config.targetRate });

      // 3. Check threshold
      if (rateResult.rate < this.config.targetRate) {
        log({ event: "tick:skip", reason: "rate_below_threshold", rate: rateResult.rate, threshold: this.config.targetRate });
        return;
      }

      if (!this.config.autoExecute) {
        log({ event: "tick:skip", reason: "auto_execute_disabled" });
        return;
      }

      // 4. Calculate min out with slippage
      const amountOutMin =
        rateResult.amountOut * BigInt(10000 - this.config.slippageBps) / BigInt(10000);

      // 5. Execute swap
      let receipt;
      if (rateResult.best === "mento" && rateResult.mento) {
        receipt = await executeMentoSwap(this.walletClient, {
          exchangeProvider: rateResult.mento.exchangeProvider,
          exchangeId: rateResult.mento.exchangeId,
          tokenIn: this.config.tokenIn,
          tokenOut: this.config.tokenOut,
          amountIn: swapAmountIn,
          amountOutMin,
        });
      } else if (rateResult.uniswap) {
        receipt = await executeUniswapSwap(this.walletClient, {
          tokenIn: this.config.tokenIn,
          tokenOut: this.config.tokenOut,
          fee: rateResult.uniswap.fee,
          amountIn: swapAmountIn,
          amountOutMin,
        });
      } else {
        log({ event: "tick:skip", reason: "no_valid_route" });
        return;
      }

      this.totalSwaps++;
      this.lastSwap = {
        txHash: receipt.txHash,
        amountIn: receipt.amountIn.toString(),
        amountOut: receipt.amountOut.toString(),
        source: rateResult.best,
        timestamp: Math.floor(Date.now() / 1000),
      };

      log({ event: "swap:executed", txHash: receipt.txHash, amountIn: receipt.amountIn.toString(), amountOut: receipt.amountOut.toString(), source: rateResult.best, totalSwaps: this.totalSwaps });

      // 6. ERC-8004 reputation feedback — fire and forget
      const agentId = process.env.AGENT_ID;
      if (agentId) {
        giveFeedback({ agentId: BigInt(agentId), score: 90 }).then(() => {
          this.reputationScore = Math.min(100, this.reputationScore + 1);
          log({ event: "reputation:feedback_submitted", agentId, score: 90 });
        }).catch((err: unknown) => {
          log({ event: "reputation:feedback_failed", error: (err as Error).message });
        });
      }
    } catch (err) {
      log({ event: "tick:error", error: (err as Error).message });
    }
  }
}
