import type { User } from "@/types/domain";
import {
  AUTH_HYDRATE,
  AUTH_LOGOUT,
  AUTH_SET_CREDENTIALS,
  type AuthAction,
  type SetCredentialsPayload,
} from "@/redux/types";

export function setCredentials(payload: SetCredentialsPayload): AuthAction {
  return { type: AUTH_SET_CREDENTIALS, payload };
}

export function hydrateAuth(payload: { accessToken: string; user: User } | null): AuthAction {
  return { type: AUTH_HYDRATE, payload };
}

export function logout(): AuthAction {
  return { type: AUTH_LOGOUT };
}
