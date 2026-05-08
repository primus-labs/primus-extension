/**
 * PageDecode attestation popup constants: status, session keys, timing, error codes.
 * Centralizes magic strings to avoid typos and simplify maintenance.
 */

import { DEFAULT_PAGE_DECODE_VERIFY_MS } from '@/config/constants';

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
  /(?:^|[/?#])(?:login|register|signin|signup|signon|signout|loginout|forgotpassword|password_reset)(?:[/=?#]|$)/i;

/**
 * Amazon-only: full URL prefixes www.amazon.{host} or amazon.{host} (optional www).
 * Covers claim, CVF, account recovery, and /ap/accountfixup paths.
 * Host TLD not hard-coded. Prefix match so query/hash after path still counts.
 */
export const DISABLED_AMAZON_URL_REGEX =
  /^https:\/\/(?:www\.)?amazon\.[^/]+\/(?:ax\/claim|ap\/cvf\/(?:transactionapproval|approval|verify|request|accountrecovery\/collectnewpassword)|ap\/accountfixup)/i;
/**
 * Steam-only: login help wizard + store mobile + store join. Prefix match (query/hash OK). href lowercased in index.jsx.
 */
export const DISABLED_STEAM_URL_REGEX =
  /^https:\/\/help\.steampowered\.com\/[^/]+\/wizard\/HelpWithLogin|^https:\/\/store\.steampowered\.com\/(?:mobile|join)/i;

/**
 * Special data-source entry URLs where the attestation card should be hidden (query is wildcard).
 * - Naver: https://nid.naver.com/nidlogin.login?...
 * - Apple Account / Sign in: https://appleid.apple.com/auth/authorize?client_id=...
 */
export const DISABLED_NAVER_URL_REGEX =
  /^https:\/\/(?:nid\.naver\.com\/nidlogin\.login|appleid\.apple\.com\/auth\/authorize)(?:\?.*|#.*|\/|$)/i;

/**
 * X (Twitter): hide card on SSO path ending with segment single_sign_on.
 * Prefix path is flexible (/i/flow/... optional): https://x.com/single_sign_on,
 * https://x.com/i/flow/single_sign_on, https://x.com/a/b/single_sign_on?...
 * Must match path segment single_sign_on exactly (not single_sign_on_foo).
 * href is lowercased before matching in index.jsx.
 */
export const DISABLED_X_FLOW_URL_REGEX =
  /^https:\/\/(?:www\.)?x\.com(?:\/.+)?\/single_sign_on(?:\/|[?#]|$)/i;

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
  RESULT_CLOSE_AT: 'padoAttestRequestResultCloseAt',
  READY: 'padoAttestRequestReady',
};

/** Timing defaults (ms) for uninitialized/initialized display and polling timeout */
export const TIMING = {
  DEFAULT_UNINIT_MS: 5000,
  DEFAULT_INIT_MS: 30000,
  POLLING_TIMEOUT_MS: DEFAULT_PAGE_DECODE_VERIFY_MS,
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
