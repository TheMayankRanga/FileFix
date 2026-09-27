export type ToolMode = "fit" | "compress" | "resize" | "image-to-pdf" | "pdf-to-image";
export type ImageFormat = "image/jpeg" | "image/png" | "image/webp";
export type FitMode = "stretch" | "crop" | "pad";

export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  format: ImageFormat;
  fitMode: FitMode;
}

export interface ImagePreset {
  name: string;
  width: number;
  height: number;
  maxSizeKB: number;
  format: ImageFormat;
}
