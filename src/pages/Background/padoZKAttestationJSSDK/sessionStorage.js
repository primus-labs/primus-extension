import {
  SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
  SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
  SDK_ATTESTATION_PRESET_KEY,
  SDK_ATTESTATION_SESSION_KEY,
} from '@/config/constants';
import { safeStorageGet, safeStorageRemove, safeStorageSet } from '@/utils/safeStorage';
import { safeJsonParse } from '@/utils/utils';

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

export async function clearSdkAttestationRuntimeState() {
  await safeStorageRemove([
    SDK_START_ATTESTATION_LOCK_TAB_ID_KEY,
    SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY,
    'activeRequestAttestation',
  ]);
  await clearSdkAttestationSession();
  await clearSdkAttestationPreset();
}
