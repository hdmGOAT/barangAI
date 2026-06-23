import { HeadContent, Outlet, Scripts, createRootRoute, redirect, useRouterState } from "@tanstack/react-router"

import appCss from "@workspace/ui/globals.css?url"
import { AppShell } from "@/components/app-shell"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { AuthProvider, isMockAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/login") return
    if (isMockAuth()) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: "/login" })
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LihokBarangAI — Barangay Intelligence Console" },
      { name: "description", content: "AI-powered barangay incident monitoring and response coordination console." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  component: () => {
    const pathname = useRouterState({ select: (s) => s.location.pathname })
    const isLogin = pathname === "/login"
    return (
      <AuthProvider>
        {isLogin ? <Outlet /> : <AppShell><Outlet /></AppShell>}
      </AuthProvider>
    )
  },
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Scripts />
      </body>
    </html>
  )
}
