/**
 * Microsoft Graph adapter — same REST contract whether called from Next.js,
 * Azure Functions HTTP trigger, or API Management in front of Atlas systems.
 */

export type GraphIntegrationMode = "fixture" | "live";

export type GraphShiftSignal = {
  id: string;
  type: "calendar" | "mail" | "teams";
  title: string;
  at: string;
  deployment_hint?: string;
  source: string;
};

export type GraphIntegrationStatus = {
  mode: GraphIntegrationMode;
  endpoint: string;
  signals: GraphShiftSignal[];
  notes: string[];
};

const FIXTURE_SIGNALS: GraphShiftSignal[] = [
  {
    id: "cal-1",
    type: "calendar",
    title: "GFA tranche review — 2026-H2",
    at: "2026-06-11T15:00:00.000Z",
    deployment_hint: "BRG-2047",
    source: "fixtures/graph-signals.json",
  },
  {
    id: "teams-1",
    type: "teams",
    title: "#shift-handoff — night crew ping",
    at: "2026-06-11T13:45:00.000Z",
    source: "fixtures/graph-signals.json",
  },
  {
    id: "mail-1",
    type: "mail",
    title: "Customer escalation: Midland interconnection hold",
    at: "2026-06-11T12:10:00.000Z",
    deployment_hint: "BRG-1102",
    source: "fixtures/graph-signals.json",
  },
];

export function graphIntegrationMode(): GraphIntegrationMode {
  const token = process.env.AZURE_GRAPH_TOKEN?.trim();
  const mode = process.env.AZURE_GRAPH_MODE?.trim();
  if (token && mode === "live") return "live";
  return "fixture";
}

async function fetchLiveGraphSignals(token: string): Promise<GraphShiftSignal[]> {
  const now = new Date();
  const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    startDateTime: now.toISOString(),
    endDateTime: end.toISOString(),
    $top: "10",
    $select: "subject,start,end",
  });

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarview?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) {
    throw new Error(`Graph calendarview failed (${res.status})`);
  }

  const data = (await res.json()) as {
    value?: Array<{ id?: string; subject?: string; start?: { dateTime?: string } }>;
  };

  return (data.value ?? []).map((ev) => ({
    id: ev.id ?? crypto.randomUUID(),
    type: "calendar" as const,
    title: ev.subject ?? "Calendar event",
    at: ev.start?.dateTime ?? now.toISOString(),
    source: "graph.microsoft.com/v1.0/me/calendarview",
  }));
}

export async function getGraphIntegrationStatus(): Promise<GraphIntegrationStatus> {
  const mode = graphIntegrationMode();
  const endpoint =
    mode === "live"
      ? "https://graph.microsoft.com/v1.0"
      : "/api/integrations/graph (fixture)";

  if (mode === "live") {
    const token = process.env.AZURE_GRAPH_TOKEN!.trim();
    const signals = await fetchLiveGraphSignals(token);
    return {
      mode,
      endpoint,
      signals,
      notes: [
        "Live mode: calendar events from Microsoft Graph REST API.",
        "Mail/Teams channels would use /me/messages and team channel APIs with the same adapter pattern.",
      ],
    };
  }

  return {
    mode: "fixture",
    endpoint,
    signals: FIXTURE_SIGNALS,
    notes: [
      "Fixture mode: shape matches Microsoft Graph JSON — swap adapter for production.",
      "Set AZURE_GRAPH_TOKEN + AZURE_GRAPH_MODE=live to call Graph from this route.",
      "In Azure: same handler runs as an HTTP-triggered Function behind API Management.",
    ],
  };
}
