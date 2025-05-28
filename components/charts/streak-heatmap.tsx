// Activity streak heatmap
"use client";

interface StreakHeatmapProps {
  data: Array<{
    date: string;
    hasEntry: boolean;
    caloriesLogged: number;
  }>;
  weeks?: number;
}

export function StreakHeatmap({ data, weeks = 12 }: StreakHeatmapProps) {
  // Generate calendar grid for the specified number of weeks
  const generateCalendarData = () => {
    const result = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (weeks * 7 - 1));

    for (let i = 0; i < weeks * 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dateString = currentDate.toISOString().split("T")[0];
      const dayData = data.find((d) => d.date === dateString);

      result.push({
        date: currentDate,
        dateString,
        hasEntry: dayData?.hasEntry || false,
        caloriesLogged: dayData?.caloriesLogged || 0,
        isToday: currentDate.toDateString() === today.toDateString(),
        isFuture: currentDate > today,
      });
    }

    return result;
  };

  const calendarData = generateCalendarData();

  // Group by weeks
  const weekGroups = [];
  for (let i = 0; i < weeks; i++) {
    weekGroups.push(calendarData.slice(i * 7, (i + 1) * 7));
  }

  const getIntensityClass = (
    hasEntry: boolean,
    caloriesLogged: number,
    isFuture: boolean
  ) => {
    if (isFuture) return "bg-gray-100";
    if (!hasEntry) return "bg-gray-200";

    if (caloriesLogged < 1000) return "bg-green-200";
    if (caloriesLogged < 1500) return "bg-green-300";
    if (caloriesLogged < 2000) return "bg-green-400";
    return "bg-green-500";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">
          Activity Heatmap (Last {weeks} weeks)
        </h3>
        <div className="flex items-center space-x-2 text-xs">
          <span>Less</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Day labels */}
        {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 p-1"
          >
            {day}
          </div>
        ))}

        {/* Calendar grid */}
        {calendarData.map(
          ({
            date,
            hasEntry,
            caloriesLogged,
            isToday,
            isFuture,
            dateString,
          }) => (
            <div
              key={dateString}
              className={`
              aspect-square rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-blue-300
              ${getIntensityClass(hasEntry, caloriesLogged, isFuture)}
              ${isToday ? "ring-2 ring-blue-500" : ""}
            `}
              title={`${date.toLocaleDateString()}: ${
                hasEntry ? `${caloriesLogged} calories` : "No entry"
              }`}
            />
          )
        )}
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <div>
          Total entries: {calendarData.filter((d) => d.hasEntry).length} days
        </div>
        <div>Current streak: {calculateCurrentStreak(calendarData)} days</div>
      </div>
    </div>
  );
}

function calculateCurrentStreak(data: any[]): number {
  let streak = 0;
  const sortedData = [...data].reverse(); // Start from most recent

  for (const day of sortedData) {
    if (day.isFuture) continue;
    if (day.hasEntry) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
