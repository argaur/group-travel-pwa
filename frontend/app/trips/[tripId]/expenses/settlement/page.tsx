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

  const settled = rows.length === 0 || rows.every((r) => r.settled)
  const total = rows.reduce((s, r) => s + r.amount, 0)

  return (
    <AppShell
      tripId={params.tripId}
      active="expenses"
      title="Settlement"
      subtitle="Net balances · who owes whom"
    >
      <div className="card relative p-5 md:p-7 max-w-2xl" style={{ overflow: "visible" }}>
        {/* Wax stamp — reserved for money, corner-mounted when the ledger closes at zero */}
        {settled && (
          <span className="stamp" aria-hidden="true">
            Settled · No IOUs
          </span>
        )}

        <div className="flex items-baseline justify-between gap-3 mb-4">
          <span className="fig-tag"><b>◆</b> The ledger closes</span>
          <span className="m-label">{rows.length} transfer{rows.length !== 1 ? "s" : ""}</span>
        </div>

        {rows.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[26px]" style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "var(--ink)" }}>
              The books balance.
            </p>
            <p className="m-label mt-3">Every rupee accounted for — no IOUs on the flight home</p>
          </div>
        ) : (
          <>
            {/* Ledger header */}
            <div
              className="flex items-baseline justify-between gap-3 pb-2"
              style={{ borderBottom: "2px solid var(--ink)" }}
            >
              <span className="m-label">Transfer</span>
              <span className="m-label">Amount</span>
            </div>
            <ul>
              {rows.map((row, idx) => (
                <li
                  key={idx}
                  className="flex items-baseline justify-between gap-3 py-3.5"
                  style={{ borderTop: idx === 0 ? "none" : "1px dashed var(--ink-15)" }}
                >
                  <span className="text-[15px] min-w-0" style={{ fontFamily: "var(--body)", color: "var(--ink)" }}>
                    {row.from_user.name || row.from_user.id}
                    <span style={{ color: "var(--accent)", fontWeight: 700 }}> → </span>
                    {row.to_user.name || row.to_user.id}
                  </span>
                  <span
                    className="shrink-0 tabular-nums"
                    style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, color: "var(--ink)" }}
                  >
                    ₹{(row.amount / 100).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            {/* Total */}
            <div
              className="flex items-baseline justify-between gap-3 pt-3 mt-1"
              style={{ borderTop: "2px solid var(--ink)" }}
            >
              <span className="m-label">Outstanding</span>
              <span
                className="tabular-nums"
                style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 700, color: "var(--accent)" }}
              >
                ₹{(total / 100).toFixed(2)}
              </span>
            </div>
          </>
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
