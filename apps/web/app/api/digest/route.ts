import { NextResponse } from "next/server";
import { validateBrief } from "@cartographer/core";
import { getOps } from "@/lib/ops";

export async function GET() {
  const ops = getOps();
  const digest = ops.buildMorningDigest();
  const knownIds = new Set(ops.listDeployments().map((d) => d.id));
  const validation = validateBrief(digest.brief, knownIds);
  return NextResponse.json({ ...digest, validation });
}
