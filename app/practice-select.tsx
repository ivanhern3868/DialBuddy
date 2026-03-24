/**
 * Practice Mode - Contact Selection
 *
 * Business Purpose:
 * Child selects which contact they want to practice dialing.
 * Shows each contact with progress indicator (mastery level).
 *
 * Design for Ages 3-4:
 * - Large contact cards with photos
 * - Visual progress bars (green = high mastery, yellow = learning)
 * - Simple tap to select
 * - Encouraging messages ("Let's call Mom!")
 *
 * Learning Flow:
 * 1. Child sees all available contacts
 * 2. Child taps a contact to practice
 * 3. App navigates to guided practice session
 * 4. Progress is tracked and displayed on return
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { getAllContacts } from '../utils/storage/contacts';
import { getProgress } from '../utils/storage/progress';
import { storage } from '../utils/storage/asyncStore';
import { DEFAULT_PROFILE_ID } from '../utils/storage/profiles';
import { Contact, Progress } from '../types';

/**
 * Storage key for saved contacts in AsyncStorage
 * Note: This matches the key used in app/contacts.tsx
 *
 * Why two storage systems exist:
 * - SQLite (utils/storage/contacts.ts): Full-featured contact management via Parent Zone
 * - AsyncStorage (app/contacts.tsx): Simple 3-slot contact picker from "My Contacts" screen
 *
 * This screen merges both sources to show all available contacts for practice.
 */
const CONTACTS_STORAGE_KEY = '@dialbuddy/saved_contacts';

/**
 * Contact data structure from AsyncStorage (My Contacts screen)
 * Simplified structure compared to full SQLite Contact type
 */
interface SavedContact {
  id: string;
  name: string;
  phoneNumber: string;
  slotIndex: number;
}

/**
 * Contact with progress data
 */
interface ContactWithProgress {
  contact: Contact;
  progress: Progress | null;
}

/**
 * Practice Contact Selection Screen
 */
