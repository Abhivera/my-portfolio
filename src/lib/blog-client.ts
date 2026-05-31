import type { BlogPost } from "./blog-data";

const AUTH_API = "/api/blog/auth";
const POSTS_API = "/api/blog/posts";
const ADMIN_API = "/api/blog/admin";
const UPLOAD_API = "/api/blog/upload";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function getBlogAuthStatus(): Promise<{ authenticated: boolean }> {
  const res = await fetch(AUTH_API, { credentials: "include" });
  return parseJson(res);
}

export async function verifyBlogPassword(
  password: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const res = await fetch(AUTH_API, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  const data = (await res.json()) as { success?: boolean; error?: string };
  if (res.ok && data.success) return { success: true };
  return { success: false, error: data.error ?? "Incorrect password" };
}

export async function logoutBlog(): Promise<void> {
  await fetch(AUTH_API, { method: "DELETE", credentials: "include" });
}

export async function fetchPublishedPosts(): Promise<BlogPost[]> {
  const res = await fetch(POSTS_API);
  const data = await parseJson<{ posts: BlogPost[] }>(res);
  return data.posts;
}

export async function fetchPublishedPost(slug: string): Promise<BlogPost | null> {
  const res = await fetch(`${POSTS_API}?slug=${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  const data = await parseJson<{ post: BlogPost }>(res);
  return data.post;
}

export async function fetchAdminPosts(): Promise<BlogPost[]> {
  const res = await fetch(ADMIN_API, { credentials: "include" });
  const data = await parseJson<{ posts: BlogPost[] }>(res);
  return data.posts;
}

export async function fetchAdminPost(id: string): Promise<BlogPost> {
  const res = await fetch(`${ADMIN_API}?id=${encodeURIComponent(id)}`, {
    credentials: "include",
  });
  const data = await parseJson<{ post: BlogPost }>(res);
  return data.post;
}

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

export async function createBlogPost(input: BlogPostInput): Promise<BlogPost> {
  const res = await fetch(ADMIN_API, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ post: BlogPost }>(res);
  return data.post;
}

export async function updateBlogPost(
  id: string,
  input: BlogPostInput,
): Promise<BlogPost> {
  const res = await fetch(`${ADMIN_API}?id=${encodeURIComponent(id)}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ post: BlogPost }>(res);
  return data.post;
}

export async function deleteBlogPost(id: string): Promise<void> {
  const res = await fetch(`${ADMIN_API}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  await parseJson(res);
}

export async function uploadBlogImage(
  file: File,
): Promise<{ id: string; url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(UPLOAD_API, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return parseJson(res);
}
