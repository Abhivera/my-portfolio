import type { TodoWorkspaceData } from "../../lib/todo/types";

const CONTENT_API = "/api/goal/content";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
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
