/**
 * Page decode message router: dispatches init, initCompleted, start, close, cancel, end, interceptionFail, timeout.
 */
import { PADOSERVERURL } from '@/config/envConstants';
import { padoExtensionVersion } from '@/config/constants';
import { getPageDecodeState } from './state';
import {
  setupWebRequestListener,
  removeWebRequestListener,
  checkWebRequestIsReady,
} from './requestInterceptor';
import {
  sendMsgToDataSourcePage,
  handlerForSdk,
  handleTargetDataMissing,
  handleDataSourcePageDialogTimeout,
} from './sdkBridge';
import { safeStorageGet, safeStorageSet } from '@/utils/safeStorage';
import { safeJsonParse } from '@/utils/utils';
import { startKeepAlive } from '../utils/keepAlive.js';

function handleEnd(request) {
  const pageDecodeState = getPageDecodeState();
  const { state } = pageDecodeState;
  if (state.dataSourcePageTabId) {
    sendMsgToDataSourcePage(request);
    removeWebRequestListener();
    pageDecodeState.reset();
  }
}

async function handleClose(params, processAlgorithmReq) {
  const pageDecodeState = getPageDecodeState();
  const { state } = pageDecodeState;
  console.log('pageDecode-close');
  const deleteTabId = params?.tabId ?? state.dataSourcePageTabId;
  console.log('pageDecode-close-tabId', params?.tabId, state.dataSourcePageTabId);
  if (deleteTabId) {
    try {
      await chrome.tabs.remove(deleteTabId);
    } catch (e) {
      console.log('chrome.tabs.remove error:', e);
    }
  }
  console.log('pageDecode-close-currExtentionId', state.currExtentionId);
  try {
    if (state.currExtentionId) {
      await chrome.tabs.update(state.currExtentionId, { active: true });
    }
  } catch (error) {
    console.log('chrome.tabs.update error:', error);
  }
  pageDecodeState.reset();
  await handlerForSdk(processAlgorithmReq, 'cancel');
}

export async function pageDecodeMsgListener(
  request,
  sender,
  sendResponse,
  hasGetTwitterScreenName,
  processAlgorithmReq
) {
  let responded = false;
  const respond = (payload) => {
    if (responded) return;
    responded = true;
    try {
      if (typeof sendResponse === 'function') {
        sendResponse(payload);
      }
    } catch (_e) {
      // Channel already closed or invalid
    }
  };

  const { name, params } = request;
  const pageDecodeState = getPageDecodeState();
  const { state } = pageDecodeState;

  console.log('pageDecodeMsgListener');

  if (name === 'init') {
    state.activeTemplate = params || {};
    pageDecodeState.reset();
  }

  if (state.activeTemplate?.dataSource) {
    const { jumpTo } = state.activeTemplate;

    if (name === 'init') {
      const { configMap } = await safeStorageGet(['configMap']);
      if (configMap) {
        const configMapParsed = safeJsonParse(configMap);
        const PRE_ATTEST_PROMOTStr = configMapParsed?.PRE_ATTEST_PROMOT_V2;
        if (PRE_ATTEST_PROMOTStr) {
          const parsed = safeJsonParse(PRE_ATTEST_PROMOTStr);
          if (parsed) state.PRE_ATTEST_PROMOT_V2 = parsed;
        }
      }

      state.operationType = request.operation;
      const currentWindowTabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      state.currExtentionId = currentWindowTabs[0]?.id;

      removeWebRequestListener();

      const tabCreatedByPado = await chrome.tabs.create({ url: jumpTo });
      state.dataSourcePageTabId = tabCreatedByPado.id;
      console.log('pageDecode dataSourcePageTabId:', state.dataSourcePageTabId);

      setupWebRequestListener();

      const injectFn = async () => {
        await chrome.scripting.executeScript({
          target: { tabId: state.dataSourcePageTabId },
          files: ['pageDecode.bundle.js'],
        });
        await chrome.scripting.insertCSS({
          target: { tabId: state.dataSourcePageTabId },
          files: ['static/css/pageDecode.css'],
        });
      };

      await checkWebRequestIsReady();
      let injectDebounceTimer = null;
      chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (
          tabId === state.dataSourcePageTabId &&
          (changeInfo.url || changeInfo.title)
        ) {
          clearTimeout(injectDebounceTimer);
          injectDebounceTimer = setTimeout(async () => {
            await injectFn();
            await checkWebRequestIsReady();
          }, 300);
        }
      });

      chrome.tabs.onRemoved.addListener(async (tabId) => {
        if (tabId === state.dataSourcePageTabId) {
          chrome.runtime.sendMessage({ type: 'pageDecode', name: 'stop' });
          state.dataSourcePageTabId = null;
          await handlerForSdk(processAlgorithmReq, 'cancel');
          removeWebRequestListener();
        }
      });

      await injectFn();
    }

    if (name === 'initCompleted') {
      console.log('content_scripts-bg-decode receive:initCompleted');
      respond({
        name: 'append',
        params: {
          ...state.activeTemplate,
          PADOSERVERURL,
          padoExtensionVersion,
          PRE_ATTEST_PROMOT_V2: state.PRE_ATTEST_PROMOT_V2,
          tabId: state.dataSourcePageTabId,
        },
        dataSourcePageTabId: state.dataSourcePageTabId,
        isReady: state.isReadyRequest,
        operation: state.operationType,
      });
      await checkWebRequestIsReady();
    }

    if (name === 'start') {
      startKeepAlive();
      const aligorithmParams = Object.assign(
        { isUserClick: 'true' },
        state.formatAlgorithmParams
      );
      const { padoZKAttestationJSSDKClientType: clientType } =
        await safeStorageGet(['padoZKAttestationJSSDKClientType']);
      const getAttestationParams = {
        ...aligorithmParams,
        clientType: clientType || '',
      };
      await safeStorageSet({
        beginAttest: '1',
        activeRequestAttestation: JSON.stringify(aligorithmParams),
      });
      console.log('pageDecode-algorithmParams', aligorithmParams);
      chrome.runtime.sendMessage({
        type: 'algorithm',
        method: 'getAttestation',
        params: getAttestationParams,
      });
    }

    if (name === 'close' || name === 'cancel') {
      await handleClose(params, processAlgorithmReq);
    }
    if (name === 'end') {
      handleEnd(request);
    }
    if (name === 'interceptionFail') {
      const { padoZKAttestationJSSDKBeginAttest } =
        await safeStorageGet(['padoZKAttestationJSSDKBeginAttest']);
      await handleTargetDataMissing(
        padoZKAttestationJSSDKBeginAttest
          ? {}
          : { skipRemoveActiveRequestAttestation: true }
      );
    }
    if (name === 'dataSourcePageDialogTimeout') {
      await handleDataSourcePageDialogTimeout(processAlgorithmReq);
    }
  } else {
    if (name === 'close' || name === 'cancel') {
      await handleClose(params, processAlgorithmReq);
    }
    if (name === 'interceptionFail') {
      const { padoZKAttestationJSSDKBeginAttest } =
        await safeStorageGet(['padoZKAttestationJSSDKBeginAttest']);
      await handleTargetDataMissing(
        padoZKAttestationJSSDKBeginAttest
          ? {}
          : { skipRemoveActiveRequestAttestation: true }
      );
    }
    if (name === 'dataSourcePageDialogTimeout') {
      await handleDataSourcePageDialogTimeout(processAlgorithmReq);
    }
    if (name === 'end') {
      handleEnd(request);
    }
  }

  if (!responded) respond({ ok: true });
}
