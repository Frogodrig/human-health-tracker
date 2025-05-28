// Goal achievement over time
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProgressChartProps {
  data: Array<{
    date: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    caloriesGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatGoal: number;
  }>;
}

export function ProgressChart({ data }: ProgressChartProps) {
  // Calculate goal achievement percentages
  const chartData = data.map((item) => {
    const calorieAchievement = Math.min(
      (item.calories / item.caloriesGoal) * 100,
      120
    );
    const proteinAchievement = Math.min(
      (item.protein / item.proteinGoal) * 100,
      120
    );
    const carbsAchievement = Math.min(
      (item.carbohydrates / item.carbsGoal) * 100,
      120
    );
    const fatAchievement = Math.min((item.fat / item.fatGoal) * 100, 120);

    const overallAchievement =
      (calorieAchievement +
        proteinAchievement +
        carbsAchievement +
        fatAchievement) /
      4;

    return {
      date: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      calories: Math.round(calorieAchievement),
      protein: Math.round(proteinAchievement),
      carbs: Math.round(carbsAchievement),
      fat: Math.round(fatAchievement),
      overall: Math.round(overallAchievement),
    };
  });

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#666" fontSize={12} />
          <YAxis
            stroke="#666"
            fontSize={12}
            domain={[0, 120]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
            formatter={(value: number) => [`${value}%`, ""]}
          />

          <Area
            type="monotone"
            dataKey="overall"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorOverall)"
            strokeWidth={2}
          />

          {/* Goal line at 100% */}
          <Area
            type="monotone"
            dataKey={() => 100}
            stroke="#ef4444"
            strokeDasharray="5 5"
            fill="none"
            strokeWidth={1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
