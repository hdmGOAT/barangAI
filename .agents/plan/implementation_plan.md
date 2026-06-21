# LihokBarangAI — Frontend Implementation Plan

> AI-powered barangay incident management console. This plan transforms the 4 design mockups (Dashboard, Command Center, Map, Reports) into a modular, production-ready TanStack Start + shadcn/ui frontend.

---

## Current State

The project is a **pnpm monorepo** with Turborepo:
- `apps/web` — TanStack Start (React 19 + Vite 8 + TanStack Router) — currently has only a skeleton index page
- `packages/ui` — Shared UI library with shadcn/ui (radix-nova style), Tailwind CSS v4, Inter Variable font, only `Button` component exists
- `supabase/` — Backend with 4 migration files (`raw_messages`, `reports`, `pending_clarifications`, `believability`) and an ingest edge function (Telegram/SMS → Gemini LLM → Supabase)
- Design tokens already use OKLCH green primary (`oklch(0.508 0.118 165.612)`)

### Tech Stack Confirmed
| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start (SSR-capable React) |
| Router | TanStack Router (file-based) |
| UI Components | shadcn/ui (radix-nova) + custom |
| Styling | Tailwind CSS v4 + CSS variables |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL + Realtime) |
| Font | Inter Variable (already installed) |
| Build | Vite 8 + Turborepo |

---

## Proposed Changes

Changes are grouped by **module** and ordered by dependency (foundations first, then shell, then pages). Each module is independently implementable.

---

### Module 0: Design Token Foundation

> Update the CSS variable system to match the design mockups exactly. This is the prerequisite for all visual work.

#### [MODIFY] [globals.css](file:///e:/WORK/UP-HACKATHON/barangAI/packages/ui/src/styles/globals.css)

**Changes**:
1. Add semantic color tokens for urgency levels (`--urgency-critical`, `--urgency-high`, `--urgency-medium`)
2. Add heat map gradient tokens (`--heatmap-safe` through `--heatmap-critical`)
3. Add surface gray tokens (`--surface-50`, `--surface-100`)
4. Add status tokens (`--status-verified`, `--status-processing`, `--status-new`)
5. Extend the type scale with additional sizes for dashboard stat numbers
6. Add sidebar-specific active state colors matching the olive-green pill background from mockups
7. Add animation tokens (`--duration-fast: 150ms`, `--duration-normal: 200ms`, `--duration-slow: 300ms`)
8. Add the live alert bar color tokens (`--alert-red`, `--alert-red-bg`)

**Why**: The existing green primary is close but the design uses a richer spectrum. Urgency and status semantics are critical for this domain.

---

### Module 1: Shared Primitive Components (`packages/ui`)

> Reusable atoms used across all pages. Build these in the shared `@workspace/ui` package.

#### [NEW] `packages/ui/src/components/badge.tsx`
Urgency and status badges with variants: `critical`, `high`, `medium`, `low`, `verified`, `processing`, `new`. Follows shadcn/ui patterns with CVA.

#### [NEW] `packages/ui/src/components/card.tsx`
Base card surface with consistent `padding`, `border-radius`, `shadow`. Variants: `default`, `elevated`, `flush`.

#### [NEW] `packages/ui/src/components/avatar.tsx`
User avatar with image or fallback initials. Sizes: `sm`, `md`, `lg`.

#### [NEW] `packages/ui/src/components/input.tsx`
Form input component. Needed for search bars and message composers.

#### [NEW] `packages/ui/src/components/progress.tsx`
Horizontal progress/percentage bar used in Incident Categories and AI Urgency Score.

#### [NEW] `packages/ui/src/components/separator.tsx`
Horizontal/vertical divider line.

#### [NEW] `packages/ui/src/components/skeleton.tsx`
Loading shimmer placeholder. Used on every data-dependent component.

#### [NEW] `packages/ui/src/components/tooltip.tsx`
Hover tooltip for contextual information.

#### [NEW] `packages/ui/src/components/table.tsx`
Styled data table with header, body, row, cell sub-components. Used in SMS Feed and Incidents page.

#### [NEW] `packages/ui/src/components/tabs.tsx`
Tab navigation component for Settings page and time range toggles.

#### [NEW] `packages/ui/src/components/scroll-area.tsx`
Custom scrollbar area for log feeds and incident lists.

