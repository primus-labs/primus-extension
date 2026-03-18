import { padoExtensionVersion } from '@/config/constants';
import { safeStorageGet } from '@/utils/safeStorage';
import { sendMsgToTab } from './utils.js';

/* global chrome, console, URL */
/**
 * Send initAttestationRes message to the dapp tab (used by algorithm and index).
 * Gets domain from tab URL, then sends message.
 */
export async function sendInitAttestationRes() {
  const { padoZKAttestationJSSDKDappTabId: dappTabId } =
        await safeStorageGet(['padoZKAttestationJSSDKDappTabId']);
  const attestationTypeIdList = [];

  let domain = '';
  try {
    const tab = await chrome.tabs.get(dappTabId);
    if (tab?.url) {
      domain = new URL(tab.url).hostname || '';
    }
  } catch (e) {
    console.warn('get dapp tab domain failed', e);
  }

  await sendMsgToTab(dappTabId, {
    type: 'padoZKAttestationJSSDK',
    name: 'initAttestationRes',
    params: {
      result: true,
      data: {
        attestationTypeIdList,
        padoExtensionVersion,
        domain,
      },
    },
  });
}
