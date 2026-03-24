/**
 * Practice Mode - Gamified Chunked Dial-Along with Full Number Finale
 *
 * Business Purpose:
 * Guided practice session where child dials a specific contact's number
 * in digestible chunks, followed by a full number practice round.
 * Breaking numbers into groups (area code, prefix, line) aids toddler memory
 * and maintains engagement through frequent rewards.
 *
 * Two-Phase Learning Flow:
 * For phone number 202-555-1234 with digitGrouping [3, 3, 4]:
 *
 * PHASE 1 - Chunked Practice:
 * 1. Child dials "202" → Mini celebration (stars + encouraging message)
 * 2. Child dials "555" → Mini celebration
 * 3. Child dials "1234" → Transition to Phase 2
 *
 * PHASE 2 - Full Number Practice:
 * 4. "Now dial the whole number!" transition screen
 * 5. Child dials "2025551234" in one go (with hints based on difficulty)
 * 6. BIG celebration (confetti + all stars + mastery update)
 *
 * Why Two Phases:
 * - Phase 1 teaches the chunks (learning)
 * - Phase 2 reinforces full recall (consolidation)
 * - Spaced repetition within single session improves retention
 *
 * Difficulty Levels:
 * - Beginner: One digit at a time with constant highlighting
 * - Intermediate: Chunk at a time, hint after delay
 * - Advanced: Full number, contact photo only (memory recall)
 *
 * Gamification Elements:
 * - Stars per chunk (1-3 based on speed/no hints)
 * - Bonus stars for full number round
 * - Visual progress bar showing chunks completed
 * - Mini-celebrations between chunks
 * - Big celebration on number completion
 * - Streak tracking (consecutive correct sessions)
 *
 * Why Chunking Works (Cognitive Science):
 * - Miller's Law: Working memory holds 7±2 items
 * - For toddlers (ages 3-4): 2-4 items is more realistic
 * - Chunking reduces "2025551234" (10 items) to "202-555-1234" (3 chunks)
 * - Each mini-win releases dopamine, maintaining engagement
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  Alert,
  Animated,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import ConfettiCannon from 'react-native-confetti-cannon';
import DialerPad from '../components/Dialer/DialerPad';
import { DTMFDigit } from '../utils/audio/dtmfTones';
import { getContactById } from '../utils/storage/contacts';
import { getProgress, recordAttempt } from '../utils/storage/progress';
import { storage } from '../utils/storage/asyncStore';
import { DEFAULT_PROFILE_ID } from '../utils/storage/profiles';
import { Contact, Progress, DifficultyLevel } from '../types';

/**
 * Storage key for saved contacts in AsyncStorage
 * Matches the key used in app/contacts.tsx and app/practice-select.tsx
 */
const CONTACTS_STORAGE_KEY = '@dialbuddy/saved_contacts';

/**
 * Contact data structure from AsyncStorage (My Contacts screen)
 */
interface SavedContact {
  id: string;
  name: string;
  phoneNumber: string;
  slotIndex: number;
}

/**
 * Number of chunk celebration messages available
 * Business Rule: All positive, age-appropriate language
 * Messages are now loaded from i18n translations
 */
const CHUNK_CELEBRATION_MESSAGE_COUNT = 6;

/**
 * Number of final celebration messages available
 * Messages are now loaded from i18n translations
 */
const FINAL_CELEBRATION_MESSAGE_COUNT = 4;

/**
 * Number of transition messages for full number round
 * Business Rule: Encouraging, sets up the "final challenge"
 * Messages are now loaded from i18n translations
 */
const FULL_NUMBER_TRANSITION_MESSAGE_COUNT = 4;

/**
 * Practice phase enum
 * Why enum: Clear state machine for practice flow
 */
type PracticePhase = 'chunked' | 'transition' | 'fullNumber';

/**
 * Practice Mode Screen
 */
