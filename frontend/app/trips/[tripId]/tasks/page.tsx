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
        <form onSubmit={createTask} className="card p-5 md:p-6 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl" style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>Create task</h2>
            <span className="m-label">New entry</span>
          </div>
          <div>
            <label className="field-label block mb-1.5">Task title</label>
            <input
              className="field-input"
              placeholder="e.g. Book the stay"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label block mb-1.5">Category</label>
            <select className="field-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="flights">Flights</option>
              <option value="accommodation">Accommodation</option>
              <option value="food">Food</option>
              <option value="transport">Transport</option>
              <option value="activities">Activities</option>
              <option value="documents">Documents</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="field-label block mb-1.5">Assign to</label>
            <select className="field-select" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              <option value="">Assign to… (optional)</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label block mb-1.5">Due date</label>
            <input
              type="date"
              className="field-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <button className="cta sm w-full">
            Add task <span className="arrow" aria-hidden="true">→</span>
          </button>
        </form>

        <div className="card p-5 md:p-6">
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <h2 className="text-xl" style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>The manifest</h2>
            <span className="m-label"><b>{tasks.length}</b> logged</span>
          </div>
          <ul>
            {tasks.map((task) => {
              const isDone = task.status === "done"
              return (
                <li
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3.5"
                  style={{ borderTop: "1px dashed var(--ink-15)" }}
                >
                  <div className="min-w-0">
                    <p
                      className="text-[15px]"
                      style={{
                        fontFamily: "var(--body)",
                        fontWeight: 600,
                        color: isDone ? "var(--ink-40)" : "var(--ink)",
                        textDecoration: isDone ? "line-through" : undefined,
                        textDecorationColor: "var(--accent)",
                      }}
                    >
                      {task.title}
                    </p>
                    <p className="m-label mt-1" style={{ letterSpacing: "0.12em" }}>
                      {task.category} · {task.status} · {assigneeName(task.assigned_to)}
                      {task.due_date ? ` · Due ${task.due_date}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {!isDone && (
                      <>
                        <button type="button" className="cta-ghost" onClick={() => markDone(task.id)}>
                          Mark done
                        </button>
                        {task.assigned_to && (
                          <button type="button" className="cta-ghost" onClick={() => nudge(task.id)}>
                            Nudge
                          </button>
                        )}
                      </>
                    )}
                    {isDone && <span className="chip hot">◆ Done</span>}
                  </div>
                </li>
              )
            })}
          </ul>
          {tasks.length === 0 && (
            <p className="m-label py-4">Nothing charted yet — add the first task</p>
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
