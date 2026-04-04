"use client"

type WizardShellProps = {
  steps: string[]
  currentStep: number
  title: string
  subtitle?: string
  children: React.ReactNode
  onBack?: () => void
  onNext?: () => void
  onSubmit?: () => void
  nextLabel?: string
  submitLabel?: string
  nextDisabled?: boolean
  submitDisabled?: boolean
  loading?: boolean
}

export default function WizardShell({
  steps,
  currentStep,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  onSubmit,
  nextLabel = "Continue",
  submitLabel = "Submit",
  nextDisabled = false,
  submitDisabled = false,
  loading = false,
}: WizardShellProps) {
  const isLast = currentStep === steps.length - 1
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Progress bar */}
      <div className="h-[3px] bg-[var(--line)] relative">
        <div
          className="h-full bg-[var(--accent-lilac)] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 px-6 py-10 max-w-lg mx-auto w-full flex flex-col">
        {/* Step indicator */}
        <div
          className="text-[11px] uppercase tracking-widest text-[var(--muted)] mb-6"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Step {currentStep + 1} of {steps.length} · {steps[currentStep]}
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-[36px] leading-tight text-[var(--ink)]"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 300,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-[14px] text-[var(--muted)] mt-2"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Step dots */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full flex-1 transition-all duration-300"
              style={{
                background:
                  i < currentStep
                    ? "var(--accent-lilac)"
                    : i === currentStep
                    ? "var(--ink)"
                    : "var(--line)",
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">{children}</div>

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {onBack && currentStep > 0 && (
            <button
              type="button"
              onClick={onBack}
              className="h-12 px-5 rounded-[4px] border border-[var(--line)] text-[var(--ink)] text-[14px] transition-colors hover:border-[var(--ink)]/40"
              style={{ fontFamily: "var(--font-body)" }}
              disabled={loading}
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={isLast ? onSubmit : onNext}
            disabled={isLast ? submitDisabled || loading : nextDisabled || loading}
            className="flex-1 h-12 rounded-[4px] bg-[var(--ink)] text-white text-[14px] font-medium disabled:opacity-40 transition-opacity"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {loading
              ? "Loading…"
              : isLast
              ? submitLabel
              : nextLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
