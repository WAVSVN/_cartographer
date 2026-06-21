import { NextResponse } from "next/server";
import { getOps } from "@/lib/ops";

export async function GET() {
  const ops = getOps();
  return NextResponse.json({
    tools: ops.toolSchemas,
    deployments: ops.listDeployments(),
    exceptions: ops.listExceptions(),
    risk_ranked: ops.rankDeployments(),
  });
}
