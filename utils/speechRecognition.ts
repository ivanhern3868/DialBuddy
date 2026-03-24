/**
 * Speech Recognition - Native Implementation (with graceful fallback)
 *
 * Business Purpose:
 * Wraps expo-speech-recognition for iOS and Android. Uses require() instead
 * of a static import so we can catch the "Cannot find native module" error
 * that occurs when running inside Expo Go (which doesn't bundle third-party
 * native modules). In that case we fall back to the same stubs used on web,
 * which causes the speech phase to show the "I Said It!" manual button.
 *
 * Production / Custom Dev Client:
 * When the app is built with `expo-dev-client` and expo-speech-recognition
 * is included in the native build, the require() succeeds and real STT works.
 */

/** Shared type for the permission result */
interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

/** Minimum API surface we use from expo-speech-recognition */
interface SpeechRecognitionModuleShape {
  requestPermissionsAsync: () => Promise<PermissionResult>;
  start: (options?: object) => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * Stub used when the native module cannot be found.
 * Always reports permission denied so the calling screen shows the
 * "I Said It!" fallback button instead of crashing.
 */
const STUB_MODULE: SpeechRecognitionModuleShape = {
  requestPermissionsAsync: async () => ({ granted: false, canAskAgain: false }),
  start: async () => {},
  stop: async () => {},
};

/** No-op hook stub — consistent call count satisfies React's rules of hooks */
const STUB_EVENT_HOOK = (_event: string, _handler: (...args: unknown[]) => void): void => {};

// Attempt to load the native module at runtime.
// Fails silently in Expo Go; succeeds in a custom dev client / production build.
let resolvedModule: SpeechRecognitionModuleShape = STUB_MODULE;
let resolvedEventHook: typeof STUB_EVENT_HOOK = STUB_EVENT_HOOK;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pkg = require('expo-speech-recognition');
  if (pkg?.ExpoSpeechRecognitionModule) {
    resolvedModule = pkg.ExpoSpeechRecognitionModule;
    resolvedEventHook = pkg.useSpeechRecognitionEvent;
  }
} catch {
  // Native module not linked — stubs remain active
  console.warn('[DialBuddy] expo-speech-recognition native module not found. '
    + 'Speech recognition disabled. Run a custom dev client build to enable it.');
}

export const ExpoSpeechRecognitionModule = resolvedModule;
export const useSpeechRecognitionEvent = resolvedEventHook;
