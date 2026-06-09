import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border text-foreground",
        success: "border-transparent bg-emerald-900/40 text-emerald-400",
        warning: "border-transparent bg-amber-900/40 text-amber-400",
        // Token variants
        USDm: "border-transparent bg-emerald-900/30 text-emerald-400",
        NGNm: "border-transparent bg-green-900/30 text-green-400",
        KESm: "border-transparent bg-green-900/30 text-green-500",
        GHSm: "border-transparent bg-yellow-900/30 text-yellow-400",
        EURm: "border-transparent bg-blue-900/30 text-blue-400",
        USDC: "border-transparent bg-blue-900/30 text-blue-500",
        USDT: "border-transparent bg-teal-900/30 text-teal-400",
        mento: "border-transparent bg-emerald-900/40 text-emerald-400",
        "uniswap-v3": "border-transparent bg-pink-900/40 text-pink-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
