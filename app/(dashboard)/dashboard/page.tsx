// Updated dashboard with real authentication
"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useAppStore, useNutritionStore, useUIStore } from "@/store";
import { useUserProfile } from "@/hooks/use-user-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CalendarDays,
  Target,
  TrendingUp,
  Camera,
  Scan,
  Plus,
  User,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user: authUser } = useUser();
  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useUserProfile();
  const { dailyGoals, getProgressPercentage, loadUserGoals, goalsLoading } =
    useNutritionStore();
  const { showInfo } = useUIStore();

  // Mock intake data for now - will be replaced with real API
  const mockIntake = {
    calories: 1456,
    protein: 89,
    carbohydrates: 178,
    fat: 45,
    water: 1200,
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Load user goals when component mounts
  useEffect(() => {
    if (authUser && !goalsLoading) {
      loadUserGoals();
    }
  }, [authUser, loadUserGoals, goalsLoading]);

  // Show welcome message for new users
  useEffect(() => {
    if (profile && !profile.height) {
      showInfo(
        "Complete Your Profile",
        "Set up your health goals and body metrics to get personalized recommendations."
      );
    }
  }, [profile, showInfo]);

  // Loading state
  if (profileLoading || goalsLoading) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (profileError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load your profile. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Profile incomplete state
  if (profile && !profile.height) {
    return <ProfileIncompleteView profile={profile} />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {authUser?.firstName || profile?.name || "User"}! 👋
        </h1>
        <p className="text-green-100 mb-4">{today}</p>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/scan">
            <Button variant="secondary" className="w-full sm:w-auto">
              <Scan className="mr-2 h-4 w-4" />
              Scan Barcode
            </Button>
          </Link>
          <Link href="/camera">
            <Button
              variant="outline"
              className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-green-600"
            >
              <Camera className="mr-2 h-4 w-4" />
              Take Photo
            </Button>
          </Link>
          <Link href="/add-food">
            <Button
              variant="outline"
              className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-green-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Food
            </Button>
          </Link>
        </div>
      </div>

      {/* Daily Progress Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <NutritionCard
          title="Calories"
          current={mockIntake.calories}
          target={dailyGoals.calories}
          icon={Target}
          unit=""
        />
        <NutritionCard
          title="Protein"
          current={mockIntake.protein}
          target={dailyGoals.protein}
          icon={TrendingUp}
          unit="g"
        />
        <NutritionCard
          title="Carbs"
          current={mockIntake.carbohydrates}
          target={dailyGoals.carbohydrates}
          icon={CalendarDays}
          unit="g"
        />
        <NutritionCard
          title="Fat"
          current={mockIntake.fat}
          target={dailyGoals.fat}
          icon={Target}
          unit="g"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Meals */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["Breakfast", "Lunch", "Dinner", "Snacks"].map((meal) => (
                <MealRow
                  key={meal}
                  meal={meal}
                  hasItems={meal === "Breakfast"}
                  calories={meal === "Breakfast" ? 324 : 0}
                />
              ))}
            </div>
            <Link href="/add-food">
              <Button className="w-full mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Food
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Stats & Profile Info */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <StatRow
                  label="Current Streak"
                  value="5 days 🔥"
                  variant="secondary"
                />
                <StatRow
                  label="Water Intake"
                  value={`${mockIntake.water}ml / ${dailyGoals.water}ml`}
                />
                <StatRow
                  label="Foods Scanned"
                  value="47 this week"
                  variant="outline"
                />
                <StatRow
                  label="Goals Met"
                  value="3/4 today"
                  variant="secondary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Profile Summary */}
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Goal</span>
                    <Badge variant="secondary">
                      {profile.dietaryGoals.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Activity Level</span>
                    <span className="text-sm">
                      {profile.activityLevel.toLowerCase()}
                    </span>
                  </div>
                  {profile.height && profile.weight && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">BMI</span>
                      <span className="text-sm">
                        {(
                          profile.weight / Math.pow(profile.height / 100, 2)
                        ).toFixed(1)}
                      </span>
                    </div>
                  )}
                  <Link href="/settings">
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      Update Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function NutritionCard({
  title,
  current,
  target,
  icon: Icon,
  unit,
}: {
  title: string;
  current: number;
  target: number;
  icon: any;
  unit: string;
}) {
  const { getProgressPercentage } = useNutritionStore();
  const progress = getProgressPercentage(current, target);
  const remaining = Math.max(0, target - current);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {current} / {target}
          {unit}
        </div>
        <Progress value={progress} className="mt-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {remaining}
          {unit} remaining
        </p>
      </CardContent>
    </Card>
  );
}

function MealRow({
  meal,
  hasItems,
  calories,
}: {
  meal: string;
  hasItems: boolean;
  calories: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium">{meal[0]}</span>
        </div>
        <div>
          <p className="font-medium">{meal}</p>
          <p className="text-sm text-muted-foreground">
            {hasItems ? "2 items" : "0 items"}
          </p>
        </div>
      </div>
      <Badge variant={hasItems ? "default" : "outline"}>
        {hasItems ? `${calories} cal` : "Empty"}
      </Badge>
    </div>
  );
}

function StatRow({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string;
  variant?: "default" | "secondary" | "outline";
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium">{label}</span>
      {variant === "default" ? (
        <span className="text-sm">{value}</span>
      ) : (
        <Badge variant={variant as any}>{value}</Badge>
      )}
    </div>
  );
}

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

// Profile incomplete view
function ProfileIncompleteView({ profile }: { profile: any }) {
  return (
    <div className="space-y-6">
      <Alert>
        <User className="h-4 w-4" />
        <AlertDescription>
          Complete your profile setup to get personalized nutrition
          recommendations and accurate calorie goals.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            We need a few more details to provide you with personalized
            nutrition tracking:
          </p>
          <ul className="text-sm space-y-1">
            <li>• Height and weight for accurate calorie calculations</li>
            <li>• Activity level for daily energy needs</li>
            <li>• Health goals for customized recommendations</li>
          </ul>
          <Link href="/onboarding">
            <Button className="w-full">
              <User className="mr-2 h-4 w-4" />
              Complete Profile Setup
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
