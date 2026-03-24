/**
 * Application Constants
 *
 * Business Purpose:
 * Core app-wide constants for configuration, limits, and feature flags.
 * Centralizes magic numbers to improve maintainability and auditability.
 */

// App metadata
export const APP_NAME = 'DialBuddy' as const;
export const APP_VERSION = '1.0.0' as const;
export const APP_SCHEME = 'dialbuddy' as const;

// Feature flags
export const FEATURES = {
  VOICE_RECOGNITION: false,      // Phase 2 - voice recognition for practice
  EMERGENCY_VERIFICATION: false, // Phase 3 - real emergency number verification
  PARENT_REPORTS: true,          // Phase 1 - progress reports for parents
  MULTI_LANGUAGE: true,          // Phase 1 - i18n support
  AUTO_DIFFICULTY: true,         // Phase 1 - adaptive difficulty
  HAPTIC_FEEDBACK: true,         // Phase 1 - vibration feedback
  SOUND_EFFECTS: true,           // Phase 1 - audio feedback
  VOICE_COACHING: false,         // Phase 2 - spoken hints
  MASCOT_ANIMATIONS: false,      // Phase 2 - animated mascot
} as const;

// Dialing constraints
export const DIALING = {
  MAX_DIGIT_LENGTH: 15,          // Maximum phone number length (international format)
  MIN_DIGIT_LENGTH: 3,           // Minimum for emergency numbers
  DTMF_TONE_DURATION: 200,       // Milliseconds per DTMF tone
  DIGIT_PRESS_DELAY: 100,        // Debounce delay for rapid tapping
  AUTO_CALL_DELAY: 3000,         // Delay before simulated call in practice mode
} as const;

// Practice mode settings
export const PRACTICE = {
  MAX_ATTEMPTS_PER_SESSION: 10,  // Prevent frustration from too many tries
  SUCCESS_THRESHOLD: 0.8,        // 80% accuracy to advance difficulty
  HINT_DELAY: 3000,              // Show hint after 3 seconds of inactivity
  CELEBRATION_DURATION: 2000,    // Success animation length
  MAX_MISTAKES_BEFORE_HINT: 3,   // Show progressive hints after mistakes
} as const;

// Contact management
export const CONTACTS = {
  MAX_CONTACTS: 50,              // Reasonable limit for toddlers
  MAX_NAME_LENGTH: 30,           // Character limit for contact names
  MAX_PHONE_LENGTH: 15,          // E.164 international format max
  DEFAULT_AVATAR_COLORS: [       // Fallback colors when no photo
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  ],
} as const;

// Parent Gate security
export const PARENT_GATE = {
  PIN_LENGTH: 4,                 // 4-digit PIN for simplicity
  MAX_ATTEMPTS: 3,               // Lock after 3 failed attempts
  LOCKOUT_DURATION: 300000,      // 5 minutes lockout (milliseconds)
  SESSION_TIMEOUT: 600000,       // 10 minutes before re-auth required
  DEFAULT_PIN: '1234',           // First-time setup default (MUST change)
} as const;

// Storage keys for AsyncStorage
// Business rule: Prefix all keys for namespace isolation
export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'onboarding_complete',
  APP_SETTINGS: 'app_settings',
  PARENT_PIN: 'parent_pin',
  LAST_PARENT_AUTH: 'last_parent_auth',
  SELECTED_LANGUAGE: 'selected_language',
  SOUND_ENABLED: 'sound_enabled',
  HAPTICS_ENABLED: 'haptics_enabled',
  VOICE_ENABLED: 'voice_enabled',
} as const;

// Database table names
export const DB_TABLES = {
  CONTACTS: 'contacts',
  PROGRESS: 'progress',
  SESSIONS: 'practice_sessions',
} as const;

// Error messages - user-friendly, non-technical
// Business requirement: Messages must be understandable by parents
export const ERROR_MESSAGES = {
  DATABASE_INIT_FAILED: 'Unable to start the app. Please restart DialBuddy.',
  CONTACT_SAVE_FAILED: 'Could not save contact. Please try again.',
  CONTACT_DELETE_FAILED: 'Could not delete contact. Please try again.',
  PHOTO_PICKER_FAILED: 'Could not select photo. Please check app permissions.',
  AUDIO_LOAD_FAILED: 'Sound effects unavailable. App will continue without audio.',
  INVALID_PHONE_NUMBER: 'Please enter a valid phone number.',
  MAX_CONTACTS_REACHED: `You can only save ${CONTACTS.MAX_CONTACTS} contacts.`,
  PARENT_GATE_LOCKED: 'Too many incorrect attempts. Try again in 5 minutes.',
  NO_CONTACTS_YET: 'Add your first contact to start practicing!',
} as const;

// Success messages - encouraging and clear
export const SUCCESS_MESSAGES = {
  CONTACT_SAVED: 'Contact saved successfully!',
  CONTACT_DELETED: 'Contact removed.',
  PRACTICE_COMPLETE: 'Great job! You dialed correctly!',
  SETTINGS_SAVED: 'Settings updated.',
  ONBOARDING_COMPLETE: 'Welcome to DialBuddy!',
} as const;

// Emergency number patterns (regex)
// Business rule: Recognize common emergency formats globally
export const EMERGENCY_PATTERNS = {
  US: /^911$/,                   // United States
  EU: /^112$/,                   // European Union
  UK: /^999$/,                   // United Kingdom
  AUSTRALIA: /^000$/,            // Australia
  JAPAN: /^110$/,                // Japan (police)
  MEXICO: /^066$/,               // Mexico
} as const;

// Difficulty levels for practice mode
// Business rule: Progressive complexity based on age/skill
export const DIFFICULTY_LEVELS = {
  EASY: {
    level: 1,
    name: 'Easy',
    maxDigits: 4,                // Short numbers only
    hintsEnabled: true,
    visualGuides: true,
    description: 'Practice with 3-4 digit numbers',
  },
  MEDIUM: {
    level: 2,
    name: 'Medium',
    maxDigits: 7,                // Local numbers
    hintsEnabled: true,
    visualGuides: true,
    description: 'Practice with 7-digit local numbers',
  },
  HARD: {
    level: 3,
    name: 'Hard',
    maxDigits: 10,               // Full phone numbers
    hintsEnabled: false,
    visualGuides: false,
    description: 'Practice with full 10-digit numbers',
  },
  EXPERT: {
    level: 4,
    name: 'Expert',
    maxDigits: 15,               // International numbers
    hintsEnabled: false,
    visualGuides: false,
    description: 'Practice with international numbers',
  },
} as const;

// Analytics events (for future analytics integration)
// Business rule: Track key user actions for UX improvements
export const ANALYTICS_EVENTS = {
  APP_OPENED: 'app_opened',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  CONTACT_ADDED: 'contact_added',
  PRACTICE_STARTED: 'practice_started',
  PRACTICE_COMPLETED: 'practice_completed',
  EMERGENCY_BUTTON_PRESSED: 'emergency_button_pressed',
  PARENT_ZONE_ACCESSED: 'parent_zone_accessed',
  SETTINGS_CHANGED: 'settings_changed',
} as const;

// Type exports
export type FeatureFlag = keyof typeof FEATURES;
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
export type DifficultyLevel = keyof typeof DIFFICULTY_LEVELS;
export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];
