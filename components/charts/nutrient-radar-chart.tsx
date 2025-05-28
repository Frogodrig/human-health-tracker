// Nutrient profile radar chart
"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface NutrientRadarChartProps {
  data: {
    calories: { current: number; goal: number };
    protein: { current: number; goal: number };
    carbohydrates: { current: number; goal: number };
    fat: { current: number; goal: number };
    fiber: { current: number; goal: number };
    sodium: { current: number; goal: number };
  };
}

export function NutrientRadarChart({ data }: NutrientRadarChartProps) {
  const radarData = [
    {
      nutrient: "Calories",
      current: Math.min(
        (data.calories.current / data.calories.goal) * 100,
        150
      ),
      goal: 100,
    },
    {
      nutrient: "Protein",
      current: Math.min((data.protein.current / data.protein.goal) * 100, 150),
      goal: 100,
    },
    {
      nutrient: "Carbs",
      current: Math.min(
        (data.carbohydrates.current / data.carbohydrates.goal) * 100,
        150
      ),
      goal: 100,
    },
    {
      nutrient: "Fat",
      current: Math.min((data.fat.current / data.fat.goal) * 100, 150),
      goal: 100,
    },
    {
      nutrient: "Fiber",
      current: Math.min((data.fiber.current / data.fiber.goal) * 100, 150),
      goal: 100,
    },
    {
      nutrient: "Sodium",
      current: Math.min((data.sodium.current / data.sodium.goal) * 100, 150),
      goal: 100,
    },
  ];

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="nutrient"
            tick={{ fontSize: 12, fill: "#666" }}
          />
          <PolarRadiusAxis
            domain={[0, 150]}
            tick={{ fontSize: 10, fill: "#666" }}
            tickFormatter={(value) => `${value}%`}
          />
          <Radar
            name="Goal"
            dataKey="goal"
            stroke="#9ca3af"
            fill="#9ca3af"
            fillOpacity={0.1}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <Radar
            name="Current"
            dataKey="current"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
