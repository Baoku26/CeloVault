"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap, Shield, CreditCard, Smartphone, Bot, Lock,
  ArrowRight, Github, ExternalLink, Clock, TrendingUp, Fuel,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "./MarketingNav";
import { AgentTickDemo } from "./AgentTickDemo";
import { DeveloperSection } from "./DeveloperSection";
import { fadeUp, staggerChildren, scaleIn } from "@/lib/motion";

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "#9226", label: "agentId" },
  { value: "7", label: "stablecoins" },
  { value: "60s", label: "check interval" },
  { value: "<$0.001", label: "avg gas cost" },
  { value: "1s", label: "Celo finality" },
];

const PROBLEMS = [
  {
    icon: Clock,
    title: "Manual monitoring is a second job",
    body: "The NGN/USD rate moves 24/7. Watching it manually means missed windows at 3am, while you're in a meeting, or just living your life.",
  },
  {
    icon: TrendingUp,
    title: "Rate windows close in minutes",
    body: "A good swap window can open and close faster than you can act. By the time you've approved the transaction, the rate has moved.",
  },
  {
    icon: Fuel,
    title: "Gas friction in CELO adds up",
    body: "Most wallets force you to hold CELO for gas. CVault pays gas in USDC via Celo's fee abstraction you never touch CELO.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Set your threshold",
    body: "Configure the rate you want e.g. swap when 1 USDm > 1,600 NGNm. Set minimum and maximum swap sizes.",
  },
  {
    n: "02",
    title: "Agent monitors continuously",
    body: "CVault queries Mento Protocol and Uniswap V3 in parallel every 60 seconds, comparing rates and calculating spread.",
  },
  {
    n: "03",
    title: "Swap executes automatically",
    body: "When your threshold is met, the agent executes at best rate. Gas paid in USDC. Receipt logged to ERC-8004 reputation registry.",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Best-rate routing",
    body: "Mento Protocol and Uniswap V3 queried in parallel. CVault always picks the better rate — you never leave money on the table.",
  },
  {
    icon: CreditCard,
    title: "Gas in USDC",
    body: "Fee abstraction via Celo CIP-64. The agent wallet never holds CELO. Every transaction uses the USDC gas adapter.",
  },
  {
    icon: Shield,
    title: "ERC-8004 trust layer",
    body: "Every autonomous swap submits reputation feedback onchain. Your agent builds a verifiable track record at 8004scan.io.",
  },
  {
    icon: Smartphone,
    title: "MiniPay ready",
    body: "Detects Opera MiniPay automatically. Auto-connects with no popup. Optimised for the 360px mobile viewport and 16M+ MiniPay users.",
  },
  {
    icon: Bot,
    title: "A2A API + MCP",
    body: "Other agents can quote rates and execute swaps via the REST A2A API. Developers get an MCP server for Claude, Cursor, and any MCP client. Full docs below.",
  },
  {
    icon: Lock,
    title: "Non-custodial",
    body: "Your keys, your tokens. CVault is a read+execute agent it never holds your funds, only executes swaps you've pre-authorised.",
  },
];

const TOKENS = [
  { flag: "🇺🇸", symbol: "USDm", name: "Mento Dollar" },
  { flag: "🇳🇬", symbol: "NGNm", name: "Mento Naira" },
  { flag: "🇰🇪", symbol: "KESm", name: "Mento Shilling" },
  { flag: "🇬🇭", symbol: "GHSm", name: "Mento Cedi" },
  { flag: "🇪🇺", symbol: "EURm", name: "Mento Euro" },
  { flag: "🇺🇸", symbol: "USDC", name: "USD Coin" },
  { flag: "🇺🇸", symbol: "USDT", name: "Tether USD" },
];

const TRUST = [
  { icon: Shield, label: "ERC-8004 Registered", sub: "agentId #9226 · Celo Mainnet" },
  { icon: Lock,   label: "Non-custodial", sub: "Your keys, your tokens" },
  { icon: Github, label: "Open source", sub: "github.com/Baoku26/CeloVault" },
];

