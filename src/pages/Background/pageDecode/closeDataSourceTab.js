/**
 * Programmatically close the SDK data source tab without user-cancel semantics.
 */
import { getPageDecodeState } from './state';
import { removeWebRequestListener } from './requestInterceptor';
import { getSdkAttestationSession } from '../padoZKAttestationJSSDK/sessionStorage.js';

async function focusSdkOwnerTab() {
  try {
    const session = await getSdkAttestationSession();
    const dappTabId = session?.ownerTabId != null ? Number(session.ownerTabId) : NaN;
    if (Number.isFinite(dappTabId)) {
      await chrome.tabs.update(dappTabId, { active: true });
    }
  } catch (err) {
    console.log('closeSdkDataSourceTabWithoutCancel focus error:', err);
  }
}

export async function cleanupPageDecodeWithoutCancel() {
  const pageDecodeState = getPageDecodeState();
  const { state } = pageDecodeState;
  const deleteTabId = state.dataSourcePageTabId;
  if (deleteTabId) {
    state.skipCancelOnNextDataSourceTabRemoved = true;
    try {
      await chrome.tabs.remove(deleteTabId);
    } catch (e) {
      state.skipCancelOnNextDataSourceTabRemoved = false;
      console.log('closeSdkDataSourceTabWithoutCancel remove error:', e);
    }
  }

  removeWebRequestListener();
  state.dataSourcePageTabId = null;
  state.skipCancelOnNextDataSourceTabRemoved = false;
  await focusSdkOwnerTab();
  pageDecodeState.reset();
}

export async function closeSdkDataSourceTabWithoutCancel() {
  await cleanupPageDecodeWithoutCancel();
}
