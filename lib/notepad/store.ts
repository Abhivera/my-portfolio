import { randomUUID } from "node:crypto";
import { getDb } from "./db.js";
import { deleteFromDrive, isDriveConfigured } from "./drive.js";
import { NotepadHttpError } from "./errors.js";
import {
  MAX_ATTACHMENT_NAME_LENGTH,
  MAX_ATTACHMENTS_PER_NOTE,
  MAX_COLLECTIONS,
  MAX_CONTENT_LENGTH,
  MAX_INK_DATA_LENGTH,
  MAX_NOTES,
  MAX_TITLE_LENGTH,
  WORKSPACE_ID,
  normalizeNoteType,
  type LegacyNotepadDoc,
  type NotepadAttachment,
  type NotepadCollection,
  type NotepadNote,
  type NotepadWorkspaceData,
  type NotepadWorkspaceDoc,
} from "./types.js";

function sanitizeCollection(collection: NotepadCollection): NotepadCollection {
  return {
    id: collection.id.slice(0, 64),
    title: (collection.title || "Untitled").slice(0, MAX_TITLE_LENGTH),
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
  };
}

function sanitizeAttachment(
  attachment: NotepadAttachment,
): NotepadAttachment | null {
  const id = typeof attachment.id === "string" ? attachment.id.trim() : "";
  const name =
    typeof attachment.name === "string" ? attachment.name.trim() : "";
  if (!id || !name) return null;

  const mimeType =
    typeof attachment.mimeType === "string" && attachment.mimeType.trim()
      ? attachment.mimeType.trim().slice(0, 128)
      : "application/octet-stream";
  const size =
    typeof attachment.size === "number" && Number.isFinite(attachment.size)
      ? Math.max(0, Math.floor(attachment.size))
      : 0;
  const createdAt =
    typeof attachment.createdAt === "string" && attachment.createdAt.trim()
      ? attachment.createdAt
      : new Date().toISOString();

  return {
    id: id.slice(0, 128),
    name: name.slice(0, MAX_ATTACHMENT_NAME_LENGTH),
    mimeType,
    size,
    createdAt,
  };
}

