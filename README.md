# Wibo — AI Native CRM

An AI-native CRM, inspired by Attio's clean record-first design and built around an
"Ask anything" prompt as the primary entry point.

## What's here

- **Home** — greeting, AI prompt bar with suggestions, stats, "my open deals" stream,
  meetings & tasks placeholders.
- **People** — full contacts table with avatar, role, company logo, email,
  last-contacted relative time, and owner.
- **Companies** — table with logo, industry, size, location, people/deal counts,
  ARR, owner, and creation date.
- **Pipeline** — Kanban board across 6 stages (Lead → Qualified → Proposal →
  Negotiation → Won / Lost) with deal cards showing value, expected close, primary
  contact, probability, and owner.

The sidebar mirrors Attio's structure: workspace switcher, quick search (⌘K),
main nav (Home, Notifications, Tasks, Notes, Emails, Calls, Reports, Automations),
Records (Companies, People, Pipeline), Lists, Chats, and trial footer.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19
- TypeScript
- Tailwind CSS v4
- Lucide icons
- Mock data in `src/lib/data.ts` (no DB yet)

## Develop

```
npm install
npm run dev
```

Open http://localhost:3000.

## Project layout

```
src/
  app/
    layout.tsx          # shell with Sidebar
    page.tsx            # Home
    people/page.tsx
    companies/page.tsx
    pipeline/page.tsx
  components/
    Sidebar.tsx
    TopBar.tsx
    PageHeader.tsx
    ViewToolbar.tsx
    AIPromptBar.tsx
    Avatar.tsx
    PipelineBoard.tsx
  lib/
    types.ts            # Company, Person, Deal, Stage
    data.ts             # seed people / companies / deals
    utils.ts            # cn, formatCurrency, formatDate, relativeTime
```

## Next steps

- Wire the AI prompt to a real model (Claude API) with workspace context.
- Persist records in a database (Postgres + Drizzle, or SQLite for dev).
- Detail pages for a single company / person / deal.
- Drag-and-drop on the pipeline board.
- Authentication and multi-workspace support.
