/**
 * DialerDisplay Component - Shows Dialed Number
 *
 * Business Purpose:
 * Visual feedback showing what digits the child has pressed. This is critical
 * for learning - children need to see their input to understand the sequence
 * of dialing and develop number recognition.
 *
 * Design for Ages 3-4:
 * - Extra large digits (48px font size)
 * - Letter spacing for easier counting
 * - Visual backspace button (no keyboard required)
 * - Shows contact photo when in practice mode (visual association)
 *
 * Learning Principles:
 * - Immediate visual feedback (digit appears instantly)
 * - Clear correction mechanism (backspace button)
 * - Contact photo provides context ("Calling Mom...")
 * - Formatted display helps with chunking (202-555-1234 easier than 2025551234)
 */

import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Props for DialerDisplay component
 */
interface DialerDisplayProps {
  /** The digits dialed so far (e.g., "2025551234") */
  dialedNumber: string;

  /** Callback to remove last digit (backspace) */
  onBackspace: () => void;

  /** Optional contact name (shown in practice mode: "Calling Mom...") */
  contactName?: string;

  /** Optional contact photo URI (shown in practice mode) */
  contactPhoto?: string | null;

  /** Whether haptic feedback is enabled */
  hapticsEnabled?: boolean;

  /** Optional formatter function (formats as (202) 555-1234) */
  formatNumber?: (number: string) => string;
}

/**
 * Default number formatter
 * Business Rule: US formatting by default (customizable per locale)
 *
 * @param number - Raw digit string (e.g., "2025551234")
 * @returns Formatted string (e.g., "(202) 555-1234")
 */
function defaultFormatter(number: string): string {
  // No formatting for short numbers
  if (number.length <= 3) return number;

  // US format: (XXX) XXX-XXXX
  if (number.length <= 10) {
    const areaCode = number.slice(0, 3);
    const prefix = number.slice(3, 6);
    const line = number.slice(6, 10);

    if (number.length <= 6) {
      return `(${areaCode}) ${prefix}`;
    }
    return `(${areaCode}) ${prefix}-${line}`;
  }

  // International or extra-long numbers (show raw)
  // Why: Some countries have 11+ digit numbers
  return number;
}

/**
 * DialerDisplay Component
 *
 * Shows:
 * - Contact photo (if in practice mode)
 * - "Calling [Name]..." label (if in practice mode)
 * - Dialed digits (large, formatted)
 * - Backspace button (clears last digit)
 */
export default function DialerDisplay({
  dialedNumber,
  onBackspace,
  contactName,
  contactPhoto,
  hapticsEnabled = true,
  formatNumber = defaultFormatter,
}: DialerDisplayProps) {
  /**
   * Handle backspace button press
   *
   * Business Flow:
   * 1. Trigger haptic feedback (if enabled)
   * 2. Call parent's onBackspace handler (removes last digit)
   */
  const handleBackspace = () => {
    if (dialedNumber.length === 0) return; // Nothing to delete

    // Haptic feedback for backspace
    // Why light impact: Consistent with dialer button feedback
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch((error) => {
        console.warn('[DialBuddy] Haptic feedback failed:', error);
      });
    }

    onBackspace();
  };

  // Format the dialed number for display
  const formattedNumber = formatNumber(dialedNumber);

  return (
    <View className="bg-white rounded-3xl p-6 mb-6 shadow-lg border border-gray-200">
      {/* Contact photo and name (practice mode only) */}
      {contactName && (
        <View className="items-center mb-4">
          {/* Contact photo */}
          {contactPhoto ? (
            <Image
              source={{ uri: contactPhoto }}
              className="w-20 h-20 rounded-full mb-3"
              style={{
                // Why circular: Matches contact list design, friendly appearance
                borderWidth: 3,
                borderColor: '#4FC3F7', // Primary color border
              }}
            />
          ) : (
            // Default avatar (if no photo)
            <View
              className="w-20 h-20 rounded-full mb-3 bg-primary items-center justify-center"
              style={{
                borderWidth: 3,
                borderColor: '#4FC3F7',
              }}
            >
              <Text className="text-white text-4xl font-bold">
                {contactName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* "Calling [Name]..." label */}
          <Text className="text-lg text-gray-600 font-medium">
            Calling {contactName}...
          </Text>
        </View>
      )}

      {/* Dialed number display */}
      <View className="flex-row items-center justify-between min-h-[60px]">
        {/* Number display area */}
        <View className="flex-1 justify-center">
          {dialedNumber.length > 0 ? (
            <Text
              className="text-text font-bold"
              style={{
                fontSize: 48, // Extra large for toddler visibility
                letterSpacing: 2, // Space out digits for easier counting
                // Why monospace: Digits align vertically, easier to scan
                fontVariant: ['tabular-nums'],
              }}
            >
              {formattedNumber}
            </Text>
          ) : (
            // Placeholder when no digits entered
            <Text className="text-gray-400 text-2xl">
              Tap numbers to dial
            </Text>
          )}
        </View>

        {/* Backspace button */}
        {dialedNumber.length > 0 && (
          <Pressable
            onPress={handleBackspace}
            accessibilityRole="button"
            accessibilityLabel="Delete last digit"
            className="ml-4 p-3 rounded-xl bg-gray-100 active:bg-gray-200"
          >
            {/* Backspace icon (← symbol) */}
            <Text className="text-3xl text-gray-700">⌫</Text>
          </Pressable>
        )}
      </View>

      {/* Digit count helper (for practice mode) */}
      {contactName && dialedNumber.length > 0 && (
        <Text className="text-sm text-gray-500 mt-2 text-center">
          {dialedNumber.length} {dialedNumber.length === 1 ? 'digit' : 'digits'}
        </Text>
      )}
    </View>
  );
}
