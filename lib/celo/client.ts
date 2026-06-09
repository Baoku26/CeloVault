import { createPublicClient, http } from "viem";
import { celo, celoAlfajores } from "viem/chains";

export { celo as celoMainnet, celoAlfajores as celoSepolia };

export const publicClient = createPublicClient({
  chain: celo,
  transport: http(process.env.NEXT_PUBLIC_CELO_RPC ?? "https://forno.celo.org"),
});

export const testnetPublicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http("https://alfajores-forno.celo-testnet.org"),
});
