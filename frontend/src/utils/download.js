/**
 * Download utilities for delivery page.
 *
 * Uses server-side Content-Disposition headers for cross-browser downloads.
 * No file-saver library needed — server controls download behavior via headers.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Trigger individual photo download via server endpoint.
 *
 * Creates a temporary anchor element and programmatically clicks it.
 * The server endpoint sends Content-Disposition: attachment header,
 * which triggers the browser download dialog regardless of cross-origin restrictions.
 *
 * @param {string} deliveryToken - Collection delivery token
 * @param {string} photoId - EditedPhoto ID (CUID)
 * @param {string} filename - Original photo filename (for download attribute fallback)
 */
export function downloadPhoto(deliveryToken, photoId, filename) {
  const downloadUrl = `${API_BASE_URL}/deliver/${deliveryToken}/photo/${photoId}`;

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename; // Fallback filename (server header takes precedence)
  link.style.display = 'none';

  // Append to DOM (required for Firefox compatibility)
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
}

/**
 * Trigger ZIP download of all photos via server endpoint.
 *
 * @param {string} deliveryToken - Collection delivery token
 */
export function downloadAllAsZip(deliveryToken) {
  const downloadUrl = `${API_BASE_URL}/deliver/${deliveryToken}/zip`;

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = ''; // Let server Content-Disposition header set filename
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
}
