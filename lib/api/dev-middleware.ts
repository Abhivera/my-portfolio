import type { Connect } from "vite";
import { handleNotepadAuth, handleNotepadContent } from "../notepad/handlers";
import {
  handleBlogAdmin,
  handleBlogAuth,
  handleBlogImages,
  handleBlogPosts,
  handleBlogUpload,
} from "../blog/handlers";

function getPathname(url: string): string {
  return url.split("?")[0] ?? url;
}

function readBody(req: Connect.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function toRequest(
  req: Connect.IncomingMessage,
): Promise<Request> {
  const origin = `http://${req.headers.host ?? "localhost"}`;
  const rawBody =
    req.method !== "GET" && req.method !== "HEAD"
      ? await readBody(req)
      : undefined;

  return new Request(`${origin}${req.url ?? "/"}`, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body: rawBody?.length ? new Uint8Array(rawBody) : undefined,
  });
}

async function writeResponse(
  res: Connect.ServerResponse,
  response: Response,
): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.end(Buffer.from(await response.arrayBuffer()));
}

/** Serves /api/notepad/* and /api/blog/* during `vite dev`. */
export function createApiDevMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const pathname = getPathname(req.url ?? "");

    if (
      !pathname.startsWith("/api/notepad/") &&
      !pathname.startsWith("/api/blog/")
    ) {
      next();
      return;
    }

    const request = await toRequest(req);
    let response: Response;

    if (pathname.startsWith("/api/notepad/auth")) {
      response = await handleNotepadAuth(request);
    } else if (pathname.startsWith("/api/notepad/content")) {
      response = await handleNotepadContent(request);
    } else if (pathname.startsWith("/api/blog/auth")) {
      response = await handleBlogAuth(request);
    } else if (pathname.startsWith("/api/blog/posts")) {
      response = await handleBlogPosts(request);
    } else if (pathname.startsWith("/api/blog/admin")) {
      response = await handleBlogAdmin(request);
    } else if (pathname.startsWith("/api/blog/upload")) {
      response = await handleBlogUpload(request);
    } else if (pathname.startsWith("/api/blog/images")) {
      response = await handleBlogImages(request);
    } else {
      next();
      return;
    }

    await writeResponse(res, response);
  };
}
