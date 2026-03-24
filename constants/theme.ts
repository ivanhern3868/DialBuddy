/**
 * Theme Constants
 *
 * Business Purpose:
 * Centralized theme configuration for consistent UI across the app.
 * Colors optimized for toddler visibility and COPPA compliance.
 *
 * Design Philosophy:
 * - High contrast for developing vision
 * - Bright, friendly colors for engagement
 * - Clear visual hierarchy for safety features
 */

export const COLORS = {
  // Primary brand colors - bright and engaging for toddlers
  PRIMARY: '#4FC3F7',        // Light Blue - main brand color, calm and friendly
  SECONDARY: '#FFB74D',      // Orange - warm, attention-grabbing
  ACCENT: '#81C784',         // Green - positive reinforcement, success states

  // Semantic colors - clear meaning for safety
  SUCCESS: '#66BB6A',        // Green - correct actions, achievements
  WARNING: '#FFA726',        // Orange - caution, needs attention
  ERROR: '#EF5350',          // Red - errors, dangerous actions
  EMERGENCY: '#F44336',      // Bright Red - emergency button (high visibility)

  // UI colors - neutral and accessible
  BACKGROUND: '#FFFFFF',     // White - clean, simple background
  SURFACE: '#F5F5F5',        // Light Gray - cards, elevated surfaces
  BORDER: '#E0E0E0',         // Gray - subtle borders

  // Text colors - high contrast for readability
  TEXT_PRIMARY: '#212121',   // Dark Gray - primary text
  TEXT_SECONDARY: '#757575', // Medium Gray - secondary text
  TEXT_DISABLED: '#BDBDBD',  // Light Gray - disabled states

  // Interactive states - clear feedback
  ACTIVE: '#42A5F5',         // Blue - active/pressed state
  INACTIVE: '#BDBDBD',       // Gray - inactive/disabled state
  HOVER: '#E3F2FD',          // Very Light Blue - hover state (web only)

  // Parent Zone colors - distinct from child areas
  PARENT_PRIMARY: '#7E57C2', // Purple - adult features
  PARENT_GATE: '#5E35B1',    // Dark Purple - security/restricted
} as const;

export const SPACING = {
  // Consistent spacing scale for layout
  // Larger spacing for toddler-friendly touch targets
  XXS: 4,
  XS: 8,
  SM: 12,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
  XXXL: 64,
} as const;

export const TYPOGRAPHY = {
  // Font sizes - larger for developing literacy
  FONT_SIZE_XS: 12,
  FONT_SIZE_SM: 14,
  FONT_SIZE_MD: 16,
  FONT_SIZE_LG: 20,
  FONT_SIZE_XL: 24,
  FONT_SIZE_XXL: 32,
  FONT_SIZE_XXXL: 48,    // Large numbers for dialer

  // Font weights
  FONT_WEIGHT_REGULAR: '400' as const,
  FONT_WEIGHT_MEDIUM: '600' as const,
  FONT_WEIGHT_BOLD: '700' as const,
  FONT_WEIGHT_BLACK: '900' as const,

  // Line heights
  LINE_HEIGHT_TIGHT: 1.2,
  LINE_HEIGHT_NORMAL: 1.5,
  LINE_HEIGHT_RELAXED: 1.8,
} as const;

export const BORDER_RADIUS = {
  // Rounded corners - friendly, safe appearance
  NONE: 0,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  FULL: 9999,  // Perfect circles
} as const;

export const SHADOWS = {
  // Elevation levels for depth perception
  NONE: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  SM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  MD: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  LG: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const TOUCH_TARGETS = {
  // Minimum touch target sizes (44x44 iOS, 48x48 Android)
  // Using 56x56 for toddler-friendly larger targets
  MIN_SIZE: 56,
  BUTTON_HEIGHT: 56,
  DIALER_BUTTON_SIZE: 72,  // Extra large for number pad
  ICON_SIZE_SM: 20,
  ICON_SIZE_MD: 24,
  ICON_SIZE_LG: 32,
  ICON_SIZE_XL: 48,
} as const;

export const ANIMATION = {
  // Animation durations (milliseconds)
  DURATION_FAST: 150,
  DURATION_NORMAL: 250,
  DURATION_SLOW: 350,

  // Easing curves
  EASING_DEFAULT: 'ease-in-out' as const,
  EASING_ENTRANCE: 'ease-out' as const,
  EASING_EXIT: 'ease-in' as const,
} as const;

// Type exports for TypeScript autocomplete
export type ColorKey = keyof typeof COLORS;
export type SpacingKey = keyof typeof SPACING;
export type ShadowKey = keyof typeof SHADOWS;
