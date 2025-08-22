"use client";

import { useFoodRecognitionStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Clock, Trash2 } from "lucide-react";

export default function FoodHistoryPage() {
  const history = useFoodRecognitionStore((s) => s.history);
  const clearHistory = useFoodRecognitionStore((s) => s.clearHistory);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Food Recognition History</CardTitle>
          <Button
            variant="destructive"
            size="sm"
            onClick={clearHistory}
            disabled={history.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Clear
          </Button>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span
                role="img"
                aria-label="No results"
                className="text-5xl mb-2"
              >
                🍽️
              </span>
              <Alert className="text-center">
                No food recognition results yet. Try scanning some food!
              </Alert>
            </div>
          ) : (
            <ul className="space-y-4">
              {history.map((food, idx) => (
                <li
                  key={idx}
                  className="border rounded-lg p-4 bg-white/80 shadow-sm animate-fade-in"
                  aria-label={`Food: ${food.name}`}
                  tabIndex={0}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg">{food.name}</span>
                    <span className="text-xs text-gray-500">
                      ({Math.round(food.confidence * 100)}% confidence)
                    </span>
                  </div>
                  {food.nutrition ? (
                    <div className="mb-2">
                      <div className="font-semibold mb-1 text-sm">
                        Nutrition (per 100g)
                      </div>
                      <ul className="text-xs text-gray-700 space-y-1">
                        <li>
                          Calories:{" "}
                          <span className="font-bold">
                            {food.nutrition.calories}
                          </span>{" "}
                          kcal
                        </li>
                        <li>
                          Protein:{" "}
                          <span className="font-bold">
                            {food.nutrition.protein}
                          </span>{" "}
                          g
                        </li>
                        <li>
                          Carbs:{" "}
                          <span className="font-bold">
                            {food.nutrition.carbohydrates}
                          </span>{" "}
                          g
                        </li>
                        <li>
                          Fat:{" "}
                          <span className="font-bold">
                            {food.nutrition.fat}
                          </span>{" "}
                          g
                        </li>
                      </ul>
                      <div className="flex items-center gap-2 mt-2">
                        <label htmlFor={`serving-${idx}`} className="text-xs">
                          Serving size:
                        </label>
                        <input
                          id={`serving-${idx}`}
                          type="number"
                          min="1"
                          max="1000"
                          defaultValue={100}
                          className="w-16 px-1 py-0.5 border rounded text-xs"
                          aria-label="Serving size (not implemented)"
                        />
                        <span className="text-xs">g</span>
                      </div>
                      <button
                        className="mt-2 w-full bg-green-600 text-white rounded py-1 text-xs font-medium hover:bg-green-700 transition"
                        aria-label="Add to Diary (not implemented)"
                      >
                        Add to Diary
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 mb-1">
                      No nutrition data available
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" /> {new Date().toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
