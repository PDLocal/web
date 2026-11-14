# PD Local vs. Steel City Backgammon — High-Level Comparison

_Last updated: 2026-07-24_

Both apps are forks of the **Epic Stack**, so they share the same foundation (React Router v7 SSR,
Prisma/SQLite on Fly.io + LiteFS, full auth stack, shadcn/Radix UI, Conform+Zod, Vitest/Playwright,
theme-switch infra). That shared baseline isn't the interesting part and is omitted here.

This doc captures only where they **diverge** — what SteelCityBg built on top of the base, and what
PD Local intends to do differently.

> **Starting point:** PD Local is currently the untouched Epic Stack demo — the "Epic Notes"
> branding, marketing pages, and Notes model are all boilerplate to be removed/replaced. SteelCityBg
> is a real, shipped product. So everything below is essentially the roadmap gap.

---

## Differences that matter

### 1. Content management (CMS)

- **SteelCityBg**: Headless **Sanity.io** — `@sanity/client` + `@portabletext/react` +
  `@sanity/image-url`. Content types: `event`, `eventAnnouncement`, `comingSoon`, `sundayUpdate`,
  `aboutPage`, `personCard`, `venue`/`venueSearch`, `faq`, etc. Fetched server-side in loaders via
  **GROQ**, rendered with `PortableText` + a custom `SanityImage` component. (Studio schema lives in
  a separate repo.)
- **PD Local**: **No CMS.** Marketing pages are hand-authored TSX.
- **Intent**: User wants "similar features to steelcitybg (e.g. sanity.io)" — so a Sanity
  integration is the largest structural addition on the roadmap.

### 2. Navbar

- **SteelCityBg**: Custom `NavLinks` in `root.tsx` — **Home, Events, Tournaments, About Us, FAQ,
  Contact**. Responsive (desktop logo, mobile hamburger), sticky with scroll-reveal border. Auth
  links commented out.
- **PD Local**: Stock minimal header (logo + user search + login button). No content tabs.
- **Intent**: "The navbar will be there from the start but will have different tabs." PD Local gets
  its own tab set from day one, distinct from SteelCityBg's backgammon tabs.

### 3. Theming (light vs. dark)

- **SteelCityBg**: Theme-switch infra exists but the site **hard-codes dark** (`<html className="dark">`,
  `Document` defaults to `'dark'`). Ships dark-only.
- **PD Local**: **Intent** — "both light and dark mode from the start." Keep the theme switch active;
  explicitly avoid SteelCityBg's dark-only pin.

### 4. Domain features SteelCityBg has (PD Local does not)

Mostly backgammon-specific — listed for reference, not as things to copy:

- **Swiss-system tournament engine** — Prisma models `Tournament`/`Player`/`Round`/`RoundPairing`
  with pairings, tie-breaks, byes, drop-outs; UI under `/tournaments`.
- **Events** — CMS-driven listing/detail, announcements, "coming soon" cards; venues carry
  **geopoints** (maps-capable).
- **Email campaigns** — react-email templates + CLI senders via **Resend**; homepage **newsletter
  signup** that upserts a Resend contact.
- **Contact form**, **FAQ**, richer **About** section.
- **Umami analytics** in `root.tsx`.

### 5. PD Local's distinctive direction (from CLAUDE.md)

Where PD Local will go that SteelCityBg doesn't:

- **Accessibility-first, everywhere** — users have motor challenges; every flow must be effortless by
  keyboard/mouse.
- **Location-based connection** — users register with a physical address to connect with others
  nearby (SteelCityBg has venue geopoints but no user-to-user location matching).
- **Privacy-forward, no ads, free forever** (donation/grant-funded) — no monetization surface.
- **Public access without login** — guidance available to everyone, logged in or not.

---

## Roadmap implications for PD Local

1. **Strip the Epic Stack demo** — remove "Epic Notes" branding, demo marketing pages, and (likely)
   the Notes model.
2. **Custom navbar with PD-specific tabs** from the start.
3. **Keep light + dark both active** — don't hard-code dark.
4. **Add Sanity.io** (or similar) for editorial content/guidance — biggest structural addition.
5. **Design for accessibility first** across every component.
6. **Location/address-based user connection** as a signature feature (new data model + privacy care).
