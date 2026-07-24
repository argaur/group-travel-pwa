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
        <div className="max-w-md">
          <p className="m-label mb-3">Plotting the calendar…</p>
          <div className="skeleton-hatch h-4 w-full mb-2" />
          <div className="skeleton-hatch h-4 w-4/5" />
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-2 max-w-4xl">
          {/* Left: my date picker */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="fig-tag" style={{ flexShrink: 0 }}><b>№ 01</b> Your bearings</span>
              <div className="flex-1 h-px" style={{ background: "var(--ink-15)" }} />
            </div>
            <h2 className="text-[24px]" style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "var(--ink)" }}>
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
            <div className="flex items-baseline gap-3">
              <span className="fig-tag" style={{ flexShrink: 0 }}><b>FIG. 1</b> The overlap window</span>
              <div className="flex-1 h-px" style={{ background: "var(--ink-15)" }} />
            </div>
            <h2 className="text-[24px]" style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "var(--ink)" }}>
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
