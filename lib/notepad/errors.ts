/** HTTP-aware error for notepad API handlers. */
export class NotepadHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "NotepadHttpError";
    this.status = status;
  }
}

export function isNotepadHttpError(err: unknown): err is NotepadHttpError {
  return err instanceof NotepadHttpError;
}
