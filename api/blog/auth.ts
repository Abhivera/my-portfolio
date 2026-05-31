import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleBlogAuth } from "../../lib/blog/handlers.js";
import { sendWebResponse, toWebRequest } from "../../lib/vercel-adapter.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const response = await handleBlogAuth(toWebRequest(req, "/api/blog/auth"));
  await sendWebResponse(res, response);
}
