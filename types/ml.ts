import type { NutritionalInfo } from "./index";

export interface MLModelConfig {
  modelUrl: string;
  version: string;
  inputShape: [number, number, number];
  confidenceThreshold: number;
}

export interface DetectedFood {
  name: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  estimatedPortion: {
    quantity: number;
    unit: string;
  };
  nutrition: NutritionalInfo;
}

export interface FoodNutritionDB {
  [key: string]: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    serving: {
      size: number;
      unit: string;
    };
  };
}

export interface PreprocessedImage {
  width: number;
  height: number;
  pixels: Uint8Array;
}

export interface ImageProcessingResult {
  detections: Array<{
    class: string;
    confidence: number;
    bbox: [number, number, number, number];
  }>;
}

export type DetectionMethod = "MANUAL" | "BARCODE" | "ML_VISION";
