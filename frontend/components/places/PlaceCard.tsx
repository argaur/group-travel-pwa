"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

type PlaceDetail = {
  place_id: string
  name: string
  formatted_address: string | null
  rating: number | null
  user_ratings_total: number | null
  reviews: Array<{ author: string; rating: number | null; text: string | null }>
  photos: string[]
  source?: string
}

type PlaceCardProps = {
  placeId: string
  onDismiss?: () => void
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  const filled = Math.round(rating)
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1l1.24 2.56L10 4.1l-2 1.94.47 2.74L6 7.5 3.53 8.78 4 6.04 2 4.1l2.76-.54L6 1z"
            fill={i < filled ? "var(--accent-coral)" : "var(--line)"}
          />
        </svg>
      ))}
    </span>
  )
}

export default function PlaceCard({ placeId, onDismiss }: PlaceCardProps) {
  const [detail, setDetail] = useState<PlaceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [photoIndex, setPhotoIndex] = useState(0)

  useEffect(() => {
    setLoading(true)
    api
      .get<PlaceDetail>(`/places/${placeId}`)
      .then((d) => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [placeId])

  if (loading) {
    return (
      <div className="bg-white border border-[var(--line)] rounded-[4px] overflow-hidden animate-pulse">
        <div className="h-48 bg-[var(--line)]" />
        <div className="p-5 space-y-2">
          <div className="h-4 bg-[var(--line)] rounded w-2/3" />
          <div className="h-3 bg-[var(--line)] rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="border border-[var(--line)] rounded-[4px] px-4 py-3 text-sm text-[var(--muted)]">
        Could not load place details.
      </div>
    )
  }

  const heroPhoto = detail.photos[photoIndex]
  const hasMultiplePhotos = detail.photos.length > 1

  return (
    <div className="bg-white border border-[var(--line)] rounded-[4px] overflow-hidden relative">
      {/* Hero photo */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[var(--bg)] to-[var(--accent-coral)]/30">
        {heroPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPhoto}
            alt={detail.name}
            className="w-full h-full object-cover"
          />
        )}

        {/* Photo navigation */}
        {hasMultiplePhotos && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {detail.photos.slice(0, 4).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPhotoIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === photoIndex ? "bg-white scale-125" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* Sample badge */}
        {detail.source === "sample" && (
          <span
            className="absolute top-2 left-2 text-[10px] px-2 py-0.5 bg-black/40 text-white rounded-full"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Sample data
          </span>
        )}

        {/* Dismiss button */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-2 right-2 w-7 h-7 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors text-sm"
          >
            ×
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <div>
          <h3
            className="text-[18px] leading-snug text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
          >
            {detail.name}
          </h3>
          {detail.formatted_address && (
            <p
              className="text-[12px] text-[var(--muted)] mt-0.5"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {detail.formatted_address}
            </p>
          )}
        </div>

        {/* Rating */}
        {detail.rating != null && (
          <div className="flex items-center gap-2">
            <StarRating rating={detail.rating} />
            <span className="text-[12px] text-[var(--muted)]" style={{ fontFamily: "var(--font-body)" }}>
              {detail.rating}
              {detail.user_ratings_total != null && ` · ${detail.user_ratings_total.toLocaleString()} reviews`}
            </span>
          </div>
        )}

        {/* Reviews */}
        {detail.reviews.length > 0 && (
          <div className="space-y-2 border-t border-[var(--line)] pt-3">
            {detail.reviews.slice(0, 3).map((r, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[12px] font-medium text-[var(--ink)]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {r.author}
                  </span>
                  {r.rating != null && <StarRating rating={r.rating} />}
                </div>
                {r.text && (
                  <p
                    className="text-[12px] text-[var(--muted)] line-clamp-3"
                    style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300, lineHeight: 1.5 }}
                  >
                    "{r.text}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
