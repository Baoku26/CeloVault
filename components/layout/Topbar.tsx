"use client";

import { WalletConnect } from "@/components/wallet/WalletConnect";
import { NetworkBadge } from "@/components/wallet/NetworkBadge";

export function Topbar() {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-background sticky top-0 z-40">
      <div className="lg:hidden text-[1.125rem] font-semibold tracking-[-0.01em] text-celo-green">CVault</div>
      <div className="ml-auto flex items-center gap-3">
        {/* <NetworkBadge /> */}
        <WalletConnect />
      </div>
    </header>
  );
}
