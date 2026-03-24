/**
 * Progress Tracking Database Functions
 *
 * Business Purpose:
 * Tracks child's learning progress for each contact's phone number.
 * Calculates mastery level (0-100%) and auto-advances difficulty.
 *
 * Business Rules:
 * - Mastery calculated from success rate + streak + recency
 * - Auto-advance to next difficulty at 80% mastery
 * - Reset streak on failed attempt
 * - Track hints used (impacts mastery calculation)
 *
 * Learning Algorithm:
 * - Beginner: One digit at a time (highlighted)
 * - Intermediate: Digit groups (e.g., 202, 555, 1234)
 * - Advanced: Full number from photo only
 *
 * Why This Matters:
 * - Adaptive difficulty keeps children engaged (not too easy, not too hard)
 * - Progress tracking shows parents child is learning
 * - Mastery calculation is scientifically grounded (spaced repetition principles)
 */

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { Progress, DifficultyLevel } from '../../types';

// Platform check: Only initialize database on native platforms
// Why: expo-sqlite requires native SQLite, web uses different implementation
// Web users get null progress (UI demo only, no persistence)
const db = Platform.OS !== 'web' ? SQLite.openDatabaseSync('dialbuddy.db') : null;

/**
 * Get progress for a specific child and contact
 *
 * @param profileId - Child profile ID
 * @param contactId - Contact ID
 * @returns Progress record or null if not exists
 */
export async function getProgress(
  profileId: string,
  contactId: string
): Promise<Progress | null> {
  // Web platform check - return null (no database on web)
  if (!db) return null;

  try {
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM progress WHERE profile_id = ? AND contact_id = ?',
      [profileId, contactId]
    );

    if (!row) return null;

    return {
      profileId: row.profile_id,
      contactId: row.contact_id,
      totalAttempts: row.total_attempts,
      successfulDials: row.successful_dials,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      lastPracticed: row.last_practiced,
      masteryLevel: row.mastery_level,
      difficultyLevel: row.difficulty_level as DifficultyLevel,
      hintsUsed: row.hints_used,
      simonSaysBest: row.simon_says_best,
    };
  } catch (error) {
    console.error('[DialBuddy] Failed to get progress:', error);
    return null;
  }
}

/**
 * Initialize progress for a new profile-contact pair
 *
 * @param profileId - Child profile ID
 * @param contactId - Contact ID
 * @returns Created progress record
 */
export async function initializeProgress(
  profileId: string,
  contactId: string
): Promise<Progress> {
  // Web platform check - return default progress (no database on web)
  if (!db) {
    return {
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
    };
  }

  try {
    await db.runAsync(
      `INSERT OR IGNORE INTO progress (
        profile_id, contact_id, total_attempts, successful_dials,
        current_streak, longest_streak, last_practiced, mastery_level,
        difficulty_level, hints_used, simon_says_best
      ) VALUES (?, ?, 0, 0, 0, 0, NULL, 0, 'beginner', 0, 0)`,
      [profileId, contactId]
    );

    return {
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
    };
  } catch (error) {
    console.error('[DialBuddy] Failed to initialize progress:', error);
    throw error;
  }
}

/**
 * Record a practice attempt
 *
 * Business Flow:
 * 1. Increment total attempts
 * 2. If correct: increment successful dials, update streak
 * 3. If incorrect: reset streak
 * 4. Recalculate mastery level
 * 5. Check if should advance difficulty
 * 6. Update last practiced timestamp
 *
 * @param profileId - Child profile ID
 * @param contactId - Contact ID
 * @param isCorrect - Whether the dial was successful
 * @param hintsUsed - Number of hints used this attempt (impacts mastery)
 * @returns Updated progress
 */
