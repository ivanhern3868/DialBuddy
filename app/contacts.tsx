/**
 * Contacts Screen - My Contacts
 *
 * Business Purpose:
 * Displays 3 contact slots that children can use to practice calling family members.
 * Parents add real contacts from their phone's address book, but no actual calls are made.
 *
 * User Flow:
 * 1. Child taps "My Contacts" from home screen
 * 2. Screen shows 3 contact slots (empty by default)
 * 3. Empty slots show "+" icon with "Tap to add" prompt
 * 4. When parent taps an empty slot:
 *    a. First time: Request contacts permission
 *    b. If granted: Open device contact picker
 *    c. Selected contact is saved to that slot
 * 5. Filled slots show contact name/photo and phone number
 * 6. Child can tap filled slot to practice dialing that contact
 *
 * Privacy & Safety:
 * - Contacts are stored locally only (no server sync)
 * - Only name and primary phone number are stored
 * - No actual calls are made - practice mode only
 *
 * Design for Ages 3-4:
 * - Large, colorful contact cards
 * - Simple visual feedback
 * - Maximum 3 contacts (prevents overwhelm)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Conditionally import expo-contacts
 * Why: expo-contacts requires a development build with native modules.
 * In Expo Go or when native module isn't available, we provide a fallback.
 */
let Contacts: typeof import('expo-contacts') | null = null;
try {
  Contacts = require('expo-contacts');
} catch (error) {
  console.warn('[Contacts] expo-contacts native module not available. Contact picker will be disabled.');
}

/**
 * Storage key for saved contacts
 * Why separate key: Contacts are managed independently from other app settings
 */
const CONTACTS_STORAGE_KEY = '@dialbuddy/saved_contacts';

/**
 * Contact slot data structure
 * Stores minimal data needed for practice dialing
 */
interface SavedContact {
  id: string;           // Unique identifier (from device contacts)
  name: string;         // Display name
  phoneNumber: string;  // Primary phone number for practice
  slotIndex: number;    // Which slot (0, 1, or 2) this contact occupies
}

/**
 * Pastel colors for contact cards
 * Why pastel: Friendly, child-appropriate, high contrast with white text
 */
const SLOT_COLORS = ['#81C784', '#4FC3F7', '#FFD54F'];

