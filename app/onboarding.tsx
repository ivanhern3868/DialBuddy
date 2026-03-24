/**
 * Onboarding Screen - First Run Welcome & Setup
 *
 * Business Purpose:
 * Introduces parents to DialBuddy and collects initial settings on first app launch.
 * Sets positive expectations and explains how the app helps toddlers learn to call.
 *
 * User Flow:
 * 1. Welcome screen with app explanation
 * 2. Language selection (changes app language in real-time) - FIRST so subsequent screens are translated
 * 3. Country selection (determines emergency number)
 * 4. Emergency number confirmation (all settings enabled by default)
 * 5. Saves settings and marks onboarding as complete
 * 6. Navigates to main home screen
 *
 * Internationalization:
 * - All text uses i18next translation keys
 * - Language selection immediately updates UI language
 * - Only languages with translation files are offered (en, es, pt-BR)
 *
 * Design Principles:
 * - Parent-focused messaging (ages 3-4 children)
 * - Clear value proposition (why this app matters)
 * - Quick setup (< 90 seconds)
 * - Skip option available (sensible defaults)
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ImageBackground, Image, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { STORAGE_KEYS } from '../constants/app';
import { Fonts } from '../constants/Fonts';

/**
 * Onboarding steps - sequential flow
 * Why this order: Language first so all subsequent screens are translated,
 * then welcome screen, country (determines emergency number), emergency confirmation
 */
type OnboardingStep = 'language' | 'welcome' | 'country' | 'emergency';

/**
 * Supported countries with their emergency numbers
 * Business Rule: Each country has a primary emergency number for teaching
 *
 * Why these countries: Initial launch markets with highest toddler app usage
 * Emergency numbers are verified against ITU-T E.161 standards
 */
interface CountryInfo {
  code: string;           // ISO 3166-1 alpha-2 code
  name: string;           // Display name
  flag: string;           // Emoji flag for visual recognition
  emergencyNumber: string; // Primary emergency number to teach
  emergencyLabel: string;  // What the number is called (911, 112, etc.)
}

/**
 * Supported countries - limited to those with available language packs
 *
 * Business Rule: Only include countries where we have:
 * 1. Full translation support (en, es, pt-BR)
 * 2. Accurate emergency number information
 * 3. Cultural understanding for child safety messaging
 *
 * Current language coverage:
 * - English (en): US, Canada, UK, Australia, New Zealand
 * - Spanish (es): Mexico, Spain
 * - Portuguese-BR (pt-BR): Brazil
 */
const SUPPORTED_COUNTRIES: CountryInfo[] = [
  // English-speaking countries
  { code: 'US', name: 'United States', flag: '🇺🇸', emergencyNumber: '911', emergencyLabel: '911 (Police, Fire, Medical)' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', emergencyNumber: '911', emergencyLabel: '911 (Police, Fire, Medical)' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', emergencyNumber: '999', emergencyLabel: '999 (Police, Fire, Ambulance)' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', emergencyNumber: '000', emergencyLabel: '000 (Triple Zero)' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', emergencyNumber: '111', emergencyLabel: '111 (Emergency Services)' },

  // Spanish-speaking countries
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', emergencyNumber: '911', emergencyLabel: '911 (Emergencias)' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', emergencyNumber: '112', emergencyLabel: '112 (Emergencias)' },

  // Portuguese-speaking countries
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', emergencyNumber: '190', emergencyLabel: '190 (Polícia) / 192 (SAMU)' },
].sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

/**
 * Supported languages
 * Business Rule: Only languages with complete translation files are offered
 * Why limited: Quality over quantity - better to have 3 fully translated than 5 partial
 */
interface LanguageInfo {
  code: string;      // ISO 639-1 code (or BCP 47 for regional variants)
  name: string;      // Display name in that language
  nameEn: string;    // English name for clarity
}

const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nameEn: 'English' },
  { code: 'es', name: 'Español', nameEn: 'Spanish' },
  { code: 'pt-BR', name: 'Português (Brasil)', nameEn: 'Portuguese (Brazil)' },
];

