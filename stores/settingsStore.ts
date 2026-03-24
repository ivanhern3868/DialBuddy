/**
 * Settings Store (Zustand)
 *
 * Business Purpose:
 * Manages global app settings with persistent storage.
 * Settings are loaded from AsyncStorage on app start and saved on changes.
 *
 * Stakeholders:
 * - Parents: Configure app behavior for their child
 * - Children: Experience reflects parent preferences
 *
 * State Management:
 * Uses Zustand for reactive state updates across components.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/app';

/**
 * App Settings Interface
 *
 * All settings are optional to handle partial loads from storage.
 * Defaults are applied if values are missing.
 */
export interface AppSettings {
  // Audio settings
  soundEffects: boolean;          // DTMF tones and button sounds
  voiceCoaching: boolean;         // Spoken hints and encouragement (Phase 2)

  // Haptic feedback
  hapticFeedback: boolean;        // Vibration on button press

  // Practice mode settings
  voiceRecognition: boolean;      // Voice-based practice (Phase 2)
  autoDifficulty: boolean;        // Automatically adjust difficulty

  // Language preference
  language: 'en' | 'es' | 'pt-BR';

  // Parent controls
  emergencyOnly: boolean;         // Restrict to emergency numbers only
  requireParentGate: boolean;     // Require PIN for settings access
}

/**
 * Default Settings
 *
 * Business rationale:
 * - Sound ON: Multi-sensory learning is core to the app's educational value
 * - Voice OFF: Requires additional setup, opt-in for Phase 2
 * - Haptics ON: Tactile feedback helps motor skill development
 * - Auto difficulty ON: Adapts to child's skill level automatically
 * - English default: Can be changed in onboarding
 * - Emergency only OFF: App should allow practice with any number
 * - Parent gate ON: Privacy and safety first
 */
const DEFAULT_SETTINGS: AppSettings = {
  soundEffects: true,
  voiceCoaching: false,
  hapticFeedback: true,
  voiceRecognition: false,
  autoDifficulty: true,
  language: 'en',
  emergencyOnly: false,
  requireParentGate: true,
};

/**
 * Settings Store State
 */
interface SettingsState {
  settings: AppSettings;
  isLoaded: boolean;              // Track if settings loaded from storage

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;

  // Individual setters for convenience
  setSoundEffects: (enabled: boolean) => Promise<void>;
  setVoiceCoaching: (enabled: boolean) => Promise<void>;
  setHapticFeedback: (enabled: boolean) => Promise<void>;
  setLanguage: (lang: 'en' | 'es' | 'pt-BR') => Promise<void>;
}

/**
 * Settings Store
 *
 * Usage:
 * ```tsx
 * const { settings, updateSettings } = useSettingsStore();
 *
 * // Read a setting
 * if (settings.soundEffects) {
 *   playSound();
 * }
 *
 * // Update a setting
 * await updateSettings({ soundEffects: false });
 * ```
 */
export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  /**
   * Load settings from AsyncStorage
   *
   * Called on app startup to restore user preferences.
   * Merges stored settings with defaults to handle missing keys.
   */
  loadSettings: async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);

      if (storedSettings) {
        const parsed = JSON.parse(storedSettings) as Partial<AppSettings>;

        // Merge with defaults to ensure all keys exist
        set({
          settings: { ...DEFAULT_SETTINGS, ...parsed },
          isLoaded: true,
        });

        console.log('[SettingsStore] Settings loaded from storage');
      } else {
        // First run - use defaults
        set({ isLoaded: true });
        console.log('[SettingsStore] Using default settings (first run)');
      }
    } catch (error) {
      console.error('[SettingsStore] Failed to load settings:', error);
      // Fall back to defaults on error
      set({ isLoaded: true });
    }
  },

  /**
   * Update settings
   *
   * Merges partial settings with current state and persists to storage.
   *
   * Business rule: All settings changes are immediately persisted.
   * This prevents data loss if the app crashes or is force-closed.
   */
  updateSettings: async (partial: Partial<AppSettings>) => {
    try {
      const newSettings = { ...get().settings, ...partial };

      // Update state
      set({ settings: newSettings });

      // Persist to storage
      await AsyncStorage.setItem(
        STORAGE_KEYS.APP_SETTINGS,
        JSON.stringify(newSettings)
      );

      console.log('[SettingsStore] Settings updated and saved:', partial);
    } catch (error) {
      console.error('[SettingsStore] Failed to save settings:', error);
      // State is still updated even if save fails
      // This prevents UI inconsistency
    }
  },

  /**
   * Reset to defaults
   *
   * Used in parent zone to restore factory settings.
   */
  resetSettings: async () => {
    try {
      set({ settings: DEFAULT_SETTINGS });

      await AsyncStorage.setItem(
        STORAGE_KEYS.APP_SETTINGS,
        JSON.stringify(DEFAULT_SETTINGS)
      );

      console.log('[SettingsStore] Settings reset to defaults');
    } catch (error) {
      console.error('[SettingsStore] Failed to reset settings:', error);
    }
  },

  // Convenience setters for common operations
  setSoundEffects: async (enabled: boolean) => {
    await get().updateSettings({ soundEffects: enabled });
  },

  setVoiceCoaching: async (enabled: boolean) => {
    await get().updateSettings({ voiceCoaching: enabled });
  },

  setHapticFeedback: async (enabled: boolean) => {
    await get().updateSettings({ hapticFeedback: enabled });
  },

  setLanguage: async (lang: 'en' | 'es' | 'pt-BR') => {
    await get().updateSettings({ language: lang });
  },
}));
