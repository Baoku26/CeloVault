import { createPublicClient, http, type WalletClient, type Transport, type Account } from "viem";
import { celo } from "viem/chains";

type CeloWalletClient = WalletClient<Transport, typeof celo, Account>;
import { UNISWAP_ROUTER_V2, USDC_ADAPTER } from "@/lib/celo/contracts";

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

const SWAP_ROUTER_ABI = [
  {
    name: "exactInputSingle",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

export interface UniswapSwapParams {
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  fee: number;
  amountIn: bigint;
  amountOutMin: bigint;
}

export interface SwapReceipt {
  txHash: `0x${string}`;
  amountIn: bigint;
  amountOut: bigint;
}

export async function executeUniswapSwap(
  walletClient: CeloWalletClient,
  params: UniswapSwapParams
): Promise<SwapReceipt> {
  const rpc = process.env.NEXT_PUBLIC_CELO_RPC ?? "https://forno.celo.org";
  const publicClient = createPublicClient({ chain: celo, transport: http(rpc) });
  const account = walletClient.account!;

  // Check and set approval if needed
  const allowance = (await publicClient.readContract({
    address: params.tokenIn,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account.address, UNISWAP_ROUTER_V2],
  })) as bigint;

  if (allowance < params.amountIn) {
    const approveTx = await walletClient.writeContract({
      address: params.tokenIn,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [UNISWAP_ROUTER_V2, params.amountIn],
      feeCurrency: USDC_ADAPTER,
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });
  }

  // Simulate to get amountOut + catch reverts early
  const { result: amountOut } = await publicClient.simulateContract({
    account,
    address: UNISWAP_ROUTER_V2,
    abi: SWAP_ROUTER_ABI,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        fee: params.fee,
        recipient: account.address,
        amountIn: params.amountIn,
        amountOutMinimum: params.amountOutMin,
        sqrtPriceLimitX96: BigInt(0),
      },
    ],
    feeCurrency: USDC_ADAPTER,
  });

  const txHash = await walletClient.writeContract({
    address: UNISWAP_ROUTER_V2,
    abi: SWAP_ROUTER_ABI,
    functionName: "exactInputSingle",
    args: [
      {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        fee: params.fee,
        recipient: account.address,
        amountIn: params.amountIn,
        amountOutMinimum: params.amountOutMin,
        sqrtPriceLimitX96: BigInt(0),
      },
    ],
    feeCurrency: USDC_ADAPTER,
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return { txHash, amountIn: params.amountIn, amountOut: amountOut as bigint };
}
