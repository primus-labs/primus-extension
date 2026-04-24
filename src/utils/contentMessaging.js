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

function defaultShouldRetrySendMessageError(err) {
  const message = String(err?.message || err || '').toLowerCase();
  return (
    message.includes('extension context invalidated') ||
    message.includes('receiving end does not exist') ||
    message.includes('could not establish connection')
  );
}

/**
 * Send message with retry for SW context invalidation recovery.
 * Returns a Promise that resolves with the response or rejects after maxRetries.
 */
export async function sendMessageWithRetry(
  msg,
  maxRetries = 2,
  shouldRetry = defaultShouldRetrySendMessageError
) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await chrome.runtime.sendMessage(msg);
    } catch (err) {
      if (i === maxRetries || !shouldRetry(err)) throw err;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
}
