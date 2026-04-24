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

