export type HandwritingMode = "keep" | "toText";

const STORAGE_KEY = "notepad-handwriting-mode";

export function getInitialHandwritingMode(): HandwritingMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "keep" || saved === "toText") {
      return saved;
    }
  } catch {
    // localStorage may be unavailable in private browsing.
  }
  return "keep";
}

export function persistHandwritingMode(mode: HandwritingMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Ignore storage failures.
  }
}
