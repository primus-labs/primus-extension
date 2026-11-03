import {
  matches,
  POLYMARKET_FORM_PROBE_MS,
  logPolymarketPnl,
} from '@/pages/Background/pageDecode/specialTemplates/specialTemplatePnlPolymarket.js';
import {
  isPolymarketLoginFormVisibleInDocument,
  POLYMARKET_LOGIN_FORM_SELECTOR,
} from './polymarketLoginFormDom.js';

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

function resolveFormProbeDurationMs(formProbeDurationMs) {
  if (
    typeof formProbeDurationMs === 'number' &&
    Number.isFinite(formProbeDurationMs) &&
    formProbeDurationMs > 0
  ) {
    return formProbeDurationMs;
  }
  return POLYMARKET_FORM_PROBE_MS;
}

function formProbeDeadlineMs(formProbeStartedAt, formProbeDurationMs) {
  if (formProbeStartedAt == null || !Number.isFinite(formProbeStartedAt)) {
    return 0;
  }
  const durationMs = resolveFormProbeDurationMs(formProbeDurationMs);
  return formProbeStartedAt + durationMs + PROBE_DEADLINE_SLACK_MS;
}

function describeVisibleLoginInput() {
  try {
    const input = document.querySelector(POLYMARKET_LOGIN_FORM_SELECTOR);
    if (!input) return null;
    return {
      name: input.getAttribute('name'),
      type: input.getAttribute('type'),
      id: input.id || null,
    };
  } catch (_e) {
    return null;
  }
}

function reportLoginFormSeenOnce() {
  if (loginFormReported) return;
  loginFormReported = true;
  logPolymarketPnl('loginFormInputFound', {
    input: describeVisibleLoginInput(),
    href: window.location.href,
  });
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
  formProbeStartedAt,
  formProbeDurationMs
) {
  stopPolymarketLoginFormPoll();
  if (!matches(templateParams) || !formProbeActive) return;
  if (formProbeStartedAt == null) return;

  loginFormReported = false;
  const deadlineMs = formProbeDeadlineMs(
    formProbeStartedAt,
    formProbeDurationMs
  );
  logPolymarketPnl('loginFormPollStarted', {
    formProbeStartedAt,
    formProbeDurationMs: resolveFormProbeDurationMs(formProbeDurationMs),
    pollDeadlineMs: deadlineMs,
  });
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
