import { ObjectId } from "mongodb";
import { getDb } from "../notepad/db.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export type BlogImageDoc = {
  _id: ObjectId;
  data: Buffer;
  contentType: string;
  filename: string;
  createdAt: Date;
};

export function imageUrl(id: string): string {
  return `/api/blog/images?id=${encodeURIComponent(id)}`;
}

export async function saveBlogImage(
  data: Buffer,
  contentType: string,
  filename: string,
): Promise<string> {
  if (!ALLOWED_TYPES.has(contentType)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, GIF, or WebP.");
  }
  if (data.length > MAX_IMAGE_BYTES) {
    throw new Error("Image too large. Maximum size is 5 MB.");
  }

  const db = await getDb();
  const doc: Omit<BlogImageDoc, "_id"> = {
    data,
    contentType,
    filename,
    createdAt: new Date(),
  };
  const result = await db
    .collection<Omit<BlogImageDoc, "_id">>("blog_images")
    .insertOne(doc);
  return result.insertedId.toString();
}

export async function getBlogImage(
  id: string,
): Promise<{ data: Buffer; contentType: string } | null> {
  if (!ObjectId.isValid(id)) return null;

  const db = await getDb();
  const doc = await db.collection<BlogImageDoc>("blog_images").findOne({
    _id: new ObjectId(id),
  });

  if (!doc) return null;
  return { data: doc.data, contentType: doc.contentType };
}

export async function deleteBlogImage(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;

  const db = await getDb();
  const result = await db.collection<BlogImageDoc>("blog_images").deleteOne({
    _id: new ObjectId(id),
  });
  return result.deletedCount === 1;
}
