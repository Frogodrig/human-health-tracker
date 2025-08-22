// Achievement management
import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useUIStore } from "@/store";
import type { AchievementWithProgress } from "@/types/dashboard";

export function useAchievements() {
  const { user } = useUser();
  const { showSuccess } = useUIStore();
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  // Mock achievements data
  const mockAchievements: AchievementWithProgress[] = [
    {
      id: "1",
      name: "First Steps",
      description: "Log your first meal",
      category: "MILESTONE",
      tier: "COMMON",
      icon: "🍽️",
      unlocked: true,
      unlockedAt: new Date("2024-01-01"),
      progress: 100,
      condition: {
        type: "meals_logged",
        target: 1,
        current: 1,
      },
    },
    {
      id: "2",
      name: "Scanner Pro",
      description: "Scan 10 barcodes",
      category: "SCANNING",
      tier: "COMMON",
      icon: "📱",
      unlocked: true,
      unlockedAt: new Date("2024-01-03"),
      progress: 100,
      condition: {
        type: "barcodes_scanned",
        target: 10,
        current: 10,
      },
    },
    {
      id: "3",
      name: "Week Warrior",
      description: "Log meals for 7 consecutive days",
      category: "STREAK",
      tier: "RARE",
      icon: "🔥",
      unlocked: true,
      unlockedAt: new Date("2024-01-08"),
      progress: 100,
      condition: {
        type: "streak",
        target: 7,
        current: 7,
      },
    },
    {
      id: "4",
      name: "Nutrition Ninja",
      description: "Meet all macro goals for 5 days",
      category: "NUTRITION",
      tier: "EPIC",
      icon: "🥗",
      unlocked: false,
      progress: 60,
      condition: {
        type: "macro_goals_met",
        target: 5,
        current: 3,
      },
    },
    {
      id: "5",
      name: "AI Explorer",
      description: "Use AI food recognition 20 times",
      category: "SCANNING",
      tier: "RARE",
      icon: "🤖",
      unlocked: false,
      progress: 25,
      condition: {
        type: "ai_scans",
        target: 20,
        current: 5,
      },
    },
    {
      id: "6",
      name: "Health Legend",
      description: "Maintain a 30-day logging streak",
      category: "STREAK",
      tier: "LEGENDARY",
      icon: "🏆",
      unlocked: false,
      progress: 40,
      condition: {
        type: "streak",
        target: 30,
        current: 12,
      },
    },
  ];

  const checkAchievements = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // In real app, fetch from API
      // const response = await fetch('/api/users/achievements');
      // const data = await response.json();

      setAchievements(mockAchievements);
    } catch (error) {
      console.error("Failed to load achievements:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const unlockAchievement = useCallback(
    async (achievementId: string) => {
      try {
        // In real app, POST to API
        // await fetch('/api/users/achievements/unlock', {
        //   method: 'POST',
        //   body: JSON.stringify({ achievementId })
        // });

        setAchievements((prev) =>
          prev.map((achievement) =>
            achievement.id === achievementId
              ? {
                  ...achievement,
                  unlocked: true,
                  unlockedAt: new Date(),
                  progress: 100,
                }
              : achievement
          )
        );

        const achievement = achievements.find((a) => a.id === achievementId);
        if (achievement) {
          showSuccess(
            "Achievement Unlocked!",
            `You earned: ${achievement.name}`
          );
        }
      } catch (error) {
        console.error("Failed to unlock achievement:", error);
      }
    },
    [achievements, showSuccess]
  );

  const totalUnlocked = achievements.filter((a) => a.unlocked).length;
  const totalAvailable = achievements.length;
  const recentUnlocks = achievements
    .filter((a) => a.unlocked && a.unlockedAt)
    .sort(
      (a, b) =>
        new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime()
    )
    .slice(0, 3);

  return {
    achievements,
    userAchievements: achievements.filter((a) => a.unlocked),
    totalUnlocked,
    totalAvailable,
    recentUnlocks,
    loading,
    checkAchievements,
    unlockAchievement,
  };
}
