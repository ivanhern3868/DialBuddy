/**
 * useContacts Hook
 *
 * Business Purpose:
 * Provides reactive access to contact list with CRUD operations.
 * Encapsulates database logic for contact management.
 *
 * Stakeholders:
 * - Parents: Add/edit/delete contacts for their child
 * - Children: View contacts in practice mode
 *
 * Usage:
 * ```tsx
 * const { contacts, loading, createContact, deleteContact } = useContacts();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { Contact } from '../types';
import {
  getAllContacts,
  getContactById,
  createContact as dbCreateContact,
  updateContact as dbUpdateContact,
  deleteContact as dbDeleteContact,
} from '../utils/storage/contacts';

/**
 * Hook return type
 */
interface UseContactsReturn {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Contact | null>;
  updateContact: (id: string, contact: Partial<Contact>) => Promise<Contact | null>;
  deleteContact: (id: string) => Promise<boolean>;
  getContact: (id: string) => Promise<Contact | null>;
}

/**
 * useContacts Hook
 *
 * Auto-loads contacts on mount and provides mutation methods.
 * All mutations trigger automatic refresh to keep UI in sync.
 */
export function useContacts(): UseContactsReturn {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all contacts from database
   *
   * Business rule: Contacts are loaded once on mount and refreshed after mutations.
   * This prevents unnecessary database queries while keeping data fresh.
   */
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const loadedContacts = await getAllContacts();
      setContacts(loadedContacts);

      console.log(`[useContacts] Loaded ${loadedContacts.length} contacts`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load contacts';
      setError(errorMessage);
      console.error('[useContacts] Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial load on mount
   */
  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Create a new contact
   *
   * Business rule: Auto-refreshes contact list after creation.
   *
   * @param contact - Contact data without ID or timestamps
   * @returns Created contact with ID, or null on failure
   */
  const createContact = useCallback(async (
    contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Contact | null> => {
    try {
      setError(null);

      const newContact = await dbCreateContact(contact);

      if (newContact) {
        // Refresh list to include new contact
        await refresh();
        console.log('[useContacts] Created contact:', newContact.name);
      }

      return newContact;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create contact';
      setError(errorMessage);
      console.error('[useContacts] Error creating contact:', err);
      return null;
    }
  }, [refresh]);

  /**
   * Update an existing contact
   *
   * Business rule: Auto-refreshes to reflect changes.
   *
   * @param id - Contact ID
   * @param updates - Partial contact data to update
   * @returns Updated contact or null on failure
   */
  const updateContact = useCallback(async (
    id: string,
    updates: Partial<Contact>
  ): Promise<Contact | null> => {
    try {
      setError(null);

      const updatedContact = await dbUpdateContact(id, updates);

      if (updatedContact) {
        await refresh();
        console.log('[useContacts] Updated contact:', id);
      }

      return updatedContact;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contact';
      setError(errorMessage);
      console.error('[useContacts] Error updating contact:', err);
      return null;
    }
  }, [refresh]);

  /**
   * Delete a contact
   *
   * Business rule: Auto-refreshes to remove from list.
   *
   * @param id - Contact ID
   * @returns True if deleted successfully
   */
  const deleteContact = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);

      const success = await dbDeleteContact(id);

      if (success) {
        await refresh();
        console.log('[useContacts] Deleted contact:', id);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete contact';
      setError(errorMessage);
      console.error('[useContacts] Error deleting contact:', err);
      return false;
    }
  }, [refresh]);

  /**
   * Get a single contact by ID
   *
   * Note: Does not refresh the entire list.
   *
   * @param id - Contact ID
   * @returns Contact or null if not found
   */
  const getContact = useCallback(async (id: string): Promise<Contact | null> => {
    try {
      setError(null);
      return await getContactById(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get contact';
      setError(errorMessage);
      console.error('[useContacts] Error getting contact:', err);
      return null;
    }
  }, []);

  return {
    contacts,
    loading,
    error,
    refresh,
    createContact,
    updateContact,
    deleteContact,
    getContact,
  };
}
