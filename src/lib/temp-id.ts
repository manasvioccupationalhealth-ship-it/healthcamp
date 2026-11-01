/**
 * Generates an offline temporary client-side Health ID.
 * Pure client utility with zero server or DB dependencies.
 */
export function generateOfflineTempId(clientId: string): string {
  const shortClient = (clientId || "DEV").replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `TMP-${shortClient}-${timestamp}-${random}`;
}
