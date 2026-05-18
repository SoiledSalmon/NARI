import { create } from 'zustand';
import { TrustedContact } from '../data/types';
import { firebaseService } from '../services/firebaseService';

interface ContactState {
  contacts: TrustedContact[];
  isLoading: boolean;

  setLoading: (loading: boolean) => void;
  fetchContacts: (userId: string) => Promise<void>;
  addContact: (userId: string, contact: TrustedContact) => Promise<void>;
}

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],
  isLoading: false,

  setLoading: (isLoading) => set({ isLoading }),

  fetchContacts: async (userId: string) => {
    set({ isLoading: true });
    const contacts = await firebaseService.fetchContacts(userId);
    set({ contacts, isLoading: false });
  },

  addContact: async (userId: string, contact: TrustedContact) => {
    set({ isLoading: true });
    await firebaseService.addContact(userId, contact);
    // Refresh local list
    const contacts = [...get().contacts, contact];
    set({ contacts, isLoading: false });
  }
}));
