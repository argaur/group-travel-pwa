"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { getBackendUserId } from "@/lib/backend-auth"
import AppShell from "@/components/AppShell"
import TripPlanningGate from "@/components/TripPlanningGate"

type Expense = {
  id: string
  amount: number
  category: string
  paid_by: string
  split_type: string
  description: string | null
}

type Member = {
  user: { id: string; name: string; avatar_url: string | null }
  role: string
  is_creator: boolean
  preference_submitted: boolean
}

function ExpensesContent() {
  const params = useParams<{ tripId: string }>()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [amountRupees, setAmountRupees] = useState("")
  const [category, setCategory] = useState("food")
  const [paidBy, setPaidBy] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const memberNames = useMemo(() => {
    const map: Record<string, string> = {}
    for (const m of members) map[m.user.id] = m.user.name
    return map
  }, [members])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [expenseData, memberData] = await Promise.all([
        api.get<Expense[]>(`/trips/${params.tripId}/expenses`),
        api.get<Member[]>(`/trips/${params.tripId}/members`),
      ])
      setExpenses(expenseData)
      setMembers(memberData)
      // Default payer to the current user if they are a member, else the first member.
      const currentId = getBackendUserId()
      const currentIsMember = memberData.some((m) => m.user.id === currentId)
      setPaidBy((prev) => {
        if (prev && memberData.some((m) => m.user.id === prev)) return prev
        if (currentId && currentIsMember) return currentId
        return memberData[0]?.user.id ?? ""
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load expenses")
    } finally {
      setLoading(false)
    }
  }, [params.tripId])

  useEffect(() => {
    load()
  }, [load])

  async function addExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!paidBy) {
      setSubmitError("Select who paid before adding the expense.")
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const rupees = Number(amountRupees)
      const paise = Math.round(rupees * 100)
      await api.post(`/trips/${params.tripId}/expenses`, {
        amount: paise,
        category,
        paid_by: paidBy,
        split_type: "equal",
      })
      setAmountRupees("")
      await load()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to add expense")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell
      tripId={params.tripId}
      active="expenses"
      title="Expenses"
      subtitle="Log shared spends and settle quickly"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <form onSubmit={addExpense} className="card p-5 md:p-6 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl" style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>Add expense</h2>
            <span className="m-label">New entry</span>
          </div>
          <div>
            <label className="field-label block mb-1.5">Amount (₹)</label>
            <input
              className="field-input"
              placeholder="0.00"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              type="number"
              min={0}
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="field-label block mb-1.5">Paid by</label>
            <select
              className="field-select"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              disabled={loading || members.length === 0}
              required
            >
              {members.length === 0 && <option value="">No members</option>}
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name}
                  {m.user.id === getBackendUserId() ? " (you)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label block mb-1.5">Category</label>
            <select className="field-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="food">Food</option>
              <option value="stay">Stay</option>
              <option value="transport">Transport</option>
              <option value="activities">Activities</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button className="cta sm w-full" disabled={submitting || loading || members.length === 0}>
            {submitting ? "Adding…" : "Add expense"}
            {!submitting && <span className="arrow" aria-hidden="true">→</span>}
          </button>
          {submitError && (
            <div className="alert-plate" role="alert">
              <p className="m-label" style={{ color: "var(--accent)", fontWeight: 700 }}>⚑ {submitError}</p>
            </div>
          )}
          <a className="cta-ghost w-full" href={`/trips/${params.tripId}/expenses/settlement`}>
            View settlement →
          </a>
        </form>

        <div className="card p-5 md:p-6">
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <h2 className="text-xl" style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>The ledger</h2>
            <span className="m-label"><b>{expenses.length}</b> entries</span>
          </div>
          {loading && (
            <div className="py-2">
              <div className="skeleton-hatch h-4 w-full mb-2" />
              <div className="skeleton-hatch h-4 w-3/4" />
            </div>
          )}
          {!loading && error && (
            <div className="alert-plate space-y-2" role="alert">
              <p className="m-label" style={{ color: "var(--accent)", fontWeight: 700 }}>⚑ Signal lost</p>
              <p className="text-sm" style={{ fontFamily: "var(--body)" }}>{error}</p>
              <button type="button" onClick={load} className="cta-ghost">Retry</button>
            </div>
          )}
          {!loading && !error && (
            <ul>
              {expenses.map((expense) => (
                <li
                  key={expense.id}
                  className="flex items-baseline justify-between gap-3 py-3"
                  style={{ borderTop: "1px dashed var(--ink-15)" }}
                >
                  <div className="min-w-0">
                    <p className="text-[15px]" style={{ fontFamily: "var(--body)", fontWeight: 600, color: "var(--ink)", textTransform: "capitalize" }}>
                      {expense.category}
                    </p>
                    <p className="m-label mt-0.5" style={{ letterSpacing: "0.12em" }}>
                      Paid by {memberNames[expense.paid_by] ?? "Unknown"}
                    </p>
                  </div>
                  <span
                    className="shrink-0 tabular-nums"
                    style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, color: "var(--ink)" }}
                  >
                    ₹{(expense.amount / 100).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!loading && !error && expenses.length === 0 && (
            <p className="m-label py-4">Nothing charted yet — log the first spend</p>
          )}
        </div>
      </div>
    </AppShell>
  )
}

export default function ExpensesPage() {
  const params = useParams<{ tripId: string }>()
  return (
    <TripPlanningGate tripId={params.tripId}>
      <ExpensesContent />
    </TripPlanningGate>
  )
}
