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
      {/* Thumbnail — squared specimen tile on gridded paper */}
      <div
        className="w-12 h-12 overflow-hidden shrink-0 relative"
        style={{
          border: "1.5px solid var(--ink-15)",
          background:
            "linear-gradient(var(--ink-08) 1px, transparent 1px), linear-gradient(90deg, var(--ink-08) 1px, transparent 1px), var(--paper-deep)",
          backgroundSize: "10px 10px",
        }}
      >
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={name} className="w-full h-full object-cover" style={{ filter: "saturate(0.85)" }} />
        )}
        {onClick && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            style={{ background: "rgba(29,37,49,0.55)" }}
          >
            <span style={{ color: "var(--paper)", fontFamily: "var(--mono)", fontSize: 11 }}>↗</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 text-left">
        <p
          className="text-[13px] font-medium text-[var(--ink)] truncate"
          style={{ fontFamily: "var(--body)" }}
        >
          {name}
        </p>
        {rating != null && (
          <p
            className="text-[11px] text-[var(--ink-60)] flex items-center gap-1 mt-0.5"
            style={{ fontFamily: "var(--mono)", letterSpacing: "0.08em" }}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M6 1l1.24 2.56L10 4.1l-2 1.94.47 2.74L6 7.5 3.53 8.78 4 6.04 2 4.1l2.76-.54L6 1z" fill="var(--accent)" />
            </svg>
            {rating}
          </p>
        )}
      </div>
    </button>
  )
}
