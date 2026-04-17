/**
 * Error tip resolution for algorithm attestation results. Uses config/errorCodes and ATTESTATION_PROCESS_NOTE_V2 (merged map).
 */
import {
  TOTAL_TIP_MAP,
  ERROR_UNKNOWN,
} from '@/config/errorCodes';
import {
  getNoteV2Extension,
  getNoteV2Sdk,
} from '@/utils/attestationProcessNoteV2';

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
 * Get tip object from merged ATTESTATION_PROCESS_NOTE_V2 map. Fallback to ERROR_UNKNOWN for missing keys.
 * @param {string|number} code - Error or composite key (e.g. 30001 or "50000:501")
 * @param {import('@/utils/attestationProcessNoteV2').AttestationNoteV2Map} noteV2Map
 * @returns {{ desc: string; sourcePageTip: string; code?: string }}
 */
export function getAttestTipForCode(code, noteV2Map) {
  const key =
    code != null && code !== '' ? String(code) : ERROR_UNKNOWN;
  const desc = getNoteV2Sdk(
    noteV2Map,
    key,
    getNoteV2Sdk(noteV2Map, ERROR_UNKNOWN, '')
  );
  const sourcePageTip = getNoteV2Extension(
    noteV2Map,
    key,
    getNoteV2Extension(noteV2Map, ERROR_UNKNOWN, '')
  );
  return {
    desc,
    sourcePageTip,
    code: code != null && code !== '' ? `${code}` : '',
  };
}
