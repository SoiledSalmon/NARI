import { TrustedContact } from '../types';

/**
 * Seeded trusted contacts for demo / mock mode.
 * Matches the contacts shown in screen 5 (Add Contacts).
 */
export const MOCK_CONTACTS: TrustedContact[] = [
  {
    id: 'contact-001',
    name: 'Maria Garcia',
    phone: '+1 555-0101',
    relationship: 'Sister',
    deliveryMethod: 'nari',
    avatarInitial: 'M',
    avatarColor: '#B2E0F0', // Light cyan, matches screen
    isNariUser: true,
  },
  {
    id: 'contact-002',
    name: 'David Chen',
    phone: '+1 555-0102',
    relationship: 'Partner',
    deliveryMethod: 'sms',
    avatarInitial: 'D',
    avatarColor: '#D1D1D1', // Light grey
    isNariUser: false,
  },
  {
    id: 'contact-003',
    name: 'Sarah Kim',
    phone: '+1 555-0103',
    relationship: 'Friend',
    deliveryMethod: 'nari',
    avatarInitial: 'S',
    avatarColor: '#C8E6C9', // Light green
    isNariUser: true,
  },
];
