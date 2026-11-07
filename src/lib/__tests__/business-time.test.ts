import { describe, expect, it } from "vitest";
import {
  BUSINESS_TIME_ZONE,
  businessDateRangeToAuditUtc,
  businessDateRangeToUtc,
  formatBusinessDate,
  formatBusinessDateKey,
  formatBusinessDateTime,
  formatBusinessTime,
  formatSalaryPeriod,
  getBusinessDateParts,
  isValidCalendarDate,
  parseDhakaDateString,
  parseStrictEventInstant,
} from "../business-time";

describe("Phase A: Business Time & Dhaka Calendar Utilities (R1, R2)", () => {
  it("anchors BUSINESS_TIME_ZONE in Asia/Dhaka", () => {
    expect(BUSINESS_TIME_ZONE).toBe("Asia/Dhaka");
  });

  describe("Calendar date validation", () => {
    it("accepts valid calendar dates and leap days", () => {
      expect(isValidCalendarDate(2026, 11, 7)).toBe(true);
      expect(isValidCalendarDate(2028, 2, 29)).toBe(true); // Leap year
      expect(isValidCalendarDate(2026, 12, 31)).toBe(true);
    });

    it("rejects invalid calendar dates like Feb 29 on non-leap years and Feb 30", () => {
      expect(isValidCalendarDate(2026, 2, 29)).toBe(false);
      expect(isValidCalendarDate(2026, 2, 30)).toBe(false);
      expect(isValidCalendarDate(2026, 4, 31)).toBe(false); // April has 30 days
      expect(isValidCalendarDate(2026, 13, 1)).toBe(false);
    });
  });

  describe("Strict event instant parser", () => {
    it("accepts ISO timestamps with explicit Z or numeric timezone offset", () => {
      const zDate = parseStrictEventInstant("2026-11-06T18:10:00.000Z");
      expect(zDate).not.toBeNull();
      expect(zDate?.toISOString()).toBe("2026-11-06T18:10:00.000Z");

      const offsetDate = parseStrictEventInstant("2026-11-07T00:10:00+06:00");
      expect(offsetDate).not.toBeNull();
      expect(offsetDate?.toISOString()).toBe("2026-11-06T18:10:00.000Z");
    });

    it("rejects naive timestamps without explicit timezone offset", () => {
      expect(parseStrictEventInstant("2026-11-07T00:10:00")).toBeNull();
      expect(parseStrictEventInstant("2026-11-07 10:00:00")).toBeNull();
      expect(parseStrictEventInstant("2026-11-07")).toBeNull();
    });

    it("rejects malformed, empty, null, or invalid date strings", () => {
      expect(parseStrictEventInstant(null)).toBeNull();
      expect(parseStrictEventInstant(undefined)).toBeNull();
      expect(parseStrictEventInstant("")).toBeNull();
      expect(parseStrictEventInstant("invalid-timestamp")).toBeNull();
      expect(parseStrictEventInstant("2026-02-29T10:00:00Z")).toBeNull();
    });
  });

  describe("Dhaka date-only parser", () => {
    it("parses valid YYYY-MM-DD", () => {
      expect(parseDhakaDateString("2026-11-07")).toEqual({ year: 2026, month: 11, day: 7 });
    });

    it("rejects invalid calendar dates or malformed patterns", () => {
      expect(parseDhakaDateString("2026-02-29")).toBeNull();
      expect(parseDhakaDateString("2026-11-7")).toBeNull();
      expect(parseDhakaDateString("07-11-2026")).toBeNull();
    });
  });

  describe("Dhaka representation across timezone boundaries", () => {
    it("correctly calculates Dhaka date parts across the midnight threshold", () => {
      // 2026-11-06T17:59:59.999Z is 23:59:59.999 on Nov 6 in Dhaka
      const partsBefore = getBusinessDateParts("2026-11-06T17:59:59.999Z");
      expect(partsBefore.year).toBe(2026);
      expect(partsBefore.month).toBe(11);
      expect(partsBefore.day).toBe(6);
      expect(partsBefore.hour).toBe(23);
      expect(partsBefore.minute).toBe(59);

      // 2026-11-06T18:00:00.000Z is 00:00:00 on Nov 7 in Dhaka
      const partsAt = getBusinessDateParts("2026-11-06T18:00:00.000Z");
      expect(partsAt.year).toBe(2026);
      expect(partsAt.month).toBe(11);
      expect(partsAt.day).toBe(7);
      expect(partsAt.hour).toBe(0);
      expect(partsAt.minute).toBe(0);
    });

    it("formats 2026-11-06T18:10:00.000Z as Nov 7 in Dhaka", () => {
      const formatted = formatBusinessDateTime("2026-11-06T18:10:00.000Z");
      expect(formatted).toContain("Nov 7, 2026");
      expect(formatted).toContain("12:10 AM");
    });

    it("formats date-only and time-only accurately in Dhaka", () => {
      const dt = "2026-11-06T18:10:00.000Z";
      expect(formatBusinessDate(dt)).toBe("Nov 7, 2026");
      expect(formatBusinessTime(dt)).toBe("12:10 AM");
    });

    it("treats equivalent UTC and +06:00 offset strings identically", () => {
      const utc = formatBusinessDateTime("2026-11-06T18:10:00.000Z");
      const offset = formatBusinessDateTime("2026-11-07T00:10:00+06:00");
      expect(utc).toBe(offset);
    });

    it("formats month and year rollover correctly", () => {
      // 2026-10-31T18:00:00.000Z is Nov 1 in Dhaka
      expect(formatBusinessDateKey("2026-10-31T18:00:00.000Z")).toBe("2026-11-01");
      // 2026-12-31T18:00:00.000Z is Jan 1, 2027 in Dhaka
      expect(formatBusinessDateKey("2026-12-31T18:00:00.000Z")).toBe("2027-01-01");
    });
  });

  describe("Salary period formatting", () => {
    it("formats integer year and month into human-readable period", () => {
      expect(formatSalaryPeriod(2026, 11)).toBe("November 2026");
      expect(formatSalaryPeriod(2027, 1)).toBe("January 2027");
    });

    it("returns placeholder for invalid year/month", () => {
      expect(formatSalaryPeriod(2026, 13)).toBe("—");
      expect(formatSalaryPeriod(2026, 0)).toBe("—");
    });
  });

  describe("Business date range conversion to UTC", () => {
    it("converts single-day range to half-open bounds (Nov 7)", () => {
      const range = businessDateRangeToUtc("2026-11-07", "2026-11-07");
      expect(range.startInclusive).toBe("2026-11-06T18:00:00.000Z");
      expect(range.endExclusive).toBe("2026-11-07T18:00:00.000Z");
    });

    it("converts multi-day range to half-open bounds", () => {
      const range = businessDateRangeToUtc("2026-11-01", "2026-11-07");
      expect(range.startInclusive).toBe("2026-10-31T18:00:00.000Z");
      expect(range.endExclusive).toBe("2026-11-07T18:00:00.000Z");
    });

    it("adapts range for Audit Logs inclusive API contract", () => {
      const auditRange = businessDateRangeToAuditUtc("2026-11-07", "2026-11-07");
      expect(auditRange.from).toBe("2026-11-06T18:00:00.000Z");
      expect(auditRange.to).toBe("2026-11-07T17:59:59.999Z");
    });

    it("throws on reversed date range", () => {
      expect(() => businessDateRangeToUtc("2026-11-08", "2026-11-07")).toThrow();
    });
  });
});
