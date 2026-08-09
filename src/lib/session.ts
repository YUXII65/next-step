import { createHmac } from "node:crypto";

export const SESSION_COOKIE = "next_step_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret() {
  return process.env.AUTH_SECRET || "next-step-dev-secret-change-me";
}

export function issueSessionToken(userId: string) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${userId}.${expiresAt}`;
  const signature = createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function readSessionToken(token: string) {
  const [userId, expiresAt, signature] = token.split(".");
  if (!userId || !expiresAt || !signature) return null;
  if (Number(expiresAt) < Date.now()) return null;

  const expected = createHmac("sha256", secret())
    .update(`${userId}.${expiresAt}`)
    .digest("base64url");
  if (signature !== expected) return null;

  return userId;
}
