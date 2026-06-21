import Link from "next/link";
import { Panel } from "@/components/ui";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-lg font-semibold">Grid Ops Command</h1>
        <p className="mt-1 text-sm text-ops-muted">
          Private-grid shift console — triage, runbooks, handoff export.
        </p>
      </header>

      <p className="text-sm leading-relaxed text-ops-text/90">
        Operator-first console for risk-ranked deployments, per-shift triage state, inline
        runbooks, and exportable handoff bundles. Synthetic fleet data; production-shaped
        API and audit trail.
      </p>

      <Panel title="Console workflow">
        <ul className="space-y-2 text-sm">
          <li>
            <strong className="text-ops-text">Risk queue</strong> — filter by status or your
            triage; pin deployments to keep them at the top of the list.
          </li>
          <li>
            <strong className="text-ops-text">Detail panel</strong> — contract, runbook, and
            triage controls without auto-generating briefs.
          </li>
          <li>
            <strong className="text-ops-text">Shift handoff</strong> — notes plus markdown
            export for the next shift lead.
          </li>
          <li>
            <strong className="text-ops-text">Command palette</strong> —{" "}
            <kbd className="rounded-ops border border-ops-line px-1 font-mono text-[10px]">
              Ctrl+K
            </kbd>{" "}
            to jump to a deployment or run a shift action.
          </li>
        </ul>
      </Panel>

      <Panel title="Modules">
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/" className="text-ops-amber hover:underline">
              Console
            </Link>{" "}
            — triage queue, detail, shift actions, handoff
          </li>
          <li>
            <Link href="/fleet" className="text-ops-amber hover:underline">
              Fleet
            </Link>{" "}
            — GFA tranche MW rollup
          </li>
          <li>
            <Link href="/pipeline" className="text-ops-amber hover:underline">
              Pipeline
            </Link>{" "}
            — commissioning deadlines
          </li>
        </ul>
      </Panel>

      <Panel title="Keyboard">
        <ul className="list-disc space-y-1 pl-4 text-sm text-ops-muted">
          <li>
            <kbd className="font-mono text-ops-amber">j</kbd> /{" "}
            <kbd className="font-mono text-ops-amber">k</kbd> — move queue selection
          </li>
          <li>
            <kbd className="font-mono text-ops-amber">Ctrl+K</kbd> — command palette
          </li>
          <li>
            <kbd className="font-mono text-ops-amber">?</kbd> — shortcuts overlay
          </li>
        </ul>
      </Panel>

      <Link href="/" className="text-sm text-ops-amber hover:underline">
        ← Console
      </Link>
    </div>
  );
}
