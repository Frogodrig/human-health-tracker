import { BarcodeResult } from "@/types/barcode";

// Supported barcode formats for ZXing
const supportedFormats = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  // Add more as needed
];

export function isValidBarcodeFormat(format: string): boolean {
  return supportedFormats.includes(format.toLowerCase());
}

export function getSupportedFormats(): string[] {
  return supportedFormats;
}

// Optionally, add a utility to map ZXing format names to your app's format names if needed

// If you need to validate a barcode string (not format), add a utility:
export function isValidBarcode(barcode: string): boolean {
  // Accepts 8-14 digit barcodes (EAN/UPC)
  return /^\d{8,14}$/.test(barcode);
}

export function normalizeBarcode(barcode: string): string {
  const digits = barcode.replace(/^0+/, ""); // Remove leading zeros
  if (digits.length <= 7) {
    return digits.padStart(8, "0");
  }
  if (digits.length >= 9 && digits.length <= 12) {
    return digits.padStart(13, "0");
  }
  return barcode;
}
