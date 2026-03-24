/**
 * Home Screen - DialBuddy Main Menu
 *
 * Business Purpose:
 * Main navigation hub for DialBuddy. Children tap large, friendly buttons to
 * choose their activity (Free Dial, Practice, Emergency Learning, My People).
 *
 * First-Run Flow:
 * - Checks if onboarding has been completed
 * - Redirects to onboarding screen on first app launch
 * - Shows main menu after onboarding complete
 *
 * Design for Ages 3-4:
 * - Large touch targets (120×120px minimum)
 * - High contrast colors
 * - Simple icon + text labels
 * - Maximum 4 choices (prevents decision paralysis)
 *
 * Future Enhancement:
 * Will show active child's profile photo and name at top.
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet, ImageBackground, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Audio } from 'expo-av';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

// Get screen dimensions to calculate button sizes
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PADDING = 32; // px-8 = 32px total horizontal padding
const GAP = 16; // Gap between buttons
const BUTTON_SIZE = (SCREEN_WIDTH - PADDING - GAP) / 2;
// EmergenciesBtn.png is 329×377 — use its aspect ratio so all buttons match
const BUTTON_HEIGHT = Math.round(BUTTON_SIZE * (377 / 329));

/**
 * Renders text with a linear gradient fill using SVG.
 *
 * Business Purpose: Makes button labels visually distinctive and fun for children.
 *
 * How it works:
 * SVG natively supports gradient fills on text via a <linearGradient> definition
 * referenced by the Text's fill attribute. This works in Expo Go without a custom
 * dev build, unlike the MaskedView approach which requires native linking.
 *
 * @param children   - The text content. Use '\n' for line breaks (rendered as separate tspans).
 * @param colors     - Gradient stop colors [start, end]
 * @param fontSize   - Font size in px (must be explicit for SVG text sizing)
 * @param fontFamily - Font family name (must match a loaded font)
 * @param width      - SVG canvas width — should match the button container width
 * @param lineHeight - Vertical spacing between lines (default: fontSize * 1.2)
 */
function GradientText({
  children,
  colors,
  fontSize = 16,
  fontFamily = 'Nunito-Black',
  width = 120,
  lineHeight,
}: {
  children: string;
  colors: [string, string];
  fontSize?: number;
  fontFamily?: string;
  width?: number;
  lineHeight?: number;
}) {
  const lines = children.split('\n');
  const lh = lineHeight ?? fontSize * 1.2;
  const height = lh * lines.length + 4; // +4px padding so descenders aren't clipped

  /**
   * Unique gradient ID per instance.
   * Why: SVG gradient IDs are global within a rendered page. If two GradientText
   * components both define id="grad", the second overrides the first and all
   * references to that ID pick up the wrong colors. Encoding the colors into
   * the ID ensures each unique color pair gets its own gradient definition.
   */
  const gradId = `grad-${colors[0].replace('#', '')}-${colors[1].replace('#', '')}`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgLinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors[0]} stopOpacity="1" />
          <Stop offset="1" stopColor={colors[1]} stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      {lines.map((line, i) => (
        <SvgText
          key={i}
          x={width / 2}
          y={fontSize + i * lh}
          textAnchor="middle"
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontWeight="900"
          fill={`url(#${gradId})`}
        >
          {line}
        </SvgText>
      ))}
    </Svg>
  );
}


