import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { Profile, AuthState } from "@/lib/types"

const MOCK_USER: Profile = {
  id: "00000000-0000-0000-0000-000000000000",
  full_name: "Juan Dela Cruz",
  role: "Brgy. Captain",
  avatar_url: null,
  barangay_id: null,
  created_at: new Date().toISOString(),
}

function isMockAuth(): boolean {
  return import.meta.env.VITE_ENABLE_MOCK_AUTH === "true"
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    if (isMockAuth()) {
      return { user: MOCK_USER, session: null, isLoading: false }
    }
    return { user: null, session: null, isLoading: true }
  })

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
    return data
  }, [])

  useEffect(() => {
    if (isMockAuth()) return

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setState({ user: profile, session, isLoading: false })
      } else {
        setState({ user: null, session: null, isLoading: false })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          setState({ user: profile, session, isLoading: false })
        } else {
          setState({ user: null, session: null, isLoading: false })
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    if (isMockAuth()) {
      setState({ user: MOCK_USER, session: null, isLoading: false })
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    if (isMockAuth()) {
      setState({ user: null, session: null, isLoading: false })
      return
    }
    await supabase.auth.signOut()
  }, [])

  return (
    <AuthContext value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}

export { isMockAuth, MOCK_USER }
