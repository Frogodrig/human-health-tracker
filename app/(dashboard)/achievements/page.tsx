// Achievements and gamification
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAchievements } from "@/hooks/use-achievements";
import {
  Trophy,
  Star,
  Target,
  Zap,
  Calendar,
  Scan,
  Camera,
  TrendingUp,
  Award,
  Lock,
} from "lucide-react";

export default function AchievementsPage() {
  const {
    achievements,
    userAchievements,
    totalUnlocked,
    totalAvailable,
    recentUnlocks,
    loading,
    checkAchievements,
  } = useAchievements();

  useEffect(() => {
    checkAchievements();
  }, [checkAchievements]);

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Achievements</h1>
        <p className="text-gray-600">
          Track your progress and unlock rewards for healthy habits
        </p>
      </div>

      {/* Achievement Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{totalUnlocked}</div>
            <p className="text-sm text-gray-600">Unlocked</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{totalAvailable}</div>
            <p className="text-sm text-gray-600">Total Available</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">
              {Math.round((totalUnlocked / totalAvailable) * 100)}%
            </div>
            <p className="text-sm text-gray-600">Completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{recentUnlocks.length}</div>
            <p className="text-sm text-gray-600">Recent</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Unlocks */}
      {recentUnlocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUnlocks.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg"
                >
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium">{achievement.name}</h4>
                    <p className="text-sm text-gray-600">
                      {achievement.description}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    {achievement.tier}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Categories */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="streak">Streaks</TabsTrigger>
          <TabsTrigger value="milestone">Milestones</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="scanning">Scanning</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Unlocked Achievements */}
            {unlockedAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                unlocked={true}
              />
            ))}

            {/* Locked Achievements */}
            {lockedAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                unlocked={false}
              />
            ))}
          </div>
        </TabsContent>

        {["streak", "milestone", "nutrition", "scanning"].map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {achievements
                .filter((a) => a.category.toLowerCase() === category)
                .map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    unlocked={achievement.unlocked}
                  />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// Achievement Card Component
function AchievementCard({
  achievement,
  unlocked,
}: {
  achievement: any;
  unlocked: boolean;
}) {
  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "legendary":
        return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white";
      case "epic":
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
      case "rare":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getIconForCategory = (category: string) => {
    switch (category.toLowerCase()) {
      case "streak":
        return Calendar;
      case "milestone":
        return Trophy;
      case "nutrition":
        return TrendingUp;
      case "scanning":
        return Scan;
      default:
        return Award;
    }
  };

  const IconComponent = getIconForCategory(achievement.category);

  return (
    <Card
      className={`relative overflow-hidden ${unlocked ? "" : "opacity-60"}`}
    >
      {!unlocked && (
        <div className="absolute top-2 right-2 z-10">
          <Lock className="h-4 w-4 text-gray-400" />
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-3">
          <div
            className={`p-2 rounded-full ${
              unlocked ? "bg-green-100" : "bg-gray-100"
            }`}
          >
            <IconComponent
              className={`h-5 w-5 ${
                unlocked ? "text-green-600" : "text-gray-400"
              }`}
            />
          </div>
          <Badge className={getTierColor(achievement.tier)}>
            {achievement.tier}
          </Badge>
        </div>

        <div className="text-center mb-4">
          <div className="text-4xl mb-2">{achievement.icon}</div>
          <h3 className="font-semibold text-lg">{achievement.name}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {achievement.description}
          </p>
        </div>

        {achievement.progress !== undefined && achievement.progress < 100 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{achievement.progress}%</span>
            </div>
            <Progress value={achievement.progress} className="h-2" />
          </div>
        )}

        {unlocked && achievement.unlockedAt && (
          <div className="text-xs text-gray-500 text-center mt-3">
            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
