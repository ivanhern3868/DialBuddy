/**
 * Stores Index
 *
 * Business Purpose:
 * Central export point for all Zustand stores.
 * Simplifies store imports throughout the application.
 *
 * Usage:
 * ```tsx
 * import { useSettingsStore, useDialerStore } from '@/stores';
 * ```
 */

export { useSettingsStore } from './settingsStore';
export type { AppSettings } from './settingsStore';

export { useDialerStore } from './dialerStore';
export type { DialerState } from './dialerStore';

// Add future stores here:
// export { usePracticeStore } from './practiceStore';
// export { useProgressStore } from './progressStore';
