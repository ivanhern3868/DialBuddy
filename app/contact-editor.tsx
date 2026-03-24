/**
 * Contact Editor Screen - Add/Edit Contact
 *
 * Business Purpose:
 * Form for creating new contacts or editing existing ones.
 * Parents enter phone numbers their child will practice dialing.
 *
 * Validation:
 * - Phone number validated via libphonenumber-js
 * - Auto-formatting as user types
 * - Visual feedback (red border on invalid)
 * - Required fields: name, phone number
 *
 * Business Rules:
 * - Maximum 6 contacts (enforced at list level)
 * - Phone numbers must be valid for selected country
 * - Emergency toggle available (marks as 911/emergency contact)
 * - Avatar optional (defaults to first letter of name)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { parsePhoneNumber, AsYouType } from 'libphonenumber-js';
import { createContact, updateContact, getContactById } from '../utils/storage/contacts';

/**
 * Contact Editor Screen
 */
export default function ContactEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Edit mode if contactId provided
  const contactId = params.contactId as string | undefined;
  const isEditMode = !!contactId;

  // Form state
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  // Validation state
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // Loading state
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  /**
   * Load existing contact data in edit mode
   */
  useEffect(() => {
    if (contactId) {
      loadContact();
    }
  }, [contactId]);

  const loadContact = async () => {
    setInitialLoading(true);
    const contact = await getContactById(contactId!);

    if (contact) {
      setName(contact.name);
      setPhoneNumber(contact.formattedNumber);
      setRelationship(contact.relationship);
      setIsEmergency(contact.isEmergency);
      setAvatar(contact.avatar);
    } else {
      Alert.alert('Error', 'Contact not found');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }

    setInitialLoading(false);
  };

  /**
   * Handle phone number input
   * Auto-formats as user types using AsYouType
   */
  const handlePhoneChange = (text: string) => {
    // Use AsYouType for real-time formatting
    // Business Purpose: Shows user correct format as they type
    const formatter = new AsYouType('US');
    const formatted = formatter.input(text);

    setPhoneNumber(formatted);

    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError(null);
    }
  };

  /**
   * Validate phone number
   * Returns true if valid, false otherwise
   */
  const validatePhone = (): boolean => {
    if (!phoneNumber.trim()) {
      setPhoneError('Phone number is required');
      return false;
    }

    try {
      const parsed = parsePhoneNumber(phoneNumber, 'US');

      if (!parsed || !parsed.isValid()) {
        setPhoneError('Please enter a valid phone number');
        return false;
      }

      setPhoneError(null);
      return true;
    } catch (error) {
      setPhoneError('Please enter a valid phone number');
      return false;
    }
  };

  /**
   * Validate name
   */
  const validateName = (): boolean => {
    if (!name.trim()) {
      setNameError('Name is required');
      return false;
    }

    setNameError(null);
    return true;
  };

  /**
   * Handle photo picker
   * Platform Check: expo-image-picker only works on native (iOS/Android)
   */
  const handlePickPhoto = async () => {
    // Web platform check - photo picker not available
    // Why: expo-image-picker requires native file system access
    // Alternative for web: Could use <input type="file"> but out of scope for Phase 1
    if (Platform.OS === 'web') {
      Alert.alert(
        'Photo Picker Unavailable',
        'Photo selection is only available on mobile devices. You can still add contacts without photos.'
      );
      return;
    }

    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to photos to set a contact avatar.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Compress for storage
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('[DialBuddy] Photo picker error:', error);
      Alert.alert('Error', 'Failed to pick photo');
    }
  };

  /**
   * Handle remove photo
   */
  const handleRemovePhoto = () => {
    setAvatar(null);
  };

  /**
   * Handle save
   */
  const handleSave = async () => {
    // Validate all fields
    const isNameValid = validateName();
    const isPhoneValid = validatePhone();

    if (!isNameValid || !isPhoneValid) {
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        // Update existing contact
        const updated = await updateContact(
          contactId!,
          {
            name: name.trim(),
            phoneNumber,
            relationship: relationship.trim() || 'Contact',
            isEmergency,
            avatar,
          },
          'US'
        );

        if (updated) {
          if (router.canGoBack()) { router.back(); } else { router.replace('/'); }
        } else {
          Alert.alert('Error', 'Failed to update contact');
        }
      } else {
        // Create new contact
        const created = await createContact(
          {
            name: name.trim(),
            phoneNumber,
            relationship: relationship.trim() || 'Contact',
            isEmergency,
            avatar,
          },
          'US'
        );

        if (created) {
          if (router.canGoBack()) { router.back(); } else { router.replace('/'); }
        } else {
          Alert.alert('Error', 'Failed to create contact. Please check phone number.');
        }
      }
    } catch (error) {
      console.error('[DialBuddy] Save contact error:', error);
      Alert.alert('Error', 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    if (router.canGoBack()) { router.back(); } else { router.replace('/'); }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#999' }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E0E0E0',
        }}
      >
        <Pressable onPress={handleCancel} style={{ padding: 8, marginRight: 12 }}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </Pressable>

        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#37474F', flex: 1 }}>
          {isEditMode ? 'Edit Contact' : 'New Contact'}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Avatar Picker */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          {avatar ? (
            <Pressable onPress={handlePickPhoto}>
              <Image
                source={{ uri: avatar }}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  borderWidth: 4,
                  borderColor: '#4FC3F7',
                }}
              />
            </Pressable>
          ) : (
            <Pressable
              onPress={handlePickPhoto}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: '#4FC3F7',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 4,
                borderColor: '#4FC3F7',
              }}
            >
              {name ? (
                <Text style={{ fontSize: 48, color: '#FFFFFF', fontWeight: 'bold' }}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              ) : (
                <Text style={{ fontSize: 48 }}>📷</Text>
              )}
            </Pressable>
          )}

          <View style={{ flexDirection: 'row', marginTop: 12, gap: 12 }}>
            <Pressable
              onPress={handlePickPhoto}
              style={{
                backgroundColor: '#4FC3F7',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                {avatar ? 'Change Photo' : 'Add Photo'}
              </Text>
            </Pressable>

            {avatar && (
              <Pressable
                onPress={handleRemovePhoto}
                style={{
                  backgroundColor: '#F5F5F5',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: '#666', fontWeight: '600' }}>Remove</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Name Field */}
        <FormField
          label="Name *"
          placeholder="Mom, Dad, Grandma, etc."
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (nameError) setNameError(null);
          }}
          error={nameError}
        />

        {/* Phone Number Field */}
        <FormField
          label="Phone Number *"
          placeholder="(202) 555-1234"
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          error={phoneError}
          onBlur={validatePhone}
        />

        {/* Relationship Field */}
        <FormField
          label="Relationship"
          placeholder="Mom, Dad, Grandma, etc."
          value={relationship}
          onChangeText={setRelationship}
        />

        {/* Emergency Toggle */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#37474F', marginBottom: 4 }}>
              Emergency Contact
            </Text>
            <Text style={{ fontSize: 14, color: '#666' }}>
              Mark as emergency number (911, poison control, etc.)
            </Text>
          </View>

          <Switch
            value={isEmergency}
            onValueChange={setIsEmergency}
            trackColor={{ false: '#E0E0E0', true: '#FF8A80' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Helper Text */}
        <View
          style={{
            backgroundColor: '#E3F2FD',
            borderRadius: 8,
            padding: 12,
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 12, color: '#1976D2', lineHeight: 18 }}>
            💡 Tip: Add a photo so your child can recognize who they're calling!
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={{
          padding: 16,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          flexDirection: 'row',
          gap: 12,
        }}
      >
        <Pressable
          onPress={handleCancel}
          style={{
            flex: 1,
            backgroundColor: '#F5F5F5',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#666' }}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={handleSave}
          disabled={loading}
          style={{
            flex: 1,
            backgroundColor: loading ? '#CCC' : '#4FC3F7',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' }}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/**
 * Form Field Component
 */
function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  error,
  onBlur,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  error?: string | null;
  onBlur?: () => void;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#37474F', marginBottom: 8 }}>
        {label}
      </Text>

      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        onBlur={onBlur}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: 16,
          fontSize: 16,
          color: '#37474F',
          borderWidth: 2,
          borderColor: error ? '#FF8A80' : '#E0E0E0',
        }}
        placeholderTextColor="#999"
      />

      {error && (
        <Text style={{ fontSize: 12, color: '#FF8A80', marginTop: 4, marginLeft: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
