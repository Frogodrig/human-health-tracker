import Quagga from "@ericblade/quagga2";
import { BarcodeResult, QuaggaJSReaderConfig } from "@/types/barcode";

const formatMap: Record<string, QuaggaJSReaderConfig> = {
  ean_13: { format: "ean_13", config: { supplements: [] } },
  ean_8: { format: "ean_8", config: { supplements: [] } },
  upc_a: { format: "upc_a", config: { supplements: [] } },
  upc_e: { format: "upc_e", config: { supplements: [] } },
  code_128: { format: "code_128", config: { supplements: [] } },
  code_39: { format: "code_39", config: { supplements: [] } },
  qr_code: { format: "qr_code", config: { supplements: [] } },
};

export async function detectBarcode(
  imageData: ImageData,
  formats: string[] = ["ean_13", "ean_8", "upc_a", "upc_e"]
): Promise<BarcodeResult | null> {
  try {
    // Convert ImageData to canvas
    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");
    ctx.putImageData(imageData, 0, 0);

    const result = await Quagga.decodeSingle({
      src: canvas.toDataURL(),
      numOfWorkers: 0,
      inputStream: {
        size: 800,
        area: {
          top: "0%",
          right: "0%",
          left: "0%",
          bottom: "0%",
        },
      },
      decoder: {
        readers: formats.map(
          (format) =>
            formatMap[format] || { format, config: { supplements: [] } }
        ),
      },
    });

    if (result && result.codeResult) {
      return {
        code: result.codeResult.code || "",
        format: result.codeResult.format || "",
        confidence: 1.0, // Quagga2 doesn't provide confidence scores
      };
    }

    return null;
  } catch (error) {
    console.error("Error detecting barcode:", error);
    return null;
  }
}

export function isValidBarcodeFormat(format: string): boolean {
  return format.toLowerCase() in formatMap;
}

export function getSupportedFormats(): string[] {
  return Object.keys(formatMap);
}
