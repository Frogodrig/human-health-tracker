// Weekly nutrition breakdown chart
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface NutritionChartProps {
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

export function NutritionChart({ data }: NutritionChartProps) {
  // Format data for chart
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbohydrates,
    fat: item.fat,
    caloriesGoal: item.caloriesGoal,
    proteinGoal: item.proteinGoal,
    carbsGoal: item.carbsGoal,
    fatGoal: item.fatGoal,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#666" fontSize={12} />
          <YAxis stroke="#666" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Legend />

          {/* Actual intake lines */}
          <Line
            type="monotone"
            dataKey="calories"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
            name="Calories"
          />
          <Line
            type="monotone"
            dataKey="protein"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
            name="Protein (g)"
          />
          <Line
            type="monotone"
            dataKey="carbs"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
            name="Carbs (g)"
          />
          <Line
            type="monotone"
            dataKey="fat"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
            name="Fat (g)"
          />

          {/* Goal lines (dashed) */}
          <Line
            type="monotone"
            dataKey="caloriesGoal"
            stroke="#10b981"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="Calorie Goal"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