#### [NEW] `packages/ui/src/components/toggle-group.tsx`
Segmented control (24H / 7D / 30D) for the Reports time range selector.

**Installation note**: Most of these can be added via `pnpm dlx shadcn@latest add <component> -c apps/web` which places them in `packages/ui/src/components/`. Some need custom variants.

---

### Module 2: App Shell & Layout (`apps/web`)

> The persistent sidebar + topbar + live alert bar layout that wraps every page.

#### [NEW] `apps/web/src/components/layout/app-shell.tsx`
Root layout component rendering a CSS Grid:
```
grid-template-columns: 240px 1fr;
grid-template-rows: 56px 1fr 48px;
```
Grid areas: `sidebar`, `topbar`, `content`, `alertbar`.
Responsive: sidebar collapses at `<1024px`, hides at `<768px`.

#### [NEW] `apps/web/src/components/layout/sidebar.tsx`
Left navigation panel:
- Logo section ("LihokBarangAI" with brand mark)
- "Admin Console" subtitle
- Navigation links: Command Center, Map, Incidents, Reports, Settings
- Active state: olive-green pill background with left border accent
- Bottom: User profile card (avatar + name + role) + Sign Out link
- Lucide icons: `LayoutDashboard`, `Radio`, `Map`, `AlertTriangle`, `FileText`, `Settings`

#### [NEW] `apps/web/src/components/layout/sidebar-nav-item.tsx`
Single nav item with icon + label. Accepts `isActive` prop. Uses TanStack Router `<Link>` for navigation.

#### [NEW] `apps/web/src/components/layout/top-bar.tsx`
Top navigation bar:
- Search input with icon prefix ("Search incidents, reports, or citizens...")
- Notification bell icon (with optional badge count)
- User avatar button

#### [NEW] `apps/web/src/components/layout/live-alert-bar.tsx`
Bottom-pinned alert strip:
- Pulsing red broadcast icon (CSS animation)
- "LIVE ALERTS" label
- "Feed Active" status text
- Scrolling latest alert message
- Timestamp + expand chevron
- Uses `aria-live="polite"` for screen reader announcements

#### [MODIFY] [__root.tsx](file:///e:/WORK/UP-HACKATHON/barangAI/apps/web/src/routes/__root.tsx)
- Update page title to "LihokBarangAI"
- Add meta description for SEO
- Wrap `<Outlet>` in `<AppShell>` layout component
- Import Google Fonts link if needed (Inter is already bundled via fontsource)

---

### Module 3: Supabase Client & Data Hooks (`apps/web`)

> Data fetching layer connecting the frontend to Supabase.

#### [NEW] `apps/web/src/lib/supabase.ts`
Supabase client initialization using environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).

#### [NEW] `apps/web/src/lib/types.ts`
Frontend-specific TypeScript types derived from the backend `types.ts`:
- `Report`, `RawMessage`, `PendingClarification`
- `DashboardStats`, `IncidentCategory`, `TimeSeriesPoint`
- `UrgencyLevel`, `ConcernType`, `ReportStatus` enums

#### [NEW] `apps/web/src/hooks/use-reports.ts`
React hook for fetching reports with filters (status, urgency, date range). Returns `{ data, isLoading, error }`.

#### [NEW] `apps/web/src/hooks/use-dashboard-stats.ts`
Aggregation hook computing: total incidents, avg response time, dispatch efficiency, active patrols from `reports` table.

#### [NEW] `apps/web/src/hooks/use-realtime-reports.ts`
Supabase Realtime subscription hook for live incident updates. Broadcasts new reports to all connected components.

#### [NEW] `apps/web/src/hooks/use-incident-detail.ts`
Single incident fetch with joined raw messages and clarification data.

---

### Module 4: Dashboard Page (`/dashboard`)

> The primary view shown in Design Mockup #1.

#### [NEW] `apps/web/src/routes/dashboard.tsx`
Page route component composing all dashboard widgets.

#### [NEW] `apps/web/src/components/dashboard/stat-card.tsx`
Reusable metric card:
- Icon (circular colored background)
- Large number with unit (e.g., "4.2 mins")
- Trend indicator (↑12% in green or ↓ in red)
- Subtitle ("Target: Under 5 minutes")
- Optional: mini sparkline or bar visualization

