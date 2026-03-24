/**
 * Child Profile Modal - Parent Zone
 *
 * Business Purpose:
 * Allows parents to create or update the active child's profile (name, age, avatar).
 * Phase 1 supports a single active profile at a time.
 *
 * Why Avatar Emojis (Not Camera):
 * - No camera permission required (reduces onboarding friction)
 * - Privacy-first: no photos stored on device
 * - Emojis are age-appropriate and immediately recognizable to children
 * - Camera support can be added in Phase 2
 *
 * Data Flow:
 * 1. On open: load active profile from SQLite (or show empty form if none)
 * 2. On save: create or update the profile in SQLite, set as active in AsyncStorage
 * 3. On close: parent-zone.tsx re-reads the active profile name for the hub header
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  getActiveProfile,
  createProfile,
  updateProfile,
  DEFAULT_PROFILE_ID,
} from '../../utils/storage/profiles';
import { storage } from '../../utils/storage/asyncStore';
import { ChildProfile } from '../../types';

/**
 * Avatar emoji grid options
 *
 * Business Rule: Gender-neutral first, specific options follow.
 * Toddlers identify with characters, not gender — neutrals first ensures
 * no child feels excluded by the default.
 */
const AVATAR_OPTIONS: string[] = [
  '🧒', '👦', '👧', '🧒‍♂️', '🧒‍♀️',
  '🐻', '🦊', '🐨', '🦁', '🐸',
  '🐱', '🐶', '🐼', '🦄', '🐙',
  '⭐', '🌈', '🚀', '🎈', '🏆',
];

/**
 * Age options (1–10)
 * Why 1-10: DialBuddy targets 3-4 but parents may set up for older siblings too
 */
const AGE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called after saving so parent-zone.tsx can refresh the displayed child name */
  onProfileSaved: (profile: ChildProfile) => void;
}

export default function ProfileModal({ visible, onClose, onProfileSaved }: ProfileModalProps) {
  const { t } = useTranslation();

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('🧒');

  // Existing profile (null if creating for the first time)
  const [existingProfile, setExistingProfile] = useState<ChildProfile | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  /**
   * Load the active profile when modal opens.
   * If no profile exists yet, form starts empty (create mode).
   */
  useEffect(() => {
    if (!visible) return;

    async function loadProfile() {
      setLoading(true);
      try {
        const profile = await getActiveProfile();
        setExistingProfile(profile);

        if (profile) {
          // Edit mode: pre-fill form with existing values
          setName(profile.name);
          setAge(profile.age);
          setSelectedAvatar(profile.avatar || '🧒');
        } else {
          // Create mode: reset to defaults
          setName('');
          setAge(null);
          setSelectedAvatar('🧒');
        }
      } catch (error) {
        console.error('[DialBuddy] Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [visible]);

  /**
   * Save the profile.
   *
   * Business Flow:
   * 1. Validate name (required)
   * 2. If existing profile: update it
   * 3. If no profile: create new one
   * 4. Set as active profile in AsyncStorage
   * 5. Call onProfileSaved so parent-zone.tsx refreshes
   */
  const handleSave = async () => {
    if (!name.trim()) {
      setNameError(t('parentZone.profile.nameRequired'));
      return;
    }

    setNameError('');
    setSaving(true);

    try {
      let savedProfile: ChildProfile | null;

      if (existingProfile) {
        // Update existing profile
        savedProfile = await updateProfile(existingProfile.id, {
          name: name.trim(),
          age,
          avatar: selectedAvatar,
        });
      } else {
        // Create new profile
        savedProfile = await createProfile(name.trim(), age, selectedAvatar);
      }

      if (!savedProfile) {
        console.error('[DialBuddy] Profile save returned null');
        return;
      }

      // Set as active profile so all practice screens use it
      await storage.setActiveProfileId(savedProfile.id);
      console.log('[DialBuddy] Active profile set to:', savedProfile.id);

      onProfileSaved(savedProfile);
      onClose();
    } catch (error) {
      console.error('[DialBuddy] Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Modal header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#E0E0E0',
            backgroundColor: '#FFFFFF',
          }}
        >
          <Pressable
            onPress={onClose}
            style={{ padding: 8, marginRight: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          >
            <Text style={{ fontSize: 16, color: '#666' }}>{t('common.cancel')}</Text>
          </Pressable>

          <Text style={{ flex: 1, fontSize: 18, fontWeight: 'bold', color: '#37474F', textAlign: 'center' }}>
            👶 {t('parentZone.profile.title')}
          </Text>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{ padding: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('common.done')}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#4FC3F7" />
            ) : (
              <Text style={{ fontSize: 16, color: '#4FC3F7', fontWeight: '600' }}>
                {t('common.done')}
              </Text>
            )}
          </Pressable>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#4FC3F7" />
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1, backgroundColor: '#F5F5F5' }}
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Selected avatar preview */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: '#E3F2FD',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: '#4FC3F7',
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 56 }}>{selectedAvatar}</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#888' }}>
                {t('parentZone.profile.chooseAvatar')}
              </Text>
            </View>

            {/* Avatar grid */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 24,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
              }}
            >
              {AVATAR_OPTIONS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => setSelectedAvatar(emoji)}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selectedAvatar === emoji ? '#E3F2FD' : '#F5F5F5',
                    borderWidth: 2,
                    borderColor: selectedAvatar === emoji ? '#4FC3F7' : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{emoji}</Text>
                </Pressable>
              ))}
            </View>

            {/* Name field (required) */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#37474F' }}>
                  {t('parentZone.profile.childName')}
                </Text>
                <Text style={{ fontSize: 16, color: '#E53935', marginLeft: 4 }}>*</Text>
              </View>

              <TextInput
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (text.trim()) setNameError('');
                }}
                placeholder={t('parentZone.profile.childNamePlaceholder')}
                placeholderTextColor="#BDBDBD"
                maxLength={30}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: nameError ? '#E53935' : '#E0E0E0',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 18,
                  color: '#37474F',
                }}
              />

              {nameError ? (
                <Text style={{ fontSize: 13, color: '#E53935', marginTop: 4 }}>{nameError}</Text>
              ) : null}
            </View>

            {/* Age picker */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#37474F', marginBottom: 8 }}>
                {t('parentZone.profile.age')}
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              >
                {/* "Not set" option */}
                <Pressable
                  onPress={() => setAge(null)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: age === null ? '#4FC3F7' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: age === null ? '#4FC3F7' : '#E0E0E0',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      color: age === null ? '#FFFFFF' : '#666',
                      fontWeight: age === null ? '600' : '400',
                    }}
                  >
                    —
                  </Text>
                </Pressable>

                {AGE_OPTIONS.map((ageOption) => (
                  <Pressable
                    key={ageOption}
                    onPress={() => setAge(ageOption)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor: age === ageOption ? '#4FC3F7' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: age === ageOption ? '#4FC3F7' : '#E0E0E0',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        color: age === ageOption ? '#FFFFFF' : '#666',
                        fontWeight: age === ageOption ? '600' : '400',
                      }}
                    >
                      {ageOption}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