export default function ContactsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  // Saved contacts state (3 slots, initially all null)
  const [contacts, setContacts] = useState<(SavedContact | null)[]>([null, null, null]);

  // Loading state for initial data fetch
  // Note: isLoading value reserved for future loading indicator implementation
  const [, setIsLoading] = useState(true);

  /**
   * Manual contact entry modal state
   * Used when native contact picker isn't available (Expo Go / development testing)
   */
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntrySlot, setManualEntrySlot] = useState<number>(0);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');

  /**
   * Load saved contacts from AsyncStorage on mount
   *
   * Business Purpose: Persist contacts across app sessions
   * Why AsyncStorage: Simple key-value storage for small data like contact list
   */
  useEffect(() => {
    loadSavedContacts();
  }, []);

  /**
   * Load contacts from local storage
   */
  const loadSavedContacts = async () => {
    try {
      const savedData = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      if (savedData) {
        const parsedContacts = JSON.parse(savedData) as (SavedContact | null)[];
        // Ensure we always have exactly 3 slots
        const normalizedContacts = [
          parsedContacts[0] || null,
          parsedContacts[1] || null,
          parsedContacts[2] || null,
        ];
        setContacts(normalizedContacts);
      }
    } catch (error) {
      console.error('[Contacts] Error loading saved contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save contacts to local storage
   *
   * @param updatedContacts - The new contacts array to save
   */
  const saveContacts = async (updatedContacts: (SavedContact | null)[]) => {
    try {
      await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(updatedContacts));
      console.log('[Contacts] Contacts saved successfully');
    } catch (error) {
      console.error('[Contacts] Error saving contacts:', error);
    }
  };

  /**
   * Handle tap on an empty contact slot
   * Requests permission and opens contact picker
   *
   * Business Flow:
   * 1. Request contacts permission (first time only)
   * 2. If denied, show helpful message
   * 3. If granted, open native contact picker
   * 4. Save selected contact to the tapped slot
   *
   * @param slotIndex - Which slot (0, 1, or 2) was tapped
   */
  const handleAddContact = async (slotIndex: number) => {
    /**
     * Fallback: If expo-contacts native module isn't available, show manual entry
     *
     * Why this fallback: expo-contacts requires a development build with native
     * modules compiled in. In Expo Go or when the native module isn't linked,
     * we provide a manual entry form so testing can continue.
     *
     * User Experience: Opens a modal for manual name/phone entry
     */
    if (!Contacts) {
      console.log('[Contacts] Native module not available - showing manual entry');
      setManualEntrySlot(slotIndex);
      setManualName('');
      setManualPhone('');
      setShowManualEntry(true);
      return;
    }

    try {
      // Step 1: Check/request contacts permission
      const { status } = await Contacts.requestPermissionsAsync();

      if (status !== 'granted') {
        // Permission denied - show helpful alert
        Alert.alert(
          t('contacts.permissionTitle'),
          t('contacts.permissionDenied'),
          [{ text: t('common.ok') }]
        );
        return;
      }

      // Step 2: Open contact picker
      // Why presentContactPickerAsync: Native UI, better UX than custom list
      const contact = await Contacts.presentContactPickerAsync();

      if (!contact) {
        // User cancelled the picker
        console.log('[Contacts] Contact picker cancelled');
        return;
      }

      // Step 3: Extract phone number from contact
      // Business Rule: Use first available phone number
      const phoneNumber = contact.phoneNumbers?.[0]?.number;

      if (!phoneNumber) {
        Alert.alert(
          t('contacts.title'),
          'This contact has no phone number.',
          [{ text: t('common.ok') }]
        );
        return;
      }

      // Step 4: Create saved contact object
      const savedContact: SavedContact = {
        id: contact.id,
        name: contact.name || 'Unknown',
        phoneNumber: phoneNumber,
        slotIndex: slotIndex,
      };

      // Step 5: Update state and persist
      const updatedContacts = [...contacts];
      updatedContacts[slotIndex] = savedContact;
      setContacts(updatedContacts);
      await saveContacts(updatedContacts);

      console.log('[Contacts] Contact added:', savedContact.name);

    } catch (error) {
      console.error('[Contacts] Error adding contact:', error);
      Alert.alert(
        t('contacts.title'),
        'Failed to add contact. Please try again.',
        [{ text: t('common.ok') }]
      );
    }
  };

  /**
   * Save a manually entered contact
   *
   * Business Purpose: Allows testing in Expo Go where native contact picker
   * isn't available. Also useful for entering contacts not in address book.
   *
   * Validation:
   * - Name must not be empty
   * - Phone must not be empty and should contain digits
   */
  const saveManualContact = async () => {
    // Validate inputs
    const trimmedName = manualName.trim();
    const trimmedPhone = manualPhone.trim();

    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter a name for this contact.');
      return;
    }

    if (!trimmedPhone) {
      Alert.alert('Phone Required', 'Please enter a phone number.');
      return;
    }

    // Create contact object with generated ID (since not from device contacts)
    const savedContact: SavedContact = {
      id: `manual_${Date.now()}`, // Unique ID for manually entered contacts
      name: trimmedName,
      phoneNumber: trimmedPhone,
      slotIndex: manualEntrySlot,
    };

    // Update state and persist
    const updatedContacts = [...contacts];
    updatedContacts[manualEntrySlot] = savedContact;
    setContacts(updatedContacts);
    await saveContacts(updatedContacts);

    // Close modal and reset fields
    setShowManualEntry(false);
    setManualName('');
    setManualPhone('');

    console.log('[Contacts] Manual contact added:', savedContact.name);
  };

  /**
   * Handle tap on a filled contact slot
   * Navigates to practice screen for that contact
   *
   * @param contact - The contact to practice calling
   */
  const handleContactTap = (contact: SavedContact) => {
    // Navigate to practice screen with contact info
    // TODO: Implement practice-contact screen
    console.log('[Contacts] Practice calling:', contact.name, contact.phoneNumber);
    router.push({
      pathname: '/practice',
      params: {
        contactName: contact.name,
        phoneNumber: contact.phoneNumber,
      },
    });
  };

  /**
   * Handle long press on a filled contact slot
   * Shows option to remove the contact
   *
   * @param slotIndex - Which slot to remove
   */
  const handleRemoveContact = (slotIndex: number) => {
    Alert.alert(
      t('parentZone.contacts.delete'),
      `Remove ${contacts[slotIndex]?.name}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            const updatedContacts = [...contacts];
            updatedContacts[slotIndex] = null;
            setContacts(updatedContacts);
            await saveContacts(updatedContacts);
            console.log('[Contacts] Contact removed from slot', slotIndex);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header with back button */}
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← {t('common.back')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('contacts.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>{t('contacts.subtitle')}</Text>

      {/* Contact slots */}
      <View style={styles.slotsContainer}>
        {[0, 1, 2].map((slotIndex) => {
          const contact = contacts[slotIndex];
          const slotColor = SLOT_COLORS[slotIndex];

          return (
            <Pressable
              key={slotIndex}
              onPress={() => {
                if (contact) {
                  handleContactTap(contact);
                } else {
                  handleAddContact(slotIndex);
                }
              }}
              onLongPress={() => {
                if (contact) {
                  handleRemoveContact(slotIndex);
                }
              }}
              style={({ pressed }) => [
                styles.contactSlot,
                { backgroundColor: contact ? slotColor : '#E0E0E0' },
                pressed && styles.slotPressed,
              ]}
            >
              {contact ? (
                // Filled slot - show contact info
                <View style={styles.filledSlot}>
                  {/* Contact avatar placeholder */}
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {contact.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  {/* Contact name */}
                  <Text style={styles.contactName} numberOfLines={1}>
                    {contact.name}
                  </Text>

                  {/* Phone number (formatted for display) */}
                  <Text style={styles.phoneNumber}>
                    {contact.phoneNumber}
                  </Text>
                </View>
              ) : (
                // Empty slot - show add prompt
                <View style={styles.emptySlot}>
                  <Text style={styles.addIcon}>+</Text>
                  <Text style={styles.addText}>{t('contacts.tapToAdd')}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Helpful hint for parents */}
      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>
          Long press a contact to remove it
        </Text>
      </View>

      {/* Manual Contact Entry Modal */}
      {/* Why Modal: In Expo Go, native contact picker isn't available.
          This allows manual entry for testing and development. */}
      <Modal
        visible={showManualEntry}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManualEntry(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <Text style={styles.modalTitle}>{t('contacts.addContact')}</Text>
            <Text style={styles.modalSubtitle}>
              Enter contact details manually
            </Text>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('parentZone.contacts.name')}</Text>
              <TextInput
                style={styles.textInput}
                value={manualName}
                onChangeText={setManualName}
                placeholder="e.g., Grandma"
                placeholderTextColor="#9E9E9E"
                autoCapitalize="words"
                autoFocus={true}
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('parentZone.contacts.phoneNumber')}</Text>
              <TextInput
                style={styles.textInput}
                value={manualPhone}
                onChangeText={setManualPhone}
                placeholder="e.g., 555-123-4567"
                placeholderTextColor="#9E9E9E"
                keyboardType="phone-pad"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowManualEntry(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveManualContact}
              >
                <Text style={styles.saveButtonText}>{t('common.done')}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4FC3F7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#37474F',
  },
  headerSpacer: {
    width: 60, // Balance the back button
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  slotsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 20,
  },
  contactSlot: {
    height: 120,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  slotPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  filledSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  contactName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  phoneNumber: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  emptySlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 48,
    color: '#9E9E9E',
    marginBottom: 8,
  },
  addText: {
    fontSize: 16,
    color: '#757575',
  },
  hintContainer: {
    padding: 16,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },

  // Modal styles for manual contact entry
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#37474F',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#37474F',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#37474F',
    backgroundColor: '#F5F5F5',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  saveButton: {
    backgroundColor: '#4FC3F7',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
