import { describe, expect, it } from "vitest";
import { llmBriefEnabled } from "./llm-brief";

describe("llm-brief", () => {
  it("is disabled without OPENAI_API_KEY", () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(llmBriefEnabled()).toBe(false);
    if (prev) process.env.OPENAI_API_KEY = prev;
  });
});
