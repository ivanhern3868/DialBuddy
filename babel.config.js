/**
 * Babel Configuration for DialBuddy
 *
 * Business Purpose:
 * Configures JavaScript transpilation for React Native with critical plugins:
 * - NativeWind: Enables Tailwind CSS className support
 * - Reanimated: Enables 60fps native-thread animations (critical for child UX)
 *
 * IMPORTANT: react-native-reanimated/plugin MUST be last in plugins array.
 * Order matters for correct code transformation.
 */

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [],
  };
};
