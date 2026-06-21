# LihokBarangAI — Frontend Design System

> **Product**: LihokBarangAI — AI-powered barangay incident management & citizen response console
> **Audience**: Barangay Captains, BDRRMC Leads, Chief Officers, Barangay Admins (Philippine local government)
> **Single Job**: Real-time situational awareness and rapid incident response coordination

---

## 1. Design Identity

### Brand Personality
LihokBarangAI is a **command-grade civic tool** — authoritative but approachable, data-rich but scannable. The visual language borrows from **military/emergency operations centers** softened by the warmth of community governance. Every pixel should communicate: *"Your barangay is monitored. Help is organized. Nothing slips through."*

### Signature Element
**The Pulsing Live Feed Bar** — a persistent bottom-mounted alert strip with a red broadcast icon and scrolling real-time incident feed. This is the single memorable element that anchors the entire interface. It pulses gently to indicate active monitoring, creating a sense of a living, breathing system.

---

## 2. Color Palette

All colors are defined in OKLCH for perceptual uniformity. The palette is **forest-institutional green** — not generic emerald, but the deep olive-to-sage spectrum found in Philippine government signage and military markings.

| Token | OKLCH Value | Hex (approx) | Role |
|-------|-------------|--------------|------|
| `--lihok-green-900` | `oklch(0.25 0.06 160)` | `#1B3A2A` | Sidebar background, deepest accent |
| `--lihok-green-700` | `oklch(0.40 0.10 162)` | `#2D6B48` | Primary buttons, active nav items |
| `--lihok-green-500` | `oklch(0.55 0.13 164)` | `#3D9B65` | Chart lines, SLA trend curves |
| `--lihok-green-300` | `oklch(0.75 0.10 165)` | `#7CC89A` | Active nav highlight pill background |
| `--lihok-green-100` | `oklch(0.92 0.04 166)` | `#D4F0DF` | Subtle tints, badge backgrounds |
| `--lihok-green-50` | `oklch(0.97 0.02 166)` | `#EEFAF2` | Sidebar active item background |
| `--surface-white` | `oklch(1.00 0 0)` | `#FFFFFF` | Card backgrounds, main content area |
| `--surface-gray-50` | `oklch(0.975 0 0)` | `#F8F9FA` | Page background, content area |
| `--surface-gray-100` | `oklch(0.95 0 0)` | `#F1F3F5` | Dividers, table header backgrounds |
| `--text-primary` | `oklch(0.15 0 0)` | `#1A1A1A` | Headlines, primary text |
| `--text-secondary` | `oklch(0.45 0 0)` | `#6B7280` | Descriptions, secondary labels |
| `--text-muted` | `oklch(0.60 0 0)` | `#9CA3AF` | Timestamps, helper text |
| `--urgency-critical` | `oklch(0.55 0.22 25)` | `#DC2626` | Critical badge background |
| `--urgency-critical-text` | `oklch(0.98 0.02 25)` | `#FEF2F2` | Critical badge text |
| `--urgency-high` | `oklch(0.65 0.18 55)` | `#EA580C` | High urgency indicator |
| `--urgency-medium` | `oklch(0.75 0.15 85)` | `#CA8A04` | Medium urgency/warning |
| `--urgency-low` | `oklch(0.55 0.13 164)` | `#3D9B65` | Low urgency (reuses primary green) |
| `--status-verified` | `oklch(0.55 0.13 164)` | `#3D9B65` | Verified badge |
| `--status-processing` | `oklch(0.65 0.18 55)` | `#EA580C` | Processing badge |
| `--status-new` | `oklch(0.55 0.15 250)` | `#3B82F6` | New status indicator |
| `--heatmap-safe` | `oklch(0.85 0.10 130)` | `#C5D4A0` | Safe zone (olive-khaki) |
| `--heatmap-moderate` | `oklch(0.70 0.14 110)` | `#9AAF5C` | Moderate zone |
| `--heatmap-high` | `oklch(0.55 0.15 100)` | `#6B8A33` | High density zone |
| `--heatmap-critical` | `oklch(0.40 0.12 90)` | `#4A6520` | Critical density zone |

