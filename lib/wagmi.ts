import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { celo, celoAlfajores } from "viem/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "CeloVault",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
  chains: [celo, celoAlfajores],
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC ?? "https://forno.celo.org"),
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
  },
  ssr: true,
});
