import { useState, useEffect, useRef, useCallback } from "react";

interface CameraOptions {
  facingMode?: "user" | "environment";
  width?: number;
  height?: number;
  deviceId?: string;
  frameRate?: number;
  aspectRatio?: number;
}

interface CameraState {
  stream: MediaStream | null;
  error: string | null;
  isActive: boolean;
  devices: MediaDeviceInfo[];
  selectedDevice: MediaDeviceInfo | null;
  currentResolution: { width: number; height: number } | null;
  currentFrameRate: number | null;
}

export function useCamera(options: CameraOptions = {}) {
  const [state, setState] = useState<CameraState>({
    stream: null,
    error: null,
    isActive: false,
    devices: [],
    selectedDevice: null,
    currentResolution: null,
    currentFrameRate: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Get available camera devices
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setState((prev) => ({ ...prev, devices: videoDevices }));
      return videoDevices;
    } catch {
      setState((prev) => ({
        ...prev,
        error: "Failed to get camera devices",
      }));
      return [];
    }
  }, []);

  // Get current track settings
  const getCurrentSettings = useCallback(() => {
    if (!streamRef.current) return null;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return null;
    return videoTrack.getSettings();
  }, []);

  // Update state with current settings
  const updateSettings = useCallback(() => {
    const settings = getCurrentSettings();
    if (settings) {
      setState((prev) => ({
        ...prev,
        currentResolution:
          settings.width && settings.height
            ? { width: settings.width, height: settings.height }
            : null,
        currentFrameRate: settings.frameRate || null,
      }));
    }
  }, [getCurrentSettings]);

  // Start the camera
  const startCamera = useCallback(async () => {
    try {
      // Request camera permissions and get stream
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: options.facingMode || "environment",
          width: options.width,
          height: options.height,
          deviceId: options.deviceId,
          frameRate: options.frameRate,
          aspectRatio: options.aspectRatio,
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setState((prev) => ({
        ...prev,
        stream,
        isActive: true,
        error: null,
      }));

      // Get available devices after getting permission
      await getDevices();
      updateSettings();
    } catch (err) {
      let errorMessage = "Failed to start camera";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMessage = "Camera permission denied";
        } else if (err.name === "NotFoundError") {
          errorMessage = "No camera found";
        } else if (err.name === "NotReadableError") {
          errorMessage = "Camera is already in use";
        } else if (err.name === "OverconstrainedError") {
          errorMessage = "Camera does not support requested settings";
        }
      }
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isActive: false,
      }));
    }
  }, [
    options.facingMode,
    options.width,
    options.height,
    options.deviceId,
    options.frameRate,
    options.aspectRatio,
    getDevices,
    updateSettings,
  ]);

  // Stop the camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState((prev) => ({
      ...prev,
      stream: null,
      isActive: false,
      currentResolution: null,
      currentFrameRate: null,
    }));
  }, []);

  // Switch camera
  const switchCamera = useCallback(
    async (deviceId: string) => {
      stopCamera();
      const constraints: MediaStreamConstraints = {
        video: {
          ...options,
          deviceId,
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setState((prev) => ({
        ...prev,
        stream,
        isActive: true,
        error: null,
      }));
      await getDevices();
      updateSettings();
    },
    [stopCamera, options, getDevices, updateSettings]
  );

  // Change resolution
  const changeResolution = useCallback(
    async (width: number, height: number) => {
      if (!streamRef.current) return;

      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) return;

      try {
        await videoTrack.applyConstraints({
          width,
          height,
        });
        updateSettings();
      } catch {
        setState((prev) => ({
          ...prev,
          error: "Failed to change resolution",
        }));
      }
    },
    [updateSettings]
  );

  // Change frame rate
  const changeFrameRate = useCallback(
    async (frameRate: number) => {
      if (!streamRef.current) return;

      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) return;

      try {
        await videoTrack.applyConstraints({
          frameRate,
        });
        updateSettings();
      } catch {
        setState((prev) => ({
          ...prev,
          error: "Failed to change frame rate",
        }));
      }
    },
    [updateSettings]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Get current frame as image data
  const getFrame = useCallback(() => {
    if (!videoRef.current || !state.isActive) return null;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL("image/jpeg");
  }, [state.isActive]);

  return {
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    changeResolution,
    changeFrameRate,
    getFrame,
    ...state,
  };
}
