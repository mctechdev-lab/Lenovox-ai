// session.js
// Persistent user storage using IndexedDB (NOT just login session)

const DB_NAME = "lenovox-auth";
const STORE = "users";
const VERSION = 2; // bump version so browser upgrades DB

// ============================
// Open Database
// ============================
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      // Create store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "uid" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ============================
// Save / Update User Profile
// This MERGES data instead of overwriting
// ============================
export async function saveSession(uid, newData) {
  if (!uid) throw new Error("UID is required to save session");

  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);

  return new Promise((resolve, reject) => {
    const getReq = store.get(uid);

    getReq.onsuccess = () => {
      const existingData = getReq.result || {};

      // Merge old + new data
      const mergedData = {
        ...existingData,
        ...newData,
        uid: uid,
        lastUpdated: Date.now()
      };

      const putReq = store.put(mergedData);

      putReq.onsuccess = () => resolve(true);
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

// ============================
// Load User Profile
// ============================
export async function getSession(uid) {
  if (!uid) return null;

  const db = await openDB();
  const tx = db.transaction(STORE, "readonly");
  const store = tx.objectStore(STORE);

  return new Promise((resolve) => {
    const req = store.get(uid);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

// ============================
// Delete User (Logout cleanup)
// ============================
export async function clearSession(uid) {
  if (!uid) return;

  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);

  store.delete(uid);
}
