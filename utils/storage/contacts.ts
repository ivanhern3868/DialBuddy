/**
 * Contact Management Database Functions
 *
 * Business Purpose:
 * CRUD operations for phone contacts (parents, grandparents, emergency numbers).
 * These are the phone numbers children practice dialing.
 *
 * Business Rules:
 * - Maximum 6 contacts per app (keeps UI simple for toddlers)
 * - Contacts shared across all child profiles
 * - Phone numbers validated via libphonenumber-js
 * - Auto-formatting for locale-appropriate display
 * - Sort order maintained for consistent UI
 *
 * Privacy:
 * - All data stored locally in SQLite (COPPA compliant)
 * - No cloud sync, no analytics, no network requests
 * - Parents control all data (behind parent gate)
 */

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { parsePhoneNumber, CountryCode } from 'libphonenumber-js';
import { Contact } from '../../types';

// Platform check: Only initialize database on native platforms
// Why: expo-sqlite requires native SQLite, web uses different implementation
// Web users get empty arrays (UI demo only, no persistence)
const db = Platform.OS !== 'web' ? SQLite.openDatabaseSync('dialbuddy.db') : null;

/**
 * Demo contact used on web platform for testing/preview purposes.
 *
 * Business Purpose: SQLite is unavailable on web, so this gives developers
 * and reviewers a realistic contact to test the practice flow without
 * needing a native build.
 *
 * US number format: 10 digits, chunked [3, 3, 4] → "555" then "867" then "5309"
 */
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

/**
 * Get all contacts
 *
 * Business Rule: Returns contacts in sort_order (for consistent UI layout)
 * Web fallback: Returns demo contacts since SQLite is unavailable on web.
 *
 * @returns Array of contacts sorted by sort_order
 */
export async function getAllContacts(): Promise<Contact[]> {
  // Web platform: return demo contacts so practice flow can be tested in browser
  if (!db) return WEB_DEMO_CONTACTS;

  try {
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM contacts ORDER BY sort_order ASC'
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      phoneNumber: row.phone_number,
      formattedNumber: row.formatted_number,
      digitGrouping: JSON.parse(row.digit_grouping || '[]'),
      avatar: row.avatar,
      relationship: row.relationship,
      isEmergency: row.is_emergency === 1,
      sortOrder: row.sort_order,
    }));
  } catch (error) {
    console.error('[DialBuddy] Failed to get contacts:', error);
    return [];
  }
}

/**
 * Get single contact by ID
 *
 * @param id - Contact ID
 * @returns Contact or null if not found
 */
export async function getContactById(id: string): Promise<Contact | null> {
  // Web platform: look up in demo contacts by ID
  if (!db) return WEB_DEMO_CONTACTS.find((c) => c.id === id) ?? null;

  try {
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM contacts WHERE id = ?',
      [id]
    );

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      phoneNumber: row.phone_number,
      formattedNumber: row.formatted_number,
      digitGrouping: JSON.parse(row.digit_grouping || '[]'),
      avatar: row.avatar,
      relationship: row.relationship,
      isEmergency: row.is_emergency === 1,
      sortOrder: row.sort_order,
    };
  } catch (error) {
    console.error('[DialBuddy] Failed to get contact:', error);
    return null;
  }
}

/**
 * Create new contact
 *
 * Business Rules:
 * - Maximum 6 contacts enforced
 * - Phone number validation via libphonenumber-js
 * - Auto-formatting for display
 * - Auto-incrementing sort order
 *
 * @param contact - Contact data (without id, auto-generated)
 * @param countryCode - ISO country code for phone validation (default 'US')
 * @returns Created contact or null if validation fails
 */
