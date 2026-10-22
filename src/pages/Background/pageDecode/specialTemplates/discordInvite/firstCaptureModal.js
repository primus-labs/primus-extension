import { getPageDecodeState } from '../../state.js';
import { sendMsgToDataSourcePage } from '../../sdkBridge.js';
import { shouldDeferModalUntilFirstCapture } from './templateId.js';

/**
 * @param {{ activeTemplate?: object; firstConfiguredRequestCaptured?: boolean } | null | undefined} state
 * @returns {boolean}
 */
export function isFirstConfiguredRequestCaptured(state) {
  if (!shouldDeferModalUntilFirstCapture(state?.activeTemplate)) {
    return true;
  }
  return state?.firstConfiguredRequestCaptured === true;
}

/** Notify content script once the first configured request URL is captured. */
export async function markFirstConfiguredRequestCapturedIfNeeded() {
  const { state } = getPageDecodeState();
  if (!shouldDeferModalUntilFirstCapture(state.activeTemplate)) {
    return;
  }
  if (state.firstConfiguredRequestCaptured) {
    return;
  }
  state.firstConfiguredRequestCaptured = true;
  await sendMsgToDataSourcePage({
    type: 'pageDecode',
    name: 'firstTemplateRequestCaptured',
  });
}
