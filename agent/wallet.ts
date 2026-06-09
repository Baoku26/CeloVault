import { createWalletClient, http } from "viem";
import { celo } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

export function createAgentWallet() {
  const rawKey = process.env.AGENT_PRIVATE_KEY;
  if (!rawKey) throw new Error("AGENT_PRIVATE_KEY is not set");

  const privateKey = (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`;
  const account = privateKeyToAccount(privateKey);

  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http(process.env.NEXT_PUBLIC_CELO_RPC ?? "https://forno.celo.org"),
  });

  return { walletClient, account, address: account.address };
}
