const getFirebaseApp = () => {
  if (typeof window === "undefined") return null;
  return window.firebaseApp || null;
};

const getFirebaseAuth = () => {
  if (typeof window === "undefined") return null;
  return window.firebaseAuth || null;
};

const getFirestoreDb = () => {
  if (typeof window === "undefined") return null;
  return window.firebaseDb || null;
};

export const firebaseEnabled = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID,
);

export const firebaseApp = getFirebaseApp();
export const firebaseAuth = getFirebaseAuth();
export const firebaseDb = getFirestoreDb();
export const googleProvider = typeof window !== "undefined" ? window.googleProvider || null : null;
