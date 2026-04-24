const packageJson = require('../../package.json');

export const padoExtensionVersion = packageJson.version;

/** Credential version used by algorithm/SDK params */
export const CredVersion = '1.0.5';

export const ONESECOND = 1000;
export const ONEMINUTE = 60 * ONESECOND;
export const STARTOFFLINETIMEOUT = 3 * ONEMINUTE + '';
export const DEFAULTFETCHTIMEOUT = 1 * ONEMINUTE;

/** PageDecode “verifying” hard timeout default + `attRequest.timeout` fallback baseline (ms). */
export const DEFAULT_PAGE_DECODE_VERIFY_MS = 2 * ONEMINUTE;

/** Session lock: owner dapp tab for the current startAttestation flow. */
export const SDK_START_ATTESTATION_LOCK_TAB_ID_KEY =
  'padoZKAttestationJSSDKStartAttestationLockTabId';

/** Session lock timestamp: set immediately when startAttestation is accepted. */
export const SDK_START_ATTESTATION_LOCK_STARTED_AT_KEY =
  'padoZKAttestationJSSDKStartAttestationLockStartedAt';

/** Unified lightweight SDK attestation session object key. */
export const SDK_ATTESTATION_SESSION_KEY = 'padoZKAttestationJSSDKSession';

/** Unified SDK attestation preset/context object key. */
export const SDK_ATTESTATION_PRESET_KEY = 'padoZKAttestationJSSDKPreset';

