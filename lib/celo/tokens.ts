import { TOKEN_ADDRESSES } from "./contracts";

export interface TokenMetadata {
  symbol: string;
  name: string;
  decimals: number;
  address: `0x${string}`;
  color: string;
  flag?: string;
  priority: "core" | "extended" | "gas";
}

export const TOKENS: Record<string, TokenMetadata> = {
  USDm: {
    symbol: "USDm",
    name: "Mento Dollar",
    decimals: 18,
    address: TOKEN_ADDRESSES.USDm,
    color: "#35D07F",
    flag: "🇺🇸",
    priority: "core",
  },
  NGNm: {
    symbol: "NGNm",
    name: "Mento Naira",
    decimals: 18,
    address: TOKEN_ADDRESSES.NGNm,
    color: "#008751",
    flag: "🇳🇬",
    priority: "core",
  },
  KESm: {
    symbol: "KESm",
    name: "Mento Shilling",
    decimals: 18,
    address: TOKEN_ADDRESSES.KESm,
    color: "#006600",
    flag: "🇰🇪",
    priority: "extended",
  },
  GHSm: {
    symbol: "GHSm",
    name: "Mento Cedi",
    decimals: 18,
    address: TOKEN_ADDRESSES.GHSm,
    color: "#FCD116",
    flag: "🇬🇭",
    priority: "extended",
  },
  EURm: {
    symbol: "EURm",
    name: "Mento Euro",
    decimals: 18,
    address: TOKEN_ADDRESSES.EURm,
    color: "#003087",
    flag: "🇪🇺",
    priority: "extended",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    address: TOKEN_ADDRESSES.USDC,
    color: "#2775CA",
    flag: "🇺🇸",
    priority: "gas",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    address: TOKEN_ADDRESSES.USDT,
    color: "#26A17B",
    flag: "🇺🇸",
    priority: "gas",
  },
} as const;

export const CORE_TOKENS = Object.values(TOKENS).filter((t) => t.priority === "core");
export const DISPLAY_TOKENS = Object.values(TOKENS).filter(
  (t) => t.priority === "core" || t.priority === "extended"
);
export const ALL_TOKENS = Object.values(TOKENS);
