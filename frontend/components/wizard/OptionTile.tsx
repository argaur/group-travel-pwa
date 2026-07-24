"use client"

type OptionTileProps = {
  label: string
  description?: string
  icon?: string
  selected: boolean
  onClick: () => void
  accentColor?: string
  disabled?: boolean
}

export default function OptionTile({
  label,
  description,
  icon,
  selected,
  onClick,
  accentColor = "var(--accent)",
  disabled = false,
}: OptionTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left p-4 relative transition-all duration-150 disabled:opacity-40"
      style={{
        borderStyle: "solid",
        borderColor: selected ? accentColor : "var(--ink-15)",
        borderWidth: selected ? "2px" : "1.5px",
        background: selected ? "var(--paper-edge)" : "var(--paper)",
        borderRadius: 0,
        minHeight: 44,
      }}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span className="text-[22px] shrink-0 leading-none" role="img" aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p
            className="text-[15px] leading-tight"
            style={{ fontFamily: "var(--body)", fontWeight: 600, color: "var(--ink)" }}
          >
            {label}
          </p>
          {description && (
            <p className="text-[12px] mt-0.5" style={{ fontFamily: "var(--body)", color: "var(--ink-60)" }}>
              {description}
            </p>
          )}
        </div>
        {/* Squared select mark */}
        <span
          className="shrink-0 flex items-center justify-center transition-all"
          style={{
            width: 18,
            height: 18,
            borderStyle: "solid",
            borderWidth: selected ? 0 : 1.5,
            borderColor: "var(--ink-15)",
            background: selected ? accentColor : "transparent",
            color: "var(--paper)",
            fontFamily: "var(--mono)",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {selected ? "✓" : ""}
        </span>
      </div>
    </button>
  )
}