export async function recordAttempt(
  profileId: string,
  contactId: string,
  isCorrect: boolean,
  hintsUsed: number = 0
): Promise<Progress | null> {
  // Web platform check - return null (no database on web)
  if (!db) return null;

  try {
    // Get or create progress record
    let progress = await getProgress(profileId, contactId);

    if (!progress) {
      progress = await initializeProgress(profileId, contactId);
    }

    // Update attempt counts
    const totalAttempts = progress.totalAttempts + 1;
    const successfulDials = isCorrect ? progress.successfulDials + 1 : progress.successfulDials;

    // Update streak
    let currentStreak: number;
    let longestStreak: number;

    if (isCorrect) {
      currentStreak = progress.currentStreak + 1;
      longestStreak = Math.max(currentStreak, progress.longestStreak);
    } else {
      currentStreak = 0; // Reset streak on failure
      longestStreak = progress.longestStreak;
    }

    // Update hints used
    const totalHints = progress.hintsUsed + hintsUsed;

    // Calculate new mastery level
    const masteryLevel = calculateMasteryLevel({
      totalAttempts,
      successfulDials,
      currentStreak,
      hintsUsed: totalHints,
      lastPracticed: progress.lastPracticed,
    });

    // Check if should advance difficulty
    const difficultyLevel = shouldAdvanceDifficulty(
      progress.difficultyLevel,
      masteryLevel
    );

    // Update last practiced
    const lastPracticed = new Date().toISOString();

    // Save to database
    await db.runAsync(
      `UPDATE progress SET
        total_attempts = ?,
        successful_dials = ?,
        current_streak = ?,
        longest_streak = ?,
        last_practiced = ?,
        mastery_level = ?,
        difficulty_level = ?,
        hints_used = ?
      WHERE profile_id = ? AND contact_id = ?`,
      [
        totalAttempts,
        successfulDials,
        currentStreak,
        longestStreak,
        lastPracticed,
        masteryLevel,
        difficultyLevel,
        totalHints,
        profileId,
        contactId,
      ]
    );

    return {
      profileId,
      contactId,
      totalAttempts,
      successfulDials,
      currentStreak,
      longestStreak,
      lastPracticed,
      masteryLevel,
      difficultyLevel,
      hintsUsed: totalHints,
      simonSaysBest: progress.simonSaysBest,
    };
  } catch (error) {
    console.error('[DialBuddy] Failed to record attempt:', error);
    return null;
  }
}

/**
 * Calculate mastery level (0-100%)
 *
 * Business Algorithm:
 * - 60% weight: Success rate (successful / total)
 * - 20% weight: Current streak (capped at 10 attempts)
 * - 10% weight: Recency (practiced recently = higher mastery)
 * - 10% penalty: Hints used (more hints = lower mastery)
 *
 * Why This Formula:
 * - Success rate is primary indicator of learning
 * - Streak rewards consistent performance
 * - Recency ensures practicing maintains mastery
 * - Hint penalty encourages independent recall
 *
 * @param data - Progress data for calculation
 * @returns Mastery level 0-100
 */
function calculateMasteryLevel(data: {
  totalAttempts: number;
  successfulDials: number;
  currentStreak: number;
  hintsUsed: number;
  lastPracticed: string | null;
}): number {
  const { totalAttempts, successfulDials, currentStreak, hintsUsed, lastPracticed } = data;

  // Need at least 3 attempts to calculate meaningful mastery
  if (totalAttempts < 3) {
    return 0;
  }

  // Component 1: Success rate (60% weight)
  // Why 60%: Primary indicator of learning
  const successRate = totalAttempts > 0 ? successfulDials / totalAttempts : 0;
  const successComponent = successRate * 60;

  // Component 2: Current streak (20% weight, capped at 10)
  // Why capped: Prevents mastery from being too dependent on single long streak
  const streakComponent = Math.min(currentStreak / 10, 1) * 20;

  // Component 3: Recency (10% weight)
  // Why: Practicing yesterday = better retention than practicing last month
  let recencyComponent = 0;
  if (lastPracticed) {
    const daysSinceLastPractice =
      (Date.now() - new Date(lastPracticed).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastPractice < 1) {
      recencyComponent = 10; // Practiced today = full points
    } else if (daysSinceLastPractice < 7) {
      recencyComponent = 7; // Practiced this week = most points
    } else if (daysSinceLastPractice < 30) {
      recencyComponent = 3; // Practiced this month = some points
    }
    // Else: 0 points for practicing >30 days ago
  }

  // Component 4: Hint penalty (10% penalty)
  // Why: Using hints indicates not yet mastered
  const hintRate = totalAttempts > 0 ? hintsUsed / totalAttempts : 0;
  const hintPenalty = hintRate * 10;

  // Calculate final mastery (0-100)
  const mastery = successComponent + streakComponent + recencyComponent - hintPenalty;

  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, Math.round(mastery)));
}

