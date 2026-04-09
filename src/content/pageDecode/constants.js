/**
 * PageDecode attestation popup constants: status, session keys, timing, error codes.
 * Centralizes magic strings to avoid typos and simplify maintenance.
 */

/** DOM id for the injected popup container */
export const CONTAINER_ID = 'pado-extension-content';

/** Data-source attestation template: force black (dark) modal chrome on the data source tab. */
export const PAGE_DECODE_BLACK_MODAL_TEMPLATE_ID =
  '2de562e4-d1b0-49c2-8cff-2fd229818392';

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
  /** Auto-close data source tab after success; SDK tab stays open. */
  COUNTDOWN_SECONDS_SUCCESS: 3,
  /** Auto-close data source tab after failure; SDK tab stays open. */
  COUNTDOWN_SECONDS_ERROR: 5,
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
