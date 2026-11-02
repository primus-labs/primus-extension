import {
  matches,
  POLYMARKET_FORM_PROBE_MS,
  isPolymarketLoginFormVisibleInDocument,
} from '@/pages/Background/pageDecode/specialTemplates/specialTemplatePnlPolymarket.js';

const POLL_INTERVAL_MS = 400;
const PROBE_DEADLINE_SLACK_MS = 500;

let pollIntervalId = null;
let loginFormReported = false;

function clearPollInterval() {
  if (pollIntervalId != null) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
}

function formProbeDeadlineMs(formProbeStartedAt) {
  if (formProbeStartedAt == null || !Number.isFinite(formProbeStartedAt)) {
    return 0;
  }
  return (
    formProbeStartedAt + POLYMARKET_FORM_PROBE_MS + PROBE_DEADLINE_SLACK_MS
  );
}

function reportLoginFormSeenOnce() {
  if (loginFormReported) return;
  loginFormReported = true;
  clearPollInterval();
  chrome.runtime.sendMessage({
    type: 'pageDecode',
    name: 'polymarketLoginFormSeen',
  });
}

function tickPolymarketLoginFormPoll(deadlineMs) {
  if (loginFormReported) {
    clearPollInterval();
    return;
  }
  if (deadlineMs <= 0 || Date.now() > deadlineMs) {
    clearPollInterval();
    return;
  }
  if (isPolymarketLoginFormVisibleInDocument()) {
    reportLoginFormSeenOnce();
  }
}

/**
 * Poll for username/email inputs during the post-params 10s form probe window.
 * @param {object | null | undefined} templateParams activeTemplate fields on content
 * @param {boolean | undefined} formProbeActive background gate still probing
 * @param {number | null | undefined} formProbeStartedAt ms timestamp from background
 */
export function startPolymarketLoginFormPoll(
  templateParams,
  formProbeActive,
  formProbeStartedAt
) {
  stopPolymarketLoginFormPoll();
  if (!matches(templateParams) || !formProbeActive) return;
  if (formProbeStartedAt == null) return;

  loginFormReported = false;
  const deadlineMs = formProbeDeadlineMs(formProbeStartedAt);
  tickPolymarketLoginFormPoll(deadlineMs);
  pollIntervalId = setInterval(
    () => tickPolymarketLoginFormPoll(deadlineMs),
    POLL_INTERVAL_MS
  );
}

export function stopPolymarketLoginFormPoll() {
  clearPollInterval();
  loginFormReported = false;
}
