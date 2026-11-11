import { CONTAINER_ID } from '../constants.js';
import {
  matchesHostOverlayHideTemplate,
  normalizeHostOverlayTemplateId,
} from './templateIds.js';
import { isHostOverlayVisiblyPresent } from './domDetect.js';

const DEBOUNCE_MS = 150;
const FALLBACK_TICK_MS = 2000;

let observer = null;
let debounceTimer = null;
let fallbackIntervalId = null;
let activeTemplateId = null;
/** @type {((hidden: boolean) => void) | null} */
let onHiddenChange = null;
let lastHidden = null;

function clearHostOverlayWatchers() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (debounceTimer != null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (fallbackIntervalId != null) {
    clearInterval(fallbackIntervalId);
    fallbackIntervalId = null;
  }
}

function runDetectionAndNotify() {
  if (!activeTemplateId || typeof onHiddenChange !== 'function') {
    return;
  }
  const hidden = isHostOverlayVisiblyPresent(activeTemplateId, document);
  if (hidden === lastHidden) {
    return;
  }
  lastHidden = hidden;
  onHiddenChange(hidden);
}

/**
 * @param {MutationRecord[]} mutations
 * @returns {boolean}
 */
function shouldIgnoreMutationsFromOurOverlay(mutations) {
  if (!mutations.length) {
    return false;
  }
  return mutations.every((record) => {
    const target = record.target;
    if (!(target instanceof Element)) {
      return false;
    }
    return (
      target.id === CONTAINER_ID || !!target.closest(`#${CONTAINER_ID}`)
    );
  });
}

function scheduleDetection() {
  if (debounceTimer != null) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    runDetectionAndNotify();
  }, DEBOUNCE_MS);
}

/**
 * @param {{ attTemplateID?: string; templateId?: string; id?: string } | null | undefined} templateParams
 * @param {(hidden: boolean) => void} hiddenChangeHandler
 */
export function startHostOverlayHidePoll(templateParams, hiddenChangeHandler) {
  stopHostOverlayHidePoll();
  if (!matchesHostOverlayHideTemplate(templateParams)) {
    return;
  }
  if (typeof hiddenChangeHandler !== 'function') {
    return;
  }

  activeTemplateId = normalizeHostOverlayTemplateId(templateParams);
  onHiddenChange = hiddenChangeHandler;
  lastHidden = null;

  runDetectionAndNotify();

  if (typeof MutationObserver === 'function' && document.documentElement) {
    observer = new MutationObserver((mutations) => {
      if (shouldIgnoreMutationsFromOurOverlay(mutations)) {
        return;
      }
      scheduleDetection();
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'],
    });
  }

  fallbackIntervalId = setInterval(runDetectionAndNotify, FALLBACK_TICK_MS);
}

export function stopHostOverlayHidePoll() {
  clearHostOverlayWatchers();
  activeTemplateId = null;
  onHiddenChange = null;
  lastHidden = null;
}