Props: `{ icon, value, unit, label, trend, trendDirection, subtitle }`

#### [NEW] `apps/web/src/components/dashboard/active-patrol-badges.tsx`
Row of circular team badges (P1, P2, P3) with color coding + overflow counter (+39).

#### [NEW] `apps/web/src/components/dashboard/response-time-chart.tsx`
Area chart showing response time vs SLA target:
- X-axis: 08:00 → 04:00 (24h cycle)
- Y-axis: response time in minutes
- Green dashed SLA threshold line
- Green gradient fill under the curve
- Tooltip on hover

**Chart library**: Recharts (lightweight, React-native) or Chart.js via react-chartjs-2.

#### [NEW] `apps/web/src/components/dashboard/incident-category-list.tsx`
Horizontal bar chart:
- Category name left-aligned
- Filled green bar proportional to percentage
- Percentage value right-aligned
- Categories: Public Disturbance, Medical Emergency, Flood Safety, Traffic/Accident, Peace & Order
- "View Full Inventory" button at bottom

#### [NEW] `apps/web/src/components/dashboard/recent-incident-list.tsx`
Scrollable list of recent incidents:
- Urgency badge (CRITICAL / MEDIUM)
- Location pin icon + zone/purok text
- Cluster name (heading-weight)
- Relative time ("10m ago")

#### [NEW] `apps/web/src/components/dashboard/system-log-feed.tsx`
Compact log entries:
- Log message text
- Relative timestamp
- Auto-scroll to newest

#### [MODIFY] [index.tsx](file:///e:/WORK/UP-HACKATHON/barangAI/apps/web/src/routes/index.tsx)
Redirect `/` to `/dashboard` or make Dashboard the index route.

---

### Module 5: Command Center Page (`/command-center/$incidentId`)

> The incident deep-dive view shown in Design Mockup #3.

#### [NEW] `apps/web/src/routes/command-center.$incidentId.tsx`
Dynamic route page composing incident detail components.

#### [NEW] `apps/web/src/components/command-center/incident-header.tsx`
Top bar: urgency badge + location breadcrumb + "X Linked Reports" tag.

#### [NEW] `apps/web/src/components/command-center/incident-detail-card.tsx`
Two-column layout: incident photo (left) + "Current Condition" text block (right).

#### [NEW] `apps/web/src/components/command-center/dispatch-button.tsx`
Primary green CTA: Send icon + "Dispatch Response Team". Share button adjacent.

#### [NEW] `apps/web/src/components/command-center/ai-urgency-score.tsx`
Right panel widget:
- "AI Urgency Score" heading with "Real-time" badge
- Large number (98 /100)
- Green progress bar
- Reasoning text ("Based on report volume, keyword analysis...")

#### [NEW] `apps/web/src/components/command-center/raw-sms-feed.tsx`
Table component:
- Columns: Timestamp, Origin (phone number), Message Content, Status
- Status badges: VERIFIED (green), PROCESSING (orange)
- Real-time updates via Supabase Realtime

#### [NEW] `apps/web/src/components/command-center/citizen-update-loop.tsx`
Right panel widget:
- "Citizen Update Loop" heading
- "Broadcast Message" label
- Textarea for message composition
- Action icons (@ mention, schedule)
- "Send Alert" red/green button

#### [NEW] `apps/web/src/components/command-center/command-system-log.tsx`
Compact system log for this specific incident.

---

### Module 6: Map Page (`/map`)

> The geospatial view shown in Design Mockup #4.

#### [NEW] `apps/web/src/routes/map.tsx`
Full-bleed map page with floating UI panels.

#### [NEW] `apps/web/src/components/map/map-view.tsx`
Interactive map component:
- Dark-themed tile layer (Mapbox dark style or CartoDB dark)
- Incident markers with urgency-colored pins
- Heat layer for incident density
- Click marker → popup with incident summary
- **Library**: `react-map-gl` (Mapbox GL JS wrapper) or Leaflet

#### [NEW] `apps/web/src/components/map/map-controls.tsx`
Floating control buttons (bottom-left):
- Zoom in (+) / Zoom out (-)
- Center on user location
- Layer toggle (incidents / heat / patrols)

