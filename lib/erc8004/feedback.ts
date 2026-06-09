import { createWalletClient, createPublicClient, http, toBytes, keccak256 } from "viem";
import { celo } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { USDC_ADAPTER } from "@/lib/celo/fee-abstraction";
import { REPUTATION_REGISTRY, REPUTATION_REGISTRY_ABI } from "./registry";

const TAG_SWAP = toBytes("swap", { size: 32 });
const TAG_CELOVAULT = toBytes("celovault", { size: 32 });

export interface FeedbackParams {
  agentId: bigint;
  score: number;
  uri?: string;
  fileHash?: `0x${string}`;
}

/**
 * Submits ERC-8004 reputation feedback after a successful swap.
 * The agent wallet signs the feedback authorization (EIP-191).
 */
export async function giveFeedback(params: FeedbackParams): Promise<`0x${string}`> {
  const rawKey = process.env.AGENT_PRIVATE_KEY;
  if (!rawKey) throw new Error("AGENT_PRIVATE_KEY is not set");
  const privateKey = (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`;

  const rpc = process.env.NEXT_PUBLIC_CELO_RPC ?? "https://forno.celo.org";
  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http(rpc),
  });

  const uri = params.uri ?? "";
  const fileHash =
    params.fileHash ??
    (keccak256(toBytes(uri)) as `0x${string}`);

  const feedbackMessage = `CeloVault feedback: agentId=${params.agentId} score=${params.score}`;
  const feedbackAuth = await walletClient.signMessage({ message: feedbackMessage });

  const txHash = await walletClient.writeContract({
    address: REPUTATION_REGISTRY,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: "giveFeedback",
    args: [
      params.agentId,
      params.score,
      TAG_SWAP as unknown as `0x${string}`,
      TAG_CELOVAULT as unknown as `0x${string}`,
      uri,
      fileHash,
      feedbackAuth,
    ],
    feeCurrency: USDC_ADAPTER,
  });

  return txHash;
}

export async function getReputation(
  agentId: bigint
): Promise<{ totalScore: bigint; feedbackCount: bigint; avgScore: number }> {
  const rpc = process.env.NEXT_PUBLIC_CELO_RPC ?? "https://forno.celo.org";
  const publicClient = createPublicClient({ chain: celo, transport: http(rpc) });

  const [totalScore, feedbackCount] = (await publicClient.readContract({
    address: REPUTATION_REGISTRY,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: "getReputation",
    args: [agentId],
  })) as [bigint, bigint];

  const avgScore =
    feedbackCount > BigInt(0)
      ? Number(totalScore) / Number(feedbackCount)
      : 0;

  return { totalScore, feedbackCount, avgScore };
}
