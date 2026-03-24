/**
 * LearningPreferencesModal Component
 *
 * Business Purpose:
 * Modal dialog for configuring learning difficulty level in Parent Zone.
 * Allows parents to manually set Easy/Medium/Hard difficulty, which controls
 * how much visual assistance children receive during practice sessions.
 *
 * Why This Matters:
 * - Tailors practice difficulty to child's skill level
 * - Parents can override auto-difficulty to prevent frustration or boredom
 * - Clear explanations help parents choose appropriate difficulty
 * - Separates learning preferences from app settings (logical grouping)
 *
 * Technical Implementation:
 * - Uses React Native Modal with 'slide' animation
 * - Radio button style selection (only one difficulty active at a time)
 * - Visual feedback for selected difficulty level
 * - Detailed descriptions help parents make informed choice
 *
 * Difficulty Level Definitions:
 * - Easy: Full guidance (all digits highlighted, visual hints)
 * - Medium: Partial guidance (current digit highlighted, reduced hints)
 * - Hard: Minimal guidance (no highlights, child recalls independently)
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { DifficultyLevel } from '../../types';

/**
 * Props for LearningPreferencesModal
 */
interface LearningPreferencesModalProps {
  /** Whether the modal is currently visible */
  visible: boolean;

  /** Callback to close the modal */
  onClose: () => void;

  /** Current difficulty level */
  currentDifficulty: DifficultyLevel;

  /** Callback when difficulty level changes */
  onChangeDifficulty: (difficulty: DifficultyLevel) => void;
}

/**
 * Difficulty level option metadata
 * Business Rule: Explicit descriptions help parents choose appropriate level
 */
interface DifficultyOption {
  /** Difficulty level value */
  level: DifficultyLevel;

  /** Display label */
  label: string;

  /** Icon/emoji for visual identification */
  icon: string;

  /** Detailed description of this difficulty level */
  description: string;

  /** Color theme for this difficulty */
  color: string;
}

/**
 * Get difficulty options with translations
 * Business Rule: Explicit descriptions help parents choose appropriate level
 * Why function: Allows access to translation function within component
 */
const getDifficultyOptions = (t: any): DifficultyOption[] => [
  {
    level: 'beginner',
    label: t('parentZone.learningPreferences.easy'),
    icon: '🌟',
    description: t('parentZone.learningPreferences.easyDesc'),
    color: '#66BB6A', // Green - positive, encouraging
  },
  {
    level: 'intermediate',
    label: t('parentZone.learningPreferences.medium'),
    icon: '⭐',
    description: t('parentZone.learningPreferences.mediumDesc'),
    color: '#FFA726', // Orange - moderate challenge
  },
  {
    level: 'advanced',
    label: t('parentZone.learningPreferences.hard'),
    icon: '💪',
    description: t('parentZone.learningPreferences.hardDesc'),
    color: '#EF5350', // Red - challenging
  },
];

/**
 * LearningPreferencesModal Component
 *
 * Modal dialog for selecting practice difficulty level.
 * Parents access this via "Learning Preferences" button in Parent Zone.
 */
export default function LearningPreferencesModal({
  visible,
  onClose,
  currentDifficulty,
  onChangeDifficulty,
}: LearningPreferencesModalProps) {
  const { t } = useTranslation();

  /**
   * Handle difficulty selection
   * Business Rule: Immediately update difficulty and persist to storage
   */
  const handleSelectDifficulty = (difficulty: DifficultyLevel) => {
    onChangeDifficulty(difficulty);
  };

  // Get difficulty options with current translations
  const difficultyOptions = getDifficultyOptions(t);

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
            {t('parentZone.learningPreferences.title')}
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

        {/* Scrollable difficulty options */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
        >
          {/* Section title */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#424242',
              marginBottom: 12,
            }}
          >
            {t('parentZone.learningPreferences.difficultyLevel')}
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: '#757575',
              marginBottom: 20,
              lineHeight: 20,
            }}
          >
            {t('parentZone.learningPreferences.chooseGuidance')}
          </Text>

          {/* Difficulty option cards */}
          {difficultyOptions.map((option) => {
            const isSelected = currentDifficulty === option.level;

            return (
              <TouchableOpacity
                key={option.level}
                onPress={() => handleSelectDifficulty(option.level)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 3,
                  borderColor: isSelected ? option.color : '#E0E0E0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isSelected ? 0.2 : 0.1,
                  shadowRadius: isSelected ? 8 : 4,
                  elevation: isSelected ? 6 : 3,
                }}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  {/* Icon */}
                  <Text style={{ fontSize: 28, marginRight: 12 }}>
                    {option.icon}
                  </Text>

                  {/* Label */}
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: isSelected ? option.color : '#424242',
                      flex: 1,
                    }}
                  >
                    {option.label}
                  </Text>

                  {/* Selection indicator */}
                  {isSelected && (
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: option.color,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 16 }}>✓</Text>
                    </View>
                  )}
                </View>

                {/* Description */}
                <Text
                  style={{
                    fontSize: 14,
                    color: '#616161',
                    lineHeight: 20,
                  }}
                >
                  {option.description}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Info text about auto-difficulty */}
          <View
            style={{
              backgroundColor: '#E3F2FD',
              borderRadius: 8,
              padding: 16,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: '#0277BD',
                lineHeight: 20,
              }}
            >
              💡 {t('parentZone.learningPreferences.autoTip')}
            </Text>
          </View>

          {/* Bottom padding for scroll comfort */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
