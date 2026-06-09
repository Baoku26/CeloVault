export interface TokenBalance {
  symbol: string;
  address: `0x${string}`;
  raw: string;
  formatted: string;
  usd: string;
  decimals: number;
}

export interface BalancesResponse {
  balances: Record<string, TokenBalance>;
  totalUsd: string;
  timestamp: number;
}
