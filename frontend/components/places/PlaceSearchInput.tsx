"use client"

import { useEffect, useRef, useState } from "react"
import { api } from "@/lib/api"

export type PlaceResult = {
  place_id: string
  name: string
  formatted_address: string | null
  rating: number | null
  primary_photo_url: string | null
}

type PlaceSearchInputProps = {
  value: string
  onSelect: (place: PlaceResult) => void
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function PlaceSearchInput({
  value,
  onSelect,
  onChange,
  placeholder = "Search for a place…",
  disabled,
}: PlaceSearchInputProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<PlaceResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  function handleChange(val: string) {
    setQuery(val)
    onChange?.(val)
    setFocused(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await api.get<{ results: PlaceResult[] }>(
          `/places/search?q=${encodeURIComponent(val)}`
        )
        setResults(data.results ?? [])
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  function select(place: PlaceResult) {
    setQuery(place.name)
    setResults([])
    setOpen(false)
    setFocused(-1)
    onSelect(place)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setFocused((f) => Math.min(f + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setFocused((f) => Math.max(f - 1, 0))
    } else if (e.key === "Enter" && focused >= 0) {
      e.preventDefault()
      select(results[focused])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-none border-[1.5px] border-[var(--ink-15)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition-colors pr-10 disabled:opacity-50"
          style={{ fontFamily: "var(--body)", color: "var(--ink)", background: "var(--paper)", minHeight: 44 }}
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="animate-spin"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle cx="8" cy="8" r="6" stroke="var(--ink-15)" strokeWidth="2" />
              <path d="M8 2a6 6 0 0 1 6 6" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden"
          style={{ background: "var(--paper)", border: "2px solid var(--ink)" }}
        >
          {results.map((place, i) => (
            <button
              key={place.place_id}
              type="button"
              onMouseDown={() => select(place)}
              className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-2.5 border-b border-dashed border-[var(--ink-15)] last:border-b-0 ${
                i === focused ? "bg-[var(--paper-edge)]" : "hover:bg-[var(--paper-edge)]"
              }`}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="mt-1 shrink-0">
                <path d="M6 1a3.2 3.2 0 0 0-3.2 3.2c0 2.3 3.2 6 3.2 6s3.2-3.7 3.2-6A3.2 3.2 0 0 0 6 1z" stroke="var(--accent)" strokeWidth="1.2" />
                <circle cx="6" cy="4.2" r="1.1" fill="var(--accent)" />
              </svg>
              <span className="min-w-0">
                <span
                  className="block text-[13px] font-medium text-[var(--ink)] truncate"
                  style={{ fontFamily: "var(--body)" }}
                >
                  {place.name}
                </span>
                {place.formatted_address && (
                  <span
                    className="block text-[11px] text-[var(--ink-60)] truncate mt-0.5"
                    style={{ fontFamily: "var(--body)" }}
                  >
                    {place.formatted_address}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && !loading && results.length === 0 && query.length >= 2 && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-50 px-4 py-3"
          style={{ background: "var(--paper)", border: "2px solid var(--ink)" }}
        >
          <p className="m-label">Nothing charted for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  )
}
