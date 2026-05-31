import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleBlogImages } from "../../lib/blog/handlers.js";
import { sendWebResponse, toWebRequest } from "../../lib/vercel-adapter.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const response = await handleBlogImages(toWebRequest(req, "/api/blog/images"));
  await sendWebResponse(res, response);
}
