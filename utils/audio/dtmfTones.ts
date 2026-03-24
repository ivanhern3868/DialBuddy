/**
 * DTMF Tone Audio Playback for DialBuddy
 *
 * Business Purpose:
 * Realistic phone dial tones teach children the cause-and-effect relationship
 * between button presses and sounds. This is critical for building muscle memory
 * and making practice sessions feel like using a real phone.
 *
 * Why This Matters:
 * - Sensory feedback reinforces learning (multi-modal: visual + audio + haptic)
 * - Children recognize the "real phone" sounds from parent devices
 * - DTMF tones are standardized (ITU-T Q.23), so toddlers hear what dispatchers hear
 * - Proper audio cues help children with vision impairments
 *
 * Technical Implementation:
 * - Uses expo-av Sound API for low-latency playback
 * - Creates fresh Sound instance for each play (prevents GC issues)
 * - Tracks active sounds in Set to prevent premature garbage collection
 * - Respects user settings (soundEffects toggle in Parent Zone)
 *
 * KNOWN LIMITATION - Expo Go Audio Issue:
 * On some Android devices, expo-av audio playback does NOT work in Expo Go.
 * The API returns success (isPlaying: true) but no sound plays.
 * This is a known Expo Go limitation with native audio modules.
 *
 * Solution: Build a development build instead of using Expo Go:
 *   npx eas build --profile development --platform android
 *
 * The audio WILL work in production builds and EAS development builds.
 * For development/testing, use iOS Expo Go or build Android dev build.
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';

/**
 * DTMF digit type - all valid phone keypad characters
 * Business Rule: Standard phone keypad layout (no letters, those are in UI only)
 */
export type DTMFDigit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '*' | '#';

/**
 * Sound objects for each DTMF tone
 * Why preload: Eliminates loading delay during dialing (must be instant for toddlers)
 */
const soundCache: Map<DTMFDigit, Audio.Sound> = new Map();

/**
 * Audio file sources for recreating sounds if needed
 * Why store: Allows recreating Sound objects if they get destroyed
 */
const toneFiles: Record<DTMFDigit, any> = {
  '0': require('../../assets/sounds/dtmf/0.wav'),
  '1': require('../../assets/sounds/dtmf/1.wav'),
  '2': require('../../assets/sounds/dtmf/2.wav'),
  '3': require('../../assets/sounds/dtmf/3.wav'),
  '4': require('../../assets/sounds/dtmf/4.wav'),
  '5': require('../../assets/sounds/dtmf/5.wav'),
  '6': require('../../assets/sounds/dtmf/6.wav'),
  '7': require('../../assets/sounds/dtmf/7.wav'),
  '8': require('../../assets/sounds/dtmf/8.wav'),
  '9': require('../../assets/sounds/dtmf/9.wav'),
  '*': require('../../assets/sounds/dtmf/star.wav'),
  '#': require('../../assets/sounds/dtmf/pound.wav'),
};

/**
 * Currently playing sounds
 * Why array: Multiple sounds can play simultaneously when toddler rapidly taps buttons
 * Why track: Prevents garbage collection while sounds are still playing
 */
const activeSounds: Set<Audio.Sound> = new Set();

/**
 * Preload all DTMF audio files into memory
 *
 * Business Rule: Must complete before dialer UI renders
 * Called from: app/_layout.tsx during app initialization
 *
 * Why async: Audio loading is I/O-bound, must not block UI thread
 * Error handling: If audio fails to load, app still works (silent mode)
 */
