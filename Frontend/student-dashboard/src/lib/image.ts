import { apiFetch } from "./api";

/**
 * Reads an image File, resizes it to a small square-ish thumbnail, and returns
 * a JPEG data URL. Keeps avatars tiny (~20-40KB) so they fit in a normal JSON
 * request and can be stored on the profile without extra storage infra.
 */
export async function fileToResizedDataUrl(
  file: File,
  max = 256,
  quality = 0.72,
): Promise<string> {
  const sourceDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image"));
    image.src = sourceDataUrl;
  });

  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return sourceDataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Resizes an image, uploads it to object storage via the API, and returns a
 * public CDN URL. Falls back to an inline data URL if the upload fails.
 */
export async function uploadImage(
  file: File,
  folder: "avatars" | "courses",
  max = 512,
  quality = 0.8,
): Promise<string> {
  const dataUrl = await fileToResizedDataUrl(file, max, quality);
  try {
    const res = await apiFetch<{ url: string }>("/uploads/image", {
      method: "POST",
      body: JSON.stringify({ dataUrl, folder }),
    });
    return res.url;
  } catch {
    return dataUrl;
  }
}