function sanitizeNote(
  note: NotepadNote,
  collectionIds: Set<string>,
): NotepadNote {
  const noteType = normalizeNoteType(note);
  const inkData = note.inkData?.trim();
  const collectionId =
    note.collectionId && collectionIds.has(note.collectionId)
      ? note.collectionId
      : null;

  const shareToken =
    typeof note.shareToken === "string" && note.shareToken.trim()
      ? note.shareToken.trim().slice(0, 64)
      : null;

  const attachments = Array.isArray(note.attachments)
    ? note.attachments
        .slice(0, MAX_ATTACHMENTS_PER_NOTE)
        .map(sanitizeAttachment)
        .filter((a): a is NotepadAttachment => a !== null)
    : [];

  // Keep canvas and text notes separate: only store the fields each type uses.
  return {
    id: note.id.slice(0, 64),
    title: note.title.slice(0, MAX_TITLE_LENGTH),
    noteType,
    content:
      noteType === "markdown"
        ? note.content.slice(0, MAX_CONTENT_LENGTH)
        : "",
    inkData:
      noteType === "canvas" && inkData
        ? inkData.slice(0, MAX_INK_DATA_LENGTH)
        : undefined,
    collectionId,
    shareToken,
    attachments,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

export function sanitizeWorkspace(data: NotepadWorkspaceData): NotepadWorkspaceData {
  const collections = (data.collections ?? [])
    .slice(0, MAX_COLLECTIONS)
    .map(sanitizeCollection);
  const collectionIds = new Set(collections.map((c) => c.id));
  const notes = data.notes.slice(0, MAX_NOTES).map((note) =>
    sanitizeNote(note, collectionIds),
  );
  const activeNoteId = notes.some((n) => n.id === data.activeNoteId)
    ? data.activeNoteId
    : (notes[0]?.id ?? data.activeNoteId);

  return { notes, collections, activeNoteId };
}

function defaultNote(
  overrides: Partial<NotepadNote> & Pick<NotepadNote, "noteType" | "content">,
): NotepadNote {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    title: "Untitled",
    collectionId: null,
    attachments: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function defaultWorkspace(): NotepadWorkspaceData {
  const note = defaultNote({ noteType: "canvas", content: "" });
  return { notes: [note], collections: [], activeNoteId: note.id };
}

function migrateLegacyDoc(doc: Omit<LegacyNotepadDoc, "_id">): NotepadWorkspaceData {
  const now = doc.updatedAt?.toISOString() ?? new Date().toISOString();
  const note = defaultNote({
    noteType: "markdown",
    content: doc.content ?? "",
    createdAt: now,
    updatedAt: now,
  });
  return { notes: [note], collections: [], activeNoteId: note.id };
}

async function persistWorkspace(
  data: NotepadWorkspaceData,
): Promise<string> {
  const db = await getDb();
  const updatedAt = new Date();
  await db.collection<NotepadWorkspaceDoc>("notepad").updateOne(
    { _id: WORKSPACE_ID },
    {
      $set: {
        _id: WORKSPACE_ID,
        notes: data.notes,
        collections: data.collections ?? [],
        activeNoteId: data.activeNoteId,
        updatedAt,
      },
    },
    { upsert: true },
  );
  return updatedAt.toISOString();
}

async function cleanupOrphanedDriveFiles(
  removed: NotepadAttachment[],
): Promise<void> {
  if (!removed.length || !isDriveConfigured()) return;
  await Promise.allSettled(removed.map((a) => deleteFromDrive(a.id)));
}

export async function getNotepadWorkspace(): Promise<
  NotepadWorkspaceData & { updatedAt: string | null }
> {
  const db = await getDb();
  const collection = db.collection<NotepadWorkspaceDoc | LegacyNotepadDoc>("notepad");

  const workspaceDoc = await collection.findOne({ _id: WORKSPACE_ID });
  if (workspaceDoc && "notes" in workspaceDoc) {
    const data = sanitizeWorkspace({
      notes: workspaceDoc.notes,
      collections: workspaceDoc.collections ?? [],
      activeNoteId: workspaceDoc.activeNoteId,
    });
    return {
      ...data,
      updatedAt: workspaceDoc.updatedAt?.toISOString() ?? null,
    };
  }

  const legacyDoc = await collection.findOne({ _id: "shared" });
  if (legacyDoc && "content" in legacyDoc) {
    const migrated = migrateLegacyDoc(legacyDoc);
    const updatedAt = await persistWorkspace(migrated);
    return { ...migrated, updatedAt };
  }

  const fresh = defaultWorkspace();
  return { ...fresh, updatedAt: null };
}

export async function saveNotepadWorkspace(data: NotepadWorkspaceData): Promise<string> {
  const sanitized = sanitizeWorkspace(data);
  const db = await getDb();

  // Share tokens and attachments are owned by their APIs — never let workspace autosave wipe them.
  const existing = await db.collection<NotepadWorkspaceDoc>("notepad").findOne({
    _id: WORKSPACE_ID,
  });

  const orphanedAttachments: NotepadAttachment[] = [];

  if (existing?.notes?.length) {
    const keptIds = new Set(sanitized.notes.map((n) => n.id));
    for (const note of existing.notes) {
      if (!keptIds.has(note.id)) {
        orphanedAttachments.push(...(note.attachments ?? []));
      }
    }

    const tokenById = new Map(
      existing.notes.map((n) => [
        n.id,
        typeof n.shareToken === "string" && n.shareToken.trim()
          ? n.shareToken.trim()
          : null,
      ]),
    );
    const attachmentsById = new Map(
      existing.notes.map((n) => [n.id, n.attachments ?? []]),
    );
    for (const note of sanitized.notes) {
      note.shareToken = tokenById.get(note.id) ?? null;
      note.attachments = attachmentsById.get(note.id) ?? note.attachments ?? [];
    }
  } else {
    for (const note of sanitized.notes) {
      note.shareToken = note.shareToken ?? null;
      note.attachments = note.attachments ?? [];
    }
  }

  const updatedAt = await persistWorkspace(sanitized);
  void cleanupOrphanedDriveFiles(orphanedAttachments);
  return updatedAt;
}

export async function findNoteByShareToken(
  token: string,
): Promise<NotepadNote | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const workspace = await getNotepadWorkspace();
  return workspace.notes.find((n) => n.shareToken === trimmed) ?? null;
}

export async function setNoteShareToken(
  noteId: string,
  shareToken: string | null,
): Promise<{ note: NotepadNote; shareToken: string | null } | null> {
  const workspace = await getNotepadWorkspace();
  const index = workspace.notes.findIndex((n) => n.id === noteId);
  if (index < 0) return null;

  const now = new Date().toISOString();
  const sanitized = sanitizeWorkspace({
    notes: workspace.notes.map((note, i) =>
      i === index ? { ...note, shareToken, updatedAt: now } : note,
    ),
    collections: workspace.collections ?? [],
    activeNoteId: workspace.activeNoteId,
  });
  // sanitize may null empty tokens; force the intended value on the target note.
  sanitized.notes[index] = {
    ...sanitized.notes[index],
    shareToken,
    updatedAt: now,
  };

  await persistWorkspace(sanitized);
  return { note: sanitized.notes[index], shareToken };
}

export async function addNoteAttachment(
  noteId: string,
  attachment: NotepadAttachment,
): Promise<{ note: NotepadNote; attachment: NotepadAttachment } | null> {
  const workspace = await getNotepadWorkspace();
  const index = workspace.notes.findIndex((n) => n.id === noteId);
  if (index < 0) return null;

  const existing = workspace.notes[index].attachments ?? [];
  if (existing.length >= MAX_ATTACHMENTS_PER_NOTE) {
    throw new NotepadHttpError(
      `Maximum of ${MAX_ATTACHMENTS_PER_NOTE} attachments per note.`,
      400,
    );
  }
  if (existing.some((a) => a.id === attachment.id)) {
    return { note: workspace.notes[index], attachment };
  }

  const now = new Date().toISOString();
  const sanitized = sanitizeWorkspace({
    notes: workspace.notes.map((note, i) =>
      i === index
        ? { ...note, attachments: [...existing, attachment], updatedAt: now }
        : note,
    ),
    collections: workspace.collections ?? [],
    activeNoteId: workspace.activeNoteId,
  });

  await persistWorkspace(sanitized);

  return {
    note: sanitized.notes[index],
    attachment:
      sanitized.notes[index].attachments?.find((a) => a.id === attachment.id) ??
      attachment,
  };
}

export async function removeNoteAttachment(
  noteId: string,
  attachmentId: string,
): Promise<{ note: NotepadNote; removed: NotepadAttachment | null } | null> {
  const workspace = await getNotepadWorkspace();
  const index = workspace.notes.findIndex((n) => n.id === noteId);
  if (index < 0) return null;

  const trimmedId = attachmentId.trim();
  const existing = workspace.notes[index].attachments ?? [];
  const removed = existing.find((a) => a.id === trimmedId) ?? null;
  if (!removed) {
    return { note: workspace.notes[index], removed: null };
  }

  const now = new Date().toISOString();
  const sanitized = sanitizeWorkspace({
    notes: workspace.notes.map((note, i) =>
      i === index
        ? {
            ...note,
            attachments: existing.filter((a) => a.id !== trimmedId),
            updatedAt: now,
          }
        : note,
    ),
    collections: workspace.collections ?? [],
    activeNoteId: workspace.activeNoteId,
  });

  await persistWorkspace(sanitized);
  return { note: sanitized.notes[index], removed };
}
