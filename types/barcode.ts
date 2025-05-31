export interface BarcodeResult {
  code: string;
  format: string;
  confidence: number;
}

export interface QuaggaJSReaderConfig {
  format: string;
  config: {
    supplements: string[];
  };
}

export interface QuaggaJSCodeReader {
  format: string;
  config: {
    supplements: string[];
  };
}

export interface ScannerConfig {
  width: number;
  height: number;
  facing: "environment" | "user";
  formats: string[];
}

export interface QuaggaConfig {
  inputStream: {
    name: string;
    type: "LiveStream" | "ImageStream";
    target: Element | string;
    constraints: {
      facingMode: string | { ideal: string };
      width: { min?: number; ideal?: number; max?: number };
      height: { min?: number; ideal?: number; max?: number };
      aspectRatio?: { min: number; max: number };
    };
    area: {
      top: string;
      right: string;
      left: string;
      bottom: string;
    };
  };
  locate: boolean;
  locator: {
    patchSize: "x-small" | "small" | "medium" | "large" | "x-large";
    halfSample: boolean;
  };
  numOfWorkers: number;
  decoder: {
    readers: QuaggaJSReaderConfig[];
    debug: {
      drawBoundingBox: boolean;
      showFrequency: boolean;
      drawScanline: boolean;
      showPattern: boolean;
    };
  };
  frequency: number;
}

export interface InitConfig {
  config: QuaggaConfig;
  resolve: (value: boolean) => void;
  reject: (reason?: unknown) => void;
}
