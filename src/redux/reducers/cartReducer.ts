import {
  CART_ADD_ITEM,
  CART_CLEAR,
  CART_REMOVE_ITEM,
  CART_UPDATE_QTY,
  type CartAction,
  type CartItem,
  type CartState,
} from "@/redux/types";

function withTotals(items: CartItem[]): CartState {
  const normalized = items.map((item) => ({
    ...item,
    quantity: item.quantity,
    subtotal: item.unitPrice * item.quantity,
  }));
  return {
    items: normalized,
    itemCount: normalized.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: normalized.reduce((sum, item) => sum + item.subtotal, 0),
  };
}

export const cartInitialState: CartState = {
  items: [],
  itemCount: 0,
  subtotal: 0,
};

export function cartReducer(
  state: CartState = cartInitialState,
  action: CartAction,
): CartState {
  switch (action.type) {
    case CART_ADD_ITEM: {
      const quantity = action.payload.quantity ?? 1;
      const existingIndex = action.payload.variantId
        ? state.items.findIndex((item) => item.variantId === action.payload.variantId)
        : -1;

      if (existingIndex >= 0) {
        const next = state.items.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
        return withTotals(next);
      }

      const nextItem: CartItem = {
        id: action.payload.id,
        name: action.payload.name,
        unitPrice: action.payload.unitPrice,
        quantity,
        subtotal: action.payload.unitPrice * quantity,
        variantId: action.payload.variantId,
        custom: action.payload.custom ?? false,
      };
      return withTotals([...state.items, nextItem]);
    }
    case CART_REMOVE_ITEM:
      return withTotals(state.items.filter((item) => item.id !== action.payload.id));
    case CART_UPDATE_QTY: {
      if (action.payload.quantity <= 0) {
        return withTotals(state.items.filter((item) => item.id !== action.payload.id));
      }
      return withTotals(
        state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item,
        ),
      );
    }
    case CART_CLEAR:
      return cartInitialState;
    default:
      return state;
  }
}
