import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleBlogPosts } from "../../lib/blog/handlers.js";
import { sendWebResponse, toWebRequest } from "../../lib/vercel-adapter.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const response = await handleBlogPosts(toWebRequest(req, "/api/blog/posts"));
  await sendWebResponse(res, response);
}
