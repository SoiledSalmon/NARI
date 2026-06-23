import { create } from 'zustand';
import { UserProfile } from '../data/types';
import { firebaseService } from '../services/firebaseService';
import { ApplicationVerifier } from 'firebase/auth';

/**
 * Authentication and user profile state management.
 * Handles phone-based sign-in via Firebase, user profile data, and onboarding flow.
 * All changes to user profile are automatically synced to Firestore.
 */
interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  language: 'en' | 'kn';
  onboardingStep: number; // 0=language, 1=signup, 2=otp, 3=contacts, 4=permissions, 5=done

  /** Set user profile and update authentication state */
  setUser: (user: UserProfile | null) => void;
  
  /** Change app language preference (persisted to Firestore) */
  setLanguage: (lang: 'en' | 'kn') => void;
  
  /** Update onboarding progress (0-5 steps) */
  setOnboardingStep: (step: number) => void;
  
  /** Mark onboarding as complete and sync to Firestore */
  completeOnboarding: () => void;
  
  /** Sign out user and clear local state */
  logout: () => void;

  /** Send OTP to phone via Firebase Auth. Requires recaptcha verifier. */
  sendOTP: (phone: string, applicationVerifier: ApplicationVerifier) => Promise<boolean>;
  
  /** Verify OTP code and obtain Firebase ID token */
  verifyOTP: (code: string) => Promise<boolean>;
  
  /** Initialize real-time listener to Firebase auth state changes. Returns unsubscribe function. */
  initAuthListener: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  language: 'en',
  onboardingStep: 0,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setLanguage: (language) => set({ language }),

  setOnboardingStep: (onboardingStep) => set({ onboardingStep }),

  completeOnboarding: async () => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, onboardingComplete: true };
      set({
        user: updatedUser,
        onboardingStep: 5,
      });
      // Sync to Firestore
      await firebaseService.updateUserProfile(user.id, { onboardingComplete: true });
    }
  },

  logout: async () => {
    await firebaseService.logout();
    set({
      user: null,
      isAuthenticated: false,
      onboardingStep: 0,
    });
  },

  sendOTP: async (phone: string, applicationVerifier: ApplicationVerifier) => {
    set({ isLoading: true });
    const success = await firebaseService.sendOTP(phone, applicationVerifier);
    set({ isLoading: false });
    return success;
  },

  verifyOTP: async (code: string) => {
    set({ isLoading: true });
    const success = await firebaseService.verifyOTP(code);
    set({ isLoading: false });
    return success;
  },

  initAuthListener: () => {
    return firebaseService.onAuthStateChanged((user) => {
      set({ user, isAuthenticated: !!user });
      if (user && user.onboardingComplete) {
        set({ onboardingStep: 5 });
      }
    });
  }
}));
