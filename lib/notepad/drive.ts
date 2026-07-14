import { google } from "googleapis";
import { Readable } from "node:stream";
import {
  NotepadHttpError,
  logNotepad,
  serializeError,
} from "./errors.js";
import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_NAME_LENGTH,
} from "./types.js";

const SCOPE = "notepad/drive";

/** Docs, PDFs, images, audio, video, and common office types. */
const ALLOWED_MIME_PREFIXES = [
  "image/",
  "audio/",
  "video/",
  "text/",
] as const;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/zip",
  "application/x-zip-compressed",
  "application/json",
]);

type DriveUploadResult = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
};

/**
 * Vercel / dotenv often store the key with literal `\n`, wrapping quotes, or
 * `\r\n`. OpenSSL 3 rejects those with ERR_OSSL_UNSUPPORTED (DECODER).
 */
function normalizePrivateKey(raw: string): string {
  let key = raw.trim();

  // Strip one layer of wrapping quotes from dashboard / .env paste.
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  key = key
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!key.includes("BEGIN") || !key.includes("PRIVATE KEY")) {
    throw new NotepadHttpError(
      "GOOGLE_DRIVE_PRIVATE_KEY is invalid. Paste the full PEM including BEGIN/END lines (escape newlines as \\n on Vercel).",
      503,
    );
  }

  return key;
}

function getDriveCredentials() {
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();

  if (!clientEmail || !rawKey?.trim() || !folderId) {
    throw new NotepadHttpError(
      "Google Drive is not configured. Set GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY, and GOOGLE_DRIVE_FOLDER_ID.",
      503,
    );
  }

  const privateKey = normalizePrivateKey(rawKey);
  return { clientEmail, privateKey, folderId };
}

