"use client";

import { useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, AlertTriangle } from "lucide-react";
import { shortenAddress } from "@/lib/utils";

function isMiniPay(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.ethereum &&
    (window.ethereum as { isMiniPay?: boolean }).isMiniPay === true
  );
}

export function WalletConnect() {
  const { connect } = useConnect();

  useEffect(() => {
    if (isMiniPay()) {
      connect({ connector: injected({ target: "metaMask" }) });
    }
  }, [connect]);

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openChainModal, openAccountModal, mounted }) => {
        const connected = mounted && account && chain;

        if (!mounted) {
          return <div className="h-8 w-32 rounded-md bg-muted animate-pulse" />;
        }

        if (!connected) {
          // MiniPay auto-connect is in progress — suppress the button
          if (isMiniPay()) return null;
          return (
            <Button variant="outline" size="sm" onClick={openConnectModal}>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          );
        }

        if (chain.unsupported) {
          return (
            <Button variant="destructive" size="sm" onClick={openChainModal}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Wrong Network
            </Button>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={openAccountModal}
              className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-slot="address"
            >
              {account.ensName ?? shortenAddress(account.address as `0x${string}`)}
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={openAccountModal}
              aria-label="Account"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
