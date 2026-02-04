/**
 * Validate if a string is a valid UUID v4 format
 * @param id - The string to validate
 * @returns true if valid UUID, false otherwise
 */
export const isValidUUID = (id: string | undefined | null): boolean => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Check if the current session is a demo mode session
 * Demo mode uses non-UUID identifiers like "demo-admin"
 * @param profileId - The profile ID to check
 * @returns true if demo mode, false otherwise
 */
export const isDemoMode = (profileId: string | undefined | null): boolean => {
  if (!profileId) return false;
  return profileId.startsWith('demo-');
};
