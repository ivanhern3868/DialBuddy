/**
 * AppSettingsModal Component
 *
 * Business Purpose:
 * Modal dialog for managing all app-wide settings toggles in Parent Zone.
 * Consolidates sound effects, voice prompts, haptic feedback, and auto-difficulty
 * controls into a focused interface away from the main Parent Zone screen.
 *
 * Why This Matters:
 * - Reduces cognitive load on parents by grouping related settings
 * - Sheet-style modal feels native to iOS/Android (familiar UX pattern)
 * - Separates settings from contact/profile management
 * - Makes settings discoverable via prominent "App Settings" button
 *
 * Technical Implementation:
 * - Uses React Native Modal with 'slide' animation
 * - SafeAreaView prevents notch/status bar overlap
 * - Each toggle directly updates AppSettings via storage API
 * - Close button dismisses modal immediately
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppSettings } from '../../types';

/**
 * Session length options shown in the selector.
 *
 * Business Rule: 0 means "no limit" (Unlimited).
 * Values are in minutes. 15 is the expert-recommended default.
 * Why these values: 10/15/20/30 span beginner to confident learner sessions;
 * 0 = Unlimited is provided for parents who prefer not to enforce a hard limit.
 */
const SESSION_LENGTH_OPTIONS = [10, 15, 20, 30, 0] as const;

/**
 * Props for AppSettingsModal
 */
interface AppSettingsModalProps {
  /** Whether the modal is currently visible */
  visible: boolean;

  /** Callback to close the modal */
  onClose: () => void;

  /** Current app settings state */
  settings: AppSettings;

  /** Callback when sound effects toggle changes */
  onToggleSoundEffects: (enabled: boolean) => void;

  /** Callback when voice prompts toggle changes */
  onToggleVoicePrompts: (enabled: boolean) => void;

  /** Callback when vibration toggle changes */
  onToggleVibration: (enabled: boolean) => void;

  /** Callback when voice recognition toggle changes */
  onToggleVoiceRecognition: (enabled: boolean) => void;

  /** Callback when auto difficulty toggle changes */
  onToggleAutoDifficulty: (enabled: boolean) => void;

  /**
   * Callback when session length changes.
   * @param minutes - New limit in minutes; 0 means no limit (Unlimited).
   */
  onSessionLengthChange: (minutes: number) => void;
}

/**
 * AppSettingsModal Component
 *
 * Modal dialog containing all app-wide toggle settings.
 * Parents access this via "App Settings" button in Parent Zone.
 */
