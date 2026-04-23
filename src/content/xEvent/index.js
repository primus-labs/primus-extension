/* global chrome, crypto, window */
/**
 * Bridge DApp window.postMessage <-> extension xEvent / xPage flow.
 * - Validates same-frame messages (e.source === window).
 * - Optional params.requestId (scheme A); otherwise generates UUID for correlation.
 */

const X_EVENT_RESULT_MAP = {
  followRes: {
    eventName: 'xEvent-follow-res',
  },
  repostRes: {
    eventName: 'xEvent-repost-res',
  },
};

function normalizeParams(params) {
  return params && typeof params === 'object' && !Array.isArray(params)
    ? params
    : {};
}

function resolveRequestId(params) {
  const raw = params?.requestId;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  if (typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `xevent_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function forwardToBackground(name, pageOriginTarget, rawParams) {
  const params = normalizeParams(rawParams);
  const requestId = resolveRequestId(params);
  const mergedParams = { ...params, requestId };
  chrome.runtime.sendMessage({
    type: 'xEvent',
    name,
    params: mergedParams,
    requestId,
    pageOriginTarget,
  });
}

window.addEventListener('message', (e) => {
  if (e.source !== window) {
    return;
  }
  const data = e.data;
  if (!data || typeof data !== 'object') {
    return;
  }
  const { target, origin, name, params } = data;
  if (target !== 'primusExtension') {
    return;
  }
  if (name === 'xEvent-follow') {
    forwardToBackground('follow', origin, params);
  } else if (name === 'xEvent-repost') {
    forwardToBackground('repost', origin, params);
  }
});

chrome.runtime.onMessage.addListener((message) => {
  const { type, name, params, pageOriginTarget } = message;
  if (type !== 'xEvent') {
    return;
  }
  if (!Object.prototype.hasOwnProperty.call(X_EVENT_RESULT_MAP, name)) {
    return;
  }
  if (typeof pageOriginTarget !== 'string' || !pageOriginTarget) {
    return;
  }
  window.postMessage({
    target: pageOriginTarget,
    origin: 'primusExtension',
    name: X_EVENT_RESULT_MAP[name].eventName,
    params: params || {},
  });
});
