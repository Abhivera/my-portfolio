import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleNotepadAuth } from "../../lib/notepad/handlers.js";
import { sendWebResponse, toWebRequest } from "../../lib/vercel-adapter.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const response = await handleNotepadAuth(
    toWebRequest(req, "/api/notepad/auth"),
  );
  await sendWebResponse(res, response);
}
