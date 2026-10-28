import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { DomainError } from "@/lib/errors";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session-constants";
import {
  type DomainUser,
  findUserById,
  type UserRole,
} from "@/repositories/user.repository";

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

interface SessionTokenPayload {
  sub: string;
  role: UserRole;
  exp: number;
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", env.SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");
}

export function createSessionToken(user: {
  id: string;
  role: UserRole;
}): string {
  const payload: SessionTokenPayload = {
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, providedSignature] = parts;
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  try {
    const expectedSignature = signPayload(encodedPayload);
    const providedBuf = Buffer.from(providedSignature, "utf8");
    const expectedBuf = Buffer.from(expectedSignature, "utf8");

    if (
      providedBuf.length !== expectedBuf.length ||
      !timingSafeEqual(providedBuf, expectedBuf)
    ) {
      return null;
    }

    const decoded = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<SessionTokenPayload>;

    if (
      typeof decoded.sub !== "string" ||
      (decoded.role !== "MEMBER" && decoded.role !== "LIBRARIAN") ||
      typeof decoded.exp !== "number"
    ) {
      return null;
    }

    if (decoded.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      sub: decoded.sub,
      role: decoded.role,
      exp: decoded.exp,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: {
  id: string;
  role: UserRole;
}): Promise<void> {
  const token = createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

function toSessionUser(user: DomainUser): SessionUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) {
    return null;
  }

  const payload = verifySessionToken(rawToken);
  if (!payload) {
    return null;
  }

  const user = await findUserById(payload.sub);
  if (!user) {
    return null;
  }

  return toSessionUser(user);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new DomainError("UNAUTHORIZED");
  }
  return user;
}

export async function requireLibrarian(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "LIBRARIAN") {
    throw new DomainError("FORBIDDEN");
  }
  return user;
}
