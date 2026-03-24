/**
 * Emergency Scenario Flow Screen
 *
 * Business Purpose:
 * Guided four-phase walkthrough of a single emergency scenario:
 *
 *   SCENE   → Show what's happening, build urgency
 *   DIAL    → Child dials the emergency number on the keypad
 *   SPEECH  → Child reads the dispatcher script aloud (STT validates)
 *   SUCCESS → Celebrate + reinforce "you knew exactly what to do!"
 *
 * Design for Ages 3-4:
 * - Parent sits with child throughout — this is a guided activity, not solo use
 * - Large text, high contrast, simple instructions at each phase
 * - Speech phase has a fallback "I Said It!" button in case STT fails
 *   (children's voices are often outside STT training data)
 *
 * Speech Recognition:
 * Uses expo-speech-recognition. Validates by checking whether key scenario
 * words appear in the transcription (fuzzy, not exact match).
 * Threshold: 1 of the scenario's validationKeywords must appear.
 * Why lenient: Mispronunciation + STT noise makes strict matching unfair.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from '../utils/speechRecognition';
import ConfettiCannon from 'react-native-confetti-cannon';
import { getScenarioById } from '../constants/emergencyScenarios';
import { storage } from '../utils/storage/asyncStore';
import { getActiveProfile } from '../utils/storage/profiles';
import DialerPad from '../components/Dialer/DialerPad';
import { DTMFDigit } from '../utils/audio/dtmfTones';
import { playDTMFTone } from '../utils/audio/dtmfTones';

/** Emergency number lookup — mirrors emergency-dial.tsx */
const EMERGENCY_NUMBER_BY_COUNTRY: Record<string, string> = {
  US: '911', CA: '911', MX: '911',
  GB: '999', AU: '000', NZ: '111',
  DE: '112', FR: '112', ES: '112', IT: '112',
  BR: '190', JP: '110', IN: '112',
};

/** Phases of the scenario flow */
type ScenarioPhase = 'scene' | 'dial' | 'speech' | 'success';

