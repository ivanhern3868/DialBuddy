/**
 * Web stub for contacts.ts
 *
 * Why this file exists:
 * Metro resolves *.web.ts before *.ts for web builds.
 * contacts.ts has `import * as SQLite from 'expo-sqlite'` which causes
 * the Netlify/web bundler to try loading expo-sqlite's .wasm file and fail.
 * This stub provides the same exports without any SQLite dependency.
 *
 * Web behavior: Returns a demo contact so the practice flow is testable
 * in a browser; all write operations are no-ops.
 */

import { Contact } from '../../types';
import { CountryCode } from 'libphonenumber-js';

// Demo contact shown on web so the practice flow can be previewed in a browser
const WEB_DEMO_CONTACTS: Contact[] = [
  {
    id: 'web_demo_mom',
    name: 'Mom',
    phoneNumber: '5558675309',
    formattedNumber: '(555) 867-5309',
    digitGrouping: [3, 3, 4],
    avatar: null,
    relationship: 'Mom',
    isEmergency: false,
    sortOrder: 0,
  },
];

export async function getAllContacts(): Promise<Contact[]> {
  return WEB_DEMO_CONTACTS;
}

export async function getContactById(id: string): Promise<Contact | null> {
  return WEB_DEMO_CONTACTS.find((c) => c.id === id) ?? null;
}

export async function createContact(
  _contact: Omit<Contact, 'id' | 'sortOrder' | 'formattedNumber' | 'digitGrouping'>,
  _countryCode: CountryCode = 'US'
): Promise<Contact | null> {
  return null; // Web: no database
}

export async function updateContact(
  _id: string,
  _updates: Partial<Omit<Contact, 'id' | 'sortOrder'>>,
  _countryCode: CountryCode = 'US'
): Promise<Contact | null> {
  return null; // Web: no database
}

export async function deleteContact(_id: string): Promise<boolean> {
  return false; // Web: no database
}

export async function reorderContacts(_contactIds: string[]): Promise<void> {
  // Web: no-op
}

export async function recalculateAllContactChunks(_countryCode: string): Promise<number> {
  return 0; // Web: no database
}
