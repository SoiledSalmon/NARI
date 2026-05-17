import { create } from 'zustand';
import { TrustedContact } from '../data/types';

interface ContactState {
  contacts: TrustedContact[];
  isLoading: boolean;

  setContacts: (contacts: TrustedContact[]) => void;
  addContact: (contact: TrustedContact) => void;
  removeContact: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],
  isLoading: false,

  setContacts: (contacts) => set({ contacts }),

  addContact: (contact) =>
    set({ contacts: [...get().contacts, contact] }),

  removeContact: (id) =>
    set({ contacts: get().contacts.filter((c) => c.id !== id) }),

  setLoading: (isLoading) => set({ isLoading }),
}));
