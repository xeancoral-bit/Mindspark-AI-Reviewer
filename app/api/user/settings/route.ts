import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/session";
import { encrypt } from "../../../../lib/crypto";
import prisma from "../../../../lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, apiKey } = await req.json();

    const updateData: any = {};

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
      }
      updateData.name = trimmedName;
    }

    if (apiKey !== undefined) {
      if (apiKey === "") {
        // Clear the API key
        updateData.apiKey = null;
      } else if (!apiKey.startsWith("••••")) {
        // Key has been modified and is not masked, validate and encrypt it
        const trimmedKey = apiKey.trim();
        if (!trimmedKey.startsWith("sk-")) {
          return NextResponse.json(
            { error: "Invalid OpenAI API key format. It should start with 'sk-'." },
            { status: 400 }
          );
        }
        updateData.apiKey = encrypt(trimmedKey);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No changes provided." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        xp: true,
        level: true,
        apiKey: true, // Will check if non-null in response to mask it
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        hasApiKey: !!updatedUser.apiKey,
        apiKey: updatedUser.apiKey ? "••••••••••••••••••••" : null,
      },
    });
  } catch (error) {
    console.error("Updating settings failed:", error);
    return NextResponse.json(
      { error: "Failed to update profile settings." },
      { status: 500 }
    );
  }
}
