import { useState } from "react"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { Radio } from "lucide-react"

import { useAuth } from "@/lib/auth"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { isMockAuth: checkMock } = await import("@/lib/auth")
    if (checkMock()) throw redirect({ to: "/dashboard" })

    const { supabase } = await import("@/lib/supabase")
    const { data: { session } } = await supabase.auth.getSession()
    if (session) throw redirect({ to: "/dashboard" })
  },
  component: LoginPage,
})

function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await signIn(email, password)
    setLoading(false)

    if (signInError) {
      setError(signInError)
      return
    }

    await navigate({ to: "/dashboard" })
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-lihok-surface p-4">
      <Card className="w-full max-w-sm border-border bg-card shadow-lg">
        <CardHeader className="items-center text-center">
          <span className="mb-2 grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
            <Radio className="size-7" />
          </span>
          <CardTitle className="text-xl font-black tracking-[-0.04em]">LihokBarangAI</CardTitle>
          <CardDescription>Barangay Intelligence Console</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@barangay.gov.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                data-testid="login-email-input"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="login-password-input"
              />
            </div>
            {error && (
              <p className="text-xs font-semibold text-urgency-critical" data-testid="login-error-message">{error}</p>
            )}
            <Button type="submit" className="w-full font-bold" disabled={loading} data-testid="login-submit-button">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
