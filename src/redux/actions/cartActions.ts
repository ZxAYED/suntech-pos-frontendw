import {
  CART_ADD_ITEM,
  CART_CLEAR,
  CART_REMOVE_ITEM,
  CART_UPDATE_QTY,
  type AddCartItemPayload,
  type CartAction,
} from "@/redux/types";

export function addCartItem(payload: AddCartItemPayload): CartAction {
  return { type: CART_ADD_ITEM, payload };
}

export function removeCartItem(id: string): CartAction {
  return { type: CART_REMOVE_ITEM, payload: { id } };
}

export function updateCartQty(id: string, quantity: number): CartAction {
  return { type: CART_UPDATE_QTY, payload: { id, quantity } };
}

export function clearCart(): CartAction {
  return { type: CART_CLEAR };
}
