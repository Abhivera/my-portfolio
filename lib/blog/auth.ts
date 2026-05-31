import { createHash, timingSafeEqual } from "node:crypto";
import { getDb } from "../notepad/db.js";

type BlogSettingsDoc = {
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

export async function getOrCreateBlogPasswordHash(): Promise<string> {
  const db = await getDb();
  const settings = await db
    .collection<BlogSettingsDoc>("blog_settings")
    .findOne({ _id: "auth" });

  if (settings?.passwordHash) {
    return settings.passwordHash;
  }

  const envPassword = process.env.BLOG_PASSWORD;
  if (!envPassword) {
    throw new Error(
      "Blog password not configured. Set BLOG_PASSWORD in environment.",
    );
  }

  const passwordHash = hashPassword(envPassword);
  await db.collection<BlogSettingsDoc>("blog_settings").updateOne(
    { _id: "auth" },
    { $set: { _id: "auth", passwordHash } },
    { upsert: true },
  );
  return passwordHash;
}

export async function checkBlogPassword(password: string): Promise<boolean> {
  const storedHash = await getOrCreateBlogPasswordHash();
  return verifyPassword(password, storedHash);
}
