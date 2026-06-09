"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, History, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/swap", label: "Swap", icon: ArrowLeftRight },
  { href: "/history", label: "History", icon: History },
  { href: "/agent", label: "Agent", icon: Bot },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 border-r border-border bg-background h-screen sticky top-0 py-6 px-3 shrink-0">
      <div className="flex items-center gap-2 px-3 mb-8">
        <span className="text-lg font-semibold tracking-tight text-celo-green">CeloVault</span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-surface text-foreground font-medium"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-celo-green")} />
              {label}
              {active && (
                <span className="ml-auto w-1 h-4 rounded-full bg-celo-green" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
