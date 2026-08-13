# UPSC Labs

A hub of interactive tools for UPSC civil services preparation. One Next.js app, route-based tools, a central registry. The homepage is the hub; each tool lives at its own route under a GS-paper folder.

## Stack

Next.js (App Router) · React · TypeScript · d3-geo · Tailwind CSS v4 · next/font. Deploys to Vercel with zero config.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

Routes to check: `/` (hub), `/gs1` (section index), `/gs1/ancient-india-timeline` (tool).

## Architecture: hub and spoke

```
app/
  layout.tsx                 brand shell (Header + Footer) + fonts
  page.tsx                   THE HUB — hero, featured tools, newsletter
  gs1/
    page.tsx                 GS1 section index (lists GS1 tools)
    ancient-india-timeline/
      page.tsx               the timeline tool
  api/subscribe/route.ts     newsletter endpoint
components/
  site/  Header  Footer  ToolCard  NewsletterSignup  site.css
  AncientIndiaTimeline.tsx  AncientIndiaTimeline.css
lib/
  tools.ts                   REGISTRY — every listing page reads this
  dynasties.ts  southAsia.json  borders.json
```

`lib/tools.ts` is the spine: the hub and section pages render from it, so a tool appears everywhere automatically once registered.

## Adding a new tool (the repeatable recipe)

1. **Build the component** in `components/` (+ any data in `lib/`).
2. **Create the route** — e.g. `app/gs3/ramsar-sites/page.tsx` — with its own `metadata`, rendering the component.
3. **Register it** — append one entry to `TOOLS` in `lib/tools.ts`:

```ts
{
  slug: "ramsar-sites",
  href: "/gs3/ramsar-sites",
  title: "Ramsar Sites — Active Recall",
  blurb: "Test yourself on India's wetlands of international importance, on the map.",
  paper: "GS3",
  topic: "Environment",
  status: "new",
  accent: "#3F7C7A",
}
```

The hub and the `/gs3` index pick it up with no further changes. (Add an `app/gs3/page.tsx` mirroring `app/gs1/page.tsx` for the section index.)

## Newsletter

`POST /api/subscribe` validates the email and forwards it to your provider. With no key set it accepts the email (dev stub), so the form works immediately.

To go live: set `NEWSLETTER_API_KEY` in Vercel → Settings → Environment Variables, and adjust the provider call in `app/api/subscribe/route.ts` (a Buttondown example is included; MailerLite / Web3Forms work the same way).

## Branding

All shell components share brand tokens defined in `app/globals.css` `:root` (ink / stone / paper palette) and the next/font typefaces (Fraunces display, Inter body, Space Mono labels). The timeline tool keeps its own scoped copy of the tokens so it stays self-contained.

## Deploy

Push to Git → import at [vercel.com/new](https://vercel.com/new) (defaults work), or `vercel`. Point a domain (e.g. `upsclabs.in`) at the project when ready.
