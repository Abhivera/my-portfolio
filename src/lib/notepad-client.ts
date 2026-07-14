import type {
  NotepadAttachment,
  NotepadWorkspaceData,
  PublicSharedNote,
} from "../../lib/notepad/types";

const AUTH_API = "/api/notepad/auth";
const CONTENT_API = "/api/notepad/content";
const SHARE_API = "/api/notepad/share";
const ATTACHMENTS_API = "/api/notepad/attachments";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function getNotepadAuthStatus(): Promise<{ authenticated: boolean }> {
  const res = await fetch(AUTH_API, { credentials: "include" });
  return parseJson(res);
}

export async function verifyNotepadPassword(
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

export async function logoutNotepad(): Promise<void> {
  await fetch(AUTH_API, { method: "DELETE", credentials: "include" });
}

export async function getNotepadWorkspace(): Promise<
  NotepadWorkspaceData & { updatedAt: string | null }
> {
  const res = await fetch(CONTENT_API, { credentials: "include" });
  return parseJson(res);
}

export async function saveNotepadWorkspace(
  workspace: NotepadWorkspaceData,
): Promise<{ success: true; updatedAt: string }> {
  const res = await fetch(CONTENT_API, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(workspace),
  });
  return parseJson(res);
}

export type ShareLinkResult = {
  success: true;
  noteId: string;
  shareToken: string;
  sharePath: string;
};

export async function createNoteShareLink(
  noteId: string,
): Promise<ShareLinkResult> {
  const res = await fetch(SHARE_API, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ noteId }),
  });
  return parseJson(res);
}

export async function revokeNoteShareLink(
  noteId: string,
): Promise<{ success: true; noteId: string; shareToken: null }> {
  const res = await fetch(SHARE_API, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ noteId }),
  });
  return parseJson(res);
}

/** Public — no credentials required. */
export async function getSharedNote(token: string): Promise<PublicSharedNote> {
  const res = await fetch(
    `${SHARE_API}?token=${encodeURIComponent(token)}`,
  );
  return parseJson(res);
}

export function sharedNoteUrl(shareToken: string): string {
  if (typeof window === "undefined") {
    return `/notepad/share/${shareToken}`;
  }
  return `${window.location.origin}/notepad/share/${shareToken}`;
}

export async function uploadNotepadAttachment(
  noteId: string,
  file: File,
): Promise<{
  success: true;
  noteId: string;
  attachment: NotepadAttachment;
}> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("noteId", noteId);

  const res = await fetch(ATTACHMENTS_API, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return parseJson(res);
}

export async function deleteNotepadAttachment(
  noteId: string,
  attachmentId: string,
): Promise<{
  success: true;
  noteId: string;
  attachmentId: string;
  removed: boolean;
}> {
  const res = await fetch(ATTACHMENTS_API, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ noteId, attachmentId }),
  });
  return parseJson(res);
}

export function notepadAttachmentUrl(
  attachmentId: string,
  options?: { inline?: boolean; shareToken?: string },
): string {
  const params = new URLSearchParams({ id: attachmentId });
  if (options?.inline) params.set("inline", "1");
  if (options?.shareToken) params.set("token", options.shareToken);
  return `${ATTACHMENTS_API}?${params.toString()}`;
}
