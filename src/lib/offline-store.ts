"use client";

// Client-side IndexedDB persistence for offline-first operation
const DB_NAME = "healthcamp_offline_db";
const DB_VERSION = 1;

export interface OutboxItem {
  id: string; // UUID or clientOpId
  entityType: "REGISTRATION" | "VITALS" | "BLOOD" | "DIAGNOSTIC" | "DOCTOR_EXAM" | "FITNESS_DECISION";
  action: "CREATE" | "UPDATE";
  payload: Record<string, unknown>;
  timestamp: number;
  status: "PENDING" | "SYNCING" | "FAILED" | "CONFLICT";
  retryCount: number;
  error?: string;
}

export interface CachedAttachment {
  id: string;
  clientOpId: string;
  employeeHealthId: string;
  testType: string;
  fileName: string;
  mimeType: string;
  base64Data: string;
  sizeBytes: number;
  timestamp: number;
  status: "PENDING" | "SYNCED" | "FAILED";
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("outbox")) {
        const outboxStore = db.createObjectStore("outbox", { keyPath: "id" });
        outboxStore.createIndex("status", "status", { unique: false });
        outboxStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      if (!db.objectStoreNames.contains("attachments")) {
        const attachStore = db.createObjectStore("attachments", { keyPath: "id" });
        attachStore.createIndex("status", "status", { unique: false });
        attachStore.createIndex("employeeHealthId", "employeeHealthId", { unique: false });
      }

      if (!db.objectStoreNames.contains("cachedRoster")) {
        db.createObjectStore("cachedRoster", { keyPath: "healthId" });
      }

      if (!db.objectStoreNames.contains("campConfig")) {
        db.createObjectStore("campConfig", { keyPath: "campId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueOfflineOperation(
  entityType: OutboxItem["entityType"],
  action: OutboxItem["action"],
  payload: Record<string, unknown>
): Promise<string> {
  const db = await openDB();
  const id = `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const item: OutboxItem = {
    id,
    entityType,
    action,
    payload,
    timestamp: Date.now(),
    status: "PENDING",
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction("outbox", "readwrite");
    const store = tx.objectStore("outbox");
    const req = store.add(item);
    req.onsuccess = () => resolve(id);
    req.onerror = () => reject(req.error);
  });
}

export async function queueOfflineAttachment(
  clientOpId: string,
  employeeHealthId: string,
  testType: string,
  file: File
): Promise<string> {
  const db = await openDB();
  const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Convert File to Base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const item: CachedAttachment = {
    id,
    clientOpId,
    employeeHealthId,
    testType,
    fileName: file.name,
    mimeType: file.type,
    base64Data,
    sizeBytes: file.size,
    timestamp: Date.now(),
    status: "PENDING",
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction("attachments", "readwrite");
    const store = tx.objectStore("attachments");
    const req = store.add(item);
    req.onsuccess = () => resolve(id);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingOperations(): Promise<OutboxItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("outbox", "readonly");
      const store = tx.objectStore("outbox");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function removeSyncedOperation(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("outbox", "readwrite");
    const store = tx.objectStore("outbox");
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function syncPendingOperationsToServer(): Promise<{
  successCount: number;
  failureCount: number;
  conflicts: string[];
}> {
  const items = await getPendingOperations();
  if (items.length === 0) {
    return { successCount: 0, failureCount: 0, conflicts: [] };
  }

  let successCount = 0;
  let failureCount = 0;
  const conflicts: string[] = [];

  for (const item of items) {
    try {
      const response = await fetch("/api/sync/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      const result = await response.json();

      if (response.ok && result.status === "APPLIED") {
        await removeSyncedOperation(item.id);
        successCount++;
      } else if (result.status === "CONFLICT") {
        conflicts.push(`Conflict in ${item.entityType}: ${result.message}`);
        failureCount++;
      } else {
        failureCount++;
      }
    } catch {
      failureCount++;
    }
  }

  return { successCount, failureCount, conflicts };
}
