"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNutritionStore, useUIStore } from "@/store";
import { useUserProfile } from "@/hooks/use-user-profile";
import {
  Target,
  TrendingUp,
  Calculator,
  Save,
  AlertCircle,
  Info,
  Loader2,
  Zap,
  Activity,
  Droplets,
} from "lucide-react";
import type { UserProfile } from "@/types";

export default function GoalsPage() {
  const { user } = useUser();
  const { profile, loading: profileLoading } = useUserProfile();
  const { showSuccess, showError } = useUIStore();
  const {
    dailyGoals,
    updateDailyGoals,
    calculateCalorieNeeds,
    calculateMacroSplit,
  } = useNutritionStore();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localGoals, setLocalGoals] = useState(dailyGoals);

  // Calculate recommended values based on profile
  const recommendedCalories =
    profile && profile.height && profile.weight && profile.dateOfBirth
      ? calculateCalorieNeeds(profile as any)
      : 2000;
  const recommendedMacros = calculateMacroSplit(
    recommendedCalories,
    profile?.dietaryGoals || "MAINTENANCE"
  );

  useEffect(() => {
    setLocalGoals(dailyGoals);
  }, [dailyGoals]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to backend
      const response = await fetch("/api/users/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCalories: localGoals.calories,
          targetProtein: localGoals.protein,
          targetCarbohydrates: localGoals.carbohydrates,
          targetFat: localGoals.fat,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save goals");
      }

      // Update local store
      updateDailyGoals(localGoals);
      setIsEditing(false);
      showSuccess("Goals Updated", "Your nutritional goals have been saved.");
    } catch (error) {
      showError(
        "Update Failed",
        "Failed to save your goals. Please try again.",
        error
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalGoals(dailyGoals);
    setIsEditing(false);
  };

  const applyRecommended = (type: "all" | "calories" | "macros") => {
    if (type === "all" || type === "calories") {
      setLocalGoals((prev) => ({ ...prev, calories: recommendedCalories }));
    }
    if (type === "all" || type === "macros") {
      setLocalGoals((prev) => ({
        ...prev,
        protein: recommendedMacros.protein,
        carbohydrates: recommendedMacros.carbohydrates,
        fat: recommendedMacros.fat,
      }));
    }
  };

  if (profileLoading) {
    return <GoalsLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Nutrition Goals</h1>
          <p className="text-gray-600">
            Set your daily targets for calories and macronutrients
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Target className="mr-2 h-4 w-4" />
            Edit Goals
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Profile Check */}
      {(!profile?.height || !profile?.weight) && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Complete your profile to get personalized goal recommendations based
            on your body metrics and activity level.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList>
          <TabsTrigger value="daily">Daily Goals</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        {/* Daily Goals Tab */}
        <TabsContent value="daily" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Calorie Goal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-green-600" />
                  Daily Calories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="calories">Target Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={localGoals.calories}
                    onChange={(e) =>
                      setLocalGoals({
                        ...localGoals,
                        calories: Number(e.target.value),
                      })
                    }
                    disabled={!isEditing}
                    min="1000"
                    max="5000"
                    step="50"
                  />
                </div>
                {profile?.height && profile?.weight && (
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recommended:</span>
                      <span className="font-medium">
                        {recommendedCalories} cal
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activity Level:</span>
                      <Badge variant="secondary">{profile.activityLevel}</Badge>
                    </div>
                  </div>
                )}
                {isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyRecommended("calories")}
                    className="w-full"
                  >
                    Use Recommended
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Water Goal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Droplets className="mr-2 h-5 w-5 text-blue-600" />
                  Daily Water
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="water">Target Water (ml)</Label>
                  <Input
                    id="water"
                    type="number"
                    value={localGoals.water}
                    onChange={(e) =>
                      setLocalGoals({
                        ...localGoals,
                        water: Number(e.target.value),
                      })
                    }
                    disabled={!isEditing}
                    min="1000"
                    max="5000"
                    step="250"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p>Recommended: 2000-3000 ml per day</p>
                  <p className="mt-1">
                    {Math.round(localGoals.water / 250)} glasses (250ml each)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Macronutrient Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-orange-600" />
                  Macronutrient Goals
                </div>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyRecommended("macros")}
                  >
                    Use Recommended
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Protein */}
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={localGoals.protein}
                    onChange={(e) =>
                      setLocalGoals({
                        ...localGoals,
                        protein: Number(e.target.value),
                      })
                    }
                    disabled={!isEditing}
                    min="0"
                    max="500"
                  />
                  <div className="text-xs text-gray-600">
                    <p>{localGoals.protein * 4} calories</p>
                    <p>
                      {Math.round(
                        ((localGoals.protein * 4) / localGoals.calories) * 100
                      )}
                      % of total
                    </p>
                  </div>
                </div>

                {/* Carbohydrates */}
                <div className="space-y-2">
                  <Label htmlFor="carbohydrates">Carbohydrates (g)</Label>
                  <Input
                    id="carbohydrates"
                    type="number"
                    value={localGoals.carbohydrates}
                    onChange={(e) =>
                      setLocalGoals({
                        ...localGoals,
                        carbohydrates: Number(e.target.value),
                      })
                    }
                    disabled={!isEditing}
                    min="0"
                    max="500"
                  />
                  <div className="text-xs text-gray-600">
                    <p>{localGoals.carbohydrates * 4} calories</p>
                    <p>
                      {Math.round(
                        ((localGoals.carbohydrates * 4) / localGoals.calories) *
                          100
                      )}
                      % of total
                    </p>
                  </div>
                </div>

                {/* Fat */}
                <div className="space-y-2">
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={localGoals.fat}
                    onChange={(e) =>
                      setLocalGoals({
                        ...localGoals,
                        fat: Number(e.target.value),
                      })
                    }
                    disabled={!isEditing}
                    min="0"
                    max="200"
                  />
                  <div className="text-xs text-gray-600">
                    <p>{localGoals.fat * 9} calories</p>
                    <p>
                      {Math.round(
                        ((localGoals.fat * 9) / localGoals.calories) * 100
                      )}
                      % of total
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Macro Calorie Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total from macros:</span>
                  <span className="font-medium">
                    {localGoals.protein * 4 +
                      localGoals.carbohydrates * 4 +
                      localGoals.fat * 9}{" "}
                    calories
                  </span>
                </div>
                <Progress
                  value={
                    ((localGoals.protein * 4 +
                      localGoals.carbohydrates * 4 +
                      localGoals.fat * 9) /
                      localGoals.calories) *
                    100
                  }
                  className="h-2"
                />
                {Math.abs(
                  localGoals.calories -
                    (localGoals.protein * 4 +
                      localGoals.carbohydrates * 4 +
                      localGoals.fat * 9)
                ) > 50 && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your macronutrient calories don&apos;t match your total
                      calorie goal. Consider adjusting your macros.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="mr-2 h-5 w-5" />
                Personalized Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile?.height && profile?.weight ? (
                <>
                  <div className="space-y-4">
                    <h3 className="font-medium">Based on Your Profile</h3>
                    <div className="grid gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">BMI:</span>
                        <span className="font-medium">
                          {(
                            profile.weight / Math.pow(profile.height / 100, 2)
                          ).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Activity Level:</span>
                        <Badge variant="secondary">
                          {profile.activityLevel}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Goal:</span>
                        <Badge variant="secondary">
                          {profile.dietaryGoals.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Recommended Daily Targets</h3>
                    <div className="grid gap-3">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Calories</span>
                          <span className="text-lg font-bold text-green-600">
                            {recommendedCalories}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-blue-50 rounded-lg text-center">
                          <div className="text-sm text-gray-600">Protein</div>
                          <div className="font-bold text-blue-600">
                            {recommendedMacros.protein}g
                          </div>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg text-center">
                          <div className="text-sm text-gray-600">Carbs</div>
                          <div className="font-bold text-orange-600">
                            {recommendedMacros.carbohydrates}g
                          </div>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg text-center">
                          <div className="text-sm text-gray-600">Fat</div>
                          <div className="font-bold text-purple-600">
                            {recommendedMacros.fat}g
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={() => {
                        applyRecommended("all");
                        setIsEditing(true);
                      }}
                      className="w-full"
                    >
                      Apply All Recommendations
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">
                    Complete your profile to receive personalized
                    recommendations
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => (window.location.href = "/settings")}
                  >
                    Update Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goal Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Goal Setting Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <GoalTip
                icon="🎯"
                title="Be Realistic"
                description="Set achievable goals based on your lifestyle and activity level."
              />
              <GoalTip
                icon="📈"
                title="Track Progress"
                description="Monitor your daily intake to see how well you're meeting your goals."
              />
              <GoalTip
                icon="🔄"
                title="Adjust as Needed"
                description="Your goals may change as your fitness journey progresses."
              />
              <GoalTip
                icon="💧"
                title="Don't Forget Water"
                description="Proper hydration is essential for metabolism and overall health."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Goal Achievement Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Start tracking your daily intake to see your progress
                    towards these goals. Visit the Analytics page for detailed
                    insights.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">This Week</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Goals Met:</span>
                        <span className="font-medium">0/7 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Intake:</span>
                        <span className="font-medium">-- cal</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">This Month</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Goals Met:</span>
                        <span className="font-medium">0/30 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="font-medium">--%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => (window.location.href = "/analytics")}
                  >
                    View Detailed Analytics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for goal tips
function GoalTip({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="text-2xl">{icon}</div>
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

// Loading skeleton
function GoalsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-48 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-64 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}
