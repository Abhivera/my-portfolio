import type {
  NotepadCollection,
  NotepadNote,
  NoteType,
  NotepadWorkspaceData,
} from "../../lib/notepad/types";
import { normalizeNoteType } from "../../lib/notepad/types";

export { normalizeNoteType };

export function createNotepadNote(
  title = "Untitled",
  noteType: NoteType = "canvas",
  collectionId: string | null = null,
): NotepadNote {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title,
    noteType,
    content: "",
    inkData: undefined,
    collectionId,
    createdAt: now,
    updatedAt: now,
  };
}

export function createNotepadCollection(title = "New collection"): NotepadCollection {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: title.trim() || "New collection",
    createdAt: now,
    updatedAt: now,
  };
}

export function defaultNotepadWorkspace(): NotepadWorkspaceData {
  const note = createNotepadNote();
  return { notes: [note], collections: [], activeNoteId: note.id };
}

export function getActiveNote(
  workspace: NotepadWorkspaceData,
): NotepadNote | undefined {
  return workspace.notes.find((n) => n.id === workspace.activeNoteId);
}

export function updateActiveNote(
  workspace: NotepadWorkspaceData,
  updater: (note: NotepadNote) => NotepadNote,
): NotepadWorkspaceData {
  const now = new Date().toISOString();
  let changed = false;
  const notes = workspace.notes.map((note) => {
    if (note.id !== workspace.activeNoteId) return note;
    const next = updater(note);
    if (next === note) return note;
    changed = true;
    return { ...next, updatedAt: now };
  });
  if (!changed) return workspace;
  return { ...workspace, notes };
}

export function getWorkspaceCollections(
  workspace: NotepadWorkspaceData,
): NotepadCollection[] {
  return workspace.collections ?? [];
}
