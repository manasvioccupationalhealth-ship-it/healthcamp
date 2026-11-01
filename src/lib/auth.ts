import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "antigravity_healthcamp_local_jwt_secret_key_32chars_min";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const COOKIE_NAME = "healthcamp_session";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  companyId?: string | null;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(req?: Request | any): Promise<SessionPayload | null> {
  try {
    let token: string | undefined;

    if (req) {
      if (req.cookies && typeof req.cookies.get === "function") {
        const c = req.cookies.get(COOKIE_NAME);
        token = typeof c === "string" ? c : c?.value;
      }
      if (!token && req.headers) {
        const cookieHeader = typeof req.headers.get === "function" ? req.headers.get("cookie") : req.headers.cookie;
        if (cookieHeader) {
          const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
          if (match) {
            token = decodeURIComponent(match[1]);
          }
        }
      }
    }

    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get(COOKIE_NAME)?.value;
      } catch {
        // Fallback if cookies() is not available in current scope
      }
    }

    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function authenticateUser(email: string, passwordPlain: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      company: true,
      counterAssignments: {
        include: {
          campCounter: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    companyId: user.companyId,
    companyName: user.company?.name,
    counterAssignments: user.counterAssignments.map((ca) => ({
      campId: ca.campId,
      counterId: ca.campCounterId,
      counterNo: ca.campCounter.counterNo,
      counterName: ca.campCounter.name,
      counterType: ca.campCounter.counterType,
    })),
  };
}

export function hasPermission(userRole: string, allowedRoles: string[]): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  return allowedRoles.includes(userRole);
}
