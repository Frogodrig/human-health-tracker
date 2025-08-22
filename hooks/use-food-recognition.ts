// hooks/use-food-recognition.ts
// TODO: Re-implement food recognition using Clarifai API or another service. All TensorFlow.js code has been removed.
import { useState, useCallback } from "react";
import { recognizeFood } from "@/lib/api/api";
import type { DetectedFood } from "@/types/ml";
import { mapFoodToNutrition } from "@/lib/utils/nutrition-db";
import { useFoodRecognitionStore } from "@/store";

export function useFoodRecognition() {
  const [isLoading, setIsLoading] = useState(false);
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const addResult = useFoodRecognitionStore((s) => s.addResult);

  const detectFoods = useCallback(
    async (imageData: string): Promise<DetectedFood[]> => {
      setIsLoading(true);
      setError(null);
      setConfidence(0);
      setProcessingTime(0);
      const start = performance.now();
      try {
        const results = await recognizeFood(imageData);
        // Await nutrition mapping for each detected food
        const foods: DetectedFood[] = await Promise.all(
          results.map(async (item) => {
            const nutrition = await mapFoodToNutrition(item.name);
            return {
              ...item,
              nutrition: nutrition || undefined,
            };
          })
        );
        setDetectedFoods(foods);
        setConfidence(foods.length > 0 ? foods[0].confidence : 0);
        setProcessingTime(performance.now() - start);
        setIsLoading(false);
        // Save each detected food to history
        foods.forEach(addResult);
        return foods;
      } catch (err: unknown) {
        setError((err as Error).message || "Unknown error");
        setIsLoading(false);
        return [];
      }
    },
    [addResult]
  );

  const clearDetections = useCallback(() => {
    setDetectedFoods([]);
    setConfidence(0);
    setError(null);
    setProcessingTime(0);
  }, []);

  return {
    detectFoods,
    isLoading,
    detectedFoods,
    error,
    confidence,
    clearDetections,
    processingTime,
  };
}
