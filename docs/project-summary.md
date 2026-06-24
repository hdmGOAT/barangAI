Based on the analysis of the project structure, routing, components, and mock data, here is the detailed technical summary to prepare for the Supabase integration.

Project Summary
This project, named LihokBarangAI, is a web-based Barangay Intelligence Console. It serves as an AI-powered incident monitoring and response coordination dashboard for local government units (barangays). The application allows barangay officials (like the Brgy. Captain or dispatchers) to monitor live SMS feeds from constituents, view active incidents on a map, track response SLAs, and manage personnel deployments.

Tech Stack
Frontend Framework: React 19 (via Vite).
Routing: @tanstack/react-router for type-safe routing.
Styling: Tailwind CSS v4.
UI Library: shadcn/ui components alongside Radix UI and Tremor for charts.
Maps: Leaflet and react-leaflet.
Architecture: Monorepo using Turborepo and pnpm workspaces (apps/web for the frontend, packages/ui for shared components).
Backend (Target): Supabase (already has supabase/functions for background ingestion and cron jobs).
Folder Structure
/apps/web/: The main frontend application.
src/routes/: Contains all page definitions and the routing tree for TanStack Router.
src/components/: Domain-specific components like app-shell, stat-card, incident-row, and leaflet-map.
src/lib/: Contains utility files, most notably mock-data.ts, which currently drives the entire application's UI.
/packages/ui/: A shared UI workspace containing generic, reusable components (mostly from shadcn/ui).
src/components/: Buttons, cards, dropdowns, sidebars, etc.
/supabase/: The Supabase configuration folder. It already contains edge functions (ingest, cluster-batch) and scripts in package.json for deployment and Telegram webhooks, indicating an automated pipeline exists for data ingestion.
Routes and User Flow
The application uses file-based routing via TanStack Router.

__root.tsx: The root layout that wraps everything in the AppShell (which includes the sidebar and top navigation).
/dashboard: The main landing page showing high-level stats, SLA trends, and recent incidents.
/command-center/$incidentId: A dynamic route for a detailed view of a specific incident (likely where dispatchers manage the response).
/incidents: A master list of all incidents.
/map: A spatial view of active incidents and patrols using Leaflet.
/reports: A reporting interface for historical data.
/settings: System and user configurations.
User Journey: An official logs in (currently bypassed directly to the app shell) -> views the /dashboard to see the live feed and urgent issues -> clicks an incident to open the /command-center -> deploys personnel.

Key Components
Reusable UI Components (packages/ui):
Sidebar, Card, Button, DropdownMenu, Chart (built on Recharts). These are purely presentational and will not connect directly to Supabase.
Domain Components (apps/web):
AppShell: The main layout containing the static User Profile and Navigation. Will need to be connected to Supabase Auth state.
StatCard / SlaTrendChart: Visualizes high-level metrics.
IncidentRow / SmsFeedTable: List components that currently map over mock arrays. These will be the primary components executing Supabase select queries.
LeafletMap: Renders markers based on mock coordinate data.
Current Data Flow
Currently, 100% of the data is mocked and hardcoded. Data flows directly from apps/web/src/lib/mock-data.ts into the components via standard imports.

recentIncidents, smsFeed, logs, stats, mapIncidents, and personnel are static arrays and objects.
Components like Dashboard import these variables and pass them down as props to children like IncidentRow or SystemLogFeed.
Backend Integration Need: The entire mock-data.ts file needs to be replaced by Supabase queries. Forms and actionable buttons (like "Deploy" or "Sign Out") currently have no event handlers or mutations.
Authentication Analysis
Current State: Authentication is strictly mocked UI. The AppShell hardcodes a user profile ("Juan Dela Cruz", "Brgy. Captain") and the "Sign Out" button is purely cosmetic.
Missing Elements: There is no login page, signup page, or auth guard. The routing does not currently implement protected routes.
Supabase Need: We need to connect the UI to Supabase Auth, build a login interface, and use TanStack Router's context/loaders to protect the dashboard routes from unauthenticated users.
Suggested Supabase Tables
Based on the mock-data.ts structures, the following tables will likely be required:

profiles (or users):
Purpose: Extend Supabase Auth users.
Columns: id (references auth.users), full_name, role (e.g., captain, dispatcher), avatar_url.
RLS: Users can read all profiles in their barangay, but only update their own.
incidents:
Purpose: Track categorized emergencies.
Columns: id (PK), title, urgency (enum: critical, high, medium, low), location_name, category, latitude, longitude, status, created_at.
Relationships: assigned_personnel_id (optional).
RLS: Read/Write restricted to authenticated officials.
sms_reports:
Purpose: The raw incoming feed from constituents (likely populated by the ingest edge function).
Columns: id (PK), sender_number, content, status (verified, processing, pending), created_at, incident_id (FK to incidents).
personnel:
Purpose: Track responders and patrols.
Columns: id (PK), team_name, current_location, status (online, busy, offline).
system_logs:
Purpose: Audit trail for the live alert ticker.
Columns: id, message, created_at, incident_id (optional FK).
Implementation Plan
Initialize Client:
Create apps/web/src/lib/supabase.ts using @supabase/supabase-js.
Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.
Authentication Foundation:
Create a /login route.
Implement a Supabase Auth context provider or hook.
Update routes/__root.tsx to redirect unauthenticated users to /login.
Wire up the "Sign Out" button in AppShell.
Data Fetching Layer:
Given the use of React 19 and TanStack Router, the best approach is to abstract Supabase calls into custom hooks or services (e.g., getIncidents()), and utilize TanStack Router's loader functions to fetch data before rendering the page.
Iterative Replacement:
Step 1: Replace smsFeed and recentIncidents on the dashboard to prove read functionality.
Step 2: Implement Realtime subscriptions so the dashboard updates automatically when the ingest webhook fires.
Step 3: Replace mapIncidents on the Map view.
Risks / Questions Before Coding
No Login UI: There is no existing UI for logging in. We will need to design and build a login screen before we can test protected routes.
Multi-Tenancy: Is this system designed for a single barangay or multiple? If multiple, we must introduce a barangay_id column to almost every table and set up strict Row Level Security (RLS) to prevent data leakage between barangays.
Map Coordinates: The mock data has latitude and longitude. Does the incoming SMS webhook (ingest function) automatically geocode addresses to coordinates, or does the dispatcher have to manually pin them on the map?
Data Mapping: How are raw SMS messages mapped to an "Incident Cluster"? Is this done by the cluster-batch cron job mentioned in the package.json? We need to ensure the database schema supports this clustering logic.