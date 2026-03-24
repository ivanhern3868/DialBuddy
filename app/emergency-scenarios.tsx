/**
 * Emergency Scenarios Selection Screen
 *
 * Business Purpose:
 * Shows all five Phase 1 emergency scenarios as large, colorful cards.
 * Child (with parent) picks which situation to practice.
 *
 * Each card shows:
 * - Large emoji icon
 * - Scenario title
 * - Completion badge if the child has practiced this scenario
 *
 * Design for Ages 3-4:
 * - Large touch targets (full-width cards)
 * - Bold emoji icons (pre-readers navigate by pictures)
 * - Distinct colors per scenario (visual differentiation, not just text)
 */

import React from 'react';
import { View, Text, ScrollView, Pressable, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { EMERGENCY_SCENARIOS } from '../constants/emergencyScenarios';

export default function EmergencyScenariosScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/emergency');
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
              fontSize: 20,
              fontWeight: 'bold',
              color: '#B71C1C',
              marginRight: 40,
            }}
          >
            {t('emergency.scenarios.listTitle')}
          </Text>
        </View>

        {/* Instruction */}
        <Text
          style={{
            textAlign: 'center',
            fontSize: 15,
            color: '#555',
            paddingHorizontal: 24,
            marginBottom: 12,
          }}
        >
          {t('emergency.scenarios.listSubtitle')}
        </Text>

        {/* Scenario cards — 2-column grid */}
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: 32,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Group scenarios into rows of 2 */}
          {Array.from({ length: Math.ceil(EMERGENCY_SCENARIOS.length / 2) }, (_, rowIndex) => (
            <View key={rowIndex} style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              {EMERGENCY_SCENARIOS.slice(rowIndex * 2, rowIndex * 2 + 2).map((scenario) => (
                <Pressable
                  key={scenario.id}
                  onPress={() =>
                    router.push({
                      pathname: '/emergency-scenario',
                      params: { scenarioId: scenario.id },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={t(scenario.titleKey)}
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor: scenario.sceneColor,
                    borderRadius: 20,
                    paddingVertical: 24,
                    paddingHorizontal: 12,
                    alignItems: 'center',
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    elevation: 5,
                  })}
                >
                  {/* Large emoji */}
                  <Text style={{ fontSize: 52, marginBottom: 10 }}>{scenario.emoji}</Text>

                  {/* Title */}
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: 'bold',
                      color: '#FFFFFF',
                      textAlign: 'center',
                      marginBottom: 4,
                    }}
                  >
                    {t(scenario.titleKey)}
                  </Text>

                  {/* Teaser */}
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', textAlign: 'center' }}>
                    {t('emergency.scenarios.tapToPractice')}
                  </Text>
                </Pressable>
              ))}

              {/* Spacer cell if the last row has only 1 item */}
              {EMERGENCY_SCENARIOS.slice(rowIndex * 2, rowIndex * 2 + 2).length === 1 && (
                <View style={{ flex: 1 }} />
              )}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}
