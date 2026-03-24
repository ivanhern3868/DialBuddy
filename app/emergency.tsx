/**
 * Emergency Mode Hub Screen
 *
 * Business Purpose:
 * Entry point for all emergency preparedness learning.
 * Phase 1 scope: two activities — practice dialing the emergency number,
 * and learning when to call.
 *
 * Phase 2 will expand this into scenario cards, dispatcher simulation,
 * and post-call lessons (see ROADMAP.md).
 *
 * Design for Ages 3-4:
 * - Two large, clearly labeled buttons
 * - Emergency red theme (children associate red with urgency)
 * - Simple back navigation
 */

import React from 'react';
import { View, Text, Pressable, ImageBackground, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

export default function EmergencyScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  /**
   * Navigate back to home (with guard for dev root-screen scenario)
   */
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/bg.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style="dark" />

        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            style={{
              padding: 8,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
            }}
          >
            <Text style={{ fontSize: 24 }}>←</Text>
          </Pressable>

          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 22,
              fontWeight: 'bold',
              color: '#B71C1C',
              marginRight: 40, // Balance the back button width
            }}
          >
            {t('emergency.hub.title')}
          </Text>
        </View>


        {/* HelpBuddy mascot */}
        <View style={{ alignItems: 'center', marginBottom: -100 }}>
          <Image
            source={require('../assets/images/HelpBuddy.png')}
            style={{ width: 180, height: 180 }}
            resizeMode="contain"
          />
        </View>

        {/* Activity buttons — 2-column grid */}
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              gap: 16,
            }}
          >
            {/* Dial the emergency number */}
            <Pressable
              onPress={() => router.push('/emergency-dial')}
              accessibilityRole="button"
              accessibilityLabel={t('emergency.hub.dialButton')}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? '#C62828' : '#E53935',
                borderRadius: 24,
                paddingVertical: 28,
                paddingHorizontal: 12,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 6,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <Text style={{ fontSize: 48 }}>📞</Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  marginTop: 10,
                  textAlign: 'center',
                }}
              >
                {t('emergency.hub.dialButton')}
              </Text>
              <Text style={{ fontSize: 12, color: '#FFCDD2', marginTop: 4, textAlign: 'center' }}>
                {t('emergency.hub.dialDesc')}
              </Text>
            </Pressable>

            {/* Practice scenarios */}
            <Pressable
              onPress={() => router.push('/emergency-scenarios')}
              accessibilityRole="button"
              accessibilityLabel={t('emergency.scenarios.scenariosButton')}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? '#2E7D32' : '#388E3C',
                borderRadius: 24,
                paddingVertical: 28,
                paddingHorizontal: 12,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 6,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <Text style={{ fontSize: 48 }}>🎭</Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#FFFFFF',
                  marginTop: 10,
                  textAlign: 'center',
                }}
              >
                {t('emergency.scenarios.scenariosButton')}
              </Text>
              <Text style={{ fontSize: 12, color: '#C8E6C9', marginTop: 4, textAlign: 'center' }}>
                {t('emergency.scenarios.scenariosDesc')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Safety note at bottom */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <View
            style={{
              backgroundColor: '#FFF9C4',
              borderRadius: 12,
              padding: 12,
              borderLeftWidth: 4,
              borderLeftColor: '#F9A825',
            }}
          >
            <Text style={{ fontSize: 13, color: '#555', textAlign: 'center' }}>
              {t('emergency.hub.safetyNote')}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
