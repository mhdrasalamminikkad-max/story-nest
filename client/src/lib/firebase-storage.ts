import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "./firebase";

const storage = getStorage(app);

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export async function uploadFileToStorage(
  file: Blob | File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const storageRef = ref(storage, path);
  
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Real-time progress with actual bytes
        const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage: Math.round(percentage)
          });
        }
      },
      (error) => {
        console.error("Firebase upload error:", error);
        reject(error);
      },
      async () => {
        // Upload complete
        try {
          const downloadURL = await getDownloadURL(storageRef);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
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
