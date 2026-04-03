"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import AppShell from "@/components/AppShell"
import TripPlanningGate from "@/components/TripPlanningGate"

type Settlement = {
  from_user: { id: string; name: string; avatar_url: string | null }
  to_user: { id: string; name: string; avatar_url: string | null }
  amount: number
  settled: boolean
}

function SettlementContent() {
  const params = useParams<{ tripId: string }>()
  const [rows, setRows] = useState<Settlement[]>([])

  useEffect(() => {
    api
      .get<Settlement[]>(`/trips/${params.tripId}/expenses/settlement`)
      .then(setRows)
  }, [params.tripId])

  return (
    <AppShell
      tripId={params.tripId}
      active="expenses"
      title="Settlement"
      subtitle="Net balances and who owes whom"
    >
      <div className="card p-5 space-y-3">
        {rows.map((row, idx) => (
          <div key={idx} className="border border-black/5 rounded-2xl p-4">
            <p className="text-sm">
              {row.from_user.name || row.from_user.id} →{" "}
              {row.to_user.name || row.to_user.id}
            </p>
            <p className="text-sm text-[var(--muted)]">
              ₹{(row.amount / 100).toFixed(2)}
            </p>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-[var(--muted)]">No settlement needed yet.</p>
        )}
      </div>
    </AppShell>
  )
}

export default function SettlementPage() {
  const params = useParams<{ tripId: string }>()
  return (
    <TripPlanningGate tripId={params.tripId}>
      <SettlementContent />
    </TripPlanningGate>
  )
}
