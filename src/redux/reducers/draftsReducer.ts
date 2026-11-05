import {
  DRAFTS_CLEAR,
  DRAFTS_HYDRATE,
  DRAFT_REMOVE,
  DRAFT_SAVE,
  type DraftsAction,
  type DraftsState,
} from "@/redux/types";

export const MAX_DRAFTS = 5;

export const draftsInitialState: DraftsState = {
  drafts: [],
  maxDrafts: MAX_DRAFTS,
  hydrated: false,
};

export function draftsReducer(
  state: DraftsState = draftsInitialState,
  action: DraftsAction,
): DraftsState {
  switch (action.type) {
    case DRAFTS_HYDRATE:
      return {
        ...state,
        drafts: (action.payload || []).slice(0, state.maxDrafts),
        hydrated: true,
      };
    case DRAFT_SAVE: {
      const existingIndex = state.drafts.findIndex((d) => d.id === action.payload.id);
      if (existingIndex >= 0) {
        const updated = [...state.drafts];
        updated[existingIndex] = action.payload;
        return {
          ...state,
          drafts: updated,
        };
      }
      if (state.drafts.length >= state.maxDrafts) {
        return state;
      }
      return {
        ...state,
        drafts: [action.payload, ...state.drafts].slice(0, state.maxDrafts),
      };
    }
    case DRAFT_REMOVE:
      return {
        ...state,
        drafts: state.drafts.filter((d) => d.id !== action.payload.id),
      };
    case DRAFTS_CLEAR:
      return {
        ...state,
        drafts: [],
      };
    default:
      return state;
  }
}
