import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/db";
import fs from "fs";
import path from "path";

// Helper to seed badges in SQLite if they do not exist
async function seedBadges() {
  const badgeCount = await prisma.badge.count();
  if (badgeCount >= 206) {
    return; // Already seeded
  }

  const badges = [
    {
      name: "First Step",
      description: "Completed your first study assessment!",
      icon: "Award",
      xpRequired: 10,
    },
    {
      name: "Scholar",
      description: "Reached Level 2 by earning 100+ XP!",
      icon: "GraduationCap",
      xpRequired: 100,
    },
    {
      name: "Mastermind",
      description: "Achieved a perfect score on any assessment!",
      icon: "Brain",
      xpRequired: 0,
    },
    {
      name: "Speed Demon",
      description: "Completed a Timed Quiz with 80% accuracy or higher!",
      icon: "Zap",
      xpRequired: 0,
    },
    {
      name: "Centurion",
      description: "Earned a total of 1000 XP!",
      icon: "Crown",
      xpRequired: 1000,
    },
    {
      name: "Flawless First Run",
      description: "Earned a perfect score on your first attempt of an assessment with no retakes!",
      icon: "Gem",
      xpRequired: 0,
    },
  ];

  // Load the 200 generated badges from badges.json
  try {
    const badgesPath = path.join(process.cwd(), "prisma", "badges.json");
    if (fs.existsSync(badgesPath)) {
      const generatedBadges = JSON.parse(fs.readFileSync(badgesPath, "utf8"));
      badges.push(...generatedBadges);
    }
  } catch (err) {
    console.warn("Could not dynamically load badges.json in route handler:", err);
  }

  for (const b of badges) {
    await prisma.badge.upsert({
      where: { name: b.name },
      update: {},
      create: b,
    }).catch(() => {});
  }
}

// Check and award badges based on achievements
async function checkAndUnlockBadges(
  userId: string,
  assessmentType: string,
  score: number,
  maxScore: number,
  newXpTotal: number,
  isFirstAttempt: boolean
) {
  await seedBadges();
  const unlockedBadges: any[] = [];

  const triggerBadge = async (badgeName: string) => {
    const badge = await prisma.badge.findUnique({ where: { name: badgeName } });
    if (!badge) return;

    // Check if already unlocked
    const existing = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId: badge.id,
        },
      },
    });

    if (!existing) {
      const userBadge = await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
        include: { badge: true },
      });
      unlockedBadges.push(userBadge.badge);
    }
  };

  // Badge 1: First Step
  await triggerBadge("First Step");

  // Badge 2: Scholar (Level 2 / 100 XP)
  if (newXpTotal >= 100) {
    await triggerBadge("Scholar");
  }

  // Badge 3: Mastermind (Perfect Score)
  if (score === maxScore && maxScore > 0) {
    await triggerBadge("Mastermind");
  }

  // Badge 4: Speed Demon (Timed Quiz >= 80%)
  if (assessmentType === "TIMED" && maxScore > 0 && score / maxScore >= 0.8) {
    await triggerBadge("Speed Demon");
  }

  // Badge 5: Centurion (1000 XP)
  if (newXpTotal >= 1000) {
    await triggerBadge("Centurion");
  }

  // Badge 6: Flawless First Run
  if (isFirstAttempt && score === maxScore && maxScore > 0) {
    await triggerBadge("Flawless First Run");
  }

  // Dynamically check and unlock all XP-based milestone badges
  const allDbBadges = await prisma.badge.findMany();
  for (const b of allDbBadges) {
    if (b.xpRequired > 0 && newXpTotal >= b.xpRequired) {
      await triggerBadge(b.name);
    }
  }

  return unlockedBadges;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: assessmentId } = await params;
    const { score, maxScore, timeSpentSeconds } = await req.json();

    if (score === undefined || maxScore === undefined || timeSpentSeconds === undefined) {
      return NextResponse.json(
        { error: "Missing required fields (score, maxScore, timeSpentSeconds)." },
        { status: 400 }
      );
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
    }

    // Count previous attempts for this assessment to check if this is the first try
    const previousAttempts = await prisma.userProgress.count({
      where: {
        userId: user.id,
        assessmentId,
      },
    });
    const isFirstAttempt = previousAttempts === 0;

    // Calculate XP
    // 10 XP per correct answer + 50 XP bonus for perfect score
    const isPerfect = score === maxScore && maxScore > 0;
    const xpEarned = (score * 10) + (isPerfect ? 50 : 0);

    // Update User XP and Level
    const newXpTotal = user.xp + xpEarned;
    // Level formula: 1 level per 100 XP
    const newLevel = Math.floor(newXpTotal / 100) + 1;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: newXpTotal,
        level: newLevel,
      },
    });

    // Save user progress entry
    const progress = await prisma.userProgress.create({
      data: {
        userId: user.id,
        assessmentId,
        score,
        maxScore,
        timeSpentSeconds,
        xpEarned,
      },
    });

    // Check and unlock badges
    const unlockedBadges = await checkAndUnlockBadges(
      user.id,
      assessment.type,
      score,
      maxScore,
      newXpTotal,
      isFirstAttempt
    );

    const earnedPerfectToken = isFirstAttempt && isPerfect;

    return NextResponse.json({
      success: true,
      progress,
      xpEarned,
      newTotalXp: newXpTotal,
      newLevel,
      leveledUp: newLevel > user.level,
      unlockedBadges,
      isFirstAttempt,
      earnedPerfectToken,
    });
  } catch (error) {
    console.error("Submitting assessment failed:", error);
    return NextResponse.json(
      { error: "Failed to record assessment score." },
      { status: 500 }
    );
  }
}
