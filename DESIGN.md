---
name: CeloVault
description: Autonomous stablecoin FX agent for African currency markets on Celo.
colors:
  harmattan-green: "#35D07F"
  market-gold: "#FBCC5C"
  void-black: "#0A0A0A"
  surface: "#121212"
  surface-nested: "#1A1A1A"
  ink: "#FAFAFA"
  muted: "#999999"
  border: "#212121"
  border-strong: "#333333"
  error-red: "#DC2626"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Geist Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.04em"
  amount:
    fontFamily: "Geist Mono, monospace"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1
    fontFeature: "tnum"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.harmattan-green}"
    textColor: "#09090B"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "#2EBA70"
    textColor: "#09090B"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-outline-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-ghost-celo:
    backgroundColor: "transparent"
    textColor: "{colors.harmattan-green}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  inner-container:
    backgroundColor: "{colors.surface-nested}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: CeloVault

## 1. Overview

**Creative North Star: "The Night Watchman"**

The CeloVault interface is the Night Watchman's activity log. The agent operates while the user sleeps — scanning rates every 60 seconds, executing swaps the moment a threshold is crossed, logging every transaction to the Celo blockchain. The dashboard does not offer controls because the agent does not need supervision. It offers a precise, timestamped record of what happened, what is being watched, and what will happen when the next threshold is crossed.

