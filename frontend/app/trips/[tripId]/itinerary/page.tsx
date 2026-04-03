"use client"

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import AppShell from "@/components/AppShell"

type Item = {
  id: string
  day_number: number
  title: string
  location: string | null
}

export default function ItineraryPage() {
  const params = useParams<{ tripId: string }>()
  const [items, setItems] = useState<Item[]>([])
  const [day, setDay] = useState("1")
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")

  const load = useCallback(async () => {
    const data = await api.get<Item[]>(`/trips/${params.tripId}/itinerary`)
    setItems(data)
  }, [params.tripId])

  useEffect(() => {
    load()
  }, [load])

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    await api.post(`/trips/${params.tripId}/itinerary/days/${day}/items`, {
      title,
      location: location || null,
    })
    setTitle("")
    setLocation("")
    load()
  }

  return (
    <AppShell
      tripId={params.tripId}
      active="itinerary"
      title="Itinerary"
      subtitle="Shared day-by-day plan"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <form onSubmit={addItem} className="card p-5 space-y-3">
          <h2 className="text-lg font-semibold">Add item</h2>
          <input
            className="w-full border border-black/10 rounded-xl px-3 py-2"
            placeholder="Day number"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            type="number"
            min={1}
          />
          <input
            className="w-full border border-black/10 rounded-xl px-3 py-2"
            placeholder="Item title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            className="w-full border border-black/10 rounded-xl px-3 py-2"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <button className="w-full rounded-full bg-[var(--ink)] text-white px-4 py-2">
            Add item
          </button>
        </form>

        <div className="card p-5 space-y-3">
          <h2 className="text-lg font-semibold">Schedule</h2>
          {items.map((item) => (
            <div key={item.id} className="border border-black/5 rounded-2xl p-4">
              <p className="font-medium">
                Day {item.day_number}: {item.title}
              </p>
              {item.location && (
                <p className="text-sm text-[var(--muted)]">{item.location}</p>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-[var(--muted)]">No itinerary items yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  )
}
