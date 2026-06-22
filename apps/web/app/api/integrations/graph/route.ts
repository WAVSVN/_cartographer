import { NextResponse } from "next/server";
import { getGraphIntegrationStatus } from "@/lib/integrations/azure-graph";

/** Shift-relevant signals from Microsoft Graph (fixture or live). */
export async function GET() {
  try {
    const status = await getGraphIntegrationStatus();
    return NextResponse.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Graph integration failed";
    return NextResponse.json({ error: message, mode: "live" }, { status: 502 });
  }
}
