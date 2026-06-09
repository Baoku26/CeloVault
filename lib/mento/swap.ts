import { createPublicClient, http, type WalletClient, type Transport, type Account } from "viem";
import { celo } from "viem/chains";

type CeloWalletClient = WalletClient<Transport, typeof celo, Account>;
import { MENTO_BROKER, USDC_ADAPTER } from "@/lib/celo/contracts";

const ERC20_ABI = [
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const BROKER_SWAP_ABI = [
  {
    name: "swapIn",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "exchangeProvider", type: "address" },
      { name: "exchangeId", type: "bytes32" },
      { name: "tokenIn", type: "address" },
      { name: "tokenOut", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

export interface MentoSwapParams {
  exchangeProvider: `0x${string}`;
  exchangeId: `0x${string}`;
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amountIn: bigint;
  amountOutMin: bigint;
}

export interface SwapReceipt {
  txHash: `0x${string}`;
  amountIn: bigint;
  amountOut: bigint;
}

export async function executeMentoSwap(
  walletClient: CeloWalletClient,
  params: MentoSwapParams
): Promise<SwapReceipt> {
  const rpc = process.env.NEXT_PUBLIC_CELO_RPC ?? "https://forno.celo.org";
  const publicClient = createPublicClient({ chain: celo, transport: http(rpc) });
  const account = walletClient.account!;

  // Check and set approval if needed
  const allowance = (await publicClient.readContract({
    address: params.tokenIn,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account.address, MENTO_BROKER],
  })) as bigint;

  if (allowance < params.amountIn) {
    const approveTx = await walletClient.writeContract({
      address: params.tokenIn,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [MENTO_BROKER, params.amountIn],
      feeCurrency: USDC_ADAPTER,
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });
  }

  // Simulate to get expected amountOut + catch reverts early
  const { result: amountOut } = await publicClient.simulateContract({
    account,
    address: MENTO_BROKER,
    abi: BROKER_SWAP_ABI,
    functionName: "swapIn",
    args: [
      params.exchangeProvider,
      params.exchangeId,
      params.tokenIn,
      params.tokenOut,
      params.amountIn,
      params.amountOutMin,
    ],
    feeCurrency: USDC_ADAPTER,
  });

  const txHash = await walletClient.writeContract({
    address: MENTO_BROKER,
    abi: BROKER_SWAP_ABI,
    functionName: "swapIn",
    args: [
      params.exchangeProvider,
      params.exchangeId,
      params.tokenIn,
      params.tokenOut,
      params.amountIn,
      params.amountOutMin,
    ],
    feeCurrency: USDC_ADAPTER,
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return { txHash, amountIn: params.amountIn, amountOut: amountOut as bigint };
}
