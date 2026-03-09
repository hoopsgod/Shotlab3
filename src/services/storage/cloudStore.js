import { firebaseDb, firebaseEnabled } from "../firebase";

const localGet = async (key) => {
  try {
    const row = await window.storage.get(key, true);
    return row ? JSON.parse(row.value) : null;
  } catch {
    return null;
  }
};

const localSet = async (key, value) => {
  try {
    await window.storage.set(key, JSON.stringify(value), true);
  } catch {
    // no-op fallback
  }
};

export const cloudStore = {
  async get(key) {
    if (!firebaseEnabled || !firebaseDb?.getDocument) return localGet(key);
    try {
      const doc = await firebaseDb.getDocument(key);
      if (doc && Object.prototype.hasOwnProperty.call(doc, "value")) return doc.value;
      return localGet(key);
    } catch {
      return localGet(key);
    }
  },
  async set(key, value) {
    await localSet(key, value);
    if (!firebaseEnabled || !firebaseDb?.setDocument) return;
    try {
      await firebaseDb.setDocument(key, { value, updatedAt: Date.now() });
    } catch {
      // keep local fallback only
    }
  },
};
