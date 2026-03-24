/**
 * Metro Bundler Configuration for DialBuddy
 *
 * Business Purpose:
 * Configures React Native's JavaScript bundler (Metro) to work with NativeWind.
 * Enables CSS processing and proper asset bundling.
 *
 * Why Metro:
 * React Native uses Metro (not Webpack) for bundling. This config ensures
 * Tailwind CSS files are processed correctly and assets load properly.
 */

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
