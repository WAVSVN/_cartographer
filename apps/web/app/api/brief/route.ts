import { NextResponse } from "next/server";
import { getOps } from "@/lib/ops";

export async function POST(req: Request) {
  let query = "";
  try {
    const body = await req.json();
    query = String(body.query ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!query.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  return NextResponse.json(getOps().generateBrief(query));
}
