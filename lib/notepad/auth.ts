import { createHash, timingSafeEqual } from "node:crypto";
import { getDb } from "./db.js";

const NOTEPAD_ID = "shared" as const;

export type NotepadDoc = {
  _id: typeof NOTEPAD_ID;
  content: string;
  updatedAt: Date;
};

type NotepadSettingsDoc = {
  _id: "auth";
  passwordHash: string;
};

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function verifyPassword(input: string, storedHash: string): boolean {
  const inputHash = hashPassword(input);
  const a = Buffer.from(inputHash, "utf8");
  const b = Buffer.from(storedHash, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function getOrCreatePasswordHash(): Promise<string> {
  const db = await getDb();
  const settings = await db
    .collection<NotepadSettingsDoc>("notepad_settings")
    .findOne({ _id: "auth" });

  if (settings?.passwordHash) {
    return settings.passwordHash;
  }

  const envPassword = process.env.NOTEPAD_PASSWORD;
  if (!envPassword) {
    throw new Error(
      "Notepad password not configured. Set NOTEPAD_PASSWORD in environment.",
    );
  }

  const passwordHash = hashPassword(envPassword);
  await db.collection<NotepadSettingsDoc>("notepad_settings").updateOne(
    { _id: "auth" },
    { $set: { _id: "auth", passwordHash } },
    { upsert: true },
  );
  return passwordHash;
}

export async function checkPassword(password: string): Promise<boolean> {
  const storedHash = await getOrCreatePasswordHash();
  return verifyPassword(password, storedHash);
}

export async function getNotepadContent(): Promise<{
  content: string;
  updatedAt: string | null;
}> {
  const db = await getDb();
  const doc = await db
    .collection<NotepadDoc>("notepad")
    .findOne({ _id: NOTEPAD_ID });

  return {
    content: doc?.content ?? "",
    updatedAt: doc?.updatedAt?.toISOString() ?? null,
  };
}

export async function saveNotepadContent(content: string): Promise<string> {
  const db = await getDb();
  const updatedAt = new Date();

  await db.collection<NotepadDoc>("notepad").updateOne(
    { _id: NOTEPAD_ID },
    { $set: { _id: NOTEPAD_ID, content, updatedAt } },
    { upsert: true },
  );

  return updatedAt.toISOString();
}
