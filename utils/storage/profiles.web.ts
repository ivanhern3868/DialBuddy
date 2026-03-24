/**
 * Web stub for profiles.ts
 *
 * Why this file exists:
 * profiles.ts has `import * as SQLite from 'expo-sqlite'` which breaks
 * web/Netlify builds. This stub provides the same exports as no-ops
 * so the app compiles and runs on web without SQLite.
 */

import { ChildProfile } from '../../types';

export async function getAllProfiles(): Promise<ChildProfile[]> {
  return [];
}

export async function getProfileById(_id: string): Promise<ChildProfile | null> {
  return null;
}

export async function getActiveProfile(): Promise<ChildProfile | null> {
  return null;
}

export async function createProfile(
  _name: string,
  _age: number | null = null,
  _avatar: string | null = null
): Promise<ChildProfile | null> {
  return null;
}

export async function updateProfile(
  _id: string,
  _updates: { name?: string; age?: number | null; avatar?: string | null }
): Promise<ChildProfile | null> {
  return null;
}

export async function deleteProfile(_id: string): Promise<boolean> {
  return false;
}
