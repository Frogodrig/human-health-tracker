// Macro distribution pie chart
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import React from "react";

interface Nutrient {
  name: string;
  value: number;
  color: string;
}

interface NutrientBreakdownPieChartProps {
  nutrients: Nutrient[];
  miscThreshold?: number; // club nutrients below this value as 'Other/Misc.'
}

export function NutrientBreakdownPieChart({
  nutrients,
  miscThreshold = 1, // grams
}: NutrientBreakdownPieChartProps) {
  // Club small nutrients as 'Other/Misc.'
  const major = nutrients.filter((n) => n.value >= miscThreshold);
  const miscTotal = nutrients
    .filter((n) => n.value < miscThreshold)
    .reduce((sum, n) => sum + n.value, 0);
  const data =
    miscTotal > 0
      ? [...major, { name: "Other/Misc.", value: miscTotal, color: "#a3a3a3" }]
      : major;

  // No label inside the pie chart
  const renderCustomizedLabel = () => null;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => {
              const total = data.reduce((sum, n) => sum + n.value, 0);
              const percent = total > 0 ? ((value as number) / total) * 100 : 0;
              return [`${value.toFixed(1)}g (${percent.toFixed(0)}%)`, name];
            }}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              fontSize: 13,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Keep MacroPieChart for backwards compatibility
interface MacroPieChartProps {
  protein: number;
  carbohydrates: number;
  fat: number;
}

export function MacroPieChart({
  protein,
  carbohydrates,
  fat,
}: MacroPieChartProps) {
  return (
    <NutrientBreakdownPieChart
      nutrients={[
        { name: "Protein", value: protein, color: "#3b82f6" },
        { name: "Carbohydrates", value: carbohydrates, color: "#f59e0b" },
        { name: "Fat", value: fat, color: "#8b5cf6" },
      ]}
    />
  );
}
