import { google } from "googleapis";
import { Readable } from "node:stream";
import { NotepadHttpError } from "./errors.js";
import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_NAME_LENGTH,
} from "./types.js";

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

function getDriveCredentials() {
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();

  if (!clientEmail || !privateKey || !folderId) {
    throw new NotepadHttpError(
      "Google Drive is not configured. Set GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY, and GOOGLE_DRIVE_FOLDER_ID.",
      503,
    );
  }

  return { clientEmail, privateKey, folderId };
}

function getDriveClient() {
  const { clientEmail, privateKey } = getDriveCredentials();
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
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

export async function uploadToDrive(
  data: Buffer,
  mimeType: string,
  filename: string,
): Promise<DriveUploadResult> {
  assertValidAttachment(mimeType, data.length, filename);

  const { folderId } = getDriveCredentials();
  const drive = getDriveClient();

  const response = await drive.files.create({
    requestBody: {
      name: filename.slice(0, MAX_ATTACHMENT_NAME_LENGTH),
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
    throw new Error("Drive upload failed: no file id returned");
  }

  return {
    id: file.id,
    name: file.name || filename,
    mimeType: file.mimeType || mimeType,
    size: Number(file.size ?? data.length),
  };
}

export async function deleteFromDrive(fileId: string): Promise<void> {
  const trimmed = fileId.trim();
  if (!trimmed) return;

  const drive = getDriveClient();
  await drive.files.delete({
    fileId: trimmed,
    supportsAllDrives: true,
  });
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

  return {
    data,
    mimeType: meta.data.mimeType || "application/octet-stream",
    name: meta.data.name || "attachment",
  };
}

export function isDriveConfigured(): boolean {
  try {
    getDriveCredentials();
    return true;
  } catch {
    return false;
  }
}
