/**
 * useHaptics Hook
 *
 * Business Purpose:
 * Provides haptic feedback (vibration) for tactile reinforcement.
 * Respects user settings and platform capabilities.
 *
 * Educational Value:
 * Haptic feedback helps toddlers associate actions with physical sensation,
 * reinforcing the connection between button press and outcome.
 *
 * Usage:
 * ```tsx
 * const { triggerLight, triggerMedium, triggerHeavy } = useHaptics();
 *
 * // On button press
 * triggerLight();
 *
 * // On success
 * triggerHeavy();
 * ```
 */

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Hook return type
 */
interface UseHapticsReturn {
  triggerLight: () => void;       // Subtle feedback (button press)
  triggerMedium: () => void;      // Moderate feedback (selection)
  triggerHeavy: () => void;       // Strong feedback (success/error)
  triggerSuccess: () => void;     // Success pattern
  triggerWarning: () => void;     // Warning pattern
  triggerError: () => void;       // Error pattern
  isEnabled: boolean;             // Current haptics setting
}

/**
 * useHaptics Hook
 *
 * Automatically checks settings store to respect user preference.
 * Gracefully handles web platform (no haptics available).
 */
export function useHaptics(): UseHapticsReturn {
  const { settings } = useSettingsStore();
  const isEnabled = settings.hapticFeedback && Platform.OS !== 'web';

  /**
   * Light haptic feedback
   *
   * Business use: Button press, digit entry, minor interactions
   */
  const triggerLight = useCallback(() => {
    if (!isEnabled) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('[useHaptics] Failed to trigger light haptic:', error);
    }
  }, [isEnabled]);

  /**
   * Medium haptic feedback
   *
   * Business use: Selection, toggle, moderate importance actions
   */
  const triggerMedium = useCallback(() => {
    if (!isEnabled) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('[useHaptics] Failed to trigger medium haptic:', error);
    }
  }, [isEnabled]);

  /**
   * Heavy haptic feedback
   *
   * Business use: Success, completion, high-importance events
   */
  const triggerHeavy = useCallback(() => {
    if (!isEnabled) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.error('[useHaptics] Failed to trigger heavy haptic:', error);
    }
  }, [isEnabled]);

  /**
   * Success haptic pattern
   *
   * Business use: Correct practice attempt, goal achievement
   */
  const triggerSuccess = useCallback(() => {
    if (!isEnabled) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[useHaptics] Failed to trigger success haptic:', error);
    }
  }, [isEnabled]);

  /**
   * Warning haptic pattern
   *
   * Business use: Near-miss, needs attention, caution
   */
  const triggerWarning = useCallback(() => {
    if (!isEnabled) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.error('[useHaptics] Failed to trigger warning haptic:', error);
    }
  }, [isEnabled]);

  /**
   * Error haptic pattern
   *
   * Business use: Incorrect attempt, validation error, critical issue
   */
  const triggerError = useCallback(() => {
    if (!isEnabled) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.error('[useHaptics] Failed to trigger error haptic:', error);
    }
  }, [isEnabled]);

  return {
    triggerLight,
    triggerMedium,
    triggerHeavy,
    triggerSuccess,
    triggerWarning,
    triggerError,
    isEnabled,
  };
}
