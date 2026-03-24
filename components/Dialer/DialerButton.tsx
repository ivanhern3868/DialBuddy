/**
 * DialerButton Component - Single Phone Keypad Button
 *
 * Business Purpose:
 * Each button represents one digit on a phone keypad. This is the most-tapped
 * UI element in the app - must be sized for 3-4 year old fingers and provide
 * immediate multi-sensory feedback (visual, audio, haptic).
 *
 * Design Principles for Ages 3-4:
 * - Large touch targets (80×80px minimum, exceeds WCAG 44×44px)
 * - High contrast colors (sky blue on white background)
 * - Instant feedback (no loading states, feels like real phone button)
 * - Clear visual press state (button shrinks slightly on press)
 * - Haptic feedback (gentle vibration on supported devices)
 *
 * Accessibility:
 * - Screen reader support (announces digit name: "Button: 5, J K L")
 * - Works without sound (visual feedback alone is sufficient)
 * - Works without haptics (audio + visual feedback alone is sufficient)
 */

import React, { useState, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { playDTMFTone, DTMFDigit } from '../../utils/audio/dtmfTones';

/**
 * Letter mapping for digits 2-9
 * Why include: Children see this on parent phones, teaches alphabet association
 * Business Rule: Standard ITU E.161 layout (same as all phones worldwide)
 */
const LETTER_MAP: Record<string, string> = {
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
};

/**
 * Props for DialerButton component
 */
interface DialerButtonProps {
  /** The digit this button represents (0-9, *, #) */
  digit: DTMFDigit;

  /** Callback when button is pressed - parent component handles dialed digits */
  onPress: (digit: DTMFDigit) => void;

  /** Whether sound effects are enabled (from AppSettings) */
  soundEnabled?: boolean;

  /** Whether haptic feedback is enabled (from AppSettings) */
  hapticsEnabled?: boolean;

  /** Optional custom button size (default 100px - extra large for toddler fingers) */
  size?: number;

  /** Whether this button is currently disabled (used in practice modes) */
  disabled?: boolean;

  /**
   * Whether this button is the currently expected digit in practice mode.
   * Fills the entire button face with amber so the child's eye is drawn to it.
   * Takes lower visual priority than isFlashing (correct-press green wins).
   */
  isHighlighted?: boolean;

  /**
   * Whether this button should flash green (correct digit feedback)
   * Combined with flashKey: parent sets isFlashing=true on the correct digit
   * and increments flashKey to re-trigger the effect even on repeated digits.
   */
  isFlashing?: boolean;

  /**
   * Increments each time a correct digit is pressed.
   * Triggers the green flash effect via useEffect even if same digit repeats.
   */
  flashKey?: number;
}

/**
 * DialerButton Component
 *
 * Renders a single phone keypad button with:
 * - Large digit (primary)
 * - Small letters below (secondary, if applicable)
 * - Touch feedback (press animation)
 * - Audio feedback (DTMF tone)
 * - Haptic feedback (gentle impact)
 */
export default function DialerButton({
  digit,
  onPress,
  soundEnabled = true,
  hapticsEnabled = true,
  size = 100,
  disabled = false,
  isHighlighted = false,
  isFlashing = false,
  flashKey = 0,
}: DialerButtonProps) {
  /**
   * Green flash state — true for 300ms when a correct digit is pressed.
   * Why 300ms: Long enough to be clearly visible to a toddler, short enough
   * to not delay the next digit press.
   */
  const [showGreen, setShowGreen] = useState(false);

  /**
   * Re-trigger green flash whenever flashKey changes AND this button is the
   * correct one. flashKey handles the case where the same digit appears
   * consecutively (e.g., "555") — useEffect wouldn't fire on isFlashing
   * alone since it stays true.
   */
  useEffect(() => {
    if (isFlashing && flashKey > 0) {
      setShowGreen(true);
      const timer = setTimeout(() => setShowGreen(false), 300);
      return () => clearTimeout(timer);
    }
  }, [flashKey, isFlashing]);
  /**
   * Handle button press
   *
   * Business Flow:
   * 1. Play DTMF tone (if sound enabled) - fire-and-forget for instant feedback
   * 2. Trigger haptic feedback (if haptics enabled) - fire-and-forget
   * 3. Call parent's onPress handler (adds digit to dialed number)
   *
   * Why synchronous: All feedback is fire-and-forget for instant UI response
   * Audio/haptics play in background while UI updates immediately
   */
  const handlePress = () => {
    if (disabled) return;

    // Play DTMF tone - synchronous call, audio plays in background
    // Why fire-and-forget: Toddlers tap rapidly, can't wait for audio operations
    playDTMFTone(digit, soundEnabled);

    // Trigger haptic feedback - fire-and-forget
    // Why light impact: Gentle vibration feels like physical button press without startling toddlers
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        // Non-critical: Some devices don't support haptics (silently ignore)
      });
    }

    // Notify parent component immediately
    onPress(digit);
  };

  // Get letters for this digit (2-9 only)
  const letters = LETTER_MAP[digit] || '';

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${digit}${letters ? `, ${letters}` : ''}`}
      accessibilityHint="Press to dial this number"
      style={{
        // Size
        width: size,
        height: size,
        // Centering - CRITICAL for proper alignment
        alignItems: 'center',
        justifyContent: 'center',
        // Priority: green flash (correct) > amber highlight (expected) > white (idle)
        backgroundColor: showGreen ? '#C8E6C9' : isHighlighted ? '#FFD54F' : '#FFFFFF',
        borderRadius: 16,
        borderWidth: 2,
        // Border matches fill: green on flash, amber on highlight, blue normally
        borderColor: showGreen ? '#4CAF50' : isHighlighted ? '#FFA000' : '#4FC3F7',
        // Opacity for disabled state
        opacity: disabled ? 0.3 : 1,
        // Shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {({ pressed }) => (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {/* Main digit - large and prominent */}
          <Text
            style={{
              fontSize: 44,
              fontWeight: 'bold',
              // Green on flash, orange on press, blue normally
              color: showGreen ? '#2E7D32' : pressed ? '#FF6F00' : isHighlighted ? '#E65100' : '#4FC3F7',
            }}
          >
            {digit}
          </Text>

          {/* Letter mapping - small and secondary.
              Why ternary (not &&): On web, `'' && <Text>` returns '' which
              React Native Web treats as a bare text node inside View — crash. */}
          {letters ? (
            <Text
              style={{
                fontSize: 15,
                color: pressed ? '#FF6F00' : '#999999',
                marginTop: -5,
                letterSpacing: 1,
              }}
            >
              {letters}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
