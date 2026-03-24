/**
 * Emergency Info Modal - Parent Zone
 *
 * Business Purpose:
 * Allows parents to enter their home address and emergency meeting spot.
 * This data is stored locally and will be used in Phase 2's dispatcher
 * simulation so the child can practice reciting their address to helpers.
 *
 * Phase 1 scope: Data entry + local storage only. No in-practice integration yet.
 *
 * Fields:
 * - Street Address (required) — "123 Main Street"
 * - City / State (optional) — "Austin, TX"
 * - Fire Meeting Spot (optional) — "Big oak tree in front yard"
 * - Other Info (optional) — allergies, medical conditions, second parent contact
 *
 * COPPA Compliance:
 * All data stored locally in AsyncStorage. Never transmitted off device.
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
import { storage, getStorageItem, setStorageItem } from '../../utils/storage/asyncStore';

/** AsyncStorage key for city/state field (not in storage object yet — added locally here) */
const CITY_STATE_KEY = '@dialbuddy/city_state';

interface EmergencyInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function EmergencyInfoModal({ visible, onClose }: EmergencyInfoModalProps) {
  const { t } = useTranslation();

  // Form field state — each field maps to one AsyncStorage key
  const [streetAddress, setStreetAddress] = useState('');
  const [cityState, setCityState] = useState('');
  const [fireMeetingSpot, setFireMeetingSpot] = useState('');
  const [otherInfo, setOtherInfo] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [streetAddressError, setStreetAddressError] = useState('');

  /**
   * Load saved values from AsyncStorage when the modal opens.
   *
   * Why on `visible` change: Modal may be re-opened after edits elsewhere.
   * Re-loading on open ensures we always show the latest saved state.
   */
  useEffect(() => {
    if (!visible) return;

    async function loadSavedInfo() {
      setLoading(true);
      try {
        // Load all four fields in parallel — no data dependency between them
        const [savedAddress, savedCity, savedSpot, savedOther] = await Promise.all([
          storage.getHomeAddress(),
          getStorageItem<string>(CITY_STATE_KEY),
          storage.getFireMeetingSpot(),
          storage.getEmergencyOtherInfo(),
        ]);

        setStreetAddress(savedAddress || '');
        setCityState(savedCity || '');
        setFireMeetingSpot(savedSpot || '');
        setOtherInfo(savedOther || '');
      } catch (error) {
        console.error('[DialBuddy] Failed to load emergency info:', error);
        // Non-fatal: form just starts empty
      } finally {
        setLoading(false);
      }
    }

    loadSavedInfo();
  }, [visible]);

  /**
   * Validate and save all fields to AsyncStorage.
   *
   * Business Rule: Street address is required (dispatcher must know where to send help).
   * All other fields are optional but encouraged.
   */
  const handleSave = async () => {
    // Validate required field
    if (!streetAddress.trim()) {
      setStreetAddressError(t('parentZone.emergencyInfo.addressRequired'));
      return;
    }

    setStreetAddressError('');
    setSaving(true);

    try {
      // Save all fields in parallel — independent writes
      await Promise.all([
        storage.setHomeAddress(streetAddress.trim()),
        setStorageItem(CITY_STATE_KEY, cityState.trim()),
        storage.setFireMeetingSpot(fireMeetingSpot.trim()),
        storage.setEmergencyOtherInfo(otherInfo.trim()),
      ]);

      console.log('[DialBuddy] Emergency info saved successfully');
      onClose();
    } catch (error) {
      console.error('[DialBuddy] Failed to save emergency info:', error);
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
            🏠 {t('parentZone.emergencyInfo.title')}
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
            {/* Why this matters */}
            <View
              style={{
                backgroundColor: '#E3F2FD',
                borderRadius: 12,
                padding: 14,
                marginBottom: 20,
                borderLeftWidth: 4,
                borderLeftColor: '#1976D2',
              }}
            >
              <Text style={{ fontSize: 14, color: '#1565C0', lineHeight: 20 }}>
                {t('parentZone.emergencyInfo.whyThisMatters')}
              </Text>
            </View>

            {/* Street Address (required) */}
            <FormField
              label={t('parentZone.emergencyInfo.streetAddress')}
              hint={t('parentZone.emergencyInfo.streetAddressHint')}
              value={streetAddress}
              onChangeText={(text) => {
                setStreetAddress(text);
                if (text.trim()) setStreetAddressError('');
              }}
              placeholder={t('parentZone.emergencyInfo.streetAddressPlaceholder')}
              error={streetAddressError}
              required
            />

            {/* City / State */}
            <FormField
              label={t('parentZone.emergencyInfo.cityState')}
              hint={t('parentZone.emergencyInfo.cityStateHint')}
              value={cityState}
              onChangeText={setCityState}
              placeholder={t('parentZone.emergencyInfo.cityStatePlaceholder')}
            />

            {/* Fire Meeting Spot */}
            <FormField
              label={t('parentZone.emergencyInfo.fireMeetingSpot')}
              hint={t('parentZone.emergencyInfo.fireMeetingSpotHint')}
              value={fireMeetingSpot}
              onChangeText={setFireMeetingSpot}
              placeholder={t('parentZone.emergencyInfo.fireMeetingSpotPlaceholder')}
            />

            {/* Other Info */}
            <FormField
              label={t('parentZone.emergencyInfo.otherInfo')}
              hint={t('parentZone.emergencyInfo.otherInfoHint')}
              value={otherInfo}
              onChangeText={setOtherInfo}
              placeholder={t('parentZone.emergencyInfo.otherInfoPlaceholder')}
              multiline
            />

            {/* Privacy note */}
            <Text
              style={{
                fontSize: 12,
                color: '#999',
                textAlign: 'center',
                marginTop: 8,
                marginBottom: 24,
              }}
            >
              {t('parentZone.emergencyInfo.privacyNote')}
            </Text>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * Reusable labeled form field
 *
 * Business Purpose: Consistent form field styling across the modal.
 * Required fields show a red asterisk and validation error below the input.
 */
function FormField({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  multiline = false,
}: {
  label: string;
  hint: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      {/* Label row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#37474F' }}>{label}</Text>
        {required && (
          <Text style={{ fontSize: 16, color: '#E53935', marginLeft: 4 }}>*</Text>
        )}
      </View>

      {/* Hint text */}
      <Text style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{hint}</Text>

      {/* Input */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#BDBDBD"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: error ? '#E53935' : '#E0E0E0',
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 16,
          color: '#37474F',
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />

      {/* Validation error */}
      {error ? (
        <Text style={{ fontSize: 13, color: '#E53935', marginTop: 4 }}>{error}</Text>
      ) : null}
    </View>
  );
}
