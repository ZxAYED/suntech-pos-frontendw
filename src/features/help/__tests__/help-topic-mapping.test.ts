import { describe, expect, it } from "vitest";
import { adminHelpData } from "../data/admin-help-data";
import { cashierHelpData } from "../data/cashier-help-data";
import { getTopicIdFromHash, searchTopics } from "../utils";

describe("Help Topic Mapping and Content Integrity", () => {
  describe("Admin Help Guide", () => {
    it("has the correct title and metadata", () => {
      expect(adminHelpData.title).toBe("Help — Admin");
      expect(adminHelpData.role).toBe("admin");
      expect(adminHelpData.sourceDoc).toBe("docs/SunTech_Admin_Help_Content.md");
    });

    it("contains all 14 Admin topics in exact sequential order", () => {
      expect(adminHelpData.topics).toHaveLength(14);

      const expectedTitles = [
        "1. Start here",
        "2. Business and branch",
        "3. Catalog — add and manage items",
        "4. Catalog Register — sell a saved item",
        "5. Quick Custom Sale — type an item and sell it",
        "6. Store Orders — find a sale, print, or refund",
        "7. Dashboard — check the shop",
        "8. Staff — manage cashier accounts",
        "9. Payroll — salary and advances",
        "10. Expenses — record shop spending",
        "11. Reports — check sales over time",
        "12. Audit Logs — see who did what",
        "13. When you need help",
        "14. Simple word guide",
      ];

      adminHelpData.topics.forEach((topic, idx) => {
        expect(topic.number).toBe(idx + 1);
        expect(topic.fullTitle).toBe(expectedTitles[idx]);
      });
    });

    it("preserves exact anchor slugs including double hyphens", () => {
      expect(adminHelpData.topics[0].id).toBe("1-start-here");
      expect(adminHelpData.topics[1].id).toBe("2-business-and-branch");
      expect(adminHelpData.topics[2].id).toBe("3-catalog--add-and-manage-items");
      expect(adminHelpData.topics[3].id).toBe("4-catalog-register--sell-a-saved-item");
      expect(adminHelpData.topics[4].id).toBe("5-quick-custom-sale--type-an-item-and-sell-it");
      expect(adminHelpData.topics[5].id).toBe("6-store-orders--find-a-sale-print-or-refund");
      expect(adminHelpData.topics[6].id).toBe("7-dashboard--check-the-shop");
      expect(adminHelpData.topics[7].id).toBe("8-staff--manage-cashier-accounts");
      expect(adminHelpData.topics[8].id).toBe("9-payroll--salary-and-advances");
      expect(adminHelpData.topics[9].id).toBe("10-expenses--record-shop-spending");
      expect(adminHelpData.topics[10].id).toBe("11-reports--check-sales-over-time");
      expect(adminHelpData.topics[11].id).toBe("12-audit-logs--see-who-did-what");
      expect(adminHelpData.topics[12].id).toBe("13-when-you-need-help");
      expect(adminHelpData.topics[13].id).toBe("14-simple-word-guide");
    });

    it("maps all 14 quickLinks to valid topic IDs", () => {
      expect(adminHelpData.quickLinks).toHaveLength(14);
      adminHelpData.quickLinks.forEach((link) => {
        const found = adminHelpData.topics.find((t) => t.id === link.topicId);
        expect(found, `Target ${link.topicId} for '${link.want}' not found`).toBeDefined();
      });
    });
  });

  describe("Cashier Help Guide", () => {
    it("has the correct title and metadata", () => {
      expect(cashierHelpData.title).toBe("Help — Cashier");
      expect(cashierHelpData.role).toBe("cashier");
      expect(cashierHelpData.sourceDoc).toBe("docs/SunTech_Cashier_Help_Content.md");
    });

    it("contains all 9 Cashier topics in exact sequential order", () => {
      expect(cashierHelpData.topics).toHaveLength(9);

      const expectedTitles = [
        "1. Start here",
        "2. Catalog Register — sell a saved item",
        "3. Quick Custom Sale — type an item and sell it",
        "4. Orders — find a sale, print, or refund",
        "5. Shifts — start and finish your cash count",
        "6. My Salary Advances — record money taken early",
        "7. When something goes wrong",
        "8. End of work",
        "9. Simple word guide",
      ];

      cashierHelpData.topics.forEach((topic, idx) => {
        expect(topic.number).toBe(idx + 1);
        expect(topic.fullTitle).toBe(expectedTitles[idx]);
      });
    });

    it("preserves exact anchor slugs for Cashier guide", () => {
      expect(cashierHelpData.topics[0].id).toBe("1-start-here");
      expect(cashierHelpData.topics[1].id).toBe("2-catalog-register--sell-a-saved-item");
      expect(cashierHelpData.topics[2].id).toBe("3-quick-custom-sale--type-an-item-and-sell-it");
      expect(cashierHelpData.topics[3].id).toBe("4-orders--find-a-sale-print-or-refund");
      expect(cashierHelpData.topics[4].id).toBe("5-shifts--start-and-finish-your-cash-count");
      expect(cashierHelpData.topics[5].id).toBe("6-my-salary-advances--record-money-taken-early");
      expect(cashierHelpData.topics[6].id).toBe("7-when-something-goes-wrong");
      expect(cashierHelpData.topics[7].id).toBe("8-end-of-work");
      expect(cashierHelpData.topics[8].id).toBe("9-simple-word-guide");
    });

    it("maps all 9 quickLinks to valid topic IDs", () => {
      expect(cashierHelpData.quickLinks).toHaveLength(9);
      cashierHelpData.quickLinks.forEach((link) => {
        const found = cashierHelpData.topics.find((t) => t.id === link.topicId);
        expect(found, `Target ${link.topicId} for '${link.want}' not found`).toBeDefined();
      });
    });
  });

  describe("URL Hash and Fragment Resolution", () => {
    it("resolves valid topic fragments correctly", () => {
      const resolved = getTopicIdFromHash("#3-catalog--add-and-manage-items", adminHelpData.topics);
      expect(resolved).toBe("3-catalog--add-and-manage-items");
    });

    it("handles hash without leading # safely", () => {
      const resolved = getTopicIdFromHash("5-shifts--start-and-finish-your-cash-count", cashierHelpData.topics);
      expect(resolved).toBe("5-shifts--start-and-finish-your-cash-count");
    });

    it("returns null for unknown fragment so caller falls back to Start here", () => {
      const resolved = getTopicIdFromHash("#non-existent-anchor", adminHelpData.topics);
      expect(resolved).toBeNull();
    });

    it("returns null for empty hash", () => {
      expect(getTopicIdFromHash("", adminHelpData.topics)).toBeNull();
      expect(getTopicIdFromHash("#", adminHelpData.topics)).toBeNull();
    });
  });

  describe("Local Search Capabilities", () => {
    it("finds topics by step text and button names", () => {
      const results = searchTopics("Complete sale", cashierHelpData.topics);
      expect(results.length).toBeGreaterThan(0);
      const ids = results.map((r) => r.id);
      expect(ids).toContain("2-catalog-register--sell-a-saved-item");
      expect(ids).toContain("3-quick-custom-sale--type-an-item-and-sell-it");
    });

    it("finds topics by financial terminology", () => {
      const refundResults = searchTopics("refund", cashierHelpData.topics);
      expect(refundResults.length).toBeGreaterThan(0);
      expect(refundResults.some((r) => r.id === "4-orders--find-a-sale-print-or-refund")).toBe(true);

      const salaryResults = searchTopics("salary advance", adminHelpData.topics);
      expect(salaryResults.length).toBeGreaterThan(0);
      expect(salaryResults.some((r) => r.id === "9-payroll--salary-and-advances")).toBe(true);
    });

    it("returns empty array for non-matching queries", () => {
      const results = searchTopics("xyz123randomnonexistentword", adminHelpData.topics);
      expect(results).toHaveLength(0);
    });

    it("searches case-insensitively and trims whitespace", () => {
      const lower = searchTopics("catalog", adminHelpData.topics);
      const upper = searchTopics("  CATALOG  ", adminHelpData.topics);
      expect(lower.length).toBe(upper.length);
      expect(lower.length).toBeGreaterThan(0);
    });
  });

  describe("Editorial Integrity", () => {
    it("never includes HTML comments in the user-facing data", () => {
      const adminStr = JSON.stringify(adminHelpData);
      expect(adminStr).not.toContain("<!--");
      expect(adminStr).not.toContain("-->");
      expect(adminStr).not.toContain("IMPLEMENTATION NOTES");
      expect(adminStr).not.toContain("SOURCE MAP / CONTENT BOUNDARIES");

      const cashierStr = JSON.stringify(cashierHelpData);
      expect(cashierStr).not.toContain("<!--");
      expect(cashierStr).not.toContain("-->");
      expect(cashierStr).not.toContain("IMPLEMENTATION NOTES");
      expect(cashierStr).not.toContain("SOURCE MAP / CONTENT BOUNDARIES");
    });

    it("contains Remember callouts in both guides", () => {
      const adminRemembers = adminHelpData.topics.flatMap((t) =>
        t.blocks.filter((b) => b.type === "remember"),
      );
      expect(adminRemembers.length).toBeGreaterThan(5);

      const cashierRemembers = cashierHelpData.topics.flatMap((t) =>
        t.blocks.filter((b) => b.type === "remember"),
      );
      expect(cashierRemembers.length).toBeGreaterThan(5);
    });

    it("contains Tables in both guides with preserved content", () => {
      const adminTables = adminHelpData.topics.flatMap((t) =>
        t.blocks.filter((b) => b.type === "table"),
      );
      expect(adminTables.length).toBeGreaterThan(5);

      const cashierTables = cashierHelpData.topics.flatMap((t) =>
        t.blocks.filter((b) => b.type === "table"),
      );
      expect(cashierTables.length).toBeGreaterThan(4);
    });
  });
});
