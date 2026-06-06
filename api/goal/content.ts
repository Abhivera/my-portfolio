import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleTodoContent } from "../../lib/todo/handlers.js";
import { sendWebResponse, toWebRequest } from "../../lib/vercel-adapter.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const response = await handleTodoContent(
    toWebRequest(req, "/api/goal/content"),
  );
  await sendWebResponse(res, response);
}
