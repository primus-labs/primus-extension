/**
 * Safe chrome.runtime.sendMessage wrapper for content scripts.
 * Catches "Extension context invalidated" when Service Worker has been reclaimed.
 */
export function safeSendMessage(msg) {
  try {
    chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[safeSendMessage] SW unavailable:', err.message);
  }
}

/**
 * Send message with retry for SW context invalidation recovery.
 * Returns a Promise that resolves with the response or rejects after maxRetries.
 */
export async function sendMessageWithRetry(msg, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await chrome.runtime.sendMessage(msg);
    } catch (err) {
      if (i === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
}
