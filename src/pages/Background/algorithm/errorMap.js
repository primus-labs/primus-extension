/**
 * Error tip resolution for algorithm attestation results. Uses config/errorCodes and optional attest tip map.
 */
import {
  TOTAL_TIP_MAP,
  ERROR_UNKNOWN,
  ERROR_SSL_CERTIFICATE,
} from '@/config/errorCodes';

/**
 * Get user-facing tip string for an error code from extraData (SDK/Primus/subscription).
 * @param {string} [extraData] - JSON string with { errorCode }
 * @returns {string | undefined}
 */
export function getErrorTipByExtraData(extraData) {
  if (!extraData) return undefined;
  try {
    const parsed = JSON.parse(extraData);
    const code = parsed?.errorCode + '';
    return TOTAL_TIP_MAP[code];
  } catch {
    return undefined;
  }
}

/**
 * Get tip object from attest tip map (from config ATTESTATION_PROCESS_NOTE). Fallback to 99999 for unknown.
 * @param {string} code
 * @param {Record<string, { type?: string; desc?: string; title?: string }>} attestTipMap
 * @returns {{ type: string; desc: string; sourcePageTip: string; code?: string }}
 */
export function getAttestTipForCode(code, attestTipMap) {
  const codeTipObj = attestTipMap?.[code] || attestTipMap?.[ERROR_UNKNOWN] || {};
  return {
    type: codeTipObj.type ?? 'warn',
    desc: codeTipObj.desc ?? '',
    sourcePageTip:
      code === ERROR_SSL_CERTIFICATE ? 'SSLCertificateError' : (codeTipObj.title ?? ''),
    code: code ? `Error ${code}` : '',
  };
}
