// Seeds the notepad workspace (MongoDB) with the bundled practice-guide notes.
//
// Usage:
//   MONGODB_URI="mongodb+srv://..." node scripts/seed-notepad.mjs
// or, if you keep a .env file in my-portfolio/, just:
//   node scripts/seed-notepad.mjs
//
// It appends any seed note that isn't already present (matched by id) to the
// existing workspace, so it's safe to re-run.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const WORKSPACE_ID = "workspace";
const MAX_NOTES = 50;
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 500_000;

function loadDotEnv() {
  if (process.env.MONGODB_URI) return;
  try {
    const raw = readFileSync(resolve(projectRoot, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // no .env file — rely on real env vars
  }
}

function sanitizeNote(note) {
  return {
    id: String(note.id).slice(0, 64),
    title: String(note.title).slice(0, MAX_TITLE_LENGTH),
    content: String(note.content).slice(0, MAX_CONTENT_LENGTH),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

async function main() {
  loadDotEnv();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      "MONGODB_URI is not set. Set it in your environment or in my-portfolio/.env",
    );
    process.exit(1);
  }
  const dbName = process.env.MONGODB_DB_NAME ?? "portfolio";

  const seedNotes = JSON.parse(
    readFileSync(resolve(__dirname, "notepad-seed.json"), "utf8"),
  ).map(sanitizeNote);

  const client = new MongoClient(uri, { maxPoolSize: 10 });
  await client.connect();

  try {
    const collection = client.db(dbName).collection("notepad");
    const existing = await collection.findOne({ _id: WORKSPACE_ID });

    const currentNotes =
      existing && Array.isArray(existing.notes) ? existing.notes : [];
    const existingIds = new Set(currentNotes.map((n) => n.id));

    const toAdd = seedNotes.filter((n) => !existingIds.has(n.id));
    if (toAdd.length === 0) {
      console.log("All seed notes already present. Nothing to do.");
      return;
    }

    const notes = [...currentNotes, ...toAdd].slice(0, MAX_NOTES);
    const activeNoteId =
      existing?.activeNoteId && notes.some((n) => n.id === existing.activeNoteId)
        ? existing.activeNoteId
        : notes[0].id;
    const updatedAt = new Date();

    await collection.updateOne(
      { _id: WORKSPACE_ID },
      { $set: { _id: WORKSPACE_ID, notes, activeNoteId, updatedAt } },
      { upsert: true },
    );

    console.log(
      `Added ${toAdd.length} note(s): ${toAdd.map((n) => `"${n.title}"`).join(", ")}`,
    );
    console.log(`Workspace now has ${notes.length} note(s).`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
