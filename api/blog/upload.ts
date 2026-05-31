import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleBlogUpload } from "../../lib/blog/handlers.js";
import { sendWebResponse } from "../../lib/vercel-adapter.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url ?? "/api/blog/upload", `https://${req.headers.host}`);
  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await readRawBody(req)
      : undefined;

  const request = new Request(url, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body: body?.length ? new Uint8Array(body) : undefined,
  });

  const response = await handleBlogUpload(request);
  await sendWebResponse(res, response);
}
