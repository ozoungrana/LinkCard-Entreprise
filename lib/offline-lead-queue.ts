const DB_NAME = "linkcard-offline";
const STORE_NAME = "pending-leads";

export type PendingLead = {
  localId: string;
  createdAt: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: "localId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queuePendingLead(
  lead: Omit<PendingLead, "localId" | "createdAt">
): Promise<PendingLead> {
  const db = await openDb();
  const entry: PendingLead = {
    ...lead,
    localId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return entry;
}

export async function getPendingLeads(): Promise<PendingLead[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as PendingLead[]);
    request.onerror = () => reject(request.error);
  });
}

export async function removePendingLead(localId: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(localId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