export async function preloadDTMFTones(): Promise<void> {
  // Platform check: Audio playback only works on native (iOS/Android)
  // Why: expo-av requires native audio APIs, web uses different implementation
  // Web users get silent mode (UI works, no sound effects)
  if (Platform.OS === 'web') {
    console.log('[DialBuddy] Running on web - DTMF audio disabled');
    return;
  }

  try {
    /**
     * interruptionModeAndroid: 2 = DuckOthers
     * Why DuckOthers (not DoNotMix=1): allows bg music and DTMF to coexist on Android.
     * DoNotMix requests exclusive audio focus and stops other players (including bg music).
     * DuckOthers briefly lowers other audio while DTMF plays, then restores it.
     *
     * shouldDuckAndroid: true — required for DuckOthers mode to work correctly.
     * This setting is set once here; playDTMFTone does NOT call setAudioModeAsync
     * again to avoid resetting audio focus and killing bg music mid-playback.
     */
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      allowsRecordingIOS: false,
      interruptionModeIOS: 1,
      interruptionModeAndroid: 2,
    });

    // Load each audio file into memory
    // Why Promise.all: Parallel loading is faster than sequential (saves ~1 second on app launch)
    console.log('[DialBuddy] Starting DTMF tone preload...');

    await Promise.all(
      (Object.keys(toneFiles) as DTMFDigit[]).map(async (digit) => {
        try {
          console.log(`[DialBuddy] Loading DTMF tone for "${digit}"...`);
          const { sound } = await Audio.Sound.createAsync(toneFiles[digit], {
            shouldPlay: false, // Don't auto-play on load
            volume: 0.5, // Max volume (user controls device volume)
          });
          soundCache.set(digit, sound);
          console.log(`[DialBuddy] ✓ Loaded DTMF tone for "${digit}"`);
        } catch (error) {
          // Non-critical error: If one tone fails, others still work
          console.warn(`[DialBuddy] ✗ Failed to load DTMF tone for "${digit}":`, error);
        }
      })
    );

    console.log(`[DialBuddy] ✓ DTMF tones preloaded successfully (${soundCache.size}/12 tones)`);
  } catch (error) {
    // Critical error: Audio system failed to initialize
    // App still works in silent mode, but log for debugging
    console.error('[DialBuddy] ✗ Failed to initialize DTMF audio system:', error);
  }
}

/**
 * Play DTMF tone for a specific digit
 *
 * Business Rules:
 * - Fire-and-forget: Returns immediately for responsive UI (no awaiting playback)
 * - Respects soundEffects setting from AppSettings
 * - Returns immediately if sound not loaded (graceful degradation)
 *
 * Called from: DialerButton component when toddler presses button
 *
 * @param digit - The phone keypad digit to play (0-9, *, #)
 * @param shouldPlay - Whether to actually play sound (from AppSettings.soundEffects)
 */
export function playDTMFTone(digit: DTMFDigit, shouldPlay: boolean = true): void {
  // Parent disabled sound effects in settings
  if (!shouldPlay) {
    return;
  }

  // Fire-and-forget playback - don't await to keep UI responsive
  // Why separate async IIFE: Allows immediate return while audio plays in background
  // Why this pattern: Rapid button taps need instant feedback, can't wait for audio operations
  (async () => {
    try {
      const audioFile = toneFiles[digit];
      if (!audioFile) {
        console.warn(`[DialBuddy] No audio file for "${digit}"`);
        return;
      }

      // Audio mode is set once in preloadDTMFTones — do not call setAudioModeAsync here.
      // Calling it on every button press resets Android audio focus and kills bg music.

      // Create sound and play immediately using shouldPlay: true
      // Why shouldPlay: true: Ensures playback starts as soon as audio is loaded
      // This is the recommended approach from expo-av documentation
      const { sound } = await Audio.Sound.createAsync(audioFile, {
        shouldPlay: true, // Auto-play immediately when loaded
        volume: 0.5,
        isLooping: false,
      });

      // Add to active sounds to prevent GC during playback
      activeSounds.add(sound);

      // Set up completion callback to clean up
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          // Playback finished - unload to free memory
          sound.unloadAsync().catch(() => {});
          activeSounds.delete(sound);
        }
      });
    } catch (error) {
      // Non-critical: Audio playback failed, but app continues working
      console.error(`[DialBuddy] ✗ Failed to play DTMF tone for "${digit}":`, error);
    }
  })();
}

/**
 * Stop all currently playing DTMF tones
 *
 * Business Use Case: When toddler exits dialer screen or app goes to background
 * Called from: Dialer component cleanup (useEffect return)
 */
export async function stopCurrentTone(): Promise<void> {
  if (activeSounds.size > 0) {
    try {
      // Stop all active sounds
      const stopPromises = Array.from(activeSounds).map(sound =>
        sound.stopAsync().catch(() => {})
      );
      await Promise.all(stopPromises);
      activeSounds.clear();
    } catch (error) {
      console.warn('[DialBuddy] Failed to stop DTMF tones:', error);
    }
  }
}

/**
 * Cleanup all loaded audio resources
 *
 * Business Use Case: App is being closed or memory is critically low
 * Called from: App cleanup lifecycle (rare, iOS/Android handle this automatically)
 */
export async function unloadDTMFTones(): Promise<void> {
  try {
    await stopCurrentTone();

    // Unload all cached sounds from memory
    for (const [digit, sound] of soundCache.entries()) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.warn(`[DialBuddy] Failed to unload DTMF tone for "${digit}":`, error);
      }
    }

    soundCache.clear();
    console.log('[DialBuddy] ✓ DTMF tones unloaded');
  } catch (error) {
    console.error('[DialBuddy] ✗ Failed to unload DTMF tones:', error);
  }
}