Every design decision descends from this premise. The surface is near-black (#0A0A0A) because a vigilant tool does not advertise itself. Monospace numerals carry the weight of every balance, rate, address, and countdown. Color appears only when the agent has acted or a threshold has meaning: Harmattan Green for confirmation and live activity, Market Gold for rate emphasis and threshold proximity. Decoration is absent not from restraint but from purpose — there is nothing decorative about ₦1,620 per dollar at 3am.

This system explicitly rejects four aesthetic families, per the product brief: the purple-gradient DeFi aesthetic (glassmorphic panels, neon accents, glowing orbs not earned by state); the Revolut/Wise western neobank look (corporate blue, productivity-optimism, white backgrounds built for London); the SaaS metrics dashboard (navy plus orange, hero-metric template with big number and small label, identical card grids); and the crypto exchange (candlestick density, orderbook panels, trading terminal chrome). None of these were designed for someone monitoring the NGN/USD rate from Lagos or Nairobi. CeloVault was.

**Key Characteristics:**
- Three-layer tonal depth (Void Black → Surface → Nested Surface) creates containment without shadows
- Geist Sans for everything human-authored; Geist Mono for every financial figure, address, and hash
- Harmattan Green as a signal color: reserved for confirmed agent actions, active states, and primary CTAs
- Market Gold for rate threshold emphasis and secondary data highlights
- Terminal-adjacent interaction: borderless inputs inside tonal containers, flat buttons, tint-shift hover states
- The single glow (`0 0 6px #35D07F`) appears only on the active agent status dot — earned by state, never decorative

## 2. Colors

The palette is achromatic at its base and chromatic at its signal points. Nine of ten pixels are dark neutrals that form the operational surface. Harmattan Green and Market Gold are earned by context — they appear when something has happened or is about to.

### Primary
- **Harmattan Green** (#35D07F, ~9.8:1 on Void Black, ~9.5:1 on Surface): Confirmation, agent activity, primary actions, active navigation indicators. Named after the Saharan harmattan wind that defines West African dry seasons — periodic, directional, unmistakably African. Used exclusively where states have meaning: agent active, swap confirmed, action available. Never applied as background decoration or brand color on static surfaces.

### Secondary
- **Market Gold** (#FBCC5C, ~13.3:1 on Void Black): Rate emphasis, threshold proximity indicators, secondary data highlights. The color of a number the user has been waiting for. Used at ≤15% of any screen's visual weight.

### Neutral
- **Void Black** (#0A0A0A): Base background. The operational surface upon which all content layers rest. Dark-only; never lightened or tinted.
- **Surface** (#121212): Component and card background. The primary container layer. One step up from Void Black.
- **Nested Surface** (#1A1A1A / `zinc-900/50`): Inner containers within cards — input fields, stat tiles, confirmation rows. Never more than one level below Surface.
- **Ink** (#FAFAFA): Primary text. Near-white, not pure white. ~21:1 contrast on Void Black.
- **Muted** (#999999): Secondary text — labels, metadata, supporting figures. ~8:1 on Surface; exceeds WCAG AA for all text sizes, including 12px.
- **Border** (#212121): Default dividers and container edges. Subtle; present not decorative.
- **Border Strong** (#333333): Emphasized dividers, hover-state borders, active container edges.
- **Error Red** (#DC2626): Destructive actions, failed swaps, error states.

**The Signal Rule.** Harmattan Green and Market Gold appear only in response to data or agent state — not as background decoration, brand color on static chrome, or gradient components. If a screen has no confirmed action and no active threshold, neither color appears on it.

**The One-Nesting Rule.** Surface tones stack at most two levels: Surface (#121212) containing Nested Surface (#1A1A1A). A third nested level is a layout problem, not a color problem.

## 3. Typography

**Body / UI Font:** Geist (geometric sans; loaded via the `geist` npm package)
**Data / Mono Font:** Geist Mono

**Character:** One family, two modalities. The switch between them is the semantic separator. Geist Sans carries every word a human wrote: navigation labels, button copy, section headers, error messages. Geist Mono carries every value derived from the chain or arithmetic: balances, rates, addresses, hashes, countdowns, timestamps. The boundary between them is enforced, not suggested.

### Hierarchy
- **Display** (Semibold 600, 1.5rem / 24px, lh 1.2, ls -0.02em): Page headings, section titles. Used sparingly — typically once per major surface. Geist Sans.
- **Headline** (Semibold 600, 1.125rem / 18px, lh 1.4, ls -0.01em): Card section headers, sidebar brand mark. Geist Sans.
- **Title** (Medium 500, 0.875rem / 14px, lh 1.5): Component labels, nav item text, list item names. Geist Sans.
- **Body** (Regular 400, 0.875rem / 14px, lh 1.6): Supporting copy, descriptions. Max 65ch line length. Geist Sans.
- **Label** (Mono Medium 500, 0.75rem / 12px, ls 0.04em): Token symbols (USDm, KESm, NGNm), uppercase metadata, status chip text. Geist Mono. No all-caps prose — labels only.
- **Amount** (Mono Medium 500, 1.5rem / 24px, lh 1, `font-variant-numeric: tabular-nums`): Balance figures, rate displays, all financial quantities. Geist Mono.

**The Mono Gate Rule.** If a string was generated by arithmetic or read from onchain state — balance, rate, fee, tx hash, countdown timer, block number, address — it renders in Geist Mono with `font-variant-numeric: tabular-nums`. No exceptions. Human-authored copy renders in Geist Sans.

**The Scale Economy Rule.** Four type sizes in active use: 24px (amount), 18px (headline), 14px (body/title), 12px (label). Do not introduce intermediate sizes (16px, 15px, 13px) to resolve spacing problems. Solve layout in the layout, not with an extra type size.

## 4. Elevation

This system is flat by default. Depth is conveyed through three surface tones, not box-shadow values. The tonal stack — Void Black (#0A0A0A) → Surface (#121212) → Nested Surface (#1A1A1A) — creates clear containment without any shadow vocabulary.

The single exception: when the agent is active, an 8px status dot carries `box-shadow: 0 0 6px #35D07F`. This is not decoration and not a shadow in the traditional sense — it is a state signal. Its earned quality is the point: the only glow in the system appears when the agent is actually running.

**The Flat-By-Default Rule.** At rest, every surface is flat. Depth is established through tone alone. If a component appears to need a drop shadow for visual separation, the layout needs restructuring, not a new shadow.

**The Single Glow Rule.** `box-shadow: 0 0 6px #35D07F` appears only on the active agent status dot. Do not apply glow to buttons, cards, inputs, tabs, or navigation elements. Its scarcity makes it instantly legible as a live-agent signal.

## 5. Components

The system is terminal-adjacent: forms and inputs are borderless within tonal containers, buttons are flat without raised states, hover shifts tint rather than depth.

### Buttons
- **Shape:** Slightly rounded (6px / `rounded-md`). Precise without being boxy.
- **Primary:** Harmattan Green background (#35D07F), near-black text (#09090B). 10px / 16px padding. Height 40px default, 44px large (`h-11`). Hover: #2EBA70 (tint shift, ~10% darker). Disabled: 50% opacity, no pointer events. Focus: 2px Harmattan Green ring with 2px offset.
- **Outline:** Transparent background, 1px Border (#212121) edge, Ink text (#FAFAFA). Hover: Surface background (#121212). Same focus ring.
- **Ghost Celo:** Transparent background, Harmattan Green text. Hover: Surface tint background. Used for secondary actions in agent and nav contexts.
- **Destructive:** Error Red (#DC2626) background, Ink text. Same shape and padding as Primary.

### Cards / Containers
Three levels of containment; no shadows.

- **Card:** Surface (#121212) background, 12px radius (`rounded-xl`), 1px Border (#212121) edge, 16px padding. Hover border shifts to Border Strong (#333333). Framer Motion `fadeUp` entrance on first render (0.25s, ease `[0.16, 1, 0.3, 1]`).
- **Inner Container:** Nested Surface (`bg-zinc-900/50` / #1A1A1A), 8px radius (`rounded-lg`), 1px Border edge, 16px padding. Used inside cards for input areas, stat tiles, and confirmation rows. The content-bearing floor.
- **The Two-Level Rule.** Cards contain Inner Containers. Inner Containers contain data. No further nesting.

### Inputs / Fields
Borderless within their container context. The Inner Container provides the visual boundary.

- **Text / Number Input:** Full-width, `bg-transparent`, no border, no visible outline. Geist Mono, 24px (Amount role), Medium weight, `tabular-nums`. Foreground (#FAFAFA) text. Placeholder in Muted (#999999) — 4.5:1+ on all nested surfaces.
- **Spin buttons suppressed** (`appearance: textfield` with `::-webkit-inner-spin-button` hidden). These are amount entry fields, not quantity steppers.
- **Focus:** No visible outline on the input itself. The parent Inner Container defines the boundary; a focus ring on the inner input is visual noise.

### Navigation (Sidebar)
- **Container:** Void Black background (#0A0A0A), 1px right Border (#212121), 224px width, sticky full-viewport height, 24px vertical / 12px horizontal padding.
- **Brand mark:** "CeloVault" in Headline weight, Harmattan Green. The only Harmattan Green on a static (non-state) surface — the brand name is the exception that proves the Signal Rule.
- **Nav item (default):** Muted (#999999) text, transparent background, 8px radius, 12px / 8px padding. Hover: Surface (#121212) background, Ink (#FAFAFA) text.
- **Nav item (active):** Surface (#121212) background, Ink text, Title weight (500). Active icon in Harmattan Green. 4px × 16px Harmattan Green rounded-full pip flush to the right edge of the item.

### Tab Selector (Swap)
- **Container:** Full-width flex row, 1px bottom Border (#212121).
- **Tab (default):** Muted text, transparent background, Geist Mono, uppercase, 0.05em+ letter-spacing (Label role), 10px vertical padding.
- **Tab (active):** Harmattan Green text, Harmattan Green tint background (`rgba(53, 208, 127, 0.10)`), 2px `border-bottom` in Harmattan Green. Semibold weight.
- **The 2px Bottom Border Rule.** Active tab state is communicated by a 2px `border-bottom` at Harmattan Green. The tint background is secondary context. Never use a filled Harmattan Green background for tab active state.

### Agent Status Indicators
- **Active dot:** 8px × 8px circle, Harmattan Green fill, `box-shadow: 0 0 6px #35D07F`. The only glow in the system.
- **Paused dot:** 8px × 8px circle, #525252 (`zinc-600`) fill. No glow.
- **Status badge:** Geist Mono, 10px (`text-[10px]`), uppercase, 6px / 2px padding. Active: Harmattan Green tint background + Harmattan Green text. Paused: transparent background + Border (#212121) edge + Muted text.

### Data Rows (Confirmation / Detail Lists)
- **Structure:** Flex row, `justify-between`, full-width. Divider via `divide-y divide-border`.
- **Label (left):** Muted (#999999), Body / Title size (14px), Geist Sans.
- **Value (right):** Ink (#FAFAFA), 14px Geist Mono, `tabular-nums`, right-aligned.
- **Row padding:** 10px vertical / 16px horizontal. No padding collapse; each row gets full vertical breathing room.

## 6. Do's and Don'ts

### Do:
- **Do** use Harmattan Green (#35D07F) only on confirmed states, active agent indicators, and primary CTAs. Every additional use dilutes its signal value.
- **Do** render every financial figure — balances, rates, fees, tx hashes, addresses, countdowns — in Geist Mono with `font-variant-numeric: tabular-nums`. The Mono Gate Rule is absolute.
- **Do** use three surface tones (Void Black → Surface → Nested Surface) for visual hierarchy before considering any other approach. Tone solves depth; shadows do not.
- **Do** keep placeholder text in Muted (#999999) and verify it exceeds 4.5:1 on its parent surface. Do not reduce it further for visual elegance.
- **Do** write all button labels as verb + object: "Review Swap", "Confirm Swap", "Activate agent", "New Swap". Never "OK", "Proceed", or "Yes".
- **Do** show Market Gold (#FBCC5C) on rate values when a threshold is approached or active. Its appearance should feel like a signal.
- **Do** treat the MiniPay mobile viewport (360px minimum) as the primary responsive target, not a degraded desktop fallback.
- **Do** wrap card and stat entrances in Framer Motion `fadeUp` (0.25s, `[0.16, 1, 0.3, 1]` easing). Motion communicates that data has arrived; it is not decoration.
- **Do** provide `@media (prefers-reduced-motion: reduce)` alternatives for all Framer Motion animations. Replace transforms with an opacity crossfade.

### Don't:
- **Don't** use purple gradients, neon accents (other than Harmattan Green in state contexts), or glassmorphic panels. CeloVault is not a generic DeFi product.
- **Don't** apply the Revolut or Wise visual language: corporate blue, white or light backgrounds, soft color pops on a light surface. That aesthetic was built for London.
- **Don't** build a hero-metric card (big number, small label, gradient accent, supporting stats row). The agent's swap count is data, not a hero.
- **Don't** render crypto exchange UI: candlestick charts, orderbook depth panels, red/green trading terminal density. This is a treasury tool.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored stripe on cards, list items, or alerts. Rewrite with full borders, background tints, or leading icons.
- **Don't** use gradient text (`background-clip: text` with a gradient). Emphasis is weight or size; never gradient.
- **Don't** nest more than two surface levels. Card → Inner Container is the limit. A third level is a layout failure.
- **Don't** replicate `box-shadow: 0 0 6px #35D07F` on anything except the active agent status dot. Scarcity is what makes it a signal.
- **Don't** build identical card grids. Balance cards repeat in a grid, but each token carries distinct contextual identity (flag, local currency name, color association).
- **Don't** introduce colors outside the defined palette — no hardcoded one-off hex values scattered in components. Normalize new values into the token set and update this document.
- **Don't** add all-caps body copy or uppercase running prose. Uppercase is reserved for Label-role tokens (token symbols, metadata chips) only.
