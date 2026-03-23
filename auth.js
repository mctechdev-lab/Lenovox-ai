// auth.js — single source of truth for authentication

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  deleteUser,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { saveSession, clearSession, getSession } from "./session.js";

/* ======================
   FIREBASE CONFIG
====================== */
const firebaseConfig = {
  apiKey: "AIzaSyDnANsKUAZ1giXXdo-fKkFneMuKh0l0FCg",
  authDomain: "edumateai-6544b.firebaseapp.com",
  projectId: "edumateai-6544b",
  storageBucket: "edumateai-6544b.appspot.com",
  messagingSenderId: "445949748647",
  appId: "1:445949748647:web:40bee0e792098333fa4282"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Set custom parameters for Google Auth (optional but professional)
provider.setCustomParameters({
  prompt: 'select_account'
});

/* ======================
   SIGN UP (EMAIL)
====================== */
export async function signUpUser({ email, password, fullName }) {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);

    // Update the profile with the full name immediately
    if (fullName) {
      await updateProfile(res.user, { displayName: fullName });
    }

    // FIXED: Pass uid as first parameter, data object as second
    await saveSession(res.user.uid, {
      email: res.user.email,
      name: fullName || res.user.displayName || "",
      photoURL: res.user.photoURL || "",
      provider: "password",
      timestamp: Date.now()
    });

    return { success: true, user: res.user };
  } catch (error) {
    console.error("Signup Error:", error);
    return { success: false, error: error.code || error.message };
  }
}

/* ======================
   LOGIN (EMAIL)
====================== */
export async function loginUser({ email, password }) {
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);

    // FIXED: Pass uid as first parameter, data object as second
    await saveSession(res.user.uid, {
      email: res.user.email,
      name: res.user.displayName || "",
      photoURL: res.user.photoURL || "",
      provider: "password",
      timestamp: Date.now()
    });

    return { success: true, user: res.user };
  } catch (error) {
    console.error("Login Error:", error);
    return { success: false, error: error.code || error.message };
  }
}

/* ======================
   GOOGLE LOGIN / SIGNUP (POPUP MODE)
====================== */
export async function googleLoginUser() {
  try {
    // Uses Popup instead of Redirect for professional UI
    const res = await signInWithPopup(auth, provider);

    // FIXED: Pass uid as first parameter, data object as second
    await saveSession(res.user.uid, {
      email: res.user.email,
      name: res.user.displayName || "",
      photoURL: res.user.photoURL || "",
      provider: "google",
      timestamp: Date.now()
    });

    return { success: true, user: res.user, name: res.user.displayName };
  } catch (error) {
    console.error("Google Auth Error:", error);
    // Handle case where user closes the popup
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: "Login cancelled. Please try again." };
    }
    return { success: false, error: error.code || error.message };
  }
}

/* ======================
   RESET PASSWORD
====================== */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.code || error.message };
  }
}

/* ======================
   UPDATE DISPLAY NAME (Settings)
====================== */
export async function updateDisplayName(name) {
  if (!auth.currentUser) throw new Error("No user logged in");
  await updateProfile(auth.currentUser, { displayName: name });

  // FIXED: Pass uid as first parameter, data object as second
  await saveSession(auth.currentUser.uid, {
    email: auth.currentUser.email,
    name: auth.currentUser.displayName || "",
    photoURL: auth.currentUser.photoURL || "",
    provider: auth.currentUser.providerData[0]?.providerId || "password",
    timestamp: Date.now()
  });

  return { success: true };
}

/* ======================
   LOGOUT
====================== */
export async function logoutUser() {
  try {
    await signOut(auth);
    // FIXED: Pass current user's uid to clearSession
    if (auth.currentUser) {
      await clearSession(auth.currentUser.uid);
    }
    return { success: true };
  } catch (error) {
    console.error("Logout Error:", error);
    return { success: false, error: error.code || error.message };
  }
}

/* ======================
   DELETE ACCOUNT (optional)
====================== */
export async function deleteUserAccount() {
  if (!auth.currentUser) throw new Error("No user logged in");
  const uid = auth.currentUser.uid;
  
  try {
    await deleteUser(auth.currentUser);
    await clearSession(uid);
    return { success: true };
  } catch (error) {
    console.error("Delete Account Error:", error);
    return { success: false, error: error.code || error.message };
  }
}

/* ======================
   WATCH AUTH STATE
====================== */
export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

/* ======================
   GET CURRENT USER SESSION
====================== */
export async function getCurrentUser() {
  if (!auth.currentUser) return null;
  return await getSession(auth.currentUser.uid);
}

/* ======================
   GET CURRENT USER FROM FIREBASE
====================== */
export function getCurrentFirebaseUser() {
  return auth.currentUser;
}
