"use client"

import { Contours } from "@/components/Contours"

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
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "var(--paper)" }}>
      <Contours fixed />

      {/* Route progress — the plan drawing itself, step by step */}
      <div style={{ height: 3, background: "var(--ink-15)", position: "relative" }}>
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, background: "var(--accent)" }}
        />
      </div>

      <div className="flex-1 px-6 py-10 max-w-lg mx-auto w-full flex flex-col relative z-10">
        {/* Step indicator */}
        <span className="fig-tag" style={{ marginBottom: 22 }}>
          <b>№ {String(currentStep + 1).padStart(2, "0")}</b> {steps[currentStep]} · {currentStep + 1} of {steps.length}
        </span>

        {/* Header */}
        <div className="mb-8 mt-2">
          <h1
            className="text-[34px] md:text-[40px] leading-tight"
            style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-[15px] mt-3" style={{ fontFamily: "var(--body)", color: "var(--ink-60)" }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Step ticks — waypoints along the route */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-[3px] flex-1 transition-all duration-300"
              style={{
                background:
                  i < currentStep
                    ? "var(--accent)"
                    : i === currentStep
                    ? "var(--ink)"
                    : "var(--ink-15)",
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">{children}</div>

        {/* Navigation */}
        <div className="mt-8 flex gap-3 items-stretch">
          {onBack && currentStep > 0 && (
            <button
              type="button"
              onClick={onBack}
              className="cta-ghost"
              disabled={loading}
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={isLast ? onSubmit : onNext}
            disabled={isLast ? submitDisabled || loading : nextDisabled || loading}
            className="cta flex-1"
          >
            {loading ? "Plotting…" : isLast ? submitLabel : nextLabel}
            {!loading && <span className="arrow" aria-hidden="true">→</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
