// TensorFlow.js food recognition hook
import { useState, useCallback, useRef, useEffect } from "react";
import * as cocossd from "@tensorflow-models/coco-ssd";
import type { DetectedFood, FoodNutritionDB } from "@/types/ml";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

// Register WebGL backend
tf.setBackend("webgl");

// Food nutrition database (expanded with Indian foods and more fruits)
const FOOD_NUTRITION_DB: FoodNutritionDB = {
  // Fruits
  apple: {
    calories: 52,
    protein: 0.3,
    carbohydrates: 14,
    fat: 0.2,
    serving: { size: 182, unit: "g" },
  },
  banana: {
    calories: 89,
    protein: 1.1,
    carbohydrates: 23,
    fat: 0.3,
    serving: { size: 118, unit: "g" },
  },
  orange: {
    calories: 47,
    protein: 0.9,
    carbohydrates: 12,
    fat: 0.1,
    serving: { size: 131, unit: "g" },
  },
  mango: {
    calories: 60,
    protein: 0.8,
    carbohydrates: 15,
    fat: 0.4,
    serving: { size: 165, unit: "g" },
  },
  papaya: {
    calories: 43,
    protein: 0.5,
    carbohydrates: 11,
    fat: 0.3,
    serving: { size: 145, unit: "g" },
  },
  pomegranate: {
    calories: 83,
    protein: 1.7,
    carbohydrates: 19,
    fat: 1.2,
    serving: { size: 174, unit: "g" },
  },
  grapes: {
    calories: 69,
    protein: 0.6,
    carbohydrates: 18,
    fat: 0.2,
    serving: { size: 151, unit: "g" },
  },
  watermelon: {
    calories: 30,
    protein: 0.6,
    carbohydrates: 7.6,
    fat: 0.2,
    serving: { size: 280, unit: "g" },
  },

  // Indian Foods
  roti: {
    calories: 120,
    protein: 3.1,
    carbohydrates: 22,
    fat: 1.7,
    serving: { size: 60, unit: "g" },
  },
  naan: {
    calories: 262,
    protein: 8.9,
    carbohydrates: 45,
    fat: 3.7,
    serving: { size: 90, unit: "g" },
  },
  dal: {
    calories: 116,
    protein: 7.5,
    carbohydrates: 20,
    fat: 0.4,
    serving: { size: 100, unit: "g" },
  },
  curry: {
    calories: 150,
    protein: 8,
    carbohydrates: 12,
    fat: 8,
    serving: { size: 200, unit: "g" },
  },
  biryani: {
    calories: 350,
    protein: 12,
    carbohydrates: 45,
    fat: 12,
    serving: { size: 250, unit: "g" },
  },
  samosa: {
    calories: 262,
    protein: 4.2,
    carbohydrates: 31,
    fat: 13,
    serving: { size: 100, unit: "g" },
  },
  pakora: {
    calories: 140,
    protein: 3.5,
    carbohydrates: 18,
    fat: 6.5,
    serving: { size: 50, unit: "g" },
  },
  dosa: {
    calories: 133,
    protein: 3.7,
    carbohydrates: 24,
    fat: 2.9,
    serving: { size: 100, unit: "g" },
  },
  idli: {
    calories: 39,
    protein: 2.2,
    carbohydrates: 7.9,
    fat: 0.2,
    serving: { size: 50, unit: "g" },
  },
  vada: {
    calories: 147,
    protein: 4.2,
    carbohydrates: 18,
    fat: 6.8,
    serving: { size: 50, unit: "g" },
  },

  // Common Foods
  sandwich: {
    calories: 250,
    protein: 12,
    carbohydrates: 30,
    fat: 10,
    serving: { size: 150, unit: "g" },
  },
  pizza: {
    calories: 285,
    protein: 12,
    carbohydrates: 36,
    fat: 10,
    serving: { size: 107, unit: "g" },
  },
  burger: {
    calories: 295,
    protein: 17,
    carbohydrates: 28,
    fat: 14,
    serving: { size: 150, unit: "g" },
  },
  salad: {
    calories: 33,
    protein: 3,
    carbohydrates: 6,
    fat: 0.3,
    serving: { size: 85, unit: "g" },
  },
  pasta: {
    calories: 220,
    protein: 8,
    carbohydrates: 44,
    fat: 1.1,
    serving: { size: 140, unit: "g" },
  },
};

