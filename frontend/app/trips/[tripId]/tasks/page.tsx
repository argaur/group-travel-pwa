"use client"

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import AppShell from "@/components/AppShell"

type Task = {
  id: string
  title: string
  category: string
  assigned_to: string | null
  status: string
  due_date: string | null
}

export default function TasksPage() {
  const params = useParams<{ tripId: string }>()
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("flights")

  const load = useCallback(async () => {
    const data = await api.get<Task[]>(`/trips/${params.tripId}/tasks`)
    setTasks(data)
  }, [params.tripId])

  useEffect(() => {
    load()
  }, [load])

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    await api.post(`/trips/${params.tripId}/tasks`, {
      title,
      category,
    })
    setTitle("")
    load()
  }

  async function markDone(taskId: string) {
    await api.put(`/trips/${params.tripId}/tasks/${taskId}`, { status: "done" })
    load()
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
          <button className="w-full rounded-full bg-[var(--ink)] text-white px-4 py-2">
            Add task
          </button>
        </form>

        <div className="card p-5 space-y-3">
          <h2 className="text-lg font-semibold">Active tasks</h2>
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between border border-black/5 rounded-2xl px-4 py-3"
            >
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-xs text-[var(--muted)]">
                  {task.category} · {task.status}
                </p>
              </div>
              {task.status !== "done" && (
                <button
                  className="text-xs rounded-full border border-black/10 px-3 py-1"
                  onClick={() => markDone(task.id)}
                >
                  Mark done
                </button>
              )}
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
