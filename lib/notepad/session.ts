import { createHmac, timingSafeEqual } from "node:crypto";

export const NOTEPAD_COOKIE = "notepad-session";
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

type SessionPayload = {
  authenticated: boolean;
  exp: number;
};

function getSessionSecret(): string {
  const secret = process.env.NOTEPAD_SESSION_SECRET ?? process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "NOTEPAD_SESSION_SECRET (or SESSION_SECRET) must be at least 32 characters",
    );
  }
  return secret;
}

export function sealSession(data: { authenticated: boolean }): string {
  const payload: SessionPayload = {
    authenticated: data.authenticated,
    exp: Date.now() + MAX_AGE_SEC * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function unsealSession(token: string | undefined): SessionPayload | null {
  if (!token) return null;

  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  const expected = createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");

  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (!payload.authenticated || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionFromCookieHeader(
  cookieHeader: string | null,
): SessionPayload | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${NOTEPAD_COOKIE}=`));
  if (!match) return null;
  const value = match.slice(NOTEPAD_COOKIE.length + 1);
  return unsealSession(decodeURIComponent(value));
}

export function sessionCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${NOTEPAD_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
}

export function clearSessionCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${NOTEPAD_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