### Heat Map Gradient (Reports Page)
The Purok Heat Map uses an **olive-to-forest gradient** reflecting the map page's dark teal cartography aesthetic:
- Safe → Increased Activity → Moderate → High Density → Critical Area

---

## 3. Typography

### Typeface Selection

| Role | Family | Weight | Size | Tracking |
|------|--------|--------|------|----------|
| **Display / Hero Numbers** | Inter Variable | 700 (Bold) | 36–48px | `-0.02em` |
| **Section Headings** | Inter Variable | 600 (SemiBold) | 18–22px | `-0.01em` |
| **Card Titles** | Inter Variable | 600 (SemiBold) | 14–16px | `0` |
| **Body / Table Data** | Inter Variable | 400 (Regular) | 13–14px | `0` |
| **Labels / Captions** | Inter Variable | 500 (Medium) | 11–12px | `0.02em` (uppercase labels) |
| **Stat Badges** | Inter Variable | 700 (Bold) | 11px | `0.04em` |

### Type Scale (rem-based)
```
--text-xs:    0.6875rem  (11px)
--text-sm:    0.8125rem  (13px)
--text-base:  0.875rem   (14px)
--text-lg:    1.125rem   (18px)
--text-xl:    1.375rem   (22px)
--text-2xl:   1.75rem    (28px)
--text-3xl:   2.25rem    (36px)
--text-4xl:   3rem       (48px)
```

### Typography Decisions
- **Inter Variable** is already in the project (`@fontsource-variable/inter`). Single family, many weights = fast loading, consistent feel.
- The design uses **tight tracking on large numbers** (4.2 mins, 1,467, 98.4%) to give them the dense authority of a control panel readout.
- **Uppercase with wide tracking** on labels like "AVG RESPONSE TIME", "TOTAL INCIDENTS" — this is the military operations center influence.
- The contrast between massive stat numbers and tiny uppercase labels creates a clear visual hierarchy without needing decorative type.

---

## 4. Layout System

### Shell Structure (Persistent Across All Pages)

```
┌──────────────────────────────────────────────────────┐
│ [ Sidebar 240px ]  [ Top Bar — search + icons      ] │
│ │                │ ┌──────────────────────────────── │
│ │  Logo          │ │                                │ │
│ │  Nav Items     │ │   Main Content Area            │ │
│ │                │ │   (page-specific layout)       │ │
│ │                │ │                                │ │
│ │                │ │                                │ │
│ │                │ │                                │ │
│ │  User Profile  │ │                                │ │
│ │  Sign Out      │ └────────────────────────────────│ │
│ └────────────────┘ ┌────────────────────────────────│ │
│                    │ 🔴 LIVE ALERTS  Feed Active    │ │
│                    └────────────────────────────────│ │
└──────────────────────────────────────────────────────┘
```

### Grid Approach
- **Sidebar**: Fixed 240px, white background, left-edge-aligned nav with green pill highlight
- **Main Content**: `calc(100vw - 240px)`, CSS Grid with `gap: 1.5rem` (24px)
- **Cards**: 12-column sub-grid. Dashboard uses 3-column stat row + 2-column chart/category + 2-column bottom

### Breakpoints
```
--bp-sm:   640px   (single column, sidebar collapses to icon-only 64px)
--bp-md:   768px   (tablet, 2-column grids)
--bp-lg:   1024px  (standard desktop)
--bp-xl:   1440px  (large monitors, full layout)
```

---

## 5. Component Inventory

### 5.1 Shell Components

