#!/usr/bin/env tsx
/**
 * Run with: pnpm tsx scripts/register-agent.ts [--mainnet]
 *
 * Prerequisites:
 *   - AGENT_PRIVATE_KEY set in .env.local
 *   - NFTSTORAGE_API_KEY set in .env.local
 *   - Agent wallet funded with USDC for gas (Sepolia: use faucet)
 */
import { config } from "dotenv";
import { join } from "path";

config({ path: join(process.cwd(), ".env.local") });

import { registerAgent } from "../lib/erc8004/register";

const network = process.argv.includes("--mainnet") ? "mainnet" : "sepolia";

console.log(`\nCeloVault ERC-8004 Registration`);
console.log(`Network: Celo ${network === "mainnet" ? "Mainnet" : "Sepolia (testnet)"}\n`);

registerAgent(network)
  .then((result) => {
    console.log(`\n✓ Registration complete`);
    console.log(`  agentId:  ${result.agentId.toString()}`);
    console.log(`  txHash:   ${result.txHash}`);
    console.log(`  agentURI: ${result.agentURI}`);
    console.log(`\nAdd to .env.local:\n  AGENT_ID=${result.agentId.toString()}`);
    process.exit(0);
  })
  .catch((err: unknown) => {
    console.error("\n✗ Registration failed:", err);
    process.exit(1);
  });
