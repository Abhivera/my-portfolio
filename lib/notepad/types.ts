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

export type NotepadNote = {
  id: string;
  title: string;
  noteType?: NoteType;
  content: string;
  inkData?: string;
  /** Optional folder; omitted/null = uncategorized. */
  collectionId?: string | null;
  createdAt: string;
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
