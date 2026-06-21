import Link from "next/link";
import { Panel } from "@/components/ui";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-lg font-semibold">Grid Ops Command</h1>
        <p className="mt-1 text-sm text-ops-muted">
          Portfolio demo by Trevor Achtermann — not affiliated with Atlas Energy Solutions.
        </p>
      </header>

      <p className="text-sm leading-relaxed text-ops-text/90">
        Private-grid operations intelligence: fleet MW rollups, bridge-to-permanent pipeline,
        risk-ranked queue, morning digest, and governed scenario briefs. Synthetic data; production-shaped
        architecture.
      </p>

      <Panel title="Modules">
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/" className="text-ops-amber hover:underline">
              Console
            </Link>{" "}
            — auto morning digest, playbook, risk queue
          </li>
          <li>
            <Link href="/fleet" className="text-ops-amber hover:underline">
              Fleet
            </Link>{" "}
            — GFA tranche rollup
          </li>
          <li>
            <Link href="/pipeline" className="text-ops-amber hover:underline">
              Pipeline
            </Link>{" "}
            — commissioning deadlines
          </li>
        </ul>
      </Panel>

      <Panel title="60-second demo path">
        <ol className="list-decimal space-y-1 pl-4 text-sm text-ops-muted">
          <li>Open Console — morning digest loads automatically</li>
          <li>Click BRG-2047 in risk queue</li>
          <li>Run SLA slip scenario from playbook</li>
          <li>Show Fleet GFA tranche rollup</li>
        </ol>
      </Panel>

      <Panel title="Production integration">
        <ul className="list-disc space-y-1 pl-4 text-sm text-ops-muted">
          <li>SCADA / telemetry → MW and unit status</li>
          <li>CRM → SLA and bridge-to-permanent contracts</li>
          <li>Runbook CMS → operator playbooks</li>
          <li>Entra ID + immutable audit log</li>
        </ul>
      </Panel>

      <Link href="/" className="text-sm text-ops-amber hover:underline">
        ← Console
      </Link>
    </div>
  );
}
