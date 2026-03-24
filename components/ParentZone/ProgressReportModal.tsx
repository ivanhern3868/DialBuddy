/**
 * Progress Report Modal - Parent Zone
 *
 * Business Purpose:
 * Read-only summary of the child's practice history for each contact.
 * Shows mastery level, session count, current streak, and last practiced date.
 * Helps parents understand what their child has learned and what needs more work.
 *
 * Phase 1 scope: Read-only. No charts, no weekly email (Phase 3).
 *
 * Data Sources:
 * - SQLite `progress` table via getAllProgressForProfile()
 * - SQLite `contacts` table via getAllContacts()
 * - AsyncStorage active profile ID via storage.getActiveProfileId()
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getAllProgressForProfile } from '../../utils/storage/progress';
import { getAllContacts } from '../../utils/storage/contacts';
import { storage } from '../../utils/storage/asyncStore';
import { DEFAULT_PROFILE_ID } from '../../utils/storage/profiles';
import { Contact, Progress } from '../../types';

interface ProgressReportModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Contact progress entry — combines a Contact with its Progress record
 */
interface ContactProgressEntry {
  contact: Contact;
  progress: Progress | null;
}

export default function ProgressReportModal({ visible, onClose }: ProgressReportModalProps) {
  const { t } = useTranslation();

  const [entries, setEntries] = useState<ContactProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Load contacts and their progress records when the modal opens.
   *
   * Strategy:
   * 1. Get active profile ID from AsyncStorage
   * 2. Load all contacts from SQLite
   * 3. Load all progress records for that profile
   * 4. Merge: match each contact to its progress (null if never practiced)
   * 5. Sort by mastery descending (most practiced first)
   */
  useEffect(() => {
    if (!visible) return;

    async function loadProgressData() {
      setLoading(true);
      try {
        const profileId = (await storage.getActiveProfileId()) || DEFAULT_PROFILE_ID;

        // Load contacts and progress in parallel — no data dependency
        const [contacts, progressRecords] = await Promise.all([
          getAllContacts(),
          getAllProgressForProfile(profileId),
        ]);

        // Build progress lookup map by contactId for O(1) access
        const progressMap = new Map<string, Progress>();
        for (const p of progressRecords) {
          progressMap.set(p.contactId, p);
        }

        // Merge contacts with their progress
        const merged: ContactProgressEntry[] = contacts.map((contact) => ({
          contact,
          progress: progressMap.get(contact.id) ?? null,
        }));

        // Sort: practiced contacts (non-null progress) first, highest mastery first
        merged.sort((a, b) => {
          if (!a.progress && !b.progress) return 0;
          if (!a.progress) return 1;  // Unpracticed contacts go to the bottom
          if (!b.progress) return -1;
          return b.progress.masteryLevel - a.progress.masteryLevel;
        });

        setEntries(merged);
      } catch (error) {
        console.error('[DialBuddy] Failed to load progress report:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProgressData();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
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
        <Text style={{ flex: 1, fontSize: 18, fontWeight: 'bold', color: '#37474F', textAlign: 'center' }}>
          📊 {t('parentZone.progressReport.title')}
        </Text>

        <Pressable
          onPress={onClose}
          style={{ padding: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('common.done')}
        >
          <Text style={{ fontSize: 16, color: '#4FC3F7', fontWeight: '600' }}>
            {t('common.done')}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' }}>
          <ActivityIndicator size="large" color="#4FC3F7" />
        </View>
      ) : entries.length === 0 ? (
        // Empty state — no contacts added yet
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#37474F', textAlign: 'center', marginBottom: 8 }}>
            {t('parentZone.progressReport.noProgress')}
          </Text>
          <Text style={{ fontSize: 15, color: '#888', textAlign: 'center' }}>
            {t('parentZone.progressReport.noProgressSub')}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1, backgroundColor: '#F5F5F5' }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {entries.map(({ contact, progress }) => (
            <ContactProgressCard
              key={contact.id}
              contact={contact}
              progress={progress}
            />
          ))}
        </ScrollView>
      )}
    </Modal>
  );
}

/**
 * Single contact progress card
 *
 * Business Purpose: Parents see at a glance how much their child has practiced
 * each contact. Color-coded mastery bar (red→yellow→green) gives instant insight.
 */
function ContactProgressCard({
  contact,
  progress,
}: {
  contact: Contact;
  progress: Progress | null;
}) {
  const { t } = useTranslation();

  /**
   * Format the lastPracticed ISO date as a human-readable relative string.
   * "Today", "Yesterday", or "X days ago".
   */
  const formatLastPracticed = (isoDate: string | null): string => {
    if (!isoDate) return t('parentZone.progressReport.never');

    const daysDiff = Math.floor(
      (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) return t('parentZone.progressReport.today');
    if (daysDiff === 1) return t('parentZone.progressReport.yesterday');
    return t('parentZone.progressReport.daysAgo', { count: daysDiff });
  };

  /**
   * Map mastery level (0-100) to a color for the progress bar.
   * Red (0-40) → Yellow (40-70) → Green (70-100)
   * Why three zones: Beginner, Learning, Mastered — matches educational research thresholds.
   */
  const getMasteryColor = (mastery: number): string => {
    if (mastery >= 70) return '#4CAF50'; // Green = mastered
    if (mastery >= 40) return '#FFC107'; // Yellow = learning
    return '#F44336';                     // Red = just starting
  };

  const mastery = progress?.masteryLevel ?? 0;
  const masteryColor = getMasteryColor(mastery);

  const difficultyLabel: Record<string, string> = {
    beginner: t('parentZone.progressReport.beginner'),
    intermediate: t('parentZone.progressReport.intermediate'),
    advanced: t('parentZone.progressReport.advanced'),
  };

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Contact name row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 36, marginRight: 12 }}>
          {contact.avatar || '👤'}
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#37474F' }}>
            {contact.name}
          </Text>
          <Text style={{ fontSize: 13, color: '#888' }}>
            {contact.formattedNumber}
          </Text>
        </View>
        {contact.isEmergency && (
          <View
            style={{
              backgroundColor: '#FFEBEE',
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 12, color: '#C62828', fontWeight: '600' }}>🚨</Text>
          </View>
        )}
      </View>

      {/* Mastery bar */}
      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 13, color: '#666' }}>
            {t('parentZone.progressReport.mastery')}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: masteryColor }}>
            {mastery}%
            {progress && (
              <Text style={{ fontSize: 11, color: '#999', fontWeight: '400' }}>
                {' '}({difficultyLabel[progress.difficultyLevel] || progress.difficultyLevel})
              </Text>
            )}
          </Text>
        </View>

        {/* Background track */}
        <View
          style={{
            height: 8,
            backgroundColor: '#F0F0F0',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          {/* Filled portion */}
          <View
            style={{
              height: '100%',
              width: `${mastery}%`,
              backgroundColor: masteryColor,
              borderRadius: 4,
            }}
          />
        </View>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <StatChip
          label={t('parentZone.progressReport.sessions')}
          value={String(progress?.totalAttempts ?? 0)}
        />
        <StatChip
          label={t('parentZone.progressReport.streak')}
          value={`${progress?.currentStreak ?? 0} 🔥`}
        />
        <StatChip
          label={t('parentZone.progressReport.lastPracticed')}
          value={formatLastPracticed(progress?.lastPracticed ?? null)}
        />
      </View>
    </View>
  );
}

/**
 * Small stat chip — label above, value below
 */
function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#37474F' }}>{value}</Text>
    </View>
  );
}
