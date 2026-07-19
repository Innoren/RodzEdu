import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findUserByEmail, findUserById } from "./db";
import type { Role, User } from "./types";

const SESSION_COOKIE = "rodzedu_session";

export type SessionUser = Omit<User, "password">;

function toSessionUser(user: User): SessionUser {
  const { password: _password, ...safe } = user;
  return safe;
}

export async function createSession(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const userId = jar.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  const user = await findUserById(userId);
  if (!user) return null;
  return toSessionUser(user);
}

export async function requireUser(roles?: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) {
    redirect(dashboardPathForRole(user.role));
  }
  return user;
}

export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case "student":
      return "/student";
    case "teacher":
      return "/teacher";
    case "admin":
      return "/admin";
    case "ceo":
      return "/ceo";
    default:
      return "/";
  }
}

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const user = await findUserByEmail(email);
  if (!user || user.password !== password) return null;
  await createSession(user.id);
  return toSessionUser(user);
}