#### [NEW] `apps/web/src/components/map/personnel-panel.tsx`
Right-side floating card:
- "Personnel & Units" heading + online count badge
- List of `PersonnelCard` components
- "Manage All Teams" link at bottom

#### [NEW] `apps/web/src/components/map/personnel-card.tsx`
Individual team card:
- Icon + Team name (e.g., "BDRRMC Team Alpha")
- Location pin text
- Status indicator dots (green = online, red = offline)
- Action button: Deploy / Re-assign / Message

#### [NEW] `apps/web/src/components/map/emergency-dispatch-button.tsx`
Top-right floating red button: siren icon + "Emergency Dispatch".

---

### Module 7: Reports/Analytics Page (`/reports`)

> The analytics view shown in Design Mockup #2.

#### [NEW] `apps/web/src/routes/reports.tsx`
Analytics page composing stat cards + charts + heat map.

#### [NEW] `apps/web/src/components/reports/time-range-toggle.tsx`
Segmented control: 24H | 7D | 30D. Uses `toggle-group` primitive.

#### [NEW] `apps/web/src/components/reports/purok-heat-map.tsx`
Grid of zone cards:
- 6-column responsive grid
- Each card colored by incident density (olive gradient)
- Zone ID label + density level text
- Legend strip: Low → High

#### [NEW] `apps/web/src/components/reports/zone-card.tsx`
Single heat map cell:
- Zone identifier (ZONE 01, ZONE 02-03, etc.)
- Density label (Safe Level, Increased Activity, Moderate, High Density, Critical Area)
- Background color mapped from density to heat map gradient tokens

---

### Module 8: Incidents Page (`/incidents`)

#### [NEW] `apps/web/src/routes/incidents.tsx`
Tabular incident list page:
- Filter bar: search + urgency dropdown + status dropdown + date range
- Data table with sortable columns
- Pagination
- Click row → navigate to Command Center

---

### Module 9: Settings Page (`/settings`)

#### [NEW] `apps/web/src/routes/settings.tsx`
Tabbed settings interface:
- Profile tab: user info, role
- Notifications tab: alert preferences
- System tab: configuration

---

### Module 10: Route Registration & SEO

#### [MODIFY] [__root.tsx](file:///e:/WORK/UP-HACKATHON/barangAI/apps/web/src/routes/__root.tsx)
- Update title: "LihokBarangAI — Barangay Intelligence Console"
- Add meta description
- Add favicon references
- Wrap content in AppShell

#### Route files will auto-register via TanStack Router's file-based routing convention.

---

## Dependency Graph

```
Module 0 (Tokens) ──────────────────────────┐
                                             │
Module 1 (Primitives) ──────────────────────┤
                                             │
Module 2 (Shell) ────────────────────────────┤
                                             │
Module 3 (Data Hooks) ──────────────────────┤
                                             │
           ┌──────────┬──────────┬───────────┼──────────┬──────────┐
           │          │          │           │          │          │
        Module 4   Module 5   Module 6   Module 7   Module 8   Module 9
       Dashboard   Command     Map       Reports   Incidents  Settings
                   Center
```

Modules 4–9 are **independent** and can be built in parallel once Modules 0–3 are complete.

---

## Implementation Order & Parallelism

### Phase 1: Foundation (Sequential)
1. **Module 0**: Design tokens — 30 min
2. **Module 1**: Install shadcn primitives + custom Badge — 45 min
3. **Module 2**: App Shell (sidebar + topbar + live bar) — 2 hr
4. **Module 3**: Supabase client + data hooks — 1.5 hr

### Phase 2: Pages (Parallel)
These can each be assigned to separate agents/developers:

| Track A | Track B | Track C |
|---------|---------|---------|
| Module 4: Dashboard (2 hr) | Module 5: Command Center (2.5 hr) | Module 6: Map (3 hr) |
| Module 7: Reports (1.5 hr) | Module 8: Incidents (1.5 hr) | Module 9: Settings (1 hr) |

### Phase 3: Polish
- Module 10: Route registration + SEO
- Responsive testing at all breakpoints
- Accessibility audit
- Loading states (Skeleton) for all data-driven components
- Error states and empty states

---

## Verification Plan

