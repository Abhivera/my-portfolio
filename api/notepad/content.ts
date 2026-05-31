import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleNotepadContent } from "../../lib/notepad/handlers.js";

function requestBody(req: VercelRequest): string | undefined {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  if (typeof req.body === "string") return req.body;
  if (req.body !== undefined) return JSON.stringify(req.body);
  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url ?? "/api/notepad/content", `https://${req.headers.host}`);
  const request = new Request(url, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body: requestBody(req),
  });

  const response = await handleNotepadContent(request);
  res.status(response.status);

  const contentType = response.headers.get("content-type");
  if (contentType) res.setHeader("Content-Type", contentType);

  res.send(await response.text());
}
