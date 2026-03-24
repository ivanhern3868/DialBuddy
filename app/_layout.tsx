/**
 * Root Layout for DialBuddy
 *
 * Business Purpose:
 * Sets up the root navigation structure and global providers for the app.
 * This is the entry point for all screens using Expo Router's file-based routing.
 *
 * Responsibilities:
 * - Import global CSS (NativeWind/Tailwind)
 * - Configure navigation structure
 * - Load fonts before app renders
 * - Initialize database on app launch
 * - Manage splash screen visibility during app initialization
 */

// import '../global.css'; // Import NativeWind styles - TEMPORARILY DISABLED for testing
import '../i18n'; // Initialize i18n
import { Stack } from 'expo-router';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Platform, View, Image, StyleSheet, Animated, Text, TextInput } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { initDatabase } from '../utils/storage/database';
import { preloadDTMFTones } from '../utils/audio/dtmfTones';

/**
 * Set Nunito as the global default font for all Text and TextInput components.
 *
 * Why defaultProps: React Native merges defaultProps.style with inline styles,
 * so individual components can still override fontFamily without any changes.
 * This runs once at module load — before any screen renders — so every Text
 * in the app inherits Nunito-Regular automatically.
 *
 * Font must be loaded via useFonts() before it renders. The splash screen
 * prevents any Text from rendering until fonts are confirmed loaded.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Text as any).defaultProps = { ...((Text as any).defaultProps || {}), style: { fontFamily: 'Nunito-Regular' } };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(TextInput as any).defaultProps = { ...((TextInput as any).defaultProps || {}), style: { fontFamily: 'Nunito-Regular' } };

/**
 * Import splash image for JS-based splash screen
 * Why: Native splash only shows during cold start before React loads.
 * In development, the Expo dev client takes over that phase.
 * This JS splash mirrors the native splash during the loading delay.
 */
const splashImage = require('../assets/images/splash.png');

