import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../lib/session";
import prisma from "../../../lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve all progress logs for the user
    const progressLogs = await prisma.userProgress.findMany({
      where: { userId: user.id },
      include: {
        assessment: {
          select: {
            type: true,
          },
        },
      },
      orderBy: { completedAt: "asc" },
    });

    if (progressLogs.length === 0) {
      return NextResponse.json({
        hasData: false,
        stats: {
          totalXP: user.xp,
          level: user.level,
          totalSessions: 0,
          totalTimeMinutes: 0,
          averageAccuracy: 0,
        },
        modePerformance: [],
        weeklyProgress: [],
      });
    }

    // Calculate core statistics
    const totalSessions = progressLogs.length;
    const totalTimeSeconds = progressLogs.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0);
    const totalTimeMinutes = Math.round(totalTimeSeconds / 60);

    const totalScore = progressLogs.reduce((acc, curr) => acc + curr.score, 0);
    const totalMaxScore = progressLogs.reduce((acc, curr) => acc + curr.maxScore, 0);
    const averageAccuracy = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

    // Group accuracy by assessment mode type
    const modePerformanceMap: Record<string, { correct: number; total: number }> = {};
    for (const log of progressLogs) {
      const type = log.assessment.type;
      if (!modePerformanceMap[type]) {
        modePerformanceMap[type] = { correct: 0, total: 0 };
      }
      modePerformanceMap[type].correct += log.score;
      modePerformanceMap[type].total += log.maxScore;
    }

    const modePerformance = Object.entries(modePerformanceMap).map(([type, counts]) => ({
      mode: type.replace(/_/g, " "),
      accuracy: counts.total > 0 ? Math.round((counts.correct / counts.total) * 100) : 0,
    }));

    // Calculate weekly study progress (last 7 days)
    const weeklyProgress: { date: string; xp: number; time: number }[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - i);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      // Filter logs for this specific day
      const dayLogs = progressLogs.filter((log) => {
        const logTime = log.completedAt.getTime();
        return logTime >= startOfDay.getTime() && logTime <= endOfDay.getTime();
      });

      const dayXp = dayLogs.reduce((acc, curr) => acc + curr.xpEarned, 0);
      const dayTime = Math.round(dayLogs.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0) / 60);

      const formatter = new Intl.DateTimeFormat("en", { weekday: "short" });
      weeklyProgress.push({
        date: formatter.format(startOfDay),
        xp: dayXp,
        time: dayTime,
      });
    }

    return NextResponse.json({
      hasData: true,
      stats: {
        totalXP: user.xp,
        level: user.level,
        totalSessions,
        totalTimeMinutes,
        averageAccuracy,
      },
      modePerformance,
      weeklyProgress,
    });
  } catch (error) {
    console.error("Gathering analytics failed:", error);
    return NextResponse.json(
      { error: "Failed to compile performance analytics." },
      { status: 500 }
    );
  }
}
