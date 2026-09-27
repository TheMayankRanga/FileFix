import type { ImagePreset } from "@/types/filefix";

export const imagePresets: ImagePreset[] = [
  { name: "Passport photo", width: 200, height: 230, maxSizeKB: 50, format: "image/jpeg" },
  { name: "Signature", width: 300, height: 100, maxSizeKB: 50, format: "image/jpeg" },
  { name: "Profile photo", width: 400, height: 400, maxSizeKB: 100, format: "image/jpeg" },
];

export const acceptedImages = "image/jpeg,image/png,image/webp";
export const maxImageBytes = 20 * 1024 * 1024;

export const formatLabel = (format: string) => {
  if (format === "image/jpeg") return "JPG";
  if (format === "image/png") return "PNG";
  if (format === "image/webp") return "WebP";
  return format;
};
