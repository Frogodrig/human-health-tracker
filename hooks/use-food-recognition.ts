// TensorFlow.js food recognition hook
import { useState, useCallback, useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import type { DetectedFood, MLModelConfig } from "@/types";

// Food nutrition database (simplified for MVP)
const FOOD_NUTRITION_DB: Record<string, any> = {
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
  rice: {
    calories: 205,
    protein: 4.3,
    carbohydrates: 45,
    fat: 0.4,
    serving: { size: 158, unit: "g" },
  },
  chicken: {
    calories: 239,
    protein: 27,
    carbohydrates: 0,
    fat: 14,
    serving: { size: 85, unit: "g" },
  },
  fish: {
    calories: 206,
    protein: 22,
    carbohydrates: 0,
    fat: 12,
    serving: { size: 85, unit: "g" },
  },
  egg: {
    calories: 155,
    protein: 13,
    carbohydrates: 1.1,
    fat: 11,
    serving: { size: 50, unit: "g" },
  },
  bread: {
    calories: 265,
    protein: 9,
    carbohydrates: 49,
    fat: 3.2,
    serving: { size: 100, unit: "g" },
  },
  milk: {
    calories: 42,
    protein: 3.4,
    carbohydrates: 5,
    fat: 1,
    serving: { size: 100, unit: "ml" },
  },
  coffee: {
    calories: 2,
    protein: 0.3,
    carbohydrates: 0,
    fat: 0,
    serving: { size: 240, unit: "ml" },
  },
};

// Model configuration
const MODEL_CONFIG: MLModelConfig = {
  modelUrl: "/models/food-recognition/model.json",
  version: "1.0.0",
  inputShape: [224, 224, 3],
  confidenceThreshold: 0.5,
};

// Food class labels (simplified set for MVP)
const FOOD_CLASSES = [
  "apple",
  "banana",
  "orange",
  "sandwich",
  "pizza",
  "burger",
  "salad",
  "pasta",
  "rice",
  "chicken",
  "fish",
  "egg",
  "bread",
  "milk",
  "coffee",
  "cake",
  "cookie",
  "donut",
];

interface UseFoodRecognition {
  detectFoods: (imageData: string) => Promise<void>;
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

  const modelRef = useRef<tf.LayersModel | null>(null);
  const loadingRef = useRef(false);

  // Load the TensorFlow.js model
  const loadModel = useCallback(async () => {
    if (modelRef.current || loadingRef.current) return;

    loadingRef.current = true;
    try {
      console.log("Loading TensorFlow.js model...");

      // For MVP, we'll use a mock model since training a real model requires extensive data
      // In production, you would load a real trained model here

      // Simulate model loading delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create a mock model for demonstration
      const model = await createMockModel();
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

  // Create a mock model for MVP demonstration
  const createMockModel = async (): Promise<tf.LayersModel> => {
    // Create a simple mock model for demonstration
    const model = tf.sequential({
      layers: [
        tf.layers.conv2d({
          inputShape: [224, 224, 3],
          filters: 32,
          kernelSize: 3,
          activation: "relu",
        }),
        tf.layers.globalAveragePooling2d(),
        tf.layers.dense({ units: FOOD_CLASSES.length, activation: "softmax" }),
      ],
    });

    return model;
  };

  // Preprocess image for model input
  const preprocessImage = (imageElement: HTMLImageElement): tf.Tensor => {
    return tf.tidy(() => {
      // Convert image to tensor
      const tensor = tf.browser.fromPixels(imageElement);

      // Resize to model input size
      const resized = tf.image.resizeBilinear(tensor, [224, 224]);

      // Normalize pixel values to [0, 1]
      const normalized = resized.div(255.0);

      // Add batch dimension
      const batched = normalized.expandDims(0);

      return batched;
    });
  };

  // Estimate portion size based on image analysis
  const estimatePortionSize = (
    foodClass: string,
    boundingBox: { width: number; height: number }
  ): { quantity: number; unit: string } => {
    const baseServing = FOOD_NUTRITION_DB[foodClass]?.serving || {
      size: 100,
      unit: "g",
    };

    // Simple estimation based on bounding box size
    const sizeRatio = (boundingBox.width * boundingBox.height) / 10000; // Normalize
    const estimatedRatio = Math.min(Math.max(sizeRatio, 0.5), 2.0); // Clamp between 0.5x and 2x

    const quantity = Math.round(baseServing.size * estimatedRatio);

    return {
      quantity,
      unit: baseServing.unit,
    };
  };

  // Calculate nutrition based on estimated portion
  const calculateNutrition = (
    foodClass: string,
    portion: { quantity: number; unit: string }
  ) => {
    const baseNutrition = FOOD_NUTRITION_DB[foodClass];
    if (!baseNutrition) {
      return { calories: 100, protein: 5, carbohydrates: 15, fat: 3 }; // Default values
    }

    const baseServing = baseNutrition.serving.size;
    const factor = portion.quantity / baseServing;

    return {
      calories: Math.round(baseNutrition.calories * factor),
      protein: Math.round(baseNutrition.protein * factor * 10) / 10,
      carbohydrates: Math.round(baseNutrition.carbohydrates * factor * 10) / 10,
      fat: Math.round(baseNutrition.fat * factor * 10) / 10,
    };
  };

  // Mock detection for demonstration (replace with real model inference)
  const mockFoodDetection = (imageData: string): DetectedFood[] => {
    // Simulate different detection scenarios based on image characteristics
    const mockDetections = [
      {
        name: "apple",
        confidence: 0.85,
        boundingBox: { x: 20, y: 15, width: 35, height: 40 },
      },
      {
        name: "sandwich",
        confidence: 0.72,
        boundingBox: { x: 45, y: 25, width: 40, height: 30 },
      },
    ];

    // Randomly select 1-2 detections for demo
    const numDetections = Math.random() > 0.3 ? 1 : 2;
    const selectedDetections = mockDetections.slice(0, numDetections);

    return selectedDetections.map((detection) => {
      const portion = estimatePortionSize(
        detection.name,
        detection.boundingBox
      );
      const nutrition = calculateNutrition(detection.name, portion);

      return {
        name: detection.name,
        confidence: detection.confidence,
        boundingBox: detection.boundingBox,
        estimatedPortion: portion,
        nutrition,
      };
    });
  };

  // Main food detection function
  const detectFoods = useCallback(
    async (imageData: string) => {
      setIsLoading(true);
      setError(null);
      setDetectedFoods([]);
      setConfidence(0);

      try {
        // Ensure model is loaded
        if (!modelLoaded) {
          await loadModel();
        }

        // Create image element
        const img = new Image();
        img.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageData;
        });

        // For MVP, use mock detection
        // In production, this would use the real model:
        /*
      const preprocessed = preprocessImage(img);
      const predictions = await modelRef.current?.predict(preprocessed) as tf.Tensor;
      const results = await predictions.data();
      preprocessed.dispose();
      predictions.dispose();
      */

        // Simulate processing time
        for (let i = 0; i <= 100; i += 10) {
          setConfidence(i / 100);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Use mock detection for demonstration
        const mockResults = mockFoodDetection(imageData);
        setDetectedFoods(mockResults);

        if (mockResults.length === 0) {
          setError(
            "No food items detected. Try a clearer image with better lighting."
          );
        }
      } catch (err) {
        console.error("Food detection error:", err);
        setError("Failed to analyze image. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [modelLoaded, loadModel]
  );

  // Clear detections
  const clearDetections = useCallback(() => {
    setDetectedFoods([]);
    setError(null);
    setConfidence(0);
  }, []);

  // Load model on mount
  useEffect(() => {
    loadModel();
  }, [loadModel]);

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
