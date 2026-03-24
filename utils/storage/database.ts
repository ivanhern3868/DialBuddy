/**
 * SQLite Database Setup for DialBuddy
 *
 * Business Purpose:
 * Local-only database for storing child progress, contacts, and settings.
 * Zero network calls ensures COPPA compliance (no data collection).
 *
 * Data Stored:
 * - Child profiles (names, avatars, preferences)
 * - Contacts (parent phone numbers for practice)
 * - Progress tracking (mastery levels, streaks)
 * - Emergency module progress (scenario mastery, drills)
 *
 * Privacy Compliance:
 * All data stays on device. No cloud sync. Deleted on app uninstall.
 * This is intentional for COPPA compliance (ages 3-4 target audience).
 *
 * Platform Note:
 * expo-sqlite only works on native platforms (iOS/Android).
 * Web bundling will fail if we try to import it, so we conditionally import.
 */

import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

// Conditional database initialization - only on native platforms
// Why: expo-sqlite requires native SQLite, web build fails on WASM module import
// Web users get mock database (UI demo only, no persistence)
// Type: SQLiteDatabase on native, null on web (database functionality disabled)
let db: SQLiteDatabase | null = null;

if (Platform.OS !== 'web') {
  // Dynamic require to prevent web bundler from trying to load native WASM module
  // Why dynamic: Static import causes Webpack to try bundling native code for web
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const SQLite = require('expo-sqlite');
  db = SQLite.openDatabaseSync('dialbuddy.db') as SQLiteDatabase;
}

/**
 * Initialize database schema
 *
 * Business Purpose:
 * Creates all tables needed for DialBuddy's core functionality.
 * Safe to run multiple times (IF NOT EXISTS ensures idempotency).
 *
 * Called on app launch before any UI renders (see app/_layout.tsx).
 *
 * Schema Design Notes:
 * - profiles: Each child gets their own progress tracking
 * - contacts: Shared across all profiles (parent sets up once)
 * - progress: Per-child, per-contact mastery tracking
 * - emergency_progress: Spaced repetition tracking for scenarios
 */
export async function initDatabase(): Promise<void> {
  // Web platform check - no-op (no database on web)
  if (!db) {
    console.log('[DialBuddy] Running on web - database disabled');
    return;
  }

  try {
    await db.execAsync(`
      -- Child profiles table
      -- Business Rule: Max 5 profiles per device (practical family limit)
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        avatar TEXT,
        age INTEGER,
        created_at TEXT NOT NULL,
        active_theme TEXT DEFAULT 'default',
        difficulty_override TEXT
      );

      -- Contacts table (shared across all profiles)
      -- Business Rule: Max 6 contacts (keeps UI simple for toddlers)
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        formatted_number TEXT,
        digit_grouping TEXT,
        avatar TEXT,
        relationship TEXT,
        is_emergency INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0
      );

      -- Progress tracking per child per contact
      -- Business Rule: Tracks mastery 0-100%, auto-advances difficulty at thresholds
      CREATE TABLE IF NOT EXISTS progress (
        profile_id TEXT NOT NULL,
        contact_id TEXT NOT NULL,
        total_attempts INTEGER DEFAULT 0,
        successful_dials INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_practiced TEXT,
        mastery_level REAL DEFAULT 0,
        difficulty_level TEXT DEFAULT 'beginner',
        hints_used INTEGER DEFAULT 0,
        simon_says_best INTEGER DEFAULT 0,
        PRIMARY KEY (profile_id, contact_id),
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
      );

      -- Emergency module progress
      -- Business Rule: Spaced repetition - intervals grow: 1d → 3d → 7d → 14d → 30d
      CREATE TABLE IF NOT EXISTS emergency_progress (
        profile_id TEXT NOT NULL,
        scenario_id TEXT NOT NULL,
        correct_count INTEGER DEFAULT 0,
        incorrect_count INTEGER DEFAULT 0,
        consecutive_correct INTEGER DEFAULT 0,
        last_practiced TEXT,
        next_due TEXT,
        interval_days INTEGER DEFAULT 1,
        PRIMARY KEY (profile_id, scenario_id),
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      );

      -- Emergency module statistics
      -- Business Rule: Tracks Emergency Star badge criteria completion
      CREATE TABLE IF NOT EXISTS emergency_stats (
        profile_id TEXT PRIMARY KEY,
        dispatcher_sim_completions TEXT DEFAULT '{}',
        after_call_completions TEXT DEFAULT '{}',
        silent_call_completed INTEGER DEFAULT 0,
        last_full_drill TEXT,
        next_drill_due TEXT,
        sessions_since_last_quiz INTEGER DEFAULT 0,
        emergency_number_recall_streak INTEGER DEFAULT 0,
        emergency_star_earned INTEGER DEFAULT 0,
        overall_mastery REAL DEFAULT 0,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      );

      -- Stickers earned (collectible rewards)
      -- Business Rule: Each sticker earned once per profile, displayed in sticker book
      CREATE TABLE IF NOT EXISTS stickers (
        profile_id TEXT NOT NULL,
        sticker_id TEXT NOT NULL,
        earned_at TEXT NOT NULL,
        PRIMARY KEY (profile_id, sticker_id),
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      );

      -- Parent-recorded dispatcher voice files
      -- Business Rule: Parent can record custom dispatcher lines for realism
      CREATE TABLE IF NOT EXISTS parent_recordings (
        step_id TEXT PRIMARY KEY,
        file_uri TEXT NOT NULL,
        duration_ms INTEGER,
        recorded_at TEXT
      );

      -- Create indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_progress_profile ON progress(profile_id);
      CREATE INDEX IF NOT EXISTS idx_progress_mastery ON progress(mastery_level);
      CREATE INDEX IF NOT EXISTS idx_emergency_next_due ON emergency_progress(next_due);
    `);

    console.log('[DialBuddy] ✓ Database initialized successfully');
  } catch (error) {
    console.error('[DialBuddy] ✗ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Get database instance for direct queries
 *
 * Usage: const db = getDatabase();
 * Then: db?.getAllAsync('SELECT * FROM profiles')
 *
 * @returns SQLiteDatabase instance on native, null on web platform
 */
export function getDatabase(): SQLiteDatabase | null {
  return db;
}

/**
 * Reset database (for testing only)
 *
 * Business Purpose:
 * Drops all tables and recreates schema. Used during development
 * or if parent wants to completely reset app.
 *
 * WARNING: This deletes ALL child progress data permanently!
 */
export async function resetDatabase(): Promise<void> {
  // Web platform check - no-op (no database on web)
  if (!db) return;

  console.warn('[DialBuddy] ⚠ Resetting database - ALL DATA WILL BE LOST');

  await db.execAsync(`
    DROP TABLE IF EXISTS parent_recordings;
    DROP TABLE IF EXISTS stickers;
    DROP TABLE IF EXISTS emergency_stats;
    DROP TABLE IF EXISTS emergency_progress;
    DROP TABLE IF EXISTS progress;
    DROP TABLE IF EXISTS contacts;
    DROP TABLE IF EXISTS profiles;
  `);

  await initDatabase();
  console.log('[DialBuddy] ✓ Database reset complete');
}

export default db;
