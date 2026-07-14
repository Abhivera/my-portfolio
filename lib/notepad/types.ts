export type InkPoint = {
  x: number;
  y: number;
  p: number;
};

export type InkStroke = {
  points: InkPoint[];
  width: number;
  eraser?: boolean;
  /** CSS color; omitted strokes use the canvas default ink color. */
  color?: string;
  /** 0–1; omitted strokes render fully opaque. */
  opacity?: number;
};

export type InkData = {
  version: 1;
  strokes: InkStroke[];
};

export type NoteType = "canvas" | "markdown";

export function normalizeNoteType(
  note: Pick<NotepadNote, "noteType" | "inkData" | "content">,
): NoteType {
  if (note.noteType === "canvas" || note.noteType === "markdown") {
    return note.noteType;
  }
  if (note.inkData?.trim()) return "canvas";
  if (note.content?.trim()) return "markdown";
  return "canvas";
}

/** Metadata only — file bytes live in Google Drive. */
export type NotepadAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type NotepadNote = {
  id: string;
  title: string;
  noteType?: NoteType;
  content: string;
  inkData?: string;
  /** Optional folder; omitted/null = uncategorized. */
  collectionId?: string | null;
  /** When set, note is publicly readable at /notepad/share/{shareToken}. */
  shareToken?: string | null;
  /** Files stored in Google Drive (metadata only). */
  attachments?: NotepadAttachment[];
  createdAt: string;
  updatedAt: string;
};

/** Public payload returned for a shared note (no auth). */
export type PublicSharedNote = {
  title: string;
  noteType: NoteType;
  content: string;
  inkData?: string;
  attachments?: NotepadAttachment[];
  updatedAt: string;
};

export type NotepadCollection = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type NotepadWorkspaceData = {
  notes: NotepadNote[];
  collections?: NotepadCollection[];
  activeNoteId: string;
};

export type NotepadWorkspaceDoc = {
  _id: "workspace";
  notes: NotepadNote[];
  collections?: NotepadCollection[];
  activeNoteId: string;
  updatedAt: Date;
};

/** Legacy single-note format */
export type LegacyNotepadDoc = {
  _id: "shared";
  content: string;
  updatedAt: Date;
};

export const WORKSPACE_ID = "workspace" as const;
export const MAX_NOTES = 50;
export const MAX_COLLECTIONS = 30;
export const MAX_TITLE_LENGTH = 200;
export const MAX_CONTENT_LENGTH = 500_000;
export const MAX_INK_DATA_LENGTH = 1_000_000;
export const MAX_ATTACHMENTS_PER_NOTE = 20;
export const MAX_ATTACHMENT_NAME_LENGTH = 200;
export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

/** HTML file input `accept` — keep in sync with Drive allowlists in drive.ts. */
export const ATTACHMENT_FILE_ACCEPT =
  "image/*,audio/*,video/*,text/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.zip,.json";
