import {
  AUTH_HYDRATE,
  AUTH_LOGOUT,
  AUTH_SET_CREDENTIALS,
  type AuthAction,
  type AuthState,
} from "@/redux/types";

export const authInitialState: AuthState = {
  accessToken: null,
  user: null,
  hydrated: false,
};

export function authReducer(
  state: AuthState = authInitialState,
  action: AuthAction,
): AuthState {
  switch (action.type) {
    case AUTH_SET_CREDENTIALS:
      return {
        accessToken: action.payload.accessToken,
        user: action.payload.user,
        hydrated: true,
      };
    case AUTH_HYDRATE:
      if (!action.payload) {
        return { ...authInitialState, hydrated: true };
      }
      return {
        accessToken: action.payload.accessToken,
        user: action.payload.user,
        hydrated: true,
      };
    case AUTH_LOGOUT:
      return { ...authInitialState, hydrated: true };
    default:
      return state;
  }
}
