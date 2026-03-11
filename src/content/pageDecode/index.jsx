/**
 * Page decode content script entry: inject container, send initCompleted, render PadoCard on append.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createDomElement } from './utils';
import PadoCard from './App';
import { injectFont } from './utils';

import './index.scss';

const CONTAINER_ID = 'pado-extension-content';
const DISABLED_PATH_LIST = ['login', 'register', 'signin', 'signup'];

let activeRequest = null;

function isDisabledPath() {
  const href = window.location.href.toLowerCase();
  return DISABLED_PATH_LIST.some((p) => href.indexOf(p) > -1);
}

const injectEl = createDomElement(`<div id="${CONTAINER_ID}"></div>`);
document.body.appendChild(injectEl);

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
        sessionStorage.setItem('padoAttestRequestReady', '1');
      }
      return;
    }

    const params = response.params || {};
    activeRequest = { ...params };
    delete activeRequest.PADOSERVERURL;
    delete activeRequest.padoExtensionVersion;

    const container = document.getElementById(CONTAINER_ID);
    if (container) {
      const root = createRoot(container);
      root.render(<PadoCard activeRequest={activeRequest} />);
    }
  }
);

injectFont();
