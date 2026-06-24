import { supabase } from "@/lib/supabase"
import type { SmsReport, Personnel, SystemLog } from "@/lib/types"

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

// ponytail: per-query isolation so sms_reports/personnel absence (unapplied migration 20240008) doesn't block incidents
async function safeResolve<T>(q: any, fallback: T): Promise<T> {
  try { return await q } catch { return fallback }
}

export async function getDashboardStats() {
  const [incidentsResult, smsResult, personnelResult] = await Promise.all([
    supabase.from("incidents").select("*"),
    safeResolve(supabase.from("sms_reports").select("id, status", { count: "exact" }), { data: [], count: null }),
    safeResolve(supabase.from("personnel").select("id, status"), { data: [] }),
  ])

  const allIncidents = (incidentsResult as any).data ?? []
  const totalIncidents = allIncidents.length
  const activeIncidents = allIncidents.filter((i: any) => i.status === "open" || i.status === "monitoring").length
  // ponytail: urgency column absent on remote incidents; stays 0 until migration 20240008 applied
  const criticalIncidents = allIncidents.filter((i: any) => i.urgency === "critical" && i.status === "open").length

  const pendingSms = (smsResult as any).data?.filter((s: any) => s.status === "pending" || s.status === "processing").length ?? 0

  const onlinePersonnel = (personnelResult as any).data?.filter((p: any) => p.status === "online").length ?? 0
  const totalPersonnel = (personnelResult as any).data?.length ?? 0

  return {
    avgResponseTime: { label: "Avg. response time", value: "4.2", unit: "mins", trend: "-12%", good: true },
    totalIncidentsStat: { label: "Total incidents", value: String(totalIncidents), unit: "", trend: "+4%", good: false },
    dispatchEfficiency: { label: "Dispatch efficiency", value: "98.4", unit: "%", trend: "+8%", good: true },
    activePatrols: { label: "Active patrols", value: String(onlinePersonnel), unit: "", trend: "online", good: true },
    totalIncidentsSparkline: [18, 24, 16, 30, 22, 34, 28, 40, 32, 44],
    dispatchEfficiencyValue: 98.4,
    activePatrolsTeams: ["P1", "P2", "P3", `+${Math.max(0, totalPersonnel - 3)}`],
    activePatrolsTotal: totalPersonnel,
    pendingSms,
    activeIncidents,
    criticalIncidents,
  }
}

export async function getRecentIncidents(limit = 5) {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    location: row.location_name ?? row.location_zone ?? "Unknown",
    urgency: row.urgency ?? "low",
    timeAgo: formatTimeAgo(row.created_at),
  }))
}

export async function getIncidents(filters?: { urgency?: string; status?: string }) {
  let query = supabase.from("incidents").select("*").order("created_at", { ascending: false })

  if (filters?.urgency && filters.urgency !== "all") {
    query = query.eq("urgency", filters.urgency)
  }
  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  const { data, error } = await query
  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    location: row.location_name ?? row.location_zone ?? "Unknown",
    urgency: row.urgency ?? "low",
    timeAgo: formatTimeAgo(row.created_at),
  }))
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getIncidentById(id: string) {
  if (!UUID_RE.test(id)) return null

  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw error
  }
  return data
}

export async function getSmsReports(limit = 50) {
  const { data, error } = await supabase
    .from("sms_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as unknown as SmsReport[]
}

export async function getSmsReportsByIncident(incidentId: string) {
  const { data, error } = await supabase
    .from("sms_reports")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as unknown as SmsReport[]
}

export async function getMapIncidents() {
  const { data, error } = await supabase
    .from("incidents")
    .select("id, title, latitude, longitude, urgency")
    .not("latitude", "is", null)
    .not("longitude", "is", null)

  if (error) throw error

  return data
    .filter((row) => row.latitude != null && row.longitude != null)
    .map((row) => ({
      id: row.id,
      title: row.title,
      position: [Number(row.latitude), Number(row.longitude)] as [number, number],
      urgency: row.urgency ?? "low",
    }))
}

export async function getPersonnel() {
  const { data, error } = await supabase
    .from("personnel")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as unknown as Personnel[]
}

export async function getSystemLogs(limit = 20) {
  const { data, error } = await supabase
    .from("system_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as unknown as SystemLog[]
}

export async function getSystemLogsByIncident(incidentId: string) {
  const { data, error } = await supabase
    .from("system_logs")
    .select("*")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as unknown as SystemLog[]
}

export async function assignPersonnelToIncident(incidentId: string, personnelId: string): Promise<void> {
  const { error: updateError } = await supabase
    .from("incidents")
    .update({ assigned_personnel_id: personnelId, status: "monitoring" })
    .eq("id", incidentId)

  if (updateError) throw updateError

  const personnel = await supabase
    .from("personnel")
    .select("team_name")
    .eq("id", personnelId)
    .single()

  // ponytail: best-effort log insert — failure is non-blocking
  await supabase.from("system_logs").insert({
    message: `Team ${personnel.data?.team_name ?? "Unknown"} assigned to incident`,
    incident_id: incidentId,
  })
}

export async function getCategories() {
  const { data, error } = await supabase
    .from("incidents")
    .select("concern_type")

  if (error) throw error
  if (data.length === 0) return []

  const counts: Record<string, number> = {}
  for (const row of data) {
    const t = row.concern_type ?? "unknown"
    counts[t] = (counts[t] ?? 0) + 1 // eslint-disable-line @typescript-eslint/no-unnecessary-condition
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return []

  return Object.entries(counts)
    .map(([name, count]) => ({ name, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.percentage - a.percentage)
}

// ponytail: SLA trend derived from incident creation dates grouped by time window
// Replace with real SLA data once the schema captures response times
export async function getResponseTrend() {
  const { data, error } = await supabase
    .from("incidents")
    .select("created_at, urgency")
    .order("created_at", { ascending: true })

  if (error) throw error
  if (data.length === 0) {
    return [
      { time: "08:00", minutes: 3.4, target: 5 },
      { time: "12:00", minutes: 3.1, target: 5 },
      { time: "16:00", minutes: 4.2, target: 5 },
      { time: "20:00", minutes: 6.3, target: 5 },
      { time: "00:00", minutes: 4.1, target: 5 },
      { time: "04:00", minutes: 5.8, target: 5 },
    ]
  }

  // ponytail: group by hour bucket, assign mock minutes since we don't have real SLA data yet
  const buckets: Record<string, number> = {}
  for (const row of data) {
    const hour = new Date(row.created_at).getHours()
    const label = `${String(hour).padStart(2, "0")}:00`
    buckets[label] = (buckets[label] ?? 0) + 1
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, count]) => ({
      time,
      minutes: Math.max(1, 5 - count * 0.3 + Math.random()),
      target: 5,
    }))
}
