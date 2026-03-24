/**
 * Web stub for progress.ts
 *
 * Why this file exists:
 * progress.ts has `import * as SQLite from 'expo-sqlite'` which breaks
 * web/Netlify builds. This stub provides the same exports as no-ops
 * so the app compiles and runs on web without SQLite.
 */

import { Progress } from '../../types';

const DEFAULT_PROGRESS = (profileId: string, contactId: string): Progress => ({
  profileId,
  contactId,
  totalAttempts: 0,
  successfulDials: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPracticed: null,
  masteryLevel: 0,
  difficultyLevel: 'beginner',
  hintsUsed: 0,
  simonSaysBest: 0,
});

export async function getProgress(
  profileId: string,
  contactId: string
): Promise<Progress | null> {
  return null;
}

export async function initializeProgress(
  profileId: string,
  contactId: string
): Promise<Progress> {
  return DEFAULT_PROGRESS(profileId, contactId);
}

export async function recordAttempt(
  _profileId: string,
  _contactId: string,
  _isCorrect: boolean,
  _hintsUsed: number = 0
): Promise<Progress | null> {
  return null;
}

export async function getAllProgressForProfile(_profileId: string): Promise<Progress[]> {
  return [];
}

export async function updateSimonSaysBest(
  _profileId: string,
  _contactId: string,
  _score: number
): Promise<void> {
  // Web: no-op
}
