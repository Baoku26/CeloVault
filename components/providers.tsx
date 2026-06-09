"use client";

import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { wagmiConfig } from "@/lib/wagmi";
import { useState, type ReactNode } from "react";

const celoVaultTheme = darkTheme({
  accentColor: "#35D07F",
  accentColorForeground: "#0A0A0A",
  borderRadius: "medium",
  fontStack: "system",
  overlayBlur: "small",
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            retry: 2,
            retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 10_000),
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
          },
        },
      })
  );

  return (
    <MotionConfig reducedMotion="user">
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={celoVaultTheme} modalSize="compact">
            {children}
            <Toaster />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </MotionConfig>
  );
}
