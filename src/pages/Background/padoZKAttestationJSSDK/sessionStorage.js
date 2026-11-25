import {
  SDK_START_ATTESTATION_LOCK_REQUEST_ID_KEY,
  SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
  SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
  SDK_ATTESTATION_PRESET_KEY,
  SDK_ATTESTATION_SESSION_KEY,
} from '@/config/constants';
import { safeStorageGet, safeStorageRemove, safeStorageSet } from '@/utils/safeStorage';
import { safeJsonParse } from '@/utils/utils';
import { withSdkSessionOwnershipLock } from './sessionOwnershipLock.js';

export const LEGACY_SDK_ATTESTATION_SESSION_KEYS = [
  'padoZKAttestationJSSDKBeginAttest',
  'padoZKAttestationJSSDKDappTabId',
  'padoZKAttestationJSSDKClientType',
];

export const LEGACY_SDK_ATTESTATION_PRESET_KEYS = [
  'padoZKAttestationJSSDKAttestationPresetParams',
];

export const SDK_ATTESTATION_SESSION_STORAGE_KEYS = [
  SDK_ATTESTATION_SESSION_KEY,
  ...LEGACY_SDK_ATTESTATION_SESSION_KEYS,
];

export const SDK_ATTESTATION_PRESET_STORAGE_KEYS = [
  SDK_ATTESTATION_PRESET_KEY,
  ...LEGACY_SDK_ATTESTATION_PRESET_KEYS,
];

export const SDK_ATTESTATION_RESULT_CACHE_KEYS = [
  'getAttestationResultRes',
  'attestationLogInQuery',
];

export const SDK_ATTESTATION_RUNTIME_STORAGE_KEYS = [
  SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
  SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
  SDK_START_ATTESTATION_LOCK_REQUEST_ID_KEY,
  'activeRequestAttestation',
  ...SDK_ATTESTATION_RESULT_CACHE_KEYS,
];

export function getSdkAttestationSessionFromStorage(storage = {}) {
  const sessionValue = storage?.[SDK_ATTESTATION_SESSION_KEY];
  const session =
    sessionValue && typeof sessionValue === 'object' && !Array.isArray(sessionValue)
      ? sessionValue
      : null;

  const ownerTabId =
    session?.ownerTabId ?? storage?.padoZKAttestationJSSDKDappTabId ?? null;
  const clientType =
    session?.clientType ?? storage?.padoZKAttestationJSSDKClientType ?? '';
  const sdkVersion =
    session?.sdkVersion ?? storage?.padoZKAttestationJSSDKBeginAttest ?? '';
  const active =
    session?.active ??
    Boolean(ownerTabId != null || clientType || sdkVersion);

  if (!active && ownerTabId == null && !clientType && !sdkVersion) {
    return null;
  }

  return {
    ownerTabId,
    clientType,
    sdkVersion,
    active: Boolean(active),
  };
}

export async function getSdkAttestationSession() {
  const storage = await safeStorageGet(SDK_ATTESTATION_SESSION_STORAGE_KEYS);
  return getSdkAttestationSessionFromStorage(storage);
}

export async function setSdkAttestationSession(session) {
  await safeStorageSet({
    [SDK_ATTESTATION_SESSION_KEY]: session,
  });
}

export async function clearSdkAttestationSession() {
  await safeStorageRemove([
    SDK_ATTESTATION_SESSION_KEY,
    ...LEGACY_SDK_ATTESTATION_SESSION_KEYS,
  ]);
}

export function getSdkAttestationPresetFromStorage(storage = {}) {
  const presetValue =
    storage?.[SDK_ATTESTATION_PRESET_KEY] ??
    storage?.padoZKAttestationJSSDKAttestationPresetParams;

  if (presetValue == null || presetValue === '') return null;
  if (typeof presetValue === 'object') return presetValue;
  return safeJsonParse(presetValue, null);
}

export async function getSdkAttestationPreset() {
  const storage = await safeStorageGet(SDK_ATTESTATION_PRESET_STORAGE_KEYS);
  return getSdkAttestationPresetFromStorage(storage);
}

