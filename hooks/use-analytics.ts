// Analytics data management
import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

interface AnalyticsData {
  dailyAverage: number;
  goalAchievement: number;
  totalFoodsLogged: number;
  weeklyTrend: number;
}

interface WeeklyData {
  date: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  caloriesGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

interface StreakData {
  current: number;
  longest: number;
  thisWeek: number;
  thisMonth: number;
}

interface GoalProgress {
  name: string;
  current: number;
  target: number;
  percentage: number;
  remaining: number;
  unit: string;
}

interface UseAnalytics {
  analyticsData: AnalyticsData | null;
  weeklyData: WeeklyData[] | null;
  monthlyData: any[] | null;
  streakData: StreakData;
  goalProgress: GoalProgress[];
  loading: boolean;
  error: string | null;
  fetchAnalytics: () => Promise<void>;
}

export function useAnalytics(timeRange: string): UseAnalytics {
  const { user } = useUser();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [weeklyData, setWeeklyData] = useState<WeeklyData[] | null>(null);
  const [monthlyData, setMonthlyData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration
  const mockWeeklyData: WeeklyData[] = [
    {
      date: "2024-01-01",
      calories: 1850,
      protein: 120,
      carbohydrates: 200,
      fat: 65,
      caloriesGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 67,
    },
    {
      date: "2024-01-02",
      calories: 1920,
      protein: 135,
      carbohydrates: 210,
      fat: 70,
      caloriesGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 67,
    },
    {
      date: "2024-01-03",
      calories: 1780,
      protein: 115,
      carbohydrates: 190,
      fat: 60,
      caloriesGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 67,
    },
    {
      date: "2024-01-04",
      calories: 2100,
      protein: 160,
      carbohydrates: 240,
      fat: 80,
      caloriesGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 67,
    },
    {
      date: "2024-01-05",
      calories: 1890,
      protein: 125,
      carbohydrates: 205,
      fat: 68,
      caloriesGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 67,
    },
    {
      date: "2024-01-06",
      calories: 1950,
      protein: 140,
      carbohydrates: 220,
      fat: 72,
      caloriesGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 67,
    },
    {
      date: "2024-01-07",
      calories: 1820,
      protein: 110,
      carbohydrates: 195,
      fat: 62,
      caloriesGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 250,
      fatGoal: 67,
    },
  ];

  const streakData: StreakData = {
    current: 12,
    longest: 28,
    thisWeek: 6,
    thisMonth: 24,
  };

  const goalProgress: GoalProgress[] = [
    {
      name: "Daily Calories",
      current: 1847,
      target: 2000,
      percentage: 92,
      remaining: 153,
      unit: "cal",
    },
    {
      name: "Protein",
      current: 125,
      target: 150,
      percentage: 83,
      remaining: 25,
      unit: "g",
    },
    {
      name: "Water Intake",
      current: 1.8,
      target: 2.0,
      percentage: 90,
      remaining: 0.2,
      unit: "L",
    },
    {
      name: "Exercise Days",
      current: 4,
      target: 5,
      percentage: 80,
      remaining: 1,
      unit: "days",
    },
  ];

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // In a real app, these would be API calls
      // const response = await fetch(`/api/analytics?range=${timeRange}`);
      // const data = await response.json();

      // Mock API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Set mock data
      setAnalyticsData({
        dailyAverage: 1847,
        goalAchievement: 76,
        totalFoodsLogged: 94,
        weeklyTrend: 12,
      });

      setWeeklyData(mockWeeklyData);
      setMonthlyData([]); // Would populate with monthly aggregates
    } catch (err) {
      setError("Failed to load analytics data");
      console.error("Analytics error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, timeRange]);

  return {
    analyticsData,
    weeklyData,
    monthlyData,
    streakData,
    goalProgress,
    loading,
    error,
    fetchAnalytics,
  };
}
