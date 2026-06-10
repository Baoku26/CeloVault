#!/usr/bin/env tsx
/**
 * Re-uploads agent metadata with correct env vars substituted, then
 * calls setAgentURI on the Identity Registry to point to the new CID.
 *
 * Run with: pnpm tsx scripts/update-agent-uri.ts [--mainnet]
 *
 * Prerequisites:
 *   - AGENT_PRIVATE_KEY in .env.local
 *   - AGENT_ID in .env.local
 *   - PINATA_JWT in .env.local
 *   - NEXT_PUBLIC_AGENT_API_URL in .env.local (your Railway URL)
 */
import { config } from "dotenv";
import { join } from "path";

config({ path: join(process.cwd(), ".env.local") });

import { createWalletClient, createPublicClient, http } from "viem";
import { celo, celoAlfajores } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import {
  IDENTITY_REGISTRY,
  IDENTITY_REGISTRY_SEPOLIA,
  IDENTITY_REGISTRY_ABI,
} from "../lib/erc8004/registry";
import { uploadAgentCard, loadAgentCard } from "../lib/erc8004/upload";

const network = process.argv.includes("--mainnet") ? "mainnet" : "sepolia";
const chain = network === "mainnet" ? celo : celoAlfajores;
const registryAddress =
  network === "mainnet" ? IDENTITY_REGISTRY : IDENTITY_REGISTRY_SEPOLIA;

async function run() {
  const rawKey = process.env.AGENT_PRIVATE_KEY;
  if (!rawKey) throw new Error("AGENT_PRIVATE_KEY is not set");
  const agentId = process.env.AGENT_ID;
  if (!agentId) throw new Error("AGENT_ID is not set");

  const privateKey = (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`;
  const rpc = process.env.NEXT_PUBLIC_CELO_RPC ?? "https://forno.celo.org";
  const account = privateKeyToAccount(privateKey);

  console.log(`\nCeloVault — update agentURI`);
  console.log(`Network:  Celo ${network === "mainnet" ? "Mainnet" : "Sepolia"}`);
  console.log(`Agent ID: ${agentId}\n`);

  console.log("[update] Loading agent card (env vars substituted)...");
  const agentCard = loadAgentCard();
  console.log(`[update] Service endpoint: ${agentCard.services[0]?.endpoint}`);

  console.log("[update] Uploading to IPFS via Pinata...");
  const newURI = await uploadAgentCard(agentCard);
  console.log(`[update] New agentURI: ${newURI}`);

  const walletClient = createWalletClient({ account, chain, transport: http(rpc) });
  const publicClient = createPublicClient({ chain, transport: http(rpc) });

  console.log(`[update] Calling setAgentURI on ${registryAddress}...`);
  const txHash = await walletClient.writeContract({
    address: registryAddress,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "setAgentURI",
    args: [BigInt(agentId), newURI],
  });

  console.log(`[update] Tx submitted: ${txHash}`);
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  console.log(`\n✓ agentURI updated`);
  console.log(`  agentId:   ${agentId}`);
  console.log(`  newURI:    ${newURI}`);
  console.log(`  8004scan:  https://8004scan.io/agents/${agentId}`);
}

run().catch((err: unknown) => {
  console.error("\n✗ Update failed:", err);
  process.exit(1);
});
