/**
 * Pure sender checks for background runtime message routes.
 */

/**
 * @param {{ resType?: string } | null | undefined} message
 * @param {{ id?: string; url?: string } | null | undefined} sender
 * @param {string} runtimeId
 * @param {string} offscreenUrl
 * @returns {boolean}
 */
export function isAlgorithmResponseFromOffscreen(
  message,
  sender,
  runtimeId,
  offscreenUrl
) {
  return (
    message?.resType === 'algorithm' &&
    sender?.id === runtimeId &&
    sender?.url === offscreenUrl
  );
}

/**
 * @param {{ id?: string; tab?: { id?: number } } | null | undefined} sender
 * @param {number | null | undefined} dataSourcePageTabId
 * @param {string} runtimeId
 * @returns {boolean}
 */
export function isTrustedPageDecodeRuntimeSender(
  sender,
  dataSourcePageTabId,
  runtimeId
) {
  if (sender?.id !== runtimeId) return false;
  const senderTabId = sender?.tab?.id;
  if (senderTabId == null) return true;
  return (
    dataSourcePageTabId != null &&
    senderTabId === dataSourcePageTabId
  );
}

/**
 * init establishes the owner; all later SDK controls stay bound to that tab.
 * @param {string} name
 * @param {number | null | undefined} senderTabId
 * @param {number | null | undefined} ownerTabId
 * @returns {boolean}
 */
export function isSdkMessageFromOwner(name, senderTabId, ownerTabId) {
  if (senderTabId == null) return false;
  if (name === 'initAttestation') {
    return ownerTabId == null || senderTabId === ownerTabId;
  }
  return ownerTabId != null && senderTabId === ownerTabId;
}

/**
 * Algorithm commands are broadcasts to offscreen and must not loop back into
 * the background response handler.
 * @param {{ type?: string; resType?: string } | null | undefined} message
 * @returns {string | null | undefined}
 */
export function getBackgroundRouteKey(message) {
  if (message?.resType === 'algorithm') return 'algorithm';
  if (message?.type === 'algorithm') return null;
  return message?.type;
}