/**
 * Prevent splash screen from auto-hiding on app launch
 * Why: We want to keep it visible until our async initialization completes
 * (database init, audio preload, fonts, etc.)
 */
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  /**
   * Load Nunito fonts for child-friendly UI
   *
   * Business Purpose:
   * Nunito is a rounded, friendly font with high legibility for ages 3-4.
   * Must load before rendering any text to avoid flash of unstyled text (FOUT).
   *
   * Font weights loaded:
   * - Regular: Body text, numbers on dialer
   * - Bold: Titles, emphasized text
   * - SemiBold: Buttons, important labels
   * - Light: Secondary text (optional, for variety)
   */
  const [fontsLoaded] = useFonts({
    'Nunito-Regular':   require('../assets/fonts/Nunito/static/Nunito-Regular.ttf'),
    'Nunito-Bold':      require('../assets/fonts/Nunito/static/Nunito-Bold.ttf'),
    'Nunito-SemiBold':  require('../assets/fonts/Nunito/static/Nunito-SemiBold.ttf'),
    'Nunito-ExtraBold': require('../assets/fonts/Nunito/static/Nunito-ExtraBold.ttf'),
    'Nunito-Black':     require('../assets/fonts/Nunito/static/Nunito-Black.ttf'),
    'Nunito-Light':     require('../assets/fonts/Nunito/static/Nunito-Light.ttf'),
  });

  /**
   * Track whether splash fade-out animation has completed
   * Why separate from appReady: We want to show main content behind the fading splash
   * so the transition feels seamless (content appears as splash fades away)
   */
  const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);

  /**
   * Animated value for splash screen fade-out effect
   * Why Animated API: Native-driven animations are smoother than JS-driven (60fps)
   * Starts at 1 (fully visible), animates to 0 (fully transparent)
   */
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    async function prepare() {
      /**
       * Minimum splash screen display time in milliseconds
       * Why: The native splash shows briefly during app cold start, but in development
       * the JS bundle loads quickly so users may not see it. This ensures the splash
       * is visible for at least 1.5 seconds for branding purposes.
       *
       * In production, actual initialization (DB, audio) usually takes longer than this
       * minimum, so the splash naturally stays visible.
       */
      const MIN_SPLASH_TIME_MS = 5000;
      const startTime = Date.now();

      try {
        // Platform Check: SQLite and DTMF audio are native-only features
        // Why skip on web: expo-sqlite requires WASM not bundled, expo-av needs native audio
        // Web users see UI-only demo (no data persistence, no audio feedback)
        if (Platform.OS !== 'web') {
          // Initialize database and preload DTMF audio files
          // Business Rule: Both must complete before app renders
          // Why parallel: Saves ~500ms on app startup vs sequential
          await Promise.all([
            initDatabase(),
            preloadDTMFTones(),
          ]);
        } else {
          console.log('[DialBuddy] Running on web - database and audio disabled');
        }
      } catch (error) {
        console.error('[DialBuddy] Failed to initialize app:', error);
        // Still allow app to load (graceful degradation)
        // App works without database (creates new) and without audio (silent mode)
      }

      // Ensure splash screen is shown for minimum time (branding/UX)
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < MIN_SPLASH_TIME_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_SPLASH_TIME_MS - elapsedTime));
      }

      // Mark app as ready - this triggers the fade-out animation
      setAppReady(true);
    }

    // Wait for fonts to load before initializing app
    // Why: Prevents flash of unstyled text (FOUT) during splash screen transition
    if (fontsLoaded) {
      prepare();
    }
  }, [fontsLoaded]);

  /**
   * Fade out splash screen when app is ready
   * Why separate useEffect: Clean separation of concerns - prepare() handles loading,
   * this handles the visual transition
   *
   * Animation duration: 800ms provides a gentle, professional fade
   * Using native driver for smooth 60fps animation
   */
  useEffect(() => {
    if (appReady) {
      const FADE_DURATION_MS = 800; // Duration of fade-out animation

      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        useNativeDriver: true, // Hardware-accelerated animation
      }).start(() => {
        // Animation complete callback - remove splash from render tree
        // Why: Prevents invisible splash from blocking touch events on main content
        setSplashAnimationComplete(true);
      });
    }
  }, [appReady, splashOpacity]);

  /**
   * Hide splash screen once layout is ready
   * Why useCallback: Prevents recreation on every render
   * Why onLayout: Ensures the view has actually rendered before hiding splash
   */
  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      // Hide the splash screen after the root view has rendered
      // Small delay ensures smooth transition
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  /**
   * Render Strategy for Smooth Fade Transition:
   *
   * Phase 1 (appReady=false): Show only splash screen (static, no main content)
   * Phase 2 (appReady=true, splashAnimationComplete=false): Show main content with
   *         fading splash overlay on top - user sees splash fade away revealing content
   * Phase 3 (splashAnimationComplete=true): Show only main content (splash removed)
   *
   * Why this approach: Main content renders behind fading splash so user sees
   * a seamless reveal animation instead of abrupt screen change
   */

  // Phase 1: Still loading fonts or app initialization - show solid splash screen
  // Why wait for fonts: Prevents flash of unstyled text when app first renders
  if (!fontsLoaded || !appReady) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={splashImage}
          style={styles.splashImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Phase 2 & 3: Show main content, with optional fading splash overlay
  // Why SafeAreaProvider: Provides safe area context to all child screens,
  // ensuring proper handling of notches, status bars, and soft navigation buttons on Android
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        {/* Main app content - renders underneath the fading splash */}
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
        </Stack>

        {/* Fading splash overlay - positioned absolutely over main content */}
        {/* Removed from render tree once animation completes to prevent touch blocking */}
        {!splashAnimationComplete && (
          <Animated.View
            style={[
              styles.splashOverlay,
              { opacity: splashOpacity }, // Animated opacity for fade effect
            ]}
            pointerEvents="none" // Allow touches to pass through to content below
          >
            <Image
              source={splashImage}
              style={styles.splashImage}
              resizeMode="contain"
            />
          </Animated.View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

/**
 * Styles for JS splash screen
 * Mirrors the native splash configuration in app.json
 */
const styles = StyleSheet.create({
  /**
   * Splash container for Phase 1 (before app is ready)
   * Full screen with brand background color
   */
  splashContainer: {
    flex: 1,
    backgroundColor: '#4FC3F7', // Same as app.json splash.backgroundColor
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * Splash overlay for Phase 2 (fade-out transition)
   * Absolutely positioned over main content so user sees content
   * appear behind the fading splash screen
   */
  splashOverlay: {
    ...StyleSheet.absoluteFillObject, // position: absolute, top/left/right/bottom: 0
    backgroundColor: '#4FC3F7', // Same background to prevent flicker
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * Splash image - full screen to match native splash config
   */
  splashImage: {
    width: '100%',
    height: '100%',
  },
});
