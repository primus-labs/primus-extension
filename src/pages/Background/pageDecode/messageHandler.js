/* global chrome, console, clearTimeout, setTimeout */
/**
 * Page decode message router: dispatches init, initCompleted, start, close, cancel, end, interceptionFail, timeout.
 */
import { PADOSERVERURL } from '@/config/envConstants';
import { padoExtensionVersion } from '@/config/constants';
import { getPageDecodeState, PAGE_DECODE_PHASES } from './state';
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
import { applyAmazonSiteJumpToIfNeeded } from './specialTemplates/amazon';
import { applyAdditionParamsJumpUrlToJumpTo } from './additionParamsJumpUrl';
import { initJumpConfigState } from './jumpConfigRedirect';
import { resolveNoteV2MapFromConfigParsed } from '@/utils/attestationProcessNoteV2';
import { ensureExtensionUserIdentity } from '../identityBootstrap.js';
import { getSdkAttestationSession } from '../padoZKAttestationJSSDK/sessionStorage.js';
import { closeSdkDataSourceTabWithoutCancel } from './closeDataSourceTab.js';

const RESULT_CLOSE_DELAY_MS = {
  success: 3000,
  warn: 5000,
};

function buildUiResultSnapshot(state, requestParams = {}) {
  const result = requestParams?.result === 'success' ? 'success' : 'warn';
  return {
    result,
    failReason: requestParams?.failReason,
    closeAt: Date.now() + RESULT_CLOSE_DELAY_MS[result],
    requestid:
      state.formatAlgorithmParams?.requestid ||
      state.activeTemplate?.requestid ||
      null,
    tabId: state.dataSourcePageTabId,
  };
}

function getReplayableUiResultSnapshot(state) {
  const snapshot = state.uiResultSnapshot;
  if (!snapshot) return null;
  if (
    snapshot.tabId != null &&
    state.dataSourcePageTabId != null &&
    snapshot.tabId !== state.dataSourcePageTabId
  ) {
    return null;
  }
  const requestid =
    state.formatAlgorithmParams?.requestid ||
    state.activeTemplate?.requestid ||
    null;
  if (snapshot.requestid && requestid && snapshot.requestid !== requestid) {
    return null;
  }
  return snapshot;
}

function handleEnd(request) {
  const pageDecodeState = getPageDecodeState();
  const { state } = pageDecodeState;
  if (state.dataSourcePageTabId) {
    const uiResultSnapshot = buildUiResultSnapshot(state, request.params);
    state.uiResultSnapshot = uiResultSnapshot;
    sendMsgToDataSourcePage({
      ...request,
      params: {
        ...request.params,
        closeAt: uiResultSnapshot.closeAt,
      },
    });
    removeWebRequestListener();
  }
}

