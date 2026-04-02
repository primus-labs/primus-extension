/**
 * Attestation error codes and user-facing tip maps.
 * Used by algorithm and SDK attestation handlers for consistent error messaging.
 */

/** Target data missing - JSON path mismatch in response */
export const ERROR_TARGET_DATA_MISSING = '00013';
/** Request timed out (e.g. 2 minutes) */
export const ERROR_REQUEST_TIMEOUT = '00014';
/** User cancelled attestation */
export const ERROR_USER_CANCELLED = '00004';
/** Algorithm wrong parameters */
export const ERROR_ALGO_WRONG_PARAMS = '00001';
/** Too many requests */
export const ERROR_TOO_MANY_REQUESTS = '00000';
/** Linea event / attestation edge case */
export const ERROR_LINEA_EVENT = '00103';
/** Assets proof / Binance verification content */
export const ERROR_ASSETS_PROOF = '00102';
/** Generic attestation failure */
export const ERROR_ATTESTATION_FAILURE = '00104';
/** SSL certificate error */
export const ERROR_SSL_CERTIFICATE = '40002';
/** Unknown / fallback code for attest tip map */
export const ERROR_UNKNOWN = '99999';

/** SDK-level error codes and messages */
export const SDK_ERROR_TIPS = {
  '-1200010': 'Invalid message.',
  '-1002001': 'Invalid App ID.',
  '-1002002': 'Invalid App Secret.',
};

/** Primus Network / attester node error codes and messages */
export const PRIMUS_NETWORK_ERROR_TIPS = {
  '-500': 'Unexpected attester node program failure.',
  '-10100': 'Task cannot be executed again due to unexpected failure.',
  '-10101': 'This task has already been completed. No need to resubmit.',
  '-10102': 'This task is still in progress. No need to resubmit.',
  '-10103':
    'Submission limit reached for this task. Initiate a new task to continue.',
  '-10104':
    'Failed to get task details. Please check the attester node condition or task ID.',
  '-10105':
    'Invalid attestation parameters. Please check the connection between the node and the template server.',
  '-10106': 'Attestation template ID mismatch between task and attester node.',
  '-10107':
    'The user wallet address provided during attestation mismatch with submission.',
  '-10108': 'Invalid task ID. Please ensure the submitted ID matches the task.',
  '-10109': 'Task cannot be executed again. Please check your task fees.',
  '-10110':
    'Attester node mismatch. Ensure the node matches the task specification and resubmit.',
  '-10111': 'Task submitted past the allowed time limit (15 minutes).',
};

/** Subscription / quota error codes and messages */
export const SUBSCRIPTION_ERROR_TIPS = {
  '-1002003': 'Trial quota exhausted.',
  '-1002004': 'Subscription expired.',
  '-1002005': 'Quota exhausted.',
};

export const BNBZKIDSDK_ERROR_TIPS = {
  '-210001': 'Address has pending proof for identityPropertyId.'
}

/** Combined map for SDK + Primus Network + Subscription (for getErrorTipByRetcode) */
export const TOTAL_TIP_MAP = {
  ...SDK_ERROR_TIPS,
  ...PRIMUS_NETWORK_ERROR_TIPS,
  ...SUBSCRIPTION_ERROR_TIPS,
  ...BNBZKIDSDK_ERROR_TIPS,
};

/**
 * Get user-facing error message by error code and optional attest tip map.
 * @param {string} code - Error code (e.g. from extraData or details)
 * @param {{ attestTipMap?: Record<string, { type?: string; desc?: string; title?: string }> }} [context] - Optional attest tip map from config
 * @returns {{ type?: string; desc?: string; title?: string; sourcePageTip?: string } | string | undefined}
 */
export function getErrorMessage(code, context = {}) {
  const { attestTipMap = {} } = context;
  const tip = TOTAL_TIP_MAP[code] ?? attestTipMap[code];
  if (typeof tip === 'string') return tip;
  if (tip && typeof tip === 'object') return tip.desc ?? tip.title ?? tip.sourcePageTip;
  return undefined;
}
