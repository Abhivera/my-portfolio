import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleBlogAdmin } from "../../lib/blog/handlers.js";
import { sendWebResponse, toWebRequest } from "../../lib/vercel-adapter.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const response = await handleBlogAdmin(toWebRequest(req, "/api/blog/admin"));
  await sendWebResponse(res, response);
}
