/**
 * TypeScript Type Definitions for DialBuddy
 *
 * Business Purpose:
 * Centralized type definitions ensure type safety across the app.
 * Prevents bugs from typos, wrong data structures, missing fields.
 *
 * Why TypeScript:
 * - Catches errors at compile time (before toddlers test the app)
 * - Self-documenting code (types explain data structures)
 * - Better IDE autocomplete (faster development)
 * - Enforces business rules (e.g., mastery level 0-100)
 */

/**
 * Child Profile
 *
 * Business Rule: Max 5 profiles per device (practical family limit)
 * Each child gets independent progress tracking and preferences.
 */
export interface ChildProfile {
  id: string;
  name: string;
  avatar: string | null; // Photo URI or default avatar ID
  age: number | null;
  createdAt: string; // ISO date
  activeTheme: string; // Theme ID (e.g., 'default', 'space', 'ocean')
  difficultyOverride?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Contact (Parent/Emergency Number)
 *
 * Business Rule: Max 6 contacts per app (keeps UI simple for toddlers)
 * Contacts are shared across all child profiles.
 */
export interface Contact {
  id: string;
  name: string;
  phoneNumber: string; // National digits only (e.g., '2025551234')
  formattedNumber: string; // Locale-formatted display (e.g., '(202) 555-1234')
  digitGrouping: number[]; // For practice mode chunking (e.g., [3, 3, 4])
  avatar: string | null;
  relationship: string; // 'Mom', 'Dad', 'Grandma', etc.
  isEmergency: boolean;
  sortOrder: number;
}

/**
 * Progress for a child practicing a specific contact's number
 *
 * Business Rule: Mastery level 0-100%, auto-advances difficulty at thresholds
 */
export interface Progress {
  profileId: string;
  contactId: string;
  totalAttempts: number;
  successfulDials: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticed: string | null; // ISO date
  masteryLevel: number; // 0-100
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  hintsUsed: number;
  simonSaysBest: number; // Best sequence length in Simon Says mode
}

/**
 * Emergency Scenario Progress
 *
 * Business Rule: Spaced repetition intervals: 1d → 3d → 7d → 14d → 30d
 */
export interface EmergencyProgress {
  profileId: string;
  scenarioId: string;
  correctCount: number;
  incorrectCount: number;
  consecutiveCorrect: number; // Resets to 0 on wrong answer
  lastPracticed: string | null;
  nextDue: string | null; // ISO date
  intervalDays: number;
}

/**
 * App Settings
 *
 * Stored in AsyncStorage (simple key-value, not relational)
 */
export interface AppSettings {
  soundEffects: boolean;
  voicePrompts: boolean;
  vibration: boolean;
  voiceRecognition: boolean; // Beta feature
  hintDelay: number; // Seconds before hint appears
  sessionLength: number; // Minutes before break prompt
  autoDifficultyProgress: boolean;
}

/**
 * Locale Configuration
 *
 * Drives emergency numbers, phone formatting, TTS language
 */
export interface LocaleConfig {
  countryCode: string; // ISO 3166-1 alpha-2 (e.g., 'US', 'BR', 'MX')
  languageCode: string; // BCP 47 (e.g., 'en-US', 'pt-BR', 'es-MX')
  emergencyNumbers: string[];
  primaryEmergencyNumber: string;
  phoneFormat: {
    countryCallingCode: string; // e.g., '+1', '+55', '+52'
    exampleNumber: string;
    digitGrouping: number[];
    minLength: number;
    maxLength: number;
  };
  speechLang: string; // For expo-speech TTS
  rtl: boolean; // Right-to-left text (Arabic, Hebrew)
}

/**
 * Difficulty Levels
 *
 * Business Logic:
 * - Beginner: One highlighted digit at a time
 * - Intermediate: Digit groups (locale-aware chunking)
 * - Advanced: Full number from contact photo only
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Theme/Skin
 *
 * Business Purpose: Keep app fresh and engaging for repeat use
 */
export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    buttonFace: string;
    buttonBorder: string;
    textPrimary: string;
  };
  buttonShape: 'rounded-square' | 'circle' | 'bubble' | 'leaf' | 'egg' | 'gem';
  backgroundPattern: string;
  mascotVariant: string;
  unlockCondition?: string; // Optional: milestone to unlock theme
}
