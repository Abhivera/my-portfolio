import { randomUUID } from "node:crypto";
import { getDb } from "./db.js";
import {
  MAX_COLLECTIONS,
  MAX_CONTENT_LENGTH,
  MAX_INK_DATA_LENGTH,
  MAX_NOTES,
  MAX_TITLE_LENGTH,
  WORKSPACE_ID,
  normalizeNoteType,
  type LegacyNotepadDoc,
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

function defaultWorkspace(): NotepadWorkspaceData {
  const now = new Date().toISOString();
  const note: NotepadNote = {
    id: randomUUID(),
    title: "Untitled",
    noteType: "canvas",
    content: "",
    collectionId: null,
    createdAt: now,
    updatedAt: now,
  };
  return { notes: [note], collections: [], activeNoteId: note.id };
}

function migrateLegacyDoc(doc: Omit<LegacyNotepadDoc, "_id">): NotepadWorkspaceData {
  const now = doc.updatedAt?.toISOString() ?? new Date().toISOString();
  const note: NotepadNote = {
    id: randomUUID(),
    title: "Untitled",
    noteType: "markdown",
    content: doc.content ?? "",
    collectionId: null,
    createdAt: now,
    updatedAt: now,
  };
  return { notes: [note], collections: [], activeNoteId: note.id };
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
    const updatedAt = new Date();
    await collection.updateOne(
      { _id: WORKSPACE_ID },
      {
        $set: {
          _id: WORKSPACE_ID,
          notes: migrated.notes,
          collections: migrated.collections ?? [],
          activeNoteId: migrated.activeNoteId,
          updatedAt,
        },
      },
      { upsert: true },
    );
    return { ...migrated, updatedAt: updatedAt.toISOString() };
  }

  const fresh = defaultWorkspace();
  return { ...fresh, updatedAt: null };
}

export async function saveNotepadWorkspace(data: NotepadWorkspaceData): Promise<string> {
  const sanitized = sanitizeWorkspace(data);
  const db = await getDb();
  const updatedAt = new Date();

  await db.collection<NotepadWorkspaceDoc>("notepad").updateOne(
    { _id: WORKSPACE_ID },
    {
      $set: {
        _id: WORKSPACE_ID,
        notes: sanitized.notes,
        collections: sanitized.collections ?? [],
        activeNoteId: sanitized.activeNoteId,
        updatedAt,
      },
    },
    { upsert: true },
  );

  return updatedAt.toISOString();
}