// ─── Shared section wrapper ────────────────────────────────────────────────────

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      variants={fadeUp}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-80px" }}
      className={`max-w-6xl mx-auto px-4 lg:px-8 ${className}`}
    >
      {children}
    </motion.section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-4 lg:px-8 max-w-6xl mx-auto">
        <motion.div
          variants={staggerChildren}
          initial="initial"
          animate="animate"
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          <div className="space-y-7">
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="font-mono text-xs text-muted-foreground border-border gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-celo-green shadow-[0_0_6px_#35D07F]" />
                ERC-8004 Registered · Celo Mainnet · agentId #9226
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]"
            >
              Your stablecoins.{" "}
              <span className="text-muted-foreground">Working while you sleep.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              CVault monitors 7 stablecoins every 60 seconds and auto-swaps at your rate threshold gas paid in USDC, zero CELO required.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <Link href="/dashboard" className={buttonVariants({ size: "lg", className: "gap-2" })}>
                Launch App <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://github.com/Baoku26/CeloVault"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", size: "lg", className: "gap-2" })}
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            </motion.div>
          </div>

          <motion.div variants={scaleIn} className="flex justify-center lg:justify-end">
            <AgentTickDemo />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats bar ── */}
      <Section className="py-10">
        <div className="border border-border rounded-xl bg-surface">
          <motion.div
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-border"
          >
            {STATS.map(({ value, label }) => (
              <motion.div
                key={label}
                variants={fadeUp}
                className="flex flex-col items-center justify-center py-5 px-4 gap-1"
              >
                <span className="font-mono text-2xl font-semibold text-celo-gold tabular-nums">{value}</span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── Problem ── */}
      <Section className="py-24 space-y-12">
        <div className="space-y-3 max-w-xl">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">The problem</p>
          <h2 className="text-3xl font-semibold tracking-tight">
            The NGN/USD rate moves while you&apos;re asleep.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            African stablecoin holders lose value not from bad assets but from friction, timing, and manual processes that no longer need to be manual.
          </p>
        </div>

        <motion.div
          variants={staggerChildren}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {PROBLEMS.map(({ icon: Icon, title, body }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              className="rounded-xl border border-border bg-surface p-5 space-y-3"
            >
              <div className="w-8 h-8 rounded-md bg-surface-nested border border-border flex items-center justify-center">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm">{title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ── How it works ── */}
      <Section className="py-24 space-y-12">
        <div className="space-y-3 max-w-xl">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">How it works</p>
          <h2 className="text-3xl font-semibold tracking-tight">Set it. Forget it. Watch it work.</h2>
        </div>

        <motion.div
          variants={staggerChildren}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {STEPS.map(({ n, title, body }) => (
            <motion.div key={n} variants={fadeUp} className="space-y-4">
              <span className="font-mono text-4xl font-semibold text-celo-gold tabular-nums">{n}</span>
              <div className="space-y-2">
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ── Features ── */}
      <Section className="py-24 space-y-12">
        <div className="space-y-3 max-w-xl">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Features</p>
          <h2 className="text-3xl font-semibold tracking-tight">Built for serious stablecoin holders.</h2>
        </div>

        <motion.div
          variants={staggerChildren}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <motion.div
              key={title}
              variants={scaleIn}
              className="rounded-xl border border-border bg-surface p-5 space-y-3 hover:border-border-strong transition-colors"
            >
              <div className="w-8 h-8 rounded-md bg-surface-nested border border-border flex items-center justify-center">
                <Icon className="h-4 w-4 text-celo-green" />
              </div>
              <p className="font-medium text-sm">{title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ── Developer / A2A + MCP ── */}
      <DeveloperSection />

      {/* ── Tokens ── */}
      <Section className="py-24 space-y-10">
        <div className="space-y-3">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Supported tokens</p>
          <h2 className="text-3xl font-semibold tracking-tight">African currencies are first-class.</h2>
          <p className="text-muted-foreground max-w-lg leading-relaxed">
            CVault treats ₦, KES, and GHS as primary assets — not exotic add-ons. Seven stablecoins monitored in every tick.
          </p>
        </div>

        <motion.div
          variants={staggerChildren}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-80px" }}
          className="flex flex-wrap gap-3"
        >
          {TOKENS.map(({ flag, symbol, name }) => (
            <motion.div
              key={symbol}
              variants={scaleIn}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-4 py-2.5"
            >
              <span className="text-lg leading-none">{flag}</span>
              <div>
                <p className="font-mono text-sm font-medium tabular-nums">{symbol}</p>
                <p className="text-[11px] text-muted-foreground">{name}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ── Trust bar ── */}
      <Section className="py-12">
        <div className="rounded-xl border border-border bg-surface">
          <motion.div
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border"
          >
            {TRUST.map(({ icon: Icon, label, sub }) => (
              <motion.div
                key={label}
                variants={fadeUp}
                className="flex items-center gap-3 px-6 py-5"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{sub}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── Final CTA ── */}
      <Section className="py-24">
        <div className="rounded-2xl border border-border bg-surface p-10 lg:p-16 text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight">
            Ready to automate your FX?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            No signup. No custody. Connect your wallet and configure your threshold in under a minute.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard" className={buttonVariants({ size: "lg", className: "gap-2" })}>
              Launch App <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://8004scan.io/agents/celo/9226"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "ghost", size: "lg", className: "gap-2 text-muted-foreground hover:text-foreground" })}
            >
              View on 8004scan <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </Section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-center sm:text-left">
            <p className="font-mono font-semibold text-celo-green">CVault</p>
            <p className="text-xs text-muted-foreground">Built in Lagos on Celo.</p>
          </div>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <a
              href="https://github.com/Baoku26/CeloVault"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
            <a
              href="https://8004scan.io/agents/celo/9226"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              8004scan
            </a>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Launch App
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
