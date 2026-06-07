import { checkPassword } from "./auth.js";
import {
  clearSessionCookieHeader,
  getSessionFromCookieHeader,
  sealSession,
  sessionCookieHeader,
} from "./session.js";
import { getTodoWorkspace, saveTodoWorkspace } from "./store.js";
import type { TodoWorkspaceData } from "./types.js";

function jsonResponse(
  body: unknown,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { ...init, headers });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, { status });
}

function isTodoWorkspace(value: unknown): value is TodoWorkspaceData {
  if (!value || typeof value !== "object") return false;
  const data = value as TodoWorkspaceData;
  if (!Array.isArray(data.lists) || typeof data.activeListId !== "string") {
    return false;
  }
  return data.lists.every(
    (list) =>
      typeof list.id === "string" &&
      typeof list.title === "string" &&
      typeof list.icon === "string" &&
      Array.isArray(list.items) &&
      list.items.every(
        (item) =>
          typeof item.id === "string" &&
          (item.type === "todo" || item.type === "heading") &&
          typeof item.text === "string" &&
          typeof item.checked === "boolean" &&
          typeof item.indent === "number",
      ),
  );
}

export async function handleGoalAuth(request: Request): Promise<Response> {
  try {
    if (request.method === "GET") {
      const session = getSessionFromCookieHeader(
        request.headers.get("cookie"),
      );
      return jsonResponse({ authenticated: Boolean(session?.authenticated) });
    }

    if (request.method === "POST") {
      const body = (await request.json()) as { password?: string };
      if (!body.password?.trim()) {
        return errorResponse("Password is required", 400);
      }

      const valid = checkPassword(body.password);
      if (!valid) {
        return jsonResponse(
          { success: false, error: "Incorrect password" },
          { status: 401 },
        );
      }

      const token = sealSession({ authenticated: true });
      return jsonResponse(
        { success: true },
        {
          headers: { "Set-Cookie": sessionCookieHeader(token) },
        },
      );
    }

    if (request.method === "DELETE") {
      return jsonResponse(
        { success: true },
        { headers: { "Set-Cookie": clearSessionCookieHeader() } },
      );
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    console.error("[goal/auth]", err);
    const message =
      err instanceof Error && err.message.includes("GOAL_PASSWORD")
        ? err.message
        : "Internal server error";
    return errorResponse(message, 500);
  }
}

export async function handleTodoContent(request: Request): Promise<Response> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session?.authenticated) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    if (request.method === "GET") {
      const data = await getTodoWorkspace();
      return jsonResponse(data);
    }

    if (request.method === "POST") {
      const body = (await request.json()) as unknown;
      if (!isTodoWorkspace(body)) {
        return errorResponse("Invalid todo workspace", 400);
      }

      const updatedAt = await saveTodoWorkspace(body);
      return jsonResponse({ success: true, updatedAt });
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    console.error("[todo/content]", err);
    return errorResponse("Internal server error", 500);
  }
}