function getDriveClient() {
  const { clientEmail, privateKey } = getDriveCredentials();
  // `drive` (not `drive.file`) is required so the SA can see a folder shared with it.
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

function isAllowedAttachmentMimeType(mimeType: string): boolean {
  const type = mimeType.toLowerCase().trim();
  if (!type) return false;
  if (ALLOWED_MIME_TYPES.has(type)) return true;
  return ALLOWED_MIME_PREFIXES.some((prefix) => type.startsWith(prefix));
}

function assertValidAttachment(
  mimeType: string,
  size: number,
  filename: string,
): void {
  if (!filename.trim()) {
    throw new NotepadHttpError("Filename is required", 400);
  }
  if (!isAllowedAttachmentMimeType(mimeType)) {
    throw new NotepadHttpError(
      "Unsupported file type. Use PDF, Office docs, images, audio, video, or text.",
      400,
    );
  }
  if (size <= 0) {
    throw new NotepadHttpError("File is empty", 400);
  }
  if (size > MAX_ATTACHMENT_BYTES) {
    throw new NotepadHttpError(
      `File too large. Maximum size is ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB.`,
      400,
    );
  }
}

function driveApiReason(err: unknown): string | undefined {
  const data = (err as { response?: { data?: unknown } })?.response?.data as
    | {
        error?: {
          errors?: Array<{ reason?: string; message?: string }>;
          message?: string;
        };
      }
    | undefined;
  return data?.error?.errors?.[0]?.reason ?? undefined;
}

function mapDriveError(operation: string, err: unknown): never {
  const serialized = serializeError(err);
  const httpStatus =
    typeof serialized.httpStatus === "number" ? serialized.httpStatus : 500;
  const reason = driveApiReason(err);
  const apiMessage =
    typeof (serialized.responseData as { error?: { message?: string } })?.error
      ?.message === "string"
      ? (serialized.responseData as { error: { message: string } }).error
          .message
      : typeof serialized.message === "string"
        ? serialized.message
        : "Google Drive request failed";

  logNotepad(SCOPE, "error", `Drive ${operation} failed`, {
    operation,
    reason,
    httpStatus,
    error: serialized,
  });

  if (reason === "insufficientParentPermissions" || httpStatus === 403) {
    throw new NotepadHttpError(
      "Google Drive folder permission denied. Share the folder with the service account email as Editor (not Viewer).",
      403,
      { operation, reason, apiMessage },
    );
  }

  if (reason === "notFound" || httpStatus === 404) {
    throw new NotepadHttpError(
      "Google Drive folder or file not found. Check GOOGLE_DRIVE_FOLDER_ID and that the folder is shared with the service account.",
      404,
      { operation, reason, apiMessage },
    );
  }

  if (reason === "storageQuotaExceeded") {
    throw new NotepadHttpError(
      "Google Drive storage quota exceeded for the service account. Use a Shared Drive folder or free space.",
      507,
      { operation, reason, apiMessage },
    );
  }

  const code =
    typeof serialized.code === "string" || typeof serialized.code === "number"
      ? String(serialized.code)
      : "";
  if (
    code === "ERR_OSSL_UNSUPPORTED" ||
    apiMessage.includes("DECODER routines") ||
    apiMessage.includes("ERR_OSSL_UNSUPPORTED")
  ) {
    throw new NotepadHttpError(
      "Google Drive private key cannot be parsed. On Vercel, set GOOGLE_DRIVE_PRIVATE_KEY as one line with \\n escapes and no surrounding quotes.",
      503,
      { operation, code, apiMessage },
    );
  }

  if (httpStatus >= 400 && httpStatus < 500) {
    throw new NotepadHttpError(apiMessage, httpStatus, {
      operation,
      reason,
    });
  }

  // Avoid HTTP 502 — Cloudflare replaces origin 502 with an opaque HTML page.
  throw new NotepadHttpError(
    `Google Drive ${operation} failed. See server logs for details.`,
    500,
    { operation, reason, apiMessage },
  );
}

export async function uploadToDrive(
  data: Buffer,
  mimeType: string,
  filename: string,
): Promise<DriveUploadResult> {
  assertValidAttachment(mimeType, data.length, filename);

  const { folderId, clientEmail } = getDriveCredentials();
  const drive = getDriveClient();
  const safeName = filename.slice(0, MAX_ATTACHMENT_NAME_LENGTH);

  logNotepad(SCOPE, "info", "Uploading attachment to Drive", {
    filename: safeName,
    mimeType,
    bytes: data.length,
    folderId,
    clientEmail,
  });

  try {
    const response = await drive.files.create({
      requestBody: {
        name: safeName,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: Readable.from(data),
      },
      fields: "id, name, mimeType, size",
      supportsAllDrives: true,
    });

    const file = response.data;
    if (!file.id) {
      throw new NotepadHttpError("Drive upload failed: no file id returned", 500);
    }

    logNotepad(SCOPE, "info", "Drive upload succeeded", {
      fileId: file.id,
      filename: file.name || safeName,
      mimeType: file.mimeType || mimeType,
      bytes: Number(file.size ?? data.length),
    });

    return {
      id: file.id,
      name: file.name || filename,
      mimeType: file.mimeType || mimeType,
      size: Number(file.size ?? data.length),
    };
  } catch (err) {
    if (err instanceof NotepadHttpError) throw err;
    mapDriveError("upload", err);
  }
}

export async function deleteFromDrive(fileId: string): Promise<void> {
  const trimmed = fileId.trim();
  if (!trimmed) return;

  const drive = getDriveClient();
  logNotepad(SCOPE, "info", "Deleting Drive file", { fileId: trimmed });

  try {
    await drive.files.delete({
      fileId: trimmed,
      supportsAllDrives: true,
    });
    logNotepad(SCOPE, "info", "Drive delete succeeded", { fileId: trimmed });
  } catch (err) {
    mapDriveError("delete", err);
  }
}

export async function downloadFromDrive(fileId: string): Promise<{
  data: Buffer;
  mimeType: string;
  name: string;
}> {
  const trimmed = fileId.trim();
  if (!trimmed) {
    throw new NotepadHttpError("File id is required", 400);
  }

  const drive = getDriveClient();
  logNotepad(SCOPE, "info", "Downloading Drive file", { fileId: trimmed });

  try {
    const meta = await drive.files.get({
      fileId: trimmed,
      fields: "id, name, mimeType",
      supportsAllDrives: true,
    });

    const response = await drive.files.get(
      {
        fileId: trimmed,
        alt: "media",
        supportsAllDrives: true,
      },
      { responseType: "arraybuffer" },
    );

    const raw = response.data as ArrayBuffer | Buffer | string;
    const data = Buffer.isBuffer(raw)
      ? raw
      : Buffer.from(raw as ArrayBuffer);

    logNotepad(SCOPE, "info", "Drive download succeeded", {
      fileId: trimmed,
      filename: meta.data.name || "attachment",
      mimeType: meta.data.mimeType || "application/octet-stream",
      bytes: data.length,
    });

    return {
      data,
      mimeType: meta.data.mimeType || "application/octet-stream",
      name: meta.data.name || "attachment",
    };
  } catch (err) {
    if (err instanceof NotepadHttpError) throw err;
    mapDriveError("download", err);
  }
}

export function isDriveConfigured(): boolean {
  try {
    getDriveCredentials();
    return true;
  } catch {
    return false;
  }
}