export async function createContact(
  contact: Omit<Contact, 'id' | 'sortOrder' | 'formattedNumber' | 'digitGrouping'>,
  countryCode: CountryCode = 'US'
): Promise<Contact | null> {
  // Web platform check - return null (no database on web)
  if (!db) return null;

  try {
    // Business Rule: Max 6 contacts
    const existingContacts = await getAllContacts();
    if (existingContacts.length >= 6) {
      console.warn('[DialBuddy] Cannot create contact: Maximum 6 contacts reached');
      return null;
    }

    // Validate and format phone number
    // Why libphonenumber-js: Industry standard, handles international formats
    const phoneNumber = parsePhoneNumber(contact.phoneNumber, countryCode);

    if (!phoneNumber || !phoneNumber.isValid()) {
      console.warn('[DialBuddy] Invalid phone number:', contact.phoneNumber);
      return null;
    }

    // Extract national digits only (no formatting)
    const nationalNumber = phoneNumber.nationalNumber;

    // Format for display (locale-appropriate)
    const formattedNumber = phoneNumber.formatNational();

    // Calculate digit grouping for practice mode
    // Example: (202) 555-1234 → [3, 3, 4]
    // Uses country-specific chunking patterns for optimal learning
    const digitGrouping = calculateDigitGrouping(nationalNumber, countryCode);

    // Generate unique ID
    const id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Auto-increment sort order (append to end)
    const maxSortOrder = existingContacts.reduce(
      (max, c) => Math.max(max, c.sortOrder),
      -1
    );
    const sortOrder = maxSortOrder + 1;

    // Insert into database
    await db.runAsync(
      `INSERT INTO contacts (
        id, name, phone_number, formatted_number, digit_grouping,
        avatar, relationship, is_emergency, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        contact.name,
        nationalNumber,
        formattedNumber,
        JSON.stringify(digitGrouping),
        contact.avatar,
        contact.relationship,
        contact.isEmergency ? 1 : 0,
        sortOrder,
      ]
    );

    return {
      id,
      name: contact.name,
      phoneNumber: nationalNumber,
      formattedNumber,
      digitGrouping,
      avatar: contact.avatar,
      relationship: contact.relationship,
      isEmergency: contact.isEmergency,
      sortOrder,
    };
  } catch (error) {
    console.error('[DialBuddy] Failed to create contact:', error);
    return null;
  }
}

/**
 * Update existing contact
 *
 * @param id - Contact ID to update
 * @param updates - Partial contact data to update
 * @param countryCode - ISO country code for phone validation
 * @returns Updated contact or null if not found/validation fails
 */
export async function updateContact(
  id: string,
  updates: Partial<Omit<Contact, 'id' | 'sortOrder'>>,
  countryCode: CountryCode = 'US'
): Promise<Contact | null> {
  // Web platform check - return null (no database on web)
  if (!db) return null;

  try {
    const existing = await getContactById(id);
    if (!existing) {
      console.warn('[DialBuddy] Contact not found:', id);
      return null;
    }

    // If phone number is being updated, re-validate and re-format
    let phoneData = {
      phoneNumber: existing.phoneNumber,
      formattedNumber: existing.formattedNumber,
      digitGrouping: existing.digitGrouping,
    };

    if (updates.phoneNumber) {
      const phoneNumber = parsePhoneNumber(updates.phoneNumber, countryCode);

      if (!phoneNumber || !phoneNumber.isValid()) {
        console.warn('[DialBuddy] Invalid phone number:', updates.phoneNumber);
        return null;
      }

      phoneData = {
        phoneNumber: phoneNumber.nationalNumber,
        formattedNumber: phoneNumber.formatNational(),
        digitGrouping: calculateDigitGrouping(phoneNumber.nationalNumber, countryCode),
      };
    }

    // Merge updates
    const updated = {
      ...existing,
      ...updates,
      ...phoneData,
    };

    // Update database
    await db.runAsync(
      `UPDATE contacts SET
        name = ?,
        phone_number = ?,
        formatted_number = ?,
        digit_grouping = ?,
        avatar = ?,
        relationship = ?,
        is_emergency = ?
      WHERE id = ?`,
      [
        updated.name,
        updated.phoneNumber,
        updated.formattedNumber,
        JSON.stringify(updated.digitGrouping),
        updated.avatar,
        updated.relationship,
        updated.isEmergency ? 1 : 0,
        id,
      ]
    );

    return updated;
  } catch (error) {
    console.error('[DialBuddy] Failed to update contact:', error);
    return null;
  }
}

/**
 * Delete contact
 *
 * Business Impact: Also deletes all associated progress data (cascade delete)
 *
 * @param id - Contact ID to delete
 * @returns True if deleted successfully
 */
export async function deleteContact(id: string): Promise<boolean> {
  // Web platform check - return false (no database on web)
  if (!db) return false;

  try {
    await db.runAsync('DELETE FROM contacts WHERE id = ?', [id]);

    // Re-normalize sort orders (fill gaps)
    // Why: Prevents gaps in sort order after deletion
    const contacts = await getAllContacts();
    for (let i = 0; i < contacts.length; i++) {
      if (contacts[i].sortOrder !== i) {
        await db.runAsync(
          'UPDATE contacts SET sort_order = ? WHERE id = ?',
          [i, contacts[i].id]
        );
      }
    }

    return true;
  } catch (error) {
    console.error('[DialBuddy] Failed to delete contact:', error);
    return false;
  }
}

/**
 * Reorder contacts
 *
 * Business Use Case: Parent drags contacts to reorder them in UI
 *
 * @param contactIds - Array of contact IDs in new order
 */
export async function reorderContacts(contactIds: string[]): Promise<void> {
  // Web platform check - no-op (no database on web)
  if (!db) return;

  try {
    for (let i = 0; i < contactIds.length; i++) {
      await db.runAsync(
        'UPDATE contacts SET sort_order = ? WHERE id = ?',
        [i, contactIds[i]]
      );
    }
  } catch (error) {
    console.error('[DialBuddy] Failed to reorder contacts:', error);
  }
}

/**
 * Recalculate digit grouping for all contacts based on new country
 *
 * Business Purpose: When parent changes country in Regional Settings,
 * all existing contacts need their chunking patterns updated to match
 * the new country's phone number conventions.
 *
 * Use Case: Family moves from US to UK - all contacts need to switch from
 * [3, 3, 4] chunking to [4, 3, 4] or [3, 4, 4] chunking.
 *
 * @param countryCode - ISO country code (e.g., "GB", "FR", "JP")
 * @returns Number of contacts updated
 */
export async function recalculateAllContactChunks(countryCode: string): Promise<number> {
  // Web platform check - return 0 (no database on web)
  if (!db) return 0;

  try {
    const contacts = await getAllContacts();
    let updatedCount = 0;

    for (const contact of contacts) {
      // Recalculate digit grouping using new country code
      const newDigitGrouping = calculateDigitGrouping(contact.phoneNumber, countryCode);

      // Update database with new chunking pattern
      await db.runAsync(
        'UPDATE contacts SET digit_grouping = ? WHERE id = ?',
        [JSON.stringify(newDigitGrouping), contact.id]
      );

      updatedCount++;
    }

    console.log(`[DialBuddy] Updated digit grouping for ${updatedCount} contacts (country: ${countryCode})`);
    return updatedCount;
  } catch (error) {
    console.error('[DialBuddy] Failed to recalculate contact chunks:', error);
    return 0;
  }
}

/**
 * Calculate digit grouping for practice mode chunking
 *
 * Business Purpose: Breaking phone numbers into chunks (area code, prefix, line)
 * makes them easier for toddlers to memorize. Different countries use different
 * chunking patterns based on their phone number conventions.
 *
 * Example:
 * - US (2025551234) → [3, 3, 4] → practice as "202" then "555" then "1234"
 * - UK (02079460958) → [3, 4, 4] → practice as "020" then "7946" then "0958"
 * - France (0123456789) → [2, 2, 2, 2, 2] → practice as "01" then "23" then "45" then "67" then "89"
 * - Emergency (911) → [3] → practice as single chunk
 *
 * @param phoneNumber - National digits only (e.g., "2025551234")
 * @param countryCode - ISO country code (e.g., "US", "GB", "FR")
 * @returns Array of chunk sizes
 */
function calculateDigitGrouping(phoneNumber: string, countryCode: string = 'US'): number[] {
  const length = phoneNumber.length;

  // Emergency numbers (3 digits) - same for all countries
  if (length === 3) {
    return [3];
  }

  // Country-specific chunking patterns
  // Why different patterns: Each country has cultural conventions for how
  // phone numbers are spoken and written (e.g., "zero-two-zero" vs "two-oh-two")
  switch (countryCode) {
    case 'US':
    case 'CA':
      // North America (NANP): (202) 555-1234
      // Area code, exchange, line number
      if (length === 10) return [3, 3, 4];
      if (length === 11) return [1, 3, 3, 4]; // +1 prefix
      break;

    case 'MX':
    case 'AU':
    case 'IT':
    case 'JP':
      // Mexico: 55 1234 5678
      // Australia: 02 9876 5432
      // Italy: 06 1234 5678
      // Japan: 03 1234 5678
      // Pattern: Area code (2 digits), then two groups of 4
      if (length === 10) return [2, 4, 4];
      if (length === 11) return [2, 5, 4]; // Brazil mobile format
      break;

    case 'GB':
      // UK: 020 7946 0958 or 0161 496 0000
      // Area code varies (3-4 digits), then groups of 3-4
      if (length === 10) return [3, 3, 4];
      if (length === 11) return [4, 3, 4]; // Larger cities have 3-digit area codes
      break;

    case 'NZ':
      // New Zealand: 03 123 4567
      // Pattern: 2-digit area code, 3 digits, 4 digits
      if (length === 9) return [2, 3, 4];
      if (length === 10) return [2, 4, 4];
      break;

    case 'DE':
      // Germany: 030 12345678
      // Pattern: Variable area code, then local number
      // Simplified: 3-4 digit area code, rest as one group (easier for toddlers)
      if (length === 10) return [3, 7];
      if (length === 11) return [4, 7];
      break;

    case 'FR':
      // France: 01 23 45 67 89
      // Pattern: Always pairs of 2 digits (cultural convention)
      if (length === 10) return [2, 2, 2, 2, 2];
      break;

    case 'ES':
      // Spain: 91 123 45 67
      // Pattern: 2-digit area code, then groups of 3 and 2
      if (length === 9) return [2, 3, 2, 2];
      break;

    case 'BR':
      // Brazil: 11 98765 4321
      // Pattern: 2-digit area code, 5-digit prefix (mobile), 4-digit line
      if (length === 11) return [2, 5, 4];
      if (length === 10) return [2, 4, 4]; // Landline
      break;

    case 'IN':
      // India: 022 1234 5678
      // Pattern: 3-digit area code (major cities), then groups of 4 and 3
      // (or 2-digit for some cities)
      if (length === 10) return [3, 4, 3];
      break;
  }

  // Fallback: group in threes from the right (default safe pattern)
  // Why: Universal chunking pattern that works for any length
  // Example: 12345678 → [2, 3, 3]
  const groups: number[] = [];
  let remaining = length;

  while (remaining > 0) {
    if (remaining > 3) {
      groups.unshift(3);
      remaining -= 3;
    } else {
      groups.unshift(remaining);
      remaining = 0;
    }
  }

  return groups;
}
