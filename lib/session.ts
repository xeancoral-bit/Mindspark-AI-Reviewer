import { NextRequest } from "next/server";
import prisma from "./db";

/**
 * Create a new session in the database
 */
export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
  
  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
    },
  });
  
  return session.id;
}

/**
 * Retrieve the authenticated user from the session cookie
 */
export async function getSessionUser(req: NextRequest) {
  const sessionToken = req.cookies.get("session")?.value;
  if (!sessionToken) return null;
  
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            xp: true,
            level: true,
            createdAt: true,
          },
        },
      },
    });
    
    if (!session) return null;
    
    if (session.expiresAt < new Date()) {
      // Session expired, remove from DB
      await prisma.session.delete({ where: { id: sessionToken } }).catch(() => {});
      return null;
    }
    
    return session.user;
  } catch (error) {
    console.error("Session lookup failed:", error);
    return null;
  }
}

/**
 * Destroy the session
 */
export async function destroySession(sessionToken: string): Promise<void> {
  if (!sessionToken) return;
  try {
    await prisma.session.delete({
      where: { id: sessionToken },
    });
  } catch {
    // Session might already be deleted
  }
}
