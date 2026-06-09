export type SwapSource = "mento" | "uniswap-v3";

export interface RateQuote {
  rate: number;
  amountOut: string;
  source: SwapSource;
  gas: string;
}

export interface RatesResponse {
  mento: RateQuote | null;
  uniswap: RateQuote | null;
  best: SwapSource;
  spread: number;
  timestamp: number;
}

export interface SwapParams {
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amountIn: bigint;
  minAmountOut: bigint;
  source: SwapSource;
}

export interface SwapResult {
  txHash: `0x${string}`;
  amountIn: string;
  amountOut: string;
  source: SwapSource;
  timestamp: number;
}

export interface SwapHistoryItem extends SwapResult {
  tokenIn: string;
  tokenOut: string;
  rate: number;
}
