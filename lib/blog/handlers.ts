import { checkBlogPassword } from "./auth.js";
import { getBlogImage, saveBlogImage } from "./images.js";
import {
  createBlogPost,
  deleteBlogPost,
  getPostById,
  getPublishedPostBySlug,
  listAllPosts,
  listPublishedPosts,
  updateBlogPost,
  type BlogPostInput,
} from "./posts.js";
import {
  blogSessionCookieHeader,
  clearBlogSessionCookieHeader,
  getBlogSessionFromCookieHeader,
  sealBlogSession,
} from "./session.js";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { ...init, headers });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, { status });
}

function requireBlogAuth(request: Request): boolean {
  const session = getBlogSessionFromCookieHeader(
    request.headers.get("cookie"),
  );
  return Boolean(session?.authenticated);
}

export async function handleBlogAuth(request: Request): Promise<Response> {
  try {
    if (request.method === "GET") {
      const session = getBlogSessionFromCookieHeader(
        request.headers.get("cookie"),
      );
      return jsonResponse({ authenticated: Boolean(session?.authenticated) });
    }

    if (request.method === "POST") {
      const body = (await request.json()) as { password?: string };
      if (!body.password?.trim()) {
        return errorResponse("Password is required", 400);
      }

      const valid = await checkBlogPassword(body.password);
      if (!valid) {
        return jsonResponse(
          { success: false, error: "Incorrect password" },
          { status: 401 },
        );
      }

      const token = sealBlogSession({ authenticated: true });
      return jsonResponse(
        { success: true },
        { headers: { "Set-Cookie": blogSessionCookieHeader(token) } },
      );
    }

    if (request.method === "DELETE") {
      return jsonResponse(
        { success: true },
        { headers: { "Set-Cookie": clearBlogSessionCookieHeader() } },
      );
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    console.error("[blog/auth]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function handleBlogPosts(request: Request): Promise<Response> {
  try {
    if (request.method !== "GET") {
      return errorResponse("Method not allowed", 405);
    }

    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");

    if (slug) {
      const post = await getPublishedPostBySlug(slug);
      if (!post) return errorResponse("Post not found", 404);
      return jsonResponse({ post });
    }

    const posts = await listPublishedPosts();
    return jsonResponse({ posts });
  } catch (err) {
    console.error("[blog/posts]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function handleBlogAdmin(request: Request): Promise<Response> {
  if (!requireBlogAuth(request)) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (request.method === "GET") {
      if (id) {
        const post = await getPostById(id);
        if (!post) return errorResponse("Post not found", 404);
        return jsonResponse({ post });
      }
      const posts = await listAllPosts();
      return jsonResponse({ posts });
    }

    if (request.method === "POST") {
      const body = (await request.json()) as BlogPostInput;
      if (!body.title?.trim() || !body.excerpt?.trim() || !body.content) {
        return errorResponse("Title, excerpt, and content are required", 400);
      }
      if (body.content.length > 500_000) {
        return errorResponse("Content too large", 400);
      }
      const post = await createBlogPost(body);
      return jsonResponse({ post }, { status: 201 });
    }

    if (request.method === "PUT") {
      if (!id) return errorResponse("Post id is required", 400);
      const body = (await request.json()) as BlogPostInput;
      if (!body.title?.trim() || !body.excerpt?.trim() || !body.content) {
        return errorResponse("Title, excerpt, and content are required", 400);
      }
      if (body.content.length > 500_000) {
        return errorResponse("Content too large", 400);
      }
      const post = await updateBlogPost(id, body);
      if (!post) return errorResponse("Post not found", 404);
      return jsonResponse({ post });
    }

    if (request.method === "DELETE") {
      if (!id) return errorResponse("Post id is required", 400);
      const deleted = await deleteBlogPost(id);
      if (!deleted) return errorResponse("Post not found", 404);
      return jsonResponse({ success: true });
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    console.error("[blog/admin]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function handleBlogUpload(request: Request): Promise<Response> {
  if (!requireBlogAuth(request)) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    if (request.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return errorResponse("Image file is required", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const id = await saveBlogImage(
      buffer,
      file.type || "application/octet-stream",
      file.name || "upload",
    );

    return jsonResponse({
      id,
      url: `/api/blog/images?id=${encodeURIComponent(id)}`,
    });
  } catch (err) {
    console.error("[blog/upload]", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return errorResponse(message, 400);
  }
}

export async function handleBlogImages(request: Request): Promise<Response> {
  try {
    if (request.method !== "GET") {
      return errorResponse("Method not allowed", 405);
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return errorResponse("Image id is required", 400);

    const image = await getBlogImage(id);
    if (!image) return errorResponse("Image not found", 404);

    return new Response(new Uint8Array(image.data), {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[blog/images]", err);
    return errorResponse("Internal server error", 500);
  }
}
