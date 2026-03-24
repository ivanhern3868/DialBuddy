/**
 * DialerPad Component - Complete Phone Keypad (0-9, *, #)
 *
 * Business Purpose:
 * Renders a standard 4x3 phone keypad layout for practicing dialing.
 * This is the core interaction element - must be simple, centered, and reliable.
 *
 * Layout (ITU E.161 Standard):
 * ┌─────┬─────┬─────┐
 * │  1  │  2  │  3  │
 * ├─────┼─────┼─────┤
 * │  4  │  5  │  6  │
 * ├─────┼─────┼─────┤
 * │  7  │  8  │  9  │
 * ├─────┼─────┼─────┤
 * │  *  │  0  │  #  │
 * └─────┴─────┴─────┘
 *
 * REBUILD NOTE:
 * This file was rebuilt from scratch to fix centering issues.
 * Key changes:
 * - Simplified centering approach (just alignItems: 'center')
 * - Consistent highlight padding on all buttons
 * - Compact spacing (gap: 8px)
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import DialerButton from './DialerButton';
import { DTMFDigit } from '../../utils/audio/dtmfTones';


/**
 * Props for DialerPad component
 */
interface DialerPadProps {
  /** Callback when any button is pressed */
  onDigitPress: (digit: DTMFDigit) => void;

  /** Whether sound effects are enabled */
  soundEnabled?: boolean;

  /** Whether haptic feedback is enabled */
  hapticsEnabled?: boolean;

  /** Optional: Disable specific buttons (used in practice modes) */
  disabledDigits?: Set<DTMFDigit>;

  /** Optional: Highlight specific buttons (used in beginner mode hints) */
  highlightedDigits?: Set<DTMFDigit>;

  /**
   * Optional: Key that changes when a new digit press is expected
   * Used to trigger pulse animation even when same digit repeats (e.g., "555")
   */
  pulseKey?: number;

  /**
   * Increments on each wrong digit press.
   * Triggers a horizontal shake of the entire pad — gives toddlers a clear
   * "not that one" signal without harsh audio or text they can't read.
   */
  shakeKey?: number;

  /**
   * The digit that was most recently pressed correctly.
   * Passed down to DialerButton so only that button flashes green.
   */
  flashDigit?: DTMFDigit | null;

  /**
   * Increments on each correct digit press.
   * Paired with flashDigit so buttons re-trigger flash even on repeated digits.
   */
  flashKey?: number;

  /**
   * Size of each button in pixels (width and height).
   * Defaults to 100px (the DialerButton default).
   * Pass 75 for practice mode (25% smaller than the free-dial default).
   */
  buttonSize?: number;
}

/**
 * Keypad layout definition (ITU E.161 standard)
 */
const KEYPAD_LAYOUT: DTMFDigit[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

/**
 * DialerPad Component
 *
 * Simplified implementation focusing on proper centering and highlight alignment.
 */
export default function DialerPad({
  onDigitPress,
  soundEnabled = true,
  hapticsEnabled = true,
  disabledDigits,
  highlightedDigits,
  pulseKey = 0,
  shakeKey = 0,
  flashDigit = null,
  flashKey = 0,
  buttonSize = 100,
}: DialerPadProps) {
  /**
   * Animation value for pulsing effect on highlighted buttons
   * Business Purpose: Visual indication that a new digit is expected
   */
  const pulseAnim = useRef(new Animated.Value(1)).current;

  /**
   * Animation value for wrong-digit shake (horizontal translation).
   * Why translateX: A side-to-side shake is universally understood as "wrong"
   * and is gentle enough not to startle a toddler.
   */
  const shakeAnim = useRef(new Animated.Value(0)).current;

  /**
   * Trigger pulse animation whenever pulseKey changes
   * This handles repeated digits (e.g., "555") - each press gets a fresh pulse
   */
  useEffect(() => {
    // Only animate if there are highlighted digits
    if (highlightedDigits && highlightedDigits.size > 0) {
      pulseAnim.setValue(1);
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [pulseKey, highlightedDigits]);

  /**
   * Shake animation on wrong digit press.
   * Pattern: rapid left-right-left movement, 3 cycles, settles back to center.
   * Why short duration (50ms each): Fast enough to feel like a "boing" not a slide.
   */
  useEffect(() => {
    if (shakeKey === 0) return; // Skip on initial mount

    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeKey]);

  return (
    <Animated.View
      style={{
        alignSelf: 'center',
        transform: [{ translateX: shakeAnim }],
      }}
    >
      {/* Render each row of buttons */}
      {KEYPAD_LAYOUT.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={{
            // Horizontal layout for 3-button rows
            flexDirection: 'row',
            // Center the row
            justifyContent: 'center',
            // Spacing between rows
            marginBottom: rowIndex < 3 ? 8 : 0,
            // Spacing between buttons
            gap: 8,
          }}
        >
          {/* Render each button in the row */}
          {row.map((digit) => {
            const isDisabled = disabledDigits?.has(digit) || false;
            const isHighlighted = highlightedDigits?.has(digit) || false;

            return (
              <View
                key={digit}
                style={{
                  // Outer glow around the button when highlighted.
                  // The button face itself is colored via isHighlighted prop;
                  // this wrapper adds a soft amber halo for extra visibility.
                  borderRadius: 20,
                  shadowColor: '#FFD54F',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isHighlighted ? 0.9 : 0,
                  shadowRadius: isHighlighted ? 12 : 0,
                  elevation: isHighlighted ? 8 : 0,
                }}
              >
                <DialerButton
                  digit={digit}
                  onPress={onDigitPress}
                  soundEnabled={soundEnabled}
                  hapticsEnabled={hapticsEnabled}
                  disabled={isDisabled}
                  isHighlighted={isHighlighted}
                  isFlashing={digit === flashDigit}
                  flashKey={flashKey}
                  size={buttonSize}
                />
              </View>
            );
          })}
        </View>
      ))}
    </Animated.View>
  );
}
