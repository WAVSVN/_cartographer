import { NextResponse } from "next/server";
import { getOps } from "@/lib/ops";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ops = getOps();
  const deployment = ops.getDeployment(id);

  if (!deployment) {
    return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  }

  const contract = ops.getContractTerms(deployment.customer_id);
  const runbook = deployment.exception_code
    ? ops.getRunbookSnippet(deployment.exception_code)
    : null;
  const risk = ops.rankDeployments().find((r) => r.id === id) ?? null;

  return NextResponse.json({ deployment, contract, runbook, risk });
}
