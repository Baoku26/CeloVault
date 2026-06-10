import { SwapCard } from "@/components/swap/SwapCard";

export default function SwapPage() {
  return (
    <div className="max-w-md space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Swap</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Best rate across Mento Protocol and Uniswap V3. Network fee paid in USDC.
        </p>
      </div>
      <SwapCard />
    </div>
  );
}
