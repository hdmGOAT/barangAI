export interface Profile {
  id: string
  full_name: string
  role: string
  avatar_url: string | null
  barangay_id: string | null
  created_at: string
}

export type IncidentUrgency = "critical" | "high" | "medium" | "low"
export type IncidentStatus = "open" | "resolved" | "monitoring" | "dismissed"

export interface Incident {
  id: string
  title: string
  urgency: IncidentUrgency
  location_name: string | null
  category: string
  latitude: number | null
  longitude: number | null
  status: IncidentStatus
  assigned_personnel_id: string | null
  barangay_id: string | null
  created_at: string
  updated_at: string
}

export type SmsReportStatus = "verified" | "processing" | "pending"

export interface SmsReport {
  id: string
  sender_number: string
  content: string
  status: SmsReportStatus
  incident_id: string | null
  barangay_id: string | null
  created_at: string
}

export type PersonnelStatus = "online" | "busy" | "offline"

export interface Personnel {
  id: string
  team_name: string
  current_location: string | null
  latitude: number | null
  longitude: number | null
  status: PersonnelStatus
  barangay_id: string | null
  created_at: string
  updated_at: string
}

export interface SystemLog {
  id: string
  message: string
  incident_id: string | null
  barangay_id: string | null
  created_at: string
}

export interface DashboardStats {
  avgResponseTime: number
  totalIncidents: number
  dispatchEfficiency: number
  activePatrols: number
}

export interface AuthState {
  user: Profile | null
  session: import("@supabase/supabase-js").Session | null // eslint-disable-line @typescript-eslint/consistent-type-imports
  isLoading: boolean
}
