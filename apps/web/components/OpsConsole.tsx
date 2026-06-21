"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { BriefResponse, RiskRankedDeployment } from "@/lib/types";
import BriefCard from "./BriefCard";
import { Panel, RiskBar, Skeleton, StatusBadge } from "./ui";

const PLAYBOOK = [
  { step: 1, label: "Morning digest", query: "Morning ops digest" },
  { step: 2, label: "BRG-2047 exception", query: "Deployment BRG-2047 is red — what happened?" },
  {
    step: 3,
    label: "SLA slip scenario",
    query: "If BRG-1102 slips 4 weeks, who breaches SLA?",
  },
];

export default function OpsConsole() {
  const [ranked, setRanked] = useState<RiskRankedDeployment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [digestLoading, setDigestLoading] = useState(true);
  const [history, setHistory] = useState<Array<{ query: string; response: BriefResponse }>>([]);
  const [showTools, setShowTools] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const booted = useRef(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/deployments")
      .then((r) => r.json())
      .then((data) => {
        const list: RiskRankedDeployment[] = data.risk_ranked ?? [];
        setRanked(list);
        if (list[0]) setSelectedId(list[0].id);
      });
  }, []);

  const pushResponse = useCallback((q: string, data: BriefResponse) => {
    setHistory((h) => [{ query: q, response: data }, ...h].slice(0, 12));
  }, []);

  const runBrief = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      setLoading(true);
      setQuery(trimmed);
      setQueueOpen(false);
      setError(null);
      try {
        const res = await fetch("/api/brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed }),
        });
        if (!res.ok) throw new Error("Brief request failed");
        const data: BriefResponse = await res.json();
        if (!data.brief) throw new Error("Invalid brief response");
        pushResponse(trimmed, data);
        const idMatch = trimmed.match(/\b(BRG|PRM)-\d{4}\b/i);
        if (idMatch) setSelectedId(idMatch[0].toUpperCase());
      } catch {
        setError("Scenario failed — check connection and retry.");
      } finally {
        setLoading(false);
      }
    },
    [pushResponse]
  );

  const runDigest = useCallback(async () => {
    setDigestLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/digest");
      if (!res.ok) throw new Error("Digest request failed");
      const data = await res.json();
      const response: BriefResponse = {
        brief: data.brief,
        validation: data.validation,
        tools: [
          { tool: "get_fleet_summary", args: {}, result: data.fleet },
          { tool: "get_pipeline", args: {}, result: data.upcoming_deadlines },
          { tool: "list_exceptions", args: {}, result: data.top_risks },
        ],
        generated_at: data.generated_at,
      };
      pushResponse("Morning ops digest", response);
      setQuery("Morning ops digest");
    } catch {
      setError("Digest failed — check connection and retry.");
    } finally {
      setDigestLoading(false);
    }
  }, [pushResponse]);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const dep = searchParams.get("deploy");
    if (dep?.match(/^(BRG|PRM)-\d{4}$/i)) {
      const id = dep.toUpperCase();
      setSelectedId(id);
      void runBrief(`Deployment ${id} is red — what happened?`);
    } else {
      void runDigest();
    }
  }, [runDigest, runBrief, searchParams]);

  const selected = ranked.find((d) => d.id === selectedId);
  const latest = history[0]?.response;
  const initialLoading = digestLoading && !latest;

  return (
    <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[280px_1fr]">
      <div className="border-b border-ops-line p-3 lg:hidden">
        <button
          type="button"
          onClick={() => setQueueOpen((o) => !o)}
          className="ops-btn-ghost w-full text-left font-mono"
          aria-expanded={queueOpen}
        >
          Risk queue ({ranked.length}) {queueOpen ? "▲" : "▼"}
        </button>
      </div>

      <aside
        className={`border-b border-ops-line lg:border-b-0 lg:border-r ${
          queueOpen ? "block" : "hidden lg:block"
        }`}
      >
        <div className="p-3 lg:p-4">
          <div className="mb-2 hidden items-center justify-between lg:flex">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-ops-muted">
              Risk queue
            </h2>
            <button
              type="button"
              onClick={() => void runDigest()}
              disabled={digestLoading}
              className="ops-btn-ghost border-ops-amber/30 text-ops-amber"
            >
              {digestLoading ? "…" : "Refresh digest"}
            </button>
          </div>
          <ul className="space-y-1" role="list">
            {ranked.map((d, i) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(d.id);
                    void runBrief(`Deployment ${d.id} is red — what happened?`);
                  }}
                  aria-label={`${d.id}, ${d.status}, risk score ${d.risk_score}`}
                  aria-current={selectedId === d.id ? "true" : undefined}
                  className={`w-full rounded-ops border px-3 py-2 text-left transition ${
                    selectedId === d.id
                      ? "border-ops-amber/50 bg-ops-amber/5"
                      : "border-transparent hover:border-ops-line hover:bg-ops-elevated"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-ops-muted">#{i + 1}</span>
                      <StatusBadge status={d.status} />
                      <span className="font-mono text-xs text-ops-amber">{d.id}</span>
                    </div>
                    <span className="font-mono text-xs tabular-nums text-ops-critical">
                      {d.risk_score}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs leading-snug">{d.name}</p>
                  <div className="mt-1.5">
                    <RiskBar score={d.risk_score} />
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-ops-muted">
                    {d.mw_gap} MW gap
                    {d.days_to_deadline !== null &&
                      ` · ${d.days_to_deadline < 0 ? `${Math.abs(d.days_to_deadline)}d overdue` : `${d.days_to_deadline}d`}`}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="flex min-h-[calc(100vh-120px)] flex-col">
        {selected && (
          <div className="border-b border-ops-line bg-ops-elevated/60 px-4 py-2.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-ops-amber">{selected.id}</p>
                <h1 className="text-base font-semibold">{selected.name}</h1>
                <p className="text-xs text-ops-muted">{selected.site}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                <Chip label="Risk" value={String(selected.risk_score)} warn />
                <Chip label="MW" value={`${selected.mw_available}/${selected.mw_contracted}`} />
                <Chip label="SLA" value={`${selected.sla_pct}%`} />
                <Chip label="GFA" value={selected.gfa_tranche} />
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scroll-thin p-3 sm:p-4">
          {error && (
            <div
              className="mb-3 rounded-ops border border-ops-critical/40 bg-ops-critical/10 px-3 py-2 text-sm text-ops-critical"
              role="alert"
            >
              {error}
            </div>
          )}
          <Panel title="Interview playbook" className="mb-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {PLAYBOOK.map((p) => (
                <button
                  key={p.step}
                  type="button"
                  onClick={() => void runBrief(p.query)}
                  className="ops-btn-ghost flex items-center gap-2 text-left"
                >
                  <span className="font-mono text-ops-amber">{p.step}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </Panel>

          {initialLoading ? (
            <div className="ops-panel space-y-3 p-4" aria-busy="true">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <p className="text-xs text-ops-muted">Generating morning digest…</p>
            </div>
          ) : latest ? (
            <BriefCard response={latest} showTools={showTools} title="Active brief" />
          ) : null}

          {history.length > 1 && (
            <div className="mt-4">
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ops-muted">
                Session audit
              </h3>
              <ul className="space-y-1">
                {history.slice(1, 5).map((h) => (
                  <li
                    key={`${h.query}-${h.response.generated_at}`}
                    className="rounded-ops border border-ops-line bg-ops-panel/50 px-3 py-1.5 text-[11px]"
                  >
                    <span className="text-ops-muted">
                      {new Date(h.response.generated_at).toLocaleTimeString()}
                    </span>
                    <span className="mx-2 text-ops-line">·</span>
                    <span className="line-clamp-1">{h.query}</span>
                    <span
                      className={`ml-2 inline-block rounded-ops px-1 font-mono text-[10px] ${
                        h.response.validation.ok
                          ? "bg-ops-pass/15 text-ops-pass"
                          : "bg-ops-critical/15 text-ops-critical"
                      }`}
                    >
                      {h.response.validation.ok ? "OK" : "FAIL"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-ops-line bg-ops-panel/95 p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runBrief(query);
            }}
            className="flex gap-2"
            role="search"
            aria-label="Run operations scenario"
          >
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-ops-muted">
                &gt;
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="run scenario…"
                className="ops-input w-full pl-7"
                disabled={loading}
                aria-label="Scenario command"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowTools((s) => !s)}
              className="ops-btn-ghost hidden sm:inline-flex"
              aria-pressed={showTools}
            >
              Trace
            </button>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="ops-btn-primary shrink-0"
            >
              {loading ? "Running…" : "Run"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Chip({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <span className="rounded-ops border border-ops-line bg-ops-bg px-2 py-0.5">
      <span className="text-ops-muted">{label} </span>
      <span className={warn ? "text-ops-amber" : ""}>{value}</span>
    </span>
  );
}
