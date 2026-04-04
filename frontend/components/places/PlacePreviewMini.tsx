"use client"

type PlacePreviewMiniProps = {
  photoUrl?: string | null
  name: string
  rating?: number | null
  onClick?: () => void
}

export default function PlacePreviewMini({ photoUrl, name, rating, onClick }: PlacePreviewMiniProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`flex items-center gap-2.5 group ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-[4px] overflow-hidden shrink-0 bg-gradient-to-br from-[var(--accent-coral)]/20 to-[var(--accent-lilac)]/20 relative">
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        )}
        {onClick && (
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-[10px]">↗</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 text-left">
        <p
          className="text-[13px] font-medium text-[var(--ink)] truncate"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {name}
        </p>
        {rating != null && (
          <p className="text-[11px] text-[var(--muted)] flex items-center gap-1 mt-0.5" style={{ fontFamily: "var(--font-body)" }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M6 1l1.24 2.56L10 4.1l-2 1.94.47 2.74L6 7.5 3.53 8.78 4 6.04 2 4.1l2.76-.54L6 1z" fill="var(--accent-coral)" />
            </svg>
            {rating}
          </p>
        )}
      </div>
    </button>
  )
}
