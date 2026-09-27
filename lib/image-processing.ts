import { maxImageBytes } from "@/constants/presets";
import type { ImageFormat, ProcessedImage } from "@/types/filefix";

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This image could not be opened. It may be damaged or in an unsupported format."));
    };
    image.src = url;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, format: ImageFormat, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Your browser could not encode this image. Try another format."));
        else if (blob.type !== format) reject(new Error(`Your browser cannot export ${format === "image/webp" ? "WebP" : "this format"}. Choose a different output format.`));
        else resolve(blob);
      },
      format,
      quality,
    );
  });
}

export async function inspectImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size > maxImageBytes) throw new Error("This file is too large for browser processing. Try an image under 20 MB.");
  const image = await loadImage(file);
  return { width: image.naturalWidth, height: image.naturalHeight };
}

export async function processImage(
  file: File,
  options: { width?: number; height?: number; format: ImageFormat; maxBytes?: number },
  onProgress?: (progress: number) => void,
): Promise<{ result: ProcessedImage; meetsSizeLimit: boolean }> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size > maxImageBytes) throw new Error("This file is too large for browser processing. Try an image under 20 MB.");
  const image = await loadImage(file);
  const width = options.width ?? image.naturalWidth;
  const height = options.height ?? image.naturalHeight;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 12000 || height > 12000) {
    throw new Error("Enter image dimensions between 1 and 12,000 pixels.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  if (canvas.width !== width || canvas.height !== height) {
    throw new Error("Your browser cannot create an image at these dimensions. Try smaller dimensions.");
  }
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not start image processing. Please try another browser.");
  if (options.format === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(image, 0, 0, width, height);

  let best: Blob;
  if (!options.maxBytes || options.format === "image/png") {
    best = await canvasBlob(canvas, options.format, 0.94);
    onProgress?.(100);
  } else {
    const lowestQuality = await canvasBlob(canvas, options.format, 0);
    onProgress?.(5);
    if (lowestQuality.size > options.maxBytes) {
      best = lowestQuality;
    } else {
      const highestQuality = await canvasBlob(canvas, options.format, 1);
      onProgress?.(10);
      if (highestQuality.size <= options.maxBytes) {
        best = highestQuality;
      } else {
        let validQuality = 0;
        let invalidQuality = 1;
        best = lowestQuality;
        for (let index = 0; index < 10; index += 1) {
          const quality = (validQuality + invalidQuality) / 2;
          const blob = await canvasBlob(canvas, options.format, quality);
          if (blob.size <= options.maxBytes) {
            validQuality = quality;
            best = blob;
          } else {
            invalidQuality = quality;
          }
          onProgress?.(Math.round(((index + 1) / 10) * 100));
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
      }
    }
  }
  return {
    result: { blob: best, width, height, format: options.format },
    meetsSizeLimit: !options.maxBytes || best.size <= options.maxBytes,
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
