/**
 * Speech Recognition - Web Stub
 *
 * Business Purpose:
 * No-op implementation of the speech recognition API for the web platform.
 * Metro resolves this file instead of speechRecognition.ts when bundling
 * for web, preventing the native expo-speech-recognition from crashing
 * the web bundle (it has no web exports).
 *
 * Behavior on web:
 * - Permission request always returns granted=false
 * - Start/stop are no-ops
 * - Event hooks never fire
 * The emergency-scenario screen handles the granted=false case by
 * showing the "I Said It!" fallback button.
 */

/**
 * Stub module that mirrors the ExpoSpeechRecognitionModule API surface.
 * All methods are async no-ops safe to call on web.
 */
export const ExpoSpeechRecognitionModule = {
  /**
   * Always reports permission denied on web — no native mic access available.
   * The calling screen falls back to the "I Said It!" manual confirmation button.
   */
  requestPermissionsAsync: async (): Promise<{ granted: boolean; canAskAgain: boolean }> => ({
    granted: false,
    canAskAgain: false,
  }),

  /** No-op on web — speech recognition is not available */
  start: async (_options?: object): Promise<void> => {},

  /** No-op on web */
  stop: async (): Promise<void> => {},
};

/**
 * No-op event hook for web.
 * On native, this subscribes to STT events (results, errors).
 * On web it does nothing — events never fire since STT is unavailable.
 *
 * @param _event - Event name (ignored on web)
 * @param _handler - Event handler (never called on web)
 */
export function useSpeechRecognitionEvent(
  _event: string,
  _handler: (...args: unknown[]) => void
): void {
  // Intentionally empty — web does not support speech recognition
}
