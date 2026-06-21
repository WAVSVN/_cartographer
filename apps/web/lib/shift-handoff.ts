import type { BriefResponse, FleetSummary, RiskRankedDeployment } from "@/lib/types";
import {
  getTriageRecord,
  getTriageState,
  TRIAGE_OPTIONS,
  type TriageStateMap,
} from "@/lib/triage-state";

export type ShiftNote = {
  id: string;
  text: string;
  at: string;
};

export const SHIFT_NOTES_STORAGE_KEY = "goc-shift-notes";

export type ShiftBriefEntry = {
  query: string;
  generatedAt: string;
  summary: string;
  severity: string;
};

export type OpenException = {
  id: string;
  name: string;
  status: string;
  riskScore: number;
  triageState: string;
  triageLabel: string;
  triageNote?: string;
  triageUpdatedAt?: string;
  exceptionSummary?: string | null;
};

export type ShiftHandoffBundle = {
  exportedAt: string;
  shiftClockTime: string;
  fleet: FleetSummary | null;
  openExceptions: OpenException[];
  shiftNotes: ShiftNote[];
  briefs: ShiftBriefEntry[];
  topRisks: RiskRankedDeployment[];
};

export function loadShiftNotes(): ShiftNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SHIFT_NOTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (n): n is ShiftNote =>
        !!n &&
        typeof n === "object" &&
        typeof (n as ShiftNote).id === "string" &&
        typeof (n as ShiftNote).text === "string" &&
        typeof (n as ShiftNote).at === "string"
    );
  } catch {
    return [];
  }
}

export function saveShiftNotes(notes: ShiftNote[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SHIFT_NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // quota or private mode — ignore
  }
}

export function createShiftNote(text: string): ShiftNote {
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    at: new Date().toISOString(),
  };
}

export function addShiftNote(notes: ShiftNote[], text: string): ShiftNote[] {
  const trimmed = text.trim();
  if (!trimmed) return notes;
  return [createShiftNote(trimmed), ...notes];
}

export function formatShiftClockTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function triageLabel(state: string): string {
  return TRIAGE_OPTIONS.find((o) => o.id === state)?.label ?? state;
}

