import { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: LucideIcon;
  trend: number;
  color: "blue" | "green" | "purple" | "orange";
}

export interface TrendCardProps {
  title: string;
  current: number;
  previous: number;
  timeframe: string;
  unit?: string;
}

export interface StreakCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  color: string;
}

export interface ChartProps {
  weeklyData: Array<{
    date: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    caloriesGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatGoal: number;
  }> | null;
}

export interface GoalTipProps {
  icon: string;
  title: string;
  description: string;
}