| Component | Description | Used On |
|-----------|-------------|---------|
| `AppShell` | Root layout: sidebar + topbar + content + live-bar | All pages |
| `Sidebar` | Navigation rail with logo, nav items, user profile | All pages |
| `SidebarNavItem` | Single nav link with icon + label + active pill | All pages |
| `TopBar` | Search input + notification bell + user avatar | All pages |
| `LiveAlertBar` | Bottom-pinned alert feed with pulsing broadcast icon | All pages |

### 5.2 Dashboard Widgets

| Component | Description |
|-----------|-------------|
| `StatCard` | Metric card: icon + big number + label + trend badge |
| `ActivePatrolBadges` | Patrol team circles (P1, P2, P3, +39) with status dots |
| `ResponseTimeTrend` | Area chart with SLA threshold line and time axis |
| `IncidentCategoryList` | Horizontal bar chart: category name + filled bar + percentage |
| `RecentIncidentList` | Scrollable list: urgency badge + location + cluster name + time |
| `SystemLogFeed` | Timestamped log entries with status indicators |

### 5.3 Command Center Components

| Component | Description |
|-----------|-------------|
| `IncidentHeader` | Urgency badge + location + linked reports count |
| `IncidentDetailCard` | Photo + current condition text block |
| `DispatchButton` | Primary CTA: "Dispatch Response Team" with send icon |
| `AIUrgencyScore` | Circular/linear gauge: score /100 + real-time badge + reasoning |
| `RawSMSFeed` | Table: timestamp + origin phone + message content + status badge |
| `CitizenUpdateLoop` | Broadcast message composer with send button |
| `SmallSystemLog` | Compact log with relative timestamps |

### 5.4 Map Components

| Component | Description |
|-----------|-------------|
| `MapView` | Full-bleed dark map with incident markers and heat zones |
| `MapControls` | Zoom +/-, locate, layers toggle (bottom-left floating) |
| `PersonnelPanel` | Right-side floating card: team list with status + actions |
| `PersonnelCard` | Team name + location + status dots + Deploy/Re-assign/Message |
| `EmergencyDispatchButton` | Top-right red CTA: "Emergency Dispatch" with siren icon |

### 5.5 Reports / Analytics Components

| Component | Description |
|-----------|-------------|
| `TimeRangeToggle` | 24H / 7D / 30D segmented control |
| `PurokHeatMap` | Grid of zone cards with density-driven background colors |
| `ZoneCard` | Zone ID + label + density level tag |
| `HeatMapLegend` | Low → High gradient strip with labels |

### 5.6 Shared / Primitive Components

| Component | Description |
|-----------|-------------|
| `Badge` | Status/urgency badge with semantic color variants |
| `StatusDot` | Online/offline/warning colored dot indicator |
| `TrendIndicator` | Up/down arrow with percentage and color |
| `SearchInput` | Icon-prefixed search field with placeholder |
| `Avatar` | User photo circle with fallback initials |
| `Card` | Base elevated surface with consistent padding/radius |
| `DataTable` | Styled table with column headers and row striping |
| `ProgressBar` | Horizontal filled bar for percentages/scores |
| `Tooltip` | Contextual hover information |
| `Skeleton` | Loading placeholder with shimmer animation |

---

## 6. Page Specifications

### 6.1 Dashboard (`/dashboard` or `/`)

**Layout**: 4 stat cards (equal width) → 2-column (chart 60% + categories 40%) → 2-column (incidents 60% + logs 40%)

**Data Sources** (Supabase tables):
- `reports` → count by status, urgency distribution, concern_type breakdown
- `reports.created_at` → time-series for response time trends
- Computed: avg response time, dispatch efficiency, active patrols

**Key Interactions**:
- Stat cards: hover elevates, click navigates to filtered view
- Chart: tooltip on hover showing exact values at time point
- Incident list: click opens Command Center for that incident
- System log: auto-scrolling with newest on top

### 6.2 Command Center (`/command-center/:incidentId`)

**Layout**: Left content (70%) with incident details + SMS feed → Right panel (30%) with AI score + citizen update loop + system log

