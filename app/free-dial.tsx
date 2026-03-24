/**
 * Free Dial Screen - Exploratory Play Mode
 *
 * Business Purpose:
 * Allows children to dial any number without guidance or correction. This is
 * the "sandbox" mode where toddlers can explore cause-and-effect (button → tone)
 * and build familiarity with the keypad layout.
 *
 * Learning Benefits:
 * - Low-pressure exploration (no right/wrong answers)
 * - Muscle memory development (keypad layout)
 * - Sensory feedback loop (visual + audio + haptic)
 * - Confidence building before structured practice
 *
 * Safety Note:
 * Free Dial does NOT actually place calls. It only plays DTMF tones locally.
 * No network access, no telephony APIs, purely educational.
 */

import React from 'react';
import DialerScreen from '../components/Dialer/DialerScreen';

/**
 * Free Dial Screen
 *
 * Simple wrapper around DialerScreen in 'free' mode.
 * No target number, no validation, just pure exploration.
 */
export default function FreeDialScreen() {
  return (
    <DialerScreen
      mode="free"
      soundEnabled={true}
      hapticsEnabled={true}
    />
  );
}
