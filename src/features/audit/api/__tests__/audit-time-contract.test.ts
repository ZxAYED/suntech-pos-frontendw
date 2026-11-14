import { describe, it, expect } from "vitest";
import { buildAuditDateBounds, formatAuditTimestamp } from "../../components/audit-logs-view";

describe("Audit Date & Timestamp Contract (Phase E)", () => {
  it("builds exact UTC bounds for a Dhaka business date range", () => {
    const bounds = buildAuditDateBounds("2026-11-07", "2026-11-07");
    expect(bounds.error).toBeUndefined();
    // 2026-11-07 00:00:00+06:00 is 2026-11-06T18:00:00.000Z
    expect(bounds.from).toBe("2026-11-06T18:00:00.000Z");
    // 2026-11-07 23:59:59.999+06:00 is 2026-11-07T17:59:59.999Z
    expect(bounds.to).toBe("2026-11-07T17:59:59.999Z");
  });

  it("detects reversed date bounds", () => {
    const bounds = buildAuditDateBounds("2026-11-08", "2026-11-07");
    expect(bounds.error).toBe("From date cannot be after to date");
    expect(bounds.from).toBeUndefined();
    expect(bounds.to).toBeUndefined();
  });

  it("rejects invalid calendar dates without throwing or sending garbage", () => {
    const bounds = buildAuditDateBounds("2026-02-30", "2026-11-07");
    expect(bounds.error).toBe("Invalid from date");
    expect(bounds.from).toBeUndefined();
  });

  it("formats audit timestamp safely and labels future instants without 'just now'", () => {
    const farFuture = new Date(Date.now() + 86400000).toISOString();
    const formatted = formatAuditTimestamp(farFuture);
    expect(formatted.relative).toBe("future");
  });

  it("handles null/invalid audit timestamp safely", () => {
    const formatted = formatAuditTimestamp("invalid-timestamp");
    expect(formatted.date).toBe("—");
    expect(formatted.time).toBe("—");
    expect(formatted.relative).toBe("—");
  });
});

