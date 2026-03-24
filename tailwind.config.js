/**
 * Tailwind CSS Configuration for DialBuddy
 *
 * Business Purpose:
 * Defines design system tokens (colors, spacing, typography) ensuring
 * consistent visual language across all screens. Brand colors chosen
 * specifically for child-friendly UI (calm blues, cheerful yellows).
 *
 * Why NativeWind:
 * Utility-first CSS for React Native enables rapid UI development with
 * consistent design tokens. Familiar DX for web developers, works
 * identically on iOS/Android/Web.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // DialBuddy Brand Colors (from spec)
        // Chosen for child-friendly, calm, engaging visual experience
        primary: '#4FC3F7',      // Sky Blue - friendly, calm, trustworthy
        secondary: '#FFD54F',    // Warm Yellow - cheerful, playful
        success: '#81C784',      // Soft Green - encouraging, positive
        error: '#FF8A80',        // Soft Red/Coral - NOT harsh red (gentle for kids)
        background: '#F5F5F5',   // Light warm gray - easy on eyes
        text: '#37474F',         // Dark blue-gray - high contrast, readable

        // Semantic colors for UI states
        buttonFace: '#FFFFFF',   // White number buttons
        buttonBorder: '#4FC3F7', // Primary blue borders
      },
      fontFamily: {
        // Nunito - rounded, friendly font for ages 3-4
        // High legibility, approachable aesthetic
        nunito: ['Nunito-Regular'],
        nunitoBold: ['Nunito-Bold'],
      },
      spacing: {
        // Custom spacing for child-friendly touch targets
        // WCAG AAA requires 44×44px minimum, we use 64×64px for small fingers
        touch: '64px',    // Minimum touch target for 3-4 year olds
        dialPad: '80px',  // Dialer button size (larger than minimum)
      },
      borderRadius: {
        // Rounded corners create friendlier, less intimidating UI
        button: '12px',   // Standard button radius
        card: '16px',     // Card/panel radius
        large: '24px',    // Large elements (modals, celebrations)
      },
    },
  },
  plugins: [],
};
