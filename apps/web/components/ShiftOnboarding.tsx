"use client";

import { useState } from "react";
import { SectionLabel } from "./ui";

const STEPS = [
  {
    title: "Read the digest",
    body: "Morning fleet summary — exceptions, deadlines, and top risks for this shift.",
    action: "Run digest",
  },
  {
    title: "Triage top exception",
    body: "Open the highest-ranked item in your queue. Review facts and runbook steps.",
    action: "Open top item",
  },
  {
    title: "Prep handoff",
    body: "Log shift notes and export markdown for the next operator.",
    action: "Open handoff",
  },
] as const;

type Props = {
  open: boolean;
  topItemId: string | null;
  digestLoading: boolean;
  onSkip: () => void;
  onComplete: () => void;
  onRunDigest: () => Promise<boolean>;
  onSelectTopItem: () => void;
  onOpenHandoff: () => void;
};

export default function ShiftOnboarding({
  open,
  topItemId,
  digestLoading,
  onSkip,
  onComplete,
  onRunDigest,
  onSelectTopItem,
  onOpenHandoff,
}: Props) {
  const [step, setStep] = useState(1);
  const [digestError, setDigestError] = useState(false);

  if (!open) return null;

  const current = STEPS[step - 1];

  const handlePrimary = async () => {
    if (step === 1) {
      setDigestError(false);
      const ok = await onRunDigest();
      if (ok) setStep(2);
      else setDigestError(true);
      return;
    }
    if (step === 2) {
      onSelectTopItem();
      setStep(3);
      return;
    }
    onOpenHandoff();
  };

  const primaryDisabled =
    (step === 1 && digestLoading) || (step === 2 && !topItemId);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-4 sm:inset-0 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shift-onboarding-title"
    >
      <div className="pointer-events-auto w-full max-w-md rounded-ops border border-ops-line bg-ops-panel p-4 shadow-lg sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <SectionLabel as="p" className="mb-1 block">
              Step {step} of {STEPS.length}
            </SectionLabel>
            <h2 id="shift-onboarding-title" className="text-sm font-semibold">
              {current.title}
            </h2>
          </div>
          <button type="button" onClick={onSkip} className="shrink-0 text-xs text-ops-muted hover:text-ops-text">
            Skip
          </button>
        </div>

        <p className="mb-4 text-sm leading-snug text-ops-muted">{current.body}</p>

        {step === 2 && topItemId && (
          <p className="mb-3 font-mono text-xs text-ops-text">{topItemId}</p>
        )}

        {digestError && (
          <p className="mb-3 text-xs text-ops-critical" role="alert">
            Digest failed — check connection and retry.
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={onSkip} className="text-xs text-ops-muted hover:text-ops-text">
            Skip tour
          </button>
          <div className="flex gap-2">
            {step === 3 && (
              <button type="button" onClick={onComplete} className="ops-btn-ghost text-xs">
                Done
              </button>
            )}
            <button
              type="button"
              onClick={() => void handlePrimary()}
              disabled={primaryDisabled}
              className="ops-btn-primary text-xs"
            >
              {step === 1 && digestLoading ? "Running…" : current.action}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
