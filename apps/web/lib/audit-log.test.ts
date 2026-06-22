import { describe, expect, it, beforeEach } from "vitest";
import {
  appendAuditEntry,
  AUDIT_LOG_MAX,
  formatAuditAction,
  type AuditEntry,
} from "./audit-log";

describe("audit-log", () => {
  beforeEach(() => {
    // pure functions only in this file
  });

  it("prepends entries and caps length", () => {
    let entries: AuditEntry[] = [];
    for (let i = 0; i < AUDIT_LOG_MAX + 5; i++) {
      entries = appendAuditEntry(entries, {
        action: "brief_run",
        detail: `query ${i}`,
      });
    }
    expect(entries).toHaveLength(AUDIT_LOG_MAX);
    expect(entries[0]?.detail).toBe(`query ${AUDIT_LOG_MAX + 4}`);
  });

  it("formats action labels", () => {
    expect(formatAuditAction("triage_change")).toBe("triage");
    expect(formatAuditAction("handoff_export")).toBe("handoff");
  });
});
