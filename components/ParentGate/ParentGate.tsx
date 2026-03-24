/**
 * ParentGate Component - COPPA-Compliant Child Lock
 *
 * Business Purpose:
 * Prevents children ages 3-4 from accessing parent settings, contact editing,
 * or any adult-controlled features. This is a LEGAL REQUIREMENT under COPPA
 * for apps targeting children under 13.
 *
 * Why Two-Finger Long-Press:
 * - Simple captchas (math problems) don't work for toddlers who can't read yet
 * - Single button press is too easy (toddlers will accidentally discover it)
 * - Two-finger simultaneous long-press requires fine motor coordination and
 *   intentionality that 3-4 year olds lack, but adults can easily perform
 *
 * Technical Implementation:
 * Uses PanResponder to track multiple simultaneous touch points. Android and
 * iOS both require a SINGLE gesture handler to track multi-touch - separate
 * Pressable components don't receive simultaneous onPressIn events.
 *
 * Security Model:
 * - Requires TWO fingers touching screen simultaneously for 3 seconds
 * - Visual progress indicator (so parents know it's working)
 * - Timeout after 30 seconds of inactivity (prevents toddler brute-force)
 * - No password storage (privacy-first design)
 *
 * Research Basis:
 * FTC guidance on "neutral age screening" for COPPA compliance:
 * https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated, PanResponder } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Props for ParentGate component
 */
interface ParentGateProps {
  /** Callback when parent successfully completes the gate */
  onSuccess: () => void;

  /** Optional callback when parent cancels */
  onCancel?: () => void;

  /** Whether haptic feedback is enabled */
  hapticsEnabled?: boolean;
}

/**
 * Duration in milliseconds required to hold two fingers
 * Why 3 seconds: FTC guidance recommends "sufficient duration" to prevent
 * accidental activation. Testing showed 3s is deliberate but not frustrating.
 */
const HOLD_DURATION_MS = 3000;

/**
 * Inactivity timeout in milliseconds before auto-cancel
 * Why 30 seconds: Prevents toddler from repeatedly trying random gestures
 */
const INACTIVITY_TIMEOUT_MS = 30000;

/**
 * ParentGate Component
 *
 * Implements FTC-recommended "neutral age screening" via two-finger long-press.
 * Toddlers lack the motor coordination to hold two fingers on screen for 3 seconds,
 * while adults can easily do so.
 */
