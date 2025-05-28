// Analytics dashboard
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnalytics } from "@/hooks/use-analytics";
import { NutritionChart } from "@/components/charts/nutrition-chart";
import { ProgressChart } from "@/components/charts/progress-chart";
import { CaloriesTrendChart } from "@/components/charts/calories-trend-chart";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Award,
  Activity,
  Zap,
  BarChart3,
} from "lucide-react";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");
  const {
    analyticsData,
    weeklyData,
    streakData,
    goalProgress,
    loading,
    error,
    fetchAnalytics,
  } = useAnalytics(timeRange);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, timeRange]);

  if (loading) {
    return <AnalyticsLoading />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-gray-600">
            Track your nutrition progress and trends
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Daily Average"
          value={analyticsData?.dailyAverage || 0}
          unit="calories"
          icon={Activity}
          trend={12}
          color="blue"
        />
        <MetricCard
          title="Goal Achievement"
          value={analyticsData?.goalAchievement || 0}
          unit="%"
          icon={Target}
          trend={5}
          color="green"
        />
        <MetricCard
          title="Foods Logged"
          value={analyticsData?.totalFoodsLogged || 0}
          unit="items"
          icon={BarChart3}
          trend={-2}
          color="purple"
        />
        <MetricCard
          title="Current Streak"
          value={streakData.current}
          unit="days"
          icon={Zap}
          trend={8}
          color="orange"
        />
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="nutrition" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="streaks">Streaks</TabsTrigger>
        </TabsList>

        {/* Nutrition Tab */}
        <TabsContent value="nutrition" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Weekly Nutrition Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Nutrition Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyData && <NutritionChart data={weeklyData} />}
              </CardContent>
            </Card>

            {/* Goal Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Current Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {goalProgress.map((goal, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{goal.name}</span>
                      <span className="text-sm text-gray-600">
                        {goal.current}/{goal.target} {goal.unit}
                      </span>
                    </div>
                    <Progress value={goal.percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{goal.percentage}% complete</span>
                      <span>
                        {goal.remaining} {goal.unit} remaining
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Macro Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Average Macro Distribution (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <MacroDistributionChart weeklyData={weeklyData} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Goal Achievement Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyData && <ProgressChart data={weeklyData} />}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Best Performing Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <BestDaysTable weeklyData={weeklyData} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Areas for Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImprovementSuggestions goalProgress={goalProgress} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calorie Intake Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyData && <CaloriesTrendChart data={weeklyData} />}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <TrendCard
              title="Average Daily Calories"
              current={1847}
              previous={1923}
              timeframe="vs last week"
            />
            <TrendCard
              title="Protein Intake"
              current={125}
              previous={118}
              timeframe="vs last week"
              unit="g"
            />
            <TrendCard
              title="Goal Achievement"
              current={76}
              previous={68}
              timeframe="vs last week"
              unit="%"
            />
          </div>
        </TabsContent>

        {/* Streaks Tab */}
        <TabsContent value="streaks" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StreakCard
              title="Current Streak"
              value={streakData.current}
              subtitle="consecutive days"
              icon="🔥"
              color="orange"
            />
            <StreakCard
              title="Longest Streak"
              value={streakData.longest}
              subtitle="personal best"
              icon="🏆"
              color="yellow"
            />
            <StreakCard
              title="This Week"
              value={streakData.thisWeek}
              subtitle="out of 7 days"
              icon="📅"
              color="blue"
            />
            <StreakCard
              title="This Month"
              value={streakData.thisMonth}
              subtitle="days logged"
              icon="📊"
              color="green"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Streak Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <StreakCalendar />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: number;
  unit: string;
  icon: any;
  trend: number;
  color: string;
}) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-100",
    green: "text-green-600 bg-green-100",
    purple: "text-purple-600 bg-purple-100",
    orange: "text-orange-600 bg-orange-100",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div
            className={`p-2 rounded-full ${
              colorClasses[color as keyof typeof colorClasses]
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <Badge
            variant={trend > 0 ? "default" : "secondary"}
            className="text-xs"
          >
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {Math.abs(trend)}%
          </Badge>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold">
            {value.toLocaleString()} {unit}
          </div>
          <p className="text-sm text-gray-600 mt-1">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TrendCard({
  title,
  current,
  previous,
  timeframe,
  unit = "",
}: {
  title: string;
  current: number;
  previous: number;
  timeframe: string;
  unit?: string;
}) {
  const change = current - previous;
  const percentChange = ((change / previous) * 100).toFixed(1);
  const isPositive = change > 0;

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="mt-2">
          <div className="text-2xl font-bold">
            {current.toLocaleString()}
            {unit}
          </div>
          <div
            className={`flex items-center mt-1 text-sm ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {percentChange}% {timeframe}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StreakCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="text-3xl mb-2">{icon}</div>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function MacroDistributionChart({ weeklyData }: { weeklyData: any[] | null }) {
  if (!weeklyData)
    return <div className="h-32 bg-gray-100 rounded animate-pulse" />;

  // Calculate average macros
  const avgProtein =
    weeklyData.reduce((sum, day) => sum + day.protein, 0) / weeklyData.length;
  const avgCarbs =
    weeklyData.reduce((sum, day) => sum + day.carbohydrates, 0) /
    weeklyData.length;
  const avgFat =
    weeklyData.reduce((sum, day) => sum + day.fat, 0) / weeklyData.length;

  const total = avgProtein + avgCarbs + avgFat;
  const proteinPerc = Math.round((avgProtein / total) * 100);
  const carbsPerc = Math.round((avgCarbs / total) * 100);
  const fatPerc = Math.round((avgFat / total) * 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-bold text-blue-600">{proteinPerc}%</div>
          <p className="text-sm">Protein</p>
          <p className="text-xs text-gray-600">{Math.round(avgProtein)}g avg</p>
        </div>
        <div>
          <div className="text-lg font-bold text-orange-600">{carbsPerc}%</div>
          <p className="text-sm">Carbs</p>
          <p className="text-xs text-gray-600">{Math.round(avgCarbs)}g avg</p>
        </div>
        <div>
          <div className="text-lg font-bold text-purple-600">{fatPerc}%</div>
          <p className="text-sm">Fat</p>
          <p className="text-xs text-gray-600">{Math.round(avgFat)}g avg</p>
        </div>
      </div>

      <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
        <div className="bg-blue-500" style={{ width: `${proteinPerc}%` }} />
        <div className="bg-orange-500" style={{ width: `${carbsPerc}%` }} />
        <div className="bg-purple-500" style={{ width: `${fatPerc}%` }} />
      </div>
    </div>
  );
}

function BestDaysTable({ weeklyData }: { weeklyData: any[] | null }) {
  if (!weeklyData)
    return <div className="h-32 bg-gray-100 rounded animate-pulse" />;

  const sortedDays = [...weeklyData]
    .map((day) => ({
      ...day,
      goalScore:
        (day.calories / day.caloriesGoal +
          day.protein / day.proteinGoal +
          day.carbohydrates / day.carbsGoal +
          day.fat / day.fatGoal) /
        4,
    }))
    .sort((a, b) => b.goalScore - a.goalScore)
    .slice(0, 3);

  return (
    <div className="space-y-3">
      {sortedDays.map((day, index) => (
        <div
          key={day.date}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                index === 0
                  ? "bg-yellow-500"
                  : index === 1
                  ? "bg-gray-400"
                  : "bg-orange-400"
              }`}
            >
              {index + 1}
            </div>
            <div>
              <p className="font-medium">
                {new Date(day.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="text-xs text-gray-600">
                {Math.round(day.goalScore * 100)}% goal achievement
              </p>
            </div>
          </div>
          <Badge variant="secondary">{day.calories} cal</Badge>
        </div>
      ))}
    </div>
  );
}

function ImprovementSuggestions({ goalProgress }: { goalProgress: any[] }) {
  const suggestions = goalProgress
    .filter((goal) => goal.percentage < 80)
    .slice(0, 3)
    .map((goal) => ({
      goal: goal.name,
      suggestion: getSuggestionForGoal(goal.name, goal.percentage),
    }));

  return (
    <div className="space-y-3">
      {suggestions.length === 0 ? (
        <div className="text-center py-8">
          <Award className="h-8 w-8 mx-auto text-green-500 mb-2" />
          <p className="text-sm text-gray-600">
            Great job! You&apos;re meeting all your goals.
          </p>
        </div>
      ) : (
        suggestions.map((item, index) => (
          <div key={index} className="p-3 bg-blue-50 rounded-lg">
            <p className="font-medium text-sm">{item.goal}</p>
            <p className="text-xs text-gray-600 mt-1">{item.suggestion}</p>
          </div>
        ))
      )}
    </div>
  );
}

function getSuggestionForGoal(goalName: string, percentage: number): string {
  if (goalName.includes("Protein")) {
    return "Try adding lean meats, eggs, or protein shakes to your meals.";
  }
  if (goalName.includes("Water")) {
    return "Set hourly reminders to drink water throughout the day.";
  }
  if (goalName.includes("Calories")) {
    return percentage < 50
      ? "Consider adding healthy snacks like nuts or fruits."
      : "You're close! Add a small healthy snack to reach your goal.";
  }
  return "Focus on consistency and small daily improvements.";
}

function StreakCalendar() {
  // Mock calendar showing streak days
  const days = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    hasEntry: Math.random() > 0.3, // 70% chance of having entry
    isToday: i === 15,
  }));

  return (
    <div className="grid grid-cols-7 gap-1">
      {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
        <div
          key={day}
          className="text-center text-xs font-medium text-gray-500 p-2"
        >
          {day}
        </div>
      ))}
      {days.map(({ day, hasEntry, isToday }) => (
        <div
          key={day}
          className={`
            aspect-square flex items-center justify-center text-xs rounded
            ${
              hasEntry ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
            }
            ${isToday ? "ring-2 ring-blue-500" : ""}
          `}
        >
          {day}
        </div>
      ))}
    </div>
  );
}

function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-64"></div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}