export async function setSdkAttestationPreset(preset) {
  await safeStorageSet({
    [SDK_ATTESTATION_PRESET_KEY]: preset,
  });
}

export async function clearSdkAttestationPreset() {
  await safeStorageRemove([
    SDK_ATTESTATION_PRESET_KEY,
    ...LEGACY_SDK_ATTESTATION_PRESET_KEYS,
  ]);
}

export async function clearSdkAttestationResultCache() {
  await safeStorageRemove(SDK_ATTESTATION_RESULT_CACHE_KEYS);
}

export async function clearSdkAttestationRuntimeState(options = {}) {
  const runtimeKeys = options.preserveActiveRequest
    ? SDK_ATTESTATION_RUNTIME_STORAGE_KEYS.filter(
        (key) => key !== 'activeRequestAttestation'
      )
    : SDK_ATTESTATION_RUNTIME_STORAGE_KEYS;
  await safeStorageRemove(runtimeKeys);
  await clearSdkAttestationSession();
  await clearSdkAttestationPreset();
}

/**
 * Serializes full runtime cleanup with init/start ownership changes.
 * Use the unlocked variant only when the caller already holds this lock.
 */
export async function clearSdkAttestationRuntimeStateWithLock() {
  await withSdkSessionOwnershipLock(clearSdkAttestationRuntimeState);
}

/**
 * Atomically snapshots and clears a request only while it owns the start lock.
 * @param {unknown} requestId
 * @param {{
 *   preserveActiveRequest?: boolean;
 *   onCleared?: (result: {
 *     cleared: true;
 *     session: ReturnType<typeof getSdkAttestationSessionFromStorage>;
 *     preset: ReturnType<typeof getSdkAttestationPresetFromStorage>;
 *   }) => Promise<void> | void;
 * }} [options]
 * @returns {Promise<{
 *   cleared: boolean;
 *   session: ReturnType<typeof getSdkAttestationSessionFromStorage>;
 *   preset: ReturnType<typeof getSdkAttestationPresetFromStorage>;
 *   activeRequestAttestation?: unknown;
 *   getAttestationResultRes?: unknown;
 * }>}
 */
export async function teardownSdkAttestationRuntimeStateForRequest(
  requestId,
  options = {}
) {
  const notCleared = {
    cleared: false,
    session: null,
    preset: null,
    activeRequestAttestation: undefined,
    getAttestationResultRes: undefined,
  };
  if (typeof requestId !== 'string' || requestId === '') return notCleared;

  return withSdkSessionOwnershipLock(async () => {
    const storage = await safeStorageGet([
      SDK_START_ATTESTATION_LOCK_REQUEST_ID_KEY,
      ...SDK_ATTESTATION_SESSION_STORAGE_KEYS,
      ...SDK_ATTESTATION_PRESET_STORAGE_KEYS,
      'activeRequestAttestation',
      'getAttestationResultRes',
    ]);
    if (storage?.[SDK_START_ATTESTATION_LOCK_REQUEST_ID_KEY] !== requestId) {
      return notCleared;
    }
    const result = {
      cleared: true,
      session: getSdkAttestationSessionFromStorage(storage),
      preset: getSdkAttestationPresetFromStorage(storage),
      activeRequestAttestation: storage.activeRequestAttestation,
      getAttestationResultRes: storage.getAttestationResultRes,
    };
    await clearSdkAttestationRuntimeState(options);
    if (typeof options.onCleared === 'function') {
      try {
        await options.onCleared(result);
      } catch (error) {
        console.error('SDK attestation teardown side effect failed:', error);
      }
    }
    return result;
  });
}

/**
 * Clears an asynchronous request only while it still owns the start lock.
 * @param {unknown} requestId
 * @returns {Promise<boolean>}
 */
export async function clearSdkAttestationRuntimeStateForRequest(requestId) {
  const result = await teardownSdkAttestationRuntimeStateForRequest(requestId);
  return result.cleared;
}
