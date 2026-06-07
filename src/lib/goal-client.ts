import type { TodoWorkspaceData } from "../../lib/todo/types";

const AUTH_API = "/api/goal/auth";
const CONTENT_API = "/api/goal/content";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function getGoalAuthStatus(): Promise<{ authenticated: boolean }> {
  const res = await fetch(AUTH_API, { credentials: "include" });
  return parseJson(res);
}

export async function verifyGoalPassword(
  password: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const res = await fetch(AUTH_API, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  const data = (await res.json()) as {
    success?: boolean;
    error?: string;
  };

  if (res.ok && data.success) {
    return { success: true };
  }
  return {
    success: false,
    error: data.error ?? "Incorrect password",
  };
}

export async function logoutGoal(): Promise<void> {
  await fetch(AUTH_API, { method: "DELETE", credentials: "include" });
}

export async function getGoalWorkspace(): Promise<
  TodoWorkspaceData & { updatedAt: string | null }
> {
  const res = await fetch(CONTENT_API, { credentials: "include" });
  return parseJson(res);
}

export async function saveGoalWorkspace(
  data: TodoWorkspaceData,
): Promise<{ success: true; updatedAt: string }> {
  const res = await fetch(CONTENT_API, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJson(res);
}