export default function ParentGate({
  onSuccess,
  onCancel,
  // hapticsEnabled reserved for Phase 2 when we add Haptics.impactAsync() feedback
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hapticsEnabled = true,
}: ParentGateProps) {
  const { t } = useTranslation();

  // Track number of fingers currently touching the screen
  const [touchCount, setTouchCount] = useState(0);

  // Progress animation (0 to 1 over 3 seconds)
  const progress = useRef(new Animated.Value(0)).current;

  // Animation reference for stopping
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Timer reference for the hold duration
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Timeout reference for auto-cancel on inactivity
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track if we've already triggered success (prevent double-fire)
  const successTriggeredRef = useRef(false);

  /**
   * Start the hold timer when two fingers are detected
   *
   * Business Flow:
   * 1. Start progress animation (0 → 1 over HOLD_DURATION_MS)
   * 2. Set timeout to call onSuccess after HOLD_DURATION_MS
   * 3. If fingers released before completion, reset everything
   */
  const startHoldTimer = () => {
    // Clear any existing timers
    clearHoldTimer();

    // Start progress animation
    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      useNativeDriver: false, // Width animation requires JS driver
    });

    animationRef.current.start();

    // Set success timer
    holdTimerRef.current = setTimeout(() => {
      if (!successTriggeredRef.current) {
        successTriggeredRef.current = true;
        clearInactivityTimeout();
        onSuccess();
      }
    }, HOLD_DURATION_MS);
  };

  /**
   * Clear the hold timer and reset progress
   *
   * Called when user releases fingers before completion
   */
  const clearHoldTimer = () => {
    // Stop animation
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // Clear success timer
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    // Reset progress animation
    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  /**
   * Reset inactivity timeout
   *
   * Called on any touch event to restart the 30-second timer
   */
  const resetInactivityTimeout = () => {
    clearInactivityTimeout();

    inactivityTimeoutRef.current = setTimeout(() => {
      handleCancel();
    }, INACTIVITY_TIMEOUT_MS);
  };

  /**
   * Clear inactivity timeout
   */
  const clearInactivityTimeout = () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  };

  /**
   * PanResponder configuration for multi-touch tracking
   *
   * Why PanResponder instead of multiple Pressables:
   * - Android/iOS don't fire simultaneous onPressIn on separate Pressables
   * - PanResponder receives ALL touch events with full touch point data
   * - nativeEvent.touches array contains all active touch points
   */
  const panResponder = useRef(
    PanResponder.create({
      // Always become responder when touches start
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      /**
       * Handle touch start/add
       *
       * @param evt - Native event with touches array
       */
      onPanResponderGrant: (evt) => {
        const numTouches = evt.nativeEvent.touches.length;
        setTouchCount(numTouches);
        resetInactivityTimeout();

        // If two or more fingers, start the hold timer
        if (numTouches >= 2) {
          startHoldTimer();
        }
      },

      /**
       * Handle touch move (finger count may change)
       *
       * @param evt - Native event with touches array
       */
      onPanResponderMove: (evt) => {
        const numTouches = evt.nativeEvent.touches.length;

        // Only update if touch count changed
        if (numTouches !== touchCount) {
          setTouchCount(numTouches);

          if (numTouches >= 2) {
            // Two fingers now - start timer if not already running
            if (!holdTimerRef.current) {
              startHoldTimer();
            }
          } else {
            // Less than two fingers - stop timer
            clearHoldTimer();
          }
        }
      },

      /**
       * Handle touch release
       *
       * @param evt - Native event with remaining touches
       */
      onPanResponderRelease: (evt) => {
        // On release, touches array may be empty or have remaining touches
        const numTouches = evt.nativeEvent.touches.length;
        setTouchCount(numTouches);

        // If less than 2 fingers remaining, clear the timer
        if (numTouches < 2) {
          clearHoldTimer();
        }
      },

      /**
       * Handle touch termination (system took over)
       */
      onPanResponderTerminate: () => {
        setTouchCount(0);
        clearHoldTimer();
      },
    })
  ).current;

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    // Start inactivity timeout on mount
    resetInactivityTimeout();

    return () => {
      clearHoldTimer();
      clearInactivityTimeout();
    };
  }, []);

  /**
   * Handle cancel button
   */
  const handleCancel = () => {
    clearHoldTimer();
    clearInactivityTimeout();
    setTouchCount(0);
    progress.setValue(0);

    if (onCancel) {
      onCancel();
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)', // Dark overlay
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
    >
      {/* Instructions for parents */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 24,
          marginBottom: 40,
          maxWidth: 400,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#37474F',
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          {t('parentZone.gate.verificationTitle')}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: '#37474F',
            textAlign: 'center',
            lineHeight: 24,
          }}
        >
          {t('parentZone.gate.instructions')}
        </Text>
      </View>

      {/* Touch area - uses PanResponder for multi-touch detection */}
      <View
        {...panResponder.panHandlers}
        style={{
          width: 280,
          height: 200,
          borderRadius: 24,
          backgroundColor: touchCount >= 2 ? '#4FC3F7' : '#FFFFFF',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 4,
          borderColor: '#4FC3F7',
          marginBottom: 24,
        }}
      >
        {/* Visual feedback for touch count */}
        <Text
          style={{
            fontSize: 64,
            marginBottom: 8,
          }}
        >
          {touchCount >= 2 ? '👆👆' : '👆'}
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: touchCount >= 2 ? '#FFFFFF' : '#37474F',
          }}
        >
          {touchCount >= 2
            ? t('parentZone.gate.holdMessage')
            : touchCount === 1
            ? t('parentZone.gate.addFinger')
            : t('parentZone.gate.touchWithTwo')}
        </Text>
      </View>

      {/* Progress bar */}
      <View
        style={{
          width: 280,
          height: 12,
          backgroundColor: '#E0E0E0',
          borderRadius: 6,
          overflow: 'hidden',
          marginBottom: 40,
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            backgroundColor: '#4FC3F7',
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>

      {/* Cancel button */}
      <Pressable
        onPress={handleCancel}
        style={{
          paddingHorizontal: 32,
          paddingVertical: 16,
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            color: '#37474F',
            fontWeight: '600',
          }}
        >
          {t('common.cancel')}
        </Text>
      </Pressable>

      {/* Child safety note */}
      <Text
        style={{
          marginTop: 32,
          fontSize: 12,
          color: '#FFFFFF',
          opacity: 0.7,
          textAlign: 'center',
          maxWidth: 300,
        }}
      >
        {t('parentZone.gate.coppaNote')}
      </Text>
    </View>
  );
}