### Automated
```bash
# Type-check the entire monorepo
pnpm typecheck

# Lint all files
pnpm lint

# Build to verify no compilation errors
pnpm build
```

### Manual Verification
1. Run `pnpm dev` and verify each page renders correctly
2. Compare visual output against the 4 design mockups
3. Test sidebar navigation between all pages
4. Verify responsive behavior at 375px, 768px, 1024px, 1440px
5. Verify live alert bar animation and presence on all pages
6. Test keyboard navigation and focus management
7. Verify Supabase data fetching with real or mock data

---

## Open Questions

> [!IMPORTANT]
> **Chart Library Choice**: The project doesn't currently include a chart library. Recommended: **Recharts** (React-native, lightweight, great for area/line charts). Alternative: **Tremor** (built on Recharts with pre-styled dashboard components that align with shadcn aesthetics). Which do you prefer?

> [!IMPORTANT]
> **Map Library Choice**: For the Map page, recommended: **react-map-gl** (Mapbox GL) for the dark-themed cartography shown in the mockup. Alternative: **react-leaflet** (free, no API key required). Mapbox provides the exact dark teal aesthetic from the design but requires an API key. Which do you prefer?

> [!IMPORTANT]
> **Auth & Role System**: The designs show different user roles (Brgy. Captain, Chief Officer, Barangay Admin with Level 4 Clearance). Supabase Auth is enabled in config. Should we implement role-based access control in this phase, or defer to a future iteration?

> [!IMPORTANT]
> **Supabase Connection**: The `.env.example` has Supabase credentials. For initial frontend development, should we use real Supabase data or create mock data fixtures? Mock data allows faster development without backend dependency.

> [!NOTE]
> **Dashboard Route**: The index page currently shows a "Project ready!" placeholder. Should `/` redirect to `/dashboard`, or should Dashboard be the index route itself (`/`)?

---

## File Tree (New Files)

```
apps/web/src/
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   ├── sidebar.tsx
│   │   ├── sidebar-nav-item.tsx
│   │   ├── top-bar.tsx
│   │   └── live-alert-bar.tsx
│   ├── dashboard/
│   │   ├── stat-card.tsx
│   │   ├── active-patrol-badges.tsx
│   │   ├── response-time-chart.tsx
│   │   ├── incident-category-list.tsx
│   │   ├── recent-incident-list.tsx
│   │   └── system-log-feed.tsx
│   ├── command-center/
│   │   ├── incident-header.tsx
│   │   ├── incident-detail-card.tsx
│   │   ├── dispatch-button.tsx
│   │   ├── ai-urgency-score.tsx
│   │   ├── raw-sms-feed.tsx
│   │   ├── citizen-update-loop.tsx
│   │   └── command-system-log.tsx
│   ├── map/
│   │   ├── map-view.tsx
│   │   ├── map-controls.tsx
│   │   ├── personnel-panel.tsx
│   │   ├── personnel-card.tsx
│   │   └── emergency-dispatch-button.tsx
│   └── reports/
│       ├── time-range-toggle.tsx
│       ├── purok-heat-map.tsx
│       └── zone-card.tsx
├── hooks/
│   ├── use-reports.ts
│   ├── use-dashboard-stats.ts
│   ├── use-realtime-reports.ts
│   └── use-incident-detail.ts
├── lib/
│   ├── supabase.ts
│   └── types.ts
└── routes/
    ├── __root.tsx (modified)
    ├── index.tsx (modified → redirect or dashboard)
    ├── dashboard.tsx
    ├── command-center.$incidentId.tsx
    ├── map.tsx
    ├── reports.tsx
    ├── incidents.tsx
    └── settings.tsx

packages/ui/src/
├── components/
│   ├── badge.tsx (new)
│   ├── card.tsx (new)
│   ├── avatar.tsx (new)
│   ├── input.tsx (new)
│   ├── progress.tsx (new)
│   ├── separator.tsx (new)
│   ├── skeleton.tsx (new)
│   ├── tooltip.tsx (new)
│   ├── table.tsx (new)
│   ├── tabs.tsx (new)
│   ├── scroll-area.tsx (new)
│   └── toggle-group.tsx (new)
└── styles/
    └── globals.css (modified)
```

**Total new files**: ~45
**Modified files**: 3 (`globals.css`, `__root.tsx`, `index.tsx`)
