import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase";

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create blob from canvas"));
    }, "image/png");
  });
}

export async function uploadPreviewImage(
  patternId: string,
  canvas: HTMLCanvasElement,
): Promise<string> {
  const blob = await canvasToBlob(canvas);
  const storageRef = ref(storage, `previews/${patternId}.png`);
  await uploadBytes(storageRef, blob, {
    contentType: "image/png",
    cacheControl: "public, max-age=3600",
  });
  return getDownloadURL(storageRef);
}

export async function deletePreviewImage(patternId: string): Promise<void> {
  const storageRef = ref(storage, `previews/${patternId}.png`);
  await deleteObject(storageRef);
}
