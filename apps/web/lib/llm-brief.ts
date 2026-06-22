import type { Brief, ToolLogEntry } from "@cartographer/schemas";

type LlmBriefResult = {
  brief: Brief;
  model: string;
};

export function llmBriefEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function synthesizeLlmBrief(
  query: string,
  tools: ToolLogEntry[],
  fallback: Brief
): Promise<LlmBriefResult | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const system = [
    "You are a private-grid shift operations assistant.",
    "Answer using ONLY facts from the tool trace JSON.",
    "Return strict JSON: { summary, severity, recommended_actions, citations }.",
    "severity is one of: low, medium, high, critical.",
    "citations must include source strings matching tool data; include deployment_id when citing a site.",
    "Do not invent MW figures, dates, or deployment IDs not present in tool results.",
  ].join(" ");

  const user = JSON.stringify({
    operator_query: query,
    tool_trace: tools,
    deterministic_fallback: fallback,
  });

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as Brief;
    if (!parsed.summary || !parsed.severity || !Array.isArray(parsed.citations)) return null;

    return {
      brief: {
        summary: String(parsed.summary),
        severity: parsed.severity,
        recommended_actions: Array.isArray(parsed.recommended_actions)
          ? parsed.recommended_actions.map(String)
          : fallback.recommended_actions,
        citations: parsed.citations.length ? parsed.citations : fallback.citations,
      },
      model,
    };
  } catch {
    return null;
  }
}
