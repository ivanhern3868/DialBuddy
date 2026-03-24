/**
 * Font Family Constants for DialBuddy
 *
 * Business Purpose:
 * Centralizes font family names to ensure consistent typography across the app.
 * Nunito font chosen specifically for ages 3-4 due to:
 * - Rounded letterforms (friendly, non-threatening appearance)
 * - High legibility (clear distinction between similar characters like 6/9, 1/7)
 * - Approachable aesthetic (reduces anxiety for young learners)
 *
 * Usage Examples:
 * ```typescript
 * import { Fonts } from '@/constants/Fonts';
 *
 * const styles = StyleSheet.create({
 *   title: {
 *     fontFamily: Fonts.bold,
 *     fontSize: 32,
 *   },
 *   body: {
 *     fontFamily: Fonts.regular,
 *     fontSize: 16,
 *   },
 * });
 * ```
 *
 * Why These Weights:
 * - Regular: Default for all body text and number displays
 * - Bold: Section headings, emphasized instructions for children
 * - SemiBold: Button labels, important UI elements (between regular/bold)
 * - Light: Secondary text, subtle labels (use sparingly)
 */

export const Fonts = {
  /**
   * Nunito Regular (400 weight)
   * Primary font for: Body text, dialer numbers, contact names, instructions
   */
  regular: 'Nunito-Regular',

  /**
   * Nunito Bold (700 weight)
   * Primary font for: Screen titles, emphasized words, celebration messages
   */
  bold: 'Nunito-Bold',

  /**
   * Nunito SemiBold (600 weight)
   * Primary font for: Button labels, section headers, important labels
   */
  semiBold: 'Nunito-SemiBold',

  /**
   * Nunito Light (300 weight)
   * Primary font for: Hint text, secondary labels, less important information
   * WARNING: Use sparingly - may be hard to read for some children
   */
  light: 'Nunito-Light',
} as const;

/**
 * Default font to use when no specific weight is specified
 * Use this in base styles or as a fallback
 */
export const DEFAULT_FONT = Fonts.regular;
