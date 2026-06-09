import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:      "border-transparent bg-primary text-primary-foreground",
        secondary:    "border-border bg-surface-nested text-muted-foreground",
        outline:      "border-border text-muted-foreground",
        destructive:  "border-transparent bg-destructive/15 text-destructive",
        // State signals — only where agent state or confirmed action applies
        success:      "border-transparent bg-celo-green/10 text-celo-green",
        warning:      "border-border-strong text-muted-foreground",
        // Protocol source badges
        mento:        "border-transparent bg-celo-green/10 text-celo-green",
        "uniswap-v3": "border-border text-muted-foreground",
        // Token symbol badges — neutral; the symbol text carries identity
        USDm:  "border-border bg-surface-nested text-foreground",
        NGNm:  "border-border bg-surface-nested text-foreground",
        KESm:  "border-border bg-surface-nested text-foreground",
        GHSm:  "border-border bg-surface-nested text-foreground",
        EURm:  "border-border bg-surface-nested text-foreground",
        USDC:  "border-border bg-surface-nested text-foreground",
        USDT:  "border-border bg-surface-nested text-foreground",
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
