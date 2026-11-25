import {
  SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
  SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
  SDK_ATTESTATION_PRESET_KEY,
  SDK_ATTESTATION_SESSION_KEY,
  SDK_INITIALIZED_SESSIONS_KEY,
} from '@/config/constants';
import { safeStorageGet, safeStorageRemove, safeStorageSet } from '@/utils/safeStorage';
import { safeJsonParse } from '@/utils/utils';
import {
  clearSdkFullLifecycle,
  clearSdkProofLifecycle,
  withSdkProofOwnershipLock,
} from './sessionLifecycle.js';

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

export function getSdkInitializationSessionsFromStorage(storage = {}) {
  const sessions = storage?.[SDK_INITIALIZED_SESSIONS_KEY];
  return sessions && typeof sessions === 'object' && !Array.isArray(sessions)
    ? sessions
    : {};
}

export async function getSdkInitializationSessions() {
  const storage = await safeStorageGet(SDK_INITIALIZED_SESSIONS_KEY);
  return getSdkInitializationSessionsFromStorage(storage);
}

export async function getSdkInitializationSession(tabId) {
  if (!Number.isInteger(tabId)) return null;

  const sessions = await getSdkInitializationSessions();
  return sessions[String(tabId)] || null;
}

export async function setSdkInitializationSession(session) {
  if (!Number.isInteger(session?.ownerTabId)) return false;

  const sessions = await getSdkInitializationSessions();
  await safeStorageSet({
    [SDK_INITIALIZED_SESSIONS_KEY]: {
      ...sessions,
      [String(session.ownerTabId)]: session,
    },
  });
  return true;
}

export async function removeSdkInitializationSession(tabId) {
  if (!Number.isInteger(tabId)) return false;

  const sessions = await getSdkInitializationSessions();
  const key = String(tabId);
  if (!sessions[key]) return false;

  const nextSessions = { ...sessions };
  delete nextSessions[key];
  await safeStorageSet({ [SDK_INITIALIZED_SESSIONS_KEY]: nextSessions });
  return true;
}

export async function clearSdkInitializationSessions() {
  await safeStorageRemove(SDK_INITIALIZED_SESSIONS_KEY);
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

export async function getSdkStartAttestationLockTabId() {
  const storage = await safeStorageGet(SDK_START_ATTESTATION_LOCK_TAB_ID_KEY);
  const tabId = storage?.[SDK_START_ATTESTATION_LOCK_TAB_ID_KEY];
  return Number.isInteger(tabId) ? tabId : null;
}

export async function clearSdkAttestationRuntimeStateUnlocked() {
  await clearSdkProofLifecycle({
    clearRuntime: () => safeStorageRemove(SDK_ATTESTATION_RUNTIME_STORAGE_KEYS),
    clearPreset: clearSdkAttestationPreset,
  });
  await clearSdkAttestationSession();
}

export async function clearSdkAttestationRuntimeState(afterClear) {
  await withSdkProofOwnershipLock(async () => {
    await clearSdkAttestationRuntimeStateUnlocked();
    await afterClear?.();
  });
}

export async function clearSdkAttestationAllState() {
  await withSdkProofOwnershipLock(async () => {
    await clearSdkFullLifecycle({
      clearRuntime: () => safeStorageRemove(SDK_ATTESTATION_RUNTIME_STORAGE_KEYS),
      clearPreset: clearSdkAttestationPreset,
      clearSession: async () => {
        await clearSdkAttestationSession();
        await clearSdkInitializationSessions();
      },
    });
  });
}
