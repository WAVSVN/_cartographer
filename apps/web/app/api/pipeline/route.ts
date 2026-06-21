import { NextResponse } from "next/server";
import { getOps } from "@/lib/ops";

export async function GET() {
  return NextResponse.json({ pipeline: getOps().getPipeline() });
}
