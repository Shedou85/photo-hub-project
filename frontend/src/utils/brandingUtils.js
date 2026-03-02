/**
 * Branding utility functions for custom accent colors on SharePage and DeliveryPage.
 */

/**
 * Adjust brightness of a hex color by a percentage.
 * Positive percent lightens, negative darkens.
 * @param {string} hex - Hex color string (e.g. '#ff5500')
 * @param {number} percent - Amount to adjust (-100 to 100)
 * @returns {string} Adjusted hex color
 */
export function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(2.55 * percent)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + Math.round(2.55 * percent)));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + Math.round(2.55 * percent)));
  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Get CSS custom properties for branding accent color.
 * Returns undefined when no accent color so Tailwind defaults apply.
 * @param {string|null} accentColor - Hex accent color or null
 * @returns {object|undefined} Style object with CSS custom properties
 */
export function getBrandingStyles(accentColor) {
  if (!accentColor) return undefined;
  return {
    '--brand-accent': accentColor,
    '--brand-accent-light': adjustBrightness(accentColor, 20),
    '--brand-accent-dark': adjustBrightness(accentColor, -20),
  };
}

/**
 * Get inline style for accent-colored gradient buttons.
 * Returns undefined when no accent color so Tailwind defaults apply.
 * @param {string|null} accentColor - Hex accent color or null
 * @returns {object|undefined} Style object with background + boxShadow
 */
export function getAccentButtonStyle(accentColor) {
  if (!accentColor) return undefined;
  const darker = adjustBrightness(accentColor, -15);
  return {
    background: `linear-gradient(135deg, ${accentColor} 0%, ${darker} 100%)`,
    boxShadow: `0 4px 16px ${accentColor}59`,
  };
}
