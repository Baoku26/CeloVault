"use client";

import { useChainId } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { CELO_MAINNET_CHAIN_ID, CELO_SEPOLIA_CHAIN_ID } from "@/lib/celo/contracts";

export function NetworkBadge() {
  const chainId = useChainId();

  if (chainId === CELO_MAINNET_CHAIN_ID) {
    return <Badge variant="success">Celo Mainnet</Badge>;
  }
  if (chainId === CELO_SEPOLIA_CHAIN_ID) {
    return <Badge variant="warning">Celo Testnet</Badge>;
  }
  return <Badge variant="destructive">Wrong Network</Badge>;
}
