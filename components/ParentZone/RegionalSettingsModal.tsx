/**
 * RegionalSettingsModal Component
 *
 * Business Purpose:
 * Modal dialog for configuring country, language, and emergency number settings.
 * These settings ensure the app teaches phone number formats, emergency numbers,
 * and language appropriate to the child's location.
 *
 * Why This Matters:
 * - Children learn country-specific phone number formats (e.g., US vs UK chunking)
 * - Emergency number practice is critical for safety (911 vs 999 vs 112)
 * - Language localization for voice prompts and UI text
 * - Changing country automatically updates all contact chunking patterns
 *
 * Technical Implementation:
 * - Uses React Native Modal with 'slide' animation
 * - Country selection triggers automatic digit chunk recalculation
 * - Emergency number dynamically updates based on country
 * - i18next integration for language switching
 *
 * Country Support:
 * 13 countries across 9 unique phone number chunking patterns.
 * See utils/storage/contacts.ts calculateDigitGrouping() for full list.
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Props for RegionalSettingsModal
 */
interface RegionalSettingsModalProps {
  /** Whether the modal is currently visible */
  visible: boolean;

  /** Callback to close the modal */
  onClose: () => void;

  /** Current country code (ISO 3166-1 alpha-2) */
  currentCountryCode: string;

  /** Current language code (ISO 639-1) */
  currentLanguageCode: string;

  /** Current emergency number for selected country */
  emergencyNumber: string;

  /** Callback when country changes */
  onChangeCountry: (countryCode: string) => void;

  /** Callback when language changes */
  onChangeLanguage: (languageCode: string) => void;
}

/**
 * Country option metadata
 * Business Rule: Display flag emoji + name for visual recognition
 */
interface CountryOption {
  /** ISO 3166-1 alpha-2 country code */
  code: string;

  /** Country display name */
  name: string;

  /** Flag emoji for visual identification */
  flag: string;

  /** Emergency number for this country */
  emergencyNumber: string;
}

/**
 * Language option metadata
 */
interface LanguageOption {
  /** ISO 639-1 language code */
  code: string;

  /** Language display name */
  name: string;

  /** Flag/icon emoji for visual identification */
  flag: string;
}

/**
 * Supported countries with emergency numbers
 * Why this list: Covers major English-speaking markets + international options
 * Business Rule: Emergency number must match country's official emergency service
 */
const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', emergencyNumber: '911' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', emergencyNumber: '911' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', emergencyNumber: '999' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', emergencyNumber: '000' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', emergencyNumber: '111' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', emergencyNumber: '911' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', emergencyNumber: '112' },
  { code: 'FR', name: 'France', flag: '🇫🇷', emergencyNumber: '112' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', emergencyNumber: '112' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', emergencyNumber: '112' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', emergencyNumber: '190' },
  { code: 'IN', name: 'India', flag: '🇮🇳', emergencyNumber: '112' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', emergencyNumber: '110' },
];

/**
 * Supported languages
 * Why this list: Covers primary languages in supported countries
 * Business Rule: Language affects UI text and TTS voice selection
 */
const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

/**
 * RegionalSettingsModal Component
 *
 * Modal dialog for country, language, and emergency number configuration.
 * Parents access this via "Regional Settings" button in Parent Zone.
 */
export default function RegionalSettingsModal({
  visible,
  onClose,
  currentCountryCode,
  currentLanguageCode,
  emergencyNumber,
  onChangeCountry,
  onChangeLanguage,
}: RegionalSettingsModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet" // iOS: Sheet-style presentation (bottom sheet)
      onRequestClose={onClose} // Android: Back button dismisses modal
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        {/* Header with title and close button */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#E0E0E0',
            backgroundColor: '#FFFFFF',
          }}
        >
          {/* Title */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#212121',
            }}
          >
            {t('parentZone.regionalSettings.title')}
          </Text>

          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: '#0288D1',
                fontWeight: '500',
              }}
            >
              {t('common.done')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable settings */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
        >
          {/* Country Selection Section */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#424242',
                marginBottom: 8,
              }}
            >
              {t('parentZone.regionalSettings.country')}
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: '#757575',
                marginBottom: 16,
                lineHeight: 20,
              }}
            >
              {t('parentZone.regionalSettings.countryDesc')}
            </Text>

            {/* Country options grid (2 columns) */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              {COUNTRY_OPTIONS.map((country) => {
                const isSelected = currentCountryCode === country.code;

                return (
                  <TouchableOpacity
                    key={country.code}
                    onPress={() => onChangeCountry(country.code)}
                    style={{
                      width: '48%', // 2-column grid
                      backgroundColor: '#FFFFFF',
                      borderRadius: 8,
                      padding: 12,
                      borderWidth: 2,
                      borderColor: isSelected ? '#0288D1' : '#E0E0E0',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, marginRight: 8 }}>
                        {country.flag}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isSelected ? '600' : '400',
                          color: isSelected ? '#0288D1' : '#424242',
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {country.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Emergency Number Display */}
          <View
            style={{
              backgroundColor: '#FFEBEE',
              borderRadius: 12,
              padding: 16,
              marginBottom: 32,
              borderLeftWidth: 4,
              borderLeftColor: '#D32F2F',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#C62828',
                marginBottom: 4,
              }}
            >
              {t('parentZone.regionalSettings.emergencyNumber')}
            </Text>
            <Text
              style={{
                fontSize: 32,
                fontWeight: '700',
                color: '#D32F2F',
                marginBottom: 8,
              }}
            >
              {emergencyNumber}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: '#B71C1C',
                lineHeight: 18,
              }}
            >
              {t('parentZone.regionalSettings.emergencyDesc')}
            </Text>
          </View>

          {/* Language Selection Section */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#424242',
                marginBottom: 8,
              }}
            >
              {t('parentZone.regionalSettings.language')}
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: '#757575',
                marginBottom: 16,
                lineHeight: 20,
              }}
            >
              {t('parentZone.regionalSettings.languageDesc')}
            </Text>

            {/* Language options grid (2 columns) */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              {LANGUAGE_OPTIONS.map((language) => {
                const isSelected = currentLanguageCode === language.code;

                return (
                  <TouchableOpacity
                    key={language.code}
                    onPress={() => onChangeLanguage(language.code)}
                    style={{
                      width: '48%', // 2-column grid
                      backgroundColor: '#FFFFFF',
                      borderRadius: 8,
                      padding: 12,
                      borderWidth: 2,
                      borderColor: isSelected ? '#4CAF50' : '#E0E0E0',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, marginRight: 8 }}>
                        {language.flag}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isSelected ? '600' : '400',
                          color: isSelected ? '#4CAF50' : '#424242',
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {language.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Info text about automatic updates */}
          <View
            style={{
              backgroundColor: '#E3F2FD',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: '#0277BD',
                lineHeight: 20,
              }}
            >
              ℹ️ {t('parentZone.regionalSettings.autoUpdate')}
            </Text>
          </View>

          {/* Bottom padding for scroll comfort */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
