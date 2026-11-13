// IndexedDB wrapper for storing video files offline
const DB_NAME = "EcoBotOfflineDB";
const STORE_NAME = "videos";
const DB_VERSION = 1;

export interface OfflineVideo {
  slotId: string;
  fileBlob: Blob;
  fileName: string;
  updatedAt: number;
}

export function initOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB open error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "slotId" });
      }
    };
  });
}

export async function saveOfflineVideo(slotId: string, fileBlob: Blob, fileName: string): Promise<void> {
  const db = await initOfflineDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    
    const record: OfflineVideo = {
      slotId,
      fileBlob,
      fileName,
      updatedAt: Date.now()
    };

    const request = store.put(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineVideo(slotId: string): Promise<OfflineVideo | null> {
  try {
    const db = await initOfflineDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(slotId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error("Failed to read from IndexedDB:", err);
    return null;
  }
}

export async function deleteOfflineVideo(slotId: string): Promise<void> {
  const db = await initOfflineDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(slotId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllOfflineVideos(): Promise<void> {
  const db = await initOfflineDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
