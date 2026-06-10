import { Router } from "express";
import { createWalletClient, http } from "viem";
import { celo } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { getBestRate } from "@/lib/agent/router";
import { executeMentoSwap } from "@/lib/mento/swap";
import { executeUniswapSwap } from "@/lib/uniswap/swap";
import { publicClient } from "@/lib/celo/client";
import { TOKENS } from "@/lib/celo/tokens";
import { formatAmount } from "@/lib/utils";
import type { AgentEngine } from "@/lib/agent/engine";
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

function requireAuth(req: Parameters<Router>[0], res: Parameters<Router>[1]): boolean {
  const apiKey = process.env.A2A_API_KEY;
  if (!apiKey) return true; // dev mode — no key set means open
  const auth = req.headers["authorization"];
  if (auth !== `Bearer ${apiKey}`) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

function resolveToken(symbol: string) {
  return TOKENS[symbol] ?? null;
}

export function createA2ARouter(engine: AgentEngine): Router {
  const router = Router();
  const baseUrl = process.env.NEXT_PUBLIC_AGENT_API_URL ?? "";

  // GET /a2a/manifest — agent capability card for A2A discovery
  router.get("/manifest", (_req, res) => {
    res.json({
      name: "CVault",
      description:
        "Autonomous multi-currency stablecoin swap agent on Celo. Finds best rates across Mento Protocol and Uniswap V3, executes swaps, and pays gas in USDC via fee abstraction.",
      url: baseUrl,
      version: "1.0.0",
      erc8004: {
        agentId: process.env.AGENT_ID ?? null,
        registry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
        chain: "celo-mainnet",
        scanUrl: `https://8004scan.io/agents/celo/${process.env.AGENT_ID ?? ""}`,
      },
      capabilities: { streaming: false, pushNotifications: false },
      auth: {
        swapEndpoint: "Bearer token required (A2A_API_KEY)",
        otherEndpoints: "open",
      },
      supportedTokens: Object.keys(TOKENS),
      skills: [
        {
          id: "quote",
          name: "Get FX Rate Quote",
          description:
            "Get the best swap rate for a Celo stablecoin pair from Mento Protocol and Uniswap V3 in parallel",
          endpoint: `${baseUrl}/a2a/quote`,
          method: "POST",
          auth: false,
          body: { tokenIn: "string (symbol)", tokenOut: "string (symbol)", amountIn: "string (decimal)" },
          response: { rate: "number", amountOut: "string", source: "mento|uniswap-v3", spread: "number", timestamp: "number" },
        },
        {
          id: "swap",
          name: "Execute Stablecoin Swap",
          description: "Execute a swap at the best available rate. Gas paid in USDC via fee abstraction.",
          endpoint: `${baseUrl}/a2a/swap`,
          method: "POST",
          auth: true,
          body: { tokenIn: "string", tokenOut: "string", amountIn: "string", slippageBps: "number (optional, default 100)" },
          response: { txHash: "string", amountIn: "string", amountOut: "string", source: "string", timestamp: "number" },
        },
        {
          id: "status",
          name: "Get Agent Status",
          description: "Get CVault agent status, configuration, reputation score, and swap history",
          endpoint: `${baseUrl}/a2a/status`,
          method: "GET",
          auth: false,
        },
        {
          id: "balances",
          name: "Get Stablecoin Balances",
          description: "Get live stablecoin balances for a wallet address via multicall",
          endpoint: `${baseUrl}/a2a/balances`,
          method: "GET",
          auth: false,
          query: { address: "string (0x..., optional — defaults to agent wallet)" },
        },
      ],
    });
  });

  // GET /a2a/status — agent status + config
  router.get("/status", (_req, res) => {
    const status = engine.getStatus();
    res.json({
      ...status,
      config: {
        ...status.config,
        minSwapAmount: status.config.minSwapAmount?.toString(),
        maxSwapAmount: status.config.maxSwapAmount?.toString(),
      },
    });
  });

  // GET /a2a/balances?address=0x...
  router.get("/balances", async (req, res) => {
    const agentAddress = engine.getStatus().agentAddress;
    const rawAddress = (req.query["address"] as string | undefined) ?? agentAddress;

    if (!rawAddress || !rawAddress.startsWith("0x")) {
      res.status(400).json({ error: "Missing or invalid address" });
      return;
    }

    const address = rawAddress as `0x${string}`;
    try {
      const tokenList = Object.values(TOKENS);
      const calls = tokenList.map((t) => ({
        address: t.address,
        abi: ERC20_BALANCE_ABI,
        functionName: "balanceOf" as const,
        args: [address] as [`0x${string}`],
      }));

      const results = await publicClient.multicall({ contracts: calls });

      const balances: Record<string, { raw: string; formatted: string; decimals: number }> = {};
      tokenList.forEach((token, i) => {
        const result = results[i];
        const raw = result.status === "success" ? (result.result as bigint) : BigInt(0);
        balances[token.symbol] = {
          raw: raw.toString(),
          formatted: formatAmount(raw, token.decimals),
          decimals: token.decimals,
        };
      });

      res.json({ address, balances, timestamp: Math.floor(Date.now() / 1000) });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // POST /a2a/quote — rate quote, no execution
  router.post("/quote", async (req, res) => {
    const { tokenIn: tokenInSymbol, tokenOut: tokenOutSymbol, amountIn: amountInStr } = req.body as Record<string, unknown>;

    if (typeof tokenInSymbol !== "string" || typeof tokenOutSymbol !== "string" || typeof amountInStr !== "string") {
      res.status(400).json({ error: "Required: tokenIn, tokenOut, amountIn (all strings)" });
      return;
    }

    const tokenIn = resolveToken(tokenInSymbol);
    const tokenOut = resolveToken(tokenOutSymbol);
    if (!tokenIn || !tokenOut) {
      res.status(400).json({ error: `Unknown token symbol. Supported: ${Object.keys(TOKENS).join(", ")}` });
      return;
    }

    const amountIn = BigInt(Math.floor(parseFloat(amountInStr) * 10 ** tokenIn.decimals));
    if (amountIn <= BigInt(0)) {
      res.status(400).json({ error: "amountIn must be > 0" });
      return;
    }

    try {
      const result = await getBestRate(tokenIn.address, tokenOut.address, amountIn, tokenIn.decimals, tokenOut.decimals);
      res.json({
        tokenIn: tokenInSymbol,
        tokenOut: tokenOutSymbol,
        amountIn: amountInStr,
        rate: result.rate,
        amountOut: result.amountOut.toString(),
        source: result.best,
        spread: result.spread,
        mento: result.mento ? { rate: result.mento.rate, amountOut: result.mento.amountOut.toString() } : null,
        uniswap: result.uniswap ? { rate: result.uniswap.rate, amountOut: result.uniswap.amountOut.toString() } : null,
        timestamp: Math.floor(Date.now() / 1000),
      });
    } catch (err) {
      res.status(503).json({ error: (err as Error).message });
    }
  });

  // POST /a2a/swap — execute swap (requires auth)
  router.post("/swap", async (req, res) => {
    if (!requireAuth(req, res)) return;

    const rawKey = process.env.AGENT_PRIVATE_KEY;
    if (!rawKey) {
      res.status(503).json({ error: "Agent wallet not configured" });
      return;
    }

    const { tokenIn: tokenInSymbol, tokenOut: tokenOutSymbol, amountIn: amountInStr, slippageBps = 100 } = req.body as Record<string, unknown>;

    if (typeof tokenInSymbol !== "string" || typeof tokenOutSymbol !== "string" || typeof amountInStr !== "string") {
      res.status(400).json({ error: "Required: tokenIn, tokenOut, amountIn (all strings)" });
      return;
    }

    const tokenIn = resolveToken(tokenInSymbol);
    const tokenOut = resolveToken(tokenOutSymbol);
    if (!tokenIn || !tokenOut) {
      res.status(400).json({ error: `Unknown token symbol. Supported: ${Object.keys(TOKENS).join(", ")}` });
      return;
    }

    const slip = typeof slippageBps === "number" ? slippageBps : 100;
    const amountIn = BigInt(Math.floor(parseFloat(amountInStr) * 10 ** tokenIn.decimals));
    if (amountIn <= BigInt(0)) {
      res.status(400).json({ error: "amountIn must be > 0" });
      return;
    }

    try {
      const privateKey = (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`;
      const account = privateKeyToAccount(privateKey);
      const walletClient = createWalletClient({
        account,
        chain: celo,
        transport: http(process.env.NEXT_PUBLIC_CELO_RPC ?? "https://forno.celo.org"),
      });

      const rateResult = await getBestRate(tokenIn.address, tokenOut.address, amountIn, tokenIn.decimals, tokenOut.decimals);
      if (rateResult.rate === 0) {
        res.status(503).json({ error: "No valid route found" });
        return;
      }

      const amountOutMin = (rateResult.amountOut * BigInt(10000 - slip)) / BigInt(10000);

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
        res.status(503).json({ error: "No valid route found" });
        return;
      }

      const result: SwapResult = {
        txHash: receipt.txHash,
        amountIn: receipt.amountIn.toString(),
        amountOut: receipt.amountOut.toString(),
        source: rateResult.best,
        timestamp: Math.floor(Date.now() / 1000),
      };

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