// Map COCO-SSD classes to our food classes (expanded)
const COCO_TO_FOOD_MAP: Record<string, string> = {
  // Fruits
  apple: "apple",
  orange: "orange",
  banana: "banana",
  mango: "mango",
  papaya: "papaya",
  pomegranate: "pomegranate",
  grapes: "grapes",
  watermelon: "watermelon",

  // Indian Foods
  bread: "roti", // Map bread to roti
  bowl: "dal", // Map bowl to dal
  plate: "curry", // Map plate to curry
  rice: "biryani", // Map rice to biryani
  pastry: "samosa", // Map pastry to samosa
  donut: "pakora", // Map donut to pakora
  pancake: "dosa", // Map pancake to dosa
  muffin: "idli", // Map muffin to idli
  cookie: "vada", // Map cookie to vada

  // Common Foods
  sandwich: "sandwich",
  pizza: "pizza",
  hamburger: "burger",
  cake: "cake",
};

// Confidence thresholds for different food categories
const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8, // High confidence threshold for common foods
  MEDIUM: 0.6, // Medium confidence threshold for fruits
  LOW: 0.4, // Low confidence threshold for Indian foods (due to mapping complexity)
};

interface UseFoodRecognition {
  detectFoods: (imageData: string) => Promise<DetectedFood[]>;
  isLoading: boolean;
  detectedFoods: DetectedFood[];
  error: string | null;
  confidence: number;
  clearDetections: () => void;
  modelLoaded: boolean;
}

