import { Role } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

const COOKIE_NAME = "psychometric_session";

function secret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "development-only-secret-change-me",
  );
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function currentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = await jwtVerify(token, secret());
    const userId = payload.payload.userId;
    if (typeof userId !== "string") return null;
    return db.user.findUnique({ where: { id: userId } });
  } catch {
    return null;
  }
}

export async function requireUser(role?: Role) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) redirect("/dashboard");
  return user;
}
