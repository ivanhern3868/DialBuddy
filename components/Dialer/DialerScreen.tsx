/**
 * DialerScreen Component - Complete Dialing Interface
 *
 * Business Purpose:
 * Main screen for Free Dial mode and Practice modes. Combines the display
 * (showing dialed digits) and keypad (for input) into a complete phone interface.
 *
 * This is the most-used screen in DialBuddy - children will spend 80%+ of their
 * time here, building muscle memory through repetition.
 *
 * Three Usage Modes:
 * 1. Free Dial - Child can dial any number (exploratory play)
 * 2. Practice Mode - Child practices specific contact's number (guided learning)
 * 3. Emergency Mode - Child practices 911/local emergency (critical skill)
 *
 * Design Principles:
 * - No visual clutter (just display + keypad + minimal chrome)
 * - Full-screen immersion (no distractions for toddlers)
 * - Clear exit path (back button always visible)
 * - Positive reinforcement (celebration on correct completion)
 */

import React, { useState } from 'react';
import { View, Pressable, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DialerDisplay from './DialerDisplay';
import DialerPad from './DialerPad';
import { DTMFDigit } from '../../utils/audio/dtmfTones';
import { Contact } from '../../types';

/**
 * Props for DialerScreen component
 */
interface DialerScreenProps {
  /** Mode: 'free' (any number), 'practice' (specific contact), 'emergency' (911) */
  mode: 'free' | 'practice' | 'emergency';

  /** Contact being practiced (required for 'practice' mode) */
  contact?: Contact;

  /** Target emergency number (required for 'emergency' mode) */
  emergencyNumber?: string;

  /** Callback when dial is completed successfully (practice modes only) */
  onComplete?: (dialedNumber: string, isCorrect: boolean) => void;

  /** App settings (sound, haptics) */
  soundEnabled?: boolean;
  hapticsEnabled?: boolean;
}

/**
 * DialerScreen Component
 *
 * Complete dialing interface with:
 * - Number display (shows dialed digits)
 * - Phone keypad (12 buttons)
 * - Back button (exit to home)
 * - Success feedback (celebration on correct dial)
 */
export default function DialerScreen({
  mode,
  contact,
  emergencyNumber,
  onComplete,
  soundEnabled = true,
  hapticsEnabled = true,
}: DialerScreenProps) {
  const router = useRouter();

  // Get safe area insets for manual padding (ensures bottom nav bar doesn't overlap)
  const insets = useSafeAreaInsets();

  // Calculate bottom padding with fallback
  // Why Math.max: Some Android devices report insets.bottom as 0 even with soft nav bar
  const bottomPadding = Math.max(insets.bottom, 24);

  // Dialed number state (accumulates as child presses buttons)
  const [dialedNumber, setDialedNumber] = useState('');

  // Target number (what child should dial in practice/emergency modes)
  const targetNumber =
    mode === 'practice' ? contact?.phoneNumber :
    mode === 'emergency' ? emergencyNumber :
    null;

  /**
   * Handle digit press from keypad
   *
   * Business Flow:
   * 1. Append digit to dialed number
   * 2. Check if matches target length (practice/emergency modes)
   * 3. If complete, validate and trigger success/retry feedback
   *
   * @param digit - The digit pressed (0-9, *, #)
   */
  const handleDigitPress = (digit: DTMFDigit) => {
    const newNumber = dialedNumber + digit;
    setDialedNumber(newNumber);

    // Check for completion in practice/emergency modes
    if (targetNumber && newNumber.length === targetNumber.length) {
      const isCorrect = newNumber === targetNumber;

      // Notify parent component (records progress, shows celebration)
      if (onComplete) {
        onComplete(newNumber, isCorrect);
      }

      // Auto-reset after feedback
      // Why 2 second delay: Gives child time to see success/error feedback
      setTimeout(() => {
        setDialedNumber('');
      }, 2000);
    }
  };

  /**
   * Handle backspace (delete last digit)
   */
  const handleBackspace = () => {
    setDialedNumber(dialedNumber.slice(0, -1));
  };

  /**
   * Handle back button (exit to home)
   */
  const handleBack = () => {
    if (router.canGoBack()) { router.back(); } else { router.replace('/'); }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F5F5F5',
        // Use safe area insets for proper padding on all edges
        paddingTop: insets.top,
        paddingBottom: bottomPadding,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {/* Header with back button */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="p-2 rounded-xl bg-white active:bg-gray-100"
        >
          <Text className="text-2xl">←</Text>
        </Pressable>

        {/* Title (mode-specific) */}
        <Text className="flex-1 text-center text-xl font-bold text-text">
          {mode === 'free' && 'Free Dial'}
          {mode === 'practice' && `Practice: ${contact?.name}`}
          {mode === 'emergency' && 'Emergency Practice'}
        </Text>

        {/* Spacer (keeps title centered) */}
        <View className="w-10" />
      </View>

      {/* Main content area - ScrollView ensures content fits on smaller screens */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          // flexGrow: 1 allows content to expand to fill available space
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Number display */}
        <DialerDisplay
          dialedNumber={dialedNumber}
          onBackspace={handleBackspace}
          contactName={mode === 'practice' ? contact?.name : undefined}
          contactPhoto={mode === 'practice' ? contact?.avatar : undefined}
          hapticsEnabled={hapticsEnabled}
        />

        {/* Dialer keypad */}
        <DialerPad
          onDigitPress={handleDigitPress}
          soundEnabled={soundEnabled}
          hapticsEnabled={hapticsEnabled}
        />
      </ScrollView>

      {/* Footer instruction text (practice modes only) */}
      {mode !== 'free' && (
        <View className="pb-6 px-6">
          <View className="bg-white rounded-2xl p-4 border border-primary">
            <Text className="text-center text-lg text-text">
              {mode === 'practice' && `Dial ${contact?.formattedNumber}`}
              {mode === 'emergency' && `Dial ${emergencyNumber}`}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
