/**
 * Web request capture for dev console: capture XHR/fetch from data source tab, re-send and forward response.
 */
import { customFetch2 } from '../utils/request';
import { getDevconsoleState } from './state';

let onBeforeSendHeadersFn = () => {};
let onBeforeRequestFn = () => {};

function sendMsgToDevconsole(msg) {
  const state = getDevconsoleState();
  if (state.devconsoleTabId) {
    chrome.tabs.sendMessage(state.devconsoleTabId, msg);
  }
}

async function removeFromRequestsMap(requestId) {
  const state = getDevconsoleState();
  delete state.requestsMap[requestId];
}

async function storeInRequestsMap(requestId, urlInfo) {
  const state = getDevconsoleState();
  const last = state.requestsMap[requestId] || {};
  const urlInfoHeaders = urlInfo?.headers;
  if (
    urlInfoHeaders &&
    (urlInfoHeaders?.['Content-Type']?.includes('text/plain') ||
      urlInfoHeaders?.['content-type']?.includes('text/plain')) &&
    last.body
  ) {
    urlInfo.body = JSON.stringify(last.body);
  }
  state.requestsMap[requestId] = { ...last, ...urlInfo };
  return state.requestsMap[requestId];
}

async function extraRequestFn(params) {
  try {
    const requestParams = { ...params };
    delete requestParams.locationPageUrl;
    delete requestParams.requestId;
    const requestRes = await customFetch2(requestParams);
    if (typeof requestRes === 'object' && requestRes !== null) {
      // Redact headers only for devconsole; keep original fields (e.g. requestId) — not from requestParams
      const requestForDevconsole = { ...params };
      delete requestForDevconsole.header;
      delete requestForDevconsole.headers;
      sendMsgToDevconsole({
        type: 'devconsole',
        name: 'checkDataSourceRes',
        params: { request: requestForDevconsole, response: requestRes },
      });
    }
  } catch (e) {
    console.log('fetch custom request error', e);
  }
}

/**
 * Attach webRequest listeners for the data source tab. Mutates module-level listener refs for removal.
 */
export function setupRequestCapture() {
  const state = getDevconsoleState();
  const checkDataSourcePageTabId = state.checkDataSourcePageTabId;

  onBeforeSendHeadersFn = async (details) => {
    const {
      url: currRequestUrl,
      requestHeaders,
      method,
      type,
      tabId,
      requestId,
      initiator,
    } = details;
    if (initiator?.startsWith(`chrome-extension://${chrome.runtime.id}`))
      return;
    if (![-1, checkDataSourcePageTabId].includes(tabId)) return;
    if (!['xmlhttprequest', 'fetch'].includes(type) || method === 'OPTIONS')
      return;

    let locationPageUrl = '';
    const formatHeader = requestHeaders.reduce((prev, curr) => {
      prev[curr.name] = curr.value;
      if (curr.name === 'Referer') locationPageUrl = curr.value;
      return prev;
    }, {});

    const dataSourceRequestsObj = await storeInRequestsMap(requestId, {
      header: formatHeader,
      headers: formatHeader,
      method,
      locationPageUrl,
      checkDataSourcePageTabUrl: state.checkDataSourcePageTabUrl,
      url: currRequestUrl,
      requestId,
    });
    await extraRequestFn({ ...dataSourceRequestsObj });
  };

  onBeforeRequestFn = async (subDetails) => {
    const {
      requestBody,
      type,
      tabId,
      method,
      requestId,
      initiator,
    } = subDetails;
    await removeFromRequestsMap(requestId);
    if (initiator?.startsWith(`chrome-extension://${chrome.runtime.id}`))
      return;
    if (![-1, checkDataSourcePageTabId].includes(tabId)) return;
    if (!['xmlhttprequest', 'fetch'].includes(type) || method === 'OPTIONS')
      return;

    if (requestBody?.raw?.[0]?.bytes) {
      const byteArray = new Uint8Array(requestBody.raw[0].bytes);
      const bodyText = new TextDecoder().decode(byteArray);
      await storeInRequestsMap(requestId, { body: JSON.parse(bodyText) });
    }
    if (requestBody?.formData) {
      await storeInRequestsMap(requestId, {
        body: requestBody.formData,
        isFormData: true,
      });
    }
  };

  chrome.webRequest.onBeforeSendHeaders.addListener(
    onBeforeSendHeadersFn,
    { urls: ['<all_urls>'], types: ['xmlhttprequest'] },
    ['requestHeaders', 'extraHeaders']
  );
  chrome.webRequest.onBeforeRequest.addListener(
    onBeforeRequestFn,
    { urls: ['<all_urls>'], types: ['xmlhttprequest'] },
    ['requestBody']
  );
}

/** Remove webRequest listeners. */
export function removeRequestCapture() {
  chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeadersFn);
  chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestFn);
  onBeforeSendHeadersFn = () => {};
  onBeforeRequestFn = () => {};
}
