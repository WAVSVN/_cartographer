import { describe, expect, it } from "vitest";
import {
  formatDaysToDeadline,
  isDueWithin14,
  isOverdue,
  urgencyClassName,
  urgencyLevel,
} from "./sla-urgency";

describe("sla-urgency", () => {
  it("classifies urgency bands", () => {
    expect(urgencyLevel(null)).toBe("none");
    expect(urgencyLevel(-3)).toBe("overdue");
    expect(urgencyLevel(0)).toBe("critical");
    expect(urgencyLevel(7)).toBe("critical");
    expect(urgencyLevel(8)).toBe("warning");
    expect(urgencyLevel(14)).toBe("warning");
    expect(urgencyLevel(15)).toBe("ok");
  });

  it("maps urgency to class names", () => {
    expect(urgencyClassName("overdue")).toContain("critical");
    expect(urgencyClassName("critical")).toContain("critical");
    expect(urgencyClassName("warning")).toContain("amber");
    expect(urgencyClassName("ok")).toContain("pass");
    expect(urgencyClassName("none")).toContain("muted");
  });

  it("formats days to deadline", () => {
    expect(formatDaysToDeadline(null)).toBe("—");
    expect(formatDaysToDeadline(-5)).toBe("5d overdue");
    expect(formatDaysToDeadline(12)).toBe("12d");
  });

  it("detects overdue and due-within-14", () => {
    expect(isOverdue(-1)).toBe(true);
    expect(isOverdue(0)).toBe(false);
    expect(isDueWithin14(14)).toBe(true);
    expect(isDueWithin14(15)).toBe(false);
    expect(isDueWithin14(-1)).toBe(false);
  });
});
