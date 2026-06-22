import Link from "next/link";
import { Panel } from "@/components/ui";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 overflow-y-auto px-4 py-6">
      <header>
        <h1 className="font-brand text-lg lowercase tracking-widest text-ops-chrome">grid ops command</h1>
        <p className="mt-1 text-sm text-ops-muted-bright">
          Shift console demo — synthetic private-grid fleet data.
        </p>
      </header>

      <p className="text-sm leading-relaxed text-ops-text/90">
        Imagine an operator starting a 12-hour shift on a fleet of data-center and industrial sites
        connected to a private grid. This app answers:{" "}
        <strong className="font-medium text-ops-text">which site needs attention first</strong>, what
        the runbook says, whether a schedule slip breaks a contract SLA, and what to leave for the
        next shift. Answers cite fixture data — the API shape matches how you&apos;d wire CRM and
        telemetry later.
      </p>

      <Panel title="Three screens">
        <ul className="space-y-3 text-sm">
          <li>
            <Link href="/" className="text-ops-teal-hover hover:text-ops-green">
              Shift
            </Link>{" "}
            — priority queue (risk score), site detail, runbook checklist, triage status, what-if
            questions, ops summaries with sources.
          </li>
          <li>
            <Link href="/fleet" className="text-ops-teal-hover hover:text-ops-green">
              Capacity
            </Link>{" "}
            — megawatts contracted vs available, split by bridge/permanent sites and GFA agreement
            tranches.
          </li>
          <li>
            <Link href="/pipeline" className="text-ops-teal-hover hover:text-ops-green">
              Deadlines
            </Link>{" "}
            — commissioning dates for bridge→permanent transitions, overdue and due-soon filters.
          </li>
        </ul>
      </Panel>

      <Panel title="Terms you’ll see (industry)">
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium text-ops-text">MW / capacity gap</dt>
            <dd className="text-ops-muted">Megawatts contracted minus what’s actually available.</dd>
          </div>
          <div>
            <dt className="font-medium text-ops-text">SLA</dt>
            <dd className="text-ops-muted">Contract uptime or delivery deadline — slip scenarios test breach risk.</dd>
          </div>
          <div>
            <dt className="font-medium text-ops-text">GFA tranche</dt>
            <dd className="text-ops-muted">Grid facility agreement — a capacity bucket in the fleet rollup.</dd>
          </div>
          <div>
            <dt className="font-medium text-ops-text">Exception / watch</dt>
            <dd className="text-ops-muted">Site health flags — exception needs action, watch is elevated monitoring.</dd>
          </div>
          <div>
            <dt className="font-medium text-ops-text">Runbook</dt>
            <dd className="text-ops-muted">Step-by-step operator checklist for a known failure mode.</dd>
          </div>
        </dl>
      </Panel>

      <Panel title="AI governance & testing">
        <ul className="list-disc space-y-1.5 pl-4 text-sm text-ops-muted">
          <li>
            Ops summaries are <strong className="text-ops-text">citation-backed</strong> — every brief must
            cite fixture sources; invalid output is rejected.
          </li>
          <li>
            <strong className="text-ops-text">Golden query regression</strong> in{" "}
            <code className="text-ops-teal-hover">packages/core/tests/brief-evals.test.ts</code> — run via{" "}
            <code className="text-ops-teal-hover">npm test</code>.
          </li>
          <li>
            Optional LLM layer (toolbar toggle) only when <code className="text-ops-teal-hover">OPENAI_API_KEY</code>{" "}
            is set — must pass the same validator or falls back to the planner.
          </li>
          <li>
            Toolbar <strong className="text-ops-text">audit</strong> logs triage, runbook, scenario, brief, and
            handoff export — included in shift markdown export.
          </li>
          <li>
            Same ops tools over <strong className="text-ops-text">HTTP + MCP</strong> — see{" "}
            <code className="text-ops-teal-hover">docs/MCP.md</code>.
          </li>
        </ul>
      </Panel>

      <Panel title="Integrations (REST → Azure)">
        <p className="mb-2 text-sm text-ops-muted">
          API routes here use the same HTTP + JSON contract you would deploy as Azure Functions or behind API
          Management. Microsoft Graph is also REST — our adapter returns fixture signals by default.
        </p>
        <ul className="list-disc space-y-1 pl-4 text-sm text-ops-muted">
          <li>
            <code className="text-ops-teal-hover">GET /api/integrations/graph</code> — calendar / mail / Teams-shaped
            shift signals
          </li>
          <li>
            Set <code className="text-ops-teal-hover">AZURE_GRAPH_TOKEN</code> +{" "}
            <code className="text-ops-teal-hover">AZURE_GRAPH_MODE=live</code> for real Graph calendar read
          </li>
          <li>
            Full JD mapping:{" "}
            <code className="text-ops-teal-hover">docs/ATLAS-ALIGNMENT.md</code>
          </li>
        </ul>
      </Panel>

      <Panel title="Keyboard">
        <ul className="list-disc space-y-1 pl-4 text-sm text-ops-muted">
          <li>
            <kbd className="font-mono text-ops-text">↑</kbd> /{" "}
            <kbd className="font-mono text-ops-text">↓</kbd> — move in the site queue
          </li>
          <li>
            <kbd className="font-mono text-ops-text">[</kbd> /{" "}
            <kbd className="font-mono text-ops-text">]</kbd> — cycle queue filters
          </li>
          <li>
            <kbd className="font-mono text-ops-text">←</kbd> /{" "}
            <kbd className="font-mono text-ops-text">→</kbd> — switch screens
          </li>
          <li>
            <kbd className="font-mono text-ops-text">Ctrl+K</kbd> — jump to a site or quick ask
          </li>
          <li>
            <kbd className="font-mono text-ops-text">?</kbd> — shortcuts overlay
          </li>
        </ul>
      </Panel>

      <Link href="/" className="ld-backslash text-sm text-ops-teal-hover hover:text-ops-green">
        back to shift console
      </Link>
    </div>
  );
}
