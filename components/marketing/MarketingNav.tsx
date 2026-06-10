"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
        <span className="font-mono text-lg font-semibold text-celo-green tracking-tight">
          CVault
        </span>

        <div className="flex items-center gap-3">
          <a
            href="https://8004scan.io/agents/celo/9226"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
          >
            #9226 on 8004scan ↗
          </a>
          <Link href="/dashboard" className={cn(buttonVariants({ size: "sm" }))}>
            Launch App →
          </Link>
        </div>
      </div>
    </header>
  );
}
