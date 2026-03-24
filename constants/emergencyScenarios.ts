/**
 * Emergency Scenario Definitions
 *
 * Business Purpose:
 * Defines the five Phase 1 emergency scenarios children practice.
 * Each scenario walks through: scene setup → dial 911 → read dispatcher script.
 *
 * Design Decisions:
 * - All text content lives in i18n locale files (keys referenced here).
 *   This lets parents switch language without code changes.
 * - Scripts are short (2–3 sentences) — age-appropriate for 3-4 year olds
 *   to read aloud with parent guidance.
 * - Speech validation uses key-word matching (not exact match) because
 *   toddlers mispronounce words and STT is imperfect with children's voices.
 *
 * Scenario Flow for Each:
 *   1. SCENE   — Show what's happening (emoji + description)
 *   2. DIAL    — Child dials the emergency number on the keypad
 *   3. SPEECH  — Show script text; child reads aloud; STT validates
 *   4. SUCCESS — Celebrate + reinforce "you knew what to do!"
 */

export interface EmergencyScenario {
  /** Unique identifier — used in navigation params and progress tracking */
  id: string;

  /** Large emoji shown as the scene icon */
  emoji: string;

  /** Background color for the scene card (keeps each scenario visually distinct) */
  sceneColor: string;

  /** i18n key: short title shown on the scenario selection card */
  titleKey: string;

  /** i18n key: 1-2 sentence scene description shown to the child */
  sceneDescKey: string;

  /** i18n key: urgent call-to-action below the scene (e.g., "You need to call 911!") */
  sceneActionKey: string;

  /**
   * i18n key: the dispatcher script the child reads aloud.
   * Supports {{name}} and {{address}} interpolation from the child's profile.
   * If profile data is missing, placeholders are omitted gracefully.
   */
  scriptKey: string;

  /**
   * Keywords that MUST appear in the child's speech to be validated as correct.
   * Why a subset (not full script): STT with young children is noisy — we check
   * that the most important words were said, not verbatim reproduction.
   * All keywords should be lowercase (matching is case-insensitive).
   */
  validationKeywords: string[];
}

/**
 * The five Phase 1 emergency scenarios.
 * Ordered from most common / easiest to understand → more complex.
 */
export const EMERGENCY_SCENARIOS: EmergencyScenario[] = [
  {
    id: 'fire',
    emoji: '🔥',
    sceneColor: '#FF8A65',
    titleKey: 'emergency.scenarios.fire.title',
    sceneDescKey: 'emergency.scenarios.fire.scene',
    sceneActionKey: 'emergency.scenarios.fire.action',
    scriptKey: 'emergency.scenarios.fire.script',
    validationKeywords: ['fire', 'help', 'house'],
  },
  {
    id: 'unconscious',
    emoji: '😴',
    sceneColor: '#7986CB',
    titleKey: 'emergency.scenarios.unconscious.title',
    sceneDescKey: 'emergency.scenarios.unconscious.scene',
    sceneActionKey: 'emergency.scenarios.unconscious.action',
    scriptKey: 'emergency.scenarios.unconscious.script',
    validationKeywords: ['help', 'breathing', 'unconscious'],
  },
  {
    id: 'poison',
    emoji: '☠️',
    sceneColor: '#66BB6A',
    titleKey: 'emergency.scenarios.poison.title',
    sceneDescKey: 'emergency.scenarios.poison.scene',
    sceneActionKey: 'emergency.scenarios.poison.action',
    scriptKey: 'emergency.scenarios.poison.script',
    validationKeywords: ['drank', 'dangerous', 'help'],
  },
  {
    id: 'injury',
    emoji: '🩸',
    sceneColor: '#EF5350',
    titleKey: 'emergency.scenarios.injury.title',
    sceneDescKey: 'emergency.scenarios.injury.scene',
    sceneActionKey: 'emergency.scenarios.injury.action',
    scriptKey: 'emergency.scenarios.injury.script',
    validationKeywords: ['hurt', 'bleeding', 'help'],
  },
  {
    id: 'intruder',
    emoji: '🚨',
    sceneColor: '#546E7A',
    titleKey: 'emergency.scenarios.intruder.title',
    sceneDescKey: 'emergency.scenarios.intruder.scene',
    sceneActionKey: 'emergency.scenarios.intruder.action',
    scriptKey: 'emergency.scenarios.intruder.script',
    validationKeywords: ['stranger', 'inside', 'help'],
  },
];

/**
 * Find a scenario by ID
 *
 * @param id - Scenario ID (e.g., 'fire')
 * @returns Matching scenario or undefined
 */
export function getScenarioById(id: string): EmergencyScenario | undefined {
  return EMERGENCY_SCENARIOS.find((s) => s.id === id);
}