export default function PracticeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t, i18n } = useTranslation();
  const { width, height } = useWindowDimensions();

  // Get safe area insets for manual padding (ensures bottom nav bar doesn't overlap)
  // Why useSafeAreaInsets: More reliable than SafeAreaView edges prop on some Android devices
  const insets = useSafeAreaInsets();

  const contactId = params.contactId as string;

  /**
   * Active profile ID — loaded from AsyncStorage so progress is scoped to the correct child.
   * Falls back to DEFAULT_PROFILE_ID if no profile has been created yet.
   */
  const [activeProfileId, setActiveProfileId] = useState<string>(DEFAULT_PROFILE_ID);

  // Load the active profile ID on mount
  useEffect(() => {
    storage.getActiveProfileId().then((id) => {
      if (id) setActiveProfileId(id);
    });
  }, []);

  // Contact and progress state
  const [contact, setContact] = useState<Contact | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  /**
   * Current practice phase
   * - 'chunked': Learning phase - dial chunks one at a time
   * - 'transition': Brief "get ready" screen before full number
   * - 'fullNumber': Consolidation phase - dial entire number at once
   */
  const [practicePhase, setPracticePhase] = useState<PracticePhase>('chunked');

  // Chunked practice session state
  const [dialedNumber, setDialedNumber] = useState('');
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [chunkDialed, setChunkDialed] = useState(''); // Digits dialed in current chunk
  const [hintsUsed, setHintsUsed] = useState(0);
  const [chunkStartTime, setChunkStartTime] = useState<number>(Date.now());

  // Full number round state
  const [fullNumberDialed, setFullNumberDialed] = useState(''); // Digits dialed in full number round
  const [fullNumberStartTime, setFullNumberStartTime] = useState<number>(Date.now());
  const [fullNumberHintsUsed, setFullNumberHintsUsed] = useState(0);
  const [fullNumberStars, setFullNumberStars] = useState(0);

  // Stars earned per chunk (for final celebration display)
  const [starsPerChunk, setStarsPerChunk] = useState<number[]>([]);

  // Celebration states
  const [showChunkCelebration, setShowChunkCelebration] = useState(false);
  const [showFinalCelebration, setShowFinalCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [chunkStars, setChunkStars] = useState(0);

  // Hint state
  const [hintTimer, setHintTimer] = useState<NodeJS.Timeout | null>(null);
  const [showHint, setShowHint] = useState(false);

  /**
   * Tracks consecutive wrong digit presses for the current position.
   * Resets to 0 on every correct press or chunk change.
   * Business Rule: After 2 wrong attempts, show hint immediately regardless of timer.
   */
  const [wrongAttemptCount, setWrongAttemptCount] = useState(0);

  /**
   * Controls visibility of the "Oops! Try again!" message.
   * Auto-dismisses after 1 second so it doesn't linger.
   */
  const [showOops, setShowOops] = useState(false);

  /**
   * Shake trigger — increments on every wrong press to fire the DialerPad shake animation.
   * Using a counter (not boolean) so the same wrong press can re-trigger the animation.
   */
  const [shakeKey, setShakeKey] = useState(0);

  /**
   * The digit most recently pressed correctly — used to flash that button green.
   * Cleared after flashKey changes so it doesn't persist to the next digit.
   */
  const [flashDigit, setFlashDigit] = useState<DTMFDigit | null>(null);

  /**
   * Increments on every correct press to re-trigger the green flash effect,
   * even when the same digit appears consecutively (e.g., "555").
   */
  const [flashKey, setFlashKey] = useState(0);

  /**
   * Pulse key for dialer pad animation
   * Business Purpose: Increments each time a digit is expected, triggering
   * a bounce animation on the highlighted button. This helps toddlers understand
   * they need to tap again when digits repeat (e.g., "555" or "1111").
   */
  const [pulseKey, setPulseKey] = useState(0);

  // Animation refs for celebrations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const starAnim = useRef(new Animated.Value(0)).current;

  /**
   * Action to run when the user taps "Next" on the mini-celebration screen.
   *
   * Why a ref (not state): the callback captures current closure variables and
   * is set synchronously before the screen renders. A ref avoids stale-closure
   * issues that would occur if we stored the function in useState.
   *
   * Two possible actions:
   *   - "nextChunk": advance to the next chunk (showMiniCelebration)
   *   - "transition": move to the full-number transition (showTransitionToFullNumber)
   */
  const celebrationNextAction = useRef<() => void>(() => {});

  /**
   * Play the success chime when a celebration screen loads.
   *
   * Why fire-and-forget (no await): celebrations are visual-first; the sound
   * should not block any state updates or animations.
   * Why unloadAsync after play: expo-av sound objects are not garbage-collected
   * automatically — unloading frees the native audio resource immediately.
   */
  const playSuccessSound = () => {
    Audio.Sound.createAsync(
      require('../assets/sounds/effects/success1.wav'),
      { shouldPlay: true, volume: 1.0 }
    ).then(({ sound }) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    }).catch(() => {
      // Non-critical: silently ignore if audio fails (e.g. silent mode)
    });
  };

  /**
   * Trigger entrance animation when the final celebration screen mounts.
   * Why useEffect: final celebration is set via setTimeout inside handleFullNumberComplete,
   * so triggering animations there would race with React's render cycle.
   * This effect fires cleanly after the state update + render completes.
   */
  useEffect(() => {
    if (showFinalCelebration) {
      playSuccessSound();
      scaleAnim.setValue(0);
      starAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(starAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showFinalCelebration]);

  /**
   * Controls the ringing phone screen shown between number completion and final celebration.
   * Business Purpose: Simulates the real phone experience — child dials, phone rings,
   * contact "answers". This is the emotional payoff of the practice session.
   */
  const [showRinging, setShowRinging] = useState(false);

  /**
   * Animated value for the phone emoji ring pulse.
   * Loops a scale animation to simulate the visual feel of a ringing phone.
   */
  const ringPulseAnim = useRef(new Animated.Value(1)).current;

  /**
   * Load contact and progress on mount
   */
  useEffect(() => {
    loadContactAndProgress();

    return () => {
      // Cleanup hint timer
      if (hintTimer) {
        clearTimeout(hintTimer);
      }
    };
  }, [contactId]);

  /**
   * Start hint timer when chunk changes
   */
  useEffect(() => {
    startHintTimer();
    setChunkStartTime(Date.now());

    return () => {
      if (hintTimer) {
        clearTimeout(hintTimer);
      }
    };
  }, [currentChunkIndex]);

  /**
   * Start hint timer based on difficulty
   * Business Rule: Longer delays for higher difficulties
   */
  const startHintTimer = () => {
    if (hintTimer) {
      clearTimeout(hintTimer);
    }

    const difficulty = getDifficultyLevel();

    // Hint delay based on difficulty (milliseconds)
    // Beginner: Always show hints immediately (no timer)
    // Intermediate: 5 seconds
    // Advanced: No hints
    if (difficulty === 'beginner') {
      setShowHint(true);
      return;
    }

    if (difficulty === 'intermediate') {
      const timer = setTimeout(() => {
        setShowHint(true);
        setHintsUsed((prev) => prev + 1);
      }, 5000);
      setHintTimer(timer);
    }

    // Advanced: No hints
  };

  /**
   * Load contact data and progress
   *
   * Contact Lookup Strategy:
   * 1. First try SQLite database (Parent Zone contacts)
   * 2. If not found, check AsyncStorage (My Contacts screen)
   * 3. Convert AsyncStorage contact to full Contact type if needed
   */
  const loadContactAndProgress = async () => {
    /**
     * Step 1: Check for synthetic emergency contact
     *
     * When launched from emergency-dial.tsx, contactId is 'emergency_number'
     * and the actual number is passed as the emergencyNumber param.
     * We build the Contact object here instead of loading from database.
     */
    if (contactId === 'emergency_number') {
      const emergencyNumber = (params.emergencyNumber as string) || '911';
      const contactData: Contact = {
        id: 'emergency_number',
        name: emergencyNumber,
        phoneNumber: emergencyNumber,
        formattedNumber: emergencyNumber,
        // Emergency numbers are a single chunk — child dials all digits at once
        digitGrouping: [emergencyNumber.length],
        avatar: null,
        relationship: t('emergency.dial.relationship'),
        isEmergency: true,
        sortOrder: 0,
      };
      setContact(contactData);
      console.log('[Practice] Loaded emergency contact:', emergencyNumber);
      return;
    }

    // Step 2: Try SQLite database
    let contactData = await getContactById(contactId);

    // Step 3: If not found in SQLite, check AsyncStorage
    if (!contactData) {
      console.log('[Practice] Contact not in SQLite, checking AsyncStorage...');
      contactData = await getContactFromAsyncStorage(contactId);
    }

    // Step 4: Handle contact not found
    if (!contactData) {
      Alert.alert('Error', 'Contact not found');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
      return;
    }

    setContact(contactData);
    console.log('[Practice] Loaded contact:', contactData.name);
    console.log('[Practice] Digit grouping:', contactData.digitGrouping);

    const progressData = await getProgress(activeProfileId, contactId);
    setProgress(progressData);
  };

  /**
   * Get contact from AsyncStorage by ID
   *
   * Business Purpose: My Contacts screen stores contacts in AsyncStorage,
   * not SQLite. This function retrieves them and converts to Contact type.
   *
   * @param id - Contact ID to find
   * @returns Contact or null if not found
   */
  const getContactFromAsyncStorage = async (id: string): Promise<Contact | null> => {
    try {
      const savedData = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      if (!savedData) return null;

      const parsedContacts = JSON.parse(savedData) as (SavedContact | null)[];
      const savedContact = parsedContacts.find((c) => c?.id === id);

      if (!savedContact) return null;

      // Load country code from storage for country-specific chunking
      const countryCode = await storage.getCountryCode() || 'US';

      // Convert SavedContact to full Contact type
      // Why conversion: Practice screen expects Contact type with digitGrouping
      return {
        id: savedContact.id,
        name: savedContact.name,
        phoneNumber: extractDigits(savedContact.phoneNumber),
        formattedNumber: savedContact.phoneNumber,
        digitGrouping: calculateDigitGrouping(savedContact.phoneNumber, countryCode),
        avatar: null,
        relationship: 'Contact',
        isEmergency: false,
        sortOrder: savedContact.slotIndex,
      };
    } catch (error) {
      console.error('[Practice] Failed to get contact from AsyncStorage:', error);
      return null;
    }
  };

  /**
   * Extract only digits from phone number string
   *
   * @param phoneNumber - Phone number with potential formatting
   * @returns Digits only (e.g., "555-123-4567" → "5551234567")
   */
  const extractDigits = (phoneNumber: string): string => {
    return phoneNumber.replace(/\D/g, '');
  };

  /**
   * Calculate digit grouping for practice mode (country-aware)
   *
   * Business Purpose: Breaking phone numbers into chunks aids toddler memory.
   * Different countries use different chunking patterns based on their phone number conventions.
   *
   * @param phoneNumber - Raw or formatted phone number
   * @param countryCode - ISO country code (e.g., "US", "GB", "FR")
   * @returns Array of chunk sizes (e.g., [3, 3, 4] for US numbers)
   */
  const calculateDigitGrouping = (phoneNumber: string, countryCode: string = 'US'): number[] => {
    const digits = extractDigits(phoneNumber);
    const length = digits.length;

    // Emergency numbers (3 digits) - same for all countries
    if (length === 3) return [3];

    // Country-specific chunking patterns
    // Why different patterns: Each country has cultural conventions for how
    // phone numbers are spoken and written
    switch (countryCode) {
      case 'US':
      case 'CA':
        // North America (NANP): (202) 555-1234
        if (length === 10) return [3, 3, 4];
        if (length === 11) return [1, 3, 3, 4]; // +1 prefix
        break;

      case 'MX':
      case 'AU':
      case 'IT':
      case 'JP':
        // Mexico, Australia, Italy, Japan: XX XXXX XXXX
        if (length === 10) return [2, 4, 4];
        if (length === 11) return [2, 5, 4]; // Brazil mobile format
        break;

      case 'GB':
        // UK: 020 7946 0958
        if (length === 10) return [3, 3, 4];
        if (length === 11) return [4, 3, 4];
        break;

      case 'NZ':
        // New Zealand: 03 123 4567
        if (length === 9) return [2, 3, 4];
        if (length === 10) return [2, 4, 4];
        break;

      case 'DE':
        // Germany: 030 12345678
        if (length === 10) return [3, 7];
        if (length === 11) return [4, 7];
        break;

      case 'FR':
        // France: 01 23 45 67 89 (always pairs)
        if (length === 10) return [2, 2, 2, 2, 2];
        break;

      case 'ES':
        // Spain: 91 123 45 67
        if (length === 9) return [2, 3, 2, 2];
        break;

      case 'BR':
        // Brazil: 11 98765 4321
        if (length === 11) return [2, 5, 4];
        if (length === 10) return [2, 4, 4];
        break;

      case 'IN':
        // India: 022 1234 5678
        if (length === 10) return [3, 4, 3];
        break;
    }

    // Fallback: group in threes from the right
    const groups: number[] = [];
    let remaining = length;
    while (remaining > 0) {
      if (remaining > 3) {
        groups.unshift(3);
        remaining -= 3;
      } else {
        groups.unshift(remaining);
        remaining = 0;
      }
    }
    return groups;
  };

  /**
   * Get current difficulty level
   */
  const getDifficultyLevel = (): DifficultyLevel => {
    return progress?.difficultyLevel || 'beginner';
  };

  /**
   * Get the current chunk's target digits
   * Example: For "2025551234" with grouping [3,3,4], chunk 1 returns "555"
   */
  const getCurrentChunkTarget = (): string => {
    if (!contact) return '';

    const digitGrouping = contact.digitGrouping;
    const phoneNumber = contact.phoneNumber;

    // Calculate start position of current chunk
    let startPos = 0;
    for (let i = 0; i < currentChunkIndex; i++) {
      startPos += digitGrouping[i];
    }

    // Get current chunk size
    const chunkSize = digitGrouping[currentChunkIndex] || 0;

    return phoneNumber.slice(startPos, startPos + chunkSize);
  };

  /**
   * Get highlighted digit for current position
   * Returns the next expected digit (works for both chunked and full number phases)
   */
  const getHighlightedDigits = (): Set<DTMFDigit> => {
    if (!contact) return new Set();

    const difficulty = getDifficultyLevel();

    // Advanced mode: No highlights (memory recall only)
    if (difficulty === 'advanced') {
      return new Set();
    }

    // Determine target and current position based on phase
    let targetNumber: string;
    let currentPosition: number;

    if (practicePhase === 'fullNumber') {
      // Full number phase: highlight next digit in complete number
      targetNumber = contact.phoneNumber;
      currentPosition = fullNumberDialed.length;
    } else {
      // Chunked phase: highlight next digit in current chunk
      targetNumber = getCurrentChunkTarget();
      currentPosition = chunkDialed.length;
    }

    // Beginner: Always highlight next digit
    // Intermediate: Only highlight when hint is shown
    if (difficulty === 'beginner' || (difficulty === 'intermediate' && showHint)) {
      if (currentPosition < targetNumber.length) {
        const nextDigit = targetNumber[currentPosition] as DTMFDigit;
        return new Set([nextDigit]);
      }
    }

    return new Set();
  };

  /**
   * Calculate stars earned for completing a chunk
   * Business Rules:
   * - 3 stars: No hints used, completed in under 3 seconds per digit
   * - 2 stars: No hints used OR completed quickly
   * - 1 star: Used hints but completed
   */
  const calculateChunkStars = (): number => {
    const currentTarget = getCurrentChunkTarget();
    const timeElapsed = Date.now() - chunkStartTime;
    const msPerDigit = timeElapsed / currentTarget.length;
    const usedHint = hintsUsed > 0;

    // 3 stars: Fast and no hints
    if (!usedHint && msPerDigit < 3000) {
      return 3;
    }

    // 2 stars: Either fast OR no hints
    if (!usedHint || msPerDigit < 4000) {
      return 2;
    }

    // 1 star: Completed (participation award - everyone wins!)
    return 1;
  };

  /**
   * Handle digit press
   * Core game loop: Validate digit, update progress, trigger celebrations
   * Handles both chunked phase and full number phase
   */
  const handleDigitPress = (digit: DTMFDigit) => {
    if (!contact) return;

    // Route to appropriate handler based on current phase
    if (practicePhase === 'fullNumber') {
      handleFullNumberDigitPress(digit);
    } else if (practicePhase === 'chunked') {
      handleChunkedDigitPress(digit);
    }
    // 'transition' phase: ignore digit presses (showing transition screen)
  };

  /**
   * Handle digit press during chunked practice phase
   */
  const handleChunkedDigitPress = (digit: DTMFDigit) => {
    const currentTarget = getCurrentChunkTarget();
    const expectedDigit = currentTarget[chunkDialed.length];

    // Check if correct digit pressed
    if (digit === expectedDigit) {
      const newChunkDialed = chunkDialed + digit;
      const newFullDialed = dialedNumber + digit;

      setChunkDialed(newChunkDialed);
      setDialedNumber(newFullDialed);

      // Green flash on the correct button
      setFlashDigit(digit);
      setFlashKey((prev) => prev + 1);

      // Reset wrong-attempt counter and dismiss oops message
      setWrongAttemptCount(0);
      setShowOops(false);

      // Increment pulseKey to trigger animation for next digit
      setPulseKey((prev) => prev + 1);

      // Reset hint timer on correct press
      if (hintTimer) {
        clearTimeout(hintTimer);
      }
      setShowHint(false);

      // Check if chunk is complete
      if (newChunkDialed.length === currentTarget.length) {
        handleChunkComplete(newFullDialed);
      } else {
        startHintTimer();
      }
    } else {
      // Incorrect digit — shake the pad and show oops message
      const newWrongCount = wrongAttemptCount + 1;
      setWrongAttemptCount(newWrongCount);
      setShakeKey((prev) => prev + 1);
      setShowOops(true);

      // Auto-dismiss oops after 1 second
      setTimeout(() => setShowOops(false), 1000);

      // Business Rule: After 2 wrong attempts, show hint immediately
      // rather than waiting for the timer — child clearly needs help
      if (newWrongCount >= 2 && !showHint) {
        setShowHint(true);
        setHintsUsed((prev) => prev + 1);
      }
    }
  };

  /**
   * Handle digit press during full number practice phase
   * Business Purpose: Child practices dialing complete number without chunk breaks
   */
  const handleFullNumberDigitPress = (digit: DTMFDigit) => {
    if (!contact) return;

    const phoneNumber = contact.phoneNumber;
    const expectedDigit = phoneNumber[fullNumberDialed.length];

    // Check if correct digit pressed
    if (digit === expectedDigit) {
      const newDialed = fullNumberDialed + digit;
      setFullNumberDialed(newDialed);

      // Green flash on the correct button
      setFlashDigit(digit);
      setFlashKey((prev) => prev + 1);

      // Reset wrong-attempt counter and dismiss oops
      setWrongAttemptCount(0);
      setShowOops(false);

      setPulseKey((prev) => prev + 1);

      if (hintTimer) {
        clearTimeout(hintTimer);
      }
      setShowHint(false);

      if (newDialed.length === phoneNumber.length) {
        handleFullNumberComplete();
      } else {
        startHintTimer();
      }
    } else {
      // Incorrect digit — shake pad and show oops
      const newWrongCount = wrongAttemptCount + 1;
      setWrongAttemptCount(newWrongCount);
      setShakeKey((prev) => prev + 1);
      setShowOops(true);

      setTimeout(() => setShowOops(false), 1000);

      if (newWrongCount >= 2 && !showHint) {
        setShowHint(true);
        setFullNumberHintsUsed((prev) => prev + 1);
      }
    }
  };

  /**
   * Handle completion of full number round.
   *
   * Flow:
   * 1. Show ringing phone screen immediately (child sees their call "connecting")
   * 2. Start looping ring pulse animation
   * 3. After 1.5s — speak TTS answer message in contact's language
   * 4. After 3s — transition to final celebration screen
   * 5. After 7s total — auto-return to contact selection
   *
   * Why this order: The ringing + answer sequence mirrors a real phone call,
   * making the practice feel meaningful and rewarding rather than just a UI animation.
   */
  const handleFullNumberComplete = async () => {
    if (!contact) return;

    // Clear hint timer
    if (hintTimer) {
      clearTimeout(hintTimer);
    }

    // Calculate bonus stars for full number round
    const timeElapsed = Date.now() - fullNumberStartTime;
    const msPerDigit = timeElapsed / contact.phoneNumber.length;
    const usedHints = fullNumberHintsUsed > 0;

    let stars = 1;
    if (!usedHints && msPerDigit < 2000) {
      stars = 3;
    } else if (!usedHints || msPerDigit < 3000) {
      stars = 2;
    }
    setFullNumberStars(stars);

    // Pick final celebration message
    const messageIndex = Math.floor(Math.random() * FINAL_CELEBRATION_MESSAGE_COUNT) + 1;
    const message = t(`practiceMode.practiceScreen.finalCelebration.message${messageIndex}`);
    setCelebrationMessage(message);

    // Record attempt in progress tracking
    const updatedProgress = await recordAttempt(
      activeProfileId,
      contactId,
      true,
      hintsUsed + fullNumberHintsUsed
    );

    if (updatedProgress) {
      setProgress(updatedProgress);
    }

    // Step 1: Show ringing screen and start pulse animation
    setShowRinging(true);
    startRingPulse();

    // Step 2: After 1.5s — speak the TTS answer message.
    // Why 1.5s delay: gives the ringing animation time to play once before "answer".
    // The message is short and child-directed, spoken in the app's current language.
    setTimeout(() => {
      const ttsMessage = t('practiceMode.practiceScreen.ringing.answerMessage', {
        name: contact.name,
      });

      Speech.speak(ttsMessage, {
        language: i18n.language,   // Respect selected language (en, es, pt-BR)
        pitch: 1.1,                // Slightly higher pitch = warmer, friendlier tone
        rate: 0.85,                // Slightly slower = clearer for toddlers
        onDone: () => {},
        onError: () => {},         // Non-critical: silently ignore TTS failures
      });
    }, 1500);

    // Step 3: After 3s — transition ringing → final celebration
    setTimeout(() => {
      setShowRinging(false);
      setShowFinalCelebration(true);
    }, 3000);

    // No auto-return: user taps "Done" on the final celebration screen to navigate back.
    // Speech is stopped when they press Done (see final celebration JSX handler).
  };

  /**
   * Looping ring pulse animation for the phone emoji on the ringing screen.
   * Scales 1.0 → 1.2 → 1.0 repeatedly to simulate a ringing/vibrating phone.
   * Uses Animated.loop so it continues until the ringing screen unmounts.
   */
  const startRingPulse = () => {
    ringPulseAnim.setValue(1);

    Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulseAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(ringPulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  /**
   * Handle chunk completion
   * Shows mini-celebration, awards stars, advances to next chunk
   */
  const handleChunkComplete = (newFullDialed: string) => {
    // Calculate stars for this chunk
    const stars = calculateChunkStars();
    setChunkStars(stars);
    setStarsPerChunk((prev) => [...prev, stars]);

    // Pick a random celebration message from i18n translations
    const messageIndex = Math.floor(Math.random() * CHUNK_CELEBRATION_MESSAGE_COUNT) + 1;
    const message = t(`practiceMode.practiceScreen.chunkCelebration.message${messageIndex}`);
    setCelebrationMessage(message);

    // Check if this was the last chunk (chunked phase complete)
    const isLastChunk = currentChunkIndex >= contact!.digitGrouping.length - 1;

    if (isLastChunk) {
      // Transition to full number round instead of final celebration
      // Business Purpose: Reinforce learning with complete number practice
      showTransitionToFullNumber();
    } else {
      // Show mini-celebration, then advance to next chunk
      showMiniCelebration();
    }
  };

  /**
   * Show transition screen before full number round
   * Business Purpose: Brief "get ready" moment before final challenge
   */
  const showTransitionToFullNumber = () => {
    // Register what "Next" does from this celebration:
    // dismiss the celebration, show the transition screen, then auto-start
    // the full number round after a short 2s "get ready" beat.
    celebrationNextAction.current = () => {
      setShowChunkCelebration(false);
      setPracticePhase('transition');

      const messageIndex = Math.floor(Math.random() * FULL_NUMBER_TRANSITION_MESSAGE_COUNT) + 1;
      const message = t(`practiceMode.practiceScreen.transition.message${messageIndex}`);
      setCelebrationMessage(message);

      // Brief 2s "get ready" screen, then start full number round automatically
      setTimeout(() => startFullNumberRound(), 2000);
    };

    playSuccessSound();
    setShowChunkCelebration(true);

    // Animate celebration entrance
    scaleAnim.setValue(0);
    starAnim.setValue(0);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(starAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Start the full number practice round
   * Business Purpose: Reset state for dialing complete number
   */
  const startFullNumberRound = () => {
    setPracticePhase('fullNumber');
    setFullNumberDialed('');
    setFullNumberHintsUsed(0);
    setFullNumberStartTime(Date.now());
    setShowHint(false);
    setPulseKey((prev) => prev + 1);

    // Start hint timer for full number round
    startHintTimer();
  };

  /**
   * Show mini-celebration between chunks
   * Quick, encouraging feedback before continuing
   */
  const showMiniCelebration = () => {
    // Register what "Next" does from this celebration: advance to next chunk
    celebrationNextAction.current = () => {
      setShowChunkCelebration(false);
      setCurrentChunkIndex((prev) => prev + 1);
      setChunkDialed('');
      setHintsUsed(0);
      setWrongAttemptCount(0);
      setShowOops(false);
    };

    playSuccessSound();
    setShowChunkCelebration(true);

    // Animate celebration entrance
    scaleAnim.setValue(0);
    starAnim.setValue(0);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(starAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };


  /**
   * Handle back button
   */
  const handleBack = () => {
    // Record as incomplete attempt
    if (dialedNumber.length > 0) {
      recordAttempt(activeProfileId, contactId, false, hintsUsed);
    }
    // canGoBack guard: practice screen may be the root during dev hot-reload
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  /**
   * Calculate total stars earned across all chunks + full number bonus
   */
  const getTotalStars = (): number => {
    const chunkTotal = starsPerChunk.reduce((sum, stars) => sum + stars, 0);
    return chunkTotal + fullNumberStars;
  };

  /**
   * Get maximum possible stars for this number
   * Includes: chunks (3 each) + full number bonus (3)
   */
  const getMaxStars = (): number => {
    if (!contact) return 0;
    // Each chunk can earn 3 stars + 3 bonus stars for full number round
    return contact.digitGrouping.length * 3 + 3;
  };

  /**
   * Render star icons
   * @param count - Number of stars (1-3)
   * @param size - Size of each star
   */
  const renderStars = (count: number, size: number = 32) => {
    const stars = [];
    for (let i = 0; i < 3; i++) {
      stars.push(
        <Text
          key={i}
          style={{
            fontSize: size,
            opacity: i < count ? 1 : 0.3,
          }}
        >
          ⭐
        </Text>
      );
    }
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
        {stars}
      </View>
    );
  };

  // Loading state
  if (!contact) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#999' }}>{t('practiceMode.practiceScreen.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const difficulty = getDifficultyLevel();
  const highlightedDigits = getHighlightedDigits();
  const currentChunkTarget = getCurrentChunkTarget();
  const totalChunks = contact.digitGrouping.length;

  // ==========================================
  // MINI CELEBRATION (between chunks)
  // Deep purple background — warm and exciting without being overwhelming.
  // PartyBuddy mascot bounces in, confetti strips fade in top+bottom.
  // Auto-dismisses after 1.5s so practice momentum is maintained.
  // ==========================================
  if (showChunkCelebration) {
    return (
      <View style={{ flex: 1 }}>
        {/* Background image — absolute fill with explicit dimensions prevents stretch */}
        <Image
          source={require('../assets/images/blankbg.png')}
          style={{ position: 'absolute', top: 0, left: 0, width, height }}
          resizeMode="cover"
        />

        {/* Confetti fires from top-center on mount.
            origin.y: -30 so pieces start above the screen edge.
            fadeOut: pieces fade as they reach the bottom — less abrupt. */}
        <ConfettiCannon
          count={120}
          origin={{ x: width / 2, y: -30 }}
          autoStart={true}
          fadeOut={true}
          explosionSpeed={350}
          fallSpeed={2800}
          colors={['#6A1B9A', '#AB47BC', '#FFD54F', '#4FC3F7', '#81C784', '#FF8A65']}
        />

        <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style="dark" />

        {/* Centre content — mascot + stars + message bounce in together */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>

            {/* PartyBuddy mascot */}
            <Image
              source={require('../assets/images/PartyBuddy.png')}
              style={{ width: 160, height: 160 }}
              resizeMode="contain"
            />

            {/* Stars earned for this chunk */}
            <Animated.View style={{ opacity: starAnim, marginBottom: 12 }}>
              {renderStars(chunkStars, 52)}
            </Animated.View>

            {/* Celebration message */}
            <Text
              style={{
                fontSize: 38,
                fontWeight: 'bold',
                color: '#37474F',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              {celebrationMessage}
            </Text>

            {/* Chunk progress pill */}
            <View
              style={{
                backgroundColor: 'rgba(0,0,0,0.08)',
                borderRadius: 20,
                paddingHorizontal: 20,
                paddingVertical: 8,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 17, color: '#546E7A', fontWeight: '600' }}>
                {t('practiceMode.practiceScreen.celebration.chunkProgress', {
                  current: currentChunkIndex + 1,
                  total: totalChunks,
                })}
              </Text>
            </View>

            {/* Digits dialed in this chunk */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                paddingHorizontal: 28,
                paddingVertical: 12,
                borderWidth: 1.5,
                borderColor: '#4FC3F7',
                marginBottom: 28,
              }}
            >
              <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#4FC3F7', letterSpacing: 4 }}>
                {dialedNumber}
              </Text>
            </View>

            {/* Next button — advances to the next chunk or transition screen */}
            <Pressable
              onPress={() => celebrationNextAction.current()}
              style={{
                backgroundColor: '#6A1B9A',
                borderRadius: 32,
                paddingHorizontal: 48,
                paddingVertical: 16,
              }}
            >
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' }}>
                {t('common.next')} →
              </Text>
            </Pressable>
          </Animated.View>
        </View>
        </SafeAreaView>
      </View>
    );
  }

  // ==========================================
  // RINGING SCREEN (shown after number complete, before celebration)
  // Spec: "Phone rings animation with contact's face, then contact answers"
  // ==========================================
  if (showRinging) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1A237E' }}>
        <StatusBar style="light" />

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>

          {/* Contact avatar or fallback emoji */}
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: '#3949AB',
              borderWidth: 4,
              borderColor: '#7986CB',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
              overflow: 'hidden',
            }}
          >
            {contact.avatar ? (
              <Image
                source={{ uri: contact.avatar }}
                style={{ width: 120, height: 120, borderRadius: 60 }}
              />
            ) : (
              <Text style={{ fontSize: 60 }}>👤</Text>
            )}
          </View>

          {/* Contact name */}
          <Text
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#FFFFFF',
              marginBottom: 8,
            }}
          >
            {contact.name}
          </Text>

          {/* "Calling..." label */}
          <Text
            style={{
              fontSize: 18,
              color: '#9FA8DA',
              marginBottom: 40,
            }}
          >
            {t('practiceMode.practiceScreen.ringing.calling')}
          </Text>

          {/* Pulsing phone emoji — the ring animation */}
          <Animated.Text
            style={{
              fontSize: 80,
              transform: [{ scale: ringPulseAnim }],
            }}
          >
            📱
          </Animated.Text>

          {/* Ring hint text */}
          <Text
            style={{
              fontSize: 14,
              color: '#5C6BC0',
              marginTop: 32,
            }}
          >
            {t('practiceMode.practiceScreen.ringing.ringing')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // FINAL CELEBRATION (full number complete)
  // Deep green background — triumphant, "you did it!" colour.
  // Larger PartyBuddy, denser confetti, full star breakdown + mastery.
  // Auto-dismisses after ~4s (set in handleFullNumberComplete setTimeout).
  // ==========================================
  if (showFinalCelebration) {
    const totalStars = getTotalStars();
    const maxStars   = getMaxStars();

    return (
      <View style={{ flex: 1 }}>
        {/* Background image — absolute fill with explicit dimensions prevents stretch */}
        <Image
          source={require('../assets/images/blankbg.png')}
          style={{ position: 'absolute', top: 0, left: 0, width, height }}
          resizeMode="cover"
        />

        {/* Two cannons firing from bottom-left and bottom-right corners
            for a classic party-popper effect on full number completion.
            autoStartDelay staggers them slightly so they don't feel identical. */}
        <ConfettiCannon
          count={180}
          origin={{ x: 0, y: -30 }}
          autoStart={true}
          fadeOut={true}
          explosionSpeed={400}
          fallSpeed={3000}
          colors={['#1B5E20', '#66BB6A', '#FFD54F', '#FF8A65', '#4FC3F7', '#CE93D8', '#FFFFFF']}
        />
        <ConfettiCannon
          count={180}
          origin={{ x: width, y: -30 }}
          autoStart={true}
          autoStartDelay={150}
          fadeOut={true}
          explosionSpeed={400}
          fallSpeed={3000}
          colors={['#1B5E20', '#66BB6A', '#FFD54F', '#FF8A65', '#4FC3F7', '#CE93D8', '#FFFFFF']}
        />

        <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style="dark" />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 16 }}
          scrollEnabled={false}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>

            {/* Larger PartyBuddy mascot */}
            <Image
              source={require('../assets/images/PartyBuddy.png')}
              style={{ width: 200, height: 200, marginBottom: 4 }}
              resizeMode="contain"
            />

            {/* Celebration headline */}
            <Text
              style={{
                fontSize: 42,
                fontWeight: 'bold',
                color: '#37474F',
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              {celebrationMessage}
            </Text>

            {/* "You dialed NAME's number!" */}
            <Text style={{ fontSize: 19, color: '#546E7A', textAlign: 'center', marginBottom: 18 }}>
              {t('practiceMode.practiceScreen.celebration.youDialed', { name: contact.name })}
            </Text>

            {/* Complete phone number */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                paddingHorizontal: 28,
                paddingVertical: 14,
                marginBottom: 20,
                borderWidth: 2,
                borderColor: '#4FC3F7',
              }}
            >
              <Text style={{ fontSize: 30, fontWeight: 'bold', color: '#4FC3F7', letterSpacing: 3 }}>
                {contact.formattedNumber}
              </Text>
            </View>

            {/* Stars breakdown */}
            <Animated.View style={{ opacity: starAnim, alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 14, color: '#546E7A', marginBottom: 10 }}>
                {t('practiceMode.practiceScreen.celebration.starsEarned')}
              </Text>

              {/* Per-chunk stars + bonus star for full number round */}
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 }}>
                {starsPerChunk.map((stars, index) => (
                  <View key={`chunk-${index}`} style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#546E7A', marginBottom: 2 }}>{index + 1}</Text>
                    <Text style={{ fontSize: 28 }}>
                      {stars === 3 ? '⭐' : stars === 2 ? '🌟' : '✨'}
                    </Text>
                  </View>
                ))}
                {/* Bonus star for completing the full-number round */}
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#FFD54F', fontWeight: 'bold', marginBottom: 2 }}>🎯</Text>
                  <Text style={{ fontSize: 28 }}>
                    {fullNumberStars === 3 ? '⭐' : fullNumberStars === 2 ? '🌟' : '✨'}
                  </Text>
                </View>
              </View>

              {/* Total star count */}
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#F57F17' }}>
                {t('practiceMode.practiceScreen.celebration.totalStars', { earned: totalStars, max: maxStars })}
              </Text>
            </Animated.View>

            {/* Mastery level + streak */}
            {progress && (
              <View style={{ alignItems: 'center', gap: 4, marginBottom: 24 }}>
                <Text style={{ fontSize: 16, color: '#546E7A' }}>
                  {t('practiceMode.practiceScreen.celebration.mastery', { level: progress.masteryLevel })}
                </Text>
                {progress.currentStreak > 1 && (
                  <Text style={{ fontSize: 22, color: '#F57F17', fontWeight: 'bold' }}>
                    {t('practiceMode.practiceScreen.celebration.streakMessage', { count: progress.currentStreak })}
                  </Text>
                )}
              </View>
            )}

            {/* Done button — stops TTS and returns to contact selection */}
            <Pressable
              onPress={() => {
                Speech.stop();
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
              style={{
                backgroundColor: '#6A1B9A',
                borderRadius: 32,
                paddingHorizontal: 56,
                paddingVertical: 16,
                marginTop: 8,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' }}>
                {t('common.done')} ✓
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ==========================================
  // TRANSITION SCREEN (before full number round)
  // ==========================================
  if (practicePhase === 'transition') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <StatusBar style="dark" />

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          {/* Trophy emoji */}
          <Text style={{ fontSize: 80, marginBottom: 16 }}>🏆</Text>

          {/* Chunks complete message */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#81C784',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            {t('practiceMode.practiceScreen.celebration.chunksLearned')}
          </Text>

          {/* Transition message */}
          <Text
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#4FC3F7',
              marginBottom: 24,
              textAlign: 'center',
            }}
          >
            {celebrationMessage}
          </Text>

          {/* Show full number preview */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              paddingHorizontal: 32,
              paddingVertical: 16,
              borderWidth: 3,
              borderColor: '#FFD54F',
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: '#37474F',
                letterSpacing: 2,
              }}
            >
              {contact.formattedNumber}
            </Text>
          </View>

          {/* Loading indicator */}
          <Text style={{ fontSize: 16, color: '#999', marginTop: 24 }}>
            {t('practiceMode.practiceScreen.celebration.getReady')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // MAIN PRACTICE INTERFACE (chunked & full number)
  // ==========================================
  // Calculate bottom padding with fallback
  // Why Math.max: Some Android devices report insets.bottom as 0 even with soft nav bar
  // 24px fallback ensures content doesn't touch screen edge on any device
  const bottomPadding = Math.max(insets.bottom, 24);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F5F5F5',
        // Use safe area insets for proper padding on all edges
        // Why manual padding: More reliable than SafeAreaView on some Android devices
        paddingTop: insets.top,
        paddingBottom: bottomPadding,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <StatusBar style="dark" />

      {/* Header - compact */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E0E0E0',
        }}
      >
        <Pressable onPress={handleBack} style={{ padding: 8, marginRight: 12 }}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </Pressable>

        <Text
          style={{ fontSize: 18, fontWeight: 'bold', color: '#37474F', flex: 1 }}
          numberOfLines={1}
        >
          {t('practiceMode.practiceScreen.header.callName', { name: contact.name })}
        </Text>

        {/* Phase badge - shows current phase */}
        <View
          style={{
            backgroundColor: practicePhase === 'fullNumber' ? '#FFD54F' : '#F5F5F5',
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '600', color: practicePhase === 'fullNumber' ? '#37474F' : '#666' }}>
            {practicePhase === 'fullNumber' ? t('practiceMode.practiceScreen.phaseBadge.finalRound') : (
              difficulty === 'beginner' ? t('practiceMode.practiceScreen.phaseBadge.easy') :
              difficulty === 'intermediate' ? t('practiceMode.practiceScreen.phaseBadge.medium') :
              t('practiceMode.practiceScreen.phaseBadge.hard')
            )}
          </Text>
        </View>
      </View>

      {/* Progress Bar - compact */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E0E0E0',
          gap: 6,
        }}
      >
        {/* Chunk progress bars */}
        {contact.digitGrouping.map((_, index) => {
          const isComplete = index < currentChunkIndex || practicePhase === 'fullNumber';
          const isCurrent = index === currentChunkIndex && practicePhase === 'chunked';

          return (
            <View
              key={index}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                backgroundColor: isComplete
                  ? '#81C784' // Green - complete
                  : isCurrent
                  ? '#4FC3F7' // Blue - current
                  : '#E0E0E0', // Gray - upcoming
              }}
            />
          );
        })}
        {/* Full number round indicator */}
        <View
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor: practicePhase === 'fullNumber'
              ? '#FFD54F' // Yellow - current (full number round)
              : '#E0E0E0', // Gray - not yet
          }}
        />
      </View>

      {/* Practice content - Fixed layout with dial pad centered */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}>
        {/* Top section: Contact info + instructions + dialed number - fixed height */}
        <View style={{ gap: 6 }}>
        {/* Contact avatar and name - compact layout */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {contact.avatar ? (
            <Image
              source={{ uri: contact.avatar }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: '#4FC3F7',
              }}
            />
          ) : (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#4FC3F7',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 20, color: '#FFFFFF' }}>
                {contact.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#37474F', marginLeft: 10 }}>
            {contact.name}
          </Text>
        </View>

        {/* Current phase instruction - compact */}
        <View
          style={{
            backgroundColor: practicePhase === 'fullNumber' ? '#FFF8E1' : '#E3F2FD',
            borderRadius: 8,
            padding: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 13, color: practicePhase === 'fullNumber' ? '#F57C00' : '#1976D2', marginBottom: 2 }}>
            {practicePhase === 'fullNumber'
              ? t('practiceMode.practiceScreen.instructions.finalRound')
              : difficulty === 'advanced'
              ? t('practiceMode.practiceScreen.instructions.memory')
              : t('practiceMode.practiceScreen.instructions.chunk', { current: currentChunkIndex + 1, total: totalChunks })}
          </Text>

          {/* Show target digits based on difficulty + phase */}
          {difficulty === 'beginner' && practicePhase !== 'fullNumber' && (
            /**
             * Beginner single_digit mode (spec: LessonStep.type = 'single_digit')
             *
             * Shows ONE large digit at a time — the current target.
             * Why: Toddlers ages 3-4 cannot hold multiple targets in working memory.
             * Isolating one digit removes all ambiguity: there is only ONE thing to tap.
             * Progress dots below give a sense of advancement without overwhelming.
             */
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              {/* Single large target digit */}
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: '#E3F2FD',
                  borderWidth: 3,
                  borderColor: '#4FC3F7',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 10,
                  // Glow when hint is active
                  shadowColor: showHint ? '#FFD54F' : 'transparent',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: showHint ? 1 : 0,
                  shadowRadius: showHint ? 12 : 0,
                  elevation: showHint ? 8 : 0,
                }}
              >
                <Text style={{ fontSize: 42, fontWeight: 'bold', color: '#1976D2' }}>
                  {currentChunkTarget[chunkDialed.length] ?? ''}
                </Text>
              </View>

              {/* Progress dots — one per digit in the chunk */}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {currentChunkTarget.split('').map((_, index) => (
                  <View
                    key={index}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: index < chunkDialed.length
                        ? '#81C784'   // Green = done
                        : index === chunkDialed.length
                        ? '#4FC3F7'   // Blue = current
                        : '#E0E0E0',  // Grey = upcoming
                    }}
                  />
                ))}
              </View>
            </View>
          )}

          {difficulty === 'intermediate' && (
            /**
             * Intermediate mode: show all digits in the current chunk/phase.
             * Digits shown as boxes — typed digits turn green, upcoming show '?'.
             * Hint highlights the next box with a yellow border.
             */
            <View style={{ flexDirection: 'row', gap: 3, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              {practicePhase === 'fullNumber' ? (
                contact.phoneNumber.split('').map((digit, index) => {
                  const isDialed = index < fullNumberDialed.length;
                  const isNext = index === fullNumberDialed.length;
                  return (
                    <View
                      key={index}
                      style={{
                        width: 28,
                        height: 34,
                        borderRadius: 5,
                        backgroundColor: isDialed ? '#81C784' : '#FFFFFF',
                        borderWidth: isNext && showHint ? 2 : 1,
                        borderColor: isNext && showHint ? '#FFD54F' : isDialed ? '#81C784' : '#E0E0E0',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDialed ? '#FFFFFF' : isNext ? '#F57C00' : '#BDBDBD' }}>
                        {isDialed ? digit : '?'}
                      </Text>
                    </View>
                  );
                })
              ) : (
                currentChunkTarget.split('').map((digit, index) => {
                  const isDialed = index < chunkDialed.length;
                  const isNext = index === chunkDialed.length;
                  return (
                    <View
                      key={index}
                      style={{
                        width: 36,
                        height: 42,
                        borderRadius: 6,
                        backgroundColor: isDialed ? '#81C784' : '#FFFFFF',
                        borderWidth: isNext && showHint ? 2 : 1,
                        borderColor: isNext && showHint ? '#FFD54F' : isDialed ? '#81C784' : '#E0E0E0',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDialed ? '#FFFFFF' : isNext ? '#4FC3F7' : '#BDBDBD' }}>
                        {isDialed ? digit : '?'}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* Advanced: no digit display — pure memory recall */}
        </View>

        {/* Dialed number display */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            padding: 8,
            minHeight: 40,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {difficulty === 'advanced' ? (
            /**
             * Advanced recall display — dots only, no digit feedback.
             * Spec: "Dial the full number from the contact's face alone (no visible digits)"
             *
             * Shows filled dots (●) for typed positions and empty dots (○) for remaining.
             * Why dots: Toddler sees progress without knowing which digit they pressed.
             * This enforces true memory recall — position feedback, zero digit feedback.
             */
            <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              {contact.phoneNumber.split('').map((_, index) => {
                const totalDialed = practicePhase === 'fullNumber'
                  ? fullNumberDialed.length
                  : (dialedNumber + chunkDialed).length;
                return (
                  <Text
                    key={index}
                    style={{
                      fontSize: 18,
                      color: index < totalDialed ? '#37474F' : '#BDBDBD',
                    }}
                  >
                    {index < totalDialed ? '●' : '○'}
                  </Text>
                );
              })}
            </View>
          ) : practicePhase === 'fullNumber' ? (
            // Intermediate/Beginner — full number phase: show typed digits
            fullNumberDialed.length > 0 ? (
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#F57C00', textAlign: 'center', letterSpacing: 2 }}>
                {fullNumberDialed}
              </Text>
            ) : (
              <Text style={{ fontSize: 13, color: '#999', textAlign: 'center' }}>
                {t('practiceMode.practiceScreen.dialedDisplay.fullNumberPrompt')}
              </Text>
            )
          ) : (
            // Intermediate/Beginner — chunked phase: show typed digits
            dialedNumber.length > 0 || chunkDialed.length > 0 ? (
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#4FC3F7', textAlign: 'center', letterSpacing: 2 }}>
                {dialedNumber + chunkDialed}
              </Text>
            ) : (
              <Text style={{ fontSize: 13, color: '#999', textAlign: 'center' }}>
                {t('practiceMode.practiceScreen.dialedDisplay.chunkPrompt')}
              </Text>
            )
          )}
        </View>
        </View>

        {/* Dialer pad — anchored to top quarter of remaining space.
            justifyContent:'flex-start' + paddingTop:'25%' moves it up ~50%
            relative to the centered position it previously had. */}
        <View style={{
          flex: 1,
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingTop: 0,
        }}>
          {/* Oops message — shown briefly on wrong digit press. */}
          <View style={{ height: 32, justifyContent: 'center', marginBottom: 4 }}>
            {showOops && (
              <View
                style={{
                  backgroundColor: '#FFCDD2',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#C62828' }}>
                  Oops! Try again! 😊
                </Text>
              </View>
            )}
          </View>

          <DialerPad
            onDigitPress={handleDigitPress}
            highlightedDigits={highlightedDigits}
            soundEnabled={true}
            hapticsEnabled={true}
            pulseKey={pulseKey}
            shakeKey={shakeKey}
            flashDigit={flashDigit}
            flashKey={flashKey}
            buttonSize={75}
          />
        </View>
      </View>
    </View>
  );
}
