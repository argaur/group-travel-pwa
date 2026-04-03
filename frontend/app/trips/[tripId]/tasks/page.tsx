"use client"

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { ensureBackendToken } from "@/lib/backend-auth"
import AppShell from "@/components/AppShell"
import TripPlanningGate from "@/components/TripPlanningGate"

type Task = {
  id: string
  title: string
  category: string
  assigned_to: string | null
  status: string
  due_date: string | null
}

type MemberRow = {
  user: { id: string; name: string }
  role: string
  preference_submitted: boolean
}

function TasksContent() {
  const params = useParams<{ tripId: string }>()
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<MemberRow[]>([])
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("flights")
  const [assignedTo, setAssignedTo] = useState("")
  const [dueDate, setDueDate] = useState("")

  const load = useCallback(async () => {
    await ensureBackendToken()
    const [data, mems] = await Promise.all([
      api.get<Task[]>(`/trips/${params.tripId}/tasks`),
      api.get<MemberRow[]>(`/trips/${params.tripId}/members`),
    ])
    setTasks(data)
    setMembers(mems)
  }, [params.tripId])

  useEffect(() => {
    load()
  }, [load])

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    await api.post(`/trips/${params.tripId}/tasks`, {
      title,
      category,
      ...(assignedTo ? { assigned_to: assignedTo } : {}),
      ...(dueDate ? { due_date: dueDate } : {}),
    })
    setTitle("")
    setAssignedTo("")
    setDueDate("")
    load()
  }

  async function markDone(taskId: string) {
    await api.put(`/trips/${params.tripId}/tasks/${taskId}`, { status: "done" })
    load()
  }

  async function nudge(taskId: string) {
    await api.post(`/trips/${params.tripId}/tasks/${taskId}/nudge`, {})
  }

  function assigneeName(id: string | null) {
    if (!id) return "—"
    return members.find((m) => m.user.id === id)?.user.name ?? id.slice(0, 8)
  }

  return (
    <AppShell
      tripId={params.tripId}
      active="tasks"
      title="Task board"
      subtitle="Distribute planning work across members"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <form onSubmit={createTask} className="card p-5 space-y-3">
          <h2 className="text-lg font-semibold">Create task</h2>
          <input
            className="w-full border border-black/10 rounded-xl px-3 py-2"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <select
            className="w-full border border-black/10 rounded-xl px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="flights">Flights</option>
            <option value="accommodation">Accommodation</option>
            <option value="food">Food</option>
            <option value="transport">Transport</option>
            <option value="activities">Activities</option>
            <option value="documents">Documents</option>
            <option value="other">Other</option>
          </select>
          <select
            className="w-full border border-black/10 rounded-xl px-3 py-2"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          >
            <option value="">Assign to… (optional)</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="w-full border border-black/10 rounded-xl px-3 py-2"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <button className="w-full rounded-full bg-[var(--ink)] text-white px-4 py-2">
            Add task
          </button>
        </form>

        <div className="card p-5 space-y-3">
          <h2 className="text-lg font-semibold">Active tasks</h2>
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-black/5 rounded-2xl px-4 py-3"
            >
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-xs text-[var(--muted)]">
                  {task.category} · {task.status} · Assigned: {assigneeName(task.assigned_to)}
                  {task.due_date ? ` · Due ${task.due_date}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {task.status !== "done" && (
                  <>
                    <button
                      type="button"
                      className="text-xs rounded-full border border-black/10 px-3 py-1"
                      onClick={() => markDone(task.id)}
                    >
                      Mark done
                    </button>
                    {task.assigned_to && (
                      <button
                        type="button"
                        className="text-xs rounded-full border border-black/10 px-3 py-1"
                        onClick={() => nudge(task.id)}
                      >
                        Nudge assignee
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-sm text-[var(--muted)]">No tasks yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  )
}

export default function TasksPage() {
  const params = useParams<{ tripId: string }>()
  return (
    <TripPlanningGate tripId={params.tripId}>
      <TasksContent />
    </TripPlanningGate>
  )
}
