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
        <form onSubmit={addExpense} className="card p-5 space-y-3">
          <h2 className="text-lg font-semibold">Add expense</h2>
          <input
            className="w-full border border-black/10 rounded-xl px-3 py-2"
            placeholder="Amount (INR)"
            value={amountRupees}
            onChange={(e) => setAmountRupees(e.target.value)}
            type="number"
            min={0}
            step="0.01"
            required
          />
          <label className="block text-sm text-[var(--muted)]">Paid by</label>
          <select
            className="w-full border border-black/10 rounded-xl px-3 py-2"
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
          <select
            className="w-full border border-black/10 rounded-xl px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="food">Food</option>
            <option value="stay">Stay</option>
            <option value="transport">Transport</option>
            <option value="activities">Activities</option>
            <option value="other">Other</option>
          </select>
          <button
            className="w-full rounded-full bg-[var(--ink)] text-white px-4 py-2 disabled:opacity-50"
            disabled={submitting || loading || members.length === 0}
          >
            {submitting ? "Adding…" : "Add expense"}
          </button>
          {submitError && (
            <p className="text-sm text-red-600" role="alert">
              {submitError}
            </p>
          )}
          <a
            className="text-sm text-[var(--muted)] underline"
            href={`/trips/${params.tripId}/expenses/settlement`}
          >
            View settlement
          </a>
        </form>

        <div className="card p-5 space-y-3">
          <h2 className="text-lg font-semibold">Recent expenses</h2>
          {loading && (
            <p className="text-sm text-[var(--muted)]">Loading expenses…</p>
          )}
          {!loading && error && (
            <div className="space-y-2" role="alert">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={load}
                className="text-sm underline text-[var(--muted)]"
              >
                Retry
              </button>
            </div>
          )}
          {!loading && !error &&
            expenses.map((expense) => (
              <div key={expense.id} className="border border-black/5 rounded-2xl p-4">
                <p className="font-medium">{expense.category}</p>
                <p className="text-sm text-[var(--muted)]">
                  ₹{(expense.amount / 100).toFixed(2)} · Paid by{" "}
                  {memberNames[expense.paid_by] ?? "Unknown member"}
                </p>
              </div>
            ))}
          {!loading && !error && expenses.length === 0 && (
            <p className="text-sm text-[var(--muted)]">No expenses yet.</p>
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
