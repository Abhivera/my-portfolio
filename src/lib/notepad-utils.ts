import type {
  NotepadNote,
  NotepadWorkspaceData,
} from "../../lib/notepad/types";

export function createNotepadNote(title = "Untitled"): NotepadNote {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title,
    content: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function defaultNotepadWorkspace(): NotepadWorkspaceData {
  const note = createNotepadNote();
  return { notes: [note], activeNoteId: note.id };
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
  return {
    ...workspace,
    notes: workspace.notes.map((note) =>
      note.id === workspace.activeNoteId
        ? { ...updater(note), updatedAt: now }
        : note,
    ),
  };
}