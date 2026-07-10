export type NotepadViewMode = "compose" | "preview";

const STORAGE_KEY = "notepad-view-mode";

function normalizeViewMode(saved: string | null): NotepadViewMode | null {
  if (saved === "compose" || saved === "preview") return saved;
  // Migrate legacy modes from before unified composer.
  if (saved === "edit" || saved === "write") return "compose";
  return null;
}

export function getInitialNotepadViewMode(): NotepadViewMode {
  try {
    const saved = normalizeViewMode(localStorage.getItem(STORAGE_KEY));
    if (saved) return saved;
  } catch {
    // localStorage may be unavailable in private browsing.
  }
  return "compose";
}

export function persistNotepadViewMode(mode: NotepadViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Ignore storage failures.
  }
}