async function handleClose(params, processAlgorithmReq) {
  const pageDecodeState = getPageDecodeState();
  const { state } = pageDecodeState;
  console.log('pageDecode-close');
  const deleteTabId = params?.tabId ?? state.dataSourcePageTabId;
  const isCurrentSessionTabClose =
    deleteTabId != null && deleteTabId === state.dataSourcePageTabId;
  console.log('pageDecode-close-tabId', params?.tabId, state.dataSourcePageTabId);
  if (deleteTabId) {
    if (isCurrentSessionTabClose) {
      state.skipCancelOnNextDataSourceTabRemoved = true;
    }
    try {
      await chrome.tabs.remove(deleteTabId);
    } catch (e) {
      if (isCurrentSessionTabClose) {
        state.skipCancelOnNextDataSourceTabRemoved = false;
      }
      console.log('chrome.tabs.remove error:', e);
    }
  }

  // Ignore stale countdown-driven close from a previous attestation session.
  if (!isCurrentSessionTabClose) {
    return;
  }

  console.log('pageDecode-close-currExtentionId', state.currExtentionId);
  try {
    if (state.currExtentionId) {
      await chrome.tabs.update(state.currExtentionId, { active: true });
    }
  } catch (error) {
    console.log('chrome.tabs.update error:', error);
  }
  removeWebRequestListener();
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
    pageDecodeState.reset();
    state.activeTemplate = params || {};
    state.phase = PAGE_DECODE_PHASES.CAPTURING;
    state.skipCancelOnNextDataSourceTabRemoved = false;
  }

  if (state.activeTemplate?.dataSource) {
    if (name === 'init') {
      const { configMap } = await safeStorageGet(['configMap']);
      const configMapParsed = configMap ? safeJsonParse(configMap) : null;
      state.ATTESTATION_PROCESS_NOTE_V2 =
        resolveNoteV2MapFromConfigParsed(configMapParsed);
      if (configMapParsed) {
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

      await applyAmazonSiteJumpToIfNeeded(
        state.activeTemplate,
        state.currExtentionId
      );

      applyAdditionParamsJumpUrlToJumpTo(state.activeTemplate);

      initJumpConfigState(state.activeTemplate.jumpConfig ?? null);

      removeWebRequestListener();
      state.dataSourcePageTabId = null;
      setupWebRequestListener();

      const tabCreatedByPado = await chrome.tabs.create({
        url: state.activeTemplate.jumpTo,
      });
      state.dataSourcePageTabId = tabCreatedByPado.id;
      console.log('pageDecode dataSourcePageTabId:', state.dataSourcePageTabId);

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
      state.tabUpdatedListener = (tabId, changeInfo) => {
        if (
          tabId === state.dataSourcePageTabId &&
          (changeInfo.url || changeInfo.title)
        ) {
          if (state.injectDebounceTimer) {
            clearTimeout(state.injectDebounceTimer);
          }
          state.injectDebounceTimer = setTimeout(async () => {
            await injectFn();
            if (state.phase !== PAGE_DECODE_PHASES.ATTESTING) {
              await checkWebRequestIsReady();
            }
          }, 300);
        }
      };
      chrome.tabs.onUpdated.addListener(state.tabUpdatedListener);

      state.tabRemovedListener = async (tabId) => {
        if (tabId === state.dataSourcePageTabId) {
          const skipCancel = state.skipCancelOnNextDataSourceTabRemoved;
          state.skipCancelOnNextDataSourceTabRemoved = false;
          state.dataSourcePageTabId = null;
          removeWebRequestListener();
          if (!skipCancel) {
            chrome.runtime.sendMessage({ type: 'pageDecode', name: 'stop' });
            await handlerForSdk(processAlgorithmReq, 'cancel');
          }
          pageDecodeState.reset();
        }
      };
      chrome.tabs.onRemoved.addListener(state.tabRemovedListener);

      await injectFn();
    }

    if (name === 'initCompleted') {
      console.log('content_scripts-bg-decode receive:initCompleted');
      const uiResultSnapshot = getReplayableUiResultSnapshot(state);
      if (uiResultSnapshot && Date.now() >= uiResultSnapshot.closeAt) {
        await closeSdkDataSourceTabWithoutCancel();
        respond({ name: 'expired' });
        return;
      }
      respond({
        name: 'append',
        params: {
          ...state.activeTemplate,
          PADOSERVERURL,
          padoExtensionVersion,
          PRE_ATTEST_PROMOT_V2: state.PRE_ATTEST_PROMOT_V2,
          ATTESTATION_PROCESS_NOTE_V2: state.ATTESTATION_PROCESS_NOTE_V2,
          tabId: state.dataSourcePageTabId,
          pageDecodePhase: state.phase,
          resultSnapshot: uiResultSnapshot,
        },
        dataSourcePageTabId: state.dataSourcePageTabId,
        isReady: state.isReadyRequest,
        phase: state.phase,
        operation: state.operationType,
        resultSnapshot: uiResultSnapshot,
      });
      await checkWebRequestIsReady();
    }

    if (name === 'start') {
      if (state.startHandled) {
        respond({ ok: true });
        return;
      }
      state.startHandled = true;
      state.phase = PAGE_DECODE_PHASES.ATTESTING;
      removeWebRequestListener();
      startKeepAlive();
      const { userInfo } = await safeStorageGet(['userInfo']);
      if (!userInfo) {
        ensureExtensionUserIdentity().catch((err) => {
          console.log('ensureExtensionUserIdentity non-blocking error', err);
        });
      }
      const aligorithmParams = Object.assign(
        { isUserClick: 'true' },
        state.formatAlgorithmParams
      );
      const session = await getSdkAttestationSession();
      const getAttestationParams = {
        ...aligorithmParams,
        clientType: session?.clientType || '',
      };
      await safeStorageSet({
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
      const session = await getSdkAttestationSession();
      await handleTargetDataMissing(
        session?.sdkVersion
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
      const session = await getSdkAttestationSession();
      await handleTargetDataMissing(
        session?.sdkVersion
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
