import {
  DRAFTS_CLEAR,
  DRAFTS_HYDRATE,
  DRAFT_REMOVE,
  DRAFT_SAVE,
  type DraftsAction,
  type SavedDraft,
} from "@/redux/types";

export function hydrateDrafts(drafts: SavedDraft[]): DraftsAction {
  return {
    type: DRAFTS_HYDRATE,
    payload: drafts,
  };
}

export function saveDraft(draft: SavedDraft): DraftsAction {
  return {
    type: DRAFT_SAVE,
    payload: draft,
  };
}

export function removeDraft(id: string): DraftsAction {
  return {
    type: DRAFT_REMOVE,
    payload: { id },
  };
}

export function clearDrafts(): DraftsAction {
  return {
    type: DRAFTS_CLEAR,
  };
}
