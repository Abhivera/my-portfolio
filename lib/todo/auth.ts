import { createHash, timingSafeEqual } from "node:crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function verifyPassword(input: string, expectedPlain: string): boolean {
  const inputHash = hashPassword(input);
  const expectedHash = hashPassword(expectedPlain);
  const a = Buffer.from(inputHash, "utf8");
  const b = Buffer.from(expectedHash, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function getConfiguredPassword(): string {
  const password = process.env.GOAL_PASSWORD?.trim();
  if (!password) {
    throw new Error(
      "GOAL_PASSWORD is not set. Add it in Vercel → Settings → Environment Variables.",
    );
  }
  return password;
}

export function checkPassword(password: string): boolean {
  const configured = getConfiguredPassword();
  return verifyPassword(password.trim(), configured);
}
