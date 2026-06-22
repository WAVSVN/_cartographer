import { NextResponse } from "next/server";
import { validateBrief } from "@cartographer/core";
import { BriefQuerySchema } from "@cartographer/schemas";
import { llmBriefEnabled, synthesizeLlmBrief } from "@/lib/llm-brief";
import { getOps } from "@/lib/ops";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BriefQuerySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const { query, context, mode = "auto" } = parsed.data;
  const ops = getOps();
  const plannerContext = context?.selected_deployment_id
    ? { selectedDeploymentId: context.selected_deployment_id }
    : undefined;

  let result = ops.generateBrief(query, plannerContext);
  const knownIds = new Set(ops.listDeployments().map((d) => d.id));

  if ((mode === "llm" || mode === "auto") && llmBriefEnabled()) {
    const llm = await synthesizeLlmBrief(query, result.tools, result.brief);
    if (llm) {
      const llmValidation = validateBrief(llm.brief, knownIds);
      if (llmValidation.ok) {
        result = {
          ...result,
          brief: llm.brief,
          validation: llmValidation,
          meta: {
            mode: "llm",
            intent: result.meta?.intent ?? "unknown",
            confidence: result.meta?.confidence ?? 1,
            llm_model: llm.model,
          },
        };
      } else {
        result = {
          ...result,
          meta: {
            mode: "llm_fallback",
            intent: result.meta?.intent ?? "unknown",
            confidence: result.meta?.confidence ?? 1,
            llm_model: llm.model,
          },
        };
      }
    }
  }

  return NextResponse.json(result);
}
