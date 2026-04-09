/**
 * PageDecode attestation popup constants: status, session keys, timing, error codes.
 * Centralizes magic strings to avoid typos and simplify maintenance.
 */

/** DOM id for the injected popup container */
export const CONTAINER_ID = 'pado-extension-content';

/** Data-source attestation template: force black (dark) modal chrome on the data source tab. */
export const PAGE_DECODE_BLACK_MODAL_TEMPLATE_ID =
  '2de562e4-d1b0-49c2-8cff-2fd229818392';

/**
 * Generic: path/query/hash contains these tokens as segments (after /, ?, or #).
 * Case-insensitive (href lowercased in index.jsx).
 */
export const DISABLED_PATH_SEGMENT_REGEX =
  /(?:^|[/?#])(?:login|register|signin|signup|forgotpassword|password_reset)(?:[/=?#]|$)/i;

/**
 * Amazon-only: full URL prefixes www.amazon.{host}/… — claim + CVF + account recovery collect-new-password.
 * Prefix match so query/hash after path still counts. Host suffix not hard-coded.
 */
export const DISABLED_AMAZON_URL_REGEX =
  /^https:\/\/www\.amazon\.[^/]+\/(?:ax\/claim|ap\/cvf\/(?:transactionapproval|approval|verify|request|accountrecovery\/collectnewpassword))/i;

/**
 * Steam-only: login help wizard + store mobile path. Prefix match (query/hash OK). href lowercased in index.jsx.
 */
export const DISABLED_STEAM_URL_REGEX =
  /^https:\/\/help\.steampowered\.com\/[^/]+\/wizard\/HelpWithLogin|^https:\/\/store\.steampowered\.com\/mobile/i;

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