/**
 * Determine if should advance to next difficulty level
 *
 * Business Rules:
 * - Beginner → Intermediate: 80% mastery
 * - Intermediate → Advanced: 80% mastery
 * - Advanced: No further advancement (maxed out)
 *
 * Why 80% Threshold:
 * - High enough to ensure genuine learning (not luck)
 * - Low enough to maintain engagement (not frustrating)
 * - Backed by educational research on mastery learning
 *
 * @param currentDifficulty - Current difficulty level
 * @param masteryLevel - Current mastery percentage (0-100)
 * @returns New difficulty level (may be same as current)
 */
function shouldAdvanceDifficulty(
  currentDifficulty: DifficultyLevel,
  masteryLevel: number
): DifficultyLevel {
  const MASTERY_THRESHOLD = 80; // 80% mastery required to advance

  if (currentDifficulty === 'beginner' && masteryLevel >= MASTERY_THRESHOLD) {
    return 'intermediate';
  }

  if (currentDifficulty === 'intermediate' && masteryLevel >= MASTERY_THRESHOLD) {
    return 'advanced';
  }

  // Already advanced or mastery not yet reached
  return currentDifficulty;
}

/**
 * Get all progress records for a child profile
 *
 * Business Use Case: Progress reports screen
 *
 * @param profileId - Child profile ID
 * @returns Array of progress records
 */
export async function getAllProgressForProfile(profileId: string): Promise<Progress[]> {
  // Web platform check - return empty array (no database on web)
  if (!db) return [];

  try {
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM progress WHERE profile_id = ? ORDER BY mastery_level DESC',
      [profileId]
    );

    return rows.map((row) => ({
      profileId: row.profile_id,
      contactId: row.contact_id,
      totalAttempts: row.total_attempts,
      successfulDials: row.successful_dials,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      lastPracticed: row.last_practiced,
      masteryLevel: row.mastery_level,
      difficultyLevel: row.difficulty_level as DifficultyLevel,
      hintsUsed: row.hints_used,
      simonSaysBest: row.simon_says_best,
    }));
  } catch (error) {
    console.error('[DialBuddy] Failed to get progress for profile:', error);
    return [];
  }
}

/**
 * Update Simon Says best score
 *
 * Business Use Case: Simon Says game mode (sequence memory training)
 *
 * @param profileId - Child profile ID
 * @param contactId - Contact ID
 * @param score - New score (sequence length)
 */
export async function updateSimonSaysBest(
  profileId: string,
  contactId: string,
  score: number
): Promise<void> {
  // Web platform check - no-op (no database on web)
  if (!db) return;

  try {
    // Get current progress
    const progress = await getProgress(profileId, contactId);

    if (!progress) {
      await initializeProgress(profileId, contactId);
    }

    // Only update if new score is higher
    await db.runAsync(
      `UPDATE progress SET simon_says_best = MAX(simon_says_best, ?)
       WHERE profile_id = ? AND contact_id = ?`,
      [score, profileId, contactId]
    );
  } catch (error) {
    console.error('[DialBuddy] Failed to update Simon Says score:', error);
  }
}