export default function PracticeSelectScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  // Contacts with progress data
  const [contacts, setContacts] = useState<ContactWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Active profile ID — loaded from AsyncStorage so progress is scoped to the correct child.
   * Falls back to DEFAULT_PROFILE_ID if no profile has been created yet.
   */
  const [activeProfileId, setActiveProfileId] = useState<string>(DEFAULT_PROFILE_ID);

  /**
   * Load active profile ID and contacts on mount
   */
  useEffect(() => {
    async function init() {
      // Load active profile before fetching progress — progress is scoped per child
      const savedProfileId = await storage.getActiveProfileId();
      if (savedProfileId) {
        setActiveProfileId(savedProfileId);
      }
      loadContactsWithProgress(savedProfileId || DEFAULT_PROFILE_ID);
    }
    init();
  }, []);

  /**
   * Load all contacts from both storage systems and fetch progress for each
   *
   * Why merge two sources:
   * 1. SQLite contacts (getAllContacts): Parent Zone managed, full-featured
   * 2. AsyncStorage contacts (CONTACTS_STORAGE_KEY): "My Contacts" screen, simple slots
   *
   * Merging ensures all contacts appear regardless of how they were added.
   */
  const loadContactsWithProgress = async (profileId: string = activeProfileId) => {
    setLoading(true);

    try {
      // Source 1: SQLite contacts (from Parent Zone)
      const sqliteContacts = await getAllContacts();

      // Source 2: AsyncStorage contacts (from My Contacts screen)
      const asyncStorageContacts = await loadAsyncStorageContacts();

      // Merge contacts, avoiding duplicates by ID
      // Why Set: Efficiently tracks seen IDs to prevent duplicates
      const seenIds = new Set<string>();
      const mergedContacts: Contact[] = [];

      // Add SQLite contacts first (typically more complete data)
      for (const contact of sqliteContacts) {
        seenIds.add(contact.id);
        mergedContacts.push(contact);
      }

      // Add AsyncStorage contacts (convert to Contact type)
      for (const savedContact of asyncStorageContacts) {
        if (!seenIds.has(savedContact.id)) {
          seenIds.add(savedContact.id);
          // Convert SavedContact to Contact type with sensible defaults
          mergedContacts.push({
            id: savedContact.id,
            name: savedContact.name,
            phoneNumber: savedContact.phoneNumber,
            formattedNumber: savedContact.phoneNumber, // Use raw number as formatted
            digitGrouping: calculateSimpleDigitGrouping(savedContact.phoneNumber),
            avatar: null,
            relationship: 'Contact', // Default relationship label
            isEmergency: false,
            sortOrder: savedContact.slotIndex,
          });
        }
      }

      // Fetch progress for each contact using the resolved profile ID
      const contactsWithProgress = await Promise.all(
        mergedContacts.map(async (contact) => {
          const progress = await getProgress(profileId, contact.id);
          return { contact, progress };
        })
      );

      setContacts(contactsWithProgress);
      console.log(`[Practice] Loaded ${contactsWithProgress.length} contacts (${sqliteContacts.length} from SQLite, ${asyncStorageContacts.length} from AsyncStorage)`);
    } catch (error) {
      console.error('[DialBuddy] Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load contacts from AsyncStorage (My Contacts screen)
   *
   * @returns Array of saved contacts, or empty array if none found
   */
  const loadAsyncStorageContacts = async (): Promise<SavedContact[]> => {
    try {
      const savedData = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      if (savedData) {
        const parsedContacts = JSON.parse(savedData) as (SavedContact | null)[];
        // Filter out null slots and return only actual contacts
        return parsedContacts.filter((c): c is SavedContact => c !== null);
      }
      return [];
    } catch (error) {
      console.error('[Practice] Failed to load AsyncStorage contacts:', error);
      return [];
    }
  };

  /**
   * Calculate simple digit grouping for practice mode
   *
   * Business Purpose: Breaking phone numbers into chunks makes them easier
   * for toddlers to memorize and dial.
   *
   * @param phoneNumber - Raw phone number string
   * @returns Array of chunk sizes
   */
  const calculateSimpleDigitGrouping = (phoneNumber: string): number[] => {
    // Extract only digits from phone number
    const digits = phoneNumber.replace(/\D/g, '');
    const length = digits.length;

    // Common patterns
    if (length === 3) return [3]; // Emergency numbers
    if (length === 10) return [3, 3, 4]; // Standard US
    if (length === 11) return [1, 3, 3, 4]; // US with country code

    // Default: groups of 3 from the right
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
  };

  /**
   * Handle contact selection
   */
  const handleSelectContact = (contact: Contact) => {
    // Navigate to practice session with contact ID
    router.push(`/practice?contactId=${contact.id}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E0E0E0',
        }}
      >
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={{ padding: 8, marginRight: 12 }}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </Pressable>

        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#37474F', flex: 1 }}>
          {t('practiceMode.selectScreen.title')}
        </Text>
      </View>

      {loading ? (
        // Loading state
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#999' }}>{t('practiceMode.selectScreen.loading')}</Text>
        </View>
      ) : contacts.length === 0 ? (
        // Empty state
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>📞</Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#37474F',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            {t('practiceMode.selectScreen.emptyTitle')}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: '#666',
              textAlign: 'center',
              lineHeight: 24,
            }}
          >
            {t('practiceMode.selectScreen.emptyMessage')}
          </Text>
        </View>
      ) : (
        // Contact list
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {/* Instruction text */}
          <View
            style={{
              backgroundColor: '#E3F2FD',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#1976D2',
                marginBottom: 4,
                textAlign: 'center',
              }}
            >
              {t('practiceMode.selectScreen.instructionTitle')}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#1976D2',
                textAlign: 'center',
              }}
            >
              {t('practiceMode.selectScreen.instructionSubtitle')}
            </Text>
          </View>

          {/* Contact cards */}
          {contacts.map(({ contact, progress }) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              progress={progress}
              onPress={() => handleSelectContact(contact)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/**
 * Contact Card Component
 *
 * Shows contact with avatar, name, phone number, and progress bar
 */
function ContactCard({
  contact,
  progress,
  onPress,
}: {
  contact: Contact;
  progress: Progress | null;
  onPress: () => void;
}) {
  const { t } = useTranslation();

  // Calculate progress color based on mastery level
  const getMasteryColor = (mastery: number): string => {
    if (mastery >= 80) return '#81C784'; // Green - mastered
    if (mastery >= 50) return '#FFD54F'; // Yellow - learning
    return '#FF8A80'; // Red - just starting
  };

  const getMasteryLabel = (mastery: number): string => {
    if (mastery >= 80) return t('practiceMode.selectScreen.mastery.excellent');
    if (mastery >= 50) return t('practiceMode.selectScreen.mastery.good');
    if (mastery > 0) return t('practiceMode.selectScreen.mastery.started');
    return t('practiceMode.selectScreen.mastery.notPracticed');
  };

  const masteryLevel = progress?.masteryLevel || 0;
  const difficultyLevel = progress?.difficultyLevel || 'beginner';

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: contact.isEmergency ? '#FF8A80' : '#E0E0E0',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        {/* Avatar */}
        {contact.avatar ? (
          <Image
            source={{ uri: contact.avatar }}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              marginRight: 16,
            }}
          />
        ) : (
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#4FC3F7',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}
          >
            <Text style={{ fontSize: 40, color: '#FFFFFF' }}>
              {contact.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Contact info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#37474F' }}>
              {contact.name}
            </Text>
            {contact.isEmergency && (
              <View
                style={{
                  backgroundColor: '#FF8A80',
                  borderRadius: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  marginLeft: 8,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' }}>
                  {t('practiceMode.selectScreen.emergencyBadge')}
                </Text>
              </View>
            )}
          </View>

          <Text style={{ fontSize: 16, color: '#4FC3F7', marginBottom: 4 }}>
            {contact.formattedNumber}
          </Text>

          <Text style={{ fontSize: 14, color: '#999' }}>
            {contact.relationship}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ marginBottom: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#666' }}>
            {getMasteryLabel(masteryLevel)}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#666' }}>
            {masteryLevel}%
          </Text>
        </View>

        <View
          style={{
            height: 8,
            backgroundColor: '#E0E0E0',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${masteryLevel}%`,
              backgroundColor: getMasteryColor(masteryLevel),
            }}
          />
        </View>
      </View>

      {/* Difficulty badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            backgroundColor: '#F5F5F5',
            borderRadius: 6,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#666' }}>
            {difficultyLevel === 'beginner' && `⭐ ${t('practiceMode.selectScreen.difficulty.beginner')}`}
            {difficultyLevel === 'intermediate' && `⭐⭐ ${t('practiceMode.selectScreen.difficulty.intermediate')}`}
            {difficultyLevel === 'advanced' && `⭐⭐⭐ ${t('practiceMode.selectScreen.difficulty.advanced')}`}
          </Text>
        </View>

        {progress && progress.currentStreak > 0 && (
          <View
            style={{
              backgroundColor: '#FFD54F',
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 4,
              marginLeft: 8,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#37474F' }}>
              🔥 {progress.currentStreak} {t('practiceMode.selectScreen.streak')}
            </Text>
          </View>
        )}
      </View>

      {/* Call to action */}
      <View
        style={{
          marginTop: 16,
          backgroundColor: '#4FC3F7',
          borderRadius: 8,
          padding: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' }}>
          {t('practiceMode.selectScreen.practiceButton', { name: contact.name })}
        </Text>
      </View>
    </Pressable>
  );
}
