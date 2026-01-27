/**
 * Safely merges ProposalCard settings, ensuring all properties are preserved.
 * 
 * This utility function prevents data loss when updating card settings by merging
 * new settings with existing settings rather than replacing them entirely.
 * 
 * @param {Object} existingSettings - The current settings object from the server/card
 * @param {Object} newSettings - The new settings to merge in
 * @returns {Object} - Merged settings object
 * 
 * @example
 * // When updating status, preserve other settings
 * const merged = mergeCardSettings(
 *   { status: "Not started", includeInReport: true, includeInReviewSteps: ["ACTION_SUBMIT"] },
 *   { status: "Completed" }
 * );
 * // Result: { status: "Completed", includeInReport: true, includeInReviewSteps: ["ACTION_SUBMIT"] }
 */
export function mergeCardSettings(existingSettings = {}, newSettings = {}) {
  // If no existing settings, return new settings (or default structure)
  if (!existingSettings || Object.keys(existingSettings).length === 0) {
    return {
      status: newSettings.status || "Not started",
      ...newSettings,
    };
  }

  // Merge existing settings with new settings, with new settings taking precedence
  return {
    ...existingSettings,
    ...newSettings,
  };
}

/**
 * Gets the complete settings object for a card, ensuring it has at least a status.
 * Useful when you need to ensure settings exist before updating.
 * 
 * @param {Object} card - The card object (may have settings property)
 * @returns {Object} - Settings object with at least status property
 */
export function getCardSettings(card) {
  return card?.settings || { status: "Not started" };
}
