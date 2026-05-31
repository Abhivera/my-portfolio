import type { VercelRequest, VercelResponse } from "@vercel/node";

export function requestBody(req: VercelRequest): string | undefined {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  if (typeof req.body === "string") return req.body;
  if (req.body !== undefined) return JSON.stringify(req.body);
  return undefined;
}

export async function sendWebResponse(
  res: VercelResponse,
  response: Response,
): Promise<void> {
  res.status(response.status);

  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length > 0) {
    res.setHeader("Set-Cookie", setCookies);
  } else {
    const cookie = response.headers.get("set-cookie");
    if (cookie) res.setHeader("Set-Cookie", cookie);
  }

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") return;
    res.setHeader(key, value);
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  res.send(buffer);
}

export function toWebRequest(req: VercelRequest, fallbackPath: string): Request {
  const url = new URL(req.url ?? fallbackPath, `https://${req.headers.host}`);
  return new Request(url, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body: requestBody(req),
  });
}