**Data Sources**:
- Single `report` by ID with joined `raw_messages`
- `pending_clarifications` for follow-up status
- AI urgency computed from `llm_confidence`, `urgency_level`, `concern_type`

**Key Interactions**:
- Dispatch button triggers action (future: integration with patrol system)
- SMS feed updates via Supabase Realtime subscription
- Citizen broadcast message composer with send action
- Share button for incident sharing

### 6.3 Map (`/map`)

**Layout**: Full-bleed dark map with floating controls (left) + personnel panel (right) + live alert bar (bottom)

**Data Sources**:
- `reports` with `location_zone` for incident plotting
- Future: real-time personnel GPS data

**Key Interactions**:
- Map pan/zoom with Mapbox GL or Leaflet
- Click incident marker → popup with summary
- Personnel panel: Deploy / Re-assign / Message actions
- Emergency Dispatch button (top-right, always visible)
- Layer toggle: incidents / heat map / patrol routes

### 6.4 Reports (`/reports`)

**Layout**: Time range selector → 4 stat cards → 2-column (trend chart + categories) → Purok Heat Map grid

**Data Sources**:
- `reports` aggregated by time range (24H/7D/30D)
- `reports.location_zone` for heat map density calculation

**Key Interactions**:
- Time range toggle filters all data
- Heat map zone click → filtered incident list
- Full inventory button → all categories view

### 6.5 Incidents (`/incidents`)

**Layout**: Filterable data table with search, urgency filter, status filter

**Data Sources**:
- `reports` table with full column set
- Sortable by created_at, urgency_level, status

### 6.6 Settings (`/settings`)

**Layout**: Tabbed settings panel (Profile, Notifications, System)

---

## 7. Interaction & Motion Design

### Principles
- **Functional motion only**: animations communicate state changes, not decoration
- **200ms transitions** for hover states, 300ms for page transitions
- **Reduced motion respected**: `prefers-reduced-motion: reduce` removes all non-essential animation

### Specific Animations
| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Live Alert Bar icon | Pulsing scale 1→1.15→1 | 2s loop | `ease-in-out` |
| Stat card hover | `translateY(-2px)` + shadow increase | 200ms | `ease-out` |
| Sidebar nav transition | Background color + left border slide | 150ms | `ease` |
| Chart area fill | Fade-in on mount | 600ms | `ease-out` |
| SMS feed new row | Slide in from top + fade | 300ms | `ease-out` |
| Badge pulse (CRITICAL) | Subtle glow pulse | 1.5s loop | `ease-in-out` |
| Skeleton loading | Shimmer gradient sweep | 1.5s loop | `linear` |

---

## 8. Accessibility Requirements

- WCAG 2.1 AA compliance minimum
- All interactive elements keyboard-focusable with visible focus rings
- Color is never the sole indicator (badges include text, not just color)
- Chart data accessible via table fallback or ARIA labels
- Screen reader announcements for live alert feed updates (`aria-live="polite"`)
- Sufficient contrast ratios: 4.5:1 for normal text, 3:1 for large text

---

## 9. Responsive Strategy

| Breakpoint | Sidebar | Layout | Stat Cards | Heat Map |
|------------|---------|--------|------------|----------|
| ≥1440px | Full 240px | Full grid | 4-column | 6-column |
| 1024–1439px | Full 240px | Full grid | 4-column | 4-column |
| 768–1023px | Collapsed 64px (icon-only) | Reduced grid | 2-column | 3-column |
| <768px | Hidden (hamburger toggle) | Single column | 1-column stack | 2-column |

---

## 10. Dark Mode Considerations

The design mockups show a **light mode primary** interface with a **dark mode map page**. Strategy:
- Default: Light mode for all admin pages (Dashboard, Command Center, Reports, Incidents, Settings)
- Map page: Always dark background (the cartography demands it)
- Future: Full dark mode toggle using existing CSS variable infrastructure
