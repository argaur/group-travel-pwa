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
            fill={i < filled ? "var(--accent)" : "var(--ink-15)"}
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
      <div className="card flat overflow-hidden">
        <div className="skeleton-hatch h-48 w-full" />
        <div className="p-5 space-y-2">
          <div className="skeleton-hatch h-4 w-2/3" />
          <div className="skeleton-hatch h-3 w-1/2" />
        </div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="px-4 py-3" style={{ border: "1.5px solid var(--ink-15)" }}>
        <p className="m-label">Could not load place details</p>
      </div>
    )
  }

  const heroPhoto = detail.photos[photoIndex]
  const hasMultiplePhotos = detail.photos.length > 1

  return (
    <div className="card flat overflow-hidden relative">
      {/* Hero photo */}
      <div
        className="relative h-48 overflow-hidden"
        style={{
          borderBottom: "2px solid var(--ink)",
          background: "linear-gradient(var(--ink-08) 1px, transparent 1px), linear-gradient(90deg, var(--ink-08) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        {heroPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPhoto}
            alt={detail.name}
            className="w-full h-full object-cover"
            style={{ filter: "saturate(0.85)" }}
          />
        )}

        {/* Photo navigation — squared ticks */}
        {hasMultiplePhotos && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {detail.photos.slice(0, 4).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPhotoIndex(i)}
                aria-label={`Photo ${i + 1}`}
                style={{
                  width: i === photoIndex ? 14 : 7,
                  height: 3,
                  background: i === photoIndex ? "var(--accent)" : "var(--paper)",
                  opacity: i === photoIndex ? 1 : 0.6,
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>
        )}

        {/* Sample badge */}
        {detail.source === "sample" && (
          <span className="chip absolute top-2 left-2" style={{ background: "var(--paper)" }}>
            Sample data
          </span>
        )}

        {/* Dismiss button */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center transition-colors"
            style={{ background: "var(--ink)", color: "var(--paper)", fontFamily: "var(--mono)" }}
          >
            ×
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="text-[19px] leading-snug" style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "var(--ink)" }}>
            {detail.name}
          </h3>
          {detail.formatted_address && (
            <p className="text-[12px] mt-1" style={{ fontFamily: "var(--body)", color: "var(--ink-60)" }}>
              {detail.formatted_address}
            </p>
          )}
        </div>

        {/* Rating */}
        {detail.rating != null && (
          <div className="flex items-center gap-2">
            <StarRating rating={detail.rating} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em", color: "var(--ink-60)" }}>
              {detail.rating}
              {detail.user_ratings_total != null && ` · ${detail.user_ratings_total.toLocaleString()} reviews`}
            </span>
          </div>
        )}

        {/* Reviews */}
        {detail.reviews.length > 0 && (
          <div className="space-y-2.5 pt-3" style={{ borderTop: "1px dashed var(--ink-15)" }}>
            {detail.reviews.slice(0, 3).map((r, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[12px]" style={{ fontFamily: "var(--body)", fontWeight: 600, color: "var(--ink)" }}>
                    {r.author}
                  </span>
                  {r.rating != null && <StarRating rating={r.rating} />}
                </div>
                {r.text && (
                  <p
                    className="text-[13px] line-clamp-3"
                    style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 400, lineHeight: 1.5, color: "var(--ink-60)" }}
                  >
                    &ldquo;{r.text}&rdquo;
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
