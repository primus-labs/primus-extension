/** Shared SDK bridge policy for content script and background. */

export const CLIENT_TYPE_ZKTLS = '@primuslabs/zktls-js-sdk';
export const CLIENT_TYPE_NETWORK = '@primuslabs/network-js-sdk';

export const PADO_EXTENSION_TARGET = 'padoExtension';

export const ALLOWED_CLIENT_TYPES = new Set([
  CLIENT_TYPE_ZKTLS,
  CLIENT_TYPE_NETWORK,
]);

/**
 * Non-production builds may merge extra client types from webpack-injected
 * `secrets.<NODE_ENV>.js` → `SDK_EXTRA_CLIENT_TYPES` (see secrets.development.js.example).
 */
// eslint-disable-next-line no-undef
const bundledSdkExtraClientTypes = /** @type {string[]} */ (
  typeof __SDK_EXTRA_CLIENT_TYPES__ !== 'undefined' ? __SDK_EXTRA_CLIENT_TYPES__ : []
);

let cachedEffectiveAllowedClientTypes;

export function getEffectiveAllowedClientTypes() {
  if (cachedEffectiveAllowedClientTypes) {
    return cachedEffectiveAllowedClientTypes;
  }
  const set = new Set(ALLOWED_CLIENT_TYPES);
  if (process.env.NODE_ENV !== 'production') {
    bundledSdkExtraClientTypes.forEach((entry) => {
      if (typeof entry === 'string' && entry.trim()) {
        set.add(entry.trim());
      }
    });
  }
  cachedEffectiveAllowedClientTypes = set;
  return set;
}

export const SDK_INBOUND_MESSAGE_NAMES = [
  'initAttestation',
  'startAttestation',
  'getAttestationResult',
  'getAttestationResultTimeout',
  'closeDataSourceTab',
  'removeActiveAttestation',
];

const SDK_INBOUND_MESSAGE_NAME_SET = new Set(SDK_INBOUND_MESSAGE_NAMES);

export function isAllowedSdkInboundMessageName(name) {
  return typeof name === 'string' && SDK_INBOUND_MESSAGE_NAME_SET.has(name);
}

export function isPlainPayloadObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isAllowedClientType(clientType) {
  return (
    typeof clientType === 'string' && getEffectiveAllowedClientTypes().has(clientType)
  );
}

export function isNetworkClientType(clientType) {
  return clientType === CLIENT_TYPE_NETWORK;
}

/**
 * @param {{ ownerTabId?: number | null, bridgeInitialized?: boolean, clientType?: string } | null | undefined} session
 * @param {number | null | undefined} senderTabId
 * @returns {{ ok: true } | { ok: false, code: string, reason: string }}
 */
export function validateOwnerSession(session, senderTabId) {
  if (senderTabId == null) {
    return { ok: false, code: '00003', reason: 'noSenderTab' };
  }
  if (session?.ownerTabId == null || session.ownerTabId !== senderTabId) {
    return { ok: false, code: '00003', reason: 'ownerTabId' };
  }
  return { ok: true };
}

export function validateInitBeforeStart(session) {
  if (session?.bridgeInitialized !== true) {
    return { ok: false, code: '00005', reason: 'initRequired' };
  }
  return { ok: true };
}

export function validateAllowedClientType(clientType) {
  if (!isAllowedClientType(clientType)) {
    return { ok: false, code: '00005', reason: 'clientType' };
  }
  return { ok: true };
}

export function validateClientTypeMatchesSession(session, clientType) {
  if (session?.clientType && clientType !== session.clientType) {
    return { ok: false, code: '00005', reason: 'clientTypeMismatch' };
  }
  return { ok: true };
}

/**
 * @param {MessageEvent} event
 * @returns {boolean}
 */
export function isValidSdkInboundPostMessage(event) {
  if (typeof window !== 'undefined' && event.source !== window) {
    return false;
  }
  if (!isPlainPayloadObject(event.data)) {
    return false;
  }
  const { target, name, params } = event.data;
  if (target !== PADO_EXTENSION_TARGET) {
    return false;
  }
  if (!isAllowedSdkInboundMessageName(name)) {
    return false;
  }
  if (params !== undefined && !isPlainPayloadObject(params)) {
    return false;
  }
  return true;
}