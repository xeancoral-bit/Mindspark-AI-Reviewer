import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../lib/session";
import prisma from "../../../lib/db";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getSessionUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch top 10 users sorted by XP desc
    const topUsers = await prisma.user.findMany({
      orderBy: [{ xp: "desc" }, { createdAt: "asc" }],
      take: 10,
      select: {
        id: true,
        name: true,
        xp: true,
        level: true,
        badges: {
          select: {
            id: true,
          },
        },
      },
    });

    const leaderboard = topUsers.map((u, index) => ({
      rank: index + 1,
      id: u.id,
      name: u.name,
      xp: u.xp,
      level: u.level,
      badgeCount: u.badges.length,
      isCurrentUser: u.id === currentUser.id,
    }));

    // Find current user's exact ranking
    let userRank = leaderboard.find((u) => u.id === currentUser.id)?.rank;

    if (!userRank) {
      // User is outside the top 10, compute their rank
      const countAhead = await prisma.user.count({
        where: {
          xp: {
            gt: currentUser.xp,
          },
        },
      });
      userRank = countAhead + 1;
    }

    // Fetch current user's unlocked badges
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: currentUser.id },
      include: {
        badge: true,
      },
      orderBy: { unlockedAt: "desc" },
    });

    // Fetch all available badges so the UI can show locked badges greyed out
    const allBadges = await prisma.badge.findMany({
      orderBy: { xpRequired: "asc" },
    });

    return NextResponse.json({
      leaderboard,
      currentUserRank: {
        rank: userRank,
        name: currentUser.name,
        xp: currentUser.xp,
        level: currentUser.level,
        badgeCount: userBadges.length,
      },
      badges: allBadges.map((badge) => {
        const unlocked = userBadges.find((ub) => ub.badgeId === badge.id);
        return {
          ...badge,
          unlocked: !!unlocked,
          unlockedAt: unlocked ? unlocked.unlockedAt : null,
        };
      }),
    });
  } catch (error) {
    console.error("Gathering leaderboard failed:", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard." },
      { status: 500 }
    );
  }
}
