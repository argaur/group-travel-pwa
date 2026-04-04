"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { ensureBackendToken } from "@/lib/backend-auth"
import AppShell from "@/components/AppShell"
import DateBlockPicker from "@/components/availability/DateBlockPicker"
import AvailabilityHeatmap from "@/components/availability/AvailabilityHeatmap"

type HeatmapEntry = {
  date: string
  blocked_count: number
  blocked_by: string[]
}

type AvailabilityData = {
  heatmap: HeatmapEntry[]
  my_blocks: string[]
  total_members: number
}

export default function AvailabilityPage() {
  const params = useParams<{ tripId: string }>()
  const [data, setData] = useState<AvailabilityData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    await ensureBackendToken()
    try {
      const result = await api.get<AvailabilityData>(`/trips/${params.tripId}/availability`)
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [params.tripId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <AppShell
      tripId={params.tripId}
      active="rsvp"
      title="Date availability"
      subtitle="Mark dates that don't work for you"
    >
      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : (
        <div className="grid gap-10 lg:grid-cols-2 max-w-4xl">
          {/* Left: my date picker */}
          <div className="space-y-4">
            <h2
              className="text-[22px]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              My no-go dates
            </h2>
            <DateBlockPicker
              tripId={params.tripId}
              initialBlocks={data?.my_blocks ?? []}
              onChange={() => {
                // Reload heatmap after save
                setTimeout(load, 500)
              }}
            />
          </div>

          {/* Right: group heatmap */}
          <div className="space-y-4">
            <h2
              className="text-[22px]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              Group availability
            </h2>
            <AvailabilityHeatmap
              heatmap={data?.heatmap ?? []}
              totalMembers={data?.total_members ?? 0}
            />
          </div>
        </div>
      )}
    </AppShell>
  )
}
