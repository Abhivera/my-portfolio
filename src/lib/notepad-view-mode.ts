import { isTouchTablet } from "@/lib/stylus-utils";

export type NotepadViewMode = "edit" | "write" | "preview";

const STORAGE_KEY = "notepad-view-mode";

export function getInitialNotepadViewMode(): NotepadViewMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "edit" || saved === "write" || saved === "preview") {
      return saved;
    }
  } catch {
    // localStorage may be unavailable in private browsing.
  }

  if (typeof window !== "undefined" && isTouchTablet()) {
    return "write";
  }

  return "edit";
}

export function persistNotepadViewMode(mode: NotepadViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Ignore storage failures.
  }
}
