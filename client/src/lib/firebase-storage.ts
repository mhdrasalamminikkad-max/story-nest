import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "./firebase";

const storage = getStorage(app);

export async function uploadFileToStorage(
  file: Blob | File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const storageRef = ref(storage, path);
  
  if (onProgress) {
    onProgress(50);
  }
  
  await uploadBytes(storageRef, file);
  
  if (onProgress) {
    onProgress(90);
  }
  
  const downloadURL = await getDownloadURL(storageRef);
  
  if (onProgress) {
    onProgress(100);
  }
  
  return downloadURL;
}

export async function uploadPDFFile(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${userId}/${timestamp}_${file.name}`;
  const path = `stories/pdfs/${fileName}`;
  return uploadFileToStorage(file, path, onProgress);
}

export async function uploadAudioFile(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${userId}/${timestamp}_${file.name}`;
  const path = `stories/audio/${fileName}`;
  return uploadFileToStorage(file, path, onProgress);
}

export async function uploadVoiceoverBlob(
  blob: Blob,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${userId}/${timestamp}_voiceover.webm`;
  const path = `stories/voiceovers/${fileName}`;
  return uploadFileToStorage(blob, path, onProgress);
}
