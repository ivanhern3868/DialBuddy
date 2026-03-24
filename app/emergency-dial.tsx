/**
 * Emergency Dial Practice Screen
 *
 * Business Purpose:
 * Thin navigation wrapper — loads the child's country-specific emergency number
 * from AsyncStorage and redirects to the standard practice screen with a
 * synthetic emergency contact.
 *
 * Why a Separate Screen (Not Direct Push from Hub):
 * - The emergency number depends on the country stored in AsyncStorage.
 * - Async loading must complete before we know the number to pass.
 * - Keeping this logic here prevents the hub screen from having async data concerns.
 *
 * Data Flow:
 * 1. Load country code from AsyncStorage
 * 2. Look up emergency number for that country
 * 3. Replace current screen with /practice, passing emergencyNumber as a param
 * 4. practice.tsx detects contactId='emergency_number' and builds a synthetic contact
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { storage } from '../utils/storage/asyncStore';

/**
 * Emergency number by ISO country code
 * Business Rule: Must stay in sync with SUPPORTED_COUNTRIES in parent-zone.tsx
 */
const EMERGENCY_NUMBER_BY_COUNTRY: Record<string, string> = {
  US: '911',
  CA: '911',
  MX: '911',
  GB: '999',
  AU: '000',
  NZ: '111',
  DE: '112',
  FR: '112',
  ES: '112',
  IT: '112',
  BR: '190',
  JP: '110',
  IN: '112',
};

/** Fallback: 112 is the international standard */
const DEFAULT_EMERGENCY_NUMBER = '112';

export default function EmergencyDialScreen() {
  const router = useRouter();

  /**
   * Load the country-specific emergency number and redirect to practice.
   * Using useEffect ensures the async work runs after the component mounts,
   * not during the render phase.
   */
  useEffect(() => {
    async function loadAndRedirect() {
      try {
        const countryCode = (await storage.getCountryCode()) || 'US';
        const emergencyNumber =
          EMERGENCY_NUMBER_BY_COUNTRY[countryCode] || DEFAULT_EMERGENCY_NUMBER;

        // Replace this loading screen with the practice screen
        // Why replace (not push): We don't want "Back" to return here — back should
        // go to the emergency hub, not loop through this loading screen.
        router.replace({
          pathname: '/practice',
          params: {
            contactId: 'emergency_number',
            emergencyNumber,
          },
        });
      } catch (error) {
        console.error('[DialBuddy] Failed to load emergency number, using fallback:', error);
        router.replace({
          pathname: '/practice',
          params: {
            contactId: 'emergency_number',
            emergencyNumber: '911',
          },
        });
      }
    }

    loadAndRedirect();
  }, []);

  // Show spinner while async loading completes (typically < 100ms)
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' }}>
      <ActivityIndicator size="large" color="#E53935" />
    </View>
  );
}
