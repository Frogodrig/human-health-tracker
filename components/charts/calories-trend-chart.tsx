// Calorie intake trend with prediction
"use client";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CaloriesTrendChartProps {
  data: Array<{
    date: string;
    calories: number;
    caloriesGoal: number;
  }>;
}

export function CaloriesTrendChart({ data }: CaloriesTrendChartProps) {
  // Calculate moving average for trend
  const calculateMovingAverage = (arr: number[], window: number) => {
    return arr.map((_, index) => {
      const start = Math.max(0, index - window + 1);
      const subset = arr.slice(start, index + 1);
      return subset.reduce((sum, val) => sum + val, 0) / subset.length;
    });
  };

  const calories = data.map((d) => d.calories);
  const movingAverage = calculateMovingAverage(calories, 3);

  const chartData = data.map((item, index) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    calories: item.calories,
    goal: item.caloriesGoal,
    trend: Math.round(movingAverage[index]),
    surplus:
      item.calories > item.caloriesGoal ? item.calories - item.caloriesGoal : 0,
    deficit:
      item.calories < item.caloriesGoal ? item.caloriesGoal - item.calories : 0,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorSurplus" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorDeficit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>

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

          {/* Goal line */}
          <Line
            type="monotone"
            dataKey="goal"
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Daily Goal"
          />

          {/* Actual calories */}
          <Line
            type="monotone"
            dataKey="calories"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: "#10b981", strokeWidth: 2, r: 5 }}
            name="Actual Intake"
          />

          {/* Trend line */}
          <Line
            type="monotone"
            dataKey="trend"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            name="3-Day Trend"
          />

          {/* Surplus area (above goal) */}
          <Area
            type="monotone"
            dataKey="surplus"
            stroke="#ef4444"
            fill="url(#colorSurplus)"
            stackId="1"
            name="Surplus"
          />

          {/* Deficit area (below goal) */}
          <Area
            type="monotone"
            dataKey="deficit"
            stroke="#3b82f6"
            fill="url(#colorDeficit)"
            stackId="2"
            name="Deficit"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
