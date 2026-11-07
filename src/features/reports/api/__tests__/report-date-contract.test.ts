import { describe, it, expect } from "vitest";
import { buildReportQueryParams } from "../use-reports";

describe("buildReportQueryParams - Date Contract & Precedence", () => {
  it("omits incidental year, month, and week when a rolling preset is selected", () => {
    const params = buildReportQueryParams(
      {
        range: "weekly",
        year: 2026,
        month: "all",
        week: "all",
      },
      "biz-1",
      "loc-1",
    );

    expect(params.range).toBe("weekly");
    expect(params.year).toBeUndefined();
    expect(params.month).toBeUndefined();
    expect(params.week).toBeUndefined();
    expect(params.businessId).toBe("biz-1");
    expect(params.locationId).toBe("loc-1");
  });

  it("sends only range for other rolling presets (today, yesterday, daily, monthly, quarterly)", () => {
    for (const preset of ["today", "yesterday", "daily", "monthly", "quarterly"]) {
      const params = buildReportQueryParams(
        {
          range: preset,
          year: "2026",
          month: "all",
          week: "all",
        },
        "biz-1",
        "loc-1",
      );
      expect(params.range).toBe(preset);
      expect(params.year).toBeUndefined();
      expect(params.month).toBeUndefined();
      expect(params.week).toBeUndefined();
    }
  });

  it("prioritizes explicit calendar month over rolling presets", () => {
    const params = buildReportQueryParams(
      {
        range: "monthly",
        month: 5,
        year: 2026,
        week: "all",
      },
      "biz-1",
      "loc-1",
    );

    expect(params.month).toBe("5");
    expect(params.year).toBe(2026);
    expect(params.range).toBeUndefined();
    expect(params.week).toBeUndefined();
  });

  it("prioritizes explicit week over rolling presets and month=all", () => {
    const params = buildReportQueryParams(
      {
        range: "weekly",
        week: "23",
        month: "all",
        year: 2026,
      },
      "biz-1",
      "loc-1",
    );

    expect(params.week).toBe("23");
    expect(params.year).toBe(2026);
    expect(params.range).toBeUndefined();
    expect(params.month).toBeUndefined();
  });

  it("emits range=year and year when range is 'year'", () => {
    const params = buildReportQueryParams(
      {
        range: "year",
        year: "2025",
        month: "all",
        week: "all",
      },
      "biz-1",
      "loc-1",
    );

    expect(params.range).toBe("year");
    expect(params.year).toBe(2025);
    expect(params.month).toBeUndefined();
    expect(params.week).toBeUndefined();
  });

  it("omits locationId when locationId is explicitly 'all' (all branches query)", () => {
    const params = buildReportQueryParams(
      {
        range: "today",
        locationId: "all",
      },
      "biz-1",
      "loc-default",
    );

    expect(params.locationId).toBeUndefined();
    expect(params.businessId).toBe("biz-1");
  });

  it("preserves specific locationId when provided", () => {
    const params = buildReportQueryParams(
      {
        range: "today",
        locationId: "loc-specific",
      },
      "biz-1",
      "loc-default",
    );

    expect(params.locationId).toBe("loc-specific");
  });

  it("falls back to tenantLocationId when locationId is undefined", () => {
    const params = buildReportQueryParams(
      {
        range: "today",
      },
      "biz-1",
      "loc-default",
    );

    expect(params.locationId).toBe("loc-default");
  });
});
