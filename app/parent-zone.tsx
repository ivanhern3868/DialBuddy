/**
 * Parent Zone - Adult Settings and Contact Management
 *
 * Business Purpose:
 * Central hub for all parent-controlled features:
 * - App settings (sound, haptics, voice prompts, hint delay)
 * - Contact management (add/edit/delete phone numbers)
 * - Child profile management (create/switch/delete profiles)
 * - Emergency info (home address, fire meeting spot)
 * - View progress reports
 *
 * Access Control:
 * - Protected by Parent Gate (dual long-press security)
 * - Auto-locks after 5 minutes of inactivity
 * - No password storage (privacy-first design)
 *
 * COPPA Compliance:
 * - All child data management happens here (behind parent gate)
 * - Clear privacy policy link
 * - Export/delete all data options
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ParentGate from '../components/ParentGate/ParentGate';
import AppSettingsModal from '../components/ParentZone/AppSettingsModal';
import LearningPreferencesModal from '../components/ParentZone/LearningPreferencesModal';
import RegionalSettingsModal from '../components/ParentZone/RegionalSettingsModal';
import EmergencyInfoModal from '../components/ParentZone/EmergencyInfoModal';
import ProgressReportModal from '../components/ParentZone/ProgressReportModal';
import ProfileModal from '../components/ParentZone/ProfileModal';
import { storage } from '../utils/storage/asyncStore';
import { recalculateAllContactChunks } from '../utils/storage/contacts';
import { getActiveProfile } from '../utils/storage/profiles';
import { AppSettings, DifficultyLevel, Progress, ChildProfile } from '../types';
import { useTranslation } from 'react-i18next';

/**
 * Default app settings
 * Business Rule: Sound/haptics/voice ON by default (multi-sensory learning)
 */
const DEFAULT_SETTINGS: AppSettings = {
  soundEffects: true,
  voicePrompts: true,
  vibration: true,
  voiceRecognition: false, // Beta feature, off by default
  hintDelay: 5, // Seconds before hint appears
  sessionLength: 15, // Minutes before break prompt
  autoDifficultyProgress: true, // Auto-advance difficulty at mastery thresholds
};

/**
 * Country/Language types (same as onboarding)
 */
interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  emergencyNumber: string;
  emergencyLabel: string;
}

interface LanguageInfo {
  code: string;
  name: string;
  nameEn: string;
}

/**
 * Supported countries (same as onboarding)
 */
const SUPPORTED_COUNTRIES: CountryInfo[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', emergencyNumber: '911', emergencyLabel: '911 (Police, Fire, Medical)' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', emergencyNumber: '911', emergencyLabel: '911 (Police, Fire, Medical)' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', emergencyNumber: '911', emergencyLabel: '911 (Emergencias)' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', emergencyNumber: '999', emergencyLabel: '999 (Police, Fire, Ambulance)' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', emergencyNumber: '000', emergencyLabel: '000 (Triple Zero)' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', emergencyNumber: '111', emergencyLabel: '111 (Emergency Services)' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', emergencyNumber: '112', emergencyLabel: '112 (Notruf)' },
  { code: 'FR', name: 'France', flag: '🇫🇷', emergencyNumber: '112', emergencyLabel: '112 (Urgences)' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', emergencyNumber: '112', emergencyLabel: '112 (Emergencias)' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', emergencyNumber: '112', emergencyLabel: '112 (Emergenza)' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', emergencyNumber: '190', emergencyLabel: '190 (Polícia) / 192 (SAMU)' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', emergencyNumber: '110', emergencyLabel: '110 (Police) / 119 (Fire/Ambulance)' },
  { code: 'IN', name: 'India', flag: '🇮🇳', emergencyNumber: '112', emergencyLabel: '112 (Emergency)' },
];

/**
 * Supported languages (same as onboarding)
 */
const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nameEn: 'English' },
  { code: 'es', name: 'Español', nameEn: 'Spanish' },
  { code: 'pt-BR', name: 'Português (Brasil)', nameEn: 'Portuguese (Brazil)' },
];

/**
 * Parent Zone Screen
 *
 * Protected by parent gate, provides access to all adult controls.
 */
