export type NotepadNote = {
  id: string;
  title: string;
  content: string;
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
