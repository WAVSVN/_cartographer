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
        A <strong className="font-medium text-ops-text">shift workbench</strong> for private-grid
        deployments: risk-ranked queue, inline runbooks, triage state, SLA slip scenarios, and
        handoff export. Fixture fleet today; API and MCP match how you&apos;d wire CRM and telemetry.
      </p>

      <Panel title="What you do on shift">
        <ul className="space-y-2 text-sm">
          <li>
            <strong className="text-ops-text">Queue</strong> — pick the highest-risk site; detail and
            runbook load without auto-brief.
          </li>
          <li>
            <strong className="text-ops-text">Triage</strong> — ack, investigate, escalate; pin sites
            you own.
          </li>
          <li>
            <strong className="text-ops-text">Scenario</strong> — +2w / +4w slip on a deployment; see
            SLA impact inline.
          </li>
          <li>
            <strong className="text-ops-text">Handoff</strong> — toolbar export: fleet, exceptions,
            notes, briefs → markdown for the next shift.
          </li>
        </ul>
      </Panel>

      <Panel title="Modules">
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/" className="text-ops-link hover:underline">
              Console
            </Link>{" "}
            — triage queue, detail, shift actions, handoff
          </li>
          <li>
            <Link href="/fleet" className="text-ops-link hover:underline">
              Fleet
            </Link>{" "}
            — GFA tranche MW rollup
          </li>
          <li>
            <Link href="/pipeline" className="text-ops-link hover:underline">
              Pipeline
            </Link>{" "}
            — commissioning deadlines
          </li>
        </ul>
      </Panel>

      <Panel title="Keyboard">
        <ul className="list-disc space-y-1 pl-4 text-sm text-ops-muted">
          <li>
            <kbd className="font-mono text-ops-text">j</kbd> /{" "}
            <kbd className="font-mono text-ops-text">k</kbd> — move queue selection
          </li>
          <li>
            <kbd className="font-mono text-ops-text">Ctrl+K</kbd> — command palette
          </li>
          <li>
            <kbd className="font-mono text-ops-text">?</kbd> — shortcuts overlay
          </li>
        </ul>
      </Panel>

      <Link href="/" className="text-sm text-ops-link hover:underline">
        ← Console
      </Link>
    </div>
  );
}
