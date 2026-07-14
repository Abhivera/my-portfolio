/** HTTP-aware error for notepad API handlers. */
export class NotepadHttpError extends Error {
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "NotepadHttpError";
    this.status = status;
    this.details = details;
  }
}

export function isNotepadHttpError(err: unknown): err is NotepadHttpError {
  return err instanceof NotepadHttpError;
}

/** Flatten Errors / Google Gaxios payloads into JSON-safe log fields. */
export function serializeError(err: unknown): Record<string, unknown> {
  if (err == null) return { message: String(err) };

  if (typeof err !== "object") {
    return { message: String(err) };
  }

  const anyErr = err as Record<string, unknown> & {
    message?: string;
    name?: string;
    stack?: string;
    code?: string | number;
    status?: number;
    details?: Record<string, unknown>;
    errors?: unknown;
    cause?: unknown;
    response?: { status?: number; statusText?: string; data?: unknown };
  };

  const serialized: Record<string, unknown> = {
    name: anyErr.name ?? typeof err,
    message: anyErr.message ?? String(err),
  };

  if (anyErr.code != null) serialized.code = anyErr.code;
  if (anyErr.status != null) serialized.status = anyErr.status;
  if (anyErr.details) serialized.details = anyErr.details;
  if (anyErr.errors) serialized.errors = anyErr.errors;
  if (anyErr.stack) serialized.stack = anyErr.stack;

  const response = anyErr.response;
  if (response) {
    serialized.httpStatus = response.status;
    serialized.httpStatusText = response.statusText;
    serialized.responseData = response.data;
  }

  if (anyErr.cause != null) {
    serialized.cause = serializeError(anyErr.cause);
  }

  return serialized;
}

export function logNotepad(
  scope: string,
  level: "info" | "warn" | "error",
  message: string,
  fields?: Record<string, unknown>,
): void {
  const payload = {
    scope,
    message,
    ...fields,
    ts: new Date().toISOString(),
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
