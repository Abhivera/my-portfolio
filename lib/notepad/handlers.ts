import { randomBytes } from "node:crypto";
import { checkPassword } from "./auth.js";
import {
  deleteFromDrive,
  downloadFromDrive,
  isDriveConfigured,
  uploadToDrive,
} from "./drive.js";
import {
  isNotepadHttpError,
  logNotepad,
  serializeError,
} from "./errors.js";
import {
  addNoteAttachment,
  findNoteByShareToken,
  getNotepadWorkspace,
  removeNoteAttachment,
  saveNotepadWorkspace,
  setNoteShareToken,
} from "./store.js";
import { normalizeNoteType, type NotepadWorkspaceData } from "./types.js";
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

function requireAuth(request: Request): boolean {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  return Boolean(session?.authenticated);
}

function createShareToken(): string {
  return randomBytes(24).toString("base64url");
}

function contentDisposition(filename: string, inline = false): string {
  const safe = filename.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 180);
  const disposition = inline ? "inline" : "attachment";
  return `${disposition}; filename="${safe}"`;
}

function catchToResponse(scope: string, err: unknown): Response {
  const serialized = serializeError(err);
  if (isNotepadHttpError(err)) {
    logNotepad(scope, "error", err.message, {
      status: err.status,
      details: err.details,
      error: serialized,
    });
    return errorResponse(err.message, err.status);
  }
  logNotepad(scope, "error", "Unhandled error", { error: serialized });
  return errorResponse("Internal server error", 500);
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
  if (!requireAuth(request)) {
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
        collections: Array.isArray(body.collections) ? body.collections : [],
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

/**
 * Share endpoints:
 * - GET ?token=… — public read (no auth)
 * - POST { noteId } — create/enable share link (auth)
 * - DELETE { noteId } — revoke share link (auth)
 */
export async function handleNotepadShare(request: Request): Promise<Response> {
  try {
    if (request.method === "GET") {
      const url = new URL(request.url);
      const token = url.searchParams.get("token")?.trim() ?? "";
      if (!token) {
        return errorResponse("Share token is required", 400);
      }

      const note = await findNoteByShareToken(token);
      if (!note) {
        return errorResponse("Shared note not found", 404);
      }

      const noteType = normalizeNoteType(note);
      return jsonResponse({
        title: note.title || "Untitled",
        noteType,
        content: noteType === "markdown" ? note.content : "",
        inkData: noteType === "canvas" ? note.inkData : undefined,
        attachments: note.attachments ?? [],
        updatedAt: note.updatedAt,
      });
    }

    if (!requireAuth(request)) {
      return errorResponse("Unauthorized", 401);
    }

    if (request.method === "POST") {
      const body = (await request.json()) as { noteId?: string };
      if (!body.noteId?.trim()) {
        return errorResponse("noteId is required", 400);
      }

      const workspace = await getNotepadWorkspace();
      const existing = workspace.notes.find((n) => n.id === body.noteId);
      if (!existing) {
        return errorResponse("Note not found", 404);
      }

      const token = existing.shareToken?.trim() || createShareToken();
      const updated = await setNoteShareToken(body.noteId, token);
      if (!updated) {
        return errorResponse("Note not found", 404);
      }

      return jsonResponse({
        success: true,
        noteId: body.noteId,
        shareToken: updated.shareToken,
        sharePath: `/notepad/share/${updated.shareToken}`,
      });
    }

    if (request.method === "DELETE") {
      const body = (await request.json()) as { noteId?: string };
      if (!body.noteId?.trim()) {
        return errorResponse("noteId is required", 400);
      }

      const updated = await setNoteShareToken(body.noteId, null);
      if (!updated) {
        return errorResponse("Note not found", 404);
      }

      return jsonResponse({
        success: true,
        noteId: body.noteId,
        shareToken: null,
      });
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    console.error("[notepad/share]", err);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * Attachments (Google Drive):
 * - POST multipart FormData { file, noteId } — upload (auth)
 * - GET ?id=… — download/stream file (auth, or public with ?token= share token)
 * - DELETE { noteId, attachmentId } — remove from note + Drive (auth)
 */
export async function handleNotepadAttachments(
  request: Request,
): Promise<Response> {
  const scope = "notepad/attachments";
  try {
    if (request.method === "GET") {
      const url = new URL(request.url);
      const id = url.searchParams.get("id")?.trim() ?? "";
      const shareToken = url.searchParams.get("token")?.trim() ?? "";
      const inline = url.searchParams.get("inline") === "1";
      logNotepad(scope, "info", "GET attachment", {
        id,
        inline,
        shared: Boolean(shareToken),
      });
      if (!id) {
        return errorResponse("Attachment id is required", 400);
      }

      const authed = requireAuth(request);
      if (!authed) {
        if (!shareToken) {
          return errorResponse("Unauthorized", 401);
        }
        const shared = await findNoteByShareToken(shareToken);
        if (!shared?.attachments?.some((a) => a.id === id)) {
          return errorResponse("Shared note not found", 404);
        }
      }

      if (!isDriveConfigured()) {
        logNotepad(scope, "error", "Drive not configured for GET");
        return errorResponse("Google Drive is not configured", 503);
      }

      const file = await downloadFromDrive(id);
      logNotepad(scope, "info", "GET attachment success", {
        id,
        filename: file.name,
        bytes: file.data.length,
      });
      return new Response(new Uint8Array(file.data), {
        headers: {
          "Content-Type": file.mimeType,
          "Content-Disposition": contentDisposition(file.name, inline),
          "Cache-Control": authed
            ? "private, max-age=3600"
            : "public, max-age=300",
        },
      });
    }

    if (!requireAuth(request)) {
      logNotepad(scope, "warn", "Unauthorized", { method: request.method });
      return errorResponse("Unauthorized", 401);
    }

    if (request.method === "POST") {
      if (!isDriveConfigured()) {
        logNotepad(scope, "error", "Drive not configured for POST");
        return errorResponse("Google Drive is not configured", 503);
      }

      const formData = await request.formData();
      const file = formData.get("file");
      const noteId =
        typeof formData.get("noteId") === "string"
          ? String(formData.get("noteId")).trim()
          : "";

      if (!(file instanceof File)) {
        logNotepad(scope, "warn", "POST missing file", {
          noteId,
          fileType: file == null ? "null" : typeof file,
        });
        return errorResponse("File is required", 400);
      }
      if (!noteId) {
        return errorResponse("noteId is required", 400);
      }

      logNotepad(scope, "info", "POST upload started", {
        noteId,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        bytes: file.size,
      });

      const workspace = await getNotepadWorkspace();
      if (!workspace.notes.some((n) => n.id === noteId)) {
        logNotepad(scope, "warn", "Note not found for upload", { noteId });
        return errorResponse("Note not found", 404);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadToDrive(
        buffer,
        file.type || "application/octet-stream",
        file.name || "attachment",
      );

      const attachment = {
        id: uploaded.id,
        name: uploaded.name,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        createdAt: new Date().toISOString(),
      };

      const result = await addNoteAttachment(noteId, attachment);
      if (!result) {
        logNotepad(scope, "warn", "Note missing after Drive upload; cleanup", {
          noteId,
          fileId: uploaded.id,
        });
        try {
          await deleteFromDrive(uploaded.id);
        } catch (cleanupErr) {
          logNotepad(scope, "error", "Cleanup delete failed", {
            fileId: uploaded.id,
            error: serializeError(cleanupErr),
          });
        }
        return errorResponse("Note not found", 404);
      }

      logNotepad(scope, "info", "POST upload complete", {
        noteId,
        attachmentId: result.attachment.id,
        filename: result.attachment.name,
        bytes: result.attachment.size,
      });

      return jsonResponse(
        {
          success: true,
          noteId,
          attachment: result.attachment,
        },
        { status: 201 },
      );
    }

    if (request.method === "DELETE") {
      const body = (await request.json()) as {
        noteId?: string;
        attachmentId?: string;
      };
      const noteId = body.noteId?.trim() ?? "";
      const attachmentId = body.attachmentId?.trim() ?? "";
      logNotepad(scope, "info", "DELETE attachment", { noteId, attachmentId });
      if (!noteId || !attachmentId) {
        return errorResponse("noteId and attachmentId are required", 400);
      }

      const result = await removeNoteAttachment(noteId, attachmentId);
      if (!result) {
        return errorResponse("Note not found", 404);
      }

      if (result.removed && isDriveConfigured()) {
        try {
          await deleteFromDrive(attachmentId);
        } catch (err) {
          // Metadata already removed — log Drive cleanup failure but succeed.
          logNotepad(scope, "error", "Drive delete after metadata remove failed", {
            noteId,
            attachmentId,
            error: serializeError(err),
          });
        }
      }

      logNotepad(scope, "info", "DELETE attachment complete", {
        noteId,
        attachmentId,
        removed: Boolean(result.removed),
      });

      return jsonResponse({
        success: true,
        noteId,
        attachmentId,
        removed: Boolean(result.removed),
      });
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    return catchToResponse(scope, err);
  }
}
