import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleNotepadShare } from "../../lib/notepad/handlers.js";
import { sendWebResponse, toWebRequest } from "../../lib/vercel-adapter.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const response = await handleNotepadShare(
    toWebRequest(req, "/api/notepad/share"),
  );
  await sendWebResponse(res, response);
}