export function useFoodRecognition(): UseFoodRecognition {
  const [isLoading, setIsLoading] = useState(false);
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);

  const modelRef = useRef<cocossd.ObjectDetection | null>(null);
  const loadingRef = useRef(false);

  // Load the COCO-SSD model
  const loadModel = useCallback(async () => {
    if (modelRef.current || loadingRef.current) return;

    loadingRef.current = true;
    try {
      console.log("Loading COCO-SSD model...");
      const model = await cocossd.load();
      modelRef.current = model;
      setModelLoaded(true);
      console.log("Model loaded successfully");
    } catch (err) {
      console.error("Failed to load model:", err);
      setError("Failed to load AI model. Some features may not work.");
    } finally {
      loadingRef.current = false;
    }
  }, []);

  // Load model on mount
  useEffect(() => {
    loadModel();
  }, [loadModel]);

  // Preprocess image for model input
  const preprocessImage = async (
    imageData: string
  ): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Create a canvas for image processing
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image
        ctx.drawImage(img, 0, 0);

        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Apply background removal and image enhancements
        for (let i = 0; i < data.length; i += 4) {
          // Calculate color intensity
          const intensity = (data[i] + data[i + 1] + data[i + 2]) / 3;

          // Background removal threshold
          const bgThreshold = 240; // Adjust this value based on your needs

          // If pixel is likely background (very light), make it transparent
          if (intensity > bgThreshold) {
            data[i + 3] = 0; // Set alpha to 0 for background
          } else {
            // Enhance non-background pixels
            // Increase contrast
            data[i] = data[i] < 128 ? data[i] * 0.8 : data[i] * 1.2; // R
            data[i + 1] =
              data[i + 1] < 128 ? data[i + 1] * 0.8 : data[i + 1] * 1.2; // G
            data[i + 2] =
              data[i + 2] < 128 ? data[i + 2] * 0.8 : data[i + 2] * 1.2; // B

            // Increase saturation
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg + (data[i] - avg) * 1.2; // R
            data[i + 1] = avg + (data[i + 1] - avg) * 1.2; // G
            data[i + 2] = avg + (data[i + 2] - avg) * 1.2; // B

            // Adjust brightness
            const brightness = 1.1;
            data[i] = Math.min(255, data[i] * brightness);
            data[i + 1] = Math.min(255, data[i + 1] * brightness);
            data[i + 2] = Math.min(255, data[i + 2] * brightness);

            // Apply sharpening
            if (i > 0 && i < data.length - 4) {
              const sharpeningFactor = 0.3;
              data[i] = Math.min(
                255,
                Math.max(
                  0,
                  data[i] + (data[i] - data[i - 4]) * sharpeningFactor
                )
              );
              data[i + 1] = Math.min(
                255,
                Math.max(
                  0,
                  data[i + 1] + (data[i + 1] - data[i - 3]) * sharpeningFactor
                )
              );
              data[i + 2] = Math.min(
                255,
                Math.max(
                  0,
                  data[i + 2] + (data[i + 2] - data[i - 2]) * sharpeningFactor
                )
              );
            }
          }

          // Ensure values are within valid range
          data[i] = Math.min(255, Math.max(0, data[i]));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1]));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2]));
        }

        // Put processed image data back
        ctx.putImageData(imageData, 0, 0);

        // Create a new image from the processed canvas
        const processedImg = new Image();
        processedImg.onload = () => resolve(processedImg);
        processedImg.onerror = reject;
        processedImg.src = canvas.toDataURL("image/png", 0.9); // Use PNG to preserve transparency
      };
      img.onerror = reject;
      img.src = imageData;
    });
  };

  // Convert COCO-SSD detection to our food format
  const convertDetection = (
    detection: cocossd.DetectedObject
  ): DetectedFood | null => {
    const foodClass = COCO_TO_FOOD_MAP[detection.class.toLowerCase()];
    if (!foodClass || !FOOD_NUTRITION_DB[foodClass]) return null;

    // Apply confidence threshold based on food category
    const threshold =
      foodClass in FOOD_NUTRITION_DB &&
      (foodClass === "roti" ||
        foodClass === "dal" ||
        foodClass === "curry" ||
        foodClass === "biryani" ||
        foodClass === "samosa" ||
        foodClass === "pakora" ||
        foodClass === "dosa" ||
        foodClass === "idli" ||
        foodClass === "vada")
        ? CONFIDENCE_THRESHOLDS.LOW
        : foodClass in FOOD_NUTRITION_DB &&
          (foodClass === "apple" ||
            foodClass === "banana" ||
            foodClass === "orange" ||
            foodClass === "mango" ||
            foodClass === "papaya" ||
            foodClass === "pomegranate" ||
            foodClass === "grapes" ||
            foodClass === "watermelon")
        ? CONFIDENCE_THRESHOLDS.MEDIUM
        : CONFIDENCE_THRESHOLDS.HIGH;

    if (detection.score < threshold) return null;

    const nutrition = FOOD_NUTRITION_DB[foodClass];
    const { bbox } = detection;

    // Get the image dimensions from the detection
    const imageWidth = detection.bbox[2];
    const imageHeight = detection.bbox[3];

    // Calculate bounding box coordinates as percentages of the image dimensions
    return {
      name: foodClass,
      confidence: detection.score,
      boundingBox: {
        x: (bbox[0] / imageWidth) * 100, // Convert x to percentage
        y: (bbox[1] / imageHeight) * 100, // Convert y to percentage
        width: (bbox[2] / imageWidth) * 100, // Convert width to percentage
        height: (bbox[3] / imageHeight) * 100, // Convert height to percentage
      },
      nutrition,
      estimatedPortion: {
        quantity: nutrition.serving.size,
        unit: nutrition.serving.unit,
      },
    };
  };

  // Calculate IoU (Intersection over Union) between two bounding boxes
  const calculateIoU = (box1: number[], box2: number[]): number => {
    const x1 = Math.max(box1[0], box2[0]);
    const y1 = Math.max(box1[1], box2[1]);
    const x2 = Math.min(box1[0] + box1[2], box2[0] + box2[2]);
    const y2 = Math.min(box1[1] + box1[3], box2[1] + box2[3]);

    const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const area1 = box1[2] * box1[3];
    const area2 = box2[2] * box2[3];
    const union = area1 + area2 - intersection;

    return intersection / union;
  };

  // Apply non-maximum suppression to filter overlapping detections
  const applyNMS = (
    detections: cocossd.DetectedObject[],
    iouThreshold: number = 0.5
  ): cocossd.DetectedObject[] => {
    // Sort detections by confidence score
    const sortedDetections = [...detections].sort((a, b) => b.score - a.score);
    const selectedDetections: cocossd.DetectedObject[] = [];

    while (sortedDetections.length > 0) {
      const detection = sortedDetections.shift()!;
      selectedDetections.push(detection);

      // Remove overlapping detections
      const remainingDetections = sortedDetections.filter((d) => {
        const iou = calculateIoU(detection.bbox, d.bbox);
        return iou < iouThreshold;
      });

      sortedDetections.length = 0;
      sortedDetections.push(...remainingDetections);
    }

    return selectedDetections;
  };

  // Detect foods in image
  const detectFoods = useCallback(
    async (imageData: string): Promise<DetectedFood[]> => {
      if (!modelRef.current) {
        setError("Model not loaded yet");
        return [];
      }

      setIsLoading(true);
      setError(null);
      setConfidence(0);

      try {
        const img = await preprocessImage(imageData);
        const predictions = await modelRef.current.detect(img);

        // Apply non-maximum suppression to filter overlapping detections
        const filteredPredictions = applyNMS(predictions);

        // Convert predictions to our food format
        const foods = filteredPredictions
          .map(convertDetection)
          .filter(
            (food: DetectedFood | null): food is DetectedFood => food !== null
          );

        setDetectedFoods(foods);
        setConfidence(
          foods.length > 0
            ? Math.max(...foods.map((f: DetectedFood) => f.confidence))
            : 0
        );
        return foods;
      } catch (err) {
        console.error("Food detection error:", err);
        setError("Failed to detect food in the image");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearDetections = useCallback(() => {
    setDetectedFoods([]);
    setConfidence(0);
    setError(null);
  }, []);

  return {
    detectFoods,
    isLoading,
    detectedFoods,
    error,
    confidence,
    clearDetections,
    modelLoaded,
  };
}
