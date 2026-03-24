/**
 * Child Profile Database Functions
 *
 * Business Purpose:
 * CRUD operations for child profiles (name, age, avatar).
 * Each profile has independent progress tracking so multiple children
 * in the same household can use the app without mixing their data.
 *
 * Phase 1 scope:
 * - Single active profile at a time (stored in AsyncStorage as active profile ID)
 * - Profile created/updated via Parent Zone ProfileModal
 * - Active profile ID read by practice screens to scope progress queries
 *
 * Business Rules:
 * - Max 5 profiles per device (practical family limit, enforced in DB schema)
 * - Profile name required; age and avatar are optional
 * - Deleting a profile cascades to all progress data (ON DELETE CASCADE in schema)
 *
 * Privacy:
 * - All data stored locally in SQLite (COPPA compliant)
 * - No cloud sync, no analytics, no network requests
 */

import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { ChildProfile } from '../../types';
import { storage } from './asyncStore';

// Platform check: Only initialize database on native platforms
const db = Platform.OS !== 'web' ? SQLite.openDatabaseSync('dialbuddy.db') : null;

/**
 * Default profile used as fallback on web and before any profile is created.
 * Business Rule: 'default_profile' is the hardcoded ID used across the app
 * until a real profile is created. This ensures backward compatibility.
 */
export const DEFAULT_PROFILE_ID = 'default_profile';

/**
 * Get all child profiles on this device
 *
 * @returns Array of profiles ordered by creation date
 */
export async function getAllProfiles(): Promise<ChildProfile[]> {
  if (!db) return [];

  try {
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM profiles ORDER BY created_at ASC'
    );

    return rows.map(rowToProfile);
  } catch (error) {
    console.error('[DialBuddy] Failed to get profiles:', error);
    return [];
  }
}

/**
 * Get a single profile by ID
 *
 * @param id - Profile ID
 * @returns Profile or null if not found
 */
export async function getProfileById(id: string): Promise<ChildProfile | null> {
  if (!db) return null;

  try {
    const row = await db.getFirstAsync<any>(
      'SELECT * FROM profiles WHERE id = ?',
      [id]
    );

    if (!row) return null;
    return rowToProfile(row);
  } catch (error) {
    console.error('[DialBuddy] Failed to get profile:', error);
    return null;
  }
}

/**
 * Get the currently active profile
 *
 * Business Flow:
 * 1. Read active profile ID from AsyncStorage
 * 2. If found, load that profile from SQLite
 * 3. If not found (first run or cleared), return null
 *
 * @returns Active ChildProfile or null
 */
export async function getActiveProfile(): Promise<ChildProfile | null> {
  const activeId = await storage.getActiveProfileId();
  if (!activeId || activeId === DEFAULT_PROFILE_ID) return null;
  return getProfileById(activeId);
}

/**
 * Create a new child profile
 *
 * Business Rule: Max 5 profiles enforced — returns null if limit reached.
 *
 * @param name - Child's name (required)
 * @param age - Child's age (optional)
 * @param avatar - Avatar emoji (optional)
 * @returns Created profile or null if max reached
 */
export async function createProfile(
  name: string,
  age: number | null = null,
  avatar: string | null = null
): Promise<ChildProfile | null> {
  if (!db) return null;

  try {
    // Enforce max 5 profiles
    const existing = await getAllProfiles();
    if (existing.length >= 5) {
      console.warn('[DialBuddy] Cannot create profile: Maximum 5 profiles reached');
      return null;
    }

    const id = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO profiles (id, name, avatar, age, created_at, active_theme)
       VALUES (?, ?, ?, ?, ?, 'default')`,
      [id, name.trim(), avatar, age, createdAt]
    );

    const profile: ChildProfile = {
      id,
      name: name.trim(),
      avatar,
      age,
      createdAt,
      activeTheme: 'default',
    };

    console.log('[DialBuddy] Created profile:', profile.name);
    return profile;
  } catch (error) {
    console.error('[DialBuddy] Failed to create profile:', error);
    return null;
  }
}

/**
 * Update an existing child profile
 *
 * @param id - Profile ID to update
 * @param updates - Fields to update (name, age, avatar)
 * @returns Updated profile or null on failure
 */
export async function updateProfile(
  id: string,
  updates: { name?: string; age?: number | null; avatar?: string | null }
): Promise<ChildProfile | null> {
  if (!db) return null;

  try {
    const existing = await getProfileById(id);
    if (!existing) {
      console.warn('[DialBuddy] Profile not found:', id);
      return null;
    }

    const updated: ChildProfile = {
      ...existing,
      name: updates.name !== undefined ? updates.name.trim() : existing.name,
      age: updates.age !== undefined ? updates.age : existing.age,
      avatar: updates.avatar !== undefined ? updates.avatar : existing.avatar,
    };

    await db.runAsync(
      'UPDATE profiles SET name = ?, age = ?, avatar = ? WHERE id = ?',
      [updated.name, updated.age, updated.avatar, id]
    );

    console.log('[DialBuddy] Updated profile:', updated.name);
    return updated;
  } catch (error) {
    console.error('[DialBuddy] Failed to update profile:', error);
    return null;
  }
}

/**
 * Delete a child profile
 *
 * Business Impact: Also deletes all progress and emergency data for this profile
 * due to ON DELETE CASCADE in the database schema.
 *
 * @param id - Profile ID to delete
 * @returns True if deleted successfully
 */
export async function deleteProfile(id: string): Promise<boolean> {
  if (!db) return false;

  try {
    await db.runAsync('DELETE FROM profiles WHERE id = ?', [id]);

    // If this was the active profile, clear the active ID
    const activeId = await storage.getActiveProfileId();
    if (activeId === id) {
      await storage.setActiveProfileId(DEFAULT_PROFILE_ID);
    }

    console.log('[DialBuddy] Deleted profile:', id);
    return true;
  } catch (error) {
    console.error('[DialBuddy] Failed to delete profile:', error);
    return false;
  }
}

/**
 * Map a raw SQLite row to a ChildProfile TypeScript object
 *
 * @param row - Raw database row
 * @returns Typed ChildProfile
 */
function rowToProfile(row: any): ChildProfile {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    age: row.age,
    createdAt: row.created_at,
    activeTheme: row.active_theme || 'default',
    difficultyOverride: row.difficulty_override ?? undefined,
  };
}
