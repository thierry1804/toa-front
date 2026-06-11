import { setAuthToken } from "./auth-storage";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export type LoginCredentials = {
  email: string;
  password: string;
};

type LoginErrorBody = {
  message?: string;
  code?: string;
};

export async function loginCheck(
  credentials: LoginCredentials,
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/login_check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });

  const body = (await response.json().catch(() => ({}))) as
    | { token?: string }
    | LoginErrorBody;

  if (!response.ok) {
    const message =
      "message" in body && typeof body.message === "string"
        ? body.message
        : "Identifiants incorrects";
    throw new Error(message);
  }

  if (!("token" in body) || typeof body.token !== "string") {
    throw new Error("Réponse serveur invalide");
  }

  setAuthToken(body.token);
}
