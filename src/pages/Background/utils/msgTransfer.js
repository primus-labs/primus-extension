import { padoExtensionVersion } from '@/config/constants';

/* global chrome, console, URL */
/**
 * Send initAttestationRes message to the dapp tab (used by algorithm and index).
 * Gets domain from tab URL, then sends message.
 */
export async function sendInitAttestationRes() {
  const { padoZKAttestationJSSDKDappTabId: dappTabId } =
        await chrome.storage.local.get(['padoZKAttestationJSSDKDappTabId']);
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

  chrome.tabs.sendMessage(dappTabId, {
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
