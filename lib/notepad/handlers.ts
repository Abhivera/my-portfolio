import { checkPassword } from "./auth.js";
import { getNotepadWorkspace, saveNotepadWorkspace } from "./store.js";
import type { NotepadWorkspaceData } from "./types.js";
import {
  clearSessionCookieHeader,
  getSessionFromCookieHeader,
  sealSession,
  sessionCookieHeader,
} from "./session.js";

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

export async function handleNotepadAuth(request: Request): Promise<Response> {
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
    console.error("[notepad/auth]", err);
    const message =
      err instanceof Error && err.message.includes("NOTEPAD_PASSWORD")
        ? err.message
        : "Internal server error";
    return errorResponse(message, 500);
  }
}

export async function handleNotepadContent(request: Request): Promise<Response> {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session?.authenticated) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    if (request.method === "GET") {
      const data = await getNotepadWorkspace();
      return jsonResponse(data);
    }

    if (request.method === "POST") {
      const body = (await request.json()) as Partial<NotepadWorkspaceData>;
      if (!Array.isArray(body.notes) || typeof body.activeNoteId !== "string") {
        return errorResponse("Invalid workspace payload", 400);
      }

      const updatedAt = await saveNotepadWorkspace({
        notes: body.notes,
        activeNoteId: body.activeNoteId,
      });
      return jsonResponse({ success: true, updatedAt });
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    console.error("[notepad/content]", err);
    return errorResponse("Internal server error", 500);
  }
}
