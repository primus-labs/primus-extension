import {
  matches,
  isHyperliquidJoinPageUrl,
  getHyperliquidJoinReferralSuffix,
  findJoinReferralButton,
} from '@/pages/Background/pageDecode/specialTemplates/specialTemplatePnlHyperliquid.js';

const POLL_MS = 400;
const MAX_ATTEMPTS = 150;

let pollTimeoutId = null;
let boundButton = null;
let clickHandler = null;
let waitCompleted = false;
let lastAttestationKey = '';

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string; requestid?: string } | null | undefined} activeRequest
 * @returns {string}
 */
function attestationSessionKey(activeRequest) {
  const templateId =
    activeRequest?.attTemplateID ??
    activeRequest?.templateId ??
    activeRequest?.id ??
    '';
  const requestId = activeRequest?.requestid ?? '';
  return `${templateId}:${requestId}`;
}

function clearPollTimeout() {
  if (pollTimeoutId != null) {
    clearTimeout(pollTimeoutId);
    pollTimeoutId = null;
  }
}

function detachButtonListener() {
  if (boundButton && clickHandler) {
    boundButton.removeEventListener('click', clickHandler, { capture: true });
  }
  boundButton = null;
  clickHandler = null;
}

export function stopHyperliquidJoinReferralWait() {
  clearPollTimeout();
  detachButtonListener();
}

export function resetHyperliquidJoinReferralWaitState() {
  waitCompleted = false;
  lastAttestationKey = '';
  stopHyperliquidJoinReferralWait();
}

function reportJoinReferralClicked() {
  if (waitCompleted) return;
  waitCompleted = true;
  stopHyperliquidJoinReferralWait();
  chrome.runtime.sendMessage({
    type: 'pageDecode',
    name: 'hyperliquidJoinReferralClicked',
  });
}

function bindJoinReferralButton(button) {
  if (boundButton === button) return;
  detachButtonListener();
  boundButton = button;
  clickHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    reportJoinReferralClicked();
  };
  button.addEventListener('click', clickHandler, { capture: true, once: true });
}

/**
 * Poll the join referral button on the Hyperliquid join URL.
 * @param {object | null | undefined} activeRequest
 */
export function startHyperliquidJoinReferralWait(activeRequest) {
  if (!matches(activeRequest)) {
    stopHyperliquidJoinReferralWait();
    return;
  }
  if (!isHyperliquidJoinPageUrl(window.location.href)) {
    stopHyperliquidJoinReferralWait();
    return;
  }

  const sessionKey = attestationSessionKey(activeRequest);
  if (sessionKey !== lastAttestationKey) {
    resetHyperliquidJoinReferralWaitState();
    lastAttestationKey = sessionKey;
  }

  if (waitCompleted || pollTimeoutId != null || boundButton) {
    return;
  }

  const suffix = getHyperliquidJoinReferralSuffix(activeRequest);
  let attempts = 0;

  const tick = () => {
    pollTimeoutId = null;
    if (waitCompleted || !matches(activeRequest)) {
      return;
    }
    if (!isHyperliquidJoinPageUrl(window.location.href)) {
      stopHyperliquidJoinReferralWait();
      return;
    }

    const button = findJoinReferralButton(document, suffix);
    if (button) {
      bindJoinReferralButton(button);
      return;
    }

    attempts += 1;
    if (attempts >= MAX_ATTEMPTS) {
      return;
    }
    pollTimeoutId = window.setTimeout(tick, POLL_MS);
  };

  tick();
}
