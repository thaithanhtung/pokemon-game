import { useFirebase } from '@/composables/useFirebase';
import type { ComputedRef, Ref } from 'vue';
import type { User } from 'firebase/auth';

interface FirebaseInstance {
  isLoading: Ref<boolean>;
  isAuthenticated: ComputedRef<boolean>;
  currentUser: Ref<User | null>;
  startAuthListener: () => () => void;
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Global Firebase instance
let firebaseInstance: FirebaseInstance | null = null;
let initPromise: Promise<FirebaseInstance> | null = null;

export const initializeFirebase = (): Promise<FirebaseInstance> => {
  if (initPromise) return initPromise;

  initPromise = new Promise<FirebaseInstance>(resolve => {
    console.log('Initializing global Firebase instance...');
    firebaseInstance = useFirebase() as FirebaseInstance;

    // Start the auth listener immediately
    const unsubscribe = firebaseInstance.startAuthListener();

    // Wait for the initial auth state to be determined
    const checkAuthState = () => {
      const isLoading = firebaseInstance.isLoading.value;
      if (!isLoading) {
        console.log(
          'Firebase initialization complete. Auth state:',
          firebaseInstance.isAuthenticated.value
        );
        resolve(firebaseInstance);
      } else {
        setTimeout(checkAuthState, 50);
      }
    };

    checkAuthState();
  });

  return initPromise;
};

export const getFirebaseInstance = (): FirebaseInstance => {
  if (!firebaseInstance) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return firebaseInstance;
};

export const waitForFirebaseAuth = async (): Promise<FirebaseInstance> => {
  await initializeFirebase();
  return firebaseInstance;
};
