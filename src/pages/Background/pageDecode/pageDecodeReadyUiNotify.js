/**
 * Push isReady to the data-source tab when content may miss webRequestIsReady (reload / late inject).
 */
/* global console, setTimeout, Promise */
import { sendMsgToDataSourcePage } from './sdkBridge.js';
import {
  matches as matchesGoogleEmailTemplate,
  logGoogleEmail,
} from './specialTemplates/specialTemplateGoogleEmail.js';

const UI_SYNC_NOTIFY_ATTEMPTS = 8;
const UI_SYNC_NOTIFY_DELAY_MS = 250;

/**
 * @param {{ isReadyRequest?: boolean; phase?: string; pageDecodeReadyUiNotified?: boolean }} state
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<boolean>}
 */
export async function notifyPageDecodeReadyUi(state, options = {}) {
  if (!state?.isReadyRequest) {
    return false;
  }
  if (state.pageDecodeReadyUiNotified && !options.force) {
    return true;
  }

  const msg = {
    type: 'pageDecode',
    name: 'pageDecodeReadyUiSync',
    isReady: true,
    phase: state.phase,
  };
  const googleDebug = matchesGoogleEmailTemplate(state?.activeTemplate);
  for (let attempt = 0; attempt < UI_SYNC_NOTIFY_ATTEMPTS; attempt++) {
    const ok = await sendMsgToDataSourcePage(msg);
    if (ok) {
      state.pageDecodeReadyUiNotified = true;
      if (googleDebug) {
        logGoogleEmail('notifyPageDecodeReadyUi:ok', { attempt });
      }
      return true;
    }
    if (googleDebug) {
      logGoogleEmail('notifyPageDecodeReadyUi:retry', {
        attempt,
        dataSourcePageTabId: state.dataSourcePageTabId,
      });
    }
    if (attempt < UI_SYNC_NOTIFY_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, UI_SYNC_NOTIFY_DELAY_MS));
    }
  }
  console.warn('[pageDecode] pageDecodeReadyUiSync notify failed');
  if (googleDebug) {
    logGoogleEmail('notifyPageDecodeReadyUi:failed', {
      attempts: UI_SYNC_NOTIFY_ATTEMPTS,
      dataSourcePageTabId: state.dataSourcePageTabId,
    });
  }
  return false;
}
