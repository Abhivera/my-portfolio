import { ObjectId } from "mongodb";
import { getDb } from "../notepad/db.js";
import { imageUrl } from "./images.js";

export type BlogPostDoc = {
  _id: ObjectId;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageId?: string;
  date: Date;
  readTime: number;
  tags: string[];
  featured?: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BlogPostPublic = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string;
  date: string;
  readTime: number;
  tags: string[];
  featured?: boolean;
};

export type BlogPostAdmin = BlogPostPublic & {
  published: boolean;
  coverImageId?: string;
  updatedAt: string;
};

export type BlogPostInput = {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  coverImageId?: string;
  date?: string;
  readTime?: number;
  tags?: string[];
  featured?: boolean;
  published?: boolean;
};

const SEED_POSTS: Omit<
  BlogPostDoc,
  "_id" | "createdAt" | "updatedAt" | "coverImageId"
>[] = [
  {
    slug: "building-rag-pipelines-production",
    title: "Building RAG Pipelines for Production: Lessons Learned",
    excerpt:
      "After shipping multiple Retrieval-Augmented Generation systems to production, here's what actually matters — chunking strategies, embedding model selection, and the retrieval pitfalls nobody talks about.",
    date: new Date("2026-05-15"),
    readTime: 8,
    tags: ["AI", "RAG", "LLM", "Python", "FastAPI"],
    featured: true,
    published: true,
    content: `<h2>Why RAG in Production Is Hard</h2>
<p>Retrieval-Augmented Generation sounds straightforward on paper: embed your documents, store them in a vector database, retrieve the top-k chunks at query time, and pass them to an LLM. In practice, each of those steps has sharp edges that only reveal themselves under real load with real user queries.</p>
<h2>Chunking Strategy Is Everything</h2>
<p>The single biggest lever you have over retrieval quality is how you split your documents. Fixed-size chunks (e.g. 512 tokens) are easy to implement but brutal for structured content like documentation or contracts where a concept spans multiple paragraphs.</p>`,
  },
  {
    slug: "event-driven-microservices-kafka",
    title: "Event-Driven Microservices with Kafka: A Practical Guide",
    excerpt:
      "Three years of running Kafka in production across multiple services. Here's the architecture that scales, the anti-patterns that bite, and the operational setup that keeps things sane.",
    date: new Date("2026-04-28"),
    readTime: 10,
    tags: ["Kafka", "Microservices", "Backend", "Architecture"],
    featured: true,
    published: true,
    content: `<h2>Why Event-Driven?</h2>
<p>Synchronous REST calls between services work until they don't. When service B is slow, service A degrades. When service B goes down, service A fails. Event-driven architecture decouples producers from consumers.</p>`,
  },
  {
    slug: "fastapi-at-scale",
    title: "FastAPI at Scale: Patterns I Wish I Knew Earlier",
    excerpt:
      "FastAPI makes the happy path trivially easy. Here are the patterns that separate a weekend project from a production service.",
    date: new Date("2026-04-10"),
    readTime: 7,
    tags: ["FastAPI", "Python", "Backend", "API"],
    published: true,
    content: `<h2>Dependency Injection Is Your Architecture</h2>
<p>FastAPI's dependency injection system isn't a nice-to-have — it's where you put your architecture.</p>`,
  },
  {
    slug: "ai-agents-tool-calling",
    title: "Practical AI Agents: Tool Calling That Actually Works",
    excerpt:
      "Building AI agents that reliably use tools is harder than the demos suggest. Here's what I learned shipping a voice customer-support agent with multi-step tool calls to production.",
    date: new Date("2026-03-22"),
    readTime: 9,
    tags: ["AI", "LLM", "Agents", "TypeScript", "Anthropic"],
    published: true,
    content: `<h2>The Gap Between Demo and Production</h2>
<p>Every LLM provider has a shiny tool-calling demo. In production, you deal with the model calling the wrong tool, calling it with invalid parameters, getting stuck in loops, or hallucinating results when a tool returns an empty response.</p>`,
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function estimateReadTime(content: string): number {
  const text = content.replace(/<[^>]+>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function toPublic(doc: BlogPostDoc): BlogPostPublic {
  return {
    id: doc._id.toString(),
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt,
    content: doc.content,
    coverImageUrl: doc.coverImageId ? imageUrl(doc.coverImageId) : undefined,
    date: doc.date.toISOString().slice(0, 10),
    readTime: doc.readTime,
    tags: doc.tags,
    featured: doc.featured,
  };
}

function toAdmin(doc: BlogPostDoc): BlogPostAdmin {
  return {
    ...toPublic(doc),
    published: doc.published,
    coverImageId: doc.coverImageId,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

async function ensureIndexes(): Promise<void> {
  const db = await getDb();
  await db.collection("blog_posts").createIndex({ slug: 1 }, { unique: true });
  await db.collection("blog_posts").createIndex({ published: 1, date: -1 });
}

export async function seedBlogPostsIfEmpty(): Promise<void> {
  await ensureIndexes();
  const db = await getDb();
  const count = await db.collection("blog_posts").countDocuments();
  if (count > 0) return;

  const now = new Date();
  await db.collection("blog_posts").insertMany(
    SEED_POSTS.map((post) => ({
      ...post,
      createdAt: now,
      updatedAt: now,
    })),
  );
}

export async function listPublishedPosts(): Promise<BlogPostPublic[]> {
  await seedBlogPostsIfEmpty();
  const db = await getDb();
  const docs = await db
    .collection<BlogPostDoc>("blog_posts")
    .find({ published: true })
    .sort({ date: -1 })
    .toArray();
  return docs.map(toPublic);
}

export async function getPublishedPostBySlug(
  slug: string,
): Promise<BlogPostPublic | null> {
  await seedBlogPostsIfEmpty();
  const db = await getDb();
  const doc = await db.collection<BlogPostDoc>("blog_posts").findOne({
    slug,
    published: true,
  });
  return doc ? toPublic(doc) : null;
}

export async function listAllPosts(): Promise<BlogPostAdmin[]> {
  await seedBlogPostsIfEmpty();
  const db = await getDb();
  const docs = await db
    .collection<BlogPostDoc>("blog_posts")
    .find({})
    .sort({ date: -1 })
    .toArray();
  return docs.map(toAdmin);
}

export async function getPostById(id: string): Promise<BlogPostAdmin | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const doc = await db.collection<BlogPostDoc>("blog_posts").findOne({
    _id: new ObjectId(id),
  });
  return doc ? toAdmin(doc) : null;
}

async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  const db = await getDb();
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.collection<BlogPostDoc>("blog_posts").findOne({
      slug,
      ...(excludeId ? { _id: { $ne: new ObjectId(excludeId) } } : {}),
    });
    if (!existing) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
}

export async function createBlogPost(input: BlogPostInput): Promise<BlogPostAdmin> {
  await ensureIndexes();
  const db = await getDb();
  const now = new Date();
  const baseSlug = slugify(input.slug?.trim() || input.title);
  const slug = await ensureUniqueSlug(baseSlug);

  const doc: Omit<BlogPostDoc, "_id"> = {
    slug,
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    content: input.content,
    coverImageId: input.coverImageId,
    date: input.date ? new Date(input.date) : now,
    readTime: input.readTime ?? estimateReadTime(input.content),
    tags: input.tags ?? [],
    featured: input.featured ?? false,
    published: input.published ?? false,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection<Omit<BlogPostDoc, "_id">>("blog_posts").insertOne(doc);
  return toAdmin({ _id: result.insertedId, ...doc });
}

export async function updateBlogPost(
  id: string,
  input: BlogPostInput,
): Promise<BlogPostAdmin | null> {
  if (!ObjectId.isValid(id)) return null;

  const db = await getDb();
  const existing = await db.collection<BlogPostDoc>("blog_posts").findOne({
    _id: new ObjectId(id),
  });
  if (!existing) return null;

  const baseSlug = slugify(input.slug?.trim() || input.title);
  const slug = await ensureUniqueSlug(baseSlug, id);
  const updatedAt = new Date();

  const update: Partial<BlogPostDoc> = {
    slug,
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    content: input.content,
    coverImageId: input.coverImageId,
    date: input.date ? new Date(input.date) : existing.date,
    readTime: input.readTime ?? estimateReadTime(input.content),
    tags: input.tags ?? [],
    featured: input.featured ?? false,
    published: input.published ?? false,
    updatedAt,
  };

  await db.collection<BlogPostDoc>("blog_posts").updateOne(
    { _id: new ObjectId(id) },
    { $set: update },
  );

  return getPostById(id);
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const db = await getDb();
  const result = await db.collection<BlogPostDoc>("blog_posts").deleteOne({
    _id: new ObjectId(id),
  });
  return result.deletedCount === 1;
}