export default function EmergencyScenarioScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t, i18n } = useTranslation();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const scenarioId = params.scenarioId as string;
  const scenario = getScenarioById(scenarioId);

  // Current phase of the scenario flow
  const [phase, setPhase] = useState<ScenarioPhase>('scene');

  // Dial phase state
  const [emergencyNumber, setEmergencyNumber] = useState('911');
  const [dialedDigits, setDialedDigits] = useState('');
  const [dialError, setDialError] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Speech phase state
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [speechValidated, setSpeechValidated] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  // Script shown in speech phase — interpolated with child name and address
  const [resolvedScript, setResolvedScript] = useState('');

  // Success phase animation
  const celebrationScale = useRef(new Animated.Value(0)).current;

  /**
   * Load emergency number and build the personalized script on mount.
   *
   * Business Rule: Script interpolates {{name}} and {{address}} from the
   * child's profile and saved home address. If not set, the placeholder
   * text prompts the parent to fill in those details.
   */
  useEffect(() => {
    async function loadData() {
      // Emergency number from country setting
      const countryCode = (await storage.getCountryCode()) || 'US';
      const number = EMERGENCY_NUMBER_BY_COUNTRY[countryCode] || '911';
      setEmergencyNumber(number);

      // Child name from active profile
      const profile = await getActiveProfile();
      const childName = profile?.name || t('emergency.scenario.defaultName');

      // Home address from AsyncStorage
      const address = (await storage.getHomeAddress()) || t('emergency.scenario.defaultAddress');

      // Build the personalized dispatcher script
      if (scenario) {
        const raw = t(scenario.scriptKey);
        const interpolated = raw
          .replace(/\{\{name\}\}/g, childName)
          .replace(/\{\{address\}\}/g, address)
          .replace(/\{\{number\}\}/g, number);
        setResolvedScript(interpolated);
      }
    }

    loadData();
  }, [scenarioId, i18n.language]);

  /**
   * Request microphone permission when reaching the speech phase.
   * We delay this until the user reaches that phase (not on mount) to avoid
   * a permission prompt appearing before context is clear.
   */
  useEffect(() => {
    if (phase === 'speech') {
      requestMicPermission();
    }
  }, [phase]);

  /**
   * Trigger success entrance animation when reaching the success phase.
   */
  useEffect(() => {
    if (phase === 'success') {
      Animated.spring(celebrationScale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [phase]);

  /**
   * Request microphone permission for speech recognition.
   */
  const requestMicPermission = async () => {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    setPermissionGranted(result.granted);
    if (!result.granted) {
      setSpeechError(t('emergency.scenario.micPermissionDenied'));
    }
  };

  // Receive STT transcript results
  useSpeechRecognitionEvent('result', (event: any) => {
    const text = event.results[0]?.transcript || '';
    setTranscription(text);

    // Validate on final result (not interim)
    if (event.isFinal) {
      setIsListening(false);
      validateSpeech(text);
    }
  });

  // Handle STT errors
  useSpeechRecognitionEvent('error', (event: any) => {
    console.warn('[DialBuddy] STT error:', event.error);
    setIsListening(false);
    setSpeechError(t('emergency.scenario.speechError'));
  });

  /**
   * Validate the child's speech against the scenario's required keywords.
   *
   * Business Rule: At least 1 validation keyword must appear in the transcription.
   * Why lenient threshold: Toddler STT is unreliable — false negatives are worse
   * than false positives here (we want to encourage, not frustrate).
   *
   * @param text - Raw STT transcription
   */
  const validateSpeech = (text: string) => {
    if (!scenario) return;

    const lowerText = text.toLowerCase();

    // Check if any required keyword appears in the transcription
    const matched = scenario.validationKeywords.some((keyword) =>
      lowerText.includes(keyword.toLowerCase())
    );

    if (matched) {
      setSpeechValidated(true);
      setSpeechError('');
    } else {
      setSpeechError(t('emergency.scenario.tryAgain'));
    }
  };

  /**
   * Start speech recognition listening session.
   */
  const startListening = async () => {
    setSpeechError('');
    setTranscription('');
    setIsListening(true);

    try {
      await ExpoSpeechRecognitionModule.start({
        lang: i18n.language,
        interimResults: true,
        maxAlternatives: 1,
      });
    } catch (error) {
      console.error('[DialBuddy] Failed to start STT:', error);
      setIsListening(false);
      setSpeechError(t('emergency.scenario.speechError'));
    }
  };

  /**
   * Stop speech recognition.
   */
  const stopListening = async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch {
      // Non-fatal: may already be stopped
    }
    setIsListening(false);
  };

  /**
   * Handle a digit press on the dial pad.
   *
   * Business Rule: Child must dial the exact emergency number.
   * Wrong digits trigger a shake animation (gentle "not that" signal).
   * Correct completion advances to the speech phase.
   */
  const handleDigitPress = (digit: DTMFDigit) => {
    playDTMFTone(digit, true);

    const expectedDigit = emergencyNumber[dialedDigits.length];

    if (digit === expectedDigit) {
      // Correct digit — append and check for completion
      const newDialed = dialedDigits + digit;
      setDialError(false);
      setDialedDigits(newDialed);

      if (newDialed === emergencyNumber) {
        // Full number dialed — brief pause then advance to speech
        setTimeout(() => setPhase('speech'), 800);
      }
    } else {
      // Wrong digit — shake and don't append
      setDialError(true);
      triggerShake();
      // Reset error highlight after 600ms
      setTimeout(() => setDialError(false), 600);
    }
  };

  /**
   * Horizontal shake animation — gentle "not that one" signal.
   */
  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleBack = () => {
    // Stop STT if active before navigating away
    if (isListening) {
      ExpoSpeechRecognitionModule.stop().catch(() => {});
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/emergency-scenarios');
    }
  };

  // Scenario not found (bad param) — return to hub
  if (!scenario) {
    router.replace('/emergency-scenarios');
    return null;
  }

  // ─────────────────────────────────────────────
  // PHASE: SCENE
  // ─────────────────────────────────────────────
  if (phase === 'scene') {
    return (
      <View style={{ flex: 1, backgroundColor: scenario.sceneColor }}>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar style="light" />

          {/* Back button */}
          <View style={{ padding: 16 }}>
            <Pressable
              onPress={handleBack}
              style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, alignSelf: 'flex-start' }}
            >
              <Text style={{ fontSize: 22, color: '#FFF' }}>←</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 28,
              paddingBottom: 24,
            }}
          >
            {/* Scene emoji */}
            <Text style={{ fontSize: 100, marginBottom: 24 }}>{scenario.emoji}</Text>

            {/* Scene description */}
            <Text
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 16,
                lineHeight: 32,
              }}
            >
              {t(scenario.sceneDescKey)}
            </Text>

            {/* Urgent call to action */}
            <View
              style={{
                backgroundColor: 'rgba(0,0,0,0.25)',
                borderRadius: 16,
                paddingHorizontal: 20,
                paddingVertical: 14,
                marginBottom: 40,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#FFEB3B',
                  textAlign: 'center',
                }}
              >
                {t(scenario.sceneActionKey)}
              </Text>
            </View>

            {/* Call 911 button */}
            <Pressable
              onPress={() => setPhase('dial')}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#B71C1C' : '#F44336',
                borderRadius: 24,
                paddingVertical: 20,
                paddingHorizontal: 48,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#FFF' }}>
                📞 {t('emergency.scenario.callButton', { number: emergencyNumber })}
              </Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ─────────────────────────────────────────────
  // PHASE: DIAL
  // ─────────────────────────────────────────────
  if (phase === 'dial') {
    return (
      <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar style="light" />

          {/* Header */}
          <View style={{ padding: 16 }}>
            <Pressable
              onPress={() => setPhase('scene')}
              style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, alignSelf: 'flex-start' }}
            >
              <Text style={{ fontSize: 22, color: '#FFF' }}>←</Text>
            </Pressable>
          </View>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>

            {/* Instruction */}
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 }}>
              {t('emergency.scenario.dialInstruction')}
            </Text>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#F44336', marginBottom: 32, letterSpacing: 8 }}>
              {emergencyNumber}
            </Text>

            {/* Dialed digits display */}
            <Animated.View style={{ transform: [{ translateX: shakeAnim }], marginBottom: 24 }}>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  justifyContent: 'center',
                  minHeight: 60,
                }}
              >
                {emergencyNumber.split('').map((expectedDigit, index) => {
                  const isDialed = index < dialedDigits.length;
                  const isError = dialError && index === dialedDigits.length;

                  return (
                    <View
                      key={index}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        backgroundColor: isDialed
                          ? '#4CAF50'
                          : isError
                          ? '#F44336'
                          : 'rgba(255,255,255,0.15)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        borderColor: isDialed ? '#4CAF50' : isError ? '#F44336' : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFF' }}>
                        {isDialed ? dialedDigits[index] : '_'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Animated.View>

            {/* Dialer pad */}
            <DialerPad
              onDigitPress={handleDigitPress}
              soundEnabled={true}
              hapticsEnabled={true}
              buttonSize={82}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ─────────────────────────────────────────────
  // PHASE: SPEECH
  // ─────────────────────────────────────────────
  if (phase === 'speech') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D47A1' }}>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar style="light" />

          {/* Header */}
          <View style={{ padding: 16 }}>
            <Pressable
              onPress={() => { setPhase('dial'); setDialedDigits(''); }}
              style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, alignSelf: 'flex-start' }}
            >
              <Text style={{ fontSize: 22, color: '#FFF' }}>←</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 24, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Dispatcher icon + header */}
            <Text style={{ fontSize: 64 }}>📟</Text>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 4, marginTop: 8 }}>
              {t('emergency.scenario.dispatcherAnswered')}
            </Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 24 }}>
              {t('emergency.scenario.readAloud')}
            </Text>

            {/* Script card — what the child says */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 24,
                width: '100%',
                marginBottom: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Text style={{ fontSize: 13, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                {t('emergency.scenario.sayThis')}
              </Text>
              <Text style={{ fontSize: 22, color: '#1A237E', lineHeight: 34, fontWeight: '500' }}>
                {resolvedScript}
              </Text>
            </View>

            {/* Transcription feedback */}
            {transcription ? (
              <View
                style={{
                  backgroundColor: speechValidated ? '#E8F5E9' : '#FFF3E0',
                  borderRadius: 12,
                  padding: 14,
                  width: '100%',
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                  {t('emergency.scenario.youSaid')}
                </Text>
                <Text style={{ fontSize: 16, color: speechValidated ? '#2E7D32' : '#E65100', fontStyle: 'italic' }}>
                  "{transcription}"
                </Text>
              </View>
            ) : null}

            {/* Error / try-again message */}
            {speechError ? (
              <Text style={{ fontSize: 15, color: '#FFCDD2', textAlign: 'center', marginBottom: 16 }}>
                {speechError}
              </Text>
            ) : null}

            {/* Permission denied fallback */}
            {permissionGranted === false ? (
              <View style={{ alignItems: 'center', gap: 12, width: '100%' }}>
                <Text style={{ fontSize: 15, color: '#FFCDD2', textAlign: 'center' }}>
                  {t('emergency.scenario.micPermissionDenied')}
                </Text>
                <Pressable
                  onPress={() => { setSpeechValidated(true); setPhase('success'); }}
                  style={{ backgroundColor: '#4CAF50', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 32 }}
                >
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFF' }}>
                    {t('emergency.scenario.iSaidIt')}
                  </Text>
                </Pressable>
              </View>
            ) : speechValidated ? (
              /* Speech validated — show advance button */
              <Pressable
                onPress={() => setPhase('success')}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#2E7D32' : '#4CAF50',
                  borderRadius: 24,
                  paddingVertical: 18,
                  paddingHorizontal: 40,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                })}
              >
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#FFF' }}>
                  ✅ {t('emergency.scenario.greatJob')}
                </Text>
              </Pressable>
            ) : (
              /* Speech buttons */
              <View style={{ alignItems: 'center', gap: 16, width: '100%' }}>
                {/* Hold to speak */}
                <Pressable
                  onPressIn={startListening}
                  onPressOut={stopListening}
                  disabled={permissionGranted === null}
                  style={({ pressed }) => ({
                    backgroundColor: isListening ? '#F44336' : '#1565C0',
                    borderRadius: 60,
                    width: 120,
                    height: 120,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: isListening ? '#F44336' : '#000',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: isListening ? 0.6 : 0.3,
                    shadowRadius: isListening ? 20 : 8,
                    elevation: 8,
                    transform: [{ scale: isListening ? 1.08 : 1 }],
                  })}
                >
                  {permissionGranted === null ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={{ fontSize: 40 }}>{isListening ? '🔴' : '🎤'}</Text>
                      <Text style={{ fontSize: 12, color: '#FFF', marginTop: 4, fontWeight: '600' }}>
                        {isListening
                          ? t('emergency.scenario.listening')
                          : t('emergency.scenario.holdToSpeak')}
                      </Text>
                    </>
                  )}
                </Pressable>

                {/* Fallback: I Said It */}
                <Pressable
                  onPress={() => { setSpeechValidated(true); setPhase('success'); }}
                  style={{ paddingVertical: 10, paddingHorizontal: 24 }}
                >
                  <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', textDecorationLine: 'underline' }}>
                    {t('emergency.scenario.iSaidIt')}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ─────────────────────────────────────────────
  // PHASE: SUCCESS
  // ─────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#1B5E20' }}>
      {/* Confetti */}
      <ConfettiCannon
        count={150}
        origin={{ x: width / 2, y: -20 }}
        autoStart
        fadeOut
        explosionSpeed={350}
        fallSpeed={2800}
        colors={['#FFD700', '#FF6B6B', '#4FC3F7', '#81C784', '#FFFFFF']}
      />

      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <StatusBar style="light" />

        <Animated.View
          style={{
            alignItems: 'center',
            transform: [{ scale: celebrationScale }],
          }}
        >
          {/* Hero emoji */}
          <Text style={{ fontSize: 96, marginBottom: 16 }}>🦸</Text>

          <Text
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#FFFFFF',
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            {t('emergency.scenario.successTitle')}
          </Text>

          <Text
            style={{
              fontSize: 18,
              color: 'rgba(255,255,255,0.85)',
              textAlign: 'center',
              lineHeight: 26,
              marginBottom: 40,
            }}
          >
            {t('emergency.scenario.successMessage')}
          </Text>

          {/* Reinforce what they did */}
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 16,
              padding: 20,
              width: '100%',
              marginBottom: 40,
            }}
          >
            <Text style={{ fontSize: 15, color: '#FFFFFF', textAlign: 'center', lineHeight: 22 }}>
              {t('emergency.scenario.successSteps')}
            </Text>
          </View>

          {/* Done button */}
          <Pressable
            onPress={() => router.replace('/emergency-scenarios')}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#FFB300' : '#FFD54F',
              borderRadius: 24,
              paddingVertical: 18,
              paddingHorizontal: 48,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1B5E20' }}>
              {t('emergency.scenario.tryAnother')} →
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
