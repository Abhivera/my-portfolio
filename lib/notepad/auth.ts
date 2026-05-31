import { createHash, timingSafeEqual } from "node:crypto";
import { getDb } from "./db.js";

const NOTEPAD_ID = "shared" as const;

export type NotepadDoc = {
  _id: typeof NOTEPAD_ID;
  content: string;
  updatedAt: Date;
};

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function verifyPassword(input: string, expectedPlain: string): boolean {
  const inputHash = hashPassword(input);
  const expectedHash = hashPassword(expectedPlain);
  const a = Buffer.from(inputHash, "utf8");
  const b = Buffer.from(expectedHash, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function getConfiguredPassword(): string {
  const password = process.env.NOTEPAD_PASSWORD?.trim();
  if (!password) {
    throw new Error(
      "NOTEPAD_PASSWORD is not set. Add it in Vercel → Settings → Environment Variables.",
    );
  }
  return password;
}

export function checkPassword(password: string): boolean {
  const configured = getConfiguredPassword();
  return verifyPassword(password.trim(), configured);
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
