// Camera food scanning page
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUIStore } from "@/store";
import { useFoodRecognition } from "@/hooks/use-food-recognition";
import type { DetectedFood } from "@/types/ml";
import {
  Camera,
  Upload,
  Loader2,
  AlertCircle,
  Check,
  X,
  RotateCcw,
  Zap,
  Timer,
} from "lucide-react";
import Image from "next/image";

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const { showSuccess, showError } = useUIStore();
  const {
    detectFoods,
    isLoading,
    detectedFoods,
    error: mlError,
    confidence,
    clearDetections,
    processingTime,
  } = useFoodRecognition();

  // Check camera permissions
  const checkCameraPermission = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      return result.state;
    } catch {
      return "unknown";
    }
  }, []);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setIsStreaming(false); // Reset streaming state

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }

      // Check current permission state
      const permissionState = await checkCameraPermission();
      console.log("Camera permission state:", permissionState);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error("Video element not found"));
            return;
          }

          const video = videoRef.current;
          video.onloadedmetadata = () => {
            video.play().then(resolve).catch(reject);
          };
          video.onerror = () => reject(new Error("Video failed to load"));

          // Timeout after 10 seconds
          setTimeout(
            () => reject(new Error("Camera initialization timeout")),
            10000
          );
        });

        setIsStreaming(true);
      }
    } catch (error) {
      console.error("Camera access error:", error);
      let errorMessage =
        "Unable to access camera. Please check permissions and try again.";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage =
            "Camera permission denied. Please allow camera access and try again.";
        } else if (error.name === "NotFoundError") {
          errorMessage =
            "No camera found. Please check your device has a camera.";
        } else if (error.name === "NotSupportedError") {
          errorMessage = "Camera not supported in this browser.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Camera initialization timed out. Please try again.";
        }
      }

      setCameraError(errorMessage);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);

    setCapturedImage(imageDataUrl);
    stopCamera();

    // Automatically start food detection
    detectFoods(imageDataUrl);
  }, [stopCamera, detectFoods]);

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showError("Invalid File", "Please select an image file.");
        return;
      }

      stopCamera();
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
        clearDetections();
        detectFoods(result);
      };
      reader.readAsDataURL(file);
    },
    [showError, detectFoods, clearDetections, stopCamera]
  );

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    clearDetections();
    stopCamera();
    startCamera();
  }, [startCamera, clearDetections, stopCamera]);

  // Add detected food to intake
  const addFoodToIntake = async (
    food: DetectedFood,
    mealType: string = "SNACK"
  ) => {
    try {
      const response = await fetch("/api/intake/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: food.name,
          quantity: food.estimatedPortion?.quantity || 1,
          servingUnit: food.estimatedPortion?.unit || "piece",
          mealType,
          nutrition: food.nutrition,
          detectedBy: "ML_VISION",
          confidence: food.confidence,
        }),
      });

      if (response.ok) {
        showSuccess(
          "Food Added!",
          `${food.name} has been added to your intake.`
        );
      } else {
        throw new Error("Failed to add food");
      }
    } catch (error) {
      showError("Error", "Failed to add food to your intake.", error);
    }
  };

  // Auto-start camera when component mounts
  useEffect(() => {
    startCamera();

    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Additional cleanup when captured image changes
  useEffect(() => {
    if (capturedImage) {
      stopCamera();
    }
  }, [capturedImage, stopCamera]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Food Recognition</h1>
        <p className="text-gray-600">
          Take a photo of your food and let AI identify and track the nutrition
        </p>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> If you&apos;ve already granted camera
            permission for barcode scanning, you may need to click &quot;Request
            Permission&quot; to allow camera access for food recognition.
          </p>
        </div>
      </div>

      {/* Camera Interface */}
      {!capturedImage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="mr-2 h-5 w-5" />
              Camera
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cameraError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p>{cameraError}</p>
                  <div className="flex gap-2 mt-2">
                    <Button onClick={startCamera} size="sm" variant="outline">
                      <RotateCcw className="mr-2 h-3 w-3" />
                      Retry Camera
                    </Button>
                    <Button
                      onClick={() => {
                        // Force browser to show permission prompt again
                        navigator.mediaDevices
                          .getUserMedia({ video: true })
                          .then((stream) => {
                            stream.getTracks().forEach((track) => track.stop());
                            startCamera();
                          })
                          .catch(() => startCamera());
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <Camera className="mr-2 h-3 w-3" />
                      Request Permission
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Video Stream */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-[480px] object-cover"
                playsInline
                muted
              />
              {!isStreaming && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center text-white">
                    <Loader2 className="h-12 w-12 mx-auto mb-2 opacity-50 animate-spin" />
                    <p>Initializing camera...</p>
                    <p className="text-sm opacity-75 mt-1">
                      Please allow camera access when prompted
                    </p>
                  </div>
                </div>
              )}

              {/* Capture Button Overlay */}
              {isStreaming && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <Button
                    onClick={capturePhoto}
                    size="lg"
                    className="rounded-full w-16 h-16 bg-white text-black hover:bg-gray-200"
                  >
                    <Camera className="h-6 w-6" />
                  </Button>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex gap-2">
              {!isStreaming ? (
                <Button onClick={startCamera} className="flex-1">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
              ) : (
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Stop Camera
                </Button>
              )}

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Photo
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {/* Captured Image & Analysis */}
      {capturedImage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              AI Food Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image Preview */}
            <div className="relative w-full aspect-video overflow-hidden rounded-lg">
              <Image
                src={capturedImage}
                alt="Captured food"
                width={1280}
                height={720}
                className="w-full h-full object-contain"
                priority
              />

              {/* Detection Overlays */}
              {detectedFoods.map(
                (food, index) =>
                  food.boundingBox && (
                    <div
                      key={index}
                      className="absolute border border-green-400/50 bg-green-400/10 rounded-lg pointer-events-none backdrop-blur-[2px]"
                      style={{
                        left: `${food.boundingBox.x}%`,
                        top: `${food.boundingBox.y}%`,
                        width: `${food.boundingBox.width}%`,
                        height: `${food.boundingBox.height}%`,
                        transform: "translateZ(0)", // Force GPU acceleration
                        boxShadow: "0 0 0 1px rgba(74, 222, 128, 0.1)", // Subtle glow effect
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-green-400/90 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm whitespace-nowrap shadow-sm">
                        {food.name} ({Math.round(food.confidence * 100)}%)
                      </div>
                    </div>
                  )
              )}
            </div>

            {/* Analysis Status */}
            {isLoading && (
              <div className="flex items-center justify-center space-x-2 py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Analyzing your food...</p>
                  <Progress value={confidence * 100} className="w-48" />
                </div>
              </div>
            )}

            {mlError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{mlError}</AlertDescription>
              </Alert>
            )}

            {/* Processing Time */}
            {processingTime > 0 && (
              <div className="flex items-center text-sm text-gray-500">
                <Timer className="h-4 w-4 mr-1" />
                Processed in {processingTime}ms
              </div>
            )}

            {/* Detected Foods */}
            {detectedFoods.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">Detected Foods</h3>
                {detectedFoods.map((food, index) => (
                  <DetectedFoodCard
                    key={index}
                    food={food}
                    onAddToIntake={addFoodToIntake}
                  />
                ))}
              </div>
            )}

            {/* No detections */}
            {!isLoading &&
              !mlError &&
              detectedFoods.length === 0 &&
              capturedImage && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No food items detected in this image. Try taking another
                    photo with better lighting or closer to the food.
                  </AlertDescription>
                </Alert>
              )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retake Photo
              </Button>
              {detectedFoods.length === 0 && (
                <Button
                  onClick={() => detectFoods(capturedImage)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  Analyze Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Canvas for image processing (hidden) */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// Component for displaying detected food items
function DetectedFoodCard({
  food,
  onAddToIntake,
}: {
  food: DetectedFood;
  onAddToIntake: (food: DetectedFood, mealType: string) => void;
}) {
  const [selectedMeal, setSelectedMeal] = useState("SNACK");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToIntake = async () => {
    setIsAdding(true);
    try {
      await onAddToIntake(food, selectedMeal);
    } finally {
      setIsAdding(false);
    }
  };

  const confidenceColor =
    food.confidence >= 0.8
      ? "text-green-600"
      : food.confidence >= 0.6
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-lg">{food.name}</h4>
          <p className="text-sm text-gray-600">
            Estimated: {food.estimatedPortion?.quantity || 1}{" "}
            {food.estimatedPortion?.unit || "piece"}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`${confidenceColor} border-current`}
        >
          {Math.round(food.confidence * 100)}% confident
        </Badge>
      </div>

      {/* Nutrition Info */}
      {food.nutrition && (
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="text-center">
            <div className="font-medium text-green-600">
              {food.nutrition.calories}
            </div>
            <div className="text-gray-500">calories</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-blue-600">
              {food.nutrition.protein}g
            </div>
            <div className="text-gray-500">protein</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-orange-600">
              {food.nutrition.carbohydrates}g
            </div>
            <div className="text-gray-500">carbs</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-purple-600">
              {food.nutrition.fat}g
            </div>
            <div className="text-gray-500">fat</div>
          </div>
        </div>
      )}

      {/* Add to Meal */}
      <div className="flex gap-2 items-center">
        <select
          className="flex-1 px-3 py-2 border rounded-md text-sm"
          value={selectedMeal}
          onChange={(e) => setSelectedMeal(e.target.value)}
        >
          <option value="BREAKFAST">Breakfast</option>
          <option value="LUNCH">Lunch</option>
          <option value="DINNER">Dinner</option>
          <option value="SNACK">Snack</option>
        </select>
        <Button onClick={handleAddToIntake} disabled={isAdding} size="sm">
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
