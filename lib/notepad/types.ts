export type InkPoint = {
  x: number;
  y: number;
  p: number;
};

export type InkStroke = {
  points: InkPoint[];
  width: number;
  eraser?: boolean;
};

export type InkData = {
  version: 1;
  strokes: InkStroke[];
};

export type NotepadNote = {
  id: string;
  title: string;
  content: string;
  inkData?: string;
  createdAt: string;
  updatedAt: string;
};

export type NotepadWorkspaceData = {
  notes: NotepadNote[];
  activeNoteId: string;
};

export type NotepadWorkspaceDoc = {
  _id: "workspace";
  notes: NotepadNote[];
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
export const MAX_TITLE_LENGTH = 200;
export const MAX_CONTENT_LENGTH = 500_000;
export const MAX_INK_DATA_LENGTH = 1_000_000;
