import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "../../../../lib/crypto";
import prisma from "../../../../lib/db";
import { createSession } from "../../../../lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already in use." },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
      },
    });

    const sessionId = await createSession(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        xp: user.xp,
        level: user.level,
      },
    });

    response.cookies.set("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Registration endpoint failed:", error);
    return NextResponse.json(
      { 
        error: "An unexpected error occurred during registration.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
