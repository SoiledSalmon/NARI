import { create } from 'zustand';
import { UserProfile } from '../data/types';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  language: 'en' | 'kn';
  onboardingStep: number; // 0=language, 1=signup, 2=otp, 3=contacts, 4=permissions, 5=done

  setUser: (user: UserProfile) => void;
  setLanguage: (lang: 'en' | 'kn') => void;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;
  logout: () => void;

  // Mock auth flow
  sendOTP: (phone: string) => Promise<boolean>;
  verifyOTP: (code: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  language: 'en',
  onboardingStep: 0,

  setUser: (user) => set({ user, isAuthenticated: true }),

  setLanguage: (language) => set({ language }),

  setOnboardingStep: (onboardingStep) => set({ onboardingStep }),

  completeOnboarding: () => {
    const { user } = get();
    if (user) {
      set({
        user: { ...user, onboardingComplete: true },
        onboardingStep: 5,
      });
    }
  },

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      onboardingStep: 0,
    }),

  // Mock: any 6-digit OTP succeeds
  sendOTP: async (_phone: string) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 1000));
    set({ isLoading: false });
    return true;
  },

  verifyOTP: async (code: string) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 1200));
    const success = code.length === 6;
    if (success) {
      set({
        isLoading: false,
        isAuthenticated: true,
      });
    } else {
      set({ isLoading: false });
    }
    return success;
  },
}));
