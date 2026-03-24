/**
 * Dialer Store (Zustand)
 *
 * Business Purpose:
 * Manages the current dialer state - digits entered, audio playback, validation.
 * Provides centralized logic for all dialing interactions.
 *
 * Stakeholders:
 * - Children: Enter phone numbers across different app modes
 * - Parents: Monitor and understand child's dialing behavior
 *
 * State Management:
 * Single source of truth for what's being dialed in any context.
 */

import { create } from 'zustand';
import { DIALING } from '../constants/app';
import { playDTMFTone, DTMFDigit } from '../utils/audio/dtmfTones';

/**
 * Dialer State Interface
 */
export interface DialerState {
  digits: string;                 // Current digits entered (e.g., "5551234")
  isValid: boolean;               // Whether current input is a valid phone number
  error: string | null;           // Validation error message
  isPlaying: boolean;             // Audio tone currently playing

  // Actions
  addDigit: (digit: string) => void;
  removeDigit: () => void;
  clear: () => void;
  setDigits: (digits: string) => void;
  validateNumber: () => boolean;
  playTone: (digit: string) => Promise<void>;
}

/**
 * Phone Number Validation
 *
 * Business rules:
 * - Must be 3-15 digits (emergency to international)
 * - Only numeric characters allowed
 * - No special characters (-, spaces, etc.) in stored value
 *
 * @param digits - The phone number to validate
 * @returns Validation result with error message
 */
function validatePhoneNumber(digits: string): { valid: boolean; error: string | null } {
  // Empty is valid (user is still typing)
  if (digits.length === 0) {
    return { valid: true, error: null };
  }

  // Check for non-numeric characters
  if (!/^\d+$/.test(digits)) {
    return {
      valid: false,
      error: 'Only numbers are allowed',
    };
  }

  // Check minimum length for meaningful numbers
  if (digits.length < DIALING.MIN_DIGIT_LENGTH) {
    return {
      valid: false,
      error: `Enter at least ${DIALING.MIN_DIGIT_LENGTH} digits`,
    };
  }

  // Check maximum length (E.164 international format)
  if (digits.length > DIALING.MAX_DIGIT_LENGTH) {
    return {
      valid: false,
      error: `Maximum ${DIALING.MAX_DIGIT_LENGTH} digits allowed`,
    };
  }

  // Valid phone number
  return { valid: true, error: null };
}

/**
 * Dialer Store
 *
 * Usage:
 * ```tsx
 * const { digits, addDigit, clear } = useDialerStore();
 *
 * // Add a digit
 * addDigit('5');  // Auto-plays DTMF tone
 *
 * // Clear the display
 * clear();
 * ```
 */
export const useDialerStore = create<DialerState>((set, get) => ({
  digits: '',
  isValid: true,
  error: null,
  isPlaying: false,

  /**
   * Add a digit to the current input
   *
   * Business rule: Automatically plays DTMF tone for multi-sensory feedback.
   * This helps toddlers associate button press with sound.
   *
   * @param digit - The digit to add (0-9, *, #)
   */
  addDigit: (digit: string) => {
    const currentDigits = get().digits;

    // Prevent exceeding maximum length
    if (currentDigits.length >= DIALING.MAX_DIGIT_LENGTH) {
      set({
        error: `Maximum ${DIALING.MAX_DIGIT_LENGTH} digits reached`,
        isValid: false,
      });
      return;
    }

    // Add the digit
    const newDigits = currentDigits + digit;
    const validation = validatePhoneNumber(newDigits);

    set({
      digits: newDigits,
      isValid: validation.valid,
      error: validation.error,
    });

    // Play DTMF tone
    get().playTone(digit);

    console.log(`[DialerStore] Added digit: ${digit}, total: ${newDigits}`);
  },

  /**
   * Remove the last digit (backspace)
   *
   * Business rule: No sound played on delete to differentiate from adding.
   */
  removeDigit: () => {
    const currentDigits = get().digits;

    if (currentDigits.length === 0) {
      return; // Nothing to remove
    }

    const newDigits = currentDigits.slice(0, -1);
    const validation = validatePhoneNumber(newDigits);

    set({
      digits: newDigits,
      isValid: validation.valid,
      error: validation.error,
    });

    console.log(`[DialerStore] Removed digit, remaining: ${newDigits}`);
  },

  /**
   * Clear all digits
   *
   * Business rule: Resets to clean state, ready for new input.
   */
  clear: () => {
    set({
      digits: '',
      isValid: true,
      error: null,
    });

    // Note: stopCurrentTone() is available in dtmfTones if needed in future

    console.log('[DialerStore] Cleared all digits');
  },

  /**
   * Set digits directly (for practice mode)
   *
   * Used when pre-populating the display with a target number.
   *
   * @param digits - The complete number to set
   */
  setDigits: (digits: string) => {
    const validation = validatePhoneNumber(digits);

    set({
      digits,
      isValid: validation.valid,
      error: validation.error,
    });

    console.log(`[DialerStore] Set digits to: ${digits}`);
  },

  /**
   * Validate current number
   *
   * Explicit validation check (used before "call" action).
   *
   * @returns True if valid, false otherwise
   */
  validateNumber: () => {
    const validation = validatePhoneNumber(get().digits);

    set({
      isValid: validation.valid,
      error: validation.error,
    });

    return validation.valid;
  },

  /**
   * Play DTMF tone for a digit
   *
   * Business rule: Provides audio feedback for button press.
   * Multi-sensory learning (visual + audio + tactile).
   *
   * @param digit - The digit whose tone to play (0-9, *, #)
   */
  playTone: async (digit: string) => {
    try {
      set({ isPlaying: true });

      await playDTMFTone(digit as DTMFDigit);

      // Reset playing state after tone duration
      setTimeout(() => {
        set({ isPlaying: false });
      }, DIALING.DTMF_TONE_DURATION);
    } catch (error) {
      console.error(`[DialerStore] Failed to play tone for ${digit}:`, error);
      set({ isPlaying: false });
    }
  },
}));
