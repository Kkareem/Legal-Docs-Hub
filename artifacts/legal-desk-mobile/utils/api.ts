import { Platform } from "react-native";

const trimSlash = (value: string) => value.replace(/\/+$/, "");

const INVALID_API_TARGET_MESSAGE =
  "The mobile app received HTML instead of API JSON. Set EXPO_PUBLIC_API_BASE_URL to http://<YOUR_PC_LAN_IP>:8015/api and make sure the phone and PC are on the same Wi-Fi.";

const getBase = () => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return trimSlash(process.env.EXPO_PUBLIC_API_BASE_URL);
  }

  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
  }

  if (Platform.OS !== "web") {
    throw new Error(
      "Missing EXPO_PUBLIC_API_BASE_URL. For a real phone, point it to http://<YOUR_PC_LAN_IP>:8015/api.",
    );
  }

  return "/api";
};

async function readBody(response: Response): Promise<{ text: string; json: unknown | null }> {
  const text = await response.text();

  if (!text.trim()) {
    return { text, json: null };
  }

  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text, json: null };
  }
}

function isHtmlPayload(text: string, response: Response): boolean {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const trimmed = text.trimStart().toLowerCase();
  return contentType.includes("text/html") || trimmed.startsWith("<!doctype") || trimmed.startsWith("<html") || trimmed.startsWith("<");
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const { text, json } = await readBody(response);

  if (json !== null) {
    return json as T;
  }

  if (isHtmlPayload(text, response)) {
    throw new Error(INVALID_API_TARGET_MESSAGE);
  }

  throw new Error(text.trim() || `Unexpected ${response.status} response`);
}

async function toApiError(response: Response): Promise<Error> {
  const { text, json } = await readBody(response);

  if (isHtmlPayload(text, response)) {
    return new Error(INVALID_API_TARGET_MESSAGE);
  }

  const message =
    (json as { message?: string } | null)?.message ??
    text.trim() ??
    `Unexpected ${response.status} response`;

  return new Error(message || `Unexpected ${response.status} response`);
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };
  return fetch(`${getBase()}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) throw await toApiError(res);
  return parseJsonResponse<T>(res);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) throw await toApiError(res);
  return parseJsonResponse<T>(res);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, { method: "PATCH", body: JSON.stringify(body) });
  if (!res.ok) throw await toApiError(res);
  return parseJsonResponse<T>(res);
}

export async function apiDelete(path: string): Promise<void> {
  const res = await apiFetch(path, { method: "DELETE" });
  if (!res.ok) throw await toApiError(res);
}