export default function ParentZoneScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  // Parent gate state
  const [gateUnlocked, setGateUnlocked] = useState(false);

  // App settings state
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Learning preferences (difficulty level)
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('beginner');

  // Regional settings (country, language, emergency number)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('US');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  // Active child profile (name shown in header)
  const [activeProfile, setActiveProfile] = useState<ChildProfile | null>(null);

  // Modal visibility state
  const [showAppSettingsModal, setShowAppSettingsModal] = useState(false);
  const [showLearningPrefsModal, setShowLearningPrefsModal] = useState(false);
  const [showRegionalModal, setShowRegionalModal] = useState(false);
  const [showEmergencyInfoModal, setShowEmergencyInfoModal] = useState(false);
  const [showProgressReportModal, setShowProgressReportModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Auto-lock timer (5 minutes of inactivity)
  const [lastActivity, setLastActivity] = useState(Date.now());

  /**
   * Load settings, progress, and regional preferences from AsyncStorage on mount
   */
  useEffect(() => {
    async function loadData() {
      try {
        // Load app settings
        const savedSettings = await storage.getSettings();
        if (savedSettings) {
          setSettings(savedSettings);
        }

        // Load progress to get current difficulty level
        const progress = await storage.getProgress();
        if (progress?.difficultyLevel) {
          setDifficultyLevel(progress.difficultyLevel);
        }

        // Load regional preferences (country and language)
        const countryCode = await storage.getCountryCode();
        if (countryCode) {
          setSelectedCountryCode(countryCode);
        }

        // Current language from i18n
        setSelectedLanguage(i18n.language);

        // Load active child profile (for display in header)
        const profile = await getActiveProfile();
        setActiveProfile(profile);
      } catch (error) {
        console.error('[DialBuddy] Failed to load data:', error);
      }
    }

    loadData();
  }, []);

  /**
   * Auto-lock after 5 minutes of inactivity
   * Why: Prevents child from accessing parent zone if parent walks away
   */
  useEffect(() => {
    if (!gateUnlocked) return;

    const interval = setInterval(() => {
      const minutesInactive = (Date.now() - lastActivity) / 1000 / 60;

      if (minutesInactive >= 5) {
        // Auto-lock after 5 minutes — go back if possible, else home
        // Why canGoBack check: during dev, parent-zone may be the root screen
        setGateUnlocked(false);
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [gateUnlocked, lastActivity]);

  /**
   * Update setting and save to AsyncStorage
   *
   * @param key - Setting key to update
   * @param value - New value
   */
  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setLastActivity(Date.now()); // Reset auto-lock timer

    try {
      await storage.setSettings(newSettings);
    } catch (error) {
      console.error('[DialBuddy] Failed to save settings:', error);
    }
  };

  /**
   * Update difficulty level and save to progress
   *
   * Business Purpose: Allows parents to manually adjust difficulty
   * if child needs more/less challenge regardless of automatic progression
   */
  const updateDifficultyLevel = async (newLevel: DifficultyLevel) => {
    setDifficultyLevel(newLevel);
    setLastActivity(Date.now()); // Reset auto-lock timer

    try {
      // Load current progress
      const progress = await storage.getProgress();

      // Update difficulty level in progress
      const updatedProgress: Progress = {
        ...(progress || {
          totalAttempts: 0,
          successfulAttempts: 0,
          averageAccuracy: 0,
          fastestTime: null,
          currentStreak: 0,
          longestStreak: 0,
          lastPracticeDate: null,
          totalPracticeMinutes: 0,
        }),
        difficultyLevel: newLevel,
      };

      await storage.setProgress(updatedProgress);
    } catch (error) {
      console.error('[DialBuddy] Failed to save difficulty level:', error);
    }
  };

  /**
   * Update country selection and save to storage
   *
   * Business Purpose: Change emergency number and country-specific settings
   * Critical for teaching correct emergency number for child's location
   *
   * IMPORTANT: Also recalculates digit chunks for all existing contacts
   * Why: Different countries use different phone number chunking patterns
   * (e.g., US uses [3,3,4], UK uses [4,3,4], France uses [2,2,2,2,2])
   */
  const updateCountry = async (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    setLastActivity(Date.now()); // Reset auto-lock timer

    try {
      // Save country code to storage
      await storage.setCountryCode(countryCode);
      console.log(`[DialBuddy] Country updated to: ${countryCode}`);

      // Recalculate digit grouping for all existing contacts
      // Why: Phone number chunking patterns differ by country
      // Example: Moving from US to France changes "202-555-1234" → [3,3,4]
      // to "01 23 45 67 89" → [2,2,2,2,2]
      const updatedCount = await recalculateAllContactChunks(countryCode);
      console.log(`[DialBuddy] Recalculated chunks for ${updatedCount} contacts`);
    } catch (error) {
      console.error('[DialBuddy] Failed to save country:', error);
    }
  };

  /**
   * Update language selection and change app language
   *
   * Business Purpose: Change UI and voice prompts to parent's preferred language
   * Supports multilingual families and improves accessibility
   */
  const updateLanguage = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setLastActivity(Date.now()); // Reset auto-lock timer

    try {
      // Change i18n language (updates all UI text immediately)
      await i18n.changeLanguage(languageCode);
      console.log(`[DialBuddy] Language updated to: ${languageCode}`);
    } catch (error) {
      console.error('[DialBuddy] Failed to change language:', error);
    }
  };

  /**
   * Handle parent gate success
   */
  const handleGateSuccess = () => {
    setGateUnlocked(true);
    setLastActivity(Date.now());
  };

  /**
   * Handle back button or cancel
   */
  const handleBack = () => {
    // canGoBack guard: navigating directly to parent-zone during dev has no stack
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  // Show parent gate if not unlocked
  if (!gateUnlocked) {
    return (
      <ParentGate
        onSuccess={handleGateSuccess}
        onCancel={handleBack}
        hapticsEnabled={settings.vibration}
      />
    );
  }

  // Show parent zone once unlocked
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
        <Pressable
          onPress={handleBack}
          style={{
            padding: 8,
            marginRight: 12,
          }}
        >
          <Text style={{ fontSize: 24 }}>←</Text>
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#37474F' }}>
            {t('parentZone.title')}
          </Text>
          {activeProfile && (
            <Text style={{ fontSize: 13, color: '#888', marginTop: 1 }}>
              {activeProfile.avatar} {t('parentZone.profile.activeChild')}: {activeProfile.name}
            </Text>
          )}
        </View>

        <Text style={{ fontSize: 14, color: '#999' }}>
          {t('parentZone.autoLock')}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Settings & Preferences Section */}
        <View style={{ padding: 16 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#37474F',
              marginBottom: 16,
            }}
          >
            {t('parentZone.sections.settingsPreferences')}
          </Text>

          {/* App Settings Button */}
          <ModalNavigationButton
            title={t('parentZone.appSettings.title')}
            description={t('parentZone.appSettings.description')}
            emoji="⚙️"
            onPress={() => setShowAppSettingsModal(true)}
          />

          {/* Learning Preferences Button */}
          <ModalNavigationButton
            title={t('parentZone.learningPreferences.title')}
            description={t('parentZone.learningPreferences.description')}
            emoji="🎓"
            onPress={() => setShowLearningPrefsModal(true)}
          />

          {/* Regional Settings Button */}
          <ModalNavigationButton
            title={t('parentZone.regionalSettings.title')}
            description={t('parentZone.regionalSettings.description')}
            emoji="🌍"
            onPress={() => setShowRegionalModal(true)}
          />
        </View>

        {/* Contact & Profile Management Section */}
        <View style={{ padding: 16, paddingTop: 0 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#37474F',
              marginBottom: 16,
            }}
          >
            {t('parentZone.sections.contactsProfiles')}
          </Text>

          {/* My Contacts */}
          <NavigationButton
            title={t('parentZone.navigation.myContacts')}
            description={t('parentZone.navigation.myContactsDesc')}
            emoji="📞"
            onPress={() => router.push('/contacts')}
          />

          {/* Child Profiles */}
          <NavigationButton
            title={t('parentZone.navigation.childProfiles')}
            description={t('parentZone.navigation.childProfilesDesc')}
            emoji="👶"
            onPress={() => setShowProfileModal(true)}
          />
        </View>

        {/* Information Section */}
        <View style={{ padding: 16, paddingTop: 0 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#37474F',
              marginBottom: 16,
            }}
          >
            {t('parentZone.sections.informationProgress')}
          </Text>

          {/* Emergency Info */}
          <NavigationButton
            title={t('parentZone.navigation.emergencyInfo')}
            description={t('parentZone.navigation.emergencyInfoDesc')}
            emoji="🏠"
            onPress={() => setShowEmergencyInfoModal(true)}
          />

          {/* Progress Reports */}
          <NavigationButton
            title={t('parentZone.navigation.progressReports')}
            description={t('parentZone.navigation.progressReportsDesc')}
            emoji="📊"
            onPress={() => setShowProgressReportModal(true)}
          />
        </View>

        {/* Footer */}
        <View style={{ padding: 16, paddingTop: 32 }}>
          <Text style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
            {t('parentZone.footer.version')}
          </Text>
          <Text style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 4 }}>
            {t('parentZone.footer.compliance')}
          </Text>
        </View>
      </ScrollView>

      {/* App Settings Modal */}
      <AppSettingsModal
        visible={showAppSettingsModal}
        onClose={() => setShowAppSettingsModal(false)}
        settings={settings}
        onToggleSoundEffects={(enabled) => updateSetting('soundEffects', enabled)}
        onToggleVoicePrompts={(enabled) => updateSetting('voicePrompts', enabled)}
        onToggleVibration={(enabled) => updateSetting('vibration', enabled)}
        onToggleVoiceRecognition={(enabled) => updateSetting('voiceRecognition', enabled)}
        onToggleAutoDifficulty={(enabled) => updateSetting('autoDifficultyProgress', enabled)}
        onSessionLengthChange={(minutes) => updateSetting('sessionLength', minutes)}
      />

      {/* Learning Preferences Modal */}
      <LearningPreferencesModal
        visible={showLearningPrefsModal}
        onClose={() => setShowLearningPrefsModal(false)}
        currentDifficulty={difficultyLevel}
        onChangeDifficulty={updateDifficultyLevel}
      />

      {/* Regional Settings Modal */}
      <RegionalSettingsModal
        visible={showRegionalModal}
        onClose={() => setShowRegionalModal(false)}
        currentCountryCode={selectedCountryCode}
        currentLanguageCode={selectedLanguage}
        emergencyNumber={SUPPORTED_COUNTRIES.find((c) => c.code === selectedCountryCode)?.emergencyNumber || '911'}
        onChangeCountry={updateCountry}
        onChangeLanguage={updateLanguage}
      />

      {/* Emergency Info Modal */}
      <EmergencyInfoModal
        visible={showEmergencyInfoModal}
        onClose={() => setShowEmergencyInfoModal(false)}
      />

      {/* Progress Report Modal */}
      <ProgressReportModal
        visible={showProgressReportModal}
        onClose={() => setShowProgressReportModal(false)}
      />

      {/* Child Profile Modal */}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileSaved={(profile) => {
          // Refresh the active child name shown in the hub header
          setActiveProfile(profile);
          setLastActivity(Date.now());
        }}
      />
    </SafeAreaView>
  );
}

/**
 * Modal Navigation Button Component
 *
 * Large button that opens a modal dialog for settings/preferences
 * Why: Consolidates related settings into focused modal UIs
 */
function ModalNavigationButton({
  title,
  description,
  emoji,
  onPress,
}: {
  title: string;
  description: string;
  emoji: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Text style={{ fontSize: 40, marginRight: 16 }}>{emoji}</Text>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#37474F', marginBottom: 4 }}>
          {title}
        </Text>
        <Text style={{ fontSize: 14, color: '#666' }}>
          {description}
        </Text>
      </View>

      <Text style={{ fontSize: 24, color: '#CCC' }}>›</Text>
    </Pressable>
  );
}

/**
 * Navigation Button Component
 *
 * Large button for navigating to sub-screens
 */
function NavigationButton({
  title,
  description,
  emoji,
  onPress,
}: {
  title: string;
  description: string;
  emoji: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 40, marginRight: 16 }}>{emoji}</Text>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#37474F', marginBottom: 4 }}>
          {title}
        </Text>
        <Text style={{ fontSize: 14, color: '#666' }}>
          {description}
        </Text>
      </View>

      <Text style={{ fontSize: 24, color: '#CCC' }}>›</Text>
    </Pressable>
  );
}

