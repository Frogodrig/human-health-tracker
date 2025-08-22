import React from "react";

// Map nutrient keys to display names and units
const NUTRIENT_LABELS: Record<string, { label: string; unit: string }> = {
  calories: { label: "Calories", unit: "" },
  fat: { label: "Total Fat", unit: "g" },
  saturatedFat: { label: "Saturated Fat", unit: "g" },
  transFat: { label: "Trans Fat", unit: "g" },
  monounsaturatedFat: { label: "Monounsaturated Fat", unit: "g" },
  polyunsaturatedFat: { label: "Polyunsaturated Fat", unit: "g" },
  cholesterol: { label: "Cholesterol", unit: "mg" },
  sodium: { label: "Sodium", unit: "mg" },
  carbohydrates: { label: "Total Carbohydrate", unit: "g" },
  fiber: { label: "Dietary Fiber", unit: "g" },
  sugars: { label: "Total Sugars", unit: "g" },
  protein: { label: "Protein", unit: "g" },
  calcium: { label: "Calcium", unit: "mg" },
  iron: { label: "Iron", unit: "mg" },
  potassium: { label: "Potassium", unit: "mg" },
  vitaminA: { label: "Vitamin A", unit: "µg" },
  vitaminC: { label: "Vitamin C", unit: "mg" },
  vitaminD: { label: "Vitamin D", unit: "µg" },
  vitaminB6: { label: "Vitamin B6", unit: "mg" },
  vitaminB12: { label: "Vitamin B12", unit: "µg" },
  vitaminE: { label: "Vitamin E", unit: "mg" },
  magnesium: { label: "Magnesium", unit: "mg" },
  zinc: { label: "Zinc", unit: "mg" },
  sucrose: { label: "Sucrose", unit: "g" },
  fructose: { label: "Fructose", unit: "g" },
  lactose: { label: "Lactose", unit: "g" },
  starch: { label: "Starch", unit: "g" },
  alcohol: { label: "Alcohol", unit: "g" },
};

export interface NutritionLabelTableProps {
  nutrients: Record<string, number | undefined>;
  servingSize?: string;
  netWeight?: number;
}

export default function NutritionLabelTable({
  nutrients,
  servingSize = "1 serving",
  netWeight,
}: NutritionLabelTableProps) {
  // FDA-style order for major nutrients
  const order = [
    "calories",
    "fat",
    "saturatedFat",
    "transFat",
    "monounsaturatedFat",
    "polyunsaturatedFat",
    "cholesterol",
    "sodium",
    "carbohydrates",
    "fiber",
    "sugars",
    "protein",
    "calcium",
    "iron",
    "potassium",
    "vitaminA",
    "vitaminC",
    "vitaminD",
    "vitaminB6",
    "vitaminB12",
    "vitaminE",
    "magnesium",
    "zinc",
    "sucrose",
    "fructose",
    "lactose",
    "starch",
    "alcohol",
  ];

  // Build rows in FDA order, skipping undefined and zero values (after rounding)
  const rows = order
    .map((key) => {
      const value = nutrients[key];
      if (typeof value !== "number" || !NUTRIENT_LABELS[key]) return null;
      // Only include if value rounded to 2 decimals is not 0.00
      if (Number(value.toFixed(2)) === 0) return null;
      return { key, ...NUTRIENT_LABELS[key], value };
    })
    .filter(Boolean);

  if (rows.length === 0) return null;

  // Calculate servings per container if possible
  let servingsPerContainer: number | undefined = undefined;
  // Try to extract serving size as a number (e.g., '30 g' or '1 serving')
  const servingSizeMatch = servingSize.match(/([\d.]+)/);
  const servingSizeNum = servingSizeMatch
    ? parseFloat(servingSizeMatch[1])
    : undefined;
  if (
    netWeight &&
    servingSizeNum &&
    isFinite(netWeight) &&
    isFinite(servingSizeNum) &&
    servingSizeNum > 0
  ) {
    servingsPerContainer = Math.round((netWeight / servingSizeNum) * 2) / 2;
  }

  return (
    <div className="max-w-xs w-full bg-white border-4 border-black p-4 font-sans text-black select-none shadow-lg">
      {/* Header */}
      <div className="text-3xl font-extrabold tracking-tight border-b-8 border-black pb-1 mb-1">
        Nutrition Facts
      </div>
      {/* Serving info */}
      <div className="flex justify-between text-sm font-semibold mb-1">
        <span>Serving size</span>
        <span>{servingSize}</span>
      </div>
      {servingsPerContainer &&
        servingsPerContainer >= 0.5 &&
        isFinite(servingsPerContainer) && (
          <div className="flex justify-between text-xs mb-2">
            <span>Servings per container</span>
            <span>{servingsPerContainer}</span>
          </div>
        )}
      {/* Thick line */}
      <div className="border-b-4 border-black my-1" />
      {/* Calories row */}
      {rows[0]?.key === "calories" && (
        <div className="flex justify-between items-end text-2xl font-bold mb-1">
          <span>Calories</span>
          <span>{Math.round(rows[0].value)}</span>
        </div>
      )}
      {/* Thin line */}
      <div className="border-b border-black my-1" />
      {/* Main nutrients */}
      <div className="text-xs">
        {rows.slice(1).map((row) => {
          if (!row) return null;
          const isSub = [
            "saturatedFat",
            "transFat",
            "monounsaturatedFat",
            "polyunsaturatedFat",
            "fiber",
            "sugars",
          ].includes(row.key);
          return (
            <div
              key={row.key}
              className={
                isSub
                  ? "flex justify-between pl-4 font-normal"
                  : "flex justify-between font-bold"
              }
            >
              <span>{row.label}</span>
              <span>
                {row.value.toFixed(2)}
                {row.unit && <span className="ml-0.5">{row.unit}</span>}
              </span>
            </div>
          );
        })}
      </div>
      {/* Thick line at bottom */}
      <div className="border-b-4 border-black mt-2" />
      {/* Footer note */}
      <div className="text-[10px] text-gray-700 mt-1">
        * Not a significant source of all possible nutrients.
      </div>
    </div>
  );
}
