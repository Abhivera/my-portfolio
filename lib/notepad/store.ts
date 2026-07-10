import { randomUUID } from "node:crypto";
import { getDb } from "./db.js";
import {
  MAX_CONTENT_LENGTH,
  MAX_INK_DATA_LENGTH,
  MAX_NOTES,
  MAX_TITLE_LENGTH,
  WORKSPACE_ID,
  type LegacyNotepadDoc,
  type NotepadNote,
  type NotepadWorkspaceData,
  type NotepadWorkspaceDoc,
} from "./types.js";

function sanitizeNote(note: NotepadNote): NotepadNote {
  const inkData = note.inkData?.trim();
  return {
    id: note.id.slice(0, 64),
    title: note.title.slice(0, MAX_TITLE_LENGTH),
    content: note.content.slice(0, MAX_CONTENT_LENGTH),
    inkData: inkData ? inkData.slice(0, MAX_INK_DATA_LENGTH) : undefined,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

export function sanitizeWorkspace(data: NotepadWorkspaceData): NotepadWorkspaceData {
  const notes = data.notes.slice(0, MAX_NOTES).map(sanitizeNote);
  const activeNoteId = notes.some((n) => n.id === data.activeNoteId)
    ? data.activeNoteId
    : (notes[0]?.id ?? data.activeNoteId);

  return { notes, activeNoteId };
}

function defaultWorkspace(): NotepadWorkspaceData {
  const now = new Date().toISOString();
  const note: NotepadNote = {
    id: randomUUID(),
    title: "Untitled",
    content: "",
    createdAt: now,
    updatedAt: now,
  };
  return { notes: [note], activeNoteId: note.id };
}

function migrateLegacyDoc(doc: Omit<LegacyNotepadDoc, "_id">): NotepadWorkspaceData {
  const now = doc.updatedAt?.toISOString() ?? new Date().toISOString();
  const note: NotepadNote = {
    id: randomUUID(),
    title: "Untitled",
    content: doc.content ?? "",
    createdAt: now,
    updatedAt: now,
  };
  return { notes: [note], activeNoteId: note.id };
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
        activeNoteId: sanitized.activeNoteId,
        updatedAt,
      },
    },
    { upsert: true },
  );

  return updatedAt.toISOString();
}
