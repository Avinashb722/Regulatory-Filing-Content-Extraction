import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as fbSignOut
} from "firebase/auth";

// Official Firebase configuration for converter-9cb3a
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBSydb2aiMLXv5eXZYw7iRt7WCnLpqvaD0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "converter-9cb3a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "converter-9cb3a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "converter-9cb3a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "121166686350",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:121166686350:web:e745d5ebd033b0cb0081df",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-1R1NRP8L0V"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// 1. Firebase Email/Password Sign In (Strict - No auto-signup on failure)
export async function signInWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;
    const token = await user.getIdToken();
    return {
      id: user.uid,
      email: user.email,
      full_name: user.displayName || user.email.split("@")[0],
      photo_url: user.photoURL,
      token: token
    };
  } catch (error) {
    throw new Error(getFriendlyFirebaseError(error));
  }
}

// 2. Firebase Create Account (Sign Up)
export async function signUpWithEmail(email, password, fullName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;
    
    if (fullName) {
      await updateProfile(user, { displayName: fullName });
    }
    
    const token = await user.getIdToken();
    return {
      id: user.uid,
      email: user.email,
      full_name: fullName || user.displayName || user.email.split("@")[0],
      photo_url: user.photoURL,
      token: token
    };
  } catch (error) {
    throw new Error(getFriendlyFirebaseError(error));
  }
}

// 3. Firebase Forgot Password Reset Email
export async function resetPasswordEmail(email) {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return true;
  } catch (error) {
    throw new Error(getFriendlyFirebaseError(error));
  }
}

// 4. Firebase Google Sign-In Popup (Strict - Surfaces actual error if cancelled or failed)
export async function signInWithGooglePopup() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const token = await user.getIdToken();
    return {
      id: user.uid,
      email: user.email,
      full_name: user.displayName || user.email.split("@")[0],
      photo_url: user.photoURL,
      token: token
    };
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Google sign-in popup was closed before completion.");
    }
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error("This domain is not yet authorized in Firebase Console. Please add your domain to Firebase Authentication Authorized Domains.");
    }
    throw new Error(getFriendlyFirebaseError(error));
  }
}

export async function firebaseSignOut() {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.error("Firebase sign out error:", e);
  }
}

function getFriendlyFirebaseError(error) {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again in a few moments.';
    default:
      return error.message || 'Authentication error. Please try again.';
  }
}
