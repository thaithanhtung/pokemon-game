import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  type User,
  type UserCredential,
  type Unsubscribe,
} from 'firebase/auth';
import { auth } from './config';

interface AuthResult {
  user: User | null;
  error: string | null;
}

interface SignOutResult {
  success: boolean;
  error: string | null;
}

// Authentication service
export const authService = {
  // Sign in anonymously (for demo/guest users)
  async signInAnonymously(): Promise<AuthResult> {
    try {
      const result = await signInAnonymously(auth);
      return { user: result.user, error: null };
    } catch (error) {
      console.error('Anonymous sign-in error:', error);
      return { user: null, error: error.message };
    }
  },

  // Sign in with Google
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      // Add custom parameters to force popup
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      console.log('Starting Google sign-in with popup...');
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful:', result.user);

      return { user: result.user, error: null };
    } catch (error) {
      console.error('Google sign-in error:', error);

      // If popup fails, try redirect as fallback
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') {
        console.log('Popup blocked or closed, trying redirect...');
        try {
          await signInWithRedirect(auth, provider);
          return { user: null, error: 'redirect' };
        } catch (redirectError) {
          console.error('Redirect also failed:', redirectError);
          return { user: null, error: redirectError.message };
        }
      }

      return { user: null, error: error.message };
    }
  },

  // Sign in with email and password
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { user: result.user, error: null };
    } catch (error) {
      console.error('Email sign-in error:', error);
      return { user: null, error: error.message };
    }
  },

  // Create account with email and password
  async createAccount(email: string, password: string, displayName?: string): Promise<AuthResult> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }

      return { user: result.user, error: null };
    } catch (error) {
      console.error('Account creation error:', error);
      return { user: null, error: error.message };
    }
  },

  // Sign out
  async signOut(): Promise<SignOutResult> {
    try {
      await signOut(auth);
      return { success: true, error: null };
    } catch (error) {
      console.error('Sign-out error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, callback);
  },

  // Handle redirect result (for fallback)
  async getRedirectResult(): Promise<AuthResult> {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        console.log('Redirect sign-in successful:', result.user);
        return { user: result.user, error: null };
      }
      return { user: null, error: null };
    } catch (error) {
      console.error('Redirect result error:', error);
      return { user: null, error: error.message };
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  },
};
