/**
 * Page decode content script entry: inject container, send initCompleted, render PadoCard on append.
 * Reuses a single React root to avoid repeated createRoot/unmount and listener churn.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createDomElement } from './utils';
import PadoCard from './App';
import { injectFont } from './utils';
import { CONTAINER_ID, DISABLED_PATH_LIST, SESSION_KEYS } from './constants';

import './index.scss';

let activeRequest = null;
let rootRef = null;

function isDisabledPath() {
  const href = window.location.href.toLowerCase();
  return DISABLED_PATH_LIST.some((p) => href.indexOf(p) > -1);
}

/**
 * Host SPAs may replace body or remove injected nodes; React then crashes with
 * insertBefore NotFoundError. Re-create the mount node and reset the root.
 */
function ensurePageDecodeContainer() {
  let container = document.getElementById(CONTAINER_ID);
  if (container && document.body.contains(container)) {
    return container;
  }
  try {
    if (rootRef) {
      rootRef.unmount();
    }
  } catch (_e) {
    /* ignore */
  }
  rootRef = null;
  if (container && !document.body.contains(container)) {
    try {
      container.remove();
    } catch (_e) {
      /* ignore */
    }
  }
  container = createDomElement(`<div id="${CONTAINER_ID}"></div>`);
  document.body.appendChild(container);
  return container;
}

ensurePageDecodeContainer();

chrome.runtime.sendMessage(
  {
    type: 'pageDecode',
    name: 'initCompleted',
  },
  (response) => {
    if (!response || response.name !== 'append') return;
    if (isDisabledPath()) return;

    if (activeRequest) {
      if (response.isReady) {
        sessionStorage.setItem(SESSION_KEYS.READY, '1');
      }
      return;
    }

    const params = response.params || {};
    activeRequest = { ...params };
    delete activeRequest.PADOSERVERURL;
    delete activeRequest.padoExtensionVersion;

    const container = ensurePageDecodeContainer();
    if (!rootRef) {
      rootRef = createRoot(container);
    }
    rootRef.render(<PadoCard activeRequest={activeRequest} />);
  }
);

// Defer font load to avoid blocking first paint
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => injectFont(), { timeout: 500 });
} else {
  setTimeout(injectFont, 0);
}