export function collectOpenExceptions(
  ranked: RiskRankedDeployment[],
  triageMap: TriageStateMap
): OpenException[] {
  const activeTriage = new Set(["acknowledged", "investigating", "escalated"]);

  return ranked
    .filter((d) => {
      const triage = getTriageState(triageMap, d.id);
      return d.status === "exception" || d.status === "watch" || activeTriage.has(triage);
    })
    .filter((d) => getTriageState(triageMap, d.id) !== "cleared")
    .map((d) => {
      const triage = getTriageRecord(triageMap, d.id);
      const state = getTriageState(triageMap, d.id);
      return {
        id: d.id,
        name: d.name,
        status: d.status,
        riskScore: d.risk_score,
        triageState: state,
        triageLabel: triageLabel(state),
        triageNote: triage?.note,
        triageUpdatedAt: triage?.updatedAt,
        exceptionSummary: d.exception_summary,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}

export function briefsFromHistory(
  history: Array<{ query: string; response: BriefResponse }>
): ShiftBriefEntry[] {
  return history.slice(0, 5).map((h) => ({
    query: h.query,
    generatedAt: h.response.generated_at,
    summary: h.response.brief.summary,
    severity: h.response.brief.severity,
  }));
}

export function buildMarkdown(bundle: ShiftHandoffBundle): string {
  const lines: string[] = [];

  lines.push("# Shift handoff");
  lines.push("");
  lines.push(`**Exported:** ${bundle.exportedAt}`);
  lines.push(`**Shift clock:** ${bundle.shiftClockTime}`);
  lines.push("");

  lines.push("## Fleet health");
  lines.push("");
  if (bundle.fleet) {
    const f = bundle.fleet;
    lines.push(`- Contracted: ${f.total_contracted_mw} MW`);
    lines.push(`- Available: ${f.total_available_mw} MW`);
    lines.push(`- Gap: ${f.total_gap_mw} MW`);
    lines.push(`- Deployments: ${f.deployment_count}`);
    lines.push(
      `- Bridge: ${f.by_type.bridge.gap_mw} MW gap (${f.by_type.bridge.count} sites)`
    );
    lines.push(
      `- Permanent: ${f.by_type.permanent.gap_mw} MW gap (${f.by_type.permanent.count} sites)`
    );
  } else {
    lines.push("_Fleet summary unavailable._");
  }
  lines.push("");

  lines.push("## Open exceptions");
  lines.push("");
  if (bundle.openExceptions.length === 0) {
    lines.push("_No open exceptions or active triage._");
  } else {
    for (const ex of bundle.openExceptions) {
      lines.push(`### ${ex.id} — ${ex.name}`);
      lines.push(`- Status: ${ex.status}`);
      lines.push(`- Risk score: ${ex.riskScore}`);
      lines.push(`- Triage: ${ex.triageLabel} (${ex.triageState})`);
      if (ex.triageNote) lines.push(`- Triage note: ${ex.triageNote}`);
      if (ex.triageUpdatedAt) {
        lines.push(`- Triage updated: ${ex.triageUpdatedAt}`);
      }
      if (ex.exceptionSummary) lines.push(`- Exception: ${ex.exceptionSummary}`);
      lines.push("");
    }
  }
  lines.push("");

  lines.push("## Shift notes");
  lines.push("");
  if (bundle.shiftNotes.length === 0) {
    lines.push("_No shift notes logged._");
  } else {
    for (const note of bundle.shiftNotes) {
      const ts = new Date(note.at).toLocaleString();
      lines.push(`- [${ts}] ${note.text}`);
    }
  }
  lines.push("");

  if (bundle.briefs.length > 0) {
    lines.push("## Session briefs");
    lines.push("");
    for (const b of bundle.briefs) {
      const ts = new Date(b.generatedAt).toLocaleString();
      lines.push(`### ${b.query} (${ts})`);
      lines.push(`- Severity: ${b.severity}`);
      lines.push(`- ${b.summary}`);
      lines.push("");
    }
  }

  if (bundle.topRisks.length > 0) {
    lines.push("## Top risks");
    lines.push("");
    for (const r of bundle.topRisks.slice(0, 5)) {
      lines.push(
        `- **${r.id}** (${r.status}) — risk ${r.risk_score}, ${r.mw_gap} MW gap` +
          (r.days_to_deadline !== null
            ? r.days_to_deadline < 0
              ? `, ${Math.abs(r.days_to_deadline)}d overdue`
              : `, ${r.days_to_deadline}d to deadline`
            : "")
      );
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}

export function handoffFilename(exportedAt: Date): string {
  const stamp = exportedAt.toISOString().slice(0, 16).replace("T", "-").replace(":", "");
  return `shift-handoff-${stamp}.md`;
}

export function downloadMarkdown(content: string, filename: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function fetchFleetSummary(): Promise<FleetSummary | null> {
  try {
    const res = await fetch("/api/fleet");
    if (!res.ok) return null;
    return (await res.json()) as FleetSummary;
  } catch {
    return null;
  }
}

export function buildHandoffBundle(input: {
  ranked: RiskRankedDeployment[];
  triageMap: TriageStateMap;
  shiftNotes: ShiftNote[];
  history: Array<{ query: string; response: BriefResponse }>;
  fleet: FleetSummary | null;
  exportedAt?: Date;
}): ShiftHandoffBundle {
  const at = input.exportedAt ?? new Date();
  const briefs = briefsFromHistory(input.history);

  return {
    exportedAt: at.toISOString(),
    shiftClockTime: formatShiftClockTime(at),
    fleet: input.fleet,
    openExceptions: collectOpenExceptions(input.ranked, input.triageMap),
    shiftNotes: input.shiftNotes,
    briefs,
    topRisks: briefs.length === 0 ? input.ranked.slice(0, 5) : [],
  };
}
