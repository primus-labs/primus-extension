/**
 * Programmatically close the SDK data source tab without user-cancel semantics.
 */
import { getPageDecodeState } from './state';
import { getSdkAttestationSession } from '../padoZKAttestationJSSDK/sessionStorage.js';

export async function closeSdkDataSourceTabWithoutCancel() {
  const pageDecodeState = getPageDecodeState();
  const { state } = pageDecodeState;
  const deleteTabId = state.dataSourcePageTabId;
  if (!deleteTabId) return;

  state.skipCancelOnNextDataSourceTabRemoved = true;
  try {
    await chrome.tabs.remove(deleteTabId);
  } catch (e) {
    state.skipCancelOnNextDataSourceTabRemoved = false;
    console.log('closeSdkDataSourceTabWithoutCancel remove error:', e);
    return;
  }
  // Focus the DApp / SDK host tab (e.g. dev-console), not currExtentionId (may be extension UI).
  try {
    const session = await getSdkAttestationSession();
    const dappTabId = session?.ownerTabId != null ? Number(session.ownerTabId) : NaN;
    if (Number.isFinite(dappTabId)) {
      await chrome.tabs.update(dappTabId, { active: true });
    }
  } catch (err) {
    console.log('closeSdkDataSourceTabWithoutCancel focus error:', err);
  }
  pageDecodeState.reset();
}
