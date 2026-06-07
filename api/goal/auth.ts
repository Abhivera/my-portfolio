import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleGoalAuth } from "../../lib/todo/handlers.js";
import { sendWebResponse, toWebRequest } from "../../lib/vercel-adapter.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const response = await handleGoalAuth(
    toWebRequest(req, "/api/goal/auth"),
  );
  await sendWebResponse(res, response);
}
