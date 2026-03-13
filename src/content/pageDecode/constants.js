/**
 * PageDecode attestation popup constants: status, session keys, timing, error codes.
 * Centralizes magic strings to avoid typos and simplify maintenance.
 */

/** DOM id for the injected popup container */
export const CONTAINER_ID = 'pado-extension-content';

/** URL path segments that disable popup injection (e.g. login pages) */
export const DISABLED_PATH_LIST = ['login', 'register', 'signin', 'signup'];

/** Attestation UI status values */
export const STATUS = {
  UNINITIALIZED: 'uninitialized',
  INITIALIZED: 'initialized',
  VERIFYING: 'verifying',
  RESULT: 'result',
};

/** SessionStorage keys for attestation state sync */
export const SESSION_KEYS = {
  STATUS: 'padoAttestRequestStatus',
  RESULT_STATUS: 'padoAttestRequestResultStatus',
  ERROR_TXT: 'padoAttestRequestErrorTxt',
  READY: 'padoAttestRequestReady',
};

/** Timing defaults (ms) for uninitialized/initialized display and polling timeout */
export const TIMING = {
  DEFAULT_UNINIT_MS: 5000,
  DEFAULT_INIT_MS: 30000,
  POLLING_TIMEOUT_MS: 2 * 60 * 1000,
};

/** Error codes used in timeout/result handling */
export const ERROR_CODES = {
  TARGET_DATA_MISSING: '00013',
  REQUEST_TIMED_OUT: '00002',
};

/** Extension version for close/telemetry params (aligned with package.json) */
export const EXTENSION_VERSION = (() => {
  try {
    // eslint-disable-next-line global-require
    return require('../../../package.json').version;
  } catch (_e) {
    return '0.3.0';
  }
})();