export default function AppSettingsModal({
  visible,
  onClose,
  settings,
  onToggleSoundEffects,
  onToggleVoicePrompts,
  onToggleVibration,
  onToggleVoiceRecognition,
  onToggleAutoDifficulty,
  onSessionLengthChange,
}: AppSettingsModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet" // iOS: Sheet-style presentation (bottom sheet)
      onRequestClose={onClose} // Android: Back button dismisses modal
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        {/* Header with title and close button */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#E0E0E0',
            backgroundColor: '#FFFFFF',
          }}
        >
          {/* Title */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#212121',
            }}
          >
            {t('parentZone.appSettings.title')}
          </Text>

          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: '#0288D1',
                fontWeight: '500',
              }}
            >
              {t('common.done')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable settings list */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
        >
          {/* Sound Effects Toggle */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#212121',
                    marginBottom: 4,
                  }}
                >
                  {t('parentZone.appSettings.soundEffects')}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: '#757575',
                    lineHeight: 20,
                  }}
                >
                  {t('parentZone.appSettings.soundEffectsDesc')}
                </Text>
              </View>

              <Switch
                value={settings.soundEffects}
                onValueChange={onToggleSoundEffects}
                trackColor={{ false: '#BDBDBD', true: '#4FC3F7' }}
                thumbColor={settings.soundEffects ? '#0288D1' : '#F5F5F5'}
              />
            </View>
          </View>

          {/* Voice Prompts Toggle */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#212121',
                    marginBottom: 4,
                  }}
                >
                  {t('parentZone.appSettings.voicePrompts')}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: '#757575',
                    lineHeight: 20,
                  }}
                >
                  {t('parentZone.appSettings.voicePromptsDesc')}
                </Text>
              </View>

              <Switch
                value={settings.voicePrompts}
                onValueChange={onToggleVoicePrompts}
                trackColor={{ false: '#BDBDBD', true: '#4FC3F7' }}
                thumbColor={settings.voicePrompts ? '#0288D1' : '#F5F5F5'}
              />
            </View>
          </View>

          {/* Vibration Toggle */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#212121',
                    marginBottom: 4,
                  }}
                >
                  {t('parentZone.appSettings.vibration')}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: '#757575',
                    lineHeight: 20,
                  }}
                >
                  {t('parentZone.appSettings.vibrationDesc')}
                </Text>
              </View>

              <Switch
                value={settings.vibration}
                onValueChange={onToggleVibration}
                trackColor={{ false: '#BDBDBD', true: '#4FC3F7' }}
                thumbColor={settings.vibration ? '#0288D1' : '#F5F5F5'}
              />
            </View>
          </View>

          {/* Voice Recognition Toggle */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#212121',
                    marginBottom: 4,
                  }}
                >
                  {t('parentZone.appSettings.voiceRecognition')}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: '#757575',
                    lineHeight: 20,
                  }}
                >
                  {t('parentZone.appSettings.voiceRecognitionDesc')}
                </Text>
              </View>

              <Switch
                value={settings.voiceRecognition}
                onValueChange={onToggleVoiceRecognition}
                trackColor={{ false: '#BDBDBD', true: '#4FC3F7' }}
                thumbColor={settings.voiceRecognition ? '#0288D1' : '#F5F5F5'}
              />
            </View>
          </View>

          {/* Auto Difficulty Toggle */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#212121',
                    marginBottom: 4,
                  }}
                >
                  {t('parentZone.appSettings.autoDifficulty')}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: '#757575',
                    lineHeight: 20,
                  }}
                >
                  {t('parentZone.appSettings.autoDifficultyDesc')}
                </Text>
              </View>

              <Switch
                value={settings.autoDifficultyProgress}
                onValueChange={onToggleAutoDifficulty}
                trackColor={{ false: '#BDBDBD', true: '#4FC3F7' }}
                thumbColor={settings.autoDifficultyProgress ? '#0288D1' : '#F5F5F5'}
              />
            </View>
          </View>

          {/* Session Length Selector
              Business Purpose: Let parents set how long a daily practice session runs
              before a break reminder appears. Supports WHO/AAP expert guidance on
              limiting toddler screen time to focused, time-boxed intervals.
              0 = no limit (parent opts out of the feature entirely). */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            {/* Label row */}
            <View style={{ marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#212121',
                  marginBottom: 4,
                }}
              >
                {t('parentZone.appSettings.sessionLength')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#757575',
                  lineHeight: 20,
                }}
              >
                {t('parentZone.appSettings.sessionLengthDesc')}
              </Text>
            </View>

            {/* Segmented button row: 10 min / 15 min / 20 min / 30 min / Off
                Why segmented buttons: Faster to tap than a number picker for parents
                who just want to tweak the default. Options cover beginner to advanced
                session lengths, plus Off for families who don't want a limit. */}
            <View
              style={{
                flexDirection: 'row',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              {SESSION_LENGTH_OPTIONS.map((option) => {
                // Determine if this button matches the current saved setting.
                // settings.sessionLength may not exist if loaded from old storage —
                // default to 15 in that case so UI still shows a selected state.
                const currentLength = (settings as any).sessionLength ?? 15;
                const isSelected = currentLength === option;

                return (
                  <Pressable
                    key={option}
                    onPress={() => onSessionLengthChange(option)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      // Highlighted in sky blue when selected; outlined-only when not
                      backgroundColor: isSelected ? '#E1F5FE' : '#FFFFFF',
                      borderColor: isSelected ? '#0288D1' : '#BDBDBD',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: isSelected ? '700' : '400',
                        color: isSelected ? '#0288D1' : '#757575',
                      }}
                    >
                      {option === 0
                        ? t('parentZone.appSettings.sessionLengthUnlimited')
                        : `${option} min`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Info text about settings */}
          <Text
            style={{
              fontSize: 13,
              color: '#9E9E9E',
              textAlign: 'center',
              marginTop: 8,
              lineHeight: 18,
            }}
          >
            {t('parentZone.appSettings.changesTakeEffect')}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
