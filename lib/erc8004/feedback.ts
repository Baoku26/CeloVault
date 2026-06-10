import { createWalletClient, createPublicClient, http, toBytes, keccak256, toHex, zeroHash } from "viem";
import { celo } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { USDC_ADAPTER } from "@/lib/celo/fee-abstraction";
import { REPUTATION_REGISTRY, REPUTATION_REGISTRY_ABI } from "./registry";

const TAG_SWAP = toHex(toBytes("swap", { size: 32 }));
const TAG_CELOVAULT = toHex(toBytes("celovault", { size: 32 }));

// 0-100 integer score, no decimal places
const VALUE_DECIMALS = 0;

export interface FeedbackParams {
  agentId: bigint;
  score: number;      // 0–100
  endpoint?: string;  // agent service endpoint this feedback is about
  feedbackURI?: string;
}

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

  const endpoint = params.endpoint ?? (process.env.NEXT_PUBLIC_AGENT_API_URL ?? "");
  const feedbackURI = params.feedbackURI ?? "";
  const feedbackHash: `0x${string}` =
    feedbackURI.length > 0
      ? keccak256(toBytes(feedbackURI))
      : zeroHash;

  const txHash = await walletClient.writeContract({
    address: REPUTATION_REGISTRY,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: "giveFeedback",
    args: [
      params.agentId,
      BigInt(params.score),   // int128 value
      VALUE_DECIMALS,         // uint8 valueDecimals
      TAG_SWAP,               // bytes32 tag1
      TAG_CELOVAULT,          // bytes32 tag2
      endpoint,               // string endpoint
      feedbackURI,            // string feedbackURI
      feedbackHash,           // bytes32 feedbackHash
    ],
    feeCurrency: USDC_ADAPTER,
  });

  return txHash;
}

export async function getReputation(
  agentId: bigint
): Promise<{ count: bigint; sum: bigint; avgScore: number }> {
  const rpc = process.env.NEXT_PUBLIC_CELO_RPC ?? "https://forno.celo.org";
  const publicClient = createPublicClient({ chain: celo, transport: http(rpc) });

  const clients = (await publicClient.readContract({
    address: REPUTATION_REGISTRY,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: "getClients",
    args: [agentId],
  })) as `0x${string}`[];

  if (clients.length === 0) return { count: 0n, sum: 0n, avgScore: 0 };

  const [count, sum] = (await publicClient.readContract({
    address: REPUTATION_REGISTRY,
    abi: REPUTATION_REGISTRY_ABI,
    functionName: "getSummary",
    args: [agentId, clients],
  })) as [bigint, bigint, number];

  const avgScore = count > 0n ? Number(sum) / Number(count) : 0;
  return { count, sum, avgScore };
}
