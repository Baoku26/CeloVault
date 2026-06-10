import { createWalletClient, createPublicClient, http, parseEventLogs } from "viem";
import { celo, celoAlfajores } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import {
  IDENTITY_REGISTRY,
  IDENTITY_REGISTRY_SEPOLIA,
  IDENTITY_REGISTRY_ABI,
} from "./registry";
import { uploadAgentCard, loadAgentCard } from "./upload";

const MAINNET_RPC_FALLBACKS = [
  "https://forno.celo.org",
  "https://rpc.ankr.com/celo",
  "https://celo.drpc.org",
];

const ALFAJORES_RPC_FALLBACKS = [
  "https://alfajores-forno.celo-testnet.org",
  "https://celo-alfajores.drpc.org",
  "https://rpc.ankr.com/celo_alfajores",
];

interface RegisterResult {
  agentId: bigint;
  txHash: `0x${string}`;
  agentURI: string;
  network: "mainnet" | "sepolia";
}

async function pickRpc(urls: string[]): Promise<string> {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "net_version", params: [], id: 1 }),
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) return url;
    } catch {
      // try next
    }
  }
  throw new Error(`All RPC endpoints unreachable: ${urls.join(", ")}`);
}

export async function registerAgent(
  network: "mainnet" | "sepolia" = "sepolia"
): Promise<RegisterResult> {
  const rawKey = process.env.AGENT_PRIVATE_KEY;
  if (!rawKey) throw new Error("AGENT_PRIVATE_KEY is not set");
  const privateKey = (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`;

  const chain = network === "mainnet" ? celo : celoAlfajores;
  const fallbacks = network === "mainnet" ? MAINNET_RPC_FALLBACKS : ALFAJORES_RPC_FALLBACKS;

  // Allow overriding the mainnet RPC via env
  if (network === "mainnet" && process.env.NEXT_PUBLIC_CELO_RPC) {
    fallbacks.unshift(process.env.NEXT_PUBLIC_CELO_RPC);
  }

  console.log(`[register] Finding live RPC...`);
  const rpc = await pickRpc(fallbacks);
  console.log(`[register] Using: ${rpc}`);

  const registryAddress =
    network === "mainnet" ? IDENTITY_REGISTRY : IDENTITY_REGISTRY_SEPOLIA;

  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({ account, chain, transport: http(rpc) });
  const publicClient = createPublicClient({ chain, transport: http(rpc) });

  // Use CACHED_AGENT_URI if set (avoids re-uploading on retry)
  let agentURI = process.env.CACHED_AGENT_URI ?? "";
  if (!agentURI) {
    console.log(`[register] Uploading agent card to IPFS...`);
    const agentCard = loadAgentCard();
    agentURI = await uploadAgentCard(agentCard);
    console.log(`[register] Agent URI: ${agentURI}`);
    console.log(`[register] Tip: set CACHED_AGENT_URI=${agentURI} to skip re-upload on retry`);
  } else {
    console.log(`[register] Using cached Agent URI: ${agentURI}`);
  }

  console.log(`[register] Calling register() on ${network} (${registryAddress})...`);
  // feeCurrency omitted intentionally — registration is a one-time setup op.
  // Production swap ops use USDC feeCurrency in feedback.ts / swap.ts.
  const txHash = await walletClient.writeContract({
    address: registryAddress,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "register",
    args: [agentURI],
  });

  console.log(`[register] Tx submitted: ${txHash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  const logs = parseEventLogs({
    abi: IDENTITY_REGISTRY_ABI,
    logs: receipt.logs,
    eventName: "Transfer",
  });

  const transferEvent = logs.find((l) => l.eventName === "Transfer");
  if (!transferEvent) {
    throw new Error("Could not find Transfer event in registration receipt");
  }

  const agentId = (transferEvent.args as { tokenId: bigint }).tokenId;
  console.log(`[register] ✓ Agent registered! agentId: ${agentId.toString()}`);
  console.log(`[register] Add to .env.local: AGENT_ID=${agentId.toString()}`);

  return { agentId, txHash, agentURI, network };
}
