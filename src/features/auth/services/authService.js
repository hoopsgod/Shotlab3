export const authCreateUser = async (auth, email, password) =>
  auth?.createUserWithEmailAndPassword ? auth.createUserWithEmailAndPassword(email, password) : null;

export const authUpdateProfile = async (user, payload) =>
  user?.updateProfile ? user.updateProfile(payload) : null;

export const authSignIn = async (auth, email, password) =>
  auth?.signInWithEmailAndPassword ? auth.signInWithEmailAndPassword(email, password) : null;

export const authSignInGoogle = async (auth, provider) =>
  auth?.signInWithPopup ? auth.signInWithPopup(provider) : null;

export const authSendReset = async (auth, email) =>
  auth?.sendPasswordResetEmail ? auth.sendPasswordResetEmail(email) : null;

export const authSignOut = async (auth) => (auth?.signOut ? auth.signOut() : null);

export const authDeleteCurrent = async (auth) =>
  auth?.currentUser?.delete ? auth.currentUser.delete() : null;

export const authSubscribe = (auth, cb) => (auth?.onAuthStateChanged ? auth.onAuthStateChanged(cb) : () => {});
