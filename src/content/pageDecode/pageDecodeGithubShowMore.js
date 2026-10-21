/**
 * GitHub repositories template: click sidebar "Show more" after data-source page loads.
 */
import { matches as matchesGithubRepositoriesTemplate } from '@/pages/Background/pageDecode/specialTemplates/specialTemplateGithubRepositories.js';

const POLL_MS = 400;
const MAX_ATTEMPTS = 75;

let pollTimeoutId = null;
let clickCompleted = false;
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

export function resetGithubRepositoriesShowMoreClickState() {
  clickCompleted = false;
  lastAttestationKey = '';
  if (pollTimeoutId != null) {
    clearTimeout(pollTimeoutId);
    pollTimeoutId = null;
  }
}

/**
 * @returns {HTMLButtonElement | null}
 */
function findGithubShowMoreButton() {
  const buttons = document.querySelectorAll(
    'button[data-testid*="ActionListContent"], button[data-component="ActionList.Item"]'
  );
  for (const button of buttons) {
    if (
      button.textContent?.replace(/\s+/g, ' ').trim() === 'Show more'
    ) {
      return button;
    }
  }

  const spans = document.querySelectorAll('span.color-fg-muted.f6');
  for (const span of spans) {
    if (span.textContent?.trim() === 'Show more') {
      const button = span.closest('button');
      if (button instanceof HTMLButtonElement) {
        return button;
      }
    }
  }

  return null;
}

/**
 * @param {HTMLElement} el
 */
function triggerClick(el) {
  el.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    })
  );
  if (typeof el.click === 'function') {
    el.click();
  }
}

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string; requestid?: string } | null | undefined} activeRequest
 */
export function tryGithubRepositoriesShowMoreClick(activeRequest) {
  if (!matchesGithubRepositoriesTemplate(activeRequest)) {
    return;
  }

  const sessionKey = attestationSessionKey(activeRequest);
  if (sessionKey !== lastAttestationKey) {
    resetGithubRepositoriesShowMoreClickState();
    lastAttestationKey = sessionKey;
  }

  if (clickCompleted || pollTimeoutId != null) {
    return;
  }

  let attempts = 0;

  const tick = () => {
    pollTimeoutId = null;
    if (!matchesGithubRepositoriesTemplate(activeRequest) || clickCompleted) {
      return;
    }

    const button = findGithubShowMoreButton();
    if (button) {
      triggerClick(button);
      clickCompleted = true;
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
