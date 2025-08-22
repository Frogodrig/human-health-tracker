import React, { useState } from "react";

interface NutrientBadgeProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  colorClass?: string; // Tailwind color class for background/text
}

export default function NutrientBadge({
  icon,
  label,
  value,
  unit = "",
  colorClass = "bg-gray-100 text-gray-800",
}: NutrientBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div
      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm text-sm font-medium ${colorClass}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      tabIndex={0}
      aria-describedby={`tooltip-${label.replace(/\s+/g, "-")}`}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{label}:</span>
      <span className="font-bold">
        {value}
        {unit}
      </span>
      {showTooltip && (
        <span
          id={`tooltip-${label.replace(/\s+/g, "-")}`}
          role="tooltip"
          className="absolute z-10 left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded bg-black text-white text-xs whitespace-nowrap shadow-lg"
        >
          {label}
        </span>
      )}
    </div>
  );
}
