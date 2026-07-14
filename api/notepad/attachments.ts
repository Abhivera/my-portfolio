import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleNotepadAttachments } from "../../lib/notepad/handlers.js";
import {
  sendWebResponse,
  toRawWebRequest,
} from "../../lib/vercel-adapter.js";

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: "4.5mb",
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const request = await toRawWebRequest(req, "/api/notepad/attachments");
  const response = await handleNotepadAttachments(request);
  await sendWebResponse(res, response);
}
