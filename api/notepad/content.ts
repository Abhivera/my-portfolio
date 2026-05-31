import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleNotepadContent } from "../../lib/notepad/handlers.js";
import { sendWebResponse, toWebRequest } from "../../lib/vercel-adapter.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const response = await handleNotepadContent(
    toWebRequest(req, "/api/notepad/content"),
  );
  await sendWebResponse(res, response);
}
