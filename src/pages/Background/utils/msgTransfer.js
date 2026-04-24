import { padoExtensionVersion } from '@/config/constants';
import { sendMsgToTab } from './utils.js';
import { getSdkAttestationSession } from '../padoZKAttestationJSSDK/sessionStorage.js';

/* global chrome, console, URL */

export function createTabMessageSender(targetTabId) {
  return async (msg) => {
    if (targetTabId == null) return;
    await sendMsgToTab(targetTabId, msg);
  };
}

export async function captureSdkTabMessageSender(targetTabId) {
  const session = await getSdkAttestationSession();
  const dappTabId = targetTabId ?? session?.ownerTabId;
  return createTabMessageSender(dappTabId);
}
/**
 * Send initAttestationRes message to the dapp tab (used by algorithm and index).
 * Gets domain from tab URL, then sends message.
 */
export async function sendInitAttestationRes(targetTabId) {
  const session = await getSdkAttestationSession();
  const dappTabId = targetTabId ?? session?.ownerTabId;
  const sendToTab = createTabMessageSender(dappTabId);
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

  await sendToTab({
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
