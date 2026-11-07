import { describe, expect, it, beforeEach } from "vitest";
import { draftsReducer, MAX_DRAFTS } from "@/redux/reducers/draftsReducer";
import {
  clearDrafts,
  hydrateDrafts,
  removeDraft,
  saveDraft,
} from "@/redux/actions/draftsActions";
import type { DraftsState, SavedDraft } from "@/redux/types";
import {
  loadSavedDrafts,
  persistSavedDrafts,
  clearSavedDrafts,
} from "@/redux/storage";
import { MemoryStorage } from "@/lib/__tests__/test-storage";

describe("Redux Drafts Slice & Persistence", () => {
  const initial: DraftsState = {
    drafts: [],
    maxDrafts: MAX_DRAFTS,
    hydrated: false,
  };

  const sampleDraft1: SavedDraft = {
    id: "draft-1",
    label: "Draft #1",
    lines: [
      {
        variantId: "v-1",
        name: "Infinix 45W Charger",
        sku: "INF-45W",
        unitPrice: 1450,
        quantity: 1,
        stock: 10,
      },
    ],
    customerName: "Walk-in Customer",
    paymentMethod: "COD",
    subtotal: 1450,
    itemCount: 1,
    createdAt: new Date().toISOString(),
  };

  const sampleDraft2: SavedDraft = {
    id: "draft-2",
    label: "Draft #2",
    lines: [
      {
        variantId: "v-2",
        name: "Anker R50i TWS",
        sku: "ANK-R50I",
        unitPrice: 2490,
        quantity: 2,
        stock: 5,
      },
    ],
    customerName: "Mr. Rahim",
    customerPhone: "01712345678",
    paymentMethod: "BKASH",
    subtotal: 4980,
    itemCount: 2,
    createdAt: new Date().toISOString(),
  };

  it("saves drafts up to MAX_DRAFTS (5) and prepends newest draft", () => {
    let state = draftsReducer(initial, saveDraft(sampleDraft1));
    expect(state.drafts).toHaveLength(1);
    expect(state.drafts[0].id).toBe("draft-1");

    state = draftsReducer(state, saveDraft(sampleDraft2));
    expect(state.drafts).toHaveLength(2);
    // Newest draft should be at the front
    expect(state.drafts[0].id).toBe("draft-2");
    expect(state.drafts[1].id).toBe("draft-1");
  });

  it("enforces maximum limit of 5 drafts strictly", () => {
    let state = initial;
    for (let i = 1; i <= 7; i++) {
      const draft: SavedDraft = {
        ...sampleDraft1,
        id: `draft-${i}`,
        label: `Draft #${i}`,
      };
      state = draftsReducer(state, saveDraft(draft));
    }
    expect(state.drafts).toHaveLength(5);
    // The 6th and 7th were not added once 5 was reached
    expect(state.drafts.map((d) => d.id)).toEqual([
      "draft-5",
      "draft-4",
      "draft-3",
      "draft-2",
      "draft-1",
    ]);
  });

  it("removes a draft by ID when Continue or Discard is pressed", () => {
    let state = draftsReducer(initial, saveDraft(sampleDraft1));
    state = draftsReducer(state, saveDraft(sampleDraft2));
    expect(state.drafts).toHaveLength(2);

    state = draftsReducer(state, removeDraft("draft-1"));
    expect(state.drafts).toHaveLength(1);
    expect(state.drafts[0].id).toBe("draft-2");
  });

  it("clears all drafts when requested", () => {
    let state = draftsReducer(initial, saveDraft(sampleDraft1));
    state = draftsReducer(state, saveDraft(sampleDraft2));
    expect(state.drafts).toHaveLength(2);

    state = draftsReducer(state, clearDrafts());
    expect(state.drafts).toHaveLength(0);
  });

  it("hydrates drafts from storage and marks hydrated as true", () => {
    const draftsToHydrate = [sampleDraft1, sampleDraft2];
    const state = draftsReducer(initial, hydrateDrafts(draftsToHydrate));
    expect(state.hydrated).toBe(true);
    expect(state.drafts).toHaveLength(2);
    expect(state.drafts[0].id).toBe("draft-1");
  });
});

describe("Drafts LocalStorage Persistence Helper", () => {
  beforeEach(() => {
    const mem = new MemoryStorage();
    (globalThis as unknown as { window: { localStorage: MemoryStorage } }).window = {
      localStorage: mem,
    };
  });

  it("persists and restores saved drafts correctly across reloads", () => {
    const drafts: SavedDraft[] = [
      {
        id: "d-persisted-1",
        label: "Draft #1",
        lines: [
          {
            variantId: "v-1",
            name: "Item A",
            sku: "SKU-A",
            unitPrice: 500,
            quantity: 1,
            stock: 20,
          },
        ],
        subtotal: 500,
        itemCount: 1,
        createdAt: new Date().toISOString(),
      },
    ];

    persistSavedDrafts(drafts);

    const loaded = loadSavedDrafts();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe("d-persisted-1");
    expect(loaded[0].lines[0].name).toBe("Item A");

    clearSavedDrafts();
    expect(loadSavedDrafts()).toHaveLength(0);
  });
});
