import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

type TableName = "incidents" | "sms_reports" | "system_logs" | "personnel"

export function useRealtimeTable<T>(
  table: TableName,
  initial: T[],
): T[] {
  const [rows, setRows] = useState<T[]>(initial)

  useEffect(() => {
    setRows(initial)
  }, [initial])

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.eventType === "INSERT") {
            setRows((prev) => [payload.new as unknown as T, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setRows((prev) =>
              prev.map((r) =>
                (r as any).id === (payload.new as any).id ? (payload.new as unknown as T) : r,
              ),
            )
          } else {
            setRows((prev) =>
              prev.filter((r) => (r as any).id !== (payload.old as any).id),
            )
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table])

  return rows
}
