/**
 * AsyncStorage Helpers for DialBuddy
 *
 * Business Purpose:
 * Simple key-value storage for lightweight preferences that don't need
 * relational database structure (locale, active profile ID, etc.).
 *
 * Why AsyncStorage:
 * - Faster than SQLite for simple get/set operations
 * - Better for non-relational data (JSON objects, strings)
 * - Persistent across app launches, cleared on uninstall
 *
 * What's Stored Here:
 * - User locale preferences (country, language)
 * - Active child profile ID
 * - App settings (sound, vibration, voice prompts)
 * - Home address (for emergency module)
 * - Fire meeting spot (for after-call actions)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/app';

// Storage keys (namespaced to avoid conflicts)
const KEYS = {
  LOCALE: '@dialbuddy/locale',
  SETTINGS: '@dialbuddy/settings',
  ACTIVE_PROFILE_ID: '@dialbuddy/active_profile_id',
  FIRST_LAUNCH: '@dialbuddy/first_launch',
  HOME_ADDRESS: '@dialbuddy/home_address',
  FIRE_MEETING_SPOT: '@dialbuddy/fire_meeting_spot',
  EMERGENCY_OTHER_INFO: '@dialbuddy/emergency_other_info',
  COUNTRY_CODE: '@dialbuddy/country_code',
  PROGRESS: '@dialbuddy/progress',
} as const;

/**
 * Get a value from AsyncStorage
 *
 * Returns null if key doesn't exist.
 * Automatically parses JSON if value is valid JSON.
 */
export async function getStorageItem<T = any>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;

    // Try to parse as JSON, fall back to raw string
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  } catch (error) {
    console.error(`[AsyncStorage] Error reading key "${key}":`, error);
    return null;
  }
}

/**
 * Set a value in AsyncStorage
 *
 * Automatically stringifies objects/arrays to JSON.
 */
export async function setStorageItem(key: string, value: any): Promise<void> {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
  } catch (error) {
    console.error(`[AsyncStorage] Error writing key "${key}":`, error);
    throw error;
  }
}

/**
 * Remove a value from AsyncStorage
 */
export async function removeStorageItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`[AsyncStorage] Error removing key "${key}":`, error);
    throw error;
  }
}

/**
 * Clear ALL AsyncStorage data
 *
 * WARNING: Only use for testing or "factory reset" feature
 */
export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.clear();
    console.log('[AsyncStorage] All data cleared');
  } catch (error) {
    console.error('[AsyncStorage] Error clearing storage:', error);
    throw error;
  }
}

// Convenience methods for specific keys

export const storage = {
  // Locale
  getLocale: () => getStorageItem(KEYS.LOCALE),
  setLocale: (locale: any) => setStorageItem(KEYS.LOCALE, locale),

  // Settings
  getSettings: () => getStorageItem(KEYS.SETTINGS),
  setSettings: (settings: any) => setStorageItem(KEYS.SETTINGS, settings),

  // Active Profile
  getActiveProfileId: () => getStorageItem<string>(KEYS.ACTIVE_PROFILE_ID),
  setActiveProfileId: (id: string) => setStorageItem(KEYS.ACTIVE_PROFILE_ID, id),

  // First Launch (for onboarding)
  getFirstLaunch: () => getStorageItem<string>(KEYS.FIRST_LAUNCH),
  setFirstLaunch: (date: string) => setStorageItem(KEYS.FIRST_LAUNCH, date),

  // Home Address
  getHomeAddress: () => getStorageItem<string>(KEYS.HOME_ADDRESS),
  setHomeAddress: (address: string) => setStorageItem(KEYS.HOME_ADDRESS, address),

  // Fire Meeting Spot
  getFireMeetingSpot: () => getStorageItem<string>(KEYS.FIRE_MEETING_SPOT),
  setFireMeetingSpot: (spot: string) => setStorageItem(KEYS.FIRE_MEETING_SPOT, spot),

  /**
   * Other Emergency Info
   *
   * Business Purpose: Free-text field for additional info a dispatcher might ask:
   * allergies, medical conditions, second parent contact name, etc.
   * Used in Phase 2 dispatcher simulation so child knows what to say.
   */
  getEmergencyOtherInfo: () => getStorageItem<string>(KEYS.EMERGENCY_OTHER_INFO),
  setEmergencyOtherInfo: (info: string) => setStorageItem(KEYS.EMERGENCY_OTHER_INFO, info),

  // Onboarding status - uses key from constants/app.ts
  getOnboardingComplete: () => getStorageItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETE),
  setOnboardingComplete: (complete: boolean) => setStorageItem(STORAGE_KEYS.ONBOARDING_COMPLETE, complete),

  /**
   * Country Code (ISO 3166-1 alpha-2)
   *
   * Business Purpose: Determines phone number formatting and emergency number
   * Critical for country-specific digit chunking patterns (US vs UK vs France, etc.)
   * When changed, triggers recalculation of all contact digit groupings
   */
  getCountryCode: () => getStorageItem<string>(KEYS.COUNTRY_CODE),
  setCountryCode: (countryCode: string) => setStorageItem(KEYS.COUNTRY_CODE, countryCode),

  /**
   * Progress Data
   *
   * Business Purpose: Track child's learning progress across practice sessions
   * Includes: accuracy, streaks, difficulty level, total practice time
   * Used for: adaptive difficulty, parent reports, mastery tracking
   */
  getProgress: () => getStorageItem(KEYS.PROGRESS),
  setProgress: (progress: any) => setStorageItem(KEYS.PROGRESS, progress),

  /**
   * Reset onboarding status
   *
   * Business Purpose: For testing/development to re-show onboarding flow
   * Removes the onboarding_complete key from storage so app shows onboarding again
   */
  resetOnboarding: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      console.log('[AsyncStorage] Onboarding status reset - will show onboarding on next launch');
    } catch (error) {
      console.error('[AsyncStorage] Error resetting onboarding:', error);
      throw error;
    }
  },
};
