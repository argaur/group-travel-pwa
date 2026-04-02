"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { getBackendUserId } from "@/lib/backend-auth"
import AppShell from "@/components/AppShell"

type Expense = {
  id: string
  amount: number
  category: string
  paid_by: string
  split_type: string
  description: string | null
}

export default function ExpensesPage() {
  const params = useParams<{ tripId: string }>()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("food")
  const [paidBy, setPaidBy] = useState("")

  async function load() {
    const data = await api.get<Expense[]>(`/trips/${params.tripId}/expenses`)
    setExpenses(data)
  }

  useEffect(() => {
    load()
    const id = getBackendUserId()
    if (id) setPaidBy(id)
  }, [params.tripId])

  async function addExpense(e: React.FormEvent) {
    e.preventDefault()
    await api.post(`/trips/${params.tripId}/expenses`, {
      amount: Number(amount),
      category,
      paid_by: paidBy,
      split_type: "equal",
    })
    setAmount("")
    setPaidBy("")
    load()
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
            placeholder="Amount (paise)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min={0}
            required
          />
          <input
            className="w-full border border-black/10 rounded-xl px-3 py-2"
            placeholder="Paid by (user id)"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            required
          />
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
          <button className="w-full rounded-full bg-[var(--ink)] text-white px-4 py-2">
            Add expense
          </button>
          <a
            className="text-sm text-[var(--muted)] underline"
            href={`/trips/${params.tripId}/expenses/settlement`}
          >
            View settlement
          </a>
        </form>

        <div className="card p-5 space-y-3">
          <h2 className="text-lg font-semibold">Recent expenses</h2>
          {expenses.map((expense) => (
            <div key={expense.id} className="border border-black/5 rounded-2xl p-4">
              <p className="font-medium">{expense.category}</p>
              <p className="text-sm text-[var(--muted)]">
                ₹{(expense.amount / 100).toFixed(2)} · Paid by {expense.paid_by}
              </p>
            </div>
          ))}
          {expenses.length === 0 && (
            <p className="text-sm text-[var(--muted)]">No expenses yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  )
}