const styles = StyleSheet.create({
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_HEIGHT,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: SCREEN_WIDTH - PADDING,
    marginBottom: GAP,
  },
});

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  /**
   * Background music — starts only after onboarding check confirms we're
   * staying on the home screen, unloaded on unmount.
   *
   * Business Purpose: Friendly ambient music makes the home screen feel
   * welcoming and signals to the child that the app is ready to play.
   *
   * Volume: 50% — present but not distracting, so voice coaching stays audible.
   * Loop: true — plays continuously while the home screen is visible.
   *
   * Why wait for checkingOnboarding=false:
   * Starting music immediately on mount caused a race condition — the onboarding
   * redirect (router.replace) would unmount the component before createAsync
   * resolved, so the sound loaded into a dead component and threw "Player does
   * not exist." Waiting until we know we're staying avoids this entirely.
   */
  const bgMusicRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Don't start music during the onboarding check — we may be about to redirect
    if (checkingOnboarding) return;

    let mounted = true;

    async function startBgMusic() {
      try {
        /**
         * Set audio mode before creating the sound.
         *
         * Why here (not globally): preloadDTMFTones sets interruptionModeAndroid: DoNotMix
         * (value 1) during app init. On Android, this mode prevents subsequent Sound
         * objects from playing unless we re-assert the audio mode. Calling setAudioModeAsync
         * again here re-establishes audio focus for the bg music session.
         *
         * shouldDuckAndroid: true — allows DTMF tones to briefly duck bg music on Android
         * rather than stopping it entirely when audio focus changes.
         */
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,    // Must match DuckOthers mode set in preloadDTMFTones
          playThroughEarpieceAndroid: false,
          allowsRecordingIOS: false,
          interruptionModeIOS: 1,
          interruptionModeAndroid: 2, // DuckOthers — coexists with DTMF tones
        });

        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/bgmusic.wav'),
          { shouldPlay: false, volume: 0.025, isLooping: true }
        );

        if (!mounted) {
          // Component unmounted while audio was loading — discard the sound.
          // Silence the error: Android player may already be released at this point.
          sound.unloadAsync().catch(() => {});
          return;
        }

        bgMusicRef.current = sound;
        await sound.playAsync();
      } catch (error) {
        console.warn('[DialBuddy] Background music failed to load:', error);
      }
    }

    startBgMusic();

    return () => {
      mounted = false;
      // Capture ref before clearing — avoids race where playAsync runs after unload starts.
      // Silence "Player does not exist" which fires if Android already released the player.
      const s = bgMusicRef.current;
      bgMusicRef.current = null;
      s?.unloadAsync().catch(() => {});
    };
  }, [checkingOnboarding]); // Re-runs when onboarding check resolves

  /**
   * Check if onboarding has been completed
   *
   * Business Flow:
   * 1. Check AsyncStorage for onboarding_complete flag
   * 2. If not found (first run), redirect to onboarding
   * 3. If found, show home screen
   *
   * Why useEffect: Runs once on component mount
   * Why router.replace: Prevents back navigation to home before onboarding
   */
  useEffect(() => {
    async function checkOnboarding() {
      try {
        const onboardingComplete = await AsyncStorage.getItem('onboarding_complete');

        if (!onboardingComplete) {
          // First run - redirect to onboarding
          console.log('[DialBuddy] First run detected, showing onboarding');
          router.replace('/onboarding');
        } else {
          // Onboarding complete - show home screen
          console.log('[DialBuddy] Onboarding complete, showing home');
          setCheckingOnboarding(false);
        }
      } catch (error) {
        console.error('[DialBuddy] Failed to check onboarding status:', error);
        // Graceful degradation: show home screen (better than blank screen)
        setCheckingOnboarding(false);
      }
    }

    checkOnboarding();
  }, []);

  // Show nothing while checking onboarding status
  // Why: Prevents flash of home screen before redirect
  if (checkingOnboarding) {
    return null;
  }

  return (
    <ImageBackground
      source={require('../assets/images/bg.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style="dark" />

        {/* Main menu buttons - 2x2 Grid Layout */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {/* Logo */}
          <Image
            source={require('../assets/images/logo2.png')}
            style={{ width: 350, marginBottom: -50, marginTop: -200 }}
            resizeMode="contain"
          />
          {/* First Row: Practice + Emergency */}
          <View style={styles.row}>
            <Pressable
              onPress={() => router.push('/practice-select')}
              accessibilityRole="button"
              accessibilityLabel={t('home.practice')}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
                pressed && styles.buttonPressed,
              ]}
            >
              <Image
                source={require('../assets/images/PracticeBtn.png')}
                style={{ width: BUTTON_SIZE * 1.15, height: BUTTON_HEIGHT * 1.15 }}
                resizeMode="contain"
              />
              <Text style={{
                fontFamily: 'Nunito-Black',
                fontSize: 16,
                color: '#559ed3',
                textAlign: 'center',
                position: 'absolute',
                top: 8,
                lineHeight: 18,
              }}>
                {'Practice\nDialing'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/emergency')}
              accessibilityRole="button"
              accessibilityLabel={t('home.emergency')}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
                pressed && styles.buttonPressed,
              ]}
            >
              <Image
                source={require('../assets/images/EmergenciesBtn.png')}
                style={{ width: BUTTON_SIZE * 1.15, height: BUTTON_HEIGHT * 1.15 }}
                resizeMode="contain"
              />
              <Text style={{
                fontFamily: 'Nunito-Black',
                fontSize: 16,
                color: '#f68d6d',
                textAlign: 'center',
                position: 'absolute',
                top: 6,
                lineHeight: 18,
              }}>
                {'Practice\nEmergencies'}
              </Text>
            </Pressable>
          </View>

          {/* Second Row: My Contacts + Parent Zone */}
          <View style={[styles.row, { marginBottom: 0 }]}>
            <Pressable
              onPress={() => router.push('/contacts')}
              accessibilityRole="button"
              accessibilityLabel={t('home.myContacts')}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
                pressed && styles.buttonPressed,
              ]}
            >
              <Image
                source={require('../assets/images/ContactsBtn.png')}
                style={{ width: BUTTON_SIZE * 1.15, height: BUTTON_HEIGHT * 1.15 }}
                resizeMode="contain"
              />
              <View style={{ position: 'absolute', top: 8 }}>
                <GradientText
                  colors={['#f5d978', '#a3c378']}
                  fontSize={16}
                  lineHeight={18}
                  width={BUTTON_SIZE}
                >
                  {'My\nContacts'}
                </GradientText>
              </View>
            </Pressable>
            <Pressable
              onPress={() => router.push('/parent-zone')}
              accessibilityRole="button"
              accessibilityLabel={t('parentZone.title')}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
                pressed && styles.buttonPressed,
              ]}
            >
              <Image
                source={require('../assets/images/ParentBtn.png')}
                style={{ width: BUTTON_SIZE * 1.15, height: BUTTON_HEIGHT * 1.15 }}
                resizeMode="contain"
              />
              <View style={{ position: 'absolute', top: 8 }}>
                <GradientText
                  colors={['#e1cde9', '#9399cd']}
                  fontSize={16}
                  lineHeight={18}
                  width={BUTTON_SIZE}
                >
                  {'Parent\nZone'}
                </GradientText>
              </View>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
