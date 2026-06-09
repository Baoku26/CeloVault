import { USDC_ADAPTER, USDT_ADAPTER, TOKEN_ADDRESSES } from "./contracts";

const SIX_DECIMAL_TOKENS = new Set<string>([
  TOKEN_ADDRESSES.USDC.toLowerCase(),
  TOKEN_ADDRESSES.USDT.toLowerCase(),
]);

/**
 * Returns the correct feeCurrency address for a given token.
 * 6-decimal tokens (USDC, USDT) must use the adapter address.
 * 18-decimal tokens use the token address directly.
 */
export function getFeeCurrency(tokenAddress: `0x${string}`): `0x${string}` {
  const lower = tokenAddress.toLowerCase();
  if (lower === TOKEN_ADDRESSES.USDC.toLowerCase()) return USDC_ADAPTER;
  if (lower === TOKEN_ADDRESSES.USDT.toLowerCase()) return USDT_ADAPTER;
  return tokenAddress;
}

export const DEFAULT_FEE_CURRENCY = USDC_ADAPTER;

export { USDC_ADAPTER, USDT_ADAPTER };