/**
 * Onboarding Screen Component
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  // Current onboarding step
  // Business Rule: Start with language selection so all subsequent screens appear in user's preferred language
  const [step, setStep] = useState<OnboardingStep>('language');

  // User selections
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageInfo | null>(null);

  // Dropdown modal visibility
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  /**
   * Handle language selection - changes UI language in real-time
   *
   * Business Purpose: User sees immediate feedback when selecting language
   * Why real-time: Builds confidence that the selection worked
   *
   * @param language - The language info object to select
   */
  const handleLanguageSelect = (language: LanguageInfo) => {
    setSelectedLanguage(language);
    // Change app language immediately so user sees translated UI
    i18n.changeLanguage(language.code);
    console.log(`[DialBuddy] Language changed to: ${language.code}`);
  };

  /**
   * Complete onboarding and save initial settings
   *
   * Business Flow:
   * 1. Save country, language, and emergency number
   * 2. Save settings to AsyncStorage
   * 3. Mark onboarding as complete
   * 4. Navigate to home screen
   */
  const handleComplete = async () => {
    try {
      // Save user's country and language preferences
      // Why store separately: Country determines emergency number, language determines UI
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_LANGUAGE, selectedLanguage?.code || 'en');

      // Store country info (includes emergency number)
      await AsyncStorage.setItem('user_country', JSON.stringify({
        code: selectedCountry?.code || 'US',
        name: selectedCountry?.name || 'United States',
        emergencyNumber: selectedCountry?.emergencyNumber || '911',
      }));

      // Save initial settings
      // Why AsyncStorage: Settings need to persist across app launches
      // Business Rule: All settings default to on — removes the need for a setup step
      // sessionLength: 15 minutes default — aligned with WHO (2019) and AAP (2016)
      //   guidance that preschoolers benefit from short, focused screen sessions.
      //   Parents can override this in the Parent Zone.
      const initialSettings = {
        soundEffects: true,
        voiceCoaching: true,
        hapticFeedback: true,
        voiceRecognition: false, // Disabled by default (requires setup)
        autoDifficulty: true,    // Enabled by default (adaptive learning)
        sessionLength: 15,       // 15-minute daily session limit (expert recommendation)
        language: selectedLanguage?.code || 'en',
        emergencyNumber: selectedCountry?.emergencyNumber || '911',
      };

      await AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(initialSettings));

      // Mark onboarding as complete
      // Why separate key: Prevents re-showing onboarding after settings reset
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');

      console.log('[DialBuddy] Onboarding complete:', {
        country: selectedCountry?.code,
        language: selectedLanguage?.code,
        emergencyNumber: selectedCountry?.emergencyNumber,
      });

      // Navigate to home screen
      // Why replace: Prevents back navigation to onboarding
      router.replace('/');
    } catch (error) {
      console.error('[DialBuddy] Failed to save onboarding settings:', error);
      // Graceful degradation: Navigate anyway (app uses defaults)
      router.replace('/');
    }
  };

  /**
   * Skip onboarding (use default settings)
   */
  const handleSkip = async () => {
    try {
      // Mark onboarding as complete without saving custom settings
      // App will use default settings (US, English, 911)
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
      router.replace('/');
    } catch (error) {
      console.error('[DialBuddy] Failed to skip onboarding:', error);
      router.replace('/');
    }
  };

  /**
   * Navigate to next step
   */
  const nextStep = () => {
    const steps: OnboardingStep[] = ['language', 'welcome', 'country', 'emergency'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  /**
   * Navigate to previous step
   */
  const prevStep = () => {
    const steps: OnboardingStep[] = ['language', 'welcome', 'country', 'emergency'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  // ==========================================
  // STEP 1: Language Selection (now first)
  // ==========================================
  if (step === 'language') {
    return (
      <ImageBackground
        source={require('../assets/images/bg2.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.container}>
          <StatusBar style="dark" />

          <View style={styles.content}>
            {/* Progress indicator */}
            <ProgressIndicator current={1} total={3} />

            {/* Header */}
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>{t('onboarding.language.title')}</Text>
            </View>

            {/* Language list */}
            <View style={styles.optionList}>
              {SUPPORTED_LANGUAGES.map((language) => (
                <Pressable
                  key={language.code}
                  onPress={() => handleLanguageSelect(language)}
                  style={[
                    styles.optionCard,
                    selectedLanguage?.code === language.code && styles.optionCardSelected,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>{language.name}</Text>
                    {language.code !== 'en' && (
                      <Text style={styles.optionSubtext}>{language.nameEn}</Text>
                    )}
                  </View>
                  {selectedLanguage?.code === language.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>

            {/* Navigation buttons */}
            <View style={styles.navButtons}>
              <Pressable onPress={prevStep} style={styles.backButton}>
                <Text style={styles.backButtonText}>← {t('common.back')}</Text>
              </Pressable>

              <Pressable
                onPress={nextStep}
                style={[styles.nextButton, !selectedLanguage && styles.buttonDisabled]}
                disabled={!selectedLanguage}
              >
                <Text style={styles.nextButtonText}>{t('common.next')} →</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // ==========================================
  // STEP 2: Welcome Screen
  // ==========================================
  if (step === 'welcome') {
    return (
      <ImageBackground
        source={require('../assets/images/bg2.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.container}>
          <StatusBar style="dark" />

          <View style={styles.welcomeContent}>
            {/* Logo/Branding */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Welcome message - simplified */}
            <View style={styles.card}>
              <Text style={styles.welcomeTitle}>{t('onboarding.welcome.title')} 👋</Text>

              <Text style={styles.bodyText}>
                {t('onboarding.welcome.description1')}
              </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.welcomeButtonContainer}>
              <Pressable onPress={nextStep} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>{t('common.getStarted')} →</Text>
              </Pressable>

              <Pressable onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipButtonText}>{t('onboarding.welcome.skipSetup')}</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // ==========================================
  // STEP 3: Country Selection
  // ==========================================
  if (step === 'country') {
    return (
      <ImageBackground
        source={require('../assets/images/bg2.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.container}>
          <StatusBar style="dark" />

          <View style={styles.content}>
            {/* Progress indicator */}
            <ProgressIndicator current={2} total={3} />

            {/* Header */}
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>{t('onboarding.country.title')}</Text>
              <Text style={styles.stepSubtitle}>{t('onboarding.country.subtitle')}</Text>
            </View>

            {/* Country Dropdown Button */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>{t('onboarding.country.selectPrompt', 'Select your country:')}</Text>
              <Pressable
                style={styles.dropdownButton}
                onPress={() => setShowCountryDropdown(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : 'Choose a country...'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </Pressable>
            </View>

            {/* Selected country info display */}
            {selectedCountry && (
              <View style={styles.selectedCountryInfo}>
                <Text style={styles.infoLabel}>Emergency Number:</Text>
                <Text style={styles.emergencyNumberDisplay}>{selectedCountry.emergencyNumber}</Text>
                <Text style={styles.emergencyLabelSmall}>{selectedCountry.emergencyLabel}</Text>
              </View>
            )}

            {/* Country Dropdown Modal */}
            <Modal
              visible={showCountryDropdown}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowCountryDropdown(false)}
            >
              <Pressable
                style={styles.modalOverlay}
                onPress={() => setShowCountryDropdown(false)}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Country</Text>
                  <FlatList
                    data={SUPPORTED_COUNTRIES}
                    keyExtractor={(item) => item.code}
                    renderItem={({ item }) => (
                      <Pressable
                        style={[
                          styles.modalItem,
                          selectedCountry?.code === item.code && styles.modalItemSelected
                        ]}
                        onPress={() => {
                          setSelectedCountry(item);
                          setShowCountryDropdown(false);
                        }}
                      >
                        <Text style={styles.countryFlag}>{item.flag}</Text>
                        <Text style={styles.modalItemText}>{item.name}</Text>
                        {selectedCountry?.code === item.code && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </Pressable>
                    )}
                  />
                </View>
              </Pressable>
            </Modal>

            {/* Navigation buttons */}
            <View style={styles.navButtons}>
              <Pressable onPress={prevStep} style={styles.backButton}>
                <Text style={styles.backButtonText}>← {t('common.back')}</Text>
              </Pressable>

              <Pressable
                onPress={nextStep}
                style={[styles.nextButton, !selectedCountry && styles.buttonDisabled]}
                disabled={!selectedCountry}
              >
                <Text style={styles.nextButtonText}>{t('common.next')} →</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }


  // ==========================================
  // STEP 4: Emergency Number Confirmation (final step — completes onboarding)
  // ==========================================
  const emergencyNumber = selectedCountry?.emergencyNumber || '911';
  const emergencyLabel = selectedCountry?.emergencyLabel || '911';

  return (
    <ImageBackground
      source={require('../assets/images/bg2.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <View style={styles.content}>
          {/* Progress indicator */}
          <ProgressIndicator current={3} total={3} />

          {/* Header */}
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>{t('onboarding.emergency.title')} 🚨</Text>
          </View>

          {/* Emergency number display */}
          <View style={styles.emergencyCard}>
            <Text style={styles.countryFlag}>{selectedCountry?.flag || '🌍'}</Text>
            <Text style={styles.emergencyLabelText}>{selectedCountry?.name || 'Unknown'}</Text>

            <View style={styles.emergencyNumberContainer}>
              <Text style={styles.emergencyNumber}>{emergencyNumber}</Text>
            </View>

            <Text style={styles.emergencyDescription}>{emergencyLabel}</Text>
          </View>

          {/* Screen Time Info Card
              Business Purpose: Inform parents of the built-in 15-minute session limit
              and cite expert sources so they understand WHY it exists.
              Source 1 — WHO (2019): "Guidelines on Physical Activity, Sedentary Behaviour
                          and Sleep for Children under 5 Years of Age"
              Source 2 — AAP (2016): "Media and Young Minds" (Pediatrics, Nov 2016)
              Source 3 — Sesame Workshop / preschool learning research on attention span */}
          <View style={styles.screenTimeCard}>
            <Text style={styles.screenTimeTitle}>
              ⏱ {t('onboarding.screenTime.cardTitle')}
            </Text>
            <Text style={styles.screenTimeBody}>
              {t('onboarding.screenTime.cardBody')}
            </Text>
            <Text style={styles.screenTimeSource}>• {t('onboarding.screenTime.source1')}</Text>
            <Text style={styles.screenTimeSource}>• {t('onboarding.screenTime.source2')}</Text>
            <Text style={[styles.screenTimeSource, { marginBottom: 8 }]}>• {t('onboarding.screenTime.source3')}</Text>
            <Text style={styles.screenTimeTip}>{t('onboarding.screenTime.changeTip')}</Text>
          </View>

          {/* Spacer to push navigation buttons to bottom */}
          <View style={{ flex: 1 }} />

          {/* Navigation buttons */}
          <View style={styles.navButtons}>
            <Pressable onPress={prevStep} style={styles.backButton}>
              <Text style={styles.backButtonText}>← {t('common.back')}</Text>
            </Pressable>

            {/* Confirming the emergency number completes onboarding with all defaults on */}
            <Pressable onPress={handleComplete} style={styles.completeButton}>
              <Text style={styles.completeButtonText}>{t('onboarding.settings.startButton')}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

// ==========================================
// Reusable Components
// ==========================================

/**
 * Progress Indicator Component
 * Shows current step out of total steps
 */
function ProgressIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index < current ? styles.progressDotActive : styles.progressDotInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ==========================================
// Styles
// ==========================================
// Note: Some style definitions (settingCard, toggle, etc.) remain for potential future use

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingBottom: 40,
  },
  // Welcome screen specific layout - uses space-between to avoid excessive spacing on mobile
  welcomeContent: {
    flex: 1,
    padding: 24,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  welcomeButtonContainer: {
    gap: 12,
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: -90,
  },
  logo: {
    width: 400,
    maxWidth: 600,
    height: undefined,
    aspectRatio: 2,
  },
  logoEmoji: {
    fontSize: 80,
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  privacyCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  emergencyCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  confirmCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },

  // Screen time info card shown on the emergency confirmation step
  // Why blue: informational, not alarming — parents shouldn't feel restricted
  screenTimeCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  screenTimeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 6,
  },
  screenTimeBody: {
    fontSize: 13,
    color: '#37474F',
    lineHeight: 19,
    marginBottom: 8,
  },
  screenTimeSource: {
    fontSize: 12,
    color: '#546E7A',
    lineHeight: 18,
  },
  screenTimeTip: {
    fontSize: 12,
    color: '#1565C0',
    fontStyle: 'italic',
    lineHeight: 17,
  },

  // Typography
  welcomeTitle: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    color: '#37474F',
    marginBottom: 16,
    textAlign: 'center',
  },
  bodyText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 16,
  },
  featureTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: '#1976D2',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: '#1976D2',
    flex: 1,
  },
  privacyText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#F57C00',
    lineHeight: 20,
    textAlign: 'center',
  },

  // Step header
  stepHeader: {
    marginBottom: 24,
  },
  stepTitle: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    color: '#37474F',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },

  // Progress indicator
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotActive: {
    backgroundColor: '#4FC3F7',
  },
  progressDotInactive: {
    backgroundColor: '#E0E0E0',
  },

  // Option list (country/language)
  optionList: {
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionCardSelected: {
    borderColor: '#4FC3F7',
    backgroundColor: '#E3F2FD',
  },
  countryFlag: {
    fontSize: 32,
    marginRight: 16,
  },
  optionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    color: '#37474F',
  },
  optionSubtext: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 24,
    color: '#4FC3F7',
    fontWeight: 'bold',
  },

  // Custom dropdown styles for country selection
  pickerContainer: {
    marginBottom: 24,
  },
  pickerLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#37474F',
    marginBottom: 12,
  },
  dropdownButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: '#37474F',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  selectedCountryInfo: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4FC3F7',
  },
  infoLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  emergencyNumberDisplay: {
    fontFamily: Fonts.bold,
    fontSize: 36,
    color: '#D32F2F',
    letterSpacing: 4,
    marginBottom: 4,
  },
  emergencyLabelSmall: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },

  // Modal styles for dropdown
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    padding: 20,
  },
  modalTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: '#37474F',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  modalItemText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: '#37474F',
    flex: 1,
  },

  // Emergency number display
  emergencyLabelText: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    color: '#37474F',
    marginTop: 8,
    marginBottom: 16,
  },
  emergencyNumberContainer: {
    backgroundColor: '#D32F2F',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginBottom: 16,
  },
  emergencyNumber: {
    fontFamily: Fonts.bold,
    fontSize: 48,
    color: '#FFFFFF',
    letterSpacing: 8,
  },
  emergencyDescription: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  warningTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: '#E65100',
    marginBottom: 8,
  },
  warningText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
  confirmText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
    textAlign: 'center',
  },
  tipText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#4FC3F7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  skipButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  skipButtonText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: '#999',
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  backButton: {
    backgroundColor: '#4FC3F7',
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  nextButton: {
    backgroundColor: '#4FC3F7',
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 32,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 24,
    flex: 1,
    marginLeft: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Settings cards
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  settingCardEnabled: {
    borderColor: '#4FC3F7',
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#37474F',
  },
  recommendedBadge: {
    backgroundColor: '#81C784',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  toggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CCCCCC',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleEnabled: {
    backgroundColor: '#4FC3F7',
  },
  toggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleKnobEnabled: {
    alignSelf: 'flex-end',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 44,
  },
});
