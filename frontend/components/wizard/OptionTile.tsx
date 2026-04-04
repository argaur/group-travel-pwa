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
  accentColor = "var(--accent-lilac)",
  disabled = false,
}: OptionTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left p-4 rounded-[4px] border transition-all duration-150 relative"
      style={{
        borderColor: selected ? accentColor : "var(--line)",
        background: selected ? `${accentColor}10` : "white",
        borderWidth: selected ? "2px" : "1px",
        fontFamily: "var(--font-body)",
      }}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span
            className="text-[24px] shrink-0 leading-none"
            role="img"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p
            className="text-[14px] font-medium text-[var(--ink)] leading-tight"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {label}
          </p>
          {description && (
            <p
              className="text-[12px] text-[var(--muted)] mt-0.5"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {description}
            </p>
          )}
        </div>
        <div
          className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all"
          style={{
            borderColor: selected ? accentColor : "var(--line)",
            background: selected ? accentColor : "transparent",
          }}
        >
          {selected && (
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          )}
        </div>
      </div>
    </button>
  )
}
