import { NextResponse } from "next/server";
import { getOps } from "@/lib/ops";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const deploymentId = searchParams.get("deployment_id");
  const slipRaw = searchParams.get("slip_weeks");
  const slipWeeks = slipRaw !== null && slipRaw !== "" ? Number(slipRaw) : 4;

  if (!deploymentId) {
    return NextResponse.json({ error: "deployment_id is required" }, { status: 400 });
  }

  if (!Number.isFinite(slipWeeks) || slipWeeks < 0) {
    return NextResponse.json({ error: "slip_weeks must be a non-negative number" }, { status: 400 });
  }

  const result = getOps().runInterconnectionSlip(deploymentId, slipWeeks);
  if (!result) {
    return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
